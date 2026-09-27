"use client";

import { Wifi, Smartphone } from "lucide-react";
import { Card, Field, Input, Select } from "@/components/ui";
import type { WifiContent } from "@/lib/page-content";

export function emptyWifiContent(): WifiContent {
  return { ssid: "", password: "", encryption: "WPA", hidden: false };
}

export function WifiBuilder({
  value,
  onChange,
}: {
  value: WifiContent;
  onChange: (next: WifiContent) => void;
}) {
  const set = <K extends keyof WifiContent>(key: K, v: WifiContent[K]) =>
    onChange({ ...value, [key]: v });

  const needsPassword = value.encryption !== "nopass";
  const hidden = value.hidden ?? false;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Wifi className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Wifi network</p>
            <p className="text-xs text-muted">Guests connect with a single tap.</p>
          </div>
        </div>

        <Field label="Network name (SSID)">
          <Input
            placeholder="Cafe Guest"
            value={value.ssid ?? ""}
            onChange={(e) => set("ssid", e.target.value)}
          />
        </Field>

        <Field label="Security">
          <Select
            value={value.encryption ?? "WPA"}
            onChange={(e) => set("encryption", e.target.value as WifiContent["encryption"])}
          >
            <option value="WPA">WPA / WPA2 / WPA3</option>
            <option value="WEP">WEP</option>
            <option value="nopass">Open (no password)</option>
          </Select>
        </Field>

        {needsPassword && (
          <Field label="Password">
            <Input
              placeholder="••••••••"
              value={value.password ?? ""}
              onChange={(e) => set("password", e.target.value)}
            />
          </Field>
        )}

        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-ink">Hidden network</span>
            <span className="block text-xs text-muted">
              Enable only if your network does not broadcast its name.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={hidden}
            onClick={() => set("hidden", !hidden)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              hidden ? "bg-accent" : "bg-ink/15"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
                hidden ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      </Card>

      <div className="flex items-start gap-3 rounded-card border border-line bg-paper/40 p-4 text-sm text-muted">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Customers join by tapping the card. Their phone reads the network and offers to connect,
          no typing needed.
        </p>
      </div>
    </div>
  );
}
