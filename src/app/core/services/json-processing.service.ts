import { Injectable, inject } from '@angular/core';
import { AICardConfig, CardTypeGuards, CardSection } from '../../models';
import { AppConfigService } from './app-config.service';
import { ensureCardIds } from '../../shared/utils/card-utils';

/**
 * Service for processing JSON input, including parsing, validation, and partial parsing.
 * 
 * Extracted from HomePageComponent for better testability and reusability.
 * Handles JSON validation, error reporting, and partial parsing for live preview updates.
 * 
 * @example
 * ```typescript
 * const jsonService = inject(JsonProcessingService);
 * const result = jsonService.parseAndValidate(jsonString);
 * if (result.success) {
 *   // Use result.card
 * }
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class JsonProcessingService {
  private readonly config = inject(AppConfigService);

  /**
   * Validate JSON syntax and return error information
   * 
   * Validates JSON syntax without parsing the full structure.
   * Provides detailed error information including position and suggestions.
   * 
   * @param jsonInput - The JSON string to validate
   * @returns Validation result with error details if invalid
   * 
   * @example
   * ```typescript
   * const validation = jsonProcessing.validateJsonSyntax(jsonString);
   * if (!validation.isValid) {
   *   console.error(`Error at position ${validation.position}: ${validation.error}`);
   *   console.log(`Suggestion: ${validation.suggestion}`);
   * }
   * ```
   */
  validateJsonSyntax(jsonInput: string): {
    isValid: boolean;
    error?: string;
    position?: number;
    suggestion?: string;
  } {
    if (!jsonInput || jsonInput.trim() === '') {
      return { isValid: true };
    }

    try {
      JSON.parse(jsonInput);
      return { isValid: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON syntax';
      const position = this.extractErrorPosition(errorMessage, jsonInput);
      const suggestion = this.generateErrorSuggestion(errorMessage, jsonInput);

      return {
        isValid: false,
        error: errorMessage,
        position,
        suggestion
      };
    }
  }

  /**
   * Enhanced validation to detect potential injection attacks
   */
  private detectInjectionAttempts(jsonInput: string): {
    isSafe: boolean;
    threat?: string;
  } {
    // Check for script injection patterns
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /on\w+\s*=/i, // Event handlers like onclick=
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(jsonInput)) {
        return {
          isSafe: false,
          threat: 'Potential script injection detected'
        };
      }
    }

    // Check for suspiciously long strings (potential DoS)
    const maxStringLength = 100000; // 100KB per string
    try {
      const parsed = JSON.parse(jsonInput);
      const checkObject = (obj: any, depth = 0): boolean => {
        if (depth > 50) return false; // Prevent deep nesting DoS
        if (typeof obj === 'string' && obj.length > maxStringLength) {
          return false;
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (!checkObject(obj[key], depth + 1)) {
              return false;
            }
          }
        }
        return true;
      };
      if (!checkObject(parsed)) {
        return {
          isSafe: false,
          threat: 'Potential DoS attack detected (excessive string length or nesting)'
        };
      }
    } catch {
      // JSON parse will be handled by validateJsonSyntax
    }

    return { isSafe: true };
  }

  /**
   * Parse JSON and validate as AICardConfig
   */
  parseAndValidate(jsonInput: string): {
    success: boolean;
    card?: AICardConfig;
    error?: string;
  } {
    if (!jsonInput || jsonInput.trim() === '') {
      return {
        success: false,
        error: 'JSON input is empty'
      };
    }

    // Check for injection attempts first
    const injectionCheck = this.detectInjectionAttempts(jsonInput);
    if (!injectionCheck.isSafe) {
      return {
        success: false,
        error: `Security validation failed: ${injectionCheck.threat}`
      };
    }

    try {
      const data = JSON.parse(jsonInput);

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {
          success: false,
          error: 'Card configuration must be a valid JSON object.'
        };
      }

      if (CardTypeGuards.isAICardConfig(data)) {
        const sanitized = ensureCardIds(data);
        return {
          success: true,
          card: sanitized
        };
      }

      return {
        success: false,
        error: 'Invalid card configuration format - missing required fields (cardTitle, sections)'
      };
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Invalid JSON format';
      return {
        success: false,
        error: `Invalid JSON: ${error}`
      };
    }
  }

  /**
   * Try to parse partial/incomplete JSON for live preview
   * 
   * Attempts to parse incomplete JSON input for real-time preview updates.
   * Handles common issues like:
   * - Trailing commas
   * - Missing closing braces/brackets
   * - Incomplete strings
   * - Partial section arrays
   * 
   * Falls back to regex-based extraction if full parsing fails.
   * 
   * @param jsonInput - The potentially incomplete JSON string
   * @returns Partial card configuration if parsing succeeds, null otherwise
   * 
   * @example
   * ```typescript
   * const partial = jsonProcessing.tryParsePartialJson('{"cardTitle": "Test"');
   * // Returns: { cardTitle: "Test" } even though JSON is incomplete
   * ```
   */
  tryParsePartialJson(jsonInput: string): Partial<AICardConfig> | null {
    try {
      let sanitized = jsonInput.trim();

      // Remove trailing commas before closing braces/brackets
      sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

      // Count open/close braces and brackets
      const openBraces = (sanitized.match(/{/g) || []).length;
      const closeBraces = (sanitized.match(/}/g) || []).length;
      const openBrackets = (sanitized.match(/\[/g) || []).length;
      const closeBrackets = (sanitized.match(/\]/g) || []).length;

      // Handle incomplete strings
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        if (char === '"') {
          inString = !inString;
        }
      }
      if (inString) {
        sanitized += '"';
      }

      // Add missing closing brackets/braces
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        sanitized += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        sanitized += '}';
      }

      // Try to parse the sanitized JSON
      const parsed = JSON.parse(sanitized);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Partial<AICardConfig>;
      }
    } catch {
      // If that fails, try to extract key-value pairs using regex
      return this.extractPartialData(jsonInput);
    }

    return null;
  }

  /**
   * Extract partial data from incomplete JSON using regex patterns
   */
  private extractPartialData(jsonInput: string): Partial<AICardConfig> | null {
    try {
      const cardData: Partial<AICardConfig> = {};

      // Extract cardTitle
      const titleMatch = jsonInput.match(/"cardTitle"\s*:\s*"([^"]*)"/) ||
                        jsonInput.match(/'cardTitle'\s*:\s*'([^']*)'/);
      if (titleMatch) {
        cardData.cardTitle = titleMatch[1];
      }

      // Try to extract sections array
      const sectionsMatch = jsonInput.match(/"sections"\s*:\s*\[([\s\S]*)/);
      if (sectionsMatch && sectionsMatch[1]) {
        const sectionsContent = sectionsMatch[1];
        if (sectionsContent) {
          const sections = this.extractSections(sectionsContent);
          if (sections.length > 0) {
            cardData.sections = sections;
          }
        }
      }

      // Only return if we extracted at least some data
      if (cardData.cardTitle || (cardData.sections && cardData.sections.length > 0)) {
        return cardData;
      }
    } catch {
      // Couldn't extract partial data
    }

    return null;
  }

  /**
   * Extract section objects from incomplete JSON
   */
  private extractSections(sectionsContent: string): CardSection[] {
    const sections: CardSection[] = [];
    let depth = 0;
    let currentSection = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < sectionsContent.length; i++) {
      const char = sectionsContent[i];

      if (escapeNext) {
        currentSection += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        currentSection += char;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        currentSection += char;
        continue;
      }

      if (inString) {
        currentSection += char;
        continue;
      }

      if (char === '{') {
        if (depth === 0) {
          currentSection = '{';
        } else {
          currentSection += char;
        }
        depth++;
      } else if (char === '}') {
        currentSection += char;
        depth--;
        if (depth === 0) {
          // Complete section object found
          try {
            const section = JSON.parse(currentSection);
            if (section && typeof section === 'object') {
              sections.push(section);
            }
          } catch {
            // Try to fix common issues in incomplete sections
            try {
              let fixedSection = currentSection;
              let openCount = (fixedSection.match(/{/g) || []).length;
              let closeCount = (fixedSection.match(/}/g) || []).length;
              for (let j = 0; j < openCount - closeCount; j++) {
                fixedSection += '}';
              }
              const section = JSON.parse(fixedSection);
              if (section && typeof section === 'object') {
                sections.push(section);
              }
            } catch {
              // Skip this section
            }
          }
          currentSection = '';
        }
      } else if (depth > 0) {
        currentSection += char;
      }
    }

    // Try to parse the last incomplete section if we have one
    if (currentSection.trim() && depth > 0) {
      try {
        let fixedSection = currentSection;
        for (let j = 0; j < depth; j++) {
          fixedSection += '}';
        }
        const section = JSON.parse(fixedSection);
        if (section && typeof section === 'object') {
          sections.push(section);
        }
      } catch {
        // Skip incomplete section
      }
    }

    return sections;
  }

  /**
   * Extract error position from error message
   * 
   * Attempts to extract the character position where a JSON parsing error occurred.
   * This helps provide better error feedback to users.
   * 
   * @param errorMessage - The error message from JSON.parse
   * @param jsonInput - The JSON input string
   * @returns Character position of the error, or undefined if not found
   */
  private extractErrorPosition(errorMessage: string, jsonInput: string): number | undefined {
    const positionMatch = errorMessage.match(/position (\d+)/i);
    if (positionMatch && positionMatch[1]) {
      const positionStr = positionMatch[1];
      if (positionStr) {
        return parseInt(positionStr, 10);
      }
    }

    if (errorMessage.includes('Unexpected token')) {
      return jsonInput.length - 1;
    }

    return undefined;
  }

  /**
   * Generate helpful suggestions based on JSON error type
   */
  private generateErrorSuggestion(errorMessage: string, jsonInput: string): string {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('unexpected token')) {
      if (lowerError.includes('in json')) {
        return 'Check for missing commas, quotes, or brackets';
      }
      return 'Unexpected character found. Check for typos or missing punctuation';
    }

    if (lowerError.includes('unexpected end')) {
      return 'JSON appears incomplete. Check for missing closing brackets or braces';
    }

    if (lowerError.includes('expected')) {
      return 'Missing required syntax. Check for missing commas, colons, or quotes';
    }

    if (lowerError.includes('trailing comma')) {
      return 'Remove the trailing comma before the closing bracket or brace';
    }

    // Check for common issues
    const openBraces = (jsonInput.match(/{/g) || []).length;
    const closeBraces = (jsonInput.match(/}/g) || []).length;
    const openBrackets = (jsonInput.match(/\[/g) || []).length;
    const closeBrackets = (jsonInput.match(/\]/g) || []).length;

    if (openBraces > closeBraces) {
      return `Missing ${openBraces - closeBraces} closing brace(s)`;
    }

    if (openBrackets > closeBrackets) {
      return `Missing ${openBrackets - closeBrackets} closing bracket(s)`;
    }

    return 'Check JSON syntax and try again';
  }

  /**
   * Format JSON with proper indentation
   * 
   * Formats a JSON string with 2-space indentation for readability.
   * Returns the original string if parsing fails.
   * 
   * @param jsonInput - The JSON string to format
   * @returns Formatted JSON string with indentation, or original string if invalid
   * 
   * @example
   * ```typescript
   * const formatted = jsonProcessing.formatJson('{"a":1,"b":2}');
   * // Returns: "{\n  \"a\": 1,\n  \"b\": 2\n}\n"
   * ```
   */
  formatJson(jsonInput: string): string {
    try {
      const parsed = JSON.parse(jsonInput);
      return JSON.stringify(parsed, null, 2) + '\n';
    } catch {
      return jsonInput;
    }
  }

  /**
   * Calculate a simple hash of JSON content (ignoring whitespace differences)
   * 
   * Creates a hash value for JSON content that ignores whitespace differences.
   * Useful for detecting content changes without formatting differences.
   * 
   * @param jsonInput - The JSON string to hash
   * @returns Hash string representing the JSON content
   * 
   * @example
   * ```typescript
   * const hash1 = jsonProcessing.calculateJsonHash('{"a":1}');
   * const hash2 = jsonProcessing.calculateJsonHash('{ "a": 1 }');
   * // hash1 === hash2 (whitespace ignored)
   * ```
   */
  calculateJsonHash(jsonInput: string): string {
    const normalized = jsonInput.replace(/\s+/g, ' ').trim();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return String(hash);
  }
}

