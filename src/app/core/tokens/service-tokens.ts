import { InjectionToken } from '@angular/core';
import { LoggingService } from '../services/logging.service';
import { PerformanceService } from '../services/performance.service';
import { AppConfigService } from '../services/app-config.service';
import { CardDataService } from '../services/card-data/card-data.service';
import { CardRepository } from '../services/card-data/card-repository.service';
import { ICardRepository } from '../services/card-data/card-repository.interface';

/**
 * Dependency Injection Tokens for Services
 * Enables better testing and service swapping
 */

export const LOGGING_SERVICE = new InjectionToken<LoggingService>('LoggingService');
export const PERFORMANCE_SERVICE = new InjectionToken<PerformanceService>('PerformanceService');
export const APP_CONFIG_SERVICE = new InjectionToken<AppConfigService>('AppConfigService');
export const CARD_DATA_SERVICE = new InjectionToken<CardDataService>('CardDataService');
export const CARD_REPOSITORY = new InjectionToken<ICardRepository>('CardRepository');


