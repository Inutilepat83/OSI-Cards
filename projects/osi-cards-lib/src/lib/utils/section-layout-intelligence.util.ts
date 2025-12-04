/**
 * Section Layout Intelligence System
 *
 * Provides intelligent layout decisions for each section type based on:
 * - Content characteristics (text length, item count, etc.)
 * - Responsive breakpoints
 * - Preferred column spans per section type
 * - Vertical vs horizontal layout optimization
 * - Compacity requirements
 *
 * @example
 * ```typescript
 * const intelligence = new SectionLayoutIntelligence();
 * const layout = intelligence.optimizeSection(section, containerWidth, availableColumns);
 * ```
 */

import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Responsive breakpoint definitions
 */
export interface ResponsiveBreakpoints {
  mobile: number; // < 640px
  tablet: number; // < 1024px
  desktop: number; // < 1440px
  wide: number; // >= 1440px
}

/**
 * Content characteristics for a section
 */
export interface ContentCharacteristics {
  /** Estimated text length in characters */
  textLength: number;
  /** Number of list items */
  itemCount: number;
  /** Number of images */
  imageCount: number;
  /** Whether content is text-heavy */
  isTextHeavy: boolean;
  /** Whether content is image-heavy */
  isImageHeavy: boolean;
  /** Whether content benefits from horizontal layout */
  prefersHorizontal: boolean;
  /** Whether content benefits from vertical layout */
  prefersVertical: boolean;
  /** Minimum width needed for content (px) */
  minWidth: number;
  /** Optimal width for content (px) */
  optimalWidth: number;
}

/**
 * Layout preferences for a section type
 */
export interface SectionLayoutPreferences {
  /** Section type identifier */
  type: string;
  /** Preferred column spans per breakpoint */
  preferredColumns: {
    mobile: number;
    tablet: number;
    desktop: number;
    wide: number;
  };
  /** Minimum columns (can't shrink below this) */
  minColumns: number;
  /** Maximum columns (won't expand beyond this) */
  maxColumns: number;
  /** Can section shrink if needed? */
  canShrink: boolean;
  /** Can section expand to fill gaps? */
  canExpand: boolean;
  /** Priority for placement (higher = place first) */
  placementPriority: number;
  /** Should section try to be compact? */
  preferCompact: boolean;
  /** Aspect ratio preference (width/height) */
  aspectRatio?: number;
  /** Whether this section is a "header" type (should be full width) */
  isHeader: boolean;
  /** Whether this section is a "footer" type (should be full width) */
  isFooter: boolean;
}

/**
 * Optimized layout result for a section
 */
export interface OptimizedSectionLayout {
  /** Recommended column span */
  colSpan: number;
  /** Estimated height in pixels */
  estimatedHeight: number;
  /** Whether layout is horizontal */
  isHorizontal: boolean;
  /** Reason for this layout choice */
  reason: string;
  /** Compacity score (0-100, higher = more compact) */
  compacityScore: number;
  /** Content density (items per column) */
  contentDensity: number;
}

/**
 * Compaction strategy configuration
 */
export interface CompactionConfig {
  /** Enable aggressive compaction */
  aggressive: boolean;
  /** Allow section shrinking */
  allowShrinking: boolean;
  /** Allow section splitting (for very tall sections) */
  allowSplitting: boolean;
  /** Maximum gap tolerance (px) */
  maxGapTolerance: number;
  /** Minimum section height for compaction */
  minHeightForCompaction: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1440,
  wide: 1920,
};

const DEFAULT_COMPACTION_CONFIG: CompactionConfig = {
  aggressive: true,
  allowShrinking: true,
  allowSplitting: false,
  maxGapTolerance: 50,
  minHeightForCompaction: 200,
};

/**
 * Section type registry with layout preferences
 */
const SECTION_TYPE_PREFERENCES: Record<string, SectionLayoutPreferences> = {
  // Headers and Overviews (full width)
  overview: {
    type: 'overview',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 4, wide: 4 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: false,
    canExpand: true,
    placementPriority: 100,
    preferCompact: false,
    isHeader: true,
    isFooter: false,
  },
  hero: {
    type: 'hero',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 4, wide: 4 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: false,
    canExpand: true,
    placementPriority: 100,
    preferCompact: false,
    isHeader: true,
    isFooter: false,
  },

  // Charts and Analytics (prefer 2 columns, can adapt)
  chart: {
    type: 'chart',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: true,
    placementPriority: 70,
    preferCompact: false,
    aspectRatio: 1.5,
    isHeader: false,
    isFooter: false,
  },
  analytics: {
    type: 'analytics',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 3 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: true,
    placementPriority: 70,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  stats: {
    type: 'stats',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: true,
    canExpand: true,
    placementPriority: 60,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },

  // Maps (prefer square-ish)
  map: {
    type: 'map',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: false,
    placementPriority: 65,
    preferCompact: false,
    aspectRatio: 1.2,
    isHeader: false,
    isFooter: false,
  },

  // Contact and Profile Cards (compact, 1 column)
  'contact-card': {
    type: 'contact-card',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 1 },
    minColumns: 1,
    maxColumns: 1,
    canShrink: false,
    canExpand: false,
    placementPriority: 50,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  'profile-card': {
    type: 'profile-card',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 1 },
    minColumns: 1,
    maxColumns: 1,
    canShrink: false,
    canExpand: false,
    placementPriority: 50,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  'network-card': {
    type: 'network-card',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: false,
    canExpand: true,
    placementPriority: 50,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },

  // Lists and Text (flexible, prefer 1-2 columns)
  list: {
    type: 'list',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 1 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: false,
    canExpand: true,
    placementPriority: 40,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  info: {
    type: 'info',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: false,
    canExpand: true,
    placementPriority: 40,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  text: {
    type: 'text',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: true,
    placementPriority: 40,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },

  // Timeline and Events (prefer horizontal on wider screens)
  timeline: {
    type: 'timeline',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: true,
    canExpand: true,
    placementPriority: 60,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },
  event: {
    type: 'event',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: true,
    canExpand: true,
    placementPriority: 50,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },

  // News and Articles
  news: {
    type: 'news',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 1 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: false,
    canExpand: true,
    placementPriority: 45,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
  article: {
    type: 'article',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 3 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: true,
    placementPriority: 50,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },

  // Products and Media
  product: {
    type: 'product',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: true,
    canExpand: false,
    placementPriority: 55,
    preferCompact: true,
    aspectRatio: 0.8,
    isHeader: false,
    isFooter: false,
  },
  gallery: {
    type: 'gallery',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 3, wide: 3 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: true,
    canExpand: true,
    placementPriority: 60,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },
  video: {
    type: 'video',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: false,
    placementPriority: 70,
    preferCompact: false,
    aspectRatio: 1.78, // 16:9
    isHeader: false,
    isFooter: false,
  },

  // Tables and Data
  table: {
    type: 'table',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 3, wide: 4 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: true,
    canExpand: true,
    placementPriority: 65,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },
  'data-grid': {
    type: 'data-grid',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 4, wide: 4 },
    minColumns: 1,
    maxColumns: 4,
    canShrink: true,
    canExpand: true,
    placementPriority: 70,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },

  // Forms
  form: {
    type: 'form',
    preferredColumns: { mobile: 1, tablet: 2, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 3,
    canShrink: true,
    canExpand: false,
    placementPriority: 80,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },

  // FAQ
  faq: {
    type: 'faq',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 2, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: true,
    canExpand: true,
    placementPriority: 50,
    preferCompact: false,
    isHeader: false,
    isFooter: false,
  },

  // Default fallback
  default: {
    type: 'default',
    preferredColumns: { mobile: 1, tablet: 1, desktop: 1, wide: 2 },
    minColumns: 1,
    maxColumns: 2,
    canShrink: true,
    canExpand: true,
    placementPriority: 50,
    preferCompact: true,
    isHeader: false,
    isFooter: false,
  },
};

// ============================================================================
// SECTION LAYOUT INTELLIGENCE
// ============================================================================

/**
 * Main intelligence system for section layout optimization
 */
export class SectionLayoutIntelligence {
  private readonly breakpoints: ResponsiveBreakpoints;
  private readonly compactionConfig: CompactionConfig;

  constructor(
    breakpoints: Partial<ResponsiveBreakpoints> = {},
    compactionConfig: Partial<CompactionConfig> = {}
  ) {
    this.breakpoints = { ...DEFAULT_BREAKPOINTS, ...breakpoints };
    this.compactionConfig = { ...DEFAULT_COMPACTION_CONFIG, ...compactionConfig };
  }

  /**
   * Optimizes layout for a section based on all factors
   */
  optimizeSection(
    section: CardSection,
    containerWidth: number,
    availableColumns: number,
    pendingSections: CardSection[] = []
  ): OptimizedSectionLayout {
    // Get section preferences
    const preferences = this.getSectionPreferences(section);

    // Analyze content
    const content = this.analyzeContent(section);

    // Determine current breakpoint
    const breakpoint = this.getCurrentBreakpoint(containerWidth);

    // Calculate optimal column span
    const colSpan = this.calculateOptimalColSpan(
      preferences,
      content,
      breakpoint,
      availableColumns,
      pendingSections
    );

    // Estimate height
    const estimatedHeight = this.estimateHeight(section, colSpan, content);

    // Determine layout orientation
    const isHorizontal = this.shouldUseHorizontalLayout(section, colSpan, content, breakpoint);

    // Calculate compacity score
    const compacityScore = this.calculateCompacityScore(
      colSpan,
      estimatedHeight,
      content,
      preferences
    );

    // Generate reason
    const reason = this.generateLayoutReason(preferences, content, breakpoint, colSpan);

    return {
      colSpan,
      estimatedHeight,
      isHorizontal,
      reason,
      compacityScore,
      contentDensity: this.calculateContentDensity(content, colSpan),
    };
  }

  /**
   * Gets layout preferences for a section
   */
  getSectionPreferences(section: CardSection): SectionLayoutPreferences {
    const type = (section.type || 'default').toLowerCase();
    return SECTION_TYPE_PREFERENCES[type] || SECTION_TYPE_PREFERENCES['default']!;
  }

  /**
   * Analyzes content characteristics
   */
  analyzeContent(section: CardSection): ContentCharacteristics {
    const content: any = section.content || {};

    // Count text length
    const textLength =
      (content.text || '').length +
      (content.title || section.title || '').length +
      (content.description || '').length;

    // Count items
    const itemCount = (content.items || []).length;

    // Count images
    const imageCount = (content.images || []).length + (content.image ? 1 : 0);

    // Determine characteristics
    const isTextHeavy = textLength > 500 || itemCount > 10;
    const isImageHeavy = imageCount > 2;

    // Layout preferences
    const prefersHorizontal =
      section.type === 'timeline' ||
      section.type === 'gallery' ||
      (itemCount > 5 && itemCount < 15);

    const prefersVertical =
      section.type === 'list' || section.type === 'contact-card' || itemCount > 15;

    // Width requirements
    const minWidth = this.calculateMinWidth(section);
    const optimalWidth = this.calculateOptimalWidth(section, textLength, itemCount);

    return {
      textLength,
      itemCount,
      imageCount,
      isTextHeavy,
      isImageHeavy,
      prefersHorizontal,
      prefersVertical,
      minWidth,
      optimalWidth,
    };
  }

  /**
   * Determines current responsive breakpoint
   */
  getCurrentBreakpoint(containerWidth: number): keyof ResponsiveBreakpoints {
    if (containerWidth < this.breakpoints.mobile) {
      return 'mobile';
    } else if (containerWidth < this.breakpoints.tablet) {
      return 'tablet';
    } else if (containerWidth < this.breakpoints.desktop) {
      return 'desktop';
    } else {
      return 'wide';
    }
  }

  /**
   * Calculates optimal column span
   */
  private calculateOptimalColSpan(
    preferences: SectionLayoutPreferences,
    content: ContentCharacteristics,
    breakpoint: keyof ResponsiveBreakpoints,
    availableColumns: number,
    pendingSections: CardSection[]
  ): number {
    // Start with preferred span for breakpoint
    let colSpan = preferences.preferredColumns[breakpoint];

    // Adjust for content
    if (content.isTextHeavy && colSpan < 2) {
      colSpan = Math.min(2, availableColumns);
    }

    // Adjust for compaction
    if (this.compactionConfig.aggressive && preferences.preferCompact) {
      colSpan = Math.max(preferences.minColumns, colSpan - 1);
    }

    // Ensure within bounds
    colSpan = Math.max(preferences.minColumns, colSpan);
    colSpan = Math.min(preferences.maxColumns, colSpan);
    colSpan = Math.min(availableColumns, colSpan);

    // Check if shrinking helps fill gaps better
    if (this.compactionConfig.allowShrinking && pendingSections.length > 0) {
      const shrunkSpan = this.tryShrinkForGapFilling(
        colSpan,
        preferences,
        availableColumns,
        pendingSections
      );
      if (shrunkSpan < colSpan && shrunkSpan >= preferences.minColumns) {
        colSpan = shrunkSpan;
      }
    }

    return colSpan;
  }

  /**
   * Tries shrinking section to better fill remaining space
   */
  private tryShrinkForGapFilling(
    currentSpan: number,
    preferences: SectionLayoutPreferences,
    availableColumns: number,
    pendingSections: CardSection[]
  ): number {
    if (!preferences.canShrink) {
      return currentSpan;
    }

    const remaining = availableColumns - currentSpan;

    // Check if any pending section fits in remaining space
    const minPendingSpan =
      pendingSections.length > 0 ? Math.min(...pendingSections.map((s) => s.colSpan || 1)) : 1;

    // If remaining space can't fit any pending section, try shrinking
    if (remaining > 0 && remaining < minPendingSpan && currentSpan > preferences.minColumns) {
      // Try one column less
      const shrunkSpan = currentSpan - 1;
      const newRemaining = availableColumns - shrunkSpan;

      // If new remaining fits a pending section, shrink
      if (newRemaining >= minPendingSpan) {
        return shrunkSpan;
      }
    }

    return currentSpan;
  }

  /**
   * Estimates section height based on content and column span
   */
  private estimateHeight(
    section: CardSection,
    colSpan: number,
    content: ContentCharacteristics
  ): number {
    // Start with base height by type
    let height = this.getBaseHeight(section.type || 'default');

    // Adjust for text content
    if (content.textLength > 0) {
      const charsPerLine = colSpan * 40; // ~40 chars per column
      const lines = Math.ceil(content.textLength / charsPerLine);
      height += lines * 20; // ~20px per line
    }

    // Adjust for list items
    if (content.itemCount > 0) {
      const itemsPerColumn = Math.ceil(content.itemCount / colSpan);
      height += itemsPerColumn * 40; // ~40px per item
    }

    // Adjust for images
    if (content.imageCount > 0) {
      height += content.imageCount * 150; // ~150px per image
    }

    // Respect aspect ratio if defined
    const preferences = this.getSectionPreferences(section);
    if (preferences.aspectRatio) {
      const columnWidth = 260; // Approximate column width
      const sectionWidth = columnWidth * colSpan;
      const aspectHeight = sectionWidth / preferences.aspectRatio;
      height = Math.max(height, aspectHeight);
    }

    // Clamp to reasonable bounds
    return Math.max(150, Math.min(800, height));
  }

  /**
   * Determines if horizontal layout should be used
   */
  private shouldUseHorizontalLayout(
    section: CardSection,
    colSpan: number,
    content: ContentCharacteristics,
    breakpoint: keyof ResponsiveBreakpoints
  ): boolean {
    // Never horizontal on mobile
    if (breakpoint === 'mobile') {
      return false;
    }

    // Always horizontal for certain types with enough space
    if ((section.type === 'timeline' || section.type === 'gallery') && colSpan >= 2) {
      return true;
    }

    // Horizontal if content prefers it and we have space
    if (content.prefersHorizontal && colSpan >= 2) {
      return true;
    }

    // Horizontal if we have many items and wide layout
    if (content.itemCount > 5 && content.itemCount < 20 && colSpan >= 3) {
      return true;
    }

    return false;
  }

  /**
   * Calculates compacity score
   */
  private calculateCompacityScore(
    colSpan: number,
    height: number,
    content: ContentCharacteristics,
    preferences: SectionLayoutPreferences
  ): number {
    let score = 50; // Base score

    // Prefer narrower sections (more compact)
    score += (4 - colSpan) * 10;

    // Prefer shorter sections
    if (height < 300) score += 20;
    else if (height < 400) score += 10;
    else if (height > 600) score -= 10;

    // Bonus for compact preference
    if (preferences.preferCompact) score += 15;

    // Penalty for wasted space
    const contentVolume = content.textLength + content.itemCount * 50 + content.imageCount * 100;
    const sectionVolume = colSpan * height;
    const utilization = contentVolume / sectionVolume;
    if (utilization > 0.7) score += 10;
    else if (utilization < 0.3) score -= 20;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculates content density (items per column)
   */
  private calculateContentDensity(content: ContentCharacteristics, colSpan: number): number {
    const totalItems =
      Math.ceil(content.textLength / 100) + // Text as "virtual items"
      content.itemCount +
      content.imageCount;

    return totalItems / colSpan;
  }

  /**
   * Generates human-readable reason for layout decision
   */
  private generateLayoutReason(
    preferences: SectionLayoutPreferences,
    content: ContentCharacteristics,
    breakpoint: keyof ResponsiveBreakpoints,
    colSpan: number
  ): string {
    const reasons: string[] = [];

    reasons.push(`${breakpoint} breakpoint`);

    if (colSpan === preferences.preferredColumns[breakpoint]) {
      reasons.push('preferred size');
    } else if (colSpan < preferences.preferredColumns[breakpoint]) {
      reasons.push('shrunk for compaction');
    } else {
      reasons.push('expanded to fill space');
    }

    if (content.isTextHeavy) reasons.push('text-heavy content');
    if (content.isImageHeavy) reasons.push('image-heavy content');
    if (preferences.preferCompact) reasons.push('compact preference');

    return reasons.join(', ');
  }

  /**
   * Gets base height for a section type
   */
  private getBaseHeight(type: string): number {
    const heights: Record<string, number> = {
      overview: 300,
      hero: 400,
      chart: 250,
      analytics: 220,
      stats: 180,
      map: 300,
      'contact-card': 200,
      'profile-card': 250,
      'network-card': 180,
      list: 200,
      info: 180,
      text: 200,
      timeline: 250,
      event: 200,
      news: 180,
      article: 300,
      product: 250,
      gallery: 300,
      video: 280,
      table: 300,
      'data-grid': 350,
      form: 300,
      faq: 200,
      default: 200,
    };

    return heights[type.toLowerCase()] || heights['default']!;
  }

  /**
   * Calculates minimum width needed for section
   */
  private calculateMinWidth(section: CardSection): number {
    const type = section.type || 'default';

    // Some sections have minimum width requirements
    const minWidths: Record<string, number> = {
      chart: 300,
      map: 280,
      table: 350,
      'data-grid': 400,
      video: 320,
      gallery: 300,
    };

    return minWidths[type.toLowerCase()] || 260;
  }

  /**
   * Calculates optimal width for section content
   */
  private calculateOptimalWidth(
    section: CardSection,
    textLength: number,
    itemCount: number
  ): number {
    let width = 300; // Base

    // More text = more width helpful
    if (textLength > 500) width = 600;
    else if (textLength > 200) width = 450;

    // Many items = more width helpful
    if (itemCount > 10) width = Math.max(width, 500);

    return width;
  }

  /**
   * Exports section preferences for external use
   */
  exportSectionPreferences(): Record<string, SectionLayoutPreferences> {
    return { ...SECTION_TYPE_PREFERENCES };
  }

  /**
   * Updates preferences for a section type
   */
  updateSectionPreferences(type: string, preferences: Partial<SectionLayoutPreferences>): void {
    const existing = SECTION_TYPE_PREFERENCES[type] || SECTION_TYPE_PREFERENCES['default']!;
    SECTION_TYPE_PREFERENCES[type] = { ...existing, ...preferences };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick helper to get preferred columns for current breakpoint
 */
export function getPreferredColumns(
  sectionType: string,
  containerWidth: number,
  breakpoints: Partial<ResponsiveBreakpoints> = {}
): number {
  const intelligence = new SectionLayoutIntelligence(breakpoints);
  const bp = intelligence.getCurrentBreakpoint(containerWidth);
  const preferences = intelligence.getSectionPreferences({ type: sectionType } as CardSection);
  return preferences.preferredColumns[bp];
}

/**
 * Quick helper to check if section should be compact
 */
export function shouldBeCompact(sectionType: string): boolean {
  const preferences =
    SECTION_TYPE_PREFERENCES[sectionType.toLowerCase()] || SECTION_TYPE_PREFERENCES['default']!;
  return preferences.preferCompact;
}

/**
 * Quick helper to get placement priority
 */
export function getPlacementPriority(sectionType: string): number {
  const preferences =
    SECTION_TYPE_PREFERENCES[sectionType.toLowerCase()] || SECTION_TYPE_PREFERENCES['default']!;
  return preferences.placementPriority;
}

/**
 * Sorts sections by placement priority (highest first)
 */
export function sortByPlacementPriority(sections: CardSection[]): CardSection[] {
  return [...sections].sort((a, b) => {
    const priorityA = getPlacementPriority(a.type || 'default');
    const priorityB = getPlacementPriority(b.type || 'default');
    return priorityB - priorityA;
  });
}
