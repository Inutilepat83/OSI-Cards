/**
 * Manifest interfaces for card configuration discovery
 */

export interface CardManifestEntry {
  id: string;
  type: string;
  path: string;
  size: number;
  priority: 'high' | 'medium' | 'low';
  sectionCount: number;
  complexity: 'basic' | 'enhanced' | 'enterprise';
  title: string;
  format?: 'json'; // Optional: format of the card file (defaults to 'json')
  metadata: {
    subtitle?: string | null;
    description?: string | null;
    lastUpdated: string;
    hasActions: boolean;
  };
}

export interface CardManifest {
  version: string;
  generatedAt: string;
  cards: CardManifestEntry[];
  types: Record<string, string[]>;
}

