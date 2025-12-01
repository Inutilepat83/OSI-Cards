/**
 * Priority Ordering Utility
 * 
 * Advanced priority-based section ordering for masonry grid:
 * - Priority-based placement order
 * - Multi-level priority system
 * - Priority inheritance from parent sections
 * - Dynamic priority adjustment based on interactions
 * - Priority visualization mode for debugging
 * - Importance scoring algorithm
 * - User preference weighting
 * - Context-aware priority
 * - Priority decay over time
 * - Priority conflict resolution
 * 
 * @example
 * ```typescript
 * import { 
 *   PriorityManager,
 *   sortByPriority,
 *   calculateImportanceScore 
 * } from './priority-ordering.util';
 * 
 * const manager = new PriorityManager();
 * manager.setPriority('section-1', { level: 'critical', weight: 100 });
 * const sorted = manager.getSortedSections(sections);
 * ```
 */

import { CardSection } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Priority levels
 */
export type PriorityLevel = 'critical' | 'high' | 'normal' | 'low' | 'deferred';

/**
 * Priority source (where priority came from)
 */
export type PrioritySource = 
  | 'explicit'      // Set explicitly in section config
  | 'inherited'     // Inherited from parent/group
  | 'computed'      // Calculated based on content
  | 'user'          // Set by user interaction
  | 'context'       // Based on context (e.g., search results)
  | 'default';      // Default assignment

/**
 * Priority configuration for a section
 */
export interface SectionPriority {
  /** Priority level */
  level: PriorityLevel;
  /** Numeric weight (0-100, higher = more important) */
  weight: number;
  /** Source of this priority */
  source: PrioritySource;
  /** Parent section key for inheritance */
  parentKey?: string;
  /** Timestamp when set (for decay) */
  timestamp?: number;
  /** Custom priority metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Priority manager configuration
 */
export interface PriorityManagerConfig {
  /** Enable priority decay over time */
  enableDecay: boolean;
  /** Decay rate (0-1, weight multiplier per hour) */
  decayRate: number;
  /** Minimum weight after decay */
  minDecayWeight: number;
  /** Default priority for unset sections */
  defaultPriority: SectionPriority;
  /** Whether children inherit parent priority */
  enableInheritance: boolean;
  /** Inheritance factor (0-1) */
  inheritanceFactor: number;
}

/**
 * Default priority configuration
 */
export const DEFAULT_PRIORITY_CONFIG: PriorityManagerConfig = {
  enableDecay: false,
  decayRate: 0.95,
  minDecayWeight: 10,
  defaultPriority: {
    level: 'normal',
    weight: 50,
    source: 'default',
  },
  enableInheritance: true,
  inheritanceFactor: 0.8,
};

/**
 * Priority level to weight mapping
 */
export const PRIORITY_LEVEL_WEIGHTS: Record<PriorityLevel, number> = {
  'critical': 100,
  'high': 80,
  'normal': 50,
  'low': 30,
  'deferred': 10,
};

/**
 * Section type default priorities
 */
export const TYPE_DEFAULT_PRIORITIES: Record<string, PriorityLevel> = {
  'overview': 'critical',
  'hero': 'critical',
  'analytics': 'high',
  'financials': 'high',
  'chart': 'high',
  'contact-card': 'normal',
  'network-card': 'normal',
  'info': 'normal',
  'list': 'low',
  'timeline': 'low',
  'event': 'low',
};

/**
 * Priority visualization options
 */
export interface PriorityVisualizationOptions {
  /** Show priority badges */
  showBadges: boolean;
  /** Show weight numbers */
  showWeights: boolean;
  /** Color code by priority */
  colorCode: boolean;
  /** Highlight inheritance relationships */
  showInheritance: boolean;
}

/**
 * Visualization data for a section
 */
export interface PriorityVisualization {
  key: string;
  level: PriorityLevel;
  weight: number;
  color: string;
  badge: string;
  inheritedFrom?: string;
}

// ============================================================================
// PRIORITY MANAGER CLASS (Items 71-75)
// ============================================================================

/**
 * Manages section priorities with inheritance and decay
 */
export class PriorityManager {
  private readonly config: PriorityManagerConfig;
  private priorities: Map<string, SectionPriority> = new Map();
  private parentRelationships: Map<string, string> = new Map();

  constructor(config: Partial<PriorityManagerConfig> = {}) {
    this.config = { ...DEFAULT_PRIORITY_CONFIG, ...config };
  }

  /**
   * Sets priority for a section
   */
  setPriority(key: string, priority: Partial<SectionPriority>): void {
    const existing = this.priorities.get(key) ?? this.config.defaultPriority;
    
    this.priorities.set(key, {
      level: priority.level ?? existing.level,
      weight: priority.weight ?? PRIORITY_LEVEL_WEIGHTS[priority.level ?? existing.level],
      source: priority.source ?? 'explicit',
      parentKey: priority.parentKey,
      timestamp: Date.now(),
      metadata: priority.metadata,
    });
    
    if (priority.parentKey) {
      this.parentRelationships.set(key, priority.parentKey);
    }
  }

  /**
   * Gets effective priority for a section (with inheritance and decay)
   */
  getEffectivePriority(key: string): SectionPriority {
    const explicit = this.priorities.get(key);
    
    if (explicit) {
      // Apply decay if enabled
      if (this.config.enableDecay && explicit.timestamp) {
        return this.applyDecay(explicit);
      }
      return explicit;
    }
    
    // Check for inheritance
    if (this.config.enableInheritance) {
      const inherited = this.getInheritedPriority(key);
      if (inherited) {
        return inherited;
      }
    }
    
    return this.config.defaultPriority;
  }

  /**
   * Gets inherited priority from parent
   */
  private getInheritedPriority(key: string): SectionPriority | null {
    const parentKey = this.parentRelationships.get(key);
    if (!parentKey) return null;
    
    const parentPriority = this.priorities.get(parentKey);
    if (!parentPriority) return null;
    
    // Apply inheritance factor
    const inheritedWeight = parentPriority.weight * this.config.inheritanceFactor;
    
    return {
      ...parentPriority,
      weight: Math.max(this.config.minDecayWeight, inheritedWeight),
      source: 'inherited',
      parentKey,
    };
  }

  /**
   * Applies time-based decay to priority
   */
  private applyDecay(priority: SectionPriority): SectionPriority {
    if (!priority.timestamp) return priority;
    
    const hoursSinceSet = (Date.now() - priority.timestamp) / (1000 * 60 * 60);
    const decayFactor = Math.pow(this.config.decayRate, hoursSinceSet);
    const decayedWeight = priority.weight * decayFactor;
    
    return {
      ...priority,
      weight: Math.max(this.config.minDecayWeight, decayedWeight),
    };
  }

  /**
   * Sorts sections by priority
   */
  sortByPriority<T extends { key?: string; id?: string }>(sections: T[]): T[] {
    return [...sections].sort((a, b) => {
      const keyA = a.key ?? a.id ?? '';
      const keyB = b.key ?? b.id ?? '';
      const priorityA = this.getEffectivePriority(keyA);
      const priorityB = this.getEffectivePriority(keyB);
      
      // Higher weight = higher priority = comes first
      return priorityB.weight - priorityA.weight;
    });
  }

  /**
   * Groups sections by priority level
   */
  groupByPriority<T extends { key?: string; id?: string }>(
    sections: T[]
  ): Map<PriorityLevel, T[]> {
    const groups = new Map<PriorityLevel, T[]>();
    
    for (const level of ['critical', 'high', 'normal', 'low', 'deferred'] as PriorityLevel[]) {
      groups.set(level, []);
    }
    
    for (const section of sections) {
      const key = section.key ?? section.id ?? '';
      const priority = this.getEffectivePriority(key);
      const group = groups.get(priority.level) ?? [];
      group.push(section);
      groups.set(priority.level, group);
    }
    
    return groups;
  }

  /**
   * Boosts priority temporarily (e.g., for user interaction)
   */
  boostPriority(key: string, boostAmount: number = 20): void {
    const current = this.getEffectivePriority(key);
    this.setPriority(key, {
      ...current,
      weight: Math.min(100, current.weight + boostAmount),
      source: 'user',
    });
  }

  /**
   * Resets a section's priority to default
   */
  resetPriority(key: string): void {
    this.priorities.delete(key);
    this.parentRelationships.delete(key);
  }

  /**
   * Clears all priorities
   */
  clearAll(): void {
    this.priorities.clear();
    this.parentRelationships.clear();
  }

  /**
   * Gets visualization data for all sections
   */
  getVisualization(
    keys: string[],
    options: PriorityVisualizationOptions = {
      showBadges: true,
      showWeights: true,
      colorCode: true,
      showInheritance: true,
    }
  ): PriorityVisualization[] {
    return keys.map(key => {
      const priority = this.getEffectivePriority(key);
      return {
        key,
        level: priority.level,
        weight: Math.round(priority.weight),
        color: this.getPriorityColor(priority.level),
        badge: this.getPriorityBadge(priority.level),
        inheritedFrom: options.showInheritance ? priority.parentKey : undefined,
      };
    });
  }

  /**
   * Gets color for priority level
   */
  private getPriorityColor(level: PriorityLevel): string {
    const colors: Record<PriorityLevel, string> = {
      'critical': '#dc2626',  // red-600
      'high': '#f59e0b',      // amber-500
      'normal': '#3b82f6',    // blue-500
      'low': '#6b7280',       // gray-500
      'deferred': '#d1d5db',  // gray-300
    };
    return colors[level];
  }

  /**
   * Gets badge text for priority level
   */
  private getPriorityBadge(level: PriorityLevel): string {
    const badges: Record<PriorityLevel, string> = {
      'critical': '!!!',
      'high': '!!',
      'normal': '!',
      'low': '-',
      'deferred': '...',
    };
    return badges[level];
  }

  /**
   * Exports all priorities for persistence
   */
  export(): Map<string, SectionPriority> {
    return new Map(this.priorities);
  }

  /**
   * Imports priorities from persistence
   */
  import(data: Map<string, SectionPriority>): void {
    for (const [key, priority] of data) {
      this.priorities.set(key, priority);
      if (priority.parentKey) {
        this.parentRelationships.set(key, priority.parentKey);
      }
    }
  }
}

// ============================================================================
// IMPORTANCE SCORING (Item 76)
// ============================================================================

/**
 * Calculates importance score based on section content
 */
export function calculateImportanceScore(section: CardSection): number {
  let score = 50;  // Base score

  // Type-based score
  const typeLevel = TYPE_DEFAULT_PRIORITIES[section.type?.toLowerCase() ?? ''];
  if (typeLevel) {
    score = PRIORITY_LEVEL_WEIGHTS[typeLevel];
  }

  // Content richness bonus
  const fields = section.fields ?? [];
  const items = section.items ?? [];
  
  // More fields = more important (up to a point)
  score += Math.min(fields.length * 2, 10);
  
  // Items with data
  score += Math.min(items.length * 3, 15);

  // Title presence
  if (section.title && section.title.length > 0) {
    score += 5;
  }

  // Description presence
  if (section.description && section.description.length > 50) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Batch calculates importance scores
 */
export function calculateImportanceScores(
  sections: CardSection[]
): Map<string, number> {
  const scores = new Map<string, number>();
  
  for (const section of sections) {
    const key = section.id ?? section.title ?? '';
    scores.set(key, calculateImportanceScore(section));
  }
  
  return scores;
}

// ============================================================================
// USER PREFERENCE WEIGHTING (Item 77)
// ============================================================================

/**
 * User preference profile
 */
export interface UserPreferenceProfile {
  /** Preferred section types (boost priority) */
  preferredTypes: string[];
  /** Sections explicitly pinned */
  pinnedSections: string[];
  /** Sections explicitly hidden */
  hiddenSections: string[];
  /** Interaction history (section key -> click count) */
  interactionHistory: Map<string, number>;
}

/**
 * Applies user preferences to priorities
 */
export function applyUserPreferences(
  priorities: Map<string, SectionPriority>,
  sections: CardSection[],
  preferences: UserPreferenceProfile
): Map<string, SectionPriority> {
  const result = new Map(priorities);

  for (const section of sections) {
    const key = section.id ?? section.title ?? '';
    const current = result.get(key) ?? {
      level: 'normal' as PriorityLevel,
      weight: 50,
      source: 'default' as PrioritySource,
    };

    let weight = current.weight;

    // Boost for preferred types
    if (preferences.preferredTypes.includes(section.type ?? '')) {
      weight += 15;
    }

    // Pinned sections get max priority
    if (preferences.pinnedSections.includes(key)) {
      weight = 100;
    }

    // Hidden sections get min priority
    if (preferences.hiddenSections.includes(key)) {
      weight = 0;
    }

    // Interaction history boost
    const interactions = preferences.interactionHistory.get(key) ?? 0;
    weight += Math.min(interactions * 2, 10);

    result.set(key, {
      ...current,
      weight: Math.min(100, Math.max(0, weight)),
      source: 'user',
    });
  }

  return result;
}

// ============================================================================
// CONTEXT-AWARE PRIORITY (Item 78)
// ============================================================================

/**
 * Context for priority calculation
 */
export interface PriorityContext {
  /** Current search/filter query */
  searchQuery?: string;
  /** Active category/filter */
  activeCategory?: string;
  /** User's current task/goal */
  userTask?: 'overview' | 'detail' | 'comparison' | 'export';
  /** Time of day (for time-sensitive content) */
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  /** Device type */
  deviceType?: 'mobile' | 'tablet' | 'desktop';
}

/**
 * Adjusts priorities based on context
 */
export function applyContextPriorities(
  priorities: Map<string, SectionPriority>,
  sections: CardSection[],
  context: PriorityContext
): Map<string, SectionPriority> {
  const result = new Map(priorities);

  for (const section of sections) {
    const key = section.id ?? section.title ?? '';
    const current = result.get(key) ?? {
      level: 'normal' as PriorityLevel,
      weight: 50,
      source: 'default' as PrioritySource,
    };

    let weight = current.weight;
    const content = `${section.title ?? ''} ${section.description ?? ''}`.toLowerCase();

    // Search relevance boost
    if (context.searchQuery) {
      const query = context.searchQuery.toLowerCase();
      if (content.includes(query)) {
        weight += 30;
      }
    }

    // Category match boost
    if (context.activeCategory && section.type?.toLowerCase() === context.activeCategory.toLowerCase()) {
      weight += 20;
    }

    // Task-based adjustments
    if (context.userTask === 'overview') {
      if (['overview', 'analytics', 'stats'].includes(section.type?.toLowerCase() ?? '')) {
        weight += 15;
      }
    } else if (context.userTask === 'detail') {
      if (['info', 'contact-card', 'network-card'].includes(section.type?.toLowerCase() ?? '')) {
        weight += 15;
      }
    }

    // Device-based adjustments
    if (context.deviceType === 'mobile') {
      // On mobile, prioritize compact sections
      if ((section.colSpan ?? 1) === 1) {
        weight += 5;
      }
    }

    result.set(key, {
      ...current,
      weight: Math.min(100, Math.max(0, weight)),
      source: 'context',
    });
  }

  return result;
}

// ============================================================================
// PRIORITY CONFLICT RESOLUTION (Item 80)
// ============================================================================

/**
 * Conflict between two sections
 */
export interface PriorityConflict {
  section1Key: string;
  section2Key: string;
  type: 'same_priority' | 'competing_space' | 'mutual_dependency';
  resolution: 'use_weight' | 'use_timestamp' | 'use_source' | 'manual';
}

/**
 * Resolves priority conflicts
 */
export function resolvePriorityConflicts(
  priorities: Map<string, SectionPriority>
): { priorities: Map<string, SectionPriority>; conflicts: PriorityConflict[] } {
  const conflicts: PriorityConflict[] = [];
  const result = new Map(priorities);
  
  // Find sections with same weight
  const byWeight = new Map<number, string[]>();
  for (const [key, priority] of priorities) {
    const weight = Math.round(priority.weight);
    const list = byWeight.get(weight) ?? [];
    list.push(key);
    byWeight.set(weight, list);
  }

  // Resolve same-weight conflicts
  for (const [weight, keys] of byWeight) {
    if (keys.length <= 1) continue;

    for (let i = 0; i < keys.length - 1; i++) {
      const key1 = keys[i]!;
      const key2 = keys[i + 1]!;
      const priority1 = result.get(key1)!;
      const priority2 = result.get(key2)!;

      // Resolution: explicit > user > context > computed > inherited > default
      const sourceRank: Record<PrioritySource, number> = {
        'explicit': 6,
        'user': 5,
        'context': 4,
        'computed': 3,
        'inherited': 2,
        'default': 1,
      };

      if (sourceRank[priority1.source] !== sourceRank[priority2.source]) {
        // Different sources - lower ranked gets slight weight reduction
        const lowerKey = sourceRank[priority1.source] < sourceRank[priority2.source] ? key1 : key2;
        const lowerPriority = result.get(lowerKey)!;
        result.set(lowerKey, { ...lowerPriority, weight: lowerPriority.weight - 0.1 });
        
        conflicts.push({
          section1Key: key1,
          section2Key: key2,
          type: 'same_priority',
          resolution: 'use_source',
        });
      } else {
        // Same source - use timestamp (newer gets slight boost)
        const ts1 = priority1.timestamp ?? 0;
        const ts2 = priority2.timestamp ?? 0;
        
        if (ts1 !== ts2) {
          const olderKey = ts1 < ts2 ? key1 : key2;
          const olderPriority = result.get(olderKey)!;
          result.set(olderKey, { ...olderPriority, weight: olderPriority.weight - 0.1 });
          
          conflicts.push({
            section1Key: key1,
            section2Key: key2,
            type: 'same_priority',
            resolution: 'use_timestamp',
          });
        }
      }
    }
  }

  return { priorities: result, conflicts };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick sort sections by priority
 */
export function sortByPriority(sections: CardSection[]): CardSection[] {
  return [...sections].sort((a, b) => {
    const scoreA = calculateImportanceScore(a);
    const scoreB = calculateImportanceScore(b);
    return scoreB - scoreA;
  });
}

/**
 * Gets top N most important sections
 */
export function getTopPrioritySections(
  sections: CardSection[],
  count: number
): CardSection[] {
  return sortByPriority(sections).slice(0, count);
}

/**
 * Creates a priority manager with section priorities auto-calculated
 */
export function createPriorityManager(
  sections: CardSection[],
  config?: Partial<PriorityManagerConfig>
): PriorityManager {
  const manager = new PriorityManager(config);
  
  for (const section of sections) {
    const key = section.id ?? section.title ?? '';
    const score = calculateImportanceScore(section);
    const level = score >= 80 ? 'high' :
                  score >= 60 ? 'normal' :
                  score >= 40 ? 'low' : 'deferred';
    
    manager.setPriority(key, {
      level,
      weight: score,
      source: 'computed',
    });
  }
  
  return manager;
}

