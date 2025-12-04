import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ErrorDisplayComponent } from './shared/components/error-display/error-display.component';
import { PerformanceService } from './core';
import { getVersionString, VERSION_INFO } from '../version';
import { ThemeService } from '../../projects/osi-cards-lib/src/lib/themes/theme.service';
import { Subject, takeUntil } from 'rxjs';

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
  private readonly themeService = inject(ThemeService);
  private readonly performanceService = inject(PerformanceService);
  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Subscribe to theme changes for any additional app-level logic
    this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      // Theme is automatically applied by ThemeService
      // This subscription is for any additional app-level theme logic if needed
    });

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
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    // Use ThemeService for theme toggling
    this.themeService.toggleTheme();
  }
}
