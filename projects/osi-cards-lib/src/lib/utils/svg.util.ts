/**
 * SVG Utilities
 *
 * Utilities for SVG creation, manipulation, and conversion.
 *
 * @example
 * ```typescript
 * import { createSVG, addRect, exportSVG } from '@osi-cards/utils';
 *
 * const svg = createSVG(800, 600);
 * addRect(svg, { x: 100, y: 100, width: 200, height: 150, fill: '#3498db' });
 * const svgString = exportSVG(svg);
 * ```
 */

export interface SVGElementOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  transform?: string;
  class?: string;
  id?: string;
}

export interface SVGTextOptions extends SVGElementOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAnchor?: 'start' | 'middle' | 'end';
}

export interface SVGPathOptions extends Omit<SVGElementOptions, 'x' | 'y' | 'width' | 'height'> {
  d: string;
}

/**
 * Create SVG element
 */
export function createSVG(width: number, height: number, viewBox?: string): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width.toString());
  svg.setAttribute('height', height.toString());
  svg.setAttribute('viewBox', viewBox || `0 0 ${width} ${height}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return svg;
}

/**
 * Add rectangle to SVG
 */
export function addRect(parent: SVGElement, options: SVGElementOptions): SVGRectElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  applyAttributes(rect, options);
  parent.appendChild(rect);
  return rect;
}

/**
 * Add circle to SVG
 */
export function addCircle(
  parent: SVGElement,
  cx: number,
  cy: number,
  r: number,
  options: Omit<SVGElementOptions, 'x' | 'y' | 'width' | 'height'> = {}
): SVGCircleElement {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', cx.toString());
  circle.setAttribute('cy', cy.toString());
  circle.setAttribute('r', r.toString());
  applyAttributes(circle, options);
  parent.appendChild(circle);
  return circle;
}

/**
 * Add ellipse to SVG
 */
export function addEllipse(
  parent: SVGElement,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  options: Omit<SVGElementOptions, 'x' | 'y' | 'width' | 'height'> = {}
): SVGEllipseElement {
  const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
  ellipse.setAttribute('cx', cx.toString());
  ellipse.setAttribute('cy', cy.toString());
  ellipse.setAttribute('rx', rx.toString());
  ellipse.setAttribute('ry', ry.toString());
  applyAttributes(ellipse, options);
  parent.appendChild(ellipse);
  return ellipse;
}

/**
 * Add line to SVG
 */
export function addLine(
  parent: SVGElement,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: Omit<SVGElementOptions, 'x' | 'y' | 'width' | 'height'> = {}
): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1.toString());
  line.setAttribute('y1', y1.toString());
  line.setAttribute('x2', x2.toString());
  line.setAttribute('y2', y2.toString());
  applyAttributes(line, options);
  parent.appendChild(line);
  return line;
}

/**
 * Add path to SVG
 */
export function addPath(parent: SVGElement, options: SVGPathOptions): SVGPathElement {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', options.d);
  applyAttributes(path, options);
  parent.appendChild(path);
  return path;
}

/**
 * Add text to SVG
 */
export function addText(
  parent: SVGElement,
  text: string,
  x: number,
  y: number,
  options: SVGTextOptions = {}
): SVGTextElement {
  const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  textEl.textContent = text;
  textEl.setAttribute('x', x.toString());
  textEl.setAttribute('y', y.toString());

  if (options.fontSize) {
    textEl.setAttribute('font-size', options.fontSize.toString());
  }
  if (options.fontFamily) {
    textEl.setAttribute('font-family', options.fontFamily);
  }
  if (options.fontWeight) {
    textEl.setAttribute('font-weight', options.fontWeight);
  }
  if (options.textAnchor) {
    textEl.setAttribute('text-anchor', options.textAnchor);
  }

  applyAttributes(textEl, options);
  parent.appendChild(textEl);
  return textEl;
}

/**
 * Add group to SVG
 */
export function addGroup(parent: SVGElement, options: Omit<SVGElementOptions, 'x' | 'y' | 'width' | 'height'> = {}): SVGGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  applyAttributes(group, options);
  parent.appendChild(group);
  return group;
}

/**
 * Apply attributes to SVG element
 */
function applyAttributes(element: SVGElement, options: any): void {
  if (options.x !== undefined) element.setAttribute('x', options.x.toString());
  if (options.y !== undefined) element.setAttribute('y', options.y.toString());
  if (options.width !== undefined) element.setAttribute('width', options.width.toString());
  if (options.height !== undefined) element.setAttribute('height', options.height.toString());
  if (options.fill) element.setAttribute('fill', options.fill);
  if (options.stroke) element.setAttribute('stroke', options.stroke);
  if (options.strokeWidth !== undefined) element.setAttribute('stroke-width', options.strokeWidth.toString());
  if (options.opacity !== undefined) element.setAttribute('opacity', options.opacity.toString());
  if (options.transform) element.setAttribute('transform', options.transform);
  if (options.class) element.setAttribute('class', options.class);
  if (options.id) element.setAttribute('id', options.id);
}

/**
 * Export SVG to string
 */
export function exportSVG(svg: SVGSVGElement): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(svg);
}

/**
 * Export SVG to data URL
 */
export function exportSVGToDataURL(svg: SVGSVGElement): string {
  const svgString = exportSVG(svg);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
}

/**
 * Download SVG
 */
export function downloadSVG(svg: SVGSVGElement, filename: string): void {
  const svgString = exportSVG(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse SVG string
 */
export function parseSVG(svgString: string): SVGSVGElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  return doc.documentElement as unknown as SVGSVGElement;
}

/**
 * Convert SVG to canvas
 */
export async function svgToCanvas(svg: SVGSVGElement): Promise<HTMLCanvasElement> {
  const svgString = exportSVG(svg);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svg.width.baseVal.value;
      canvas.height = svg.height.baseVal.value;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Get SVG bounding box
 */
export function getSVGBBox(element: SVGGraphicsElement): DOMRect {
  return element.getBBox();
}

/**
 * Create SVG icon
 */
export function createIcon(
  pathData: string,
  size = 24,
  color = 'currentColor'
): SVGSVGElement {
  const svg = createSVG(size, size);
  addPath(svg, {
    d: pathData,
    fill: color,
  });
  return svg;
}

/**
 * Clone SVG element
 */
export function cloneSVG(svg: SVGSVGElement): SVGSVGElement {
  return svg.cloneNode(true) as SVGSVGElement;
}

/**
 * Set SVG viewBox
 */
export function setViewBox(svg: SVGSVGElement, x: number, y: number, width: number, height: number): void {
  svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
}

/**
 * Create gradient
 */
export function createLinearGradient(
  svg: SVGSVGElement,
  id: string,
  stops: Array<{ offset: string; color: string; opacity?: number }>
): SVGLinearGradientElement {
  const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.setAttribute('id', id);

  stops.forEach(stop => {
    const stopEl = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stopEl.setAttribute('offset', stop.offset);
    stopEl.setAttribute('stop-color', stop.color);
    if (stop.opacity !== undefined) {
      stopEl.setAttribute('stop-opacity', stop.opacity.toString());
    }
    gradient.appendChild(stopEl);
  });

  defs.appendChild(gradient);
  return gradient;
}

/**
 * Apply filter
 */
export function applyFilter(element: SVGElement, filterId: string): void {
  element.setAttribute('filter', `url(#${filterId})`);
}

/**
 * Animate SVG element
 */
export function animateSVG(
  element: SVGElement,
  attributeName: string,
  from: string,
  to: string,
  duration: number,
  repeatCount: string | number = 'indefinite'
): SVGAnimateElement {
  const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
  animate.setAttribute('attributeName', attributeName);
  animate.setAttribute('from', from);
  animate.setAttribute('to', to);
  animate.setAttribute('dur', `${duration}s`);
  animate.setAttribute('repeatCount', repeatCount.toString());
  element.appendChild(animate);
  return animate;
}

