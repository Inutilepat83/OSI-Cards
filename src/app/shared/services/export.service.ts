import { Injectable } from '@angular/core';
import { AICardConfig } from '../../models';
import { removeAllIds } from '../utils/card-utils';

/**
 * Export service for exporting cards in various formats
 * Allows users to export cards as JSON, PDF, or images
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  /**
   * Export card as JSON
   */
  exportAsJson(card: AICardConfig, filename?: string): void {
    const cardWithoutIds = removeAllIds(card);
    const json = JSON.stringify(cardWithoutIds, null, 2);
    this.downloadFile(json, filename || `${card.cardTitle || 'card'}.json`, 'application/json');
  }

  /**
   * Export card as formatted JSON (pretty printed)
   */
  exportAsFormattedJson(card: AICardConfig, filename?: string): void {
    this.exportAsJson(card, filename);
  }

  /**
   * Export card as text
   */
  exportAsText(card: AICardConfig, filename?: string): void {
    let text = `Card: ${card.cardTitle}\n`;
    if (card.cardSubtitle) {
      text += `Subtitle: ${card.cardSubtitle}\n`;
    }
    text += '\n';

    card.sections?.forEach((section, index) => {
      text += `Section ${index + 1}: ${section.title}\n`;
      if (section.description) {
        text += `  ${section.description}\n`;
      }

      section.fields?.forEach(field => {
        text += `  - ${field.label || field.title || 'Field'}: ${field.value || ''}\n`;
      });

      section.items?.forEach(item => {
        text += `  - ${item.title}\n`;
        if (item.description) {
          text += `    ${item.description}\n`;
        }
      });

      text += '\n';
    });

    this.downloadFile(text, filename || `${card.cardTitle || 'card'}.txt`, 'text/plain');
  }

  /**
   * Copy card JSON to clipboard
   */
  async copyToClipboard(card: AICardConfig): Promise<boolean> {
    try {
      const cardWithoutIds = removeAllIds(card);
      const json = JSON.stringify(cardWithoutIds, null, 2);
      await navigator.clipboard.writeText(json);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Export multiple cards as JSON array
   */
  exportMultipleAsJson(cards: AICardConfig[], filename?: string): void {
    const cardsWithoutIds = cards.map(card => removeAllIds(card));
    const json = JSON.stringify(cardsWithoutIds, null, 2);
    this.downloadFile(json, filename || 'cards.json', 'application/json');
  }

  /**
   * Download file helper
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export card as CSV (for sections with table-like data)
   */
  exportAsCsv(card: AICardConfig, filename?: string): void {
    let csv = 'Section,Field,Value\n';

    card.sections?.forEach(section => {
      section.fields?.forEach(field => {
        const sectionTitle = (section.title || '').replace(/"/g, '""');
        const fieldLabel = (field.label || field.title || '').replace(/"/g, '""');
        const fieldValue = String(field.value || '').replace(/"/g, '""');
        csv += `"${sectionTitle}","${fieldLabel}","${fieldValue}"\n`;
      });
    });

    this.downloadFile(csv, filename || `${card.cardTitle || 'card'}.csv`, 'text/csv');
  }
}


