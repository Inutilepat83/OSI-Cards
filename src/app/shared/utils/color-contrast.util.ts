/**
 * Color contrast utilities for ensuring WCAG AA compliance
 * Improves accessibility by checking and adjusting color contrast
 */

/**
 * Calculate relative luminance of a color
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance (0-1)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  const rsValue = rs ?? 0;
  const gsValue = gs ?? 0;
  const bsValue = bs ?? 0;
  return 0.2126 * rsValue + 0.7152 * gsValue + 0.0722 * bsValue;
}

/**
 * Parse hex color to RGB
 *
 * @param hex - Hex color string (e.g., '#FF7900' or 'FF7900')
 * @returns RGB values [r, g, b] or null if invalid
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null;
  }
  const rStr = result[1];
  const gStr = result[2];
  const bStr = result[3];
  if (!rStr || !gStr || !bStr) {
    return null;
  }
  return [parseInt(rStr, 16), parseInt(gStr, 16), parseInt(bStr, 16)];
}

/**
 * Calculate contrast ratio between two colors
 *
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return 1;
  }

  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standard
 *
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets WCAG AA standard
 */
export function meetsWCAGAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standard
 *
 * @param color1 - First color (hex string)
 * @param color2 - Second color (hex string)
 * @param isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets WCAG AAA standard
 */
export function meetsWCAGAAA(color1: string, color2: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(color1, color2);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Adjust color brightness to meet contrast requirements
 *
 * @param color - Hex color string
 * @param targetRatio - Target contrast ratio
 * @param background - Background color (hex string)
 * @param isDarken - Whether to darken (true) or lighten (false)
 * @returns Adjusted color (hex string)
 */
export function adjustColorForContrast(
  color: string,
  targetRatio: number,
  background: string,
  isDarken = true
): string {
  const rgb = hexToRgb(color);
  const bgRgb = hexToRgb(background);

  if (!rgb || !bgRgb) {
    return color;
  }

  // Background luminance calculated for reference but not currently used
  // const bgLum = getLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);
  let [r, g, b] = rgb;
  let currentRatio = getContrastRatio(color, background);

  const step = isDarken ? -5 : 5;
  const maxIterations = 50;
  let iterations = 0;

  while (currentRatio < targetRatio && iterations < maxIterations) {
    r = Math.max(0, Math.min(255, r + step));
    g = Math.max(0, Math.min(255, g + step));
    b = Math.max(0, Math.min(255, b + step));

    const newColor = `#${[r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')}`;

    currentRatio = getContrastRatio(newColor, background);
    iterations++;
  }

  return `#${[r, g, b]
    .map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('')}`;
}
