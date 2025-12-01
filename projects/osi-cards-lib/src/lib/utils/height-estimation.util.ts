/**
 * Height Estimation Utility
 * 
 * Advanced height estimation algorithms for masonry grid sections:
 * - ML-based height prediction using historical data patterns
 * - Content-aware height calculation with text analysis
 * - Image/media height detection
 * - Height caching with content hashing
 * - Progressive height refinement after DOM measurement
 * - Virtualized height sampling for large lists
 * - Responsive height modifiers per breakpoint
 * - Font-aware height calculation
 * - Height histogram analysis for algorithm tuning
 * - Height delta tolerance for reflow prevention
 * 
 * @example
 * ```typescript
 * import { 
 *   HeightEstimator, 
 *   HeightCache, 
 *   HeightHistogram 
 * } from './height-estimation.util';
 * 
 * const estimator = new HeightEstimator();
 * const height = estimator.estimate(section, { columnWidth: 300 });
 * 
 * const cache = new HeightCache();
 * cache.set(section, measuredHeight);
 * ```
 */

import { CardSection, CardField } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Height estimation configuration
 */
export interface HeightEstimationConfig {
  /** Base padding (header + footer) in pixels */
  basePadding: number;
  /** Height per field in pixels */
  heightPerField: number;
  /** Height per item in pixels */
  heightPerItem: number;
  /** Average character width for text wrapping calculation */
  avgCharWidth: number;
  /** Line height in pixels */
  lineHeight: number;
  /** Minimum section height */
  minHeight: number;
  /** Maximum section height */
  maxHeight: number;
  /** Header height */
  headerHeight: number;
  /** Default column width for calculations */
  defaultColumnWidth: number;
}

/**
 * Default estimation configuration
 */
export const DEFAULT_HEIGHT_CONFIG: HeightEstimationConfig = {
  basePadding: 48,
  heightPerField: 32,
  heightPerItem: 52,
  avgCharWidth: 8,
  lineHeight: 24,
  minHeight: 80,
  maxHeight: 600,
  headerHeight: 48,
  defaultColumnWidth: 280,
};

/**
 * Type-specific height estimates
 */
export const TYPE_BASE_HEIGHTS: Record<string, number> = {
  'overview': 180,
  'contact-card': 160,
  'network-card': 160,
  'analytics': 200,
  'stats': 180,
  'chart': 280,
  'map': 250,
  'financials': 200,
  'info': 180,
  'list': 220,
  'event': 240,
  'timeline': 240,
  'product': 260,
  'solutions': 240,
  'quotation': 160,
  'text-reference': 180,
  'project': 200,
  'default': 180,
};

/**
 * Estimation context for responsive calculations
 */
export interface EstimationContext {
  /** Column width in pixels */
  columnWidth?: number;
  /** Number of columns section spans */
  colSpan?: number;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Whether section is collapsed */
  isCollapsed?: boolean;
  /** Breakpoint for responsive adjustments */
  breakpoint?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Height cache entry
 */
export interface HeightCacheEntry {
  /** Estimated height */
  estimatedHeight: number;
  /** Measured height (if available) */
  measuredHeight?: number;
  /** Content hash for invalidation */
  contentHash: string;
  /** Timestamp */
  timestamp: number;
  /** Confidence score (0-100) */
  confidence: number;
}

/**
 * Height histogram bucket
 */
export interface HeightBucket {
  /** Range start (inclusive) */
  min: number;
  /** Range end (exclusive) */
  max: number;
  /** Count of sections in this bucket */
  count: number;
  /** Section keys in this bucket */
  sectionKeys: string[];
}

/**
 * Height refinement result
 */
export interface HeightRefinementResult {
  /** Section key */
  key: string;
  /** Original estimated height */
  estimatedHeight: number;
  /** Measured height */
  measuredHeight: number;
  /** Difference */
  delta: number;
  /** Whether reflow is needed */
  needsReflow: boolean;
}

// ============================================================================
// HEIGHT ESTIMATOR CLASS (Items 26-27)
// ============================================================================

/**
 * Advanced height estimator with ML-inspired heuristics.
 * 
 * Uses a combination of:
 * - Historical patterns (learned from previous measurements)
 * - Content analysis (text length, field count, item count)
 * - Type-specific base heights
 * - Responsive adjustments
 */
export class HeightEstimator {
  private readonly config: HeightEstimationConfig;
  private readonly learningData: Map<string, number[]> = new Map();  // Type -> measured heights

  constructor(config: Partial<HeightEstimationConfig> = {}) {
    this.config = { ...DEFAULT_HEIGHT_CONFIG, ...config };
  }

  /**
   * Estimates section height using ML-inspired heuristics
   */
  estimate(section: CardSection, context: EstimationContext = {}): number {
    const type = section.type?.toLowerCase() ?? 'default';
    const columnWidth = context.columnWidth ?? this.config.defaultColumnWidth;
    const colSpan = context.colSpan ?? 1;
    const effectiveWidth = columnWidth * colSpan;

    // Start with type-based base height
    let height = this.getBaseHeight(type);

    // Add content-based height
    height += this.calculateContentHeight(section, effectiveWidth, context);

    // Apply ML adjustment if we have learning data
    height = this.applyLearningAdjustment(type, height);

    // Apply responsive modifiers
    height = this.applyResponsiveModifier(height, context);

    // Clamp to min/max
    return Math.min(this.config.maxHeight, Math.max(this.config.minHeight, Math.round(height)));
  }

  /**
   * Gets base height for a section type
   */
  private getBaseHeight(type: string): number {
    return TYPE_BASE_HEIGHTS[type] ?? TYPE_BASE_HEIGHTS['default'] ?? 180;
  }

  /**
   * Calculates height based on content analysis
   */
  private calculateContentHeight(
    section: CardSection,
    effectiveWidth: number,
    context: EstimationContext
  ): number {
    let contentHeight = 0;
    const fontSize = context.fontSize ?? 14;
    const charWidth = this.config.avgCharWidth * (fontSize / 14);
    const charsPerLine = Math.floor(effectiveWidth / charWidth);

    // Fields contribution
    const fields = section.fields ?? [];
    for (const field of fields) {
      const fieldHeight = this.estimateFieldHeight(field, charsPerLine);
      contentHeight += fieldHeight;
    }

    // Items contribution
    const items = section.items ?? [];
    for (const item of items) {
      const itemHeight = this.estimateItemHeight(item, charsPerLine);
      contentHeight += itemHeight;
    }

    // Description contribution
    if (section.description) {
      const descLines = Math.ceil(section.description.length / charsPerLine);
      contentHeight += descLines * this.config.lineHeight;
    }

    return contentHeight;
  }

  /**
   * Estimates height for a single field
   */
  private estimateFieldHeight(field: CardField, charsPerLine: number): number {
    const labelLength = field.label?.length ?? 0;
    const valueLength = String(field.value ?? '').length;
    
    // Estimate lines needed
    const labelLines = Math.ceil(labelLength / charsPerLine);
    const valueLines = Math.ceil(valueLength / charsPerLine);
    
    // Fields typically show label on one line, value may wrap
    const lines = Math.max(1, valueLines);
    
    return this.config.heightPerField + (lines - 1) * this.config.lineHeight;
  }

  /**
   * Estimates height for a single item
   */
  private estimateItemHeight(item: { title?: string; description?: string }, charsPerLine: number): number {
    const titleLength = item.title?.length ?? 0;
    const descLength = item.description?.length ?? 0;
    
    const titleLines = Math.ceil(titleLength / charsPerLine);
    const descLines = Math.ceil(descLength / charsPerLine);
    
    return this.config.heightPerItem + (titleLines + descLines - 2) * this.config.lineHeight;
  }

  /**
   * Applies ML-based adjustment from historical data
   */
  private applyLearningAdjustment(type: string, estimatedHeight: number): number {
    const historical = this.learningData.get(type);
    if (!historical || historical.length < 5) {
      return estimatedHeight;
    }

    // Calculate average from historical data
    const avgHistorical = historical.reduce((a, b) => a + b, 0) / historical.length;
    
    // Weighted average: 70% estimate, 30% historical
    return estimatedHeight * 0.7 + avgHistorical * 0.3;
  }

  /**
   * Applies responsive height modifier
   */
  private applyResponsiveModifier(height: number, context: EstimationContext): number {
    const breakpoint = context.breakpoint ?? 'md';
    
    // Narrower columns = taller sections (more text wrapping)
    const modifiers: Record<string, number> = {
      'xs': 1.3,   // Mobile: 30% taller
      'sm': 1.15,  // Small: 15% taller
      'md': 1.0,   // Medium: baseline
      'lg': 0.95,  // Large: slightly shorter
      'xl': 0.9,   // Extra large: shorter
    };

    return height * (modifiers[breakpoint] ?? 1.0);
  }

  /**
   * Records measured height for learning
   */
  recordMeasurement(type: string, measuredHeight: number): void {
    const historical = this.learningData.get(type) ?? [];
    historical.push(measuredHeight);
    
    // Keep last 100 measurements per type
    if (historical.length > 100) {
      historical.shift();
    }
    
    this.learningData.set(type, historical);
  }

  /**
   * Gets learning data for a type
   */
  getLearningData(type: string): number[] {
    return this.learningData.get(type) ?? [];
  }

  /**
   * Exports learning data for persistence
   */
  exportLearningData(): Record<string, number[]> {
    const data: Record<string, number[]> = {};
    for (const [type, heights] of this.learningData) {
      data[type] = heights;
    }
    return data;
  }

  /**
   * Imports learning data from persistence
   */
  importLearningData(data: Record<string, number[]>): void {
    for (const [type, heights] of Object.entries(data)) {
      this.learningData.set(type, heights);
    }
  }
}

// ============================================================================
// HEIGHT CACHE (Item 29)
// ============================================================================

/**
 * Caches measured and estimated heights with content hashing.
 * Supports invalidation when content changes.
 */
export class HeightCache {
  private readonly cache: Map<string, HeightCacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly maxAge: number;  // ms

  constructor(options?: { maxSize?: number; maxAgeMs?: number }) {
    this.maxSize = options?.maxSize ?? 500;
    this.maxAge = options?.maxAgeMs ?? 5 * 60 * 1000;  // 5 minutes
  }

  /**
   * Generates content hash for a section
   */
  private generateHash(section: CardSection): string {
    const parts = [
      section.type ?? '',
      section.title ?? '',
      section.description?.substring(0, 100) ?? '',
      String(section.fields?.length ?? 0),
      String(section.items?.length ?? 0),
    ];
    
    // Simple hash function
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return String(Math.abs(hash));
  }

  /**
   * Gets cached height if valid
   */
  get(section: CardSection): HeightCacheEntry | null {
    const key = section.id ?? section.title ?? '';
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check age
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // Check content hash
    const currentHash = this.generateHash(section);
    if (entry.contentHash !== currentHash) {
      this.cache.delete(key);
      return null;
    }
    
    return entry;
  }

  /**
   * Sets cached height
   */
  set(
    section: CardSection,
    height: number,
    options?: { measured?: boolean; confidence?: number }
  ): void {
    const key = section.id ?? section.title ?? '';
    const isMeasured = options?.measured ?? false;
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
    
    const existing = this.cache.get(key);
    
    const entry: HeightCacheEntry = {
      estimatedHeight: isMeasured ? (existing?.estimatedHeight ?? height) : height,
      measuredHeight: isMeasured ? height : existing?.measuredHeight,
      contentHash: this.generateHash(section),
      timestamp: Date.now(),
      confidence: isMeasured ? 100 : (options?.confidence ?? 70),
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Gets cached height or estimates
   */
  getOrEstimate(section: CardSection, estimator: HeightEstimator): number {
    const cached = this.get(section);
    
    if (cached?.measuredHeight) {
      return cached.measuredHeight;
    }
    
    if (cached?.estimatedHeight && cached.confidence > 80) {
      return cached.estimatedHeight;
    }
    
    const estimated = estimator.estimate(section);
    this.set(section, estimated, { measured: false, confidence: 70 });
    return estimated;
  }

  /**
   * Updates with measured height
   */
  updateMeasured(section: CardSection, measuredHeight: number): void {
    this.set(section, measuredHeight, { measured: true, confidence: 100 });
  }

  /**
   * Clears cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    measuredCount: number;
    avgConfidence: number;
  } {
    let measuredCount = 0;
    let totalConfidence = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.measuredHeight !== undefined) {
        measuredCount++;
      }
      totalConfidence += entry.confidence;
    }
    
    return {
      size: this.cache.size,
      measuredCount,
      avgConfidence: this.cache.size > 0 ? totalConfidence / this.cache.size : 0,
    };
  }
}

// ============================================================================
// PROGRESSIVE HEIGHT REFINEMENT (Item 30)
// ============================================================================

/**
 * Progressively refines height estimates after DOM measurement.
 * Only triggers reflow when changes exceed tolerance threshold.
 */
export class HeightRefiner {
  private readonly tolerance: number;
  private readonly cache: HeightCache;
  private readonly estimator: HeightEstimator;
  private pendingRefinements: HeightRefinementResult[] = [];

  constructor(options?: {
    tolerance?: number;
    cache?: HeightCache;
    estimator?: HeightEstimator;
  }) {
    this.tolerance = options?.tolerance ?? 10;  // 10px default tolerance
    this.cache = options?.cache ?? new HeightCache();
    this.estimator = options?.estimator ?? new HeightEstimator();
  }

  /**
   * Records a DOM measurement and determines if reflow is needed
   */
  recordMeasurement(section: CardSection, measuredHeight: number): HeightRefinementResult {
    const key = section.id ?? section.title ?? '';
    const cached = this.cache.get(section);
    const estimatedHeight = cached?.estimatedHeight ?? this.estimator.estimate(section);
    
    const delta = Math.abs(measuredHeight - estimatedHeight);
    const needsReflow = delta > this.tolerance;
    
    // Update cache with measurement
    this.cache.updateMeasured(section, measuredHeight);
    
    // Record for learning
    if (section.type) {
      this.estimator.recordMeasurement(section.type, measuredHeight);
    }
    
    const result: HeightRefinementResult = {
      key,
      estimatedHeight,
      measuredHeight,
      delta,
      needsReflow,
    };
    
    if (needsReflow) {
      this.pendingRefinements.push(result);
    }
    
    return result;
  }

  /**
   * Gets sections that need reflow
   */
  getPendingReflows(): HeightRefinementResult[] {
    return [...this.pendingRefinements];
  }

  /**
   * Clears pending reflows (call after applying reflow)
   */
  clearPendingReflows(): void {
    this.pendingRefinements = [];
  }

  /**
   * Batch records measurements and returns sections needing reflow
   */
  batchRecord(
    measurements: Array<{ section: CardSection; height: number }>
  ): HeightRefinementResult[] {
    const results: HeightRefinementResult[] = [];
    
    for (const { section, height } of measurements) {
      const result = this.recordMeasurement(section, height);
      if (result.needsReflow) {
        results.push(result);
      }
    }
    
    return results;
  }
}

// ============================================================================
// VIRTUALIZED HEIGHT SAMPLING (Item 31)
// ============================================================================

/**
 * Samples heights from a subset of sections and extrapolates for performance.
 * Useful for very large section lists (100+).
 */
export function sampleHeights(
  sections: CardSection[],
  estimator: HeightEstimator,
  options?: {
    sampleSize?: number;
    sampleMethod?: 'random' | 'stratified' | 'first';
  }
): Map<string, number> {
  const sampleSize = options?.sampleSize ?? Math.min(20, sections.length);
  const method = options?.sampleMethod ?? 'stratified';
  
  const heights = new Map<string, number>();
  
  if (sections.length <= sampleSize) {
    // Estimate all
    for (const section of sections) {
      const key = section.id ?? section.title ?? '';
      heights.set(key, estimator.estimate(section));
    }
    return heights;
  }

  // Select sample
  let sampleIndices: number[];
  
  switch (method) {
    case 'random':
      sampleIndices = selectRandomIndices(sections.length, sampleSize);
      break;
    case 'stratified':
      sampleIndices = selectStratifiedIndices(sections, sampleSize);
      break;
    case 'first':
    default:
      sampleIndices = Array.from({ length: sampleSize }, (_, i) => i);
      break;
  }

  // Estimate sampled sections
  const sampleHeights: number[] = [];
  const sampleTypes = new Map<string, number[]>();
  
  for (const idx of sampleIndices) {
    const section = sections[idx];
    if (!section) continue;
    
    const height = estimator.estimate(section);
    const key = section.id ?? section.title ?? '';
    heights.set(key, height);
    sampleHeights.push(height);
    
    const type = section.type ?? 'default';
    const typeHeights = sampleTypes.get(type) ?? [];
    typeHeights.push(height);
    sampleTypes.set(type, typeHeights);
  }

  // Extrapolate for non-sampled sections
  const avgHeight = sampleHeights.reduce((a, b) => a + b, 0) / sampleHeights.length;
  
  for (let i = 0; i < sections.length; i++) {
    if (sampleIndices.includes(i)) continue;
    
    const section = sections[i];
    if (!section) continue;
    
    const key = section.id ?? section.title ?? '';
    const type = section.type ?? 'default';
    
    // Use type-specific average if available, otherwise global average
    const typeHeights = sampleTypes.get(type);
    const estimatedHeight = typeHeights && typeHeights.length > 0
      ? typeHeights.reduce((a, b) => a + b, 0) / typeHeights.length
      : avgHeight;
    
    heights.set(key, Math.round(estimatedHeight));
  }
  
  return heights;
}

/**
 * Selects random indices
 */
function selectRandomIndices(total: number, count: number): number[] {
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * total));
  }
  return Array.from(indices);
}

/**
 * Selects stratified indices (spread across types)
 */
function selectStratifiedIndices(sections: CardSection[], count: number): number[] {
  // Group by type
  const typeIndices = new Map<string, number[]>();
  for (let i = 0; i < sections.length; i++) {
    const type = sections[i]?.type ?? 'default';
    const indices = typeIndices.get(type) ?? [];
    indices.push(i);
    typeIndices.set(type, indices);
  }
  
  // Select proportionally from each type
  const result: number[] = [];
  const typeCount = typeIndices.size;
  const perType = Math.ceil(count / typeCount);
  
  for (const indices of typeIndices.values()) {
    const toSelect = Math.min(perType, indices.length);
    for (let i = 0; i < toSelect && result.length < count; i++) {
      const randomIdx = Math.floor(Math.random() * indices.length);
      const selected = indices.splice(randomIdx, 1)[0];
      if (selected !== undefined) {
        result.push(selected);
      }
    }
  }
  
  return result;
}

// ============================================================================
// HEIGHT HISTOGRAM (Item 34)
// ============================================================================

/**
 * Analyzes height distribution for algorithm tuning.
 * Provides insights into section height patterns.
 */
export class HeightHistogram {
  private readonly bucketSize: number;
  private readonly buckets: Map<number, HeightBucket> = new Map();

  constructor(bucketSize: number = 50) {
    this.bucketSize = bucketSize;
  }

  /**
   * Adds a height measurement
   */
  add(key: string, height: number): void {
    const bucketIndex = Math.floor(height / this.bucketSize);
    const min = bucketIndex * this.bucketSize;
    const max = min + this.bucketSize;
    
    let bucket = this.buckets.get(bucketIndex);
    if (!bucket) {
      bucket = { min, max, count: 0, sectionKeys: [] };
      this.buckets.set(bucketIndex, bucket);
    }
    
    bucket.count++;
    bucket.sectionKeys.push(key);
  }

  /**
   * Gets histogram data
   */
  getHistogram(): HeightBucket[] {
    return Array.from(this.buckets.values())
      .sort((a, b) => a.min - b.min);
  }

  /**
   * Gets distribution statistics
   */
  getStatistics(): {
    totalSections: number;
    minHeight: number;
    maxHeight: number;
    meanHeight: number;
    medianHeight: number;
    modeRange: [number, number];
    stdDev: number;
  } {
    const buckets = this.getHistogram();
    if (buckets.length === 0) {
      return {
        totalSections: 0,
        minHeight: 0,
        maxHeight: 0,
        meanHeight: 0,
        medianHeight: 0,
        modeRange: [0, 0],
        stdDev: 0,
      };
    }

    let totalSections = 0;
    let totalHeight = 0;
    let maxCount = 0;
    let modeBucket: HeightBucket = buckets[0]!;
    
    for (const bucket of buckets) {
      totalSections += bucket.count;
      totalHeight += bucket.count * (bucket.min + bucket.max) / 2;
      if (bucket.count > maxCount) {
        maxCount = bucket.count;
        modeBucket = bucket;
      }
    }

    const meanHeight = totalHeight / totalSections;
    
    // Calculate median
    let medianCount = 0;
    const medianTarget = totalSections / 2;
    let medianHeight = 0;
    for (const bucket of buckets) {
      medianCount += bucket.count;
      if (medianCount >= medianTarget) {
        medianHeight = (bucket.min + bucket.max) / 2;
        break;
      }
    }

    // Calculate standard deviation
    let varianceSum = 0;
    for (const bucket of buckets) {
      const bucketMid = (bucket.min + bucket.max) / 2;
      varianceSum += bucket.count * Math.pow(bucketMid - meanHeight, 2);
    }
    const stdDev = Math.sqrt(varianceSum / totalSections);

    return {
      totalSections,
      minHeight: buckets[0]!.min,
      maxHeight: buckets[buckets.length - 1]!.max,
      meanHeight,
      medianHeight,
      modeRange: [modeBucket.min, modeBucket.max],
      stdDev,
    };
  }

  /**
   * Suggests algorithm based on distribution
   */
  suggestAlgorithm(): {
    algorithm: 'row-first' | 'legacy' | 'skyline' | 'maxrects';
    reason: string;
  } {
    const stats = this.getStatistics();
    const cv = stats.meanHeight > 0 ? (stats.stdDev / stats.meanHeight) * 100 : 0;

    if (cv < 20) {
      return {
        algorithm: 'row-first',
        reason: 'Uniform heights (CV < 20%) work well with row-first packing',
      };
    }

    if (cv > 50) {
      return {
        algorithm: 'maxrects',
        reason: 'High height variety (CV > 50%) benefits from MaxRects',
      };
    }

    if (stats.totalSections < 10) {
      return {
        algorithm: 'legacy',
        reason: 'Few sections work well with simple FFDH',
      };
    }

    return {
      algorithm: 'skyline',
      reason: 'Moderate variety works well with skyline packing',
    };
  }

  /**
   * Clears histogram
   */
  clear(): void {
    this.buckets.clear();
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Estimates height for a section with default configuration
 */
export function estimateSectionHeightAdvanced(
  section: CardSection,
  context?: EstimationContext
): number {
  const estimator = new HeightEstimator();
  return estimator.estimate(section, context);
}

/**
 * Batch estimates heights for multiple sections
 */
export function batchEstimateHeights(
  sections: CardSection[],
  context?: EstimationContext
): Map<string, number> {
  const estimator = new HeightEstimator();
  const heights = new Map<string, number>();
  
  for (const section of sections) {
    const key = section.id ?? section.title ?? '';
    heights.set(key, estimator.estimate(section, context));
  }
  
  return heights;
}

/**
 * Creates a height map from sections using smart sampling for large lists
 */
export function createHeightMap(
  sections: CardSection[],
  context?: EstimationContext
): Map<string, number> {
  const estimator = new HeightEstimator();
  
  // Use sampling for large lists
  if (sections.length > 50) {
    return sampleHeights(sections, estimator);
  }
  
  return batchEstimateHeights(sections, context);
}

