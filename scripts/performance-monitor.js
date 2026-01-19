/**
 * Performance Monitor
 * 
 * Monitors performance in real-time and detects blocking operations
 * Run this in browser console to start monitoring
 */

(function startPerformanceMonitor() {
  console.log('%c📊 Performance Monitor Started', 'color: #ff7900; font-weight: bold;');
  
  const monitor = {
    longTasks: [],
    blockingOps: [],
    excessiveCalls: {},
    startTime: Date.now(),
  };
  
  // Monitor setTimeout/setInterval
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(...args) {
    const start = performance.now();
    const id = originalSetTimeout.apply(this, args);
    const duration = performance.now() - start;
    
    if (duration > 10) {
      monitor.blockingOps.push({
        type: 'setTimeout',
        duration,
        stack: new Error().stack,
        timestamp: Date.now(),
      });
    }
    
    return id;
  };
  
  window.setInterval = function(...args) {
    const start = performance.now();
    const id = originalSetInterval.apply(this, args);
    const duration = performance.now() - start;
    
    if (duration > 10) {
      monitor.blockingOps.push({
        type: 'setInterval',
        duration,
        stack: new Error().stack,
        timestamp: Date.now(),
      });
    }
    
    return id;
  };
  
  // Monitor function calls
  function wrapFunction(obj, prop, name) {
    const original = obj[prop];
    if (typeof original === 'function') {
      obj[prop] = function(...args) {
        const start = performance.now();
        const result = original.apply(this, args);
        const duration = performance.now() - start;
        
        if (duration > 5) {
          const key = `${name}.${prop}`;
          monitor.excessiveCalls[key] = (monitor.excessiveCalls[key] || 0) + 1;
          
          if (duration > 50) {
            monitor.longTasks.push({
              function: `${name}.${prop}`,
              duration,
              args: args.slice(0, 2), // First 2 args only
              timestamp: Date.now(),
            });
          }
        }
        
        return result;
      };
    }
  }
  
  // Monitor requestAnimationFrame
  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = function(...args) {
    const start = performance.now();
    const id = originalRAF.apply(this, args);
    const duration = performance.now() - start;
    
    if (duration > 5) {
      monitor.blockingOps.push({
        type: 'requestAnimationFrame',
        duration,
        timestamp: Date.now(),
      });
    }
    
    return id;
  };
  
  // Report every 5 seconds
  const reportInterval = setInterval(() => {
    const runtime = (Date.now() - monitor.startTime) / 1000;
    
    console.log(`\n📊 Performance Report (${runtime.toFixed(1)}s runtime):`);
    
    if (monitor.longTasks.length > 0) {
      console.warn(`⚠️  ${monitor.longTasks.length} long tasks detected (>50ms)`);
      monitor.longTasks.slice(-5).forEach(task => {
        console.warn(`   - ${task.function}: ${task.duration.toFixed(2)}ms`);
      });
    }
    
    if (monitor.blockingOps.length > 0) {
      console.warn(`⚠️  ${monitor.blockingOps.length} blocking operations detected`);
    }
    
    const excessive = Object.entries(monitor.excessiveCalls)
      .filter(([_, count]) => count > 50)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (excessive.length > 0) {
      console.warn('⚠️  Excessive function calls:');
      excessive.forEach(([func, count]) => {
        console.warn(`   - ${func}: ${count} calls`);
      });
    }
    
    if (monitor.longTasks.length === 0 && monitor.blockingOps.length === 0 && excessive.length === 0) {
      console.log('✅ No performance issues detected');
    }
  }, 5000);
  
  // Make monitor available globally
  window.__performanceMonitor = {
    stop: () => {
      clearInterval(reportInterval);
      window.setTimeout = originalSetTimeout;
      window.setInterval = originalSetInterval;
      window.requestAnimationFrame = originalRAF;
      console.log('📊 Performance Monitor Stopped');
    },
    getReport: () => monitor,
    clear: () => {
      monitor.longTasks = [];
      monitor.blockingOps = [];
      monitor.excessiveCalls = {};
    },
  };
  
  console.log('💡 Monitor will report every 5 seconds');
  console.log('💡 Stop with: window.__performanceMonitor.stop()');
  console.log('💡 Get report: window.__performanceMonitor.getReport()');
})();
