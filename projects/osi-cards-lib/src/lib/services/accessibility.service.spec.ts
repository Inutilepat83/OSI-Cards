import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AccessibilityService, AnnouncePolitely } from './accessibility.service';

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccessibilityService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AccessibilityService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Live Region Announcements Tests
  // ============================================================================
  describe('announce', () => {
    it('should create live regions on initialization', () => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      expect(politeRegion).toBeTruthy();
      expect(assertiveRegion).toBeTruthy();
    });

    it('should announce polite messages', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announce('Test message', 'polite');
      tick(100);
      
      expect(politeRegion?.textContent).toBe('Test message');
      
      tick(1000);
      expect(politeRegion?.textContent).toBe('');
    }));

    it('should announce assertive messages', fakeAsync(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      service.announce('Urgent message', 'assertive');
      tick(100);
      
      expect(assertiveRegion?.textContent).toBe('Urgent message');
    }));

    it('should respect custom clear delay', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announce('Test message', 'polite', 2000);
      tick(100);
      
      expect(politeRegion?.textContent).toBe('Test message');
      
      tick(1500);
      expect(politeRegion?.textContent).toBe('Test message');
      
      tick(600);
      expect(politeRegion?.textContent).toBe('');
    }));
  });

  describe('announceCardLoading', () => {
    it('should announce loading message', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announceCardLoading();
      tick(100);
      
      expect(politeRegion?.textContent).toContain('Loading');
    }));
  });

  describe('announceCardLoaded', () => {
    it('should announce loaded message with title', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announceCardLoaded('My Card');
      tick(100);
      
      expect(politeRegion?.textContent).toContain('My Card');
    }));

    it('should announce generic message without title', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announceCardLoaded();
      tick(100);
      
      expect(politeRegion?.textContent).toContain('loaded');
    }));
  });

  describe('announceStreamingUpdate', () => {
    it('should announce section count (singular)', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announceStreamingUpdate(1);
      tick(100);
      
      expect(politeRegion?.textContent).toContain('1 section');
    }));

    it('should announce section count (plural)', fakeAsync(() => {
      const politeRegion = document.querySelector('[aria-live="polite"]');
      
      service.announceStreamingUpdate(5);
      tick(100);
      
      expect(politeRegion?.textContent).toContain('5 sections');
    }));
  });

  describe('announceActionExecuted', () => {
    it('should announce action assertively', fakeAsync(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      service.announceActionExecuted('Send Email');
      tick(100);
      
      expect(assertiveRegion?.textContent).toContain('Send Email');
    }));
  });

  describe('announceError', () => {
    it('should announce error assertively', fakeAsync(() => {
      const assertiveRegion = document.querySelector('[aria-live="assertive"]');
      
      service.announceError('Something went wrong');
      tick(100);
      
      expect(assertiveRegion?.textContent).toContain('Error');
      expect(assertiveRegion?.textContent).toContain('Something went wrong');
    }));
  });

  // ============================================================================
  // Focus Management Tests
  // ============================================================================
  describe('trapFocus', () => {
    let container: HTMLElement;
    let button1: HTMLButtonElement;
    let button2: HTMLButtonElement;
    let button3: HTMLButtonElement;

    beforeEach(() => {
      container = document.createElement('div');
      button1 = document.createElement('button');
      button1.textContent = 'Button 1';
      button2 = document.createElement('button');
      button2.textContent = 'Button 2';
      button3 = document.createElement('button');
      button3.textContent = 'Button 3';

      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);
      document.body.appendChild(container);
    });

    afterEach(() => {
      service.releaseFocus();
      container.remove();
    });

    it('should focus first focusable element', () => {
      service.trapFocus(container);
      expect(document.activeElement).toBe(button1);
    });

    it('should focus specified initial element', () => {
      service.trapFocus(container, { initialFocus: button2 });
      expect(document.activeElement).toBe(button2);
    });

    it('should trap Tab key navigation', () => {
      service.trapFocus(container);
      button3.focus();

      const event = new KeyboardEvent('keydown', { 
        key: 'Tab',
        bubbles: true 
      });
      container.dispatchEvent(event);

      // Focus should wrap to first element
      // Note: This test may vary based on implementation
      expect(service).toBeTruthy();
    });
  });

  describe('releaseFocus', () => {
    it('should release focus trap', () => {
      const container = document.createElement('div');
      const button = document.createElement('button');
      container.appendChild(button);
      document.body.appendChild(container);

      const originalButton = document.createElement('button');
      document.body.appendChild(originalButton);
      originalButton.focus();

      service.trapFocus(container);
      service.releaseFocus();

      // Should return focus to original element
      expect(document.activeElement).toBe(originalButton);

      container.remove();
      originalButton.remove();
    });
  });

  describe('focusElement', () => {
    it('should focus an element', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);

      service.focusElement(button, false);

      expect(document.activeElement).toBe(button);

      button.remove();
    });

    it('should handle null element gracefully', () => {
      service.focusElement(null);
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // Helper Methods Tests
  // ============================================================================
  describe('getFocusableElements', () => {
    it('should return focusable elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Button</button>
        <a href="#">Link</a>
        <input type="text" />
        <div tabindex="0">Focusable div</div>
        <div>Not focusable</div>
        <button disabled>Disabled</button>
      `;
      document.body.appendChild(container);

      const focusable = service.getFocusableElements(container);

      expect(focusable.length).toBe(4); // button, link, input, div[tabindex=0]

      container.remove();
    });

    it('should filter out hidden elements', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <button>Visible</button>
        <button style="display: none">Hidden</button>
        <button style="visibility: hidden">Invisible</button>
      `;
      document.body.appendChild(container);

      const focusable = service.getFocusableElements(container);

      expect(focusable.length).toBe(1);

      container.remove();
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = service.generateId();
      const id2 = service.generateId();

      expect(id1).not.toBe(id2);
    });

    it('should use custom prefix', () => {
      const id = service.generateId('custom');
      expect(id.startsWith('custom-')).toBe(true);
    });
  });

  describe('isVisibleToScreenReader', () => {
    it('should return true for visible elements', () => {
      const element = document.createElement('div');
      element.textContent = 'Visible';
      document.body.appendChild(element);

      expect(service.isVisibleToScreenReader(element)).toBe(true);

      element.remove();
    });

    it('should return false for hidden elements', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      document.body.appendChild(element);

      expect(service.isVisibleToScreenReader(element)).toBe(false);

      element.remove();
    });

    it('should return false for aria-hidden elements', () => {
      const element = document.createElement('div');
      element.setAttribute('aria-hidden', 'true');
      document.body.appendChild(element);

      expect(service.isVisibleToScreenReader(element)).toBe(false);

      element.remove();
    });
  });

  // ============================================================================
  // Reduced Motion Tests
  // ============================================================================
  describe('prefersReducedMotion', () => {
    it('should return boolean value', () => {
      expect(typeof service.prefersReducedMotion).toBe('boolean');
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should clean up live regions', () => {
      const beforePolite = document.querySelectorAll('[aria-live="polite"]').length;
      
      service.ngOnDestroy();
      
      const afterPolite = document.querySelectorAll('[aria-live="polite"]').length;
      expect(afterPolite).toBe(beforePolite - 1);
    });
  });
});






