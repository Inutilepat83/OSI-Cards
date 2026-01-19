/**
 * Script to export debug logs from localStorage to .cursor/debug.log
 * 
 * Run this in the browser console after reproducing the issue:
 * 
 * 1. Copy this entire script
 * 2. Paste into browser console
 * 3. Press Enter
 * 4. Logs will be exported to .cursor/debug.log format
 */

(function exportDebugLogs() {
  try {
    const STORAGE_KEY = 'osi-cards-debug-logs';
    const logsJson = localStorage.getItem(STORAGE_KEY);
    
    if (!logsJson) {
      console.warn('No logs found in localStorage');
      return;
    }
    
    const logs = JSON.parse(logsJson);
    console.log(`Found ${logs.length} log entries`);
    
    // Convert to NDJSON format (one JSON object per line)
    const ndjson = logs.map(log => JSON.stringify(log)).join('\n');
    
    // Create blob and download
    const blob = new Blob([ndjson], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'debug-logs-export.ndjson';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ Exported ${logs.length} log entries to debug-logs-export.ndjson`);
    console.log('📋 Copy the file contents and paste them into .cursor/debug.log');
    
    // Also log first few entries for quick inspection
    console.log('\n📊 First 5 log entries:');
    logs.slice(0, 5).forEach((log, i) => {
      console.log(`${i + 1}. [${log.hypothesisId || 'N/A'}] ${log.location}: ${log.message}`, log.data);
    });
    
    // Log statistics
    const stats = {
      total: logs.length,
      byLocation: {},
      byHypothesis: {},
      byMessage: {},
    };
    
    logs.forEach(log => {
      stats.byLocation[log.location] = (stats.byLocation[log.location] || 0) + 1;
      if (log.hypothesisId) {
        stats.byHypothesis[log.hypothesisId] = (stats.byHypothesis[log.hypothesisId] || 0) + 1;
      }
      stats.byMessage[log.message] = (stats.byMessage[log.message] || 0) + 1;
    });
    
    console.log('\n📈 Statistics:', stats);
    
  } catch (error) {
    console.error('❌ Failed to export logs:', error);
  }
})();
