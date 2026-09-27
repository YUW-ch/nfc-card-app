"use client";

import { Star, Sparkles } from "lucide-react";
import { Card, Field, Input, Select } from "@/components/ui";
import type { ReviewContent } from "@/lib/page-content";

/** Sensible defaults for a freshly created review page. */
export function emptyReviewContent(): ReviewContent {
  return { provider: "google", reviewUrl: "", threshold: 4, collectNegativeInternally: false };
}

export function ReviewBuilder({
  value,
  onChange,
}: {
  value: ReviewContent;
  onChange: (next: ReviewContent) => void;
}) {
  const set = <K extends keyof ReviewContent>(key: K, v: ReviewContent[K]) =>
    onChange({ ...value, [key]: v });

  const smart = value.collectNegativeInternally ?? false;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Star className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Google review</p>
            <p className="text-xs text-muted">Where happy customers land to leave a rating.</p>
          </div>
        </div>

        <Field
          label="Google review link"
          hint="The direct 'Write a review' URL for your business."
        >
          <Input
            type="url"
            inputMode="url"
            placeholder="https://g.page/r/…/review"
            value={value.reviewUrl ?? ""}
            onChange={(e) => set("reviewUrl", e.target.value)}
          />
        </Field>

        <Field label="Google Place ID" hint="Optional. Helps us verify the business.">
          <Input
            placeholder="ChIJ…"
            value={value.placeId ?? ""}
            onChange={(e) => set("placeId", e.target.value)}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="display text-lg text-ink">Smart routing</p>
              <p className="text-xs text-muted">
                Send high ratings to Google, keep low ratings private.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={smart}
            onClick={() => set("collectNegativeInternally", !smart)}
            className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
              smart ? "bg-accent" : "bg-ink/15"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
                smart ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {smart && (
          <div className="flex flex-col gap-5 border-t border-line pt-5">
            <Field
              label="Send to Google from"
              hint="Ratings at or above this go straight to Google. Lower ratings are captured privately."
            >
              <Select
                value={String(value.threshold ?? 4)}
                onChange={(e) => set("threshold", Number(e.target.value))}
              >
                <option value="3">3 stars and up</option>
                <option value="4">4 stars and up</option>
                <option value="5">5 stars only</option>
              </Select>
            </Field>

            <Field
              label="Feedback email"
              hint="Private feedback from lower ratings is sent here."
            >
              <Input
                type="email"
                inputMode="email"
                placeholder="feedback@yourbusiness.ch"
                value={value.feedbackEmail ?? ""}
                onChange={(e) => set("feedbackEmail", e.target.value)}
              />
            </Field>
          </div>
        )}
      </Card>
    </div>
  );
}
