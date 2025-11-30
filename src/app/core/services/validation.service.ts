import { Injectable, inject } from '@angular/core';
import { z } from 'zod';
import { LoggingService } from './logging.service';
import {
  aiCardConfigSchema,
  cardSectionSchema,
  cardFieldSchema,
  cardItemSchema,
  cardActionSchema,
  AICardConfigInput,
  CardSectionInput,
  CardFieldInput,
  CardItemInput,
  CardActionInput
} from '../../models/card.schemas';
import { AICardConfig, CardSection, CardField, CardItem, CardAction } from '../../models';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
  errorMessages?: string[];
}

/**
 * Validation Service
 * 
 * Provides runtime type validation for card configurations using Zod schemas.
 * Validates card data at runtime to ensure type safety and data integrity.
 * 
 * @example
 * ```typescript
 * const validationService = inject(ValidationService);
 * const result = validationService.validateCard(cardData);
 * if (result.success) {
 *   // Use result.data
 * } else {
 *   // Handle result.errorMessages
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  private readonly logger = inject(LoggingService);

  /**
   * Validate a complete card configuration
   */
  validateCard(card: unknown): ValidationResult<AICardConfig> {
    try {
      const result = aiCardConfigSchema.safeParse(card);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as AICardConfig
        };
      } else {
        const errorMessages = this.formatZodErrors(result.error);
        this.logger.warn('Card validation failed', 'ValidationService', {
          errors: errorMessages,
          card: card
        });
        
        return {
          success: false,
          errors: result.error,
          errorMessages
        };
      }
    } catch (error) {
      this.logger.error('Validation error', 'ValidationService', { error });
      return {
        success: false,
        errorMessages: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate a card section
   */
  validateSection(section: unknown): ValidationResult<CardSection> {
    try {
      const result = cardSectionSchema.safeParse(section);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as CardSection
        };
      } else {
        const errorMessages = this.formatZodErrors(result.error);
        return {
          success: false,
          errors: result.error,
          errorMessages
        };
      }
    } catch (error) {
      this.logger.error('Section validation error', 'ValidationService', { error });
      return {
        success: false,
        errorMessages: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate a card field
   */
  validateField(field: unknown): ValidationResult<CardField> {
    try {
      const result = cardFieldSchema.safeParse(field);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as CardField
        };
      } else {
        const errorMessages = this.formatZodErrors(result.error);
        return {
          success: false,
          errors: result.error,
          errorMessages
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessages: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate a card item
   */
  validateItem(item: unknown): ValidationResult<CardItem> {
    try {
      const result = cardItemSchema.safeParse(item);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as CardItem
        };
      } else {
        const errorMessages = this.formatZodErrors(result.error);
        return {
          success: false,
          errors: result.error,
          errorMessages
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessages: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate a card action
   */
  validateAction(action: unknown): ValidationResult<CardAction> {
    try {
      const result = cardActionSchema.safeParse(action);
      
      if (result.success) {
        return {
          success: true,
          data: result.data as CardAction
        };
      } else {
        const errorMessages = this.formatZodErrors(result.error);
        return {
          success: false,
          errors: result.error,
          errorMessages
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessages: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Validate multiple cards
   */
  validateCards(cards: unknown[]): {
    valid: AICardConfig[];
    invalid: { index: number; errors: string[] }[];
  } {
    const valid: AICardConfig[] = [];
    const invalid: { index: number; errors: string[] }[] = [];

    cards.forEach((card, index) => {
      const result = this.validateCard(card);
      if (result.success && result.data) {
        valid.push(result.data);
      } else {
        invalid.push({
          index,
          errors: result.errorMessages || ['Unknown validation error']
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Format Zod errors into readable messages
   */
  private formatZodErrors(error: z.ZodError): string[] {
    return error.errors.map(err => {
      const path = err.path.join('.');
      const message = err.message;
      return path ? `${path}: ${message}` : message;
    });
  }

  /**
   * Validate and sanitize card data
   * Returns validated data or throws if validation fails
   */
  validateAndSanitize<T extends AICardConfigInput | CardSectionInput | CardFieldInput | CardItemInput | CardActionInput>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errorMessages = this.formatZodErrors(result.error);
      throw new Error(`Validation failed: ${errorMessages.join('; ')}`);
    }
    
    return result.data;
  }
}







