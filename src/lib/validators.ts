/**
 * Lightweight input validators (no external schema required at call sites).
 * Zod is available in package.json for future expansion.
 */

export function isNonEmptyString(v: unknown, min = 1): v is string {
  return typeof v === "string" && v.trim().length >= min;
}

export function isPositiveNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v) && v >= 0;
}

export function parsePrice(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export function clampPage(page: unknown, fallback = 1): number {
  const n = Math.max(1, Number(page) || fallback);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export function clampPageSize(
  size: unknown,
  fallback = 20,
  max = 100
): number {
  const n = Math.min(max, Math.max(1, Number(size) || fallback));
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export function sanitizeUsername(username: string): string {
  return username.trim().slice(0, 64);
}
