/**
 * Card PDF HTML Generator Utility
 *
 * Converts AICardConfig to HTML representation for PDF generation.
 * Reuses card structure and class names for consistency.
 */

import { AICardConfig, CardSection, CardField, CardItem } from '../models';

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string | number | boolean | null | undefined): string {
  if (text === null || text === undefined) return '';
  const str = String(text);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format field value with support for newlines
 */
function formatFieldValue(field: CardField): string {
  const value = field.value;
  if (value === null || value === undefined) return '';

  let str = String(value);

  // Handle newlines
  str = str.replace(/\n/g, '<br>');

  return str;
}

/**
 * Generate HTML for section header
 */
function generateSectionHeader(section: CardSection): string {
  if (!section.title && !section.description) return '';

  let html = '<div class="section-header">';

  if (section.title) {
    html += `<div class="section-title">${escapeHtml(section.title)}</div>`;
  }

  if (section.description) {
    html += `<div class="section-description">${escapeHtml(section.description)}</div>`;
  }

  html += '</div>';
  return html;
}

/**
 * Generate HTML for overview section
 */
function generateOverviewSection(section: CardSection): string {
  if (!section.fields || section.fields.length === 0) {
    return '<div class="empty-state">No overview data</div>';
  }

  let html = '<div class="ai-section ai-section--overview section-content">';
  html += generateSectionHeader(section);
  html += '<div class="overview-grid">';

  for (const field of section.fields) {
    const hasLabel = !!field.label;
    html += `<div class="overview-item${!hasLabel ? ' overview-item--single-text' : ''}">`;

    if (field.label) {
      html += `<div class="overview-item__label">${escapeHtml(field.label)}</div>`;
    }

    html += `<div class="overview-item__value${!hasLabel ? ' overview-item__value--single-text' : ''}">${formatFieldValue(field)}</div>`;
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Generate HTML for list section
 */
function generateListSection(section: CardSection): string {
  if (!section.items || section.items.length === 0) {
    return '<div class="empty-state">No items</div>';
  }

  let html = '<div class="ai-section ai-section--list section-content">';
  html += generateSectionHeader(section);
  html += '<div class="list-container">';

  for (const item of section.items) {
    html += '<div class="section-item">';
    html += '<div class="list-content">';

    html += '<div class="list-header">';
    html += '<div class="list-title-wrapper">';

    if (item.icon) {
      html += `<span class="list-icon">${escapeHtml(item.icon)}</span>`;
    }

    if (item.title) {
      html += `<h4 class="list-title">${escapeHtml(item.title)}</h4>`;
    }

    html += '</div>';

    // Badges
    if (item.status || item.priority) {
      html += '<div class="list-badges">';
      if (item.status) {
        html += `<span class="badge badge-status">${escapeHtml(item.status)}</span>`;
      }
      if (item.priority) {
        html += `<span class="badge badge-priority-${item.priority}">${escapeHtml(item.priority)}</span>`;
      }
      html += '</div>';
    }

    html += '</div>';

    if (item.description) {
      html += `<div class="list-description-wrapper">`;
      html += `<p class="list-description">${escapeHtml(item.description)}</p>`;
      html += `</div>`;
    }

    html += '</div>';
    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Generate HTML for info section
 */
function generateInfoSection(section: CardSection): string {
  if (!section.fields || section.fields.length === 0) {
    return '<div class="empty-state">No information available</div>';
  }

  let html = '<div class="ai-section ai-section--info section-content">';
  html += generateSectionHeader(section);
  html += '<div class="info-grid">';

  for (const field of section.fields) {
    html += '<div class="info-field">';

    if (field.label) {
      html += `<div class="info-label">${escapeHtml(field.label)}</div>`;
    }

    if (field.value !== null && field.value !== undefined) {
      html += `<div class="info-value">${formatFieldValue(field)}</div>`;
    }

    html += '</div>';
  }

  html += '</div></div>';
  return html;
}

/**
 * Generate HTML for analytics section (similar to info)
 */
function generateAnalyticsSection(section: CardSection): string {
  return generateInfoSection(section);
}

/**
 * Generate HTML for a generic section (fallback)
 */
function generateGenericSection(section: CardSection): string {
  let html = '<div class="ai-section section-content">';
  html += generateSectionHeader(section);

  if (section.fields && section.fields.length > 0) {
    html += '<div class="info-grid">';
    for (const field of section.fields) {
      html += '<div class="info-field">';
      if (field.label) {
        html += `<div class="info-label">${escapeHtml(field.label)}</div>`;
      }
      if (field.value !== null && field.value !== undefined) {
        html += `<div class="info-value">${formatFieldValue(field)}</div>`;
      }
      html += '</div>';
    }
    html += '</div>';
  } else if (section.items && section.items.length > 0) {
    html += '<div class="list-container">';
    for (const item of section.items) {
      html += '<div class="section-item">';
      if (item.title) {
        html += `<h4 class="list-title">${escapeHtml(item.title)}</h4>`;
      }
      if (item.description) {
        html += `<p class="list-description">${escapeHtml(item.description)}</p>`;
      }
      html += '</div>';
    }
    html += '</div>';
  } else {
    html += '<div class="empty-state">No content available</div>';
  }

  html += '</div>';
  return html;
}

/**
 * Generate HTML for a section based on its type
 */
function generateSectionHtml(section: CardSection): string {
  const sectionType = section.type || 'info';

  switch (sectionType) {
    case 'overview':
      return generateOverviewSection(section);
    case 'list':
      return generateListSection(section);
    case 'info':
      return generateInfoSection(section);
    case 'analytics':
    case 'metrics': // alias
      return generateAnalyticsSection(section);
    default:
      return generateGenericSection(section);
  }
}

/**
 * Generate HTML from AICardConfig
 * @param card - Card configuration
 * @param theme - Theme to use ('day' or 'night')
 * @returns Complete HTML string
 */
export function generateCardHtml(card: AICardConfig, theme: 'day' | 'night' = 'day'): string {
  let html = `<div class="card-pdf-container" data-theme="${theme}">`;
  html += '<article class="ai-card-surface">';

  // Card Header
  html += '<div class="card-header-container">';
  html += `<h1 class="card-header-title">${escapeHtml(card.cardTitle || 'Card')}</h1>`;
  html += '</div>';

  // Card Sections
  html += '<div class="card-sections">';

  if (card.sections && card.sections.length > 0) {
    for (const section of card.sections) {
      html += generateSectionHtml(section);
    }
  } else {
    html += '<div class="empty-state">No sections available</div>';
  }

  html += '</div>'; // card-sections
  html += '</article>'; // ai-card-surface
  html += '</div>'; // card-pdf-container

  return html;
}
