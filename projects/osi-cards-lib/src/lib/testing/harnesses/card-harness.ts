/**
 * CDK Test Harnesses for OSI Cards
 *
 * Provides Angular CDK ComponentHarness implementations for testing.
 */

import { ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';

/**
 * Base harness class for OSI Cards components
 */
export class BaseHarness extends ComponentHarness {
  static hostSelector = '.osi-base';

  async getHostElement(): Promise<Element> {
    return (await this.host()) as unknown as Element;
  }
}

/**
 * Harness for field elements
 */
export class FieldHarness extends ComponentHarness {
  static hostSelector = '.osi-field';

  static with(_options: { label?: string } = {}): HarnessPredicate<FieldHarness> {
    return new HarnessPredicate(FieldHarness, {});
  }

  async getLabel(): Promise<string> {
    const label = await this.locatorForOptional('.osi-field-label')();
    return label ? await label.text() : '';
  }

  async getValue(): Promise<string> {
    const value = await this.locatorForOptional('.osi-field-value')();
    return value ? await value.text() : '';
  }
}

/**
 * Harness for item elements
 */
export class ItemHarness extends ComponentHarness {
  static hostSelector = '.osi-item';

  async getTitle(): Promise<string> {
    const title = await this.locatorForOptional('.osi-item-title')();
    return title ? await title.text() : '';
  }

  async click(): Promise<void> {
    const host = await this.host();
    await host.click();
  }
}

/**
 * Harness for section components
 */
export class SectionHarness extends ComponentHarness {
  static hostSelector = '.osi-section';

  static with(_options: { title?: string; type?: string } = {}): HarnessPredicate<SectionHarness> {
    return new HarnessPredicate(SectionHarness, {});
  }

  async getTitle(): Promise<string> {
    const title = await this.locatorForOptional('.section-title')();
    return title ? await title.text() : '';
  }

  async getFields(): Promise<FieldHarness[]> {
    return this.locatorForAll(FieldHarness)();
  }

  async getItems(): Promise<ItemHarness[]> {
    return this.locatorForAll(ItemHarness)();
  }
}

/**
 * Harness for action buttons
 */
export class ActionHarness extends ComponentHarness {
  static hostSelector = '.osi-action-button, button[data-action]';

  async getLabel(): Promise<string> {
    const host = await this.host();
    return host.text();
  }

  async click(): Promise<void> {
    const host = await this.host();
    await host.click();
  }

  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (await host.getAttribute('disabled')) !== null;
  }
}

/**
 * Harness for the main card component
 */
export class CardHarness extends ComponentHarness {
  static hostSelector = 'app-ai-card-renderer, osi-card-renderer';

  static with(_options: { title?: string } = {}): HarnessPredicate<CardHarness> {
    return new HarnessPredicate(CardHarness, {});
  }

  async getTitle(): Promise<string> {
    const title = await this.locatorForOptional('.card-title')();
    return title ? await title.text() : '';
  }

  async getSections(): Promise<SectionHarness[]> {
    return this.locatorForAll(SectionHarness)();
  }

  async getActions(): Promise<ActionHarness[]> {
    return this.locatorForAll(ActionHarness)();
  }

  async isLoading(): Promise<boolean> {
    const loader = await this.locatorForOptional('.loading, .streaming-indicator')();
    return loader !== null;
  }
}

/**
 * Harness for masonry grid layout
 */
export class MasonryGridHarness extends ComponentHarness {
  static hostSelector = 'osi-masonry-grid, .masonry-grid';

  async getColumnCount(): Promise<number> {
    const host = await this.host();
    const style = await host.getAttribute('style');
    const match = style?.match(/--columns:\s*(\d+)/);
    return match && match[1] ? parseInt(match[1], 10) : 1;
  }

  async getItems(): Promise<SectionHarness[]> {
    return this.locatorForAll(SectionHarness)();
  }
}
