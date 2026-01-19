/**
 * Load All Debuggers
 * 
 * Automatically loads and runs all diagnostic tools
 * Copy and paste this entire script into browser console
 */

(function loadAllDebuggers() {
  console.log('%c🚀 Loading All Debug Tools...', 'color: #ff7900; font-size: 16px; font-weight: bold;');
  
  // Load scripts sequentially
  const scripts = [
    'scripts/debug-checker.js',
    'scripts/performance-monitor.js',
    'scripts/auto-diagnose.js',
  ];
  
  let loaded = 0;
  const total = scripts.length;
  
  scripts.forEach((script, index) => {
    const scriptEl = document.createElement('script');
    scriptEl.src = script;
    scriptEl.onload = () => {
      loaded++;
      console.log(`✅ Loaded ${script} (${loaded}/${total})`);
      if (loaded === total) {
        console.log('\n%c✅ All debug tools loaded!', 'color: green; font-weight: bold;');
        console.log('💡 Run: autoDiagnose() to get full diagnostics');
        console.log('💡 Or check: window.__diagnostics for last run results');
      }
    };
    scriptEl.onerror = () => {
      console.warn(`⚠️  Failed to load ${script}`);
      loaded++;
    };
    document.head.appendChild(scriptEl);
  });
  
  // Also provide manual instructions
  console.log('\n📋 Manual Instructions:');
  console.log('1. Run: window.__osiCardsDebugLogs.getStats() - See log statistics');
  console.log('2. Run: window.__osiCardsDebugLogs.export() - Export logs file');
  console.log('3. Check console for any errors');
})();
