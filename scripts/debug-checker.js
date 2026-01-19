/**
 * Comprehensive Debug Checker
 * 
 * Automatically detects common performance and rendering issues
 * Run this in browser console to get a full diagnostic report
 */

(function runDebugCheck() {
  console.log('%c🔍 OSI Cards Debug Checker', 'color: #ff7900; font-size: 16px; font-weight: bold;');
  console.log('='.repeat(60));
  
  const issues = [];
  const warnings = [];
  const info = [];
  
  // Check 1: localStorage logs
  try {
    const logsJson = localStorage.getItem('osi-cards-debug-logs');
    if (logsJson) {
      const logs = JSON.parse(logsJson);
      info.push(`✅ Found ${logs.length} log entries in localStorage`);
      
      // Analyze logs for issues
      const slowOps = logs.filter(l => l.data?.duration && l.data.duration > 50);
      if (slowOps.length > 0) {
        issues.push(`⚠️  Found ${slowOps.length} slow operations (>50ms)`);
        slowOps.slice(0, 5).forEach(op => {
          issues.push(`   - ${op.location}: ${op.message} (${op.data.duration.toFixed(2)}ms)`);
        });
      }
      
      const errors = logs.filter(l => 
        l.message.toLowerCase().includes('error') || 
        l.message.toLowerCase().includes('fail')
      );
      if (errors.length > 0) {
        issues.push(`❌ Found ${errors.length} error logs`);
        errors.slice(0, 5).forEach(err => {
          issues.push(`   - ${err.location}: ${err.message}`);
        });
      }
      
      // Check for excessive calls
      const byLocation = {};
      logs.forEach(l => {
        byLocation[l.location] = (byLocation[l.location] || 0) + 1;
      });
      Object.entries(byLocation).forEach(([loc, count]) => {
        if (count > 100) {
          warnings.push(`⚠️  ${loc} called ${count} times (may be excessive)`);
        }
      });
    } else {
      warnings.push('⚠️  No logs found in localStorage - instrumentation may not be working');
    }
  } catch (e) {
    issues.push(`❌ Failed to read logs: ${e.message}`);
  }
  
  // Check 2: Performance API
  try {
    if (window.performance && window.performance.getEntriesByType) {
      const perfEntries = window.performance.getEntriesByType('measure');
      const longTasks = perfEntries.filter(e => e.duration > 50);
      if (longTasks.length > 0) {
        issues.push(`⚠️  Found ${longTasks.length} long tasks (>50ms) in performance API`);
      }
      
      const resourceErrors = window.performance.getEntriesByType('resource')
        .filter(r => r.responseEnd === 0 && r.duration > 0);
      if (resourceErrors.length > 0) {
        issues.push(`❌ Found ${resourceErrors.length} failed resource loads`);
      }
    }
  } catch (e) {
    warnings.push(`⚠️  Performance API check failed: ${e.message}`);
  }
  
  // Check 3: Angular errors
  try {
    const angularErrors = [];
    const originalError = console.error;
    // This won't catch past errors, but we can check for common patterns
    info.push('💡 Check browser console for Angular errors (NG0203, etc.)');
  } catch (e) {
    // Ignore
  }
  
  // Check 4: Component rendering
  try {
    const cards = document.querySelectorAll('app-ai-card-renderer');
    info.push(`✅ Found ${cards.length} card component(s) in DOM`);
    
    cards.forEach((card, i) => {
      const sections = card.querySelectorAll('app-card-section-list');
      const processedSections = card.querySelectorAll('.masonry-item, .section-card');
      
      if (sections.length === 0 && processedSections.length === 0) {
        issues.push(`❌ Card ${i + 1}: No sections rendered (empty card)`);
      } else {
        info.push(`✅ Card ${i + 1}: ${processedSections.length} sections rendered`);
      }
      
      // Check for frozen state (no recent updates)
      const cardElement = card.shadowRoot || card;
      const lastUpdate = cardElement.getAttribute('data-last-update');
      if (lastUpdate) {
        const age = Date.now() - parseInt(lastUpdate);
        if (age > 5000) {
          warnings.push(`⚠️  Card ${i + 1}: No updates for ${(age / 1000).toFixed(1)}s (may be frozen)`);
        }
      }
    });
  } catch (e) {
    warnings.push(`⚠️  Component check failed: ${e.message}`);
  }
  
  // Check 5: Memory usage
  try {
    if (performance.memory) {
      const memMB = performance.memory.usedJSHeapSize / 1048576;
      const memLimitMB = performance.memory.jsHeapSizeLimit / 1048576;
      const memPercent = (memMB / memLimitMB) * 100;
      
      info.push(`💾 Memory: ${memMB.toFixed(2)}MB / ${memLimitMB.toFixed(2)}MB (${memPercent.toFixed(1)}%)`);
      
      if (memPercent > 80) {
        issues.push(`⚠️  High memory usage: ${memPercent.toFixed(1)}%`);
      }
    }
  } catch (e) {
    // Memory API not available
  }
  
  // Check 6: Change detection cycles
  try {
    // Check if there are excessive timers
    const activeTimers = [];
    let timerCount = 0;
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = function(...args) {
      timerCount++;
      return originalSetTimeout.apply(this, args);
    };
    
    setTimeout(() => {
      if (timerCount > 100) {
        warnings.push(`⚠️  High timer activity: ${timerCount} setTimeout calls detected`);
      }
      window.setTimeout = originalSetTimeout;
    }, 1000);
  } catch (e) {
    // Ignore
  }
  
  // Check 7: Network requests
  try {
    if (window.performance && window.performance.getEntriesByType) {
      const networkEntries = window.performance.getEntriesByType('resource');
      const failedRequests = networkEntries.filter(e => 
        e.transferSize === 0 && e.decodedBodySize === 0 && e.duration > 100
      );
      if (failedRequests.length > 0) {
        warnings.push(`⚠️  ${failedRequests.length} potentially failed network requests`);
      }
    }
  } catch (e) {
    // Ignore
  }
  
  // Report results
  console.log('\n📊 DIAGNOSTIC REPORT\n');
  
  if (issues.length > 0) {
    console.log('%c❌ ISSUES FOUND:', 'color: red; font-weight: bold; font-size: 14px;');
    issues.forEach(issue => console.log(`  ${issue}`));
  } else {
    console.log('%c✅ No critical issues detected', 'color: green; font-weight: bold;');
  }
  
  if (warnings.length > 0) {
    console.log('\n%c⚠️  WARNINGS:', 'color: orange; font-weight: bold; font-size: 14px;');
    warnings.forEach(warning => console.log(`  ${warning}`));
  }
  
  if (info.length > 0) {
    console.log('\n%cℹ️  INFO:', 'color: blue; font-weight: bold; font-size: 14px;');
    info.forEach(i => console.log(`  ${i}`));
  }
  
  // Export logs if available
  console.log('\n💡 To export detailed logs, run: window.__osiCardsDebugLogs.export()');
  
  return {
    issues,
    warnings,
    info,
    timestamp: Date.now(),
  };
})();
