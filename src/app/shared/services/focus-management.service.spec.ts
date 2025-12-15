import { NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LoggingService } from '../../core/services/logging.service';
import { FocusManagementService } from './focus-management.service';

describe('FocusManagementService', () => {
  let service: FocusManagementService;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let ngZone: jasmine.SpyObj<NgZone>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'warn']);
    const ngZoneSpy = jasmine.createSpyObj('NgZone', ['runOutsideAngular']);

    TestBed.configureTestingModule({
      providers: [
        FocusManagementService,
        { provide: LoggingService, useValue: loggingSpy },
        { provide: NgZone, useValue: ngZoneSpy },
      ],
    });
    service = TestBed.inject(FocusManagementService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    ngZone = TestBed.inject(NgZone) as jasmine.SpyObj<NgZone>;

    ngZone.runOutsideAngular.and.callFake(<T>(fn: (...args: any[]) => T) => fn());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('focusElement', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="test-element">Test</div>';
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should focus element by ID', () => {
      const element = document.getElementById('test-element') as HTMLElement;
      spyOn(element, 'focus');

      service.focusElement('test-element');

      expect(element.focus).toHaveBeenCalled();
    });

    it('should focus element by selector', () => {
      const element = document.getElementById('test-element') as HTMLElement;
      spyOn(element, 'focus');

      service.focusElement('#test-element');

      expect(element.focus).toHaveBeenCalled();
    });

    it('should focus element directly', () => {
      const element = document.getElementById('test-element') as HTMLElement;
      spyOn(element, 'focus');

      service.focusElement(element);

      expect(element.focus).toHaveBeenCalled();
    });

    it('should warn if element not found', () => {
      service.focusElement('non-existent');

      expect(loggingService.warn).toHaveBeenCalledWith(
        'Element not found: non-existent',
        'FocusManagementService'
      );
    });
  });

  describe('getFocusableElements', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="container">
          <button>Button</button>
          <a href="#">Link</a>
          <input type="text">
          <div tabindex="0">Focusable div</div>
          <div style="display: none">Hidden</div>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should return all focusable elements', () => {
      const container = document.getElementById('container') as HTMLElement;
      const focusable = service.getFocusableElements(container);

      expect(focusable.length).toBe(4); // button, link, input, div with tabindex
    });

    it('should exclude hidden elements', () => {
      const container = document.getElementById('container') as HTMLElement;
      const focusable = service.getFocusableElements(container);

      const hasHidden = focusable.some((el) => el.style.display === 'none');
      expect(hasHidden).toBe(false);
    });
  });

  describe('trapFocus', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="container">
          <button id="first">First</button>
          <button id="second">Second</button>
          <button id="third">Third</button>
        </div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should trap focus within container', () => {
      const container = document.getElementById('container') as HTMLElement;
      const firstButton = document.getElementById('first') as HTMLElement;
      const thirdButton = document.getElementById('third') as HTMLElement;

      spyOn(firstButton, 'focus');
      spyOn(thirdButton, 'focus');

      const trapId = service.trapFocus(container);

      expect(firstButton.focus).toHaveBeenCalled();

      // Simulate Tab on last element
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      thirdButton.dispatchEvent(event);

      // Should wrap to first
      expect(firstButton.focus).toHaveBeenCalledTimes(2);

      service.releaseTrap(trapId);
    });

    it('should return release function when using trapFocusWithRelease', () => {
      const container = document.getElementById('container') as HTMLElement;
      const release = service.trapFocusWithRelease(container);

      expect(typeof release).toBe('function');
      expect(() => release()).not.toThrow();
    });
  });

  describe('saveFocus', () => {
    it('should return restore function', () => {
      const restore = service.saveFocus();

      expect(typeof restore).toBe('function');
    });
  });
});

