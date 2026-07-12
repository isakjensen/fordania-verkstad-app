/**
 * ALPR-motor (Automatic License Plate Recognition) som körs helt i
 * webbläsaren via onnxruntime-web (WASM). Två steg, precis som riktiga
 * ALPR-system:
 *
 *   1. Detektor  – YOLOv9-t (384px) hittar OCH beskär plåten i bilden.
 *   2. OCR       – CCT-modell (fast-plate-ocr) läser tecknen i beskärningen.
 *
 * Båda modellerna laddas dynamiskt först när skanning faktiskt startar, så
 * sidan förblir lätt. Efter första nedladdningen cachas de av webbläsaren
 * och allt fungerar offline.
 *
 * Modellerna kommer från MIT-licensierade fast-alpr / open-image-models /
 * fast-plate-ocr. OCR-modellen (cct_s_v2_global) är tränad på bl.a. svenska
 * skyltar, vilket gör den lämplig här.
 *
 * Verifierade in-/utdatakontrakt (se scripts/inspect-onnx.mjs):
 *   Detektor: input "images" float32 [1,3,384,384] (NCHW, RGB, /255).
 *             output "output0" float32 [N,7] per träff:
 *             [batchIdx, x1, y1, x2, y2, classId, score] i 384px-rymden.
 *             NMS är inbakad i grafen.
 *   OCR:      input "input" uint8 [1,64,128,3] (NHWC, RGB, rå 0–255).
 *             output "plate" float32 [1,10,37] – softmax per plats över
 *             alfabetet nedan. output "region" float32 [1,66] (används ej).
 */

import type {
  InferenceSession,
  Tensor as OrtTensor,
} from "onnxruntime-web";

const DETECTOR_URL = "/models/plate-detector.onnx";
const OCR_URL = "/models/plate-ocr.onnx";

const DET_SIZE = 384; // Detektorns kvadratiska indata.
const OCR_W = 128;
const OCR_H = 64;

/** Alfabet från cct_s_v2_global_plate_config.yaml. Index 36 = utfyllnad. */
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_";
const PAD_CHAR = "_";
const OCR_SLOTS = 10;
const OCR_CLASSES = ALPHABET.length; // 37

/** En detekterad skylt i källbildens pixelkoordinater. */
export interface PlateBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
}

/** Resultatet av att läsa en beskuren skylt. */
export interface PlateReading {
  /** Rå avläst text (redan begränsad till A–Z0–9). */
  text: string;
  /** Genomsnittlig teckensäkerhet 0–1 för de icke-utfyllda platserna. */
  score: number;
  /** Detektorns box i källbilden. */
  box: PlateBox;
}

type Source = HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

let ortPromise: Promise<typeof import("onnxruntime-web")> | null = null;
let detectorPromise: Promise<InferenceSession> | null = null;
let ocrPromise: Promise<InferenceSession> | null = null;

/** Laddar onnxruntime-web en gång och konfigurerar WASM-backend. */
function loadOrt() {
  if (!ortPromise) {
    ortPromise = import("onnxruntime-web").then((ort) => {
      // Servera WASM-filerna från /public/ort. Enkeltrådat undviker kravet
      // på cross-origin-isolering (SharedArrayBuffer) – fungerar överallt,
      // och modellerna är små nog att ändå vara snabba.
      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = 1;
      return ort;
    });
  }
  return ortPromise;
}

function getDetector(): Promise<InferenceSession> {
  if (!detectorPromise) {
    detectorPromise = loadOrt().then((ort) =>
      ort.InferenceSession.create(DETECTOR_URL, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      }),
    );
  }
  return detectorPromise;
}

function getOcr(): Promise<InferenceSession> {
  if (!ocrPromise) {
    ocrPromise = loadOrt().then((ort) =>
      ort.InferenceSession.create(OCR_URL, {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      }),
    );
  }
  return ocrPromise;
}

/**
 * Laddar båda modellerna och kör en tom inferens så att första riktiga
 * skanningen inte blir långsam. Säkert att anropa flera gånger.
 */
export async function warmUpPlateReader(): Promise<void> {
  const ort = await loadOrt();
  const [detector, ocr] = await Promise.all([getDetector(), getOcr()]);
  const detInput = new ort.Tensor(
    "float32",
    new Float32Array(3 * DET_SIZE * DET_SIZE),
    [1, 3, DET_SIZE, DET_SIZE],
  );
  const ocrInput = new ort.Tensor(
    "uint8",
    new Uint8Array(OCR_H * OCR_W * 3),
    [1, OCR_H, OCR_W, 3],
  );
  await detector.run({ [detector.inputNames[0]]: detInput });
  await ocr.run({ [ocr.inputNames[0]]: ocrInput });
}

function sourceSize(source: Source): { w: number; h: number } {
  if (source instanceof HTMLVideoElement) {
    return { w: source.videoWidth, h: source.videoHeight };
  }
  return { w: source.width, h: source.height };
}

// Återanvända canvasar mellan bildrutor (skapa inte nya varje gång).
let detCanvas: HTMLCanvasElement | null = null;
let cropCanvas: HTMLCanvasElement | null = null;

function scratch(which: "det" | "crop"): HTMLCanvasElement {
  if (which === "det") {
    if (!detCanvas) {
      detCanvas = document.createElement("canvas");
      detCanvas.width = DET_SIZE;
      detCanvas.height = DET_SIZE;
    }
    return detCanvas;
  }
  if (!cropCanvas) {
    cropCanvas = document.createElement("canvas");
    cropCanvas.width = OCR_W;
    cropCanvas.height = OCR_H;
  }
  return cropCanvas;
}

interface Letterbox {
  scale: number;
  padX: number;
  padY: number;
}

/**
 * Ritar källbilden i en 384×384-canvas med bevarat bildförhållande (grå
 * utfyllnad), som YOLO-modellen förväntar sig, och returnerar float32 NCHW
 * normaliserad till 0–1 samt letterbox-parametrarna för att kunna mappa
 * tillbaka koordinaterna.
 */
function detectorInput(source: Source): {
  data: Float32Array;
  box: Letterbox;
} {
  const { w: sw, h: sh } = sourceSize(source);
  const scale = Math.min(DET_SIZE / sw, DET_SIZE / sh);
  const newW = Math.round(sw * scale);
  const newH = Math.round(sh * scale);
  const padX = Math.floor((DET_SIZE - newW) / 2);
  const padY = Math.floor((DET_SIZE - newH) / 2);

  const canvas = scratch("det");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "rgb(114,114,114)";
  ctx.fillRect(0, 0, DET_SIZE, DET_SIZE);
  ctx.drawImage(source, padX, padY, newW, newH);

  const { data: px } = ctx.getImageData(0, 0, DET_SIZE, DET_SIZE);
  const area = DET_SIZE * DET_SIZE;
  const out = new Float32Array(3 * area);
  // RGBA (HWC) -> planar CHW, /255.
  for (let i = 0; i < area; i++) {
    const p = i * 4;
    out[i] = px[p] / 255; // R-plan
    out[area + i] = px[p + 1] / 255; // G-plan
    out[2 * area + i] = px[p + 2] / 255; // B-plan
  }
  return { data: out, box: { scale, padX, padY } };
}

/** Läser detektorns [N,7]-utdata till boxar i källbildens koordinater. */
function parseDetections(
  tensor: OrtTensor,
  box: Letterbox,
  src: { w: number; h: number },
  minScore: number,
): PlateBox[] {
  const data = tensor.data as Float32Array;
  const dims = tensor.dims;
  const rows = dims[0];
  const cols = dims[1] ?? 7;
  const boxes: PlateBox[] = [];
  for (let r = 0; r < rows; r++) {
    const o = r * cols;
    // [batchIdx, x1, y1, x2, y2, classId, score]
    const score = data[o + 6];
    if (score < minScore) continue;
    const x1 = (data[o + 1] - box.padX) / box.scale;
    const y1 = (data[o + 2] - box.padY) / box.scale;
    const x2 = (data[o + 3] - box.padX) / box.scale;
    const y2 = (data[o + 4] - box.padY) / box.scale;
    boxes.push({
      x1: Math.max(0, Math.min(src.w, x1)),
      y1: Math.max(0, Math.min(src.h, y1)),
      x2: Math.max(0, Math.min(src.w, x2)),
      y2: Math.max(0, Math.min(src.h, y2)),
      score,
    });
  }
  boxes.sort((a, b) => b.score - a.score);
  return boxes;
}

/** Bygger OCR-indata (uint8 NHWC) från en beskuren skyltyta i källbilden. */
function ocrInputFromCrop(source: Source, b: PlateBox): OrtInputData {
  // Lite marginal runt boxen ger OCR:n hela skylten även om detektorn
  // beskär snävt.
  const padX = (b.x2 - b.x1) * 0.06;
  const padY = (b.y2 - b.y1) * 0.12;
  const { w: sw, h: sh } = sourceSize(source);
  const sx = Math.max(0, b.x1 - padX);
  const sy = Math.max(0, b.y1 - padY);
  const sWidth = Math.min(sw - sx, b.x2 - b.x1 + padX * 2);
  const sHeight = Math.min(sh - sy, b.y2 - b.y1 + padY * 2);

  const canvas = scratch("crop");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, OCR_W, OCR_H);
  const { data: px } = ctx.getImageData(0, 0, OCR_W, OCR_H);

  const out = new Uint8Array(OCR_H * OCR_W * 3);
  for (let i = 0; i < OCR_H * OCR_W; i++) {
    const p = i * 4;
    out[i * 3] = px[p];
    out[i * 3 + 1] = px[p + 1];
    out[i * 3 + 2] = px[p + 2];
  }
  return out;
}

type OrtInputData = Uint8Array;

/** Argmax-avkodar OCR-utdata [1,10,37] till text + medelsäkerhet. */
function decodeOcr(tensor: OrtTensor): { text: string; score: number } {
  const data = tensor.data as Float32Array;
  let text = "";
  let scoreSum = 0;
  let counted = 0;
  for (let slot = 0; slot < OCR_SLOTS; slot++) {
    let best = 0;
    let bestIdx = 0;
    for (let c = 0; c < OCR_CLASSES; c++) {
      const v = data[slot * OCR_CLASSES + c];
      if (v > best) {
        best = v;
        bestIdx = c;
      }
    }
    const ch = ALPHABET[bestIdx];
    if (ch === PAD_CHAR) continue;
    text += ch;
    scoreSum += best;
    counted++;
  }
  return { text, score: counted ? scoreSum / counted : 0 };
}

/**
 * Kör hela pipelinen på en bildruta: detektera skylt → beskär → läs tecken.
 * Returnerar bästa avläsningen, eller null om ingen skylt hittades med
 * tillräcklig säkerhet.
 */
export async function scanFrame(
  source: Source,
  opts: { minDetectionScore?: number } = {},
): Promise<PlateReading | null> {
  const minScore = opts.minDetectionScore ?? 0.4;
  const ort = await loadOrt();
  const { w: sw, h: sh } = sourceSize(source);
  if (!sw || !sh) return null;

  const detector = await getDetector();
  const { data, box } = detectorInput(source);
  const detOut = await detector.run({
    [detector.inputNames[0]]: new ort.Tensor("float32", data, [
      1,
      3,
      DET_SIZE,
      DET_SIZE,
    ]),
  });
  const boxes = parseDetections(
    detOut[detector.outputNames[0]],
    box,
    { w: sw, h: sh },
    minScore,
  );
  if (boxes.length === 0) return null;

  const best = boxes[0];
  const ocr = await getOcr();
  const ocrData = ocrInputFromCrop(source, best);
  const ocrOut = await ocr.run({
    [ocr.inputNames[0]]: new ort.Tensor("uint8", ocrData, [1, OCR_H, OCR_W, 3]),
  });
  const { text, score } = decodeOcr(ocrOut[ocr.outputNames[0]]);
  if (!text) return null;

  return { text, score, box: best };
}
