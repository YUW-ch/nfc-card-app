"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Wifi, Copy, Check } from "lucide-react";
import type { WifiContent } from "@/lib/page-content";

/** Escape special chars per the WIFI: QR spec. */
function escapeWifi(v: string): string {
  return v.replace(/([\\;,:"])/g, "\\$1");
}

export function WifiView({
  content,
  name,
}: {
  content: WifiContent;
  name: string;
}) {

  const ssid = content?.ssid || "";
  const encryption = content?.encryption || "WPA";
  const nopass = encryption === "nopass";
  const password = nopass ? "" : content?.password || "";
  const hidden = content?.hidden === true;

  const qrValue = `WIFI:T:${encryption};S:${escapeWifi(ssid)};${
    nopass ? "" : `P:${escapeWifi(password)};`
  }${hidden ? "H:true;" : ""};`;

  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div
        className="mb-4 flex size-16 items-center justify-center rounded-[var(--pt-card-radius)]"
        style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
      >
        <Wifi className="size-8" />
      </div>

      <p className="eyebrow opacity-50">Connect to Wi-Fi</p>
      <p className="display mt-1 text-3xl">{ssid || name}</p>

      {/* QR code */}
      {ssid ? (
        <div className="mt-8 rounded-[var(--pt-card-radius)] bg-white p-5 shadow-lg">
          <QRCodeCanvas
            value={qrValue}
            size={220}
            level="M"
            marginSize={1}
            fgColor="#14120f"
            bgColor="#ffffff"
          />
        </div>
      ) : (
        <p className="mt-8 opacity-60">Network not configured yet.</p>
      )}

      <p className="mt-6 max-w-xs text-sm opacity-60">
        Point your camera at the code to join instantly. No typing needed.
      </p>

      {/* Password */}
      {!nopass && password && (
        <div className="mt-6 w-full max-w-xs">
          <div className="rounded-[var(--pt-card-radius)] p-4" style={{ background: "var(--pt-surface)" }}>
            <p className="eyebrow text-left opacity-40">Password</p>
            <p className="mt-1 break-all text-left font-mono text-lg">{password}</p>
          </div>
          <button
            type="button"
            onClick={copyPassword}
            className="mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--pt-radius)] text-base font-semibold transition active:scale-[0.98]"
            style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
          >
            {copied ? <Check className="size-5" /> : <Copy className="size-5" />}
            {copied ? "Copied" : "Copy password"}
          </button>
        </div>
      )}

      {nopass && (
        <p className="mt-6 rounded-[var(--pt-radius)] px-4 py-2 text-sm font-medium opacity-70" style={{ background: "var(--pt-surface)" }}>
          Open network, no password required.
        </p>
      )}
    </div>
  );
}
