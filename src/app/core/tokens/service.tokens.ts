import { InjectionToken } from '@angular/core';
import { IPerformanceService } from '../services/interfaces/performance-service.interface';
import { ICardDataService } from '../services/interfaces/card-data-service.interface';

/**
 * Injection tokens for services
 * Enables better dependency injection and testing
 */

/**
 * Token for Performance Service
 * Allows swapping implementations for testing or different environments
 */
export const PERFORMANCE_SERVICE = new InjectionToken<IPerformanceService>('PerformanceService');

/**
 * Token for Card Data Service
 * Allows swapping implementations for testing or different data sources
 */
export const CARD_DATA_SERVICE = new InjectionToken<ICardDataService>('CardDataService');

