import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (later wins on conflict). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price given in Rappen (CHF cents) as e.g. "CHF 12.50". */
export function formatChf(cents: number): string {
  return `CHF ${(cents / 100).toFixed(2)}`;
}
