#!/usr/bin/env node
/**
 * Check Browser Logs and Errors
 * 
 * Run this script in the browser console to extract all logs and errors.
 * 
 * Usage in browser console:
 *   Copy and paste the entire script, or use:
 *   const script = document.createElement('script');
 *   script.src = '/scripts/check-browser-logs.js';
 *   document.head.appendChild(script);
 * 
 * Or run directly:
 *   node scripts/check-browser-logs.js (for instructions)
 */

(function() {
  'use strict';

  // Check if running in browser
  if (typeof window === 'undefined') {
    console.log('Browser Log Checker');
    console.log('==================');
    console.log('');
    console.log('This script must be run in the browser console.');
    console.log('');
    console.log('Instructions:');
    console.log('1. Open your browser DevTools (F12 or Cmd+Option+I)');
    console.log('2. Go to the Console tab');
    console.log('3. Copy and paste the following code:');
    console.log('');
    console.log('--- START CODE ---');
    console.log(`
      (function() {
        const report = {
          timestamp: new Date().toISOString(),
          localStorageLogs: {},
          consoleErrors: [],
          consoleWarnings: [],
          errorTracking: {},
          summary: {}
        };

        // Check localStorage logs
        try {
          const libLogs = JSON.parse(localStorage.getItem('osi-cards-logs') || '[]');
          report.localStorageLogs.library = {
            count: libLogs.length,
            errors: libLogs.filter(l => l.level === 'error'),
            warnings: libLogs.filter(l => l.level === 'warn'),
            all: libLogs
          };
        } catch (e) {
          report.localStorageLogs.library = { error: e.message };
        }

        try {
          const appLogs = JSON.parse(localStorage.getItem('osi-cards-app-logs') || '[]');
          report.localStorageLogs.app = {
            count: appLogs.length,
            errors: appLogs.filter(l => l.level === 'error'),
            warnings: appLogs.filter(l => l.level === 'warn'),
            all: appLogs
          };
        } catch (e) {
          report.localStorageLogs.app = { error: e.message };
        }

        // Check other localStorage keys
        const otherKeys = ['masonry-grid-logs', 'spacing-debug-logs', 'osi-cards-state'];
        report.localStorageLogs.other = {};
        otherKeys.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              try {
                report.localStorageLogs.other[key] = JSON.parse(value);
              } catch {
                report.localStorageLogs.other[key] = value.substring(0, 100) + '...';
              }
            }
          } catch (e) {
            report.localStorageLogs.other[key] = { error: e.message };
          }
        });

        // Check console errors (if available via performance API)
        if (window.performance && window.performance.getEntriesByType) {
          const resourceEntries = window.performance.getEntriesByType('resource');
          const failedResources = resourceEntries.filter(entry => {
            return entry.transferSize === 0 && entry.decodedBodySize === 0 && entry.name.includes('http');
          });
          if (failedResources.length > 0) {
            report.consoleErrors.push(...failedResources.map(r => ({
              type: 'resource',
              message: \`Failed to load: \${r.name}\`,
              name: r.name
            })));
          }
        }

        // Generate summary
        const totalErrors = (report.localStorageLogs.library?.errors?.length || 0) + 
                           (report.localStorageLogs.app?.errors?.length || 0) + 
                           report.consoleErrors.length;
        const totalWarnings = (report.localStorageLogs.library?.warnings?.length || 0) + 
                             (report.localStorageLogs.app?.warnings?.length || 0) + 
                             report.consoleWarnings.length;

        report.summary = {
          totalErrors,
          totalWarnings,
          libraryLogs: report.localStorageLogs.library?.count || 0,
          appLogs: report.localStorageLogs.app?.count || 0,
          hasErrors: totalErrors > 0,
          hasWarnings: totalWarnings > 0
        };

        // Output report
        console.log('%c=== Browser Logs and Errors Report ===', 'font-size: 16px; font-weight: bold; color: #ff7900;');
        console.log('Timestamp:', report.timestamp);
        console.log('');
        console.log('%cSummary', 'font-size: 14px; font-weight: bold;');
        console.table(report.summary);
        console.log('');
        
        if (totalErrors > 0) {
          console.log('%cErrors Found:', 'font-size: 14px; font-weight: bold; color: #dc3545;');
          if (report.localStorageLogs.library?.errors?.length > 0) {
            console.log('Library Errors:', report.localStorageLogs.library.errors);
          }
          if (report.localStorageLogs.app?.errors?.length > 0) {
            console.log('App Errors:', report.localStorageLogs.app.errors);
          }
          if (report.consoleErrors.length > 0) {
            console.log('Console Errors:', report.consoleErrors);
          }
          console.log('');
        }

        if (totalWarnings > 0) {
          console.log('%cWarnings Found:', 'font-size: 14px; font-weight: bold; color: #ffc107;');
          if (report.localStorageLogs.library?.warnings?.length > 0) {
            console.log('Library Warnings:', report.localStorageLogs.library.warnings);
          }
          if (report.localStorageLogs.app?.warnings?.length > 0) {
            console.log('App Warnings:', report.localStorageLogs.app.warnings);
          }
          console.log('');
        }

        console.log('%cFull Report:', 'font-size: 14px; font-weight: bold;');
        console.log(report);

        // Export to window for easy access
        window.__osiCardsLogReport = report;
        console.log('');
        console.log('%cReport saved to window.__osiCardsLogReport', 'color: #0dcaf0;');
        console.log('Access it with: window.__osiCardsLogReport');

        return report;
      })();
    `);
    console.log('--- END CODE ---');
    return;
  }

  // Browser execution
  const report = {
    timestamp: new Date().toISOString(),
    localStorageLogs: {},
    consoleErrors: [],
    consoleWarnings: [],
    errorTracking: {},
    summary: {}
  };

  // Check localStorage logs
  try {
    const libLogs = JSON.parse(localStorage.getItem('osi-cards-logs') || '[]');
    report.localStorageLogs.library = {
      count: libLogs.length,
      errors: libLogs.filter(l => l.level === 'error'),
      warnings: libLogs.filter(l => l.level === 'warn'),
      all: libLogs
    };
  } catch (e) {
    report.localStorageLogs.library = { error: e.message };
  }

  try {
    const appLogs = JSON.parse(localStorage.getItem('osi-cards-app-logs') || '[]');
    report.localStorageLogs.app = {
      count: appLogs.length,
      errors: appLogs.filter(l => l.level === 'error'),
      warnings: appLogs.filter(l => l.level === 'warn'),
      all: appLogs
    };
  } catch (e) {
    report.localStorageLogs.app = { error: e.message };
  }

  // Check other localStorage keys
  const otherKeys = ['masonry-grid-logs', 'spacing-debug-logs', 'osi-cards-state'];
  report.localStorageLogs.other = {};
  otherKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          report.localStorageLogs.other[key] = JSON.parse(value);
        } catch {
          report.localStorageLogs.other[key] = value.substring(0, 100) + '...';
        }
      }
    } catch (e) {
      report.localStorageLogs.other[key] = { error: e.message };
    }
  });

  // Check console errors (if available via performance API)
  if (window.performance && window.performance.getEntriesByType) {
    const resourceEntries = window.performance.getEntriesByType('resource');
    const failedResources = resourceEntries.filter(entry => {
      return entry.transferSize === 0 && entry.decodedBodySize === 0 && entry.name.includes('http');
    });
    if (failedResources.length > 0) {
      report.consoleErrors.push(...failedResources.map(r => ({
        type: 'resource',
        message: `Failed to load: ${r.name}`,
        name: r.name
      })));
    }
  }

  // Generate summary
  const totalErrors = (report.localStorageLogs.library?.errors?.length || 0) + 
                     (report.localStorageLogs.app?.errors?.length || 0) + 
                     report.consoleErrors.length;
  const totalWarnings = (report.localStorageLogs.library?.warnings?.length || 0) + 
                       (report.localStorageLogs.app?.warnings?.length || 0) + 
                       report.consoleWarnings.length;

  report.summary = {
    totalErrors,
    totalWarnings,
    libraryLogs: report.localStorageLogs.library?.count || 0,
    appLogs: report.localStorageLogs.app?.count || 0,
    hasErrors: totalErrors > 0,
    hasWarnings: totalWarnings > 0
  };

  // Output report
  console.log('%c=== Browser Logs and Errors Report ===', 'font-size: 16px; font-weight: bold; color: #ff7900;');
  console.log('Timestamp:', report.timestamp);
  console.log('');
  console.log('%cSummary', 'font-size: 14px; font-weight: bold;');
  console.table(report.summary);
  console.log('');
  
  if (totalErrors > 0) {
    console.log('%cErrors Found:', 'font-size: 14px; font-weight: bold; color: #dc3545;');
    if (report.localStorageLogs.library?.errors?.length > 0) {
      console.log('Library Errors:', report.localStorageLogs.library.errors);
    }
    if (report.localStorageLogs.app?.errors?.length > 0) {
      console.log('App Errors:', report.localStorageLogs.app.errors);
    }
    if (report.consoleErrors.length > 0) {
      console.log('Console Errors:', report.consoleErrors);
    }
    console.log('');
  }

  if (totalWarnings > 0) {
    console.log('%cWarnings Found:', 'font-size: 14px; font-weight: bold; color: #ffc107;');
    if (report.localStorageLogs.library?.warnings?.length > 0) {
      console.log('Library Warnings:', report.localStorageLogs.library.warnings);
    }
    if (report.localStorageLogs.app?.warnings?.length > 0) {
      console.log('App Warnings:', report.localStorageLogs.app.warnings);
    }
    console.log('');
  }

  console.log('%cFull Report:', 'font-size: 14px; font-weight: bold;');
  console.log(report);

  // Export to window for easy access
  window.__osiCardsLogReport = report;
  console.log('');
  console.log('%cReport saved to window.__osiCardsLogReport', 'color: #0dcaf0;');
  console.log('Access it with: window.__osiCardsLogReport');

  return report;
})();
