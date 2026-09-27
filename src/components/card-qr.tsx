"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

/** Renders a QR code for a public tap URL with a copy-link button. */
export function CardQR({
  url,
  size = 176,
  className,
}: {
  url: string;
  size?: number;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be unavailable (insecure context); silently ignore.
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="rounded-card border border-line bg-white p-4">
        <QRCodeCanvas
          value={url}
          size={size}
          marginSize={2}
          fgColor="#14120f"
          bgColor="#ffffff"
          level="M"
        />
      </div>
      <div className="flex w-full items-center gap-2">
        <span className="min-w-0 flex-1 truncate rounded-2xl border border-line bg-paper/40 px-3 py-2 text-xs text-muted">
          {url}
        </span>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
