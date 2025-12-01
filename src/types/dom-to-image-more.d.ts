/**
 * Type declarations for dom-to-image-more
 * @see https://www.npmjs.com/package/dom-to-image-more
 */
declare module 'dom-to-image-more' {
  export interface Options {
    /** Background color */
    bgcolor?: string;
    /** Width of the output image */
    width?: number;
    /** Height of the output image */
    height?: number;
    /** Quality for JPEG output (0-1) */
    quality?: number;
    /** Custom styles to apply */
    style?: Partial<CSSStyleDeclaration>;
    /** Filter function to exclude elements */
    filter?: (node: Node) => boolean;
    /** Cache bust for images */
    cacheBust?: boolean;
    /** Image placeholder on error */
    imagePlaceholder?: string;
  }

  /**
   * Render node to PNG data URL
   */
  export function toPng(node: Node, options?: Options): Promise<string>;

  /**
   * Render node to JPEG data URL
   */
  export function toJpeg(node: Node, options?: Options): Promise<string>;

  /**
   * Render node to SVG data URL
   */
  export function toSvg(node: Node, options?: Options): Promise<string>;

  /**
   * Render node to Blob
   */
  export function toBlob(node: Node, options?: Options): Promise<Blob>;

  /**
   * Render node to pixel data
   */
  export function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;

  /**
   * Render node to Canvas
   */
  export function toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>;
}

