/**
 * Output Sanitization Utilities
 *
 * Prevents XSS attacks by sanitizing user-generated content.
 *
 * @example
 * ```typescript
 * const safe = Sanitizer.html(userInput);
 * ```
 */

export class Sanitizer {
  // ============================================================================
  // HTML SANITIZATION
  // ============================================================================

  /**
   * Sanitize HTML to prevent XSS
   */
  static html(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };
    return input.replace(/[&<>"'\/]/g, (char) => map[char] || char);
  }

  /**
   * Sanitize HTML attributes
   */
  static htmlAttribute(input: string): string {
    return input.replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/`/g, '&#x60;');
  }

  /**
   * Strip all HTML tags
   */
  static stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Allow only safe HTML tags
   */
  static allowTags(input: string, allowedTags: string[]): string {
    const div = document.createElement('div');
    div.innerHTML = input;

    const walk = (node: Node): void => {
      const nodeName = node.nodeName.toLowerCase();

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (!allowedTags.includes(nodeName)) {
          node.parentNode?.removeChild(node);
          return;
        }
      }

      // Recurse children
      const children = Array.from(node.childNodes);
      children.forEach((child) => walk(child));
    };

    walk(div);
    return div.innerHTML;
  }

  // ============================================================================
  // URL SANITIZATION
  // ============================================================================

  /**
   * Sanitize URL to prevent javascript: protocol
   */
  static url(input: string): string {
    const url = input.trim().toLowerCase();

    // Dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

    if (dangerousProtocols.some((protocol) => url.startsWith(protocol))) {
      return '';
    }

    return input;
  }

  /**
   * Ensure URL is https
   */
  static httpsUrl(input: string): string {
    try {
      const url = new URL(input);
      if (url.protocol === 'http:') {
        url.protocol = 'https:';
      }
      return url.toString();
    } catch {
      return '';
    }
  }

  // ============================================================================
  // SQL SANITIZATION
  // ============================================================================

  /**
   * Escape SQL string (basic protection, use parameterized queries!)
   */
  static sql(input: string): string {
    return input.replace(/'/g, "''").replace(/\\/g, '\\\\').replace(/\0/g, '\\0');
  }

  // ============================================================================
  // JAVASCRIPT SANITIZATION
  // ============================================================================

  /**
   * Sanitize for use in JavaScript strings
   */
  static javascript(input: string): string {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  // ============================================================================
  // FILE NAME SANITIZATION
  // ============================================================================

  /**
   * Sanitize file name
   */
  static fileName(input: string): string {
    // Remove path traversal
    let sanitized = input.replace(/\.\./g, '');

    // Remove special characters
    sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');

    // Limit length
    if (sanitized.length > 255) {
      const ext = sanitized.split('.').pop();
      const name = sanitized.substring(0, 255 - (ext?.length || 0) - 1);
      sanitized = ext ? `${name}.${ext}` : name;
    }

    return sanitized || 'file';
  }

  // ============================================================================
  // JSON SANITIZATION
  // ============================================================================

  /**
   * Safely parse JSON
   */
  static parseJson<T = any>(input: string): T | null {
    try {
      return JSON.parse(input) as T;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize JSON object (remove functions, symbols, etc.)
   */
  static sanitizeJson(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  // ============================================================================
  // CSS SANITIZATION
  // ============================================================================

  /**
   * Sanitize CSS value
   */
  static css(input: string): string {
    // Remove potentially dangerous CSS
    return input
      .replace(/expression\s*\(/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/@import/gi, '');
  }

  // ============================================================================
  // EMAIL SANITIZATION
  // ============================================================================

  /**
   * Sanitize email address
   */
  static email(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^\w@.-]/g, '');
  }

  // ============================================================================
  // MARKDOWN SANITIZATION
  // ============================================================================

  /**
   * Sanitize markdown (basic)
   */
  static markdown(input: string): string {
    // Remove potentially dangerous markdown
    let sanitized = input;

    // Remove HTML tags
    sanitized = this.stripHtml(sanitized);

    // Remove dangerous URLs
    sanitized = sanitized.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeUrl = this.url(url);
      return safeUrl ? `[${text}](${safeUrl})` : text;
    });

    return sanitized;
  }

  // ============================================================================
  // NUMBER SANITIZATION
  // ============================================================================

  /**
   * Sanitize number input
   */
  static number(input: any): number | null {
    const num = Number(input);
    return isNaN(num) || !isFinite(num) ? null : num;
  }

  /**
   * Sanitize integer input
   */
  static integer(input: any): number | null {
    const num = this.number(input);
    return num !== null && Number.isInteger(num) ? num : null;
  }

  // ============================================================================
  // CONTENT SECURITY
  // ============================================================================

  /**
   * Remove potential script injections from content
   */
  static removeScripts(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  }

  /**
   * Sanitize user-generated content (comprehensive)
   */
  static userContent(input: string): string {
    let sanitized = this.removeScripts(input);
    sanitized = this.html(sanitized);
    return sanitized;
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key of Object.keys(obj)) {
      const sanitizedKey = Sanitizer.html(key);
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }

  if (typeof obj === 'string') {
    return Sanitizer.html(obj);
  }

  return obj;
}
