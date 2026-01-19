import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config';
// CRITICAL: Import BaseSectionComponent to ensure it's in the main bundle and loads before any child components
// This prevents "Class extends value undefined" errors when section components in other chunks try to extend it
import { BaseSectionComponent } from '@osi-cards/lib/components/sections/base-section.component';

// Suppress console errors for debug log server requests (expected when server is not running)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  const shouldSuppress = (args: any[]): boolean => {
    // Check all arguments for debug log server references
    const fullMessage = args.map((arg) => String(arg || '')).join(' ');
    if (
      fullMessage.includes('127.0.0.1:7242') ||
      fullMessage.includes('localhost:7242') ||
      fullMessage.includes('/ingest/') ||
      fullMessage.includes('7242') ||
      (fullMessage.includes('400') && fullMessage.includes('Bad Request'))
    ) {
      return true;
    }

    // Also check individual arguments
    for (const arg of args) {
      const str = String(arg || '');
      if (
        str.includes('127.0.0.1:7242') ||
        str.includes('localhost:7242') ||
        str.includes('/ingest/') ||
        str.includes('7242')
      ) {
        return true;
      }
    }
    return false;
  };

  console.error = (...args: any[]) => {
    if (shouldSuppress(args)) {
      return; // Suppress debug log server errors
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: any[]) => {
    if (shouldSuppress(args)) {
      return; // Suppress debug log server warnings
    }
    originalWarn.apply(console, args);
  };

  // Also suppress network errors via window.onerror
  const originalOnError = window.onerror;
  window.onerror = function (msg, source, lineno, colno, error) {
    const msgStr = String(msg || '');
    const sourceStr = String(source || '');
    // Suppress errors related to debug log server
    if (
      msgStr.includes('127.0.0.1:7242') ||
      msgStr.includes('localhost:7242') ||
      msgStr.includes('/ingest/') ||
      msgStr.includes('7242') ||
      sourceStr.includes('7242') ||
      (msgStr.includes('400') && msgStr.includes('Bad Request'))
    ) {
      return true; // Suppress
    }
    if (originalOnError) {
      return originalOnError.call(this, msg, source, lineno, colno, error);
    }
    return false;
  };

  // Suppress unhandled promise rejections for debug log server
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    const msgStr = String(reason?.message || reason || '');
    if (
      msgStr.includes('127.0.0.1:7242') ||
      msgStr.includes('localhost:7242') ||
      msgStr.includes('/ingest/') ||
      msgStr.includes('7242') ||
      (msgStr.includes('400') && msgStr.includes('Bad Request'))
    ) {
      event.preventDefault(); // Suppress
    }
  });
}

// Force BaseSectionComponent into main bundle by actually using it (can't be optimized away)
// Store reference globally to ensure it's never tree-shaken
if (typeof window !== 'undefined') {
  (window as any).__BaseSectionComponentForced = BaseSectionComponent;
  // Also verify it's actually a constructor
  if (typeof BaseSectionComponent !== 'function') {
    console.error(
      '[FATAL] BaseSectionComponent is not a function in main.ts!',
      typeof BaseSectionComponent
    );
  } else {
    console.log('[DEBUG] BaseSectionComponent loaded in main.ts:', BaseSectionComponent.name);
  }
}

/**
 * Handle module loading errors that occur during bootstrap
 * This runs IMMEDIATELY and aggressively to recover from chunk loading failures
 */
function handleBootstrapError(error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error || '');

  // Check for chunk/module loading errors - be very broad in detection
  const isChunkError =
    errorMessage.includes('Importing a module script failed') ||
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('chunk') ||
    errorMessage.includes('404') ||
    errorMessage.includes('Failed to load resource');

  if (isChunkError) {
    console.error('🔴 CRITICAL: Module loading failed:', errorMessage);
    console.warn('🚀 IMMEDIATE RECOVERY: Clearing cache and reloading...');

    // IMMEDIATE recovery - don't wait for service workers
    const performImmediateRecovery = () => {
      const isDev =
        window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (isDev) {
        console.warn('⚠️ DEVELOPMENT MODE: Missing chunk file detected.');
        console.warn('💡 SUGGESTION: Run "npm start" to rebuild the application.');
      }

      // Clear service workers in parallel, but don't wait
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((registrations) => {
            if (registrations.length > 0) {
              console.log(`Clearing ${registrations.length} service worker(s)...`);
              return Promise.all(registrations.map((registration) => registration.unregister()));
            }
            return undefined;
          })
          .catch(() => {
            // Ignore errors, just reload
          })
          .finally(() => {
            // Always reload, even if service worker clearing fails
            console.log('✅ Reloading page NOW...');
            // Use replace to prevent back button issues, clear query params
            const currentHref = window.location?.href;
            if (currentHref && typeof currentHref === 'string' && currentHref.length > 0) {
              const parts = currentHref.split('?')[0]?.split('#')[0];
              const cleanUrl = parts && parts.length > 0 ? parts : currentHref;
              if (cleanUrl && cleanUrl.length > 0) {
                window.location.replace(cleanUrl);
              } else {
                window.location.reload();
              }
            } else {
              window.location.reload();
            }
          });
      } else {
        // No service worker, reload immediately
        console.log('✅ Reloading page NOW (no service worker)...');
        const currentHref = window.location?.href;
        if (currentHref && typeof currentHref === 'string' && currentHref.length > 0) {
          const parts = currentHref.split('?')[0]?.split('#')[0];
          const cleanUrl = parts && parts.length > 0 ? parts : currentHref;
          if (cleanUrl && cleanUrl.length > 0) {
            window.location.replace(cleanUrl);
          } else {
            window.location.reload();
          }
        } else {
          window.location.reload();
        }
      }
    };

    // Execute immediately
    performImmediateRecovery();
  } else {
    console.error('Bootstrap error:', error);
  }
}

// Set up global error handlers before bootstrap
if (typeof window !== 'undefined') {
  // Track if we've already attempted recovery to prevent loops
  const recoveryKey = 'osi-recovery-attempted';
  const maxRecoveryAttempts = 3;

  const shouldAttemptRecovery = (): boolean => {
    const attempts = sessionStorage.getItem(recoveryKey);
    if (!attempts) {
      sessionStorage.setItem(recoveryKey, '1');
      return true;
    }
    const count = parseInt(attempts, 10);
    if (count >= maxRecoveryAttempts) {
      console.warn('⚠️ Max recovery attempts reached. Manual refresh required.');
      return false;
    }
    sessionStorage.setItem(recoveryKey, (count + 1).toString());
    return true;
  };

  // Handle window errors - catch 404s on chunk files
  window.addEventListener(
    'error',
    (event) => {
      const error = event.error || event.message || '';
      const errorMessage = error instanceof Error ? error.message : String(error);
      const filename = event.filename || '';
      const target = event.target as HTMLElement | null;

      // Check for chunk loading errors (JS and CSS)
      // Include both 404 and 500 errors for chunk files
      const isChunkError =
        errorMessage.includes('Importing a module script failed') ||
        errorMessage.includes('Failed to fetch dynamically imported module') ||
        errorMessage.includes('chunk') ||
        filename.includes('chunk-') ||
        (target && (target as any).src?.includes('chunk-')) ||
        (target && (target as any).href?.includes('chunk-')) ||
        (event.message &&
          (event.message.includes('404') || event.message.includes('500')) &&
          (filename.includes('.js') || filename.includes('.css')));

      if (isChunkError && shouldAttemptRecovery()) {
        console.error('🔴 Window error - Chunk loading failed:', {
          message: errorMessage,
          filename,
          target: target?.tagName,
        });
        handleBootstrapError(error || event);
      }
    },
    true
  ); // Use capture phase to catch errors early

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const errorMessage = reason instanceof Error ? reason.message : String(reason || '');

    const isChunkError =
      errorMessage.includes('Importing a module script failed') ||
      errorMessage.includes('Failed to fetch dynamically imported module') ||
      errorMessage.includes('chunk') ||
      errorMessage.includes('404') ||
      errorMessage.includes('500');

    if (isChunkError && shouldAttemptRecovery()) {
      console.error('🔴 Unhandled rejection - Chunk loading failed:', errorMessage);
      handleBootstrapError(reason);
    }
  });
}

// #region agent log - Track BaseSectionComponent availability at bootstrap
if (typeof window !== 'undefined') {
  try {
    // Try to import and check BaseSectionComponent
    import('@osi-cards/lib/components/sections/base-section.component')
      .then((module) => {
        fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.ts:164',
            message: 'Dynamic import BaseSectionComponent at bootstrap',
            data: {
              imported: typeof module.BaseSectionComponent !== 'undefined',
              isConstructor: typeof module.BaseSectionComponent === 'function',
              name: module.BaseSectionComponent?.name || 'undefined',
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
      })
      .catch((err) => {
        fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'main.ts:164',
            message: 'Failed to dynamically import BaseSectionComponent',
            data: { error: err?.message || String(err) },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'D',
          }),
        }).catch(() => {});
      });
  } catch (err) {
    fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'main.ts:164',
        message: 'Error checking BaseSectionComponent at bootstrap',
        data: { error: err instanceof Error ? err.message : String(err) },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run1',
        hypothesisId: 'D',
      }),
    }).catch(() => {});
  }
}
// #endregion

// #region agent log - Enhanced error handler for class extension errors
const originalErrorHandler = window.onerror;
window.onerror = function (msg, source, lineno, colno, error) {
  const msgStr = String(msg || '');
  if (
    msgStr.includes('extends value undefined') ||
    msgStr.includes('not a constructor') ||
    msgStr.includes('not a constructor or null')
  ) {
    const errorData = {
      message: msgStr,
      source: String(source || ''),
      lineno,
      colno,
      errorMessage: error?.message,
      errorStack: error?.stack,
      baseClassGlobal:
        typeof window !== 'undefined' ? typeof (window as any).__BaseSectionComponent : 'N/A',
      baseClassForced:
        typeof window !== 'undefined' ? typeof (window as any).__BaseSectionComponentForced : 'N/A',
      timestamp: Date.now(),
    };
    console.error('[FATAL ERROR CAUGHT] Class extends undefined:', errorData);
    fetch('http://127.0.0.1:7242/ingest/cda34362-e921-4930-ae25-e92145425dbc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'main.ts:window.onerror',
        message: 'CAUGHT: Class extends undefined error',
        data: errorData,
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'run3',
        hypothesisId: 'ALL',
      }),
    }).catch(() => {});
  }
  if (originalErrorHandler) {
    return originalErrorHandler.call(this, msg, source, lineno, colno, error);
  }
  return false;
};
// #endregion

bootstrapApplication(AppComponent, config).catch(handleBootstrapError);
