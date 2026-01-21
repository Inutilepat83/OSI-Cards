/**
 * Chaos Engineering Testing Utilities
 * Provides utilities for chaos engineering and resilience testing
 */

/**
 * Chaos experiment configuration
 */
export interface ChaosExperiment {
  /** Experiment name */
  name: string;
  /** Experiment description */
  description: string;
  /** Chaos action to execute */
  action: ChaosAction;
  /** Expected system behavior */
  steadyStateHypothesis: () => Promise<boolean>;
  /** Duration in milliseconds */
  duration?: number;
}

/**
 * Chaos action type
 */
export type ChaosAction =
  | { type: 'network-delay'; delayMs: number }
  | { type: 'network-failure'; failureRate: number }
  | { type: 'memory-pressure'; allocateMB: number }
  | { type: 'cpu-stress'; durationMs: number }
  | { type: 'random-errors'; errorRate: number }
  | { type: 'slow-responses'; delayMs: number }
  | { type: 'partial-outage'; affectedPercentage: number };

/**
 * Chaos experiment result
 */
export interface ChaosExperimentResult {
  /** Experiment name */
  name: string;
  /** Whether system remained stable */
  stable: boolean;
  /** Duration of experiment */
  duration: number;
  /** Observations during experiment */
  observations: string[];
  /** Metrics collected */
  metrics: Record<string, number>;
}

/**
 * Chaos Engineer for running experiments
 */
export class ChaosEngineer {
  private experiments: ChaosExperiment[] = [];
  private results: ChaosExperimentResult[] = [];
  private isRunning = false;

  /**
   * Add experiment
   */
  public addExperiment(experiment: ChaosExperiment): void {
    this.experiments.push(experiment);
  }

  /**
   * Run all experiments
   */
  public async runAll(): Promise<ChaosExperimentResult[]> {
    this.results = [];

    for (const experiment of this.experiments) {
      const result = await this.runExperiment(experiment);
      this.results.push(result);
    }

    return this.results;
  }

  /**
   * Run single experiment
   */
  public async runExperiment(experiment: ChaosExperiment): Promise<ChaosExperimentResult> {
    console.log(`🔬 Running chaos experiment: ${experiment.name}`);

    const startTime = performance.now();
    const observations: string[] = [];
    const metrics: Record<string, number> = {};

    // Check steady state before experiment
    const initialState = await experiment.steadyStateHypothesis();
    if (!initialState) {
      observations.push('System not in steady state before experiment');
      return {
        name: experiment.name,
        stable: false,
        duration: 0,
        observations,
        metrics,
      };
    }

    // Apply chaos action
    this.isRunning = true;
    const cleanup = await this.applyChaos(experiment.action, observations, metrics);

    // Wait for duration
    if (experiment.duration) {
      await this.sleep(experiment.duration);
    }

    // Check steady state during chaos
    const duringState = await experiment.steadyStateHypothesis();
    observations.push(
      duringState
        ? 'System maintained steady state during chaos'
        : 'System lost steady state during chaos'
    );

    // Cleanup chaos
    await cleanup();
    this.isRunning = false;

    // Check steady state after recovery
    await this.sleep(1000); // Allow time for recovery
    const finalState = await experiment.steadyStateHypothesis();
    observations.push(finalState ? 'System recovered to steady state' : 'System failed to recover');

    const duration = performance.now() - startTime;

    return {
      name: experiment.name,
      stable: duringState && finalState,
      duration,
      observations,
      metrics,
    };
  }

  /**
   * Apply chaos action
   */
  private async applyChaos(
    action: ChaosAction,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    switch (action.type) {
      case 'network-delay':
        return this.applyNetworkDelay(action.delayMs, observations, metrics);

      case 'network-failure':
        return this.applyNetworkFailure(action.failureRate, observations, metrics);

      case 'memory-pressure':
        return this.applyMemoryPressure(action.allocateMB, observations, metrics);

      case 'cpu-stress':
        return this.applyCPUStress(action.durationMs, observations, metrics);

      case 'random-errors':
        return this.applyRandomErrors(action.errorRate, observations, metrics);

      case 'slow-responses':
        return this.applySlowResponses(action.delayMs, observations, metrics);

      default:
        return async () => {};
    }
  }

  /**
   * Apply network delay
   */
  private async applyNetworkDelay(
    delayMs: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Applied ${delayMs}ms network delay`);
    metrics.networkDelay = delayMs;

    // Intercept fetch/XHR and add delay
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      await this.sleep(delayMs);
      return originalFetch.apply(window, args);
    };

    return async () => {
      window.fetch = originalFetch;
      observations.push('Network delay removed');
    };
  }

  /**
   * Apply network failure
   */
  private async applyNetworkFailure(
    failureRate: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Applied ${failureRate * 100}% network failure rate`);
    metrics.networkFailureRate = failureRate;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      if (Math.random() < failureRate) {
        throw new Error('Simulated network failure');
      }
      return originalFetch.apply(window, args);
    };

    return async () => {
      window.fetch = originalFetch;
      observations.push('Network failures removed');
    };
  }

  /**
   * Apply memory pressure
   */
  private async applyMemoryPressure(
    allocateMB: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Allocated ${allocateMB}MB of memory`);
    metrics.memoryAllocated = allocateMB;

    // Allocate memory
    const arrays: any[] = [];
    const bytesPerMB = 1024 * 1024;
    const totalBytes = allocateMB * bytesPerMB;
    const chunkSize = 1024 * 1024; // 1MB chunks

    for (let i = 0; i < totalBytes; i += chunkSize) {
      arrays.push(new Uint8Array(chunkSize));
    }

    return async () => {
      arrays.length = 0;
      observations.push('Memory pressure released');
    };
  }

  /**
   * Apply CPU stress
   */
  private async applyCPUStress(
    durationMs: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Applied CPU stress for ${durationMs}ms`);
    metrics.cpuStressDuration = durationMs;

    let stop = false;

    // CPU-intensive work in background
    setTimeout(() => {
      const endTime = Date.now() + durationMs;
      while (Date.now() < endTime && !stop) {
        Math.sqrt(Math.random() * 1000000);
      }
    }, 0);

    return async () => {
      stop = true;
      observations.push('CPU stress removed');
    };
  }

  /**
   * Apply random errors
   */
  private async applyRandomErrors(
    errorRate: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Injecting random errors at ${errorRate * 100}% rate`);
    metrics.errorRate = errorRate;

    // Intercept Promise.resolve to occasionally reject
    const originalPromise = Promise.resolve;
    (Promise as any).resolve = (...args: any[]) => {
      if (Math.random() < errorRate) {
        return Promise.reject(new Error('Chaos injected error'));
      }
      return originalPromise.apply(Promise, args);
    };

    return async () => {
      (Promise as any).resolve = originalPromise;
      observations.push('Random errors removed');
    };
  }

  /**
   * Apply slow responses
   */
  private async applySlowResponses(
    delayMs: number,
    observations: string[],
    metrics: Record<string, number>
  ): Promise<() => Promise<void>> {
    observations.push(`Slowed responses by ${delayMs}ms`);
    metrics.responseDelay = delayMs;

    // Similar to network delay
    return this.applyNetworkDelay(delayMs, observations, metrics);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get results
   */
  public getResults(): ChaosExperimentResult[] {
    return [...this.results];
  }

  /**
   * Generate report
   */
  public generateReport(): string {
    const lines: string[] = [
      '=== Chaos Engineering Report ===',
      '',
      `Total Experiments: ${this.results.length}`,
      `Stable: ${this.results.filter((r) => r.stable).length}`,
      `Unstable: ${this.results.filter((r) => !r.stable).length}`,
      '',
    ];

    this.results.forEach((result) => {
      const status = result.stable ? '✅' : '❌';
      lines.push(`${status} ${result.name}`);
      lines.push(`   Duration: ${result.duration.toFixed(2)}ms`);
      lines.push(`   Observations:`);
      result.observations.forEach((obs) => {
        lines.push(`     - ${obs}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }
}

/**
 * Pre-built chaos experiments
 */
export class ChaosExperiments {
  /**
   * Network latency experiment
   */
  public static networkLatency(steadyState: () => Promise<boolean>): ChaosExperiment {
    return {
      name: 'Network Latency',
      description: 'Tests system behavior under high network latency',
      action: { type: 'network-delay', delayMs: 3000 },
      steadyStateHypothesis: steadyState,
      duration: 10000,
    };
  }

  /**
   * Intermittent network failures
   */
  public static networkFailures(steadyState: () => Promise<boolean>): ChaosExperiment {
    return {
      name: 'Network Failures',
      description: 'Tests system behavior with 30% network failure rate',
      action: { type: 'network-failure', failureRate: 0.3 },
      steadyStateHypothesis: steadyState,
      duration: 10000,
    };
  }

  /**
   * Memory pressure experiment
   */
  public static memoryPressure(steadyState: () => Promise<boolean>): ChaosExperiment {
    return {
      name: 'Memory Pressure',
      description: 'Tests system behavior under memory constraints',
      action: { type: 'memory-pressure', allocateMB: 500 },
      steadyStateHypothesis: steadyState,
      duration: 5000,
    };
  }

  /**
   * CPU stress experiment
   */
  public static cpuStress(steadyState: () => Promise<boolean>): ChaosExperiment {
    return {
      name: 'CPU Stress',
      description: 'Tests system behavior under high CPU load',
      action: { type: 'cpu-stress', durationMs: 5000 },
      steadyStateHypothesis: steadyState,
      duration: 8000,
    };
  }
}

/**
 * Usage example
 *
 * @example
 * ```typescript
 * import { ChaosEngineer, ChaosExperiments } from './';
 *
 * describe('Chaos Engineering Tests', () => {
 *   it('should handle network latency', async () => {
 *     const engineer = new ChaosEngineer();
 *
 *     // Define steady state
 *     const steadyState = async () => {
 *       const cards = await cardService.getCards();
 *       return cards.length > 0;
 *     };
 *
 *     // Add experiment
 *     engineer.addExperiment(
 *       ChaosExperiments.networkLatency(steadyState)
 *     );
 *
 *     // Run experiments
 *     const results = await engineer.runAll();
 *
 *     // Verify system remained stable
 *     expect(results[0].stable).toBe(true);
 *   });
 * });
 * ```
 */
