// src/utils/coords.ts

/**
 * Convert input string -> number | null
 * Normalizes:
 *  - empty string -> null
 *  - invalid number -> null
 *  - valid decimal -> number
 */
export const parseCoordinateInput = (value: string): number | null => {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Normalize coordinate value that may come from backend as number | string | null
 */
export const normalizeCoordinateValue = (
  value?: number | string | null
): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    return parseCoordinateInput(value);
  }
  return null;
};
