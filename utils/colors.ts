/**
 * Converts a hexadecimal color code to an RGBA string.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) hex codes.
 *
 * @param hex - The hexadecimal color code (e.g., "#FFF" or "#FFFFFF").
 * @param alpha - The opacity value (0 to 1).
 * @returns The RGBA string (e.g., "rgba(255,255,255,1)").
 */
export function hexToRgba(hex: string, alpha: number): string {
  let r = 0, g = 0, b = 0;

  // Remove the hash at the start if it exists
  hex = hex.startsWith("#") ? hex.slice(1) : hex;

  if (hex.length === 3) {
    // 3 digits
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // 6 digits
    r = parseInt(hex[0] + hex[1], 16);
    g = parseInt(hex[2] + hex[3], 16);
    b = parseInt(hex[4] + hex[5], 16);
  }

  // Clamp alpha between 0 and 1
  const clampedAlpha = Math.max(0, Math.min(1, alpha));

  return `rgba(${r},${g},${b},${clampedAlpha})`;
} 