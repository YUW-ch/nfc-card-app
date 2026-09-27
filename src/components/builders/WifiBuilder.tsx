"use client";

import { Wifi, Smartphone, MailCheck } from "lucide-react";
import { Card, Field, Input, Select } from "@/components/ui";
import type { WifiAccessMode, WifiContent, WifiGuestAccess } from "@/lib/page-content";

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
  const access: WifiGuestAccess = value.guestAccess ?? {};
  const mode: WifiAccessMode = access.mode ?? "open";
  const setAccess = (patch: WifiGuestAccess) =>
    onChange({ ...value, guestAccess: { ...access, ...patch } });

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

        <Toggle
          label="Hidden network"
          hint="Enable only if your network does not broadcast its name."
          checked={hidden}
          onChange={(v) => set("hidden", v)}
        />
      </Card>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MailCheck className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Guest access</p>
            <p className="text-xs text-muted">Ask guests for their email before they get the password.</p>
          </div>
        </div>

        <Field label="Who gets the password">
          <Select
            value={mode}
            onChange={(e) => setAccess({ mode: e.target.value as WifiAccessMode })}
          >
            <option value="open">Everyone who taps the card</option>
            <option value="email">Guests who enter their email</option>
            <option value="verify">Guests who confirm their email with a code</option>
          </Select>
        </Field>

        {mode !== "open" && (
          <>
            <Toggle
              label="Ask for marketing consent"
              hint="Adds an unticked checkbox so guests can agree to receive news and offers by email."
              checked={access.marketing ?? false}
              onChange={(v) => setAccess({ marketing: v })}
            />
            <Field label="Privacy policy link" hint="Your own privacy policy. Linked from the privacy note.">
              <Input
                type="url"
                placeholder="https://your-restaurant.ch/privacy"
                value={access.privacyUrl ?? ""}
                onChange={(e) => setAccess({ privacyUrl: e.target.value })}
              />
            </Field>
            <Field
              label="Privacy contact email"
              hint="Guests write here to withdraw consent or have their data deleted."
            >
              <Input
                type="email"
                placeholder="privacy@your-restaurant.ch"
                value={access.contactEmail ?? ""}
                onChange={(e) => setAccess({ contactEmail: e.target.value })}
              />
            </Field>
            <p className="rounded-card bg-paper/60 p-3 text-xs leading-relaxed text-muted">
              Guests see a privacy note in their language: your business uses the email for Wi-Fi
              access{access.marketing ? " and, only if they tick the box, for news and offers" : ""},
              Taplino processes it on your behalf, and addresses without marketing consent are
              deleted 12 months after the last visit. You find the guest list below the editor.
            </p>
          </>
        )}
      </Card>

      <div className="flex items-start gap-3 rounded-card border border-line bg-paper/40 p-4 text-sm text-muted">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" />
        <p>
          Guests tap the card and land on this page. iPhones join with one button (a Wi-Fi profile),
          Android phones copy the password in one tap.
        </p>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-accent" : "bg-ink/15"
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
