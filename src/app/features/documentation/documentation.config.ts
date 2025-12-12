/**
 * Documentation configuration
 * Defines available documentation files and their metadata
 */

export interface DocItem {
  id: string;
  title: string;
  path: string;
  category?: string;
  description?: string;
}

export interface DocCategory {
  name: string;
  items: DocItem[];
}

/**
 * Available documentation files
 * Paths are relative to assets/docs/ or can be absolute URLs
 */
export const DOCUMENTATION_ITEMS: DocItem[] = [
  {
    id: 'readme',
    title: 'Getting Started',
    path: 'assets/docs/README.md',
    category: 'Getting Started',
    description: 'Introduction and quick start guide',
  },
  {
    id: 'events',
    title: 'Event System',
    path: 'assets/docs/EVENTS.md',
    category: 'Library Documentation',
    description: 'Event handling and middleware system',
  },
  {
    id: 'theming',
    title: 'Theming Guide',
    path: 'assets/docs/THEMING.md',
    category: 'Library Documentation',
    description: 'Customization and theming options',
  },
  {
    id: 'services',
    title: 'Services',
    path: 'assets/docs/SERVICES.md',
    category: 'Library Documentation',
    description: 'Available services and their usage',
  },
  {
    id: 'agentic-flow',
    title: 'Agentic Flow Integration',
    path: 'assets/docs/AGENTIC_FLOW_INTEGRATION.md',
    category: 'Library Documentation',
    description: 'Integration with agentic workflows',
  },
];

/**
 * Group documentation items by category
 */
export function getDocumentationByCategory(): DocCategory[] {
  const categories = new Map<string, DocItem[]>();

  DOCUMENTATION_ITEMS.forEach((item) => {
    const category = item.category || 'Other';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(item);
  });

  return Array.from(categories.entries()).map(([name, items]) => ({
    name,
    items,
  }));
}

/**
 * Get documentation item by ID
 */
export function getDocumentationById(id: string): DocItem | undefined {
  return DOCUMENTATION_ITEMS.find((item) => item.id === id);
}

