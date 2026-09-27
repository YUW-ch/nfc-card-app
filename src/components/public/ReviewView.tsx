"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import type { ReviewContent } from "@/lib/page-content";

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
                color: filled ? "#f5a623" : "var(--pt-line)",
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
}: {
  content: ReviewContent;
  name: string;
}) {
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

  // ── Smart routing off: straight to Google review ──
  if (!smart) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
        <div className="mb-8 flex items-center justify-center gap-1.5">
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
          className="flex min-h-[56px] w-full max-w-xs items-center justify-center rounded-[var(--pt-radius)] px-6 text-lg font-semibold shadow-lg transition active:scale-[0.98]"
          style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
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
        <CheckCircle2 className="mb-5 size-16" style={{ color: "var(--pt-brand)" }} strokeWidth={1.5} />
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
      <p className="mb-8 text-xl font-semibold">How was your experience?</p>
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
            className="w-full resize-y rounded-[var(--pt-card-radius)] border p-4 text-base outline-none"
            style={{ background: "var(--pt-surface)", borderColor: "var(--pt-line)", color: "inherit" }}
          />
          <button
            type="button"
            onClick={submitFeedback}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--pt-radius)] text-base font-semibold transition active:scale-[0.98]"
            style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
          >
            <Send className="size-5" />
            Send feedback
          </button>
        </div>
      )}
    </div>
  );
}
