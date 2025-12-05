/**
 * Email Handler Service
 *
 * Handles email action construction and execution for card actions.
 * Extracted from AICardRendererComponent for better separation of concerns.
 *
 * @example
 * ```typescript
 * import { EmailHandlerService } from 'osi-cards-lib';
 *
 * const emailHandler = inject(EmailHandlerService);
 *
 * // Build mailto URL from action
 * const mailtoUrl = emailHandler.buildMailtoUrl(mailAction);
 *
 * // Execute email action
 * emailHandler.executeMailAction(mailAction);
 * ```
 */

import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MailCardAction, CardAction, CardTypeGuards } from '../models';
import { validateEmail, validateEmailConfig } from '../utils/input-validation.util';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Email configuration for mailto construction
 */
export interface EmailConfig {
  to: string;
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}

/**
 * Placeholder values for email templates
 */
export interface EmailPlaceholders {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  companyName?: string;
  cardTitle?: string;
  [key: string]: string | undefined;
}

/**
 * Result of building a mailto URL
 */
export interface MailtoResult {
  success: boolean;
  url?: string;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: 'root',
})
export class EmailHandlerService {
  private readonly platformId = inject(PLATFORM_ID);

  /** Default placeholders for email templates */
  private defaultPlaceholders: EmailPlaceholders = {};

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Set default placeholder values for email templates
   */
  setDefaultPlaceholders(placeholders: EmailPlaceholders): void {
    this.defaultPlaceholders = { ...placeholders };
  }

  /**
   * Update specific placeholder values
   */
  updatePlaceholder(key: string, value: string): void {
    this.defaultPlaceholders[key] = value;
  }

  /**
   * Clear all placeholders
   */
  clearPlaceholders(): void {
    this.defaultPlaceholders = {};
  }

  // ============================================================================
  // MAILTO URL CONSTRUCTION
  // ============================================================================

  /**
   * Build a mailto URL from a mail card action
   *
   * @param action - Mail card action
   * @param placeholders - Optional placeholder values
   * @returns MailtoResult with URL or error
   */
  buildMailtoUrl(action: MailCardAction, placeholders?: EmailPlaceholders): MailtoResult {
    if (!CardTypeGuards.isMailAction(action)) {
      return { success: false, error: 'Invalid mail action configuration' };
    }

    const email = action.email;
    const contact = email.contact;

    // Validate email address
    if (!validateEmail(contact.email)) {
      return { success: false, error: 'Invalid recipient email address' };
    }

    // Build email configuration
    const ccArray = email.cc ? (Array.isArray(email.cc) ? email.cc : [email.cc]) : undefined;
    const bccArray = email.bcc ? (Array.isArray(email.bcc) ? email.bcc : [email.bcc]) : undefined;
    const config: EmailConfig = {
      to: contact.email,
      cc: ccArray?.filter((e: string) => validateEmail(e)),
      bcc: bccArray?.filter((e: string) => validateEmail(e)),
      subject: this.replacePlaceholders(email.subject || '', placeholders),
      body: this.replacePlaceholders(email.body || '', placeholders),
    };

    // Construct mailto URL
    const url = this.constructMailtoUrl(config);

    return { success: true, url };
  }

  /**
   * Build mailto URL from simple email configuration
   *
   * @param config - Email configuration
   * @returns Mailto URL string
   */
  buildMailtoFromConfig(config: EmailConfig): string {
    return this.constructMailtoUrl(config);
  }

  /**
   * Execute a mail action (opens email client)
   *
   * @param action - Mail card action or CardAction
   * @param placeholders - Optional placeholder values
   * @returns true if successfully opened
   */
  executeMailAction(action: CardAction, placeholders?: EmailPlaceholders): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    // Handle legacy action format
    const mailAction = this.normalizeMailAction(action);
    if (!mailAction) {
      console.warn('Cannot execute mail action: invalid configuration');
      return false;
    }

    const result = this.buildMailtoUrl(mailAction, placeholders);

    if (!result.success || !result.url) {
      console.warn('Failed to build mailto URL:', result.error);
      return false;
    }

    try {
      window.location.href = result.url;
      return true;
    } catch (error) {
      console.error('Failed to open email client:', error);
      return false;
    }
  }

  // ============================================================================
  // PLACEHOLDER REPLACEMENT
  // ============================================================================

  /**
   * Replace placeholders in text with actual values
   *
   * @param text - Text containing {{placeholder}} patterns
   * @param placeholders - Values to substitute
   * @returns Text with placeholders replaced
   */
  replacePlaceholders(text: string, placeholders?: EmailPlaceholders): string {
    if (!text) return '';

    const mergedPlaceholders = { ...this.defaultPlaceholders, ...placeholders };

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return mergedPlaceholders[key] || match;
    });
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate an email address
   *
   * @param email - Email to validate
   * @returns true if valid
   */
  isValidEmail(email: string): boolean {
    return validateEmail(email);
  }

  /**
   * Validate a mail action configuration
   *
   * @param action - Action to validate
   * @returns Validation result with errors
   */
  validateMailAction(action: CardAction): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!action) {
      return { valid: false, errors: ['Action is required'] };
    }

    if (action.type !== 'mail') {
      return { valid: false, errors: ['Action type must be "mail"'] };
    }

    const mailAction = action as MailCardAction;

    if (!mailAction.email) {
      errors.push('Email configuration is required');
    } else {
      if (!mailAction.email.contact) {
        errors.push('Contact information is required');
      } else {
        if (!mailAction.email.contact.email) {
          errors.push('Contact email is required');
        } else if (!validateEmail(mailAction.email.contact.email)) {
          errors.push('Contact email is invalid');
        }
      }

      // Validate CC emails
      if (mailAction.email.cc) {
        const ccEmails = Array.isArray(mailAction.email.cc)
          ? mailAction.email.cc
          : [mailAction.email.cc];
        ccEmails.forEach((email: string, index: number) => {
          if (!validateEmail(email)) {
            errors.push(`CC email at index ${index} is invalid`);
          }
        });
      }

      // Validate BCC emails
      if (mailAction.email.bcc) {
        const bccEmails = Array.isArray(mailAction.email.bcc)
          ? mailAction.email.bcc
          : [mailAction.email.bcc];
        bccEmails.forEach((email: string, index: number) => {
          if (!validateEmail(email)) {
            errors.push(`BCC email at index ${index} is invalid`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private constructMailtoUrl(config: EmailConfig): string {
    const params: string[] = [];

    if (config.cc?.length) {
      params.push(`cc=${config.cc.map((e) => encodeURIComponent(e)).join(',')}`);
    }

    if (config.bcc?.length) {
      params.push(`bcc=${config.bcc.map((e) => encodeURIComponent(e)).join(',')}`);
    }

    if (config.subject) {
      params.push(`subject=${encodeURIComponent(config.subject)}`);
    }

    if (config.body) {
      params.push(`body=${encodeURIComponent(config.body)}`);
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : '';
    const mailtoUrl = `mailto:${encodeURIComponent(config.to)}${queryString}`;

    // Convert to Outlook URL scheme (works on both Windows and Mac)
    return this.convertToOutlookUrl(mailtoUrl);
  }

  /**
   * Convert mailto URL to Outlook URL scheme with platform-specific handling
   *
   * Strategy:
   * - Windows: Use mailto: (New Outlook doesn't support custom URL schemes)
   *   - Will open Outlook if it's set as the default email client
   *   - For Classic Outlook, user can set it as default or switch to Classic Outlook
   * - Mac: Use ms-outlook: (forces Outlook desktop app to open)
   *
   * Note: New Outlook for Windows doesn't support custom URL schemes like ms-outlook: or outlookmail:
   * The only way to open it is via mailto: when it's set as the default email client.
   *
   * @param mailtoUrl - Standard mailto URL
   * @returns Outlook URL scheme or mailto fallback
   */
  private convertToOutlookUrl(mailtoUrl: string): string {
    // Check if we're in a browser environment
    if (!isPlatformBrowser(this.platformId)) {
      return mailtoUrl;
    }

    const isWindows = /Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent);

    if (isWindows) {
      // Windows: Use mailto: (New Outlook doesn't support custom schemes)
      // This will open the default email client (Outlook if configured as default)
      // For Classic Outlook users: Set Outlook as default email client in Windows Settings
      return mailtoUrl;
    }

    // Mac: Use ms-outlook: scheme (works with Outlook desktop app)
    // Format: ms-outlook:mailto:email@example.com?subject=...&body=...
    return `ms-outlook:${mailtoUrl}`;
  }

  private normalizeMailAction(action: CardAction): MailCardAction | null {
    // Check if it's already a proper mail action
    if (CardTypeGuards.isMailAction(action)) {
      return action;
    }

    // Handle legacy format
    if (action.type === 'mail') {
      const legacyAction = action as CardAction & { email?: unknown };

      if (legacyAction.email && typeof legacyAction.email === 'object') {
        const email = legacyAction.email as Record<string, unknown>;

        // Try to construct valid mail action from legacy format
        if (email['contact'] || email['to'] || email['recipient']) {
          const contact = (email['contact'] as Record<string, unknown>) || {};
          const recipient = (email['to'] || email['recipient'] || contact['email']) as string;

          if (recipient && validateEmail(recipient)) {
            return {
              ...action,
              type: 'mail',
              email: {
                contact: {
                  name: (contact['name'] || '') as string,
                  email: recipient,
                  role: (contact['role'] || '') as string,
                },
                subject: (email['subject'] || '') as string,
                body: (email['body'] || '') as string,
                cc: email['cc'] as string[] | undefined,
                bcc: email['bcc'] as string[] | undefined,
              },
            };
          }
        }
      }
    }

    return null;
  }
}
