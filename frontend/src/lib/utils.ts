import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number to a fixed number of decimals (default 1). Strips trailing zeros for whole numbers. */
export function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "--";
  return Number.isInteger(n) ? String(n) : n.toFixed(decimals);
}

/** Round to integer display */
export function fmtInt(n: number | null | undefined): string {
  if (n == null) return "--";
  return String(Math.round(n));
}
