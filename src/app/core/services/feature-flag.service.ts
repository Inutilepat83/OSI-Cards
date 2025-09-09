import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FeatureFlags {
  enableExperimentalCards: boolean;
  enableAdvancedAnalytics: boolean;
  enableBetaComponents: boolean;
  enablePerformanceMode: boolean;
  enableVirtualScrolling: boolean;
  enableWebWorkers: boolean;
  enableMicroFrontends: boolean;
  enablePluginArchitecture: boolean;
  enableEventDrivenArchitecture: boolean;
  enableUndoRedo: boolean;
  enableProgressiveWebApp: boolean;
  enableServiceWorker: boolean;
  enableRealTimeMonitoring: boolean;
  enableA11yEnhancements: boolean;
  enableAdvancedSecurity: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private flags$ = new BehaviorSubject<FeatureFlags>({
    enableExperimentalCards: false,
    enableAdvancedAnalytics: true,
    enableBetaComponents: false,
    enablePerformanceMode: true,
    enableVirtualScrolling: true,
    enableWebWorkers: false,
    enableMicroFrontends: false,
    enablePluginArchitecture: false,
    enableEventDrivenArchitecture: true,
    enableUndoRedo: false,
    enableProgressiveWebApp: true,
    enableServiceWorker: true,
    enableRealTimeMonitoring: true,
    enableA11yEnhancements: true,
    enableAdvancedSecurity: true
  });

  getFlag(flagName: keyof FeatureFlags): Observable<boolean> {
    return this.flags$.pipe(
      map(flags => flags[flagName])
    );
  }

  setFlag(flagName: keyof FeatureFlags, value: boolean): void {
    const currentFlags = this.flags$.value;
    this.flags$.next({
      ...currentFlags,
      [flagName]: value
    });
  }

  getAllFlags(): Observable<FeatureFlags> {
    return this.flags$.asObservable();
  }

  async loadFlagsFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/feature-flags');
      if (response.ok) {
        const serverFlags = await response.json();
        this.flags$.next({ ...this.flags$.value, ...serverFlags });
      }
    } catch (error) {
      console.warn('Failed to load feature flags from server:', error);
    }
  }

  enableBetaFeatures(): void {
    this.flags$.next({
      ...this.flags$.value,
      enableExperimentalCards: true,
      enableBetaComponents: true,
      enableWebWorkers: true,
      enableMicroFrontends: true,
      enablePluginArchitecture: true,
      enableUndoRedo: true
    });
  }

  enableProductionOptimizations(): void {
    this.flags$.next({
      ...this.flags$.value,
      enablePerformanceMode: true,
      enableVirtualScrolling: true,
      enableProgressiveWebApp: true,
      enableServiceWorker: true,
      enableAdvancedSecurity: true
    });
  }
}
