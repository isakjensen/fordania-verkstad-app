/*
 * Genererar PWA-ikoner till public/ från Fordania-monogrammet ("F" på
 * varumärkesblått). Renderas med system-Edge via playwright-core (samma
 * ansats som .screenshots/shot.mjs) så vi slipper bild-beroenden.
 *
 * Kör: node scripts/gen-icons.mjs
 */
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public");
const BRAND = "#1a64bd";

function html({ size, radius, bg, fontScale }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:transparent}
    .tile{
      width:${size}px;height:${size}px;box-sizing:border-box;
      display:flex;align-items:center;justify-content:center;
      background:${bg};border-radius:${radius}px;
      font-family:Arial,Helvetica,sans-serif;font-weight:800;color:#fff;
      font-size:${Math.round(size * fontScale)}px;line-height:1;letter-spacing:-0.03em;
    }
  </style></head><body><div class="tile">F</div></body></html>`;
}

// omit=true → transparent bakgrund runt den rundade brickan (vanliga ikoner).
// omit=false → helt fylld yta (maskable + apple-touch, som beskärs av OS).
const targets = [
  { file: "icon-192.png", size: 192, radius: 42, bg: BRAND, fontScale: 0.6, omit: true },
  { file: "icon-512.png", size: 512, radius: 112, bg: BRAND, fontScale: 0.6, omit: true },
  { file: "icon-maskable-512.png", size: 512, radius: 0, bg: BRAND, fontScale: 0.5, omit: false },
  { file: "apple-touch-icon.png", size: 180, radius: 0, bg: BRAND, fontScale: 0.6, omit: false },
];

const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const t of targets) {
    const page = await browser.newPage({
      viewport: { width: t.size, height: t.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(html(t), { waitUntil: "load" });
    const el = await page.$(".tile");
    await el.screenshot({
      path: path.join(outDir, t.file),
      omitBackground: t.omit,
    });
    await page.close();
    console.log("OK:", t.file);
  }
} finally {
  await browser.close();
}
