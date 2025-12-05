/**
 * Health Check Service
 *
 * Stub implementation for backward compatibility.
 * Apps should implement their own health check strategy.
 */

import { Injectable } from '@angular/core';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp?: number;
  uptime?: number;
  version?: string;
}

@Injectable({
  providedIn: 'root',
})
export class HealthCheckService {
  async check(): Promise<HealthStatus> {
    console.warn('HealthCheckService: Implement health checks in your app');
    return {
      status: 'healthy',
      checks: {},
    };
  }
}
