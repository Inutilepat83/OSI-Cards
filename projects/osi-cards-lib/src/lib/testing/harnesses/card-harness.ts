/**
 * CDK Test Harnesses for OSI Cards Components (Improvement Plan Point #13)
 * 
 * Provides Angular CDK-style test harnesses for testing OSI Cards components.
 * These harnesses abstract DOM interactions and provide a stable API for testing.
 * 
 * @example
 * ```typescript
 * import { CardHarness, SectionHarness } from 'osi-cards-lib/testing';
 * 
 * describe('MyComponent', () => {
 *   let harness: CardHarness;
 *   
 *   beforeEach(async () => {
 *     harness = await CardHarness.create(fixture);
 *   });
 *   
 *   it('should display card title', async () => {
 *     expect(await harness.getTitle()).toBe('My Card');
 *   });
 *   
 *   it('should have sections', async () => {
 *     const sections = await harness.getSections();
 *     expect(sections.length).toBe(3);
 *   });
 * });
 * ```
 */

import { ComponentFixture } from '@angular/core/testing';

// ============================================================================
// BASE HARNESS
// ============================================================================

/**
 * Base class for all test harnesses
 */
export abstract class BaseHarness<T = HTMLElement> {
  constructor(protected readonly element: T) {}
  
  /**
   * Get the native element
   */
  getNativeElement(): T {
    return this.element;
  }
  
  /**
   * Check if element exists
   */
  exists(): boolean {
    return this.element !== null && this.element !== undefined;
  }
  
  /**
   * Query a single element
   */
  protected query<E extends Element = Element>(selector: string): E | null {
    if (this.element instanceof Element) {
      return this.element.querySelector<E>(selector);
    }
    return null;
  }
  
  /**
   * Query all matching elements
   */
  protected queryAll<E extends Element = Element>(selector: string): E[] {
    if (this.element instanceof Element) {
      return Array.from(this.element.querySelectorAll<E>(selector));
    }
    return [];
  }
  
  /**
   * Get text content
   */
  protected getText(): string {
    if (this.element instanceof Element) {
      return this.element.textContent?.trim() ?? '';
    }
    return '';
  }
  
  /**
   * Get attribute value
   */
  protected getAttribute(name: string): string | null {
    if (this.element instanceof Element) {
      return this.element.getAttribute(name);
    }
    return null;
  }
  
  /**
   * Check if element has class
   */
  protected hasClass(className: string): boolean {
    if (this.element instanceof Element) {
      return this.element.classList.contains(className);
    }
    return false;
  }
  
  /**
   * Simulate click
   */
  protected click(): void {
    if (this.element instanceof HTMLElement) {
      this.element.click();
    }
  }
  
  /**
   * Dispatch custom event
   */
  protected dispatchEvent(eventName: string, detail?: unknown): void {
    if (this.element instanceof Element) {
      this.element.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
    }
  }
}

// ============================================================================
// FIELD HARNESS
// ============================================================================

/**
 * Harness for CardField elements
 */
export class FieldHarness extends BaseHarness {
  /**
   * Get field label
   */
  getLabel(): string {
    const label = this.query('.field-label, .osi-field-label, [data-field-label]');
    return label?.textContent?.trim() ?? '';
  }
  
  /**
   * Get field value
   */
  getValue(): string {
    const value = this.query('.field-value, .osi-field-value, [data-field-value]');
    return value?.textContent?.trim() ?? '';
  }
  
  /**
   * Get field type
   */
  getType(): string | null {
    return this.getAttribute('data-field-type');
  }
  
  /**
   * Check if field has trend indicator
   */
  hasTrend(): boolean {
    return this.query('.field-trend, .osi-trend, [data-trend]') !== null;
  }
  
  /**
   * Get trend direction
   */
  getTrend(): 'up' | 'down' | 'stable' | null {
    const trend = this.getAttribute('data-trend');
    if (trend === 'up' || trend === 'down' || trend === 'stable') {
      return trend;
    }
    return null;
  }
  
  /**
   * Check if field has icon
   */
  hasIcon(): boolean {
    return this.query('.field-icon, lucide-icon, [data-field-icon]') !== null;
  }
  
  /**
   * Click the field
   */
  clickField(): void {
    this.click();
  }
}

// ============================================================================
// ITEM HARNESS
// ============================================================================

/**
 * Harness for CardItem elements
 */
export class ItemHarness extends BaseHarness {
  /**
   * Get item title
   */
  getTitle(): string {
    const title = this.query('.item-title, .osi-item-title, [data-item-title]');
    return title?.textContent?.trim() ?? '';
  }
  
  /**
   * Get item description
   */
  getDescription(): string {
    const desc = this.query('.item-description, .osi-item-description, [data-item-description]');
    return desc?.textContent?.trim() ?? '';
  }
  
  /**
   * Get item value
   */
  getValue(): string | null {
    const value = this.query('.item-value, [data-item-value]');
    return value?.textContent?.trim() ?? null;
  }
  
  /**
   * Get item status
   */
  getStatus(): string | null {
    return this.getAttribute('data-item-status');
  }
  
  /**
   * Check if item has badge
   */
  hasBadge(): boolean {
    return this.query('.item-badge, .osi-badge') !== null;
  }
  
  /**
   * Get badge text
   */
  getBadgeText(): string | null {
    const badge = this.query('.item-badge, .osi-badge');
    return badge?.textContent?.trim() ?? null;
  }
  
  /**
   * Click the item
   */
  clickItem(): void {
    this.click();
  }
}

// ============================================================================
// SECTION HARNESS
// ============================================================================

/**
 * Harness for CardSection elements
 */
export class SectionHarness extends BaseHarness {
  /**
   * Get section title
   */
  getTitle(): string {
    const title = this.query('.section-title, .osi-section-title, [data-section-title], h2, h3');
    return title?.textContent?.trim() ?? '';
  }
  
  /**
   * Get section type
   */
  getType(): string | null {
    return this.getAttribute('data-section-type') ?? 
           this.getAttribute('data-type');
  }
  
  /**
   * Get section ID
   */
  getId(): string | null {
    return this.getAttribute('data-section-id') ?? 
           this.getAttribute('id');
  }
  
  /**
   * Check if section is collapsed
   */
  isCollapsed(): boolean {
    return this.hasClass('collapsed') || 
           this.getAttribute('aria-expanded') === 'false';
  }
  
  /**
   * Get all fields in the section
   */
  getFields(): FieldHarness[] {
    const fieldElements = this.queryAll('.osi-field, .field, [data-field]');
    return fieldElements.map(el => new FieldHarness(el as HTMLElement));
  }
  
  /**
   * Get field by label
   */
  getFieldByLabel(label: string): FieldHarness | null {
    const fields = this.getFields();
    return fields.find(f => f.getLabel().toLowerCase() === label.toLowerCase()) ?? null;
  }
  
  /**
   * Get all items in the section
   */
  getItems(): ItemHarness[] {
    const itemElements = this.queryAll('.osi-item, .item, [data-item]');
    return itemElements.map(el => new ItemHarness(el as HTMLElement));
  }
  
  /**
   * Get item by title
   */
  getItemByTitle(title: string): ItemHarness | null {
    const items = this.getItems();
    return items.find(i => i.getTitle().toLowerCase() === title.toLowerCase()) ?? null;
  }
  
  /**
   * Toggle section collapse
   */
  toggle(): void {
    const toggleButton = this.query('.section-toggle, [data-toggle], button');
    if (toggleButton instanceof HTMLElement) {
      toggleButton.click();
    }
  }
  
  /**
   * Get column span
   */
  getColSpan(): number {
    const span = this.getAttribute('data-col-span');
    return span ? parseInt(span, 10) : 1;
  }
  
  /**
   * Check if section has emoji
   */
  hasEmoji(): boolean {
    return this.query('.section-emoji, [data-emoji]') !== null;
  }
  
  /**
   * Get emoji
   */
  getEmoji(): string | null {
    const emoji = this.query('.section-emoji, [data-emoji]');
    return emoji?.textContent?.trim() ?? null;
  }
}

// ============================================================================
// ACTION HARNESS
// ============================================================================

/**
 * Harness for CardAction buttons
 */
export class ActionHarness extends BaseHarness {
  /**
   * Get action label
   */
  getLabel(): string {
    return this.getText();
  }
  
  /**
   * Get action type
   */
  getType(): string | null {
    return this.getAttribute('data-action-type');
  }
  
  /**
   * Get action variant
   */
  getVariant(): 'primary' | 'secondary' | 'ghost' | null {
    const variant = this.getAttribute('data-variant');
    if (variant === 'primary' || variant === 'secondary' || variant === 'ghost') {
      return variant;
    }
    return null;
  }
  
  /**
   * Check if action is disabled
   */
  isDisabled(): boolean {
    return this.getAttribute('disabled') !== null || 
           this.hasClass('disabled');
  }
  
  /**
   * Check if action has icon
   */
  hasIcon(): boolean {
    return this.query('lucide-icon, .action-icon, [data-icon]') !== null;
  }
  
  /**
   * Get icon name
   */
  getIconName(): string | null {
    const icon = this.query('lucide-icon');
    return icon?.getAttribute('name') ?? null;
  }
  
  /**
   * Click the action button
   */
  clickAction(): void {
    if (!this.isDisabled()) {
      this.click();
    }
  }
}

// ============================================================================
// CARD HARNESS
// ============================================================================

/**
 * Harness for the main AICardRenderer component
 */
export class CardHarness extends BaseHarness {
  /**
   * Create a CardHarness from a ComponentFixture
   */
  static create<T>(fixture: ComponentFixture<T>): CardHarness {
    const element = fixture.nativeElement.querySelector('app-ai-card-renderer') ??
                    fixture.nativeElement;
    return new CardHarness(element);
  }
  
  /**
   * Create from a native element
   */
  static fromElement(element: HTMLElement): CardHarness {
    return new CardHarness(element);
  }
  
  /**
   * Get card title
   */
  getTitle(): string {
    const title = this.query('.card-title, .osi-card-title, [data-card-title], h1');
    return title?.textContent?.trim() ?? '';
  }
  
  /**
   * Get card ID
   */
  getId(): string | null {
    return this.getAttribute('data-card-id') ?? 
           this.getAttribute('id');
  }
  
  /**
   * Check if card is in fullscreen mode
   */
  isFullscreen(): boolean {
    return this.hasClass('fullscreen') || 
           this.getAttribute('data-fullscreen') === 'true';
  }
  
  /**
   * Check if card is streaming
   */
  isStreaming(): boolean {
    return this.hasClass('streaming') || 
           this.hasClass('streaming-active') ||
           this.getAttribute('data-streaming') === 'true';
  }
  
  /**
   * Get streaming stage
   */
  getStreamingStage(): string | null {
    return this.getAttribute('data-streaming-stage');
  }
  
  /**
   * Get all sections
   */
  getSections(): SectionHarness[] {
    // Try multiple selectors for sections
    const sectionElements = this.queryAll(
      'app-section-renderer, .osi-section, .section, [data-section]'
    );
    return sectionElements.map(el => new SectionHarness(el as HTMLElement));
  }
  
  /**
   * Get section by type
   */
  getSectionByType(type: string): SectionHarness | null {
    const sections = this.getSections();
    return sections.find(s => s.getType()?.toLowerCase() === type.toLowerCase()) ?? null;
  }
  
  /**
   * Get section by title
   */
  getSectionByTitle(title: string): SectionHarness | null {
    const sections = this.getSections();
    return sections.find(s => s.getTitle().toLowerCase() === title.toLowerCase()) ?? null;
  }
  
  /**
   * Get all actions
   */
  getActions(): ActionHarness[] {
    const actionElements = this.queryAll(
      '.osi-action-button, .card-action, button[data-action]'
    );
    return actionElements.map(el => new ActionHarness(el as HTMLElement));
  }
  
  /**
   * Get action by label
   */
  getActionByLabel(label: string): ActionHarness | null {
    const actions = this.getActions();
    return actions.find(a => a.getLabel().toLowerCase() === label.toLowerCase()) ?? null;
  }
  
  /**
   * Click an action by label
   */
  clickAction(label: string): boolean {
    const action = this.getActionByLabel(label);
    if (action && !action.isDisabled()) {
      action.clickAction();
      return true;
    }
    return false;
  }
  
  /**
   * Toggle fullscreen
   */
  toggleFullscreen(): void {
    const button = this.query('.fullscreen-toggle, [data-fullscreen-toggle]');
    if (button instanceof HTMLElement) {
      button.click();
    }
  }
  
  /**
   * Get card header element
   */
  getHeader(): HTMLElement | null {
    return this.query('.card-header, .osi-card-header, app-card-header');
  }
  
  /**
   * Get card body element
   */
  getBody(): HTMLElement | null {
    return this.query('.card-body, .osi-card-body, app-card-body');
  }
  
  /**
   * Get card footer element
   */
  getFooter(): HTMLElement | null {
    return this.query('.card-footer, .osi-card-footer, app-card-footer');
  }
  
  /**
   * Check if card has loading overlay
   */
  hasLoadingOverlay(): boolean {
    return this.query('.loading-overlay, .osi-loading, [data-loading]') !== null;
  }
  
  /**
   * Check if card has error state
   */
  hasError(): boolean {
    return this.hasClass('error') || 
           this.query('.error-boundary, [data-error]') !== null;
  }
  
  /**
   * Get error message
   */
  getErrorMessage(): string | null {
    const error = this.query('.error-message, [data-error-message]');
    return error?.textContent?.trim() ?? null;
  }
  
  /**
   * Get masonry grid element
   */
  getMasonryGrid(): HTMLElement | null {
    return this.query('app-masonry-grid, .masonry-container');
  }
  
  /**
   * Get number of columns in masonry grid
   */
  getColumnCount(): number {
    const grid = this.getMasonryGrid();
    if (grid) {
      const colCount = grid.getAttribute('aria-colcount') ?? 
                       grid.getAttribute('data-columns');
      return colCount ? parseInt(colCount, 10) : 1;
    }
    return 1;
  }
}

// ============================================================================
// MASONRY GRID HARNESS
// ============================================================================

/**
 * Harness for MasonryGrid component
 */
export class MasonryGridHarness extends BaseHarness {
  /**
   * Create from fixture
   */
  static create<T>(fixture: ComponentFixture<T>): MasonryGridHarness {
    const element = fixture.nativeElement.querySelector('app-masonry-grid') ??
                    fixture.nativeElement.querySelector('.masonry-container');
    return new MasonryGridHarness(element);
  }
  
  /**
   * Get column count
   */
  getColumnCount(): number {
    const count = this.getAttribute('aria-colcount') ?? 
                  this.getAttribute('data-columns');
    return count ? parseInt(count, 10) : 1;
  }
  
  /**
   * Get row count
   */
  getRowCount(): number {
    const count = this.getAttribute('aria-rowcount');
    return count ? parseInt(count, 10) : 0;
  }
  
  /**
   * Get container height
   */
  getContainerHeight(): number {
    if (this.element instanceof HTMLElement) {
      return this.element.offsetHeight;
    }
    return 0;
  }
  
  /**
   * Get all positioned items
   */
  getPositionedItems(): HTMLElement[] {
    return this.queryAll('.masonry-item') as HTMLElement[];
  }
  
  /**
   * Check if virtual scrolling is active
   */
  isVirtualScrollActive(): boolean {
    return this.getAttribute('data-virtual-scroll') === 'active';
  }
  
  /**
   * Check if layout is ready
   */
  isLayoutReady(): boolean {
    return !this.hasClass('masonry-container--loading');
  }
  
  /**
   * Check if grid is streaming
   */
  isStreaming(): boolean {
    return this.hasClass('masonry-container--streaming');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BaseHarness,
  FieldHarness,
  ItemHarness,
  SectionHarness,
  ActionHarness,
  CardHarness,
  MasonryGridHarness
};

