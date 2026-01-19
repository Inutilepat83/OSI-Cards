/**
 * Auto-Diagnose Script
 * 
 * Automatically runs all diagnostic checks and exports results
 * Run this in browser console to get comprehensive diagnostics
 */

(function autoDiagnose() {
  console.log('%c🔬 AUTO-DIAGNOSTIC STARTING...', 'color: #ff7900; font-size: 18px; font-weight: bold;');
  console.log('='.repeat(70));
  
  const diagnostics = {
    timestamp: Date.now(),
    logs: null,
    stats: null,
    performance: null,
    components: null,
    issues: [],
    warnings: [],
  };
  
  // 1. Check logs
  try {
    if (window.__osiCardsDebugLogs) {
      diagnostics.logs = window.__osiCardsDebugLogs.getLogs();
      diagnostics.stats = window.__osiCardsDebugLogs.getStats();
      
      console.log(`\n📊 Logs: ${diagnostics.stats.totalEntries} entries`);
      console.log(`   By location:`, diagnostics.stats.entriesByLocation);
      console.log(`   By hypothesis:`, diagnostics.stats.entriesByHypothesis);
      
      // Analyze for issues
      const slowOps = diagnostics.logs.filter(l => l.data?.duration && l.data.duration > 50);
      if (slowOps.length > 0) {
        diagnostics.issues.push(`Found ${slowOps.length} slow operations (>50ms)`);
        slowOps.slice(0, 3).forEach(op => {
          diagnostics.issues.push(`  - ${op.location}: ${op.message} (${op.data.duration.toFixed(2)}ms)`);
        });
      }
      
      // Check for empty sections issue
      const emptySectionLogs = diagnostics.logs.filter(l => 
        l.message.includes('All sections filtered') || 
        l.message.includes('Sections filtered out') ||
        (l.data?.orderedSections === 0 && l.data?.inputSections > 0)
      );
      if (emptySectionLogs.length > 0) {
        diagnostics.issues.push(`CRITICAL: Found ${emptySectionLogs.length} instances of sections being filtered out`);
        emptySectionLogs.forEach(log => {
          diagnostics.issues.push(`  - ${log.location}: ${log.message}`, log.data);
        });
      }
    } else {
      diagnostics.warnings.push('Log export utility not available');
    }
  } catch (e) {
    diagnostics.warnings.push(`Log check failed: ${e.message}`);
  }
  
  // 2. Check components
  try {
    const cards = document.querySelectorAll('app-ai-card-renderer');
    diagnostics.components = {
      count: cards.length,
      cards: [],
    };
    
    cards.forEach((card, i) => {
      const cardInfo = {
        index: i,
        hasShadowRoot: !!card.shadowRoot,
        sections: {
          total: 0,
          rendered: 0,
        },
      };
      
      // Try to access component instance
      try {
        const cardElement = card.shadowRoot || card;
        const sectionList = cardElement.querySelector('app-card-section-list');
        const masonryItems = cardElement.querySelectorAll('.masonry-item, [class*="section-"]');
        
        cardInfo.sections.rendered = masonryItems.length;
        
        // Check if empty state is showing
        const emptyState = cardElement.querySelector('.card-empty-state');
        if (emptyState && masonryItems.length === 0) {
          diagnostics.issues.push(`Card ${i + 1}: Showing empty state but should have sections`);
        }
      } catch (e) {
        diagnostics.warnings.push(`Card ${i + 1}: Could not inspect (${e.message})`);
      }
      
      diagnostics.components.cards.push(cardInfo);
    });
    
    console.log(`\n🎴 Components: ${diagnostics.components.count} card(s) found`);
    diagnostics.components.cards.forEach(card => {
      console.log(`   Card ${card.index + 1}: ${card.sections.rendered} sections rendered`);
    });
  } catch (e) {
    diagnostics.warnings.push(`Component check failed: ${e.message}`);
  }
  
  // 3. Performance check
  try {
    if (window.performance) {
      const perfEntries = window.performance.getEntriesByType('measure');
      const longTasks = perfEntries.filter(e => e.duration > 50);
      
      diagnostics.performance = {
        longTasks: longTasks.length,
        memory: null,
      };
      
      if (performance.memory) {
        diagnostics.performance.memory = {
          used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + 'MB',
          limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + 'MB',
          percent: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(1) + '%',
        };
      }
      
      console.log(`\n⚡ Performance: ${longTasks.length} long tasks, Memory: ${diagnostics.performance.memory?.percent || 'N/A'}`);
    }
  } catch (e) {
    diagnostics.warnings.push(`Performance check failed: ${e.message}`);
  }
  
  // 4. Check for common issues
  try {
    // Check if streaming detection is working
    const streamingLogs = diagnostics.logs?.filter(l => 
      l.message.includes('Streaming path') || l.message.includes('Non-streaming path')
    ) || [];
    
    if (streamingLogs.length > 0) {
      const streamingCount = streamingLogs.filter(l => l.message.includes('Streaming path')).length;
      const nonStreamingCount = streamingLogs.filter(l => l.message.includes('Non-streaming path')).length;
      
      console.log(`\n📡 Streaming: ${streamingCount} streaming paths, ${nonStreamingCount} non-streaming paths`);
      
      if (nonStreamingCount > streamingCount * 2 && streamingCount > 0) {
        diagnostics.warnings.push('More non-streaming paths than streaming - may indicate streaming detection issue');
      }
    }
    
    // Check for excessive hash calculations
    const hashLogs = diagnostics.logs?.filter(l => l.message.includes('Hash calculated')) || [];
    if (hashLogs.length > 50) {
      diagnostics.warnings.push(`Excessive hash calculations: ${hashLogs.length} (may indicate performance issue)`);
    }
    
  } catch (e) {
    // Ignore
  }
  
  // Report
  console.log('\n' + '='.repeat(70));
  console.log('%c📋 DIAGNOSTIC SUMMARY', 'color: #ff7900; font-size: 16px; font-weight: bold;');
  
  if (diagnostics.issues.length > 0) {
    console.log('\n%c❌ CRITICAL ISSUES:', 'color: red; font-weight: bold;');
    diagnostics.issues.forEach(issue => console.error(`  ${issue}`));
  }
  
  if (diagnostics.warnings.length > 0) {
    console.log('\n%c⚠️  WARNINGS:', 'color: orange; font-weight: bold;');
    diagnostics.warnings.forEach(warning => console.warn(`  ${warning}`));
  }
  
  if (diagnostics.issues.length === 0 && diagnostics.warnings.length === 0) {
    console.log('\n%c✅ No issues detected', 'color: green; font-weight: bold;');
  }
  
  // Export full diagnostics
  console.log('\n💡 Full diagnostics object:', diagnostics);
  console.log('💡 To export logs: window.__osiCardsDebugLogs.export()');
  
  // Make diagnostics available globally
  window.__diagnostics = diagnostics;
  
  return diagnostics;
})();
