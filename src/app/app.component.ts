import { CommonModule } from '@angular/common';
import { Component, inject, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../projects/osi-cards-lib/src/lib/themes/theme.service';
import { getVersionString, VERSION_INFO } from '../version';
import { PerformanceService } from './core';
import { FileLoggingService } from './core/services/file-logging.service';
import { ErrorDisplayComponent } from './shared/components/error-display/error-display.component';

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
  private readonly fileLogging = inject(FileLoggingService);
  private readonly destroy$ = new Subject<void>();

  public ngOnInit(): void {
    // #region agent log
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const htmlBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
    const bodyBg = getComputedStyle(document.body).getPropertyValue('--background');
    const appRootBg = getComputedStyle(
      document.querySelector('app-root') || document.body
    ).getPropertyValue('--background');
    fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'app.component.ts:54',
        message: 'AppComponent ngOnInit: Theme state',
        data: {
          htmlTheme,
          htmlBg,
          bodyBg,
          appRootBg,
          resolvedTheme: this.themeService.getResolvedTheme(),
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
      }),
    }).catch(() => {
      // Silently handle fetch errors for logging endpoint
    });
    // #endregion

    // Subscribe to theme changes for any additional app-level logic
    this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      // #region agent log
      const newHtmlTheme = document.documentElement.getAttribute('data-theme');
      const newHtmlBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
      const newBodyBg = getComputedStyle(document.body).getPropertyValue('--background');
      fetch('http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'app.component.ts:57',
          message: 'AppComponent: Theme changed',
          data: { newTheme: theme, newHtmlTheme, newHtmlBg, newBodyBg },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'E',
        }),
      }).catch(() => {
        // Silently handle fetch errors for logging endpoint
      });
      // #endregion
      // Theme is automatically applied by ThemeService
      // This subscription is for any additional app-level theme logic if needed
    });

    // Initialize performance monitoring
    this.performanceService.initialize();

    // Start automatic log sending to server (every 30 seconds)
    const AUTO_SEND_INTERVAL_MS = 30000;
    this.fileLogging.startAutoSend(AUTO_SEND_INTERVAL_MS);

    // Log version info in development
    if (typeof console !== 'undefined' && isDevMode()) {
      console.warn(
        `%cOSI Cards ${getVersionString()}`,
        'color: #1976d2; font-weight: bold; font-size: 14px;'
      );
      console.warn(
        `Build: ${VERSION_INFO.buildHash} | Branch: ${VERSION_INFO.buildBranch} | Date: ${new Date(VERSION_INFO.buildDate).toLocaleString()}`
      );
    }
  }

  public ngOnDestroy(): void {
    // Stop automatic log sending
    this.fileLogging.stopAutoSend();
    // Send any remaining logs before destroying
    void this.fileLogging.sendLogsToServer().catch(() => {
      // Silently handle errors when sending logs during destruction
    });
    this.destroy$.next();
    this.destroy$.complete();
  }

  public toggleTheme(): void {
    // Use ThemeService for theme toggling
    this.themeService.toggleTheme();
  }
}
