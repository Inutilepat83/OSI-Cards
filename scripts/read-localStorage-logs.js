/**
 * Quick script to read and display logs from localStorage
 * Run this in browser console to see logs without exporting
 */

(function() {
  try {
    const STORAGE_KEY = 'osi-cards-debug-logs';
    const logsJson = localStorage.getItem(STORAGE_KEY);
    
    if (!logsJson) {
      console.warn('❌ No logs found in localStorage');
      console.log('💡 Make sure you have reproduced the issue first');
      return;
    }
    
    const logs = JSON.parse(logsJson);
    console.log(`✅ Found ${logs.length} log entries\n`);
    
    // Group by hypothesis
    const byHypothesis = {};
    logs.forEach(log => {
      const id = log.hypothesisId || 'N/A';
      if (!byHypothesis[id]) {
        byHypothesis[id] = [];
      }
      byHypothesis[id].push(log);
    });
    
    console.log('📊 Logs by Hypothesis:');
    Object.keys(byHypothesis).forEach(id => {
      console.log(`  ${id}: ${byHypothesis[id].length} entries`);
    });
    
    console.log('\n📋 Recent logs (last 10):');
    logs.slice(-10).forEach((log, i) => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`${i + 1}. [${time}] [${log.hypothesisId || 'N/A'}] ${log.location}: ${log.message}`, log.data);
    });
    
    // Show slow operations
    const slowOps = logs.filter(log => 
      log.data?.duration && log.data.duration > 10
    );
    
    if (slowOps.length > 0) {
      console.log(`\n⚠️  Found ${slowOps.length} slow operations (>10ms):`);
      slowOps.forEach(log => {
        console.log(`  - ${log.location}: ${log.message} (${log.data.duration.toFixed(2)}ms)`, log.data);
      });
    }
    
    // Show errors or warnings
    const errors = logs.filter(log => 
      log.message.toLowerCase().includes('error') || 
      log.message.toLowerCase().includes('fail') ||
      log.data?.error
    );
    
    if (errors.length > 0) {
      console.log(`\n❌ Found ${errors.length} error/warning logs:`);
      errors.forEach(log => {
        console.log(`  - ${log.location}: ${log.message}`, log.data);
      });
    }
    
    console.log('\n💡 To export logs, run: window.__osiCardsDebugLogs.export()');
    
  } catch (error) {
    console.error('❌ Failed to read logs:', error);
  }
})();
