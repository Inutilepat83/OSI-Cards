import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  focusVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private settings$ = new BehaviorSubject<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
    focusVisible: true
  });

  get settings() {
    return this.settings$.asObservable();
  }

  get currentSettings() {
    return this.settings$.value;
  }

  // Update accessibility settings
  updateSettings(newSettings: Partial<AccessibilitySettings>): void {
    const current = this.settings$.value;
    const updated = { ...current, ...newSettings };
    this.settings$.next(updated);
    this.applySettings(updated);
  }

  // Toggle high contrast mode
  toggleHighContrast(): void {
    const current = this.settings$.value.highContrast;
    this.updateSettings({ highContrast: !current });
  }

  // Toggle reduced motion
  toggleReducedMotion(): void {
    const current = this.settings$.value.reducedMotion;
    this.updateSettings({ reducedMotion: !current });
  }

  // Set font size
  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.updateSettings({ fontSize: size });
  }

  // Apply settings to document
  private applySettings(settings: AccessibilitySettings): void {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      html.setAttribute('data-high-contrast', 'true');
    } else {
      html.removeAttribute('data-high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      html.setAttribute('data-reduced-motion', 'true');
    } else {
      html.removeAttribute('data-reduced-motion');
    }

    // Font size
    html.setAttribute('data-font-size', settings.fontSize);

    // Focus visible
    if (settings.focusVisible) {
      html.setAttribute('data-focus-visible', 'true');
    } else {
      html.removeAttribute('data-focus-visible');
    }
  }

  // Initialize accessibility features
  initialize(): void {
    // Check for user's system preferences
    this.checkSystemPreferences();

    // Set up keyboard navigation
    this.setupKeyboardNavigation();

    // Apply initial settings
    this.applySettings(this.currentSettings);
  }

  private checkSystemPreferences(): void {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.updateSettings({ reducedMotion: true });
    }

    // Check for high contrast preference
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (prefersHighContrast) {
      this.updateSettings({ highContrast: true });
    }
  }

  private setupKeyboardNavigation(): void {
    if (typeof document === 'undefined') return;

    // Ensure focus is visible
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.documentElement.setAttribute('data-focus-visible', 'true');
      }
    });

    // Handle focus management for modals and dialogs
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        // Close modals, menus, etc.
        this.handleEscapeKey();
      }
    });
  }

  private handleEscapeKey(): void {
    // Close any open modals, dropdowns, etc.
    const openElements = document.querySelectorAll('[aria-expanded="true"]');
    openElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.setAttribute('aria-expanded', 'false');
    });
  }

  // Announce content to screen readers
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (typeof document === 'undefined') return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Skip to main content
  skipToMain(): void {
    const mainContent = document.querySelector('main, [role="main"]');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      this.announce('Skipped to main content');
    }
  }
}
