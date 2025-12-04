/**
 * Color Utilities
 *
 * Comprehensive color manipulation utilities including conversion,
 * generation, and accessibility helpers.
 *
 * @example
 * ```typescript
 * import { hexToRgb, rgbToHsl, lighten, getContrastRatio } from '@osi-cards/utils';
 *
 * const rgb = hexToRgb('#3498db');
 * const lighter = lighten('#3498db', 0.2);
 * const contrast = getContrastRatio('#ffffff', '#000000');
 * ```
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(h: number, s: number, l: number): RGB {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Lighten color
 */
export function lighten(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.min(100, hsl.l + amount * 100);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Darken color
 */
export function darken(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.l = Math.max(0, hsl.l - amount * 100);

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Adjust saturation
 */
export function saturate(color: string, amount: number): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.s = Math.min(100, Math.max(0, hsl.s + amount * 100));

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Desaturate color
 */
export function desaturate(color: string, amount: number): string {
  return saturate(color, -amount);
}

/**
 * Get luminance
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Get contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color meets WCAG AA contrast
 */
export function meetsWCAG_AA(foreground: string, background: string, largeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if color meets WCAG AAA contrast
 */
export function meetsWCAG_AAA(foreground: string, background: string, largeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Mix two colors
 */
export function mix(color1: string, color2: string, weight = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const r = Math.round(rgb1.r * (1 - weight) + rgb2.r * weight);
  const g = Math.round(rgb1.g * (1 - weight) + rgb2.g * weight);
  const b = Math.round(rgb1.b * (1 - weight) + rgb2.b * weight);

  return rgbToHex(r, g, b);
}

/**
 * Invert color
 */
export function invert(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

/**
 * Convert color to grayscale
 */
export function grayscale(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return rgbToHex(gray, gray, gray);
}

/**
 * Generate color palette
 */
export function generatePalette(baseColor: string, count = 5): string[] {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return [baseColor];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const palette: string[] = [];

  for (let i = 0; i < count; i++) {
    const newHsl = { ...hsl };
    newHsl.h = (hsl.h + (360 / count) * i) % 360;
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    palette.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return palette;
}

/**
 * Generate complementary color
 */
export function complementary(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + 180) % 360;

  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

/**
 * Generate triadic colors
 */
export function triadic(color: string): [string, string, string] {
  const rgb = hexToRgb(color);
  if (!rgb) return [color, color, color];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const color1 = color;

  const hsl2 = { ...hsl, h: (hsl.h + 120) % 360 };
  const rgb2 = hslToRgb(hsl2.h, hsl2.s, hsl2.l);
  const color2 = rgbToHex(rgb2.r, rgb2.g, rgb2.b);

  const hsl3 = { ...hsl, h: (hsl.h + 240) % 360 };
  const rgb3 = hslToRgb(hsl3.h, hsl3.s, hsl3.l);
  const color3 = rgbToHex(rgb3.r, rgb3.g, rgb3.b);

  return [color1, color2, color3];
}

/**
 * Generate analogous colors
 */
export function analogous(color: string, count = 3): string[] {
  const rgb = hexToRgb(color);
  if (!rgb) return [color];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: string[] = [color];
  const step = 30;

  for (let i = 1; i < count; i++) {
    const newHsl = { ...hsl };
    newHsl.h = (hsl.h + step * i) % 360;
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return colors;
}

/**
 * Generate monochromatic scheme
 */
export function monochromatic(color: string, count = 5): string[] {
  const rgb = hexToRgb(color);
  if (!rgb) return [color];

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    const newHsl = { ...hsl };
    newHsl.l = 20 + (60 / (count - 1)) * i;
    const newRgb = hslToRgb(newHsl.h, newHsl.s, newHsl.l);
    colors.push(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }

  return colors;
}

/**
 * Random color
 */
export function randomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return rgbToHex(r, g, b);
}

/**
 * Parse CSS color
 */
export function parseColor(color: string): RGB | null {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }

  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
    };
  }

  return null;
}

/**
 * Format color as CSS
 */
export function toRgbString(r: number, g: number, b: number, a?: number): string {
  if (a !== undefined) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Format HSL as CSS
 */
export function toHslString(h: number, s: number, l: number, a?: number): string {
  if (a !== undefined) {
    return `hsla(${h}, ${s}%, ${l}%, ${a})`;
  }
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Check if color is light
 */
export function isLight(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;

  const luminance = getLuminance(rgb.r, rgb.g, rgb.b);
  return luminance > 0.5;
}

/**
 * Check if color is dark
 */
export function isDark(color: string): boolean {
  return !isLight(color);
}

/**
 * Get best text color for background
 */
export function getTextColor(backgroundColor: string): string {
  return isLight(backgroundColor) ? '#000000' : '#ffffff';
}
