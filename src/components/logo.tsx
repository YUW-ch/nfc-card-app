import Image from "next/image";
import mark from "@/components/editor/assets/taplino-mark.svg";
import { cn } from "@/lib/utils";

/** Taplino mark plus wordmark, same lockup as the marketing site header. */
export function Logo({ size = "md", className }: { size?: "md" | "lg"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={mark}
        width={64}
        height={64}
        alt=""
        aria-hidden
        priority
        className={size === "lg" ? "size-10" : "size-8"}
      />
      <span
        className={cn(
          "font-[family-name:var(--font-bricolage)] font-bold tracking-tight text-ink",
          size === "lg" ? "text-3xl" : "text-2xl",
        )}
      >
        Taplino
      </span>
    </span>
  );
}
