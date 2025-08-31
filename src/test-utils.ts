import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

// Core modules
import { CoreModule } from './app/core/core.module';
import { SharedModule } from './app/shared/shared.module';

// Mock services
export class MockTranslateService {
  get(key: string) {
    return of(key);
  }

  instant(key: string) {
    return key;
  }

  use(lang: string) {
    return of(lang);
  }
}

export class TestUtils {
  /**
   * Configure testing module with common imports
   */
  static configureTestingModule(
    config: {
      declarations?: any[];
      imports?: any[];
      providers?: any[];
      schemas?: any[];
    } = {}
  ) {
    return TestBed.configureTestingModule({
      declarations: config.declarations || [],
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        StoreModule.forRoot({}),
        EffectsModule.forRoot([]),
        CoreModule,
        SharedModule,
        ...(config.imports || []),
      ],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        ...(config.providers || []),
      ],
      schemas: config.schemas || [],
    });
  }

  /**
   * Create mock for service methods
   */
  static createServiceMock<T>(serviceClass: new (...args: any[]) => T): jest.Mocked<T> {
    const mock = {} as jest.Mocked<T>;
    const prototype = serviceClass.prototype;

    Object.getOwnPropertyNames(prototype).forEach(method => {
      if (method !== 'constructor' && typeof prototype[method] === 'function') {
        (mock as any)[method] = jest.fn();
      }
    });

    return mock;
  }

  /**
   * Mock HTTP responses
   */
  static mockHttpResponse<T>(data: T, status = 200) {
    return {
      status,
      body: data,
      headers: new Map([['content-type', 'application/json']]),
    };
  }

  /**
   * Mock HTTP error
   */
  static mockHttpError(message: string, status = 500) {
    return {
      status,
      statusText: 'Internal Server Error',
      error: { message },
      headers: new Map(),
    };
  }

  /**
   * Wait for component stability
   */
  static async waitForComponent(component: any): Promise<void> {
    return new Promise(resolve => {
      const checkStable = () => {
        if (component.componentRef?.instance) {
          resolve();
        } else {
          setTimeout(checkStable, 10);
        }
      };
      checkStable();
    });
  }

  /**
   * Create test wrapper for component with template
   */
  static createTestWrapper(template: string, styles = '') {
    return {
      template: `
        <div class="test-wrapper">
          ${template}
        </div>
      `,
      styles: [
        `
        .test-wrapper {
          ${styles}
        }
      `,
      ],
    };
  }
}

/**
 * Custom matchers for Angular testing
 */
export const customMatchers = {
  toHaveClass: () => ({
    compare: (element: Element, className: string) => {
      const pass = element.classList.contains(className);
      return {
        pass,
        message: pass
          ? `Expected element not to have class "${className}"`
          : `Expected element to have class "${className}"`,
      };
    },
  }),

  toBeVisible: () => ({
    compare: (element: Element) => {
      const style = window.getComputedStyle(element);
      const pass = style.display !== 'none' && style.visibility !== 'hidden';
      return {
        pass,
        message: pass ? 'Expected element to be hidden' : 'Expected element to be visible',
      };
    },
  }),

  toHaveText: () => ({
    compare: (element: Element, expectedText: string) => {
      const actualText = element.textContent?.trim();
      const pass = actualText === expectedText;
      return {
        pass,
        message: pass
          ? `Expected element not to have text "${expectedText}"`
          : `Expected element to have text "${expectedText}", but had "${actualText}"`,
      };
    },
  }),
};

// Add custom matchers to Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveClass(className: string): R;
      toBeVisible(): R;
      toHaveText(text: string): R;
    }
  }
}

beforeEach(() => {
  // Custom matchers are now available globally
});

// Import for observable testing
import { of } from 'rxjs';
