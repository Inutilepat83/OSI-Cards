import { Injectable } from '@angular/core';
import { AICardConfig } from '../../models';

/**
 * Service for JSON validation and error handling
 * Extracted from HomePageComponent for better separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonValidationService {
  /**
   * Validate JSON syntax and return error information
   * @param jsonInput - The JSON string to validate
   * @returns Object containing validation result, error message, position, and suggestion
   */
  validateJsonSyntax(jsonInput: string): {
    isValid: boolean;
    error: string;
    position: number | null;
    suggestion: string;
  } {
    if (!jsonInput || jsonInput.trim() === '') {
      return {
        isValid: true,
        error: '',
        position: null,
        suggestion: ''
      };
    }

    try {
      JSON.parse(jsonInput);
      return {
        isValid: true,
        error: '',
        position: null,
        suggestion: ''
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Invalid JSON syntax';
      let position: number | null = null;

      // Extract position from error message if available
      const positionMatch = errorMessage.match(/position (\d+)/i);
      if (positionMatch) {
        position = parseInt(positionMatch[1], 10);
      } else {
        // Try to find common error patterns
        if (errorMessage.includes('Unexpected token')) {
          position = jsonInput.length - 1;
        }
      }

      const suggestion = this.generateJsonErrorSuggestion(errorMessage, jsonInput);

      return {
        isValid: false,
        error: errorMessage,
        position,
        suggestion
      };
    }
  }

  /**
   * Generate helpful suggestions based on JSON error type
   * @param errorMessage - The error message from JSON.parse
   * @param jsonInput - The JSON string that caused the error
   * @returns A helpful suggestion string
   */
  private generateJsonErrorSuggestion(errorMessage: string, jsonInput: string): string {
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
   * Try to extract partial data from incomplete JSON
   * This allows showing partial results even when JSON is not fully complete
   * @param jsonInput - The incomplete JSON string
   * @returns Partial card configuration or null if extraction fails
   */
  tryParsePartialJson(jsonInput: string): Partial<AICardConfig> | null {
    try {
      // Try to close incomplete JSON by adding missing closing braces/brackets
      let sanitized = jsonInput.trim();

      // Remove trailing commas before closing braces/brackets (common in incomplete JSON)
      sanitized = sanitized.replace(/,(\s*[}\]])/g, '$1');

      // Count open/close braces and brackets
      const openBraces = (sanitized.match(/{/g) || []).length;
      const closeBraces = (sanitized.match(/}/g) || []).length;
      const openBrackets = (sanitized.match(/\[/g) || []).length;
      const closeBrackets = (sanitized.match(/\]/g) || []).length;

      // Add missing closing brackets first (for arrays), then braces (for objects)
      let tempJson = sanitized;

      // Handle incomplete strings - close any unclosed strings
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < tempJson.length; i++) {
        const char = tempJson[i];
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
        tempJson += '"';
      }

      // Add missing closing brackets/braces in reverse order (inner to outer)
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        tempJson += ']';
      }
      for (let i = 0; i < openBraces - closeBraces; i++) {
        tempJson += '}';
      }

      // Try to parse the sanitized JSON
      const parsed = JSON.parse(tempJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Partial<AICardConfig>;
      }
    } catch {
      // If that fails, try to extract key-value pairs using regex
      try {
        const cardData: Partial<AICardConfig> = {};

        // Extract cardTitle (handle both string and unquoted values)
        const titleMatch = jsonInput.match(/"cardTitle"\s*:\s*"([^"]*)"/) ||
          jsonInput.match(/'cardTitle'\s*:\s*'([^']*)'/);
        if (titleMatch) {
          cardData.cardTitle = titleMatch[1];
        }

        // Try to extract sections array (even if incomplete)
        // Look for "sections": [ and try to extract complete section objects
        const sectionsMatch = jsonInput.match(/"sections"\s*:\s*\[([\s\S]*)/);
        if (sectionsMatch) {
          const sectionsContent = sectionsMatch[1];
          const sections: any[] = [];

          // Try to find complete section objects by matching braces
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
                    // Add missing closing braces if needed
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
              // Close the incomplete section
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

          if (sections.length > 0) {
            cardData.sections = sections;
          }
        }

        // Only return if we extracted at least some data
        if (cardData.cardTitle || (cardData.sections && cardData.sections.length > 0)) {
          return cardData;
        }
      } catch {
        // Couldn't extract partial data
      }
    }

    return null;
  }

  /**
   * Calculate a simple hash of JSON content (ignoring whitespace differences)
   * Used to detect actual structural/content changes vs just whitespace
   * @param jsonInput - The JSON string to hash
   * @returns A hash string representing the content
   */
  calculateJsonHash(jsonInput: string): string {
    // Normalize whitespace for comparison
    const normalized = jsonInput.replace(/\s+/g, ' ').trim();
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return String(hash);
  }
}







