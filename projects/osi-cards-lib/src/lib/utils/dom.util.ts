/**
 * DOM Utilities
 *
 * Utilities for DOM manipulation and queries.
 *
 * @example
 * ```typescript
 * import { addClass, removeClass, getOffset } from '@osi-cards/utils';
 *
 * addClass(element, 'active');
 * const offset = getOffset(element);
 * ```
 */

export function addClass(element: Element, className: string): void {
  element.classList.add(className);
}

export function removeClass(element: Element, className: string): void {
  element.classList.remove(className);
}

export function toggleClass(element: Element, className: string): void {
  element.classList.toggle(className);
}

export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

export function getOffset(element: HTMLElement): { top: number; left: number } {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
  };
}

export function getPosition(element: HTMLElement): { x: number; y: number } {
  return {
    x: element.offsetLeft,
    y: element.offsetTop,
  };
}

export function getSize(element: HTMLElement): { width: number; height: number } {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

export function scrollTo(element: HTMLElement, options?: ScrollToOptions): void {
  element.scrollTo(options || { top: 0, behavior: 'smooth' });
}

export function scrollIntoView(element: HTMLElement, options?: ScrollIntoViewOptions): void {
  element.scrollIntoView(options || { behavior: 'smooth', block: 'center' });
}

export function isVisible(element: HTMLElement): boolean {
  return element.offsetWidth > 0 && element.offsetHeight > 0;
}

export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes?: Record<string, string>,
  children?: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  if (children) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
  }

  return element;
}

export function removeElement(element: Element): void {
  element.parentNode?.removeChild(element);
}

export function insertAfter(newElement: Node, referenceElement: Node): void {
  referenceElement.parentNode?.insertBefore(newElement, referenceElement.nextSibling);
}

export function insertBefore(newElement: Node, referenceElement: Node): void {
  referenceElement.parentNode?.insertBefore(newElement, referenceElement);
}

export function replaceElement(newElement: Node, oldElement: Node): void {
  oldElement.parentNode?.replaceChild(newElement, oldElement);
}

export function wrapElement(wrapper: HTMLElement, element: HTMLElement): void {
  element.parentNode?.insertBefore(wrapper, element);
  wrapper.appendChild(element);
}

export function unwrapElement(element: HTMLElement): void {
  const parent = element.parentNode;
  if (parent) {
    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }
    parent.removeChild(element);
  }
}

export function getParents(element: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let current: HTMLElement | null = element.parentElement;

  while (current) {
    parents.push(current);
    current = current.parentElement;
  }

  return parents;
}

export function getChildren(element: HTMLElement): HTMLElement[] {
  return Array.from(element.children) as HTMLElement[];
}

export function getSiblings(element: HTMLElement): HTMLElement[] {
  return Array.from(element.parentElement?.children || []).filter(
    (child) => child !== element
  ) as HTMLElement[];
}

export function getNextSiblings(element: HTMLElement): HTMLElement[] {
  const siblings: HTMLElement[] = [];
  let current = element.nextElementSibling as HTMLElement | null;

  while (current) {
    siblings.push(current);
    current = current.nextElementSibling as HTMLElement | null;
  }

  return siblings;
}

export function getPreviousSiblings(element: HTMLElement): HTMLElement[] {
  const siblings: HTMLElement[] = [];
  let current = element.previousElementSibling as HTMLElement | null;

  while (current) {
    siblings.push(current);
    current = current.previousElementSibling as HTMLElement | null;
  }

  return siblings;
}

export function closest(element: HTMLElement, selector: string): HTMLElement | null {
  return element.closest(selector) as HTMLElement | null;
}

export function matches(element: HTMLElement, selector: string): boolean {
  return element.matches(selector);
}

export function getComputedStyle(element: HTMLElement, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

export function setStyle(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(property, value);
}

export function getDataAttribute(element: HTMLElement, key: string): string | null {
  return element.getAttribute(`data-${key}`);
}

export function setDataAttribute(element: HTMLElement, key: string, value: string): void {
  element.setAttribute(`data-${key}`, value);
}
