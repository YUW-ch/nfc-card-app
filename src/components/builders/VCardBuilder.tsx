"use client";

import { Plus, Trash2, User, Phone, Mail, Share2 } from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import type { VCardContent } from "@/lib/page-content";

const SOCIAL_PLATFORMS = ["instagram", "tiktok", "facebook", "x", "youtube", "website"] as const;

export function emptyVCardContent(): VCardContent {
  return {
    firstName: "",
    lastName: "",
    phones: [],
    emails: [],
    socials: [],
  };
}

export function VCardBuilder({
  value,
  onChange,
}: {
  value: VCardContent;
  onChange: (next: VCardContent) => void;
}) {
  const set = <K extends keyof VCardContent>(key: K, v: VCardContent[K]) =>
    onChange({ ...value, [key]: v });

  const phones = value.phones ?? [];
  const emails = value.emails ?? [];
  const socials = value.socials ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <User className="size-4" />
          </span>
          <p className="display text-lg text-ink">Contact</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <Input
              value={value.firstName ?? ""}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </Field>
          <Field label="Last name">
            <Input value={value.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
          <Field label="Organisation">
            <Input
              placeholder="Taplino AG"
              value={value.org ?? ""}
              onChange={(e) => set("org", e.target.value)}
            />
          </Field>
          <Field label="Title">
            <Input
              placeholder="Founder"
              value={value.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Website">
          <Input
            type="url"
            placeholder="https://…"
            value={value.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
          />
        </Field>

        <Field label="Address">
          <Input
            placeholder="Bahnhofstrasse 1, 8001 Zürich"
            value={value.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
          />
        </Field>
      </Card>

      {/* Phones */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Phone className="size-4" />
            </span>
            <p className="display text-lg text-ink">Phone numbers</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => set("phones", [...phones, { label: "Mobile", number: "" }])}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {phones.length === 0 && <p className="text-sm text-muted">No phone numbers yet.</p>}
        {phones.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Label" className="w-28 shrink-0">
              <Input
                value={p.label}
                onChange={(e) =>
                  set(
                    "phones",
                    phones.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <Field label="Number" className="flex-1">
              <Input
                type="tel"
                placeholder="+41 79 …"
                value={p.number}
                onChange={(e) =>
                  set(
                    "phones",
                    phones.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <button
              type="button"
              aria-label="Remove phone"
              onClick={() => set("phones", phones.filter((_, j) => j !== i))}
              className="mb-1.5 rounded-full p-2.5 text-muted transition hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </Card>

      {/* Emails */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Mail className="size-4" />
            </span>
            <p className="display text-lg text-ink">Emails</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => set("emails", [...emails, { label: "Work", address: "" }])}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {emails.length === 0 && <p className="text-sm text-muted">No emails yet.</p>}
        {emails.map((m, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Label" className="w-28 shrink-0">
              <Input
                value={m.label}
                onChange={(e) =>
                  set(
                    "emails",
                    emails.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <Field label="Address" className="flex-1">
              <Input
                type="email"
                placeholder="name@business.ch"
                value={m.address}
                onChange={(e) =>
                  set(
                    "emails",
                    emails.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <button
              type="button"
              aria-label="Remove email"
              onClick={() => set("emails", emails.filter((_, j) => j !== i))}
              className="mb-1.5 rounded-full p-2.5 text-muted transition hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </Card>

      {/* Socials */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Share2 className="size-4" />
            </span>
            <p className="display text-lg text-ink">Social links</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => set("socials", [...socials, { platform: "instagram", url: "" }])}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {socials.length === 0 && <p className="text-sm text-muted">No social links yet.</p>}
        {socials.map((s, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Platform" className="w-36 shrink-0">
              <Select
                value={s.platform}
                onChange={(e) =>
                  set(
                    "socials",
                    socials.map((x, j) =>
                      j === i ? { ...x, platform: e.target.value } : x,
                    ),
                  )
                }
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="URL" className="flex-1">
              <Input
                type="url"
                placeholder="https://…"
                value={s.url}
                onChange={(e) =>
                  set(
                    "socials",
                    socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <button
              type="button"
              aria-label="Remove social"
              onClick={() =>
                set(
                  "socials",
                  socials.filter((_, j) => j !== i),
                )
              }
              className="mb-1.5 rounded-full p-2.5 text-muted transition hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}
