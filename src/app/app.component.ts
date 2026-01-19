import { CommonModule } from '@angular/common';
import { Component, inject, isDevMode, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ThemeService } from '../../projects/osi-cards-lib/src/lib/themes/theme.service';
import { getVersionString, VERSION_INFO } from '../version';
import { PerformanceService } from './core';
import { FileLoggingService } from './core/services/file-logging.service';
import { LoggingService } from './core/services/logging.service';
import { sendDebugLog } from './core/utils/debug-log.util';
import { ErrorDisplayComponent } from './shared/components/error-display/error-display.component';
// Force eager loading of BaseSectionComponent to ensure it's available when child classes extend it
import { BaseSectionComponent } from '@osi-cards/lib/components/sections/base-section.component';
// #region agent log
sendDebugLog({
  location: 'app.component.ts:12',
  message: 'App component - BaseSectionComponent import check',
  data: {
    imported: typeof BaseSectionComponent !== 'undefined',
    isConstructor: typeof BaseSectionComponent === 'function',
    isUndefined: typeof BaseSectionComponent === 'undefined',
    name: BaseSectionComponent?.name || 'undefined',
    hasStaticProp: !!BaseSectionComponent?.__DEBUG_BASE_CLASS_DEFINED,
  },
  timestamp: Date.now(),
  sessionId: 'debug-session',
  runId: 'run1',
  hypothesisId: 'D',
});
// #endregion

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
  private readonly loggingService = inject(LoggingService);
  private readonly destroy$ = new Subject<void>();

  public ngOnInit(): void {
    // #region agent log
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const htmlBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
    const bodyBg = getComputedStyle(document.body).getPropertyValue('--background');
    const appRootBg = getComputedStyle(
      document.querySelector('app-root') || document.body
    ).getPropertyValue('--background');
    sendDebugLog({
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
    });
    // #endregion

    // Subscribe to theme changes for any additional app-level logic
    this.themeService.resolvedTheme$.pipe(takeUntil(this.destroy$)).subscribe((theme) => {
      // #region agent log
      const newHtmlTheme = document.documentElement.getAttribute('data-theme');
      const newHtmlBg = getComputedStyle(document.documentElement).getPropertyValue('--background');
      const newBodyBg = getComputedStyle(document.body).getPropertyValue('--background');
      sendDebugLog({
        location: 'app.component.ts:57',
        message: 'AppComponent: Theme changed',
        data: { newTheme: theme, newHtmlTheme, newHtmlBg, newBodyBg },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'E',
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

    // #region agent log - Test logging functionality
    // Only run test logging in dev mode with explicit debug flag
    if (isDevMode() && localStorage.getItem('__ENABLE_LOGGING_TEST') === 'true') {
      try {
        const VERIFICATION_TIMEOUT_MS = 500;
        const MIN_EXPECTED_LOGS = 3;

        // Test LoggingService (app-level)
        this.loggingService.info('LoggingService test: Info log', 'AppComponent', {
          test: 'logging-verification',
        });
        this.loggingService.warn('LoggingService test: Warning log', 'AppComponent', {
          test: 'logging-verification',
        });
        this.loggingService.error('LoggingService test: Error log', 'AppComponent', {
          test: 'logging-verification',
        });

        // Test localStorage access via static method
        setTimeout(() => {
          try {
            const appLogs = LoggingService.getLogsFromLocalStorage();
            const appLogsCount = appLogs.length;
            const hasRecentLogs = appLogsCount > 0;
            const latestLog = appLogs.length > 0 ? appLogs[appLogs.length - 1] : null;

            // Send verification log
            sendDebugLog({
              location: 'app.component.ts:ngOnInit',
              message: 'LoggingService localStorage verification',
              data: {
                localStorageKey: 'osi-cards-app-logs',
                logsCount: appLogsCount,
                hasLogs: hasRecentLogs,
                latestLogMessage: latestLog?.message,
                latestLogLevel: latestLog?.level,
                latestLogTimestamp: latestLog?.timestamp?.toISOString(),
                verificationPassed: hasRecentLogs && appLogsCount >= MIN_EXPECTED_LOGS,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'logging-verification',
              hypothesisId: 'A',
            });

            // Test direct localStorage access
            const directStorage = localStorage.getItem('osi-cards-app-logs');
            const directStorageParsed = directStorage ? JSON.parse(directStorage) : null;
            const directStorageCount = directStorageParsed?.length || 0;

            sendDebugLog({
              location: 'app.component.ts:ngOnInit',
              message: 'Direct localStorage access verification',
              data: {
                directStorageExists: !!directStorage,
                directStorageCount,
                matchesStaticMethod: directStorageCount === appLogsCount,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'logging-verification',
              hypothesisId: 'B',
            });
          } catch (error) {
            sendDebugLog({
              location: 'app.component.ts:ngOnInit',
              message: 'Logging verification error in setTimeout',
              data: {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
              },
              timestamp: Date.now(),
              sessionId: 'debug-session',
              runId: 'logging-verification',
              hypothesisId: 'C',
            });
          }
        }, VERIFICATION_TIMEOUT_MS);
      } catch (error) {
        sendDebugLog({
          location: 'app.component.ts:ngOnInit',
          message: 'Logging verification error',
          data: {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'logging-verification',
          hypothesisId: 'C',
        });
      }
    }
    // #endregion
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
