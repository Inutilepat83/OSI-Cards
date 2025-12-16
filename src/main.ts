import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config';

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

bootstrapApplication(AppComponent, config).catch(handleBootstrapError);
