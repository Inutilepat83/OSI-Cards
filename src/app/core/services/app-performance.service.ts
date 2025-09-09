import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppPerformanceService {
  private navigationStartTime = 0;
  private router = inject(Router);

  constructor() {
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    // Monitor navigation performance
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.logNavigationPerformance();
      });

    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        this.logPageLoadPerformance();
      });
    }
  }

  private logNavigationPerformance(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('Navigation Performance:', {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        });
      }
    }
  }

  private logPageLoadPerformance(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const timing = performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;

      console.log('Page Load Performance:', {
        pageLoadTime,
        domReadyTime,
        networkLatency: timing.responseEnd - timing.fetchStart,
        processingTime: timing.loadEventEnd - timing.domContentLoadedEventEnd
      });
    }
  }

  // Method to measure component render time
  startComponentRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);

      // Log slow renders
      if (renderTime > 16) { // More than one frame at 60fps
        console.warn(`Slow render detected for ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }

  // Method to measure function execution time
  measureExecutionTime<T>(fn: () => T, label: string): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    console.log(`${label} execution time: ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  }

  // Method to track custom metrics
  trackMetric(metricName: string, data: any): void {
    console.log(`Performance Metric - ${metricName}:`, data);
    
    // Store metric for analysis
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
      metrics.push({
        name: metricName,
        data,
        timestamp: Date.now()
      });
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    }
  }

  // Method to track user interactions
  trackUserInteraction(interactionType: string, data: any): void {
    console.log(`User Interaction - ${interactionType}:`, data);
    
    // Store interaction for analysis
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const interactions = JSON.parse(localStorage.getItem('user_interactions') || '[]');
      interactions.push({
        type: interactionType,
        data,
        timestamp: Date.now()
      });
      
      // Keep only last 100 interactions
      if (interactions.length > 100) {
        interactions.shift();
      }
      
      localStorage.setItem('user_interactions', JSON.stringify(interactions));
    }
  }
}
