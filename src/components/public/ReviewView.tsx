"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import type { ReviewContent, PageTheme } from "@/lib/types";
import { DEFAULT_BRAND, readableOn } from "./PublicShell";

function Stars({
  value,
  onPick,
  interactive,
}: {
  value: number;
  onPick?: (n: number) => void;
  interactive: boolean;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-center gap-2">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={!interactive}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => onPick?.(n)}
            onMouseEnter={() => interactive && setHover(n)}
            onMouseLeave={() => interactive && setHover(0)}
            className="flex min-h-[52px] min-w-[52px] items-center justify-center transition-transform active:scale-90"
          >
            <Star
              className="size-11"
              strokeWidth={1.5}
              style={{
                color: filled ? "#f5a623" : "rgba(20,18,15,0.2)",
                fill: filled ? "#f5a623" : "transparent",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewView({
  content,
  name,
  theme,
}: {
  content: ReviewContent;
  name: string;
  theme?: PageTheme;
}) {
  const brand = theme?.brandColor || DEFAULT_BRAND;
  const onBrand = readableOn(brand);
  const reviewUrl = content?.reviewUrl;
  const threshold = content?.threshold ?? 4;
  const smart = content?.collectNegativeInternally === true;

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [sent, setSent] = useState(false);

  function handlePick(n: number) {
    setRating(n);
    if (n >= threshold) {
      if (reviewUrl) window.location.href = reviewUrl;
    }
  }

  function submitFeedback() {
    const email = content?.feedbackEmail;
    if (email) {
      const subject = encodeURIComponent(`Feedback for ${name}`);
      const body = encodeURIComponent(`Rating: ${rating}/5\n\n${feedback}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
    setSent(true);
  }

  const heading = theme?.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={theme.logoUrl}
      alt={name}
      className="mx-auto mb-6 max-h-20 w-auto object-contain"
    />
  ) : (
    <p className="display mb-2 text-3xl">{name}</p>
  );

  // ── Smart routing off: straight to Google review ──
  if (!smart) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        {heading}
        <div className="mb-8 mt-4 flex items-center justify-center gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-8" style={{ color: "#f5a623", fill: "#f5a623" }} />
          ))}
        </div>
        <p className="mb-8 max-w-xs text-base opacity-70">
          Enjoyed your visit? A quick review means the world to us.
        </p>
        <a
          href={reviewUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-full px-6 text-lg font-semibold shadow-lg transition active:scale-[0.98]"
          style={{ background: brand, color: onBrand }}
        >
          Leave us a Google review
        </a>
      </div>
    );
  }

  // ── Smart routing on ──
  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <CheckCircle2 className="mb-5 size-16" style={{ color: brand }} strokeWidth={1.5} />
        <p className="display text-2xl">Thank you</p>
        <p className="mt-2 max-w-xs text-base opacity-70">
          Your feedback helps us get better. We appreciate you taking the time.
        </p>
      </div>
    );
  }

  const lowRating = rating > 0 && rating < threshold;

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
      {heading}
      <p className="mb-8 mt-4 text-xl font-semibold">How was your experience?</p>
      <Stars value={rating} onPick={handlePick} interactive={!lowRating} />

      {lowRating && (
        <div className="mt-8 w-full max-w-xs text-left">
          <p className="mb-3 text-center text-sm opacity-70">
            We are sorry it fell short. Tell us what happened so we can fix it.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your feedback..."
            rows={4}
            className="w-full resize-y rounded-2xl border border-black/10 bg-white/70 p-4 text-base outline-none focus:border-black/30"
          />
          <button
            type="button"
            onClick={submitFeedback}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold transition active:scale-[0.98]"
            style={{ background: brand, color: onBrand }}
          >
            <Send className="size-5" />
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
