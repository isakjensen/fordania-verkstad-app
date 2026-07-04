"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X, Camera, Info } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  AttachmentGallery,
  type AttachmentImage,
} from "@/components/attachments/attachment-gallery";
import { uploadWorkOrderImage, deleteWorkOrderImage } from "./actions";

interface JobVehicle {
  id: string;
  regNo: string;
  brand: string | null;
  model: string | null;
}

export function WorkOrderImages({
  jobId,
  images,
  vehicles,
}: {
  jobId: string;
  images: AttachmentImage[];
  vehicles: JobVehicle[];
}) {
  const allIds = vehicles.map((v) => v.id);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [selected, setSelected] = useState<string[]>(allIds);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  function clearPick() {
    setFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  function toggleVehicle(id: string) {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Välj en bild först.");
      return;
    }
    setError("");
    startTransition(async () => {
      // Komprimera i klienten så uppladdningen blir liten och EXIF-rotation
      // bränns in. Faller tillbaka på originalfilen om det inte går.
      let blob: Blob = file;
      let name = file.name || "bild.jpg";
      try {
        const compressed = await compressImage(file);
        if (compressed) {
          blob = compressed;
          name = name.replace(/\.[^.]+$/, "") + ".jpg";
        }
      } catch {
        // behåll original
      }

      const fd = new FormData();
      fd.set("jobId", jobId);
      fd.set("file", blob, name);
      fd.set("fileName", name);
      if (caption.trim()) fd.set("caption", caption.trim());
      const vids = selected.length ? selected : allIds;
      for (const id of vids) fd.append("vehicleIds", id);

      const res = await uploadWorkOrderImage(fd);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      clearPick();
      setCaption("");
      setSelected(allIds);
      router.refresh();
    });
  }

  async function remove(id: string) {
    const res = await deleteWorkOrderImage(id);
    if ("error" in res) return { error: res.error };
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        tone="brand"
        title="Bilder"
        subtitle={`${images.length} ${images.length === 1 ? "bild" : "bilder"}`}
      />
      <CardBody className="space-y-4">
        <AttachmentGallery
          images={images}
          emptyText="Inga bilder uppladdade på arbetsordern ännu."
          showWorkOrderLink={false}
          onDelete={remove}
        />

        {/* Ladda upp */}
        <form
          onSubmit={submit}
          className="space-y-3 border-t border-line pt-4"
        >
          {preview ? (
            <div className="relative w-fit">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Förhandsvisning"
                className="h-32 w-32 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={clearPick}
                aria-label="Ta bort vald bild"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-white shadow-soft hover:bg-ink/90"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-muted/40 px-4 py-8 text-sm text-muted-foreground transition-colors hover:bg-surface-muted"
            >
              <Camera className="size-6" />
              <span className="font-medium text-ink">Välj eller ta en bild</span>
              <span className="text-xs">JPEG, PNG eller WebP</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={pick}
            className="hidden"
          />

          {/* Vilka fordon bilden avser */}
          {vehicles.length > 0 ? (
            <div className="space-y-1.5">
              <Label>Bilden avser</Label>
              <div className="flex flex-wrap gap-2">
                {vehicles.map((v) => {
                  const on = selected.includes(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVehicle(v.id)}
                      aria-pressed={on}
                      className={cn(
                        "rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors pointer-coarse:py-2",
                        on
                          ? "border-brand-300 bg-brand-50 text-brand-700"
                          : "border-line bg-surface text-ink-soft hover:bg-surface-muted",
                      )}
                    >
                      <span className="font-mono font-semibold">{v.regNo}</span>
                      {v.brand || v.model ? (
                        <span className="ml-1.5 text-muted-foreground">
                          {[v.brand, v.model].filter(Boolean).join(" ")}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Koppla ett fordon till arbetsordern för att bilden ska synas som
              bilaga på fordons- och kundprofilen.
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="img-caption">Bildtext (valfritt)</Label>
            <Input
              id="img-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="t.ex. Skada höger framskärm"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={pending || !file}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              Ladda upp bild
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

/**
 * Skalar ned en bild till max 1600px längsta sidan och exporterar som JPEG.
 * Använder createImageBitmap med `from-image` så telefonbilders EXIF-rotation
 * bränns in. Returnerar null om webbläsaren inte stödjer det (då används
 * originalfilen).
 */
async function compressImage(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<Blob | null> {
  if (
    typeof createImageBitmap !== "function" ||
    !file.type.startsWith("image/")
  ) {
    return null;
  }
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
  );
}
