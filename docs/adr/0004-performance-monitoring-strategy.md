# [ADR-0004] Performance Monitoring Strategy

**Status:** Accepted
**Date:** 2025-12-03
**Deciders:** Architecture Team, Performance Team
**Technical Story:** Architecture Improvements Plan - Items 2, 241-250

## Context and Problem Statement

OSI Cards is a performance-critical application that renders complex layouts with streaming updates. We need a comprehensive performance monitoring system to identify bottlenecks, track performance over time, and ensure we meet performance budgets.

## Decision Drivers

* Need real-time performance insights during development
* Must track frame budget to ensure 60 FPS
* Need to measure specific operations (layout, render, etc.)
* Must detect performance regressions early
* Should provide actionable metrics for optimization
* Must have minimal performance overhead

## Considered Options

1. **Custom Performance Monitoring Utility**
2. Use existing library (e.g., stats.js, perf-monitor)
3. Browser DevTools only (manual monitoring)

## Decision Outcome

Chosen option: "Custom Performance Monitoring Utility", because it provides exactly what we need with zero external dependencies and minimal overhead.

### Implementation

Created `performance-monitoring.util.ts` with the following capabilities:

1. **Performance Metrics Tracking**
   - Start/end measurement API
   - Automatic budget violation detection
   - Metadata support for context
   - Observer pattern for real-time updates

2. **Frame Budget Monitoring**
   - Real-time FPS tracking
   - Frame drop detection
   - Budget remaining calculation
   - Frame timing analysis

3. **Memory Monitoring**
   - Heap usage tracking
   - Budget violation detection
   - Memory leak indicators

4. **Reporting**
   - Comprehensive performance reports
   - Statistical analysis (avg, min, max)
   - Budget violation tracking
   - Export to JSON

5. **Developer Experience**
   - Decorator API (`@Measure`)
   - Helper functions for async/sync operations
   - Global monitor instance
   - Zero configuration needed

### Positive Consequences

* Proactive performance issue detection
* Data-driven optimization decisions
* Minimal code changes to add monitoring
* Zero external dependencies
* Development-only overhead
* Comprehensive insights

### Negative Consequences

* Small performance overhead (mitigated by using only in development)
* Need to add decorators to critical paths manually
* Requires discipline to use consistently

## Pros and Cons of the Options

### Custom Performance Monitoring Utility

* Good, because tailored to our specific needs
* Good, because zero dependencies
* Good, because complete control
* Good, because minimal overhead
* Bad, because maintenance burden
* Bad, because reinventing some wheels

### Use existing library

* Good, because battle-tested
* Good, because less code to maintain
* Bad, because adds dependency
* Bad, because may not fit our needs exactly
* Bad, because potential bloat

### Browser DevTools only

* Good, because zero code needed
* Good, because no overhead
* Bad, because manual process
* Bad, because no automated alerts
* Bad, because difficult to track over time
* Bad, because not available in CI/CD

## Implementation Notes

### Usage Examples

```typescript
// Decorator usage
@Measure('layout-calculation')
calculateLayout(sections: CardSection[]): Layout {
  // Implementation
}

// Manual usage
monitor.startMeasure('render-card');
renderCard(config);
monitor.endMeasure('render-card');

// Async operations
await measureAsync('fetch-data', async () => {
  return await fetchCardData();
});

// Frame monitoring
monitor.startFrameMonitoring();
monitor.subscribeToFrames((frame) => {
  if (frame.dropped) {
    console.warn('Frame dropped!');
  }
});
```

### Integration Points

1. **MasonryGridComponent**
   - Track layout calculations
   - Monitor reflow operations
   - Detect layout thrashing

2. **AICardRendererComponent**
   - Track render time
   - Monitor DOM updates
   - Track animation performance

3. **StreamingService**
   - Track update frequency
   - Monitor buffer operations
   - Detect streaming bottlenecks

### Performance Budgets

```typescript
const budget: PerformanceBudget = {
  frameTime: 16.67,      // 60 FPS
  layoutTime: 10,        // Max 10ms for layout
  renderTime: 8,         // Max 8ms for render
  memoryLimit: 100,      // Max 100MB
};
```

### Rollout Plan

1. **Phase 1**: Add to development environment
2. **Phase 2**: Add monitoring to critical paths
3. **Phase 3**: Set up automated reporting
4. **Phase 4**: Integrate with CI/CD
5. **Phase 5**: Production monitoring (opt-in)

## Validation

### Success Metrics

* Zero frame drops in typical usage
* All operations complete within budget
* Early detection of performance regressions
* Reduced performance-related bugs
* Improved Core Web Vitals scores

### Monitoring

* Daily performance reports
* Automated alerts for budget violations
* Trend analysis over time
* Regression detection in CI/CD

## Related Decisions

* [ADR-0005] Render Budget Monitoring
* [ADR-0006] Performance Regression Testing

## Links

* Performance Monitoring Util: `projects/osi-cards-lib/src/lib/utils/performance-monitoring.util.ts`
* Render Budget Util: `projects/osi-cards-lib/src/lib/utils/render-budget.util.ts`
* Testing Guide: `docs/TESTING_GUIDE.md`





