/**
 * Resource hints utilities
 * Implements preload, prefetch, and preconnect hints for critical resources
 */

/**
 * Create a resource hint link element
 */
export function createResourceHint(
  href: string,
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch',
  as?: string,
  crossorigin?: 'anonymous' | 'use-credentials'
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = type;
  link.href = href;

  if (as) {
    link.setAttribute('as', as);
  }

  if (crossorigin) {
    link.setAttribute('crossorigin', crossorigin);
  }

  return link;
}

/**
 * Add resource hint to document head
 */
export function addResourceHint(
  href: string,
  type: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch',
  as?: string,
  crossorigin?: 'anonymous' | 'use-credentials'
): void {
  const link = createResourceHint(href, type, as, crossorigin);
  document.head.appendChild(link);
}

/**
 * Preload a resource
 */
export function preloadResource(
  href: string,
  as: string,
  crossorigin?: 'anonymous' | 'use-credentials'
): void {
  addResourceHint(href, 'preload', as, crossorigin);
}

/**
 * Prefetch a resource
 */
export function prefetchResource(href: string): void {
  addResourceHint(href, 'prefetch');
}

/**
 * Preconnect to an origin
 */
export function preconnectOrigin(
  href: string,
  crossorigin?: 'anonymous' | 'use-credentials'
): void {
  addResourceHint(href, 'preconnect', undefined, crossorigin);
}

/**
 * DNS prefetch for an origin
 */
export function dnsPrefetchOrigin(href: string): void {
  addResourceHint(href, 'dns-prefetch');
}

/**
 * Remove resource hint
 */
export function removeResourceHint(href: string, type: string): void {
  const links = document.head.querySelectorAll(`link[rel="${type}"][href="${href}"]`);
  links.forEach(link => link.remove());
}


