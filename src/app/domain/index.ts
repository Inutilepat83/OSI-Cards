/**
 * Domain Layer
 *
 * Domain entities, value objects, and interfaces.
 * This is a minimal implementation to unblock compilation.
 */

import { InjectionToken } from '@angular/core';
import { AICardConfig } from 'osi-cards-lib';
import { Result } from '../shared';

// Re-export Result for convenience
export type { Result } from '../shared';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface CardRepository {
  findById(id: string): Promise<Result<AICardConfig, Error>>;
  findAll(): Promise<Result<AICardConfig[], Error>>;
  save(card: AICardConfig): Promise<Result<void, Error>>;
  delete(id: string): Promise<Result<void, Error>>;
}

export const CARD_REPOSITORY = new InjectionToken<CardRepository>('CARD_REPOSITORY');

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

/**
 * Card Aggregate Root
 */
export class CardAggregate {
  private constructor(
    public readonly id: string,
    public readonly config: AICardConfig
  ) {}

  static fromDomainModel(config: AICardConfig): Result<CardAggregate, Error> {
    const id = config.id || this.generateId();
    return { success: true, value: new CardAggregate(id, { ...config, id }) };
  }

  toDomainModel(): AICardConfig {
    return this.config;
  }

  private static generateId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// ID UTILITIES
// ============================================================================

export class CardIdUtils {
  static generate(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class SectionIdUtils {
  static generate(): string {
    return `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// INPUT SANITIZATION SERVICE
// ============================================================================

import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class InputSanitizationService {
  constructor(private readonly sanitizer: DomSanitizer) {}

  sanitizeHtml(html: string): SafeHtml {
    // Use bypassSecurityTrustHtml for now - in production, use proper sanitization
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  sanitizeString(input: string): string {
    // Basic sanitization - remove script tags
    return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
}
