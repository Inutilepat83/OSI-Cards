/**
 * Card Summary Utility
 *
 * Generates text summaries from card content for use in emails and other contexts.
 */

import { AICardConfig, CardField, CardItem, CardSection } from '../models/card.model';

/**
 * Generate a summary from card content
 * Extracts key information from sections and formats it as readable text
 */
export function generateCardSummary(card: AICardConfig, maxLength = 500): string {
  if (!card || !card.sections || card.sections.length === 0) {
    return '';
  }

  const summaryParts: string[] = [];

  // Add card title
  if (card.cardTitle) {
    summaryParts.push(`**${card.cardTitle}**`);
  }

  // Add card description if available
  if (card.description) {
    summaryParts.push(card.description);
  }

  // Process each section
  card.sections.forEach((section) => {
    const sectionSummary = generateSectionSummary(section);
    if (sectionSummary) {
      summaryParts.push(sectionSummary);
    }
  });

  // Join all parts
  let summary = summaryParts.join('\n\n');

  // Truncate if too long
  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength - 3) + '...';
  }

  return summary.trim();
}

/**
 * Generate a summary from a single section
 */
function generateSectionSummary(section: CardSection): string {
  if (!section.title) {
    return '';
  }

  const parts: string[] = [];

  // Add section title
  parts.push(`**${section.title}**`);

  // Add section description if available
  if (section.description) {
    parts.push(section.description);
  }

  // Process fields (for field-based sections)
  if (section.fields && section.fields.length > 0) {
    const fieldSummaries = section.fields
      .filter((field): field is CardField => field !== undefined && field !== null)
      .map((field) => formatField(field))
      .filter((text) => text.length > 0)
      .slice(0, 5); // Limit to first 5 fields

    if (fieldSummaries.length > 0) {
      parts.push(fieldSummaries.join('\n'));
    }
  }

  // Process items (for item-based sections)
  if (section.items && section.items.length > 0) {
    const itemSummaries = section.items
      .filter((item): item is CardItem => item !== undefined && item !== null)
      .map((item) => formatItem(item))
      .filter((text) => text.length > 0)
      .slice(0, 5); // Limit to first 5 items

    if (itemSummaries.length > 0) {
      parts.push(itemSummaries.join('\n'));
    }
  }

  return parts.join('\n');
}

/**
 * Format a field as text
 */
function formatField(field: CardField): string {
  const label = field.label || '';
  const value = formatFieldValue(field);

  if (!label && !value) {
    return '';
  }

  if (!value) {
    return label;
  }

  if (!label) {
    return value;
  }

  return `• ${label}: ${value}`;
}

/**
 * Format a field value, handling different types
 */
function formatFieldValue(field: CardField): string {
  if (field.value !== undefined && field.value !== null) {
    if (typeof field.value === 'boolean') {
      return field.value ? 'Yes' : 'No';
    }
    return String(field.value);
  }

  // Try alternative value fields
  if (field.title) {
    return field.title;
  }

  if (field.description) {
    return field.description;
  }

  return '';
}

/**
 * Format an item as text
 */
function formatItem(item: CardItem): string {
  const title = item.title || '';
  const description = item.description || '';

  if (!title && !description) {
    return '';
  }

  if (!description) {
    return `• ${title}`;
  }

  return `• ${title}: ${description}`;
}

/**
 * Generate a brief summary (one paragraph)
 */
export function generateBriefSummary(card: AICardConfig): string {
  if (!card || !card.sections || card.sections.length === 0) {
    return '';
  }

  const parts: string[] = [];

  if (card.cardTitle) {
    parts.push(card.cardTitle);
  }

  // Get first section with description or fields for brief summary
  const summarySection = card.sections.find(
    (s) => s.description || (s.fields && s.fields.length > 0)
  );

  if (summarySection) {
    if (summarySection.description) {
      parts.push(summarySection.description);
    } else if (summarySection.fields && summarySection.fields.length > 0) {
      const firstField = summarySection.fields[0];
      if (firstField) {
        const value = formatFieldValue(firstField);
        if (value) {
          parts.push(value);
        }
      }
    }
  } else if (card.description) {
    parts.push(card.description);
  }

  // Always return a string, even if parts is empty
  return parts.length > 0 ? parts.join('. ').trim() : '';
}
