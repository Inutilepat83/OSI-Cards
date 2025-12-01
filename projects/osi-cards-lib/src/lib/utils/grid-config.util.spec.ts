/**
 * Unit Tests for Grid Configuration Utilities
 * 
 * Tests the grid configuration constants, calculations, and expansion logic.
 */

import {
  calculateColumns,
  calculateColumnWidth,
  calculateMinContainerWidth,
  getPreferredColumns,
  resolveColumnSpan,
  generateWidthExpression,
  generateLeftExpression,
  getMaxExpansion,
  shouldExpandSection,
  calculateBasicDensity,
  MIN_COLUMN_WIDTH,
  MAX_COLUMNS,
  GRID_GAP,
  SECTION_MAX_EXPANSION,
  EXPANSION_DENSITY_THRESHOLD,
  SectionExpansionInfo,
  ExpansionContext,
  ExpansionResult,
} from './grid-config.util';

describe('Grid Configuration Utilities', () => {
  describe('Constants', () => {
    it('should have sensible default values', () => {
      expect(MIN_COLUMN_WIDTH).toBe(260);
      expect(MAX_COLUMNS).toBe(4);
      expect(GRID_GAP).toBe(12);
    });
  });

  describe('calculateColumns', () => {
    it('should return 1 column for narrow containers', () => {
      expect(calculateColumns(200)).toBe(1);
      expect(calculateColumns(259)).toBe(1);
    });

    it('should return 2 columns for medium containers', () => {
      // 2 columns need: 2*260 + 1*12 = 532px minimum
      expect(calculateColumns(532)).toBe(2);
      expect(calculateColumns(600)).toBe(2);
    });

    it('should return 3 columns for larger containers', () => {
      // 3 columns need: 3*260 + 2*12 = 804px minimum
      expect(calculateColumns(804)).toBe(3);
      expect(calculateColumns(900)).toBe(3);
    });

    it('should cap at maxColumns', () => {
      expect(calculateColumns(2000)).toBe(4);
      expect(calculateColumns(5000)).toBe(4);
    });

    it('should return 1 for invalid widths', () => {
      expect(calculateColumns(0)).toBe(1);
      expect(calculateColumns(-100)).toBe(1);
    });

    it('should respect custom config', () => {
      expect(calculateColumns(500, { minColumnWidth: 200, maxColumns: 3 })).toBe(2);
    });
  });

  describe('calculateColumnWidth', () => {
    it('should calculate correct column width', () => {
      // 4 columns in 1088px: (1088 - 3*12) / 4 = 263px
      expect(calculateColumnWidth(1088, 4, 12)).toBe(263);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateColumnWidth(0, 4)).toBe(0);
      expect(calculateColumnWidth(1000, 0)).toBe(0);
    });
  });

  describe('calculateMinContainerWidth', () => {
    it('should calculate minimum width for columns', () => {
      expect(calculateMinContainerWidth(1)).toBe(260);
      expect(calculateMinContainerWidth(2)).toBe(532); // 2*260 + 1*12
      expect(calculateMinContainerWidth(4)).toBe(1076); // 4*260 + 3*12
    });

    it('should return 0 for invalid columns', () => {
      expect(calculateMinContainerWidth(0)).toBe(0);
    });
  });

  describe('getPreferredColumns', () => {
    it('should return type-specific preferences', () => {
      expect(getPreferredColumns('contact-card')).toBe(1);
      expect(getPreferredColumns('chart')).toBe(2);
      expect(getPreferredColumns('overview')).toBe(2);
    });

    it('should handle case-insensitive types', () => {
      expect(getPreferredColumns('CONTACT-CARD')).toBe(1);
      expect(getPreferredColumns('Chart')).toBe(2);
    });

    it('should return default for unknown types', () => {
      expect(getPreferredColumns('unknown-type')).toBe(1);
      expect(getPreferredColumns('')).toBe(1);
    });
  });

  describe('resolveColumnSpan', () => {
    it('should use explicit colSpan if provided', () => {
      expect(resolveColumnSpan(1, 4, 3)).toBe(3);
    });

    it('should clamp colSpan to available columns', () => {
      expect(resolveColumnSpan(1, 2, 5)).toBe(2);
    });

    it('should use preferred columns if no explicit span', () => {
      expect(resolveColumnSpan(2, 4)).toBe(2);
    });

    it('should clamp preferred columns to available', () => {
      expect(resolveColumnSpan(3, 2)).toBe(2);
    });
  });

  describe('generateWidthExpression', () => {
    it('should return 100% for single column', () => {
      expect(generateWidthExpression(1, 1)).toBe('calc((100% - 0px) / 1)');
    });

    it('should generate calc expression for multi-column grid', () => {
      const width = generateWidthExpression(4, 1, 12);
      expect(width).toContain('calc');
      expect(width).toContain('36px'); // 3 gaps * 12px
    });

    it('should handle multi-column span', () => {
      const width = generateWidthExpression(4, 2, 12);
      expect(width).toContain('* 2'); // Multiply by span
      expect(width).toContain('12px'); // Include gap in span
    });

    it('should return 100% for invalid inputs', () => {
      expect(generateWidthExpression(0, 1)).toBe('100%');
      expect(generateWidthExpression(4, 0)).toBe('100%');
    });
  });

  describe('generateLeftExpression', () => {
    it('should return 0px for first column', () => {
      expect(generateLeftExpression(4, 0)).toBe('0px');
    });

    it('should generate calc expression for other columns', () => {
      const left = generateLeftExpression(4, 1, 12);
      expect(left).toContain('calc');
      expect(left).toContain('* 1');
    });

    it('should handle multiple column offset', () => {
      const left = generateLeftExpression(4, 2, 12);
      expect(left).toContain('* 2');
    });
  });
});

describe('Section Expansion Limits', () => {
  describe('SECTION_MAX_EXPANSION', () => {
    it('should have conservative limits for compact sections', () => {
      expect(SECTION_MAX_EXPANSION['contact-card']).toBe(2);
      expect(SECTION_MAX_EXPANSION['network-card']).toBe(2);
      expect(SECTION_MAX_EXPANSION['project']).toBe(1);
      expect(SECTION_MAX_EXPANSION['quotation']).toBe(2);
    });

    it('should allow more expansion for wide sections', () => {
      expect(SECTION_MAX_EXPANSION['chart']).toBe(4);
      expect(SECTION_MAX_EXPANSION['map']).toBe(4);
      expect(SECTION_MAX_EXPANSION['overview']).toBe(4);
    });

    it('should have a conservative default', () => {
      expect(SECTION_MAX_EXPANSION['default']).toBe(2);
    });
  });

  describe('getMaxExpansion', () => {
    it('should return type-specific max expansion', () => {
      expect(getMaxExpansion('contact-card')).toBe(2);
      expect(getMaxExpansion('chart')).toBe(4);
      expect(getMaxExpansion('project')).toBe(1);
    });

    it('should return default for unknown types', () => {
      expect(getMaxExpansion('unknown')).toBe(2);
      expect(getMaxExpansion('')).toBe(2);
    });

    it('should handle case-insensitive types', () => {
      expect(getMaxExpansion('CONTACT-CARD')).toBe(2);
      expect(getMaxExpansion('Chart')).toBe(4);
    });
  });
});

describe('shouldExpandSection', () => {
  // Default context for tests
  const defaultContext: ExpansionContext = {
    currentSpan: 1,
    remainingColumns: 2,
    totalColumns: 4,
    containerWidth: 1076,
    minColumnWidth: 260,
    gap: 12,
    canPendingFit: false,
  };

  describe('Basic expansion decisions', () => {
    it('should not expand when no remaining columns', () => {
      const section: SectionExpansionInfo = { type: 'info' };
      const context = { ...defaultContext, remainingColumns: 0 };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(false);
      expect(result.reason).toContain('No remaining columns');
    });

    it('should not expand when canGrow is false', () => {
      const section: SectionExpansionInfo = { type: 'info', canGrow: false };

      const result = shouldExpandSection(section, defaultContext);

      expect(result.shouldExpand).toBe(false);
      expect(result.reason).toContain('canGrow=false');
    });

    it('should expand when remaining space is unusable', () => {
      const section: SectionExpansionInfo = { type: 'chart', density: 30 };
      const context: ExpansionContext = {
        ...defaultContext,
        remainingColumns: 1,
        containerWidth: 532, // With 4 columns, 1 column < minColumnWidth
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(true);
    });
  });

  describe('Type-aware expansion limits', () => {
    it('should not expand contact-card beyond 2 columns', () => {
      const section: SectionExpansionInfo = { type: 'contact-card', density: 30 };
      const context: ExpansionContext = {
        ...defaultContext,
        currentSpan: 2,
        remainingColumns: 2,
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      // Contact card is already at max (2), should not expand further
      expect(result.shouldExpand).toBe(false);
      expect(result.finalSpan).toBe(2);
      expect(result.reason).toContain('max expansion limit');
    });

    it('should allow chart to expand to full width', () => {
      const section: SectionExpansionInfo = { type: 'chart', density: 30 };
      const context: ExpansionContext = {
        ...defaultContext,
        currentSpan: 2,
        remainingColumns: 2,
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      // Charts can expand to 4 columns
      expect(result.finalSpan).toBe(4);
    });

    it('should respect explicit maxColumns over type limit', () => {
      const section: SectionExpansionInfo = { 
        type: 'chart', // Type limit is 4
        maxColumns: 2,  // Explicit limit is 2
        density: 30,
      };
      const context: ExpansionContext = {
        ...defaultContext,
        currentSpan: 2,
        remainingColumns: 2,
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      // Explicit maxColumns should take precedence
      expect(result.finalSpan).toBe(2);
    });

    it('should allow partial expansion up to type limit', () => {
      const section: SectionExpansionInfo = { type: 'analytics', density: 30 }; // Max 3
      const context: ExpansionContext = {
        ...defaultContext,
        currentSpan: 2,
        remainingColumns: 2, // Would be 4 total
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      // Analytics max is 3, so should expand from 2 to 3 (partial)
      expect(result.shouldExpand).toBe(true);
      expect(result.finalSpan).toBe(3);
      expect(result.reason).toContain('Partial expansion');
    });
  });

  describe('Content density checks', () => {
    it('should not expand sparse content when other sections can fit', () => {
      const section: SectionExpansionInfo = { 
        type: 'info', 
        density: 5, // Below threshold (15)
      };
      const context: ExpansionContext = {
        ...defaultContext,
        remainingColumns: 2,
        canPendingFit: true, // Other sections can fit
      };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(false);
      expect(result.reason).toContain('Content density');
    });

    it('should expand dense content', () => {
      const section: SectionExpansionInfo = { 
        type: 'info', 
        density: 30, // Above threshold
      };
      const context: ExpansionContext = {
        ...defaultContext,
        remainingColumns: 1,
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(true);
    });
  });

  describe('Space availability checks', () => {
    it('should not expand when other sections can fit', () => {
      const section: SectionExpansionInfo = { type: 'info', density: 30 };
      const context: ExpansionContext = {
        ...defaultContext,
        remainingColumns: 2,
        canPendingFit: true,
      };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(false);
      expect(result.reason).toContain('Space available');
    });

    it('should expand when no section can fit remaining space', () => {
      const section: SectionExpansionInfo = { type: 'info', density: 30 };
      const context: ExpansionContext = {
        ...defaultContext,
        remainingColumns: 1,
        canPendingFit: false,
      };

      const result = shouldExpandSection(section, context);

      expect(result.shouldExpand).toBe(true);
    });
  });
});

describe('calculateBasicDensity', () => {
  it('should return 0 for empty section', () => {
    expect(calculateBasicDensity()).toBe(0);
    expect(calculateBasicDensity([], [], '')).toBe(0);
  });

  it('should calculate density from fields', () => {
    const fields = [
      { label: 'Name', value: 'John Doe' },
      { label: 'Email', value: 'john@example.com' },
    ];

    const density = calculateBasicDensity(fields, [], '');

    // 2 fields * 2 points = 4 points, plus text length contribution
    expect(density).toBeGreaterThan(4);
  });

  it('should calculate density from items', () => {
    const items = [{}, {}, {}]; // 3 items

    const density = calculateBasicDensity([], items, '');

    // 3 items * 3 points = 9 points
    expect(density).toBe(9);
  });

  it('should calculate density from description', () => {
    const description = 'A'.repeat(100); // 100 chars

    const density = calculateBasicDensity([], [], description);

    // 100 chars / 50 = 2 points
    expect(density).toBe(2);
  });

  it('should combine all sources', () => {
    const fields = [{ label: 'Test', value: 'Value' }];
    const items = [{}, {}];
    const description = 'Short';

    const density = calculateBasicDensity(fields, items, description);

    // fields: 2 + text contribution, items: 6, description: ~0
    expect(density).toBeGreaterThan(8);
  });
});







