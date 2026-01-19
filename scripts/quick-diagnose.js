/**
 * Quick Diagnose - Fast diagnostic check
 * 
 * Run this in browser console for immediate feedback
 */

(function quickDiagnose() {
  console.log('%c⚡ Quick Diagnostic', 'color: #ff7900; font-weight: bold;');
  
  const issues = [];
  const info = [];
  
  // Check logs
  try {
    if (window.__osiCardsDebugLogs) {
      const stats = window.__osiCardsDebugLogs.getStats();
      info.push(`Logs: ${stats.totalEntries} entries`);
      
      if (stats.totalEntries === 0) {
        issues.push('❌ No logs found - instrumentation may not be working');
      } else {
        // Check for critical issues in logs
        const logs = window.__osiCardsDebugLogs.getLogs();
        const critical = logs.filter(l => 
          l.message.includes('CRITICAL') || 
          l.message.includes('All sections filtered')
        );
        if (critical.length > 0) {
          issues.push(`❌ Found ${critical.length} CRITICAL issues in logs`);
          critical.slice(0, 3).forEach(c => {
            issues.push(`   - ${c.message}`, c.data);
          });
        }
      }
    } else {
      issues.push('❌ Log export utility not available');
    }
  } catch (e) {
    issues.push(`❌ Log check failed: ${e.message}`);
  }
  
  // Check components
  try {
    const cards = document.querySelectorAll('app-ai-card-renderer');
    info.push(`Cards: ${cards.length} found`);
    
    if (cards.length === 0) {
      issues.push('❌ No card components found in DOM');
    } else {
      cards.forEach((card, i) => {
        const cardEl = card.shadowRoot || card;
        const sections = cardEl.querySelectorAll('.masonry-item, [class*="section-"]');
        const emptyState = cardEl.querySelector('.card-empty-state');
        
        if (sections.length === 0 && emptyState) {
          issues.push(`❌ Card ${i + 1}: Empty state showing (no sections rendered)`);
        } else {
          info.push(`Card ${i + 1}: ${sections.length} sections`);
        }
      });
    }
  } catch (e) {
    issues.push(`❌ Component check failed: ${e.message}`);
  }
  
  // Report
  console.log('\n📊 Results:');
  if (issues.length > 0) {
    console.error('❌ Issues:', issues);
  } else {
    console.log('✅ No critical issues');
  }
  console.log('ℹ️  Info:', info);
  
  console.log('\n💡 For full diagnostics, run: window.__osiCardsDebugLogs.export()');
  
  return { issues, info };
})();
