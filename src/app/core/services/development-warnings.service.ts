import { Injectable, inject, isDevMode } from '@angular/core';
import { LoggingService } from './logging.service';
import { AppConfigService } from './app-config.service';
import { AICardConfig, CardSection, CardAction } from '../../models';

/**
 * Development Warnings Service
 * 
 * Provides helpful warnings in development mode for common mistakes and anti-patterns.
 * These warnings help developers catch issues early without breaking production builds.
 * 
 * Features:
 * - Missing required fields validation
 * - Invalid section types detection
 * - Performance anti-pattern warnings
 * - Deprecated API usage warnings
 * - Configuration validation
 * 
 * @example
 * ```typescript
 * const warnings = inject(DevelopmentWarningsService);
 * warnings.validateCardConfig(cardConfig);
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class DevelopmentWarningsService {
  private readonly logger = inject(LoggingService);
  private readonly config = inject(AppConfigService);
  private readonly warnedIssues = new Set<string>();

  /**
   * Check if warnings are enabled
   */
  private get warningsEnabled(): boolean {
    return isDevMode() && this.config.LOGGING.ENABLE_DEBUG;
  }

  /**
   * Validate card configuration and warn about issues
   */
  validateCardConfig(cardConfig: AICardConfig | undefined, context = 'CardConfig'): void {
    if (!this.warningsEnabled || !cardConfig) {
      return;
    }

    const issues: string[] = [];

    // Check required fields
    if (!cardConfig.cardTitle) {
      issues.push('Missing required field: cardTitle');
    }

    if (!cardConfig.sections || cardConfig.sections.length === 0) {
      issues.push('Card has no sections');
    }

    // Check section count
    if (cardConfig.sections && cardConfig.sections.length > this.config.CARD_LIMITS.MAX_SECTIONS) {
      issues.push(
        `Card has ${cardConfig.sections.length} sections, exceeding limit of ${this.config.CARD_LIMITS.MAX_SECTIONS}`
      );
    }

    // Check actions count
    if (cardConfig.actions && cardConfig.actions.length > this.config.CARD_LIMITS.MAX_ACTIONS) {
      issues.push(
        `Card has ${cardConfig.actions.length} actions, exceeding limit of ${this.config.CARD_LIMITS.MAX_ACTIONS}`
      );
    }

    // Validate sections
    cardConfig.sections?.forEach((section, index) => {
      const sectionIssues = this.validateSection(section, index);
      issues.push(...sectionIssues);
    });

    // Validate actions
    cardConfig.actions?.forEach((action, index) => {
      const actionIssues = this.validateAction(action, index);
      issues.push(...actionIssues);
    });

    // Log warnings
    if (issues.length > 0) {
      const issueKey = `${context}-${cardConfig.id || 'unknown'}`;
      if (!this.warnedIssues.has(issueKey)) {
        this.logger.warn(
          `Card configuration issues detected in ${context}:`,
          'DevelopmentWarningsService',
          { issues, cardId: cardConfig.id, cardTitle: cardConfig.cardTitle }
        );
        this.warnedIssues.add(issueKey);
      }
    }
  }

  /**
   * Validate section configuration
   */
  private validateSection(section: CardSection, index: number): string[] {
    const issues: string[] = [];
    const sectionKey = `section-${index}`;

    // Check required fields
    if (!section.title) {
      issues.push(`${sectionKey}: Missing required field 'title'`);
    }

    // Check invalid section types
    const validTypes = [
      'info', 'analytics', 'overview', 'list', 'event', 'product', 'solutions',
      'contact-card', 'network-card', 'map', 'chart', 'financials', 'news',
      'social-media', 'quotation', 'text-reference', 'brand-colors', 'fallback'
    ];

    if (section.type && !validTypes.includes(section.type)) {
      issues.push(
        `${sectionKey}: Invalid section type '${section.type}'. ` +
        `Valid types: ${validTypes.join(', ')}. ` +
        `See: https://github.com/Inutilepat83/OSI-Cards/blob/main/README.md#section-types-catalog`
      );
    }

    // Check fields vs items
    if (section.fields && section.items) {
      issues.push(
        `${sectionKey}: Section has both 'fields' and 'items'. ` +
        `Use 'fields' for key-value pairs or 'items' for lists, not both.`
      );
    }

    // Check field count
    if (section.fields && section.fields.length > this.config.CARD_LIMITS.MAX_FIELDS_PER_SECTION) {
      issues.push(
        `${sectionKey}: Section has ${section.fields.length} fields, ` +
        `exceeding limit of ${this.config.CARD_LIMITS.MAX_FIELDS_PER_SECTION}`
      );
    }

    return issues;
  }

  /**
   * Validate action configuration
   */
  private validateAction(action: CardAction, index: number): string[] {
    const issues: string[] = [];
    const actionKey = `action-${index}`;

    // Check required fields
    if (!action.label) {
      issues.push(`${actionKey}: Missing required field 'label'`);
    }

    // Check mail action
    if (action.type === 'mail') {
      if (!action.email) {
        issues.push(
          `${actionKey}: Mail action requires 'email' configuration. ` +
          `See: https://github.com/Inutilepat83/OSI-Cards/blob/main/README.md#card-actions`
        );
      } else {
        if (!action.email.subject) {
          issues.push(`${actionKey}: Mail action requires 'email.subject'`);
        }
        if (!action.email.body) {
          issues.push(`${actionKey}: Mail action requires 'email.body'`);
        }
        if (!action.email.contact?.email && !action.email.to) {
          issues.push(`${actionKey}: Mail action requires 'email.to' or 'email.contact.email'`);
        }
      }
    }

    // Check website action
    if (action.type === 'website') {
      const url = action.url || action.action;
      if (!url || url === '#') {
        issues.push(
          `${actionKey}: Website action requires valid 'url' or 'action' property`
        );
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        issues.push(
          `${actionKey}: Website URL should start with 'http://' or 'https://'`
        );
      }
    }

    return issues;
  }

  /**
   * Warn about performance anti-patterns
   */
  warnPerformanceAntiPattern(pattern: string, suggestion: string, context?: string): void {
    if (!this.warningsEnabled) {
      return;
    }

    const warningKey = `perf-${pattern}-${context || 'global'}`;
    if (!this.warnedIssues.has(warningKey)) {
      this.logger.warn(
        `Performance anti-pattern detected: ${pattern}`,
        'DevelopmentWarningsService',
        { suggestion, context }
      );
      this.warnedIssues.add(warningKey);
    }
  }

  /**
   * Warn about deprecated API usage
   */
  warnDeprecatedAPI(
    deprecatedApi: string,
    replacement: string,
    version: string,
    context?: string
  ): void {
    if (!this.warningsEnabled) {
      return;
    }

    const warningKey = `deprecated-${deprecatedApi}-${context || 'global'}`;
    if (!this.warnedIssues.has(warningKey)) {
      this.logger.warn(
        `Deprecated API usage: ${deprecatedApi} (deprecated in v${version})`,
        'DevelopmentWarningsService',
        {
          replacement,
          migrationGuide: `https://github.com/Inutilepat83/OSI-Cards/blob/main/docs/MIGRATION_V${version}.md`,
          context
        }
      );
      this.warnedIssues.add(warningKey);
    }
  }

  /**
   * Warn about missing OnPush change detection
   */
  warnMissingOnPush(componentName: string): void {
    if (!this.warningsEnabled) {
      return;
    }

    const warningKey = `onpush-${componentName}`;
    if (!this.warnedIssues.has(warningKey)) {
      this.logger.warn(
        `Component '${componentName}' is not using OnPush change detection`,
        'DevelopmentWarningsService',
        {
          suggestion: 'Add changeDetection: ChangeDetectionStrategy.OnPush to improve performance',
          component: componentName
        }
      );
      this.warnedIssues.add(warningKey);
    }
  }

  /**
   * Clear warned issues (useful for testing)
   */
  clearWarnings(): void {
    this.warnedIssues.clear();
  }
}

