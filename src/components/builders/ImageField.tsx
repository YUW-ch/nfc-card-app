"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useBuilderServices } from "./host";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

/**
 * Shrink an image in the browser before upload: at most `maxSide` px on the
 * long edge, WebP (keeps logo transparency). Falls back to the original file
 * when it is already small or the browser cannot re-encode it.
 */
async function prepareImage(file: File, maxSide: number): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    // Some browsers ignore the WebP request and return PNG; keep whichever is smaller.
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/**
 * Upload (or, without an uploader, paste a link to) one image. Shows a
 * preview with Replace and Remove.
 */
export function ImageField({
  value,
  onChange,
  maxSide = 1600,
  shape = "wide",
  label = "Upload image",
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Long edge in px after resizing. */
  maxSide?: number;
  /** Preview shape: logos stay contained, covers and photos fill. */
  shape?: "logo" | "wide" | "square";
  label?: string;
}) {
  const { uploadImage } = useBuilderServices();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File | undefined) {
    if (!file || !uploadImage) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(await prepareImage(file, maxSide)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, please try again");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  if (!uploadImage) {
    return (
      <Input
        type="url"
        placeholder="https://…/image.jpg"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-[repeating-conic-gradient(#0000000d_0_25%,transparent_0_50%)] bg-[length:16px_16px]",
              shape === "wide" ? "h-16 w-28" : "size-16",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className={cn("size-full", shape === "logo" ? "object-contain p-1" : "object-cover")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={busy}
              onClick={() => input.current?.click()}
            >
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 text-sm font-semibold text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
        >
          <ImagePlus className="size-5" />
          {busy ? "Uploading…" : label}
        </button>
      )}
      {error && <span className="text-xs text-negative">{error}</span>}
    </div>
  );
}
