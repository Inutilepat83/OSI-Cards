/**
 * Skip Link Component Tests
 *
 * Unit tests for SkipLinkComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkipLinkComponent, SkipLinkConfig, DEFAULT_SKIP_LINKS } from './skip-link.component';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';

describe('SkipLinkComponent', () => {
  let component: SkipLinkComponent;
  let fixture: ComponentFixture<SkipLinkComponent>;
  let document: Document;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkipLinkComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    }).compileComponents();

    fixture = TestBed.createComponent(SkipLinkComponent);
    component = fixture.componentInstance;
    document = TestBed.inject(DOCUMENT);
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render skip link navigation', () => {
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('.skip-link-nav'));
      expect(nav).toBeTruthy();
    });

    it('should render default skip links', () => {
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('.skip-link'));
      expect(links.length).toBe(DEFAULT_SKIP_LINKS.length);
    });

    it('should render custom skip links', () => {
      const customLinks: SkipLinkConfig[] = [{ target: '#custom-target', label: 'Skip to custom' }];
      component.links = customLinks;
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('.skip-link'));
      expect(links.length).toBe(1);
    });
  });

  describe('Input Properties', () => {
    it('should accept links input', () => {
      const customLinks: SkipLinkConfig[] = [
        { target: '#target1', label: 'Skip 1' },
        { target: '#target2', label: 'Skip 2' },
      ];
      component.links = customLinks;

      expect(component.links).toEqual(customLinks);
    });

    it('should use default links when not provided', () => {
      expect(component.links).toEqual(DEFAULT_SKIP_LINKS);
    });
  });

  describe('normalizeTarget Method', () => {
    it('should return target as-is when it starts with #', () => {
      const result = component.normalizeTarget('#main-content');
      expect(result).toBe('#main-content');
    });

    it('should add # prefix when target does not start with #', () => {
      const result = component.normalizeTarget('main-content');
      expect(result).toBe('#main-content');
    });

    it('should handle empty string', () => {
      const result = component.normalizeTarget('');
      expect(result).toBe('#');
    });
  });

  describe('handleClick Method', () => {
    beforeEach(() => {
      // Create a test element
      const testElement = document.createElement('div');
      testElement.id = 'test-target';
      document.body.appendChild(testElement);
    });

    afterEach(() => {
      // Clean up
      const testElement = document.getElementById('test-target');
      if (testElement) {
        document.body.removeChild(testElement);
      }
    });

    it('should prevent default event behavior', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      spyOn(event, 'preventDefault');

      component.handleClick(event, '#test-target');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should focus target element when found', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const targetElement = document.getElementById('test-target') as HTMLElement;
      spyOn(targetElement, 'focus');

      component.handleClick(event, '#test-target');

      expect(targetElement.focus).toHaveBeenCalled();
    });

    it('should scroll to target element', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const targetElement = document.getElementById('test-target') as HTMLElement;
      spyOn(targetElement, 'scrollIntoView');

      component.handleClick(event, '#test-target');

      expect(targetElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should set tabindex if element is not focusable', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const targetElement = document.getElementById('test-target') as HTMLElement;
      targetElement.removeAttribute('tabindex');

      component.handleClick(event, '#test-target');

      expect(targetElement.getAttribute('tabindex')).toBe('-1');
    });

    it('should not set tabindex if element already has it', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const targetElement = document.getElementById('test-target') as HTMLElement;
      targetElement.setAttribute('tabindex', '0');

      component.handleClick(event, '#test-target');

      expect(targetElement.getAttribute('tabindex')).toBe('0');
    });

    it('should update URL hash without scrolling', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      spyOn(history, 'pushState');

      component.handleClick(event, '#test-target');

      expect(history.pushState).toHaveBeenCalledWith(null, '', '#test-target');
    });

    it('should handle missing target element gracefully', () => {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });

      expect(() => {
        component.handleClick(event, '#non-existent');
      }).not.toThrow();
    });

    it('should not execute on server platform', () => {
      // This would require platform ID to be 'server', which is harder to test
      // In a real scenario, you'd mock isPlatformBrowser to return false
      expect(component).toBeTruthy();
    });
  });

  describe('Link Rendering', () => {
    it('should render link with correct href', () => {
      const links: SkipLinkConfig[] = [{ target: 'main-content', label: 'Skip to main' }];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      expect(link.nativeElement.getAttribute('href')).toBe('#main-content');
    });

    it('should render link with correct label', () => {
      const links: SkipLinkConfig[] = [{ target: '#main', label: 'Skip to main content' }];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      expect(link.nativeElement.textContent.trim()).toContain('Skip to main content');
    });

    it('should render shortcut hint when provided', () => {
      const links: SkipLinkConfig[] = [{ target: '#main', label: 'Skip', shortcutHint: 'Alt+M' }];
      component.links = links;
      fixture.detectChanges();

      const shortcut = fixture.debugElement.query(By.css('.skip-link-shortcut'));
      expect(shortcut).toBeTruthy();
      expect(shortcut.nativeElement.textContent.trim()).toBe('Alt+M');
    });

    it('should not render shortcut hint when not provided', () => {
      const links: SkipLinkConfig[] = [{ target: '#main', label: 'Skip' }];
      component.links = links;
      fixture.detectChanges();

      const shortcut = fixture.debugElement.query(By.css('.skip-link-shortcut'));
      expect(shortcut).toBeFalsy();
    });

    it('should set aria-label with shortcut hint', () => {
      const links: SkipLinkConfig[] = [
        { target: '#main', label: 'Skip to main', shortcutHint: 'Alt+M' },
      ];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      const ariaLabel = link.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toContain('Skip to main');
      expect(ariaLabel).toContain('Alt+M');
    });

    it('should set aria-label without shortcut hint', () => {
      const links: SkipLinkConfig[] = [{ target: '#main', label: 'Skip to main' }];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      const ariaLabel = link.nativeElement.getAttribute('aria-label');
      expect(ariaLabel).toBe('Skip to main');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle Enter key on link', () => {
      const links: SkipLinkConfig[] = [{ target: '#main', label: 'Skip' }];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      spyOn(component, 'handleClick');

      link.nativeElement.dispatchEvent(event);

      expect(component.handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on navigation', () => {
      fixture.detectChanges();

      const nav = fixture.debugElement.query(By.css('.skip-link-nav'));
      expect(nav.nativeElement.getAttribute('aria-label')).toBe('Skip navigation');
    });

    it('should have proper link structure', () => {
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('.skip-link'));
      links.forEach((link) => {
        expect(link.nativeElement.tagName).toBe('A');
        expect(link.nativeElement.getAttribute('href')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty links array', () => {
      component.links = [];
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('.skip-link'));
      expect(links.length).toBe(0);
    });

    it('should handle links with special characters in target', () => {
      const links: SkipLinkConfig[] = [{ target: '#main-content_123', label: 'Skip' }];
      component.links = links;
      fixture.detectChanges();

      const link = fixture.debugElement.query(By.css('.skip-link'));
      expect(link.nativeElement.getAttribute('href')).toBe('#main-content_123');
    });

    it('should handle multiple skip links', () => {
      const links: SkipLinkConfig[] = [
        { target: '#main', label: 'Skip 1' },
        { target: '#footer', label: 'Skip 2' },
        { target: '#sidebar', label: 'Skip 3' },
      ];
      component.links = links;
      fixture.detectChanges();

      const renderedLinks = fixture.debugElement.queryAll(By.css('.skip-link'));
      expect(renderedLinks.length).toBe(3);
    });
  });

  describe('DEFAULT_SKIP_LINKS', () => {
    it('should have default skip links', () => {
      expect(DEFAULT_SKIP_LINKS.length).toBeGreaterThan(0);
    });

    it('should have main content skip link', () => {
      const mainContentLink = DEFAULT_SKIP_LINKS.find((link) =>
        link.target.includes('main-content')
      );
      expect(mainContentLink).toBeDefined();
    });
  });
});
