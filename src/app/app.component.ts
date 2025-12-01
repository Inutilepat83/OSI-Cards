import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ErrorDisplayComponent } from './shared/components/error-display/error-display.component';
import { PerformanceService } from './core';
import { getVersionString, VERSION_INFO } from '../version';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ErrorDisplayComponent],
  template: `
    <div class="app-root">
      <div class="app-container">
        <router-outlet></router-outlet>
      </div>

      <app-error-display></app-error-display>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .app-root {
        min-height: 100vh;
        width: 100%;
        background: var(--background);
        color: var(--foreground);
        display: flex;
        flex-direction: column;
        /* No transition for instant theme switching */
      }

      .app-container {
        flex: 1;
        background: var(--background);
        color: var(--foreground);
      }
    `,
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  theme: 'day' | 'night' = 'night';
  private readonly document = inject(DOCUMENT);
  private readonly performanceService = inject(PerformanceService);

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('osi-theme');
      if (storedTheme === 'day' || storedTheme === 'night') {
        this.theme = storedTheme;
      }
    }
    this.applyTheme();

    // Initialize performance monitoring
    this.performanceService.initialize();

    // Log version info in development
    if (typeof console !== 'undefined') {
      console.log(
        `%cOSI Cards ${getVersionString()}`,
        'color: #1976d2; font-weight: bold; font-size: 14px;'
      );
      console.log(
        `Build: ${VERSION_INFO.buildHash} | Branch: ${VERSION_INFO.buildBranch} | Date: ${new Date(VERSION_INFO.buildDate).toLocaleString()}`
      );
    }
  }

  ngOnDestroy(): void {
    // Performance service cleanup is handled automatically via OnDestroy interface
    // No explicit cleanup needed - intentionally empty
    void 0; // Satisfy linter requirement for non-empty method
  }

  toggleTheme(): void {
    this.theme = this.theme === 'night' ? 'day' : 'night';
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Batch DOM updates with requestAnimationFrame for smooth theme switching
    requestAnimationFrame(() => {
      const root = this.document.documentElement;
      root.dataset['theme'] = this.theme;
      localStorage.setItem('osi-theme', this.theme);
      // CSS variables and transitions handle styling automatically
      // No need for getComputedStyle() or manual body styling
    });
  }
}
