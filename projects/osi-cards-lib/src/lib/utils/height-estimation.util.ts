/**
 * Height Estimation Utilities
 *
 * Advanced height estimation for section layout with:
 * - Adaptive height learning from actual measurements (Point 6)
 * - Text-aware height estimation (Point 7)
 * - Height correction and feedback loop (Point 8)
 * - ResizeObserver integration for dynamic content (Point 9)
 * - Pluggable prediction interface for ML models (Point 10)
 *
 * This consolidates all height estimation logic into a single source of truth,
 * addressing Problem 91 (duplicate logic across files).
 *
 * @example
 * ```typescript
 * import { HeightEstimator } from 'osi-cards-lib';
 *
 * const estimator = HeightEstimator.getInstance();
 * const height = estimator.estimate(section, { containerWidth: 300 });
 *
 * // After DOM render, record actual height for learning
 * estimator.recordActualHeight(section.type, height, actualHeight);
 * ```
 */

import { CardSection, CardField } from '../models/card.model';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

/**
 * Height estimation context providing layout information
 */
export interface HeightEstimationContext {
  /** Container width in pixels (for text-aware estimation) */
  containerWidth?: number;
  /** Column span for this section */
  colSpan?: number;
  /** Total available columns */
  totalColumns?: number;
  /** Font size in pixels (default: 14) */
  fontSize?: number;
  /** Line height multiplier (default: 1.5) */
  lineHeight?: number;
  /** Maximum lines before truncation (optional) */
  maxLines?: number;
}

/**
 * Height measurement record for adaptive learning
 */
export interface HeightMeasurement {
  /** Estimated height before render */
  estimated: number;
  /** Actual measured height after render */
  actual: number;
  /** Timestamp of measurement */
  timestamp: number;
  /** Content hash for deduplication */
  contentHash?: string;
}

/**
 * Aggregated statistics for a section type
 */
export interface HeightStatistics {
  /** Section type */
  type: string;
  /** Number of measurements */
  sampleCount: number;
  /** Average actual height */
  averageActual: number;
  /** Average estimated height */
  averageEstimated: number;
  /** Standard deviation of actual heights */
  standardDeviation: number;
  /** Correction factor (actual / estimated) */
  correctionFactor: number;
  /** Rolling average of last N measurements */
  rollingAverage: number;
}

/**
 * Configuration for the height estimator
 */
export interface HeightEstimatorConfig {
  /** Maximum measurements to keep per type (default: 100) */
  maxMeasurementsPerType: number;
  /** Number of measurements for rolling average (default: 10) */
  rollingWindowSize: number;
  /** Minimum measurements before using learned values (default: 5) */
  minMeasurementsForLearning: number;
  /** Weight for learned vs base estimates (0-1, default: 0.7) */
  learningWeight: number;
  /** Enable persistent storage (default: true) */
  persistToStorage: boolean;
  /** Storage key prefix */
  storageKeyPrefix: string;
}

/**
 * Pluggable height predictor interface (Point 10)
 * Allows integration of ML models or custom prediction logic
 */
export interface HeightPredictor {
  /** Predict height for a section */
  predict(section: CardSection, context: HeightEstimationContext): number | null;
  /** Confidence score (0-1) for the prediction */
  confidence(section: CardSection): number;
  /** Update the model with new data */
  train?(measurements: Map<string, HeightMeasurement[]>): void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default height estimates per section type (in pixels)
 * Base values that are adjusted through adaptive learning
 */
export const BASE_HEIGHT_ESTIMATES: Record<string, number> = {
  overview: 180,
  'contact-card': 160,
  'network-card': 160,
  analytics: 200,
  stats: 180,
  chart: 280,
  map: 250,
  financials: 200,
  info: 180,
  list: 220,
  event: 240,
  timeline: 240,
  product: 260,
  solutions: 240,
  quotation: 160,
  'text-reference': 180,
  'social-media': 140,
  'brand-colors': 120,
  project: 180,
  news: 200,
  default: 180,
};

/**
 * Height multipliers for content elements
 */
export const HEIGHT_MULTIPLIERS = {
  /** Height per list item in pixels */
  perItem: 50,
  /** Height per field/row in pixels */
  perField: 32,
  /** Section header height in pixels */
  headerHeight: 48,
  /** Section padding (top + bottom) in pixels */
  padding: 20,
  /** Characters per line (approximate, adjusted by container width) */
  charsPerLine: 45,
  /** Pixels per line of text */
  lineHeightPx: 22,
  /** Minimum section height */
  minHeight: 80,
  /** Maximum section height */
  maxHeight: 600,
};

/**
 * Default estimator configuration
 */
const DEFAULT_CONFIG: HeightEstimatorConfig = {
  maxMeasurementsPerType: 100,
  rollingWindowSize: 10,
  minMeasurementsForLearning: 5,
  learningWeight: 0.7,
  persistToStorage: true,
  storageKeyPrefix: 'osi-height-',
};

// ============================================================================
// HEIGHT ESTIMATOR CLASS
// ============================================================================

/**
 * Singleton class for height estimation with adaptive learning
 */
export class HeightEstimator {
  private static instance: HeightEstimator | null = null;

  private measurements: Map<string, HeightMeasurement[]> = new Map();
  private statistics: Map<string, HeightStatistics> = new Map();
  private config: HeightEstimatorConfig;
  private predictor: HeightPredictor | null = null;
  private resizeCallbacks: Map<string, () => void> = new Map();

  private constructor(config: Partial<HeightEstimatorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
  }

  /**
   * Get the singleton instance
   */
  static getInstance(config?: Partial<HeightEstimatorConfig>): HeightEstimator {
    if (!HeightEstimator.instance) {
      HeightEstimator.instance = new HeightEstimator(config);
    } else if (config) {
      HeightEstimator.instance.configure(config);
    }
    return HeightEstimator.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    HeightEstimator.instance = null;
  }

  /**
   * Update configuration
   */
  configure(config: Partial<HeightEstimatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set a custom height predictor (Point 10)
   */
  setPredictor(predictor: HeightPredictor | null): void {
    this.predictor = predictor;
  }

  // ==========================================================================
  // MAIN ESTIMATION API
  // ==========================================================================

  /**
   * Estimate the height of a section
   *
   * Uses a multi-stage approach:
   * 1. Check for custom predictor (ML model)
   * 2. Use adaptive learned values if available
   * 3. Calculate text-aware base estimate
   * 4. Apply content-based adjustments
   *
   * @param section - The section to estimate
   * @param context - Optional context for better estimation
   * @returns Estimated height in pixels
   */
  estimate(section: CardSection, context: HeightEstimationContext = {}): number {
    const type = this.normalizeType(section.type);

    // Stage 1: Try custom predictor if available
    if (this.predictor) {
      const confidence = this.predictor.confidence(section);
      if (confidence > 0.7) {
        const predicted = this.predictor.predict(section, context);
        if (predicted !== null && predicted > 0) {
          return this.clampHeight(predicted);
        }
      }
    }

    // Stage 2: Calculate base estimate with text awareness
    const baseEstimate = this.calculateTextAwareBase(section, context);

    // Stage 3: Apply adaptive learning correction
    const stats = this.statistics.get(type);
    if (stats && stats.sampleCount >= this.config.minMeasurementsForLearning) {
      // Blend base estimate with learned average
      const learnedEstimate = stats.rollingAverage * stats.correctionFactor;
      const blendedEstimate =
        baseEstimate * (1 - this.config.learningWeight) +
        learnedEstimate * this.config.learningWeight;

      return this.clampHeight(blendedEstimate);
    }

    // Stage 4: Apply content-based adjustments to base
    const adjustedEstimate = this.applyContentAdjustments(section, baseEstimate, context);

    return this.clampHeight(adjustedEstimate);
  }

  /**
   * Estimate height for multiple sections at once
   */
  estimateAll(sections: CardSection[], context: HeightEstimationContext = {}): Map<string, number> {
    const results = new Map<string, number>();

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section) {
        const key = section.id || `${section.type}-${section.title}-${i}`;
        results.set(key, this.estimate(section, context));
      }
    }

    return results;
  }

  // ==========================================================================
  // ADAPTIVE LEARNING (Point 6)
  // ==========================================================================

  /**
   * Record an actual measured height for learning
   *
   * @param type - Section type
   * @param estimated - The estimated height
   * @param actual - The actual measured height
   * @param contentHash - Optional hash for deduplication
   */
  recordActualHeight(type: string, estimated: number, actual: number, contentHash?: string): void {
    const normalizedType = this.normalizeType(type);

    const measurement: HeightMeasurement = {
      estimated,
      actual,
      timestamp: Date.now(),
      contentHash,
    };

    // Add to measurements
    if (!this.measurements.has(normalizedType)) {
      this.measurements.set(normalizedType, []);
    }

    const typeMeasurements = this.measurements.get(normalizedType)!;

    // Deduplicate by content hash if provided
    if (contentHash) {
      const existingIndex = typeMeasurements.findIndex((m) => m.contentHash === contentHash);
      if (existingIndex >= 0) {
        typeMeasurements[existingIndex] = measurement;
      } else {
        typeMeasurements.push(measurement);
      }
    } else {
      typeMeasurements.push(measurement);
    }

    // Trim to max size
    while (typeMeasurements.length > this.config.maxMeasurementsPerType) {
      typeMeasurements.shift();
    }

    // Update statistics
    this.updateStatistics(normalizedType);

    // Persist to storage
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }

    // Train predictor if available
    if (this.predictor?.train) {
      this.predictor.train(this.measurements);
    }
  }

  /**
   * Record multiple measurements at once (batch update)
   */
  recordBatch(
    measurements: Array<{ type: string; estimated: number; actual: number; contentHash?: string }>
  ): void {
    for (const m of measurements) {
      this.recordActualHeight(m.type, m.estimated, m.actual, m.contentHash);
    }
  }

  /**
   * Get statistics for a section type
   */
  getStatistics(type: string): HeightStatistics | undefined {
    return this.statistics.get(this.normalizeType(type));
  }

  /**
   * Get all statistics
   */
  getAllStatistics(): Map<string, HeightStatistics> {
    return new Map(this.statistics);
  }

  /**
   * Clear learned data for a type or all types
   */
  clearLearning(type?: string): void {
    if (type) {
      const normalizedType = this.normalizeType(type);
      this.measurements.delete(normalizedType);
      this.statistics.delete(normalizedType);
    } else {
      this.measurements.clear();
      this.statistics.clear();
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  // ==========================================================================
  // TEXT-AWARE ESTIMATION (Point 7)
  // ==========================================================================

  /**
   * Calculate text-aware base height estimate
   *
   * Takes into account:
   * - Container width for line wrapping
   * - Font size and line height
   * - Text length in various fields
   */
  private calculateTextAwareBase(section: CardSection, context: HeightEstimationContext): number {
    const type = this.normalizeType(section.type);
    const baseHeight = BASE_HEIGHT_ESTIMATES[type] ?? BASE_HEIGHT_ESTIMATES['default']!;

    // If no container width, use base estimate
    if (!context.containerWidth || context.containerWidth <= 0) {
      return baseHeight;
    }

    const fontSize = context.fontSize ?? 14;
    const lineHeight = context.lineHeight ?? 1.5;
    const lineHeightPx = fontSize * lineHeight;

    // Calculate characters per line based on container width
    // Approximate: 8px average character width at 14px font
    const avgCharWidth = fontSize * 0.57;
    const charsPerLine = Math.floor((context.containerWidth - 32) / avgCharWidth); // 32px for padding

    let textHeight = 0;

    // Calculate height for description text
    if (section.description) {
      const lines = Math.ceil(section.description.length / charsPerLine);
      textHeight += lines * lineHeightPx;
    }

    // Calculate height for field values
    if (section.fields) {
      for (const field of section.fields) {
        const valueLength = String(field.value ?? '').length;
        const labelLength = (field.label ?? '').length;

        // Each field takes at least one line, more if value wraps
        const valueLines = Math.max(1, Math.ceil(valueLength / (charsPerLine * 0.6))); // 60% width for values
        textHeight += valueLines * lineHeightPx + 8; // 8px gap between fields
      }
    }

    // Calculate height for items (lists)
    if (section.items) {
      for (const item of section.items) {
        const titleLength = (item.title ?? '').length;
        const descLength = typeof item.description === 'string' ? item.description.length : 0;

        const titleLines = Math.ceil(titleLength / charsPerLine) || 1;
        const descLines = descLength > 0 ? Math.ceil(descLength / charsPerLine) : 0;

        textHeight += (titleLines + descLines) * lineHeightPx + 12; // 12px gap between items
      }
    }

    // Combine base height with text-calculated height
    const calculatedHeight =
      HEIGHT_MULTIPLIERS.headerHeight + HEIGHT_MULTIPLIERS.padding + textHeight;

    // Use the larger of base or calculated, with diminishing returns for very long content
    if (calculatedHeight > baseHeight) {
      // Apply logarithmic scaling for very tall sections to prevent outliers
      const excess = calculatedHeight - baseHeight;
      const scaledExcess = Math.log(excess + 1) * 50; // Logarithmic scaling
      return baseHeight + Math.min(excess, scaledExcess + excess * 0.3);
    }

    return baseHeight;
  }

  // ==========================================================================
  // CONTENT-BASED ADJUSTMENTS
  // ==========================================================================

  /**
   * Apply content-based height adjustments
   */
  private applyContentAdjustments(
    section: CardSection,
    baseHeight: number,
    context: HeightEstimationContext
  ): number {
    let height = baseHeight;

    const itemCount = section.items?.length ?? 0;
    const fieldCount = section.fields?.length ?? 0;

    // Add height for items beyond what's included in base
    if (itemCount > 3) {
      height += (itemCount - 3) * HEIGHT_MULTIPLIERS.perItem * 0.8; // Diminishing returns
    }

    // Add height for fields beyond what's included in base
    if (fieldCount > 4) {
      height += (fieldCount - 4) * HEIGHT_MULTIPLIERS.perField * 0.8;
    }

    // Adjust for column span (wider sections may be shorter due to content flowing horizontally)
    if (context.colSpan && context.colSpan > 1 && context.totalColumns) {
      const spanRatio = context.colSpan / context.totalColumns;
      // Reduce height proportionally to extra width (content spreads out)
      height *= 1 - (spanRatio - 0.25) * 0.15;
    }

    // Type-specific adjustments
    const type = this.normalizeType(section.type);

    switch (type) {
      case 'chart':
      case 'map':
        // Charts and maps have fixed aspect ratios
        height = Math.max(height, 200);
        break;

      case 'list':
        // Lists grow more predictably
        height =
          HEIGHT_MULTIPLIERS.headerHeight +
          HEIGHT_MULTIPLIERS.padding +
          itemCount * HEIGHT_MULTIPLIERS.perItem;
        break;

      case 'contact-card':
      case 'network-card':
        // Contact cards are typically compact
        height = Math.min(height, 200);
        break;
    }

    return height;
  }

  // ==========================================================================
  // RESIZE OBSERVER INTEGRATION (Point 9)
  // ==========================================================================

  /**
   * Create a ResizeObserver callback for dynamic content
   *
   * @param sectionKey - Unique key for the section
   * @param type - Section type for learning
   * @param element - DOM element to observe
   * @param onHeightChange - Callback when height changes significantly
   * @returns Cleanup function
   */
  observeSection(
    sectionKey: string,
    type: string,
    element: HTMLElement,
    onHeightChange?: (newHeight: number) => void
  ): () => void {
    if (typeof ResizeObserver === 'undefined') {
      return () => {};
    }

    let lastHeight = element.offsetHeight;
    let estimatedHeight = this.estimate({ type } as CardSection);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newHeight = entry.contentRect.height;

        // Only react to significant changes (> 10px)
        if (Math.abs(newHeight - lastHeight) > 10) {
          lastHeight = newHeight;

          // Record for learning
          this.recordActualHeight(type, estimatedHeight, newHeight, sectionKey);

          // Notify callback
          onHeightChange?.(newHeight);
        }
      }
    });

    observer.observe(element);

    // Store cleanup function
    const cleanup = () => {
      observer.disconnect();
      this.resizeCallbacks.delete(sectionKey);
    };

    this.resizeCallbacks.set(sectionKey, cleanup);

    return cleanup;
  }

  /**
   * Disconnect all resize observers
   */
  disconnectAllObservers(): void {
    for (const cleanup of this.resizeCallbacks.values()) {
      cleanup();
    }
    this.resizeCallbacks.clear();
  }

  // ==========================================================================
  // STATISTICS CALCULATION
  // ==========================================================================

  /**
   * Update statistics for a section type
   */
  private updateStatistics(type: string): void {
    const measurements = this.measurements.get(type);
    if (!measurements || measurements.length === 0) {
      return;
    }

    // Calculate averages
    let sumActual = 0;
    let sumEstimated = 0;

    for (const m of measurements) {
      sumActual += m.actual;
      sumEstimated += m.estimated;
    }

    const averageActual = sumActual / measurements.length;
    const averageEstimated = sumEstimated / measurements.length;

    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (const m of measurements) {
      sumSquaredDiff += Math.pow(m.actual - averageActual, 2);
    }
    const standardDeviation = Math.sqrt(sumSquaredDiff / measurements.length);

    // Calculate rolling average (last N measurements)
    const recentMeasurements = measurements.slice(-this.config.rollingWindowSize);
    const rollingAverage =
      recentMeasurements.reduce((sum, m) => sum + m.actual, 0) / recentMeasurements.length;

    // Calculate correction factor
    const correctionFactor = averageEstimated > 0 ? averageActual / averageEstimated : 1;

    this.statistics.set(type, {
      type,
      sampleCount: measurements.length,
      averageActual,
      averageEstimated,
      standardDeviation,
      correctionFactor,
      rollingAverage,
    });
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  /**
   * Save measurements to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const data: Record<string, HeightMeasurement[]> = {};
      for (const [type, measurements] of this.measurements) {
        // Only save recent measurements
        data[type] = measurements.slice(-50);
      }

      localStorage.setItem(`${this.config.storageKeyPrefix}measurements`, JSON.stringify(data));
    } catch (e) {
      // Storage quota exceeded or other error - fail silently
      console.warn('[HeightEstimator] Failed to save to storage:', e);
    }
  }

  /**
   * Load measurements from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(`${this.config.storageKeyPrefix}measurements`);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, HeightMeasurement[]>;

        for (const [type, measurements] of Object.entries(data)) {
          this.measurements.set(type, measurements);
          this.updateStatistics(type);
        }
      }
    } catch (e) {
      // Invalid data or other error - fail silently
      console.warn('[HeightEstimator] Failed to load from storage:', e);
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Normalize section type to lowercase
   */
  private normalizeType(type: string | undefined): string {
    return (type ?? 'default').toLowerCase();
  }

  /**
   * Clamp height to min/max bounds
   */
  private clampHeight(height: number): number {
    return Math.min(Math.max(height, HEIGHT_MULTIPLIERS.minHeight), HEIGHT_MULTIPLIERS.maxHeight);
  }

  /**
   * Generate a content hash for deduplication
   */
  static generateContentHash(section: CardSection): string {
    const parts: string[] = [
      section.type ?? '',
      section.title ?? '',
      String(section.fields?.length ?? 0),
      String(section.items?.length ?? 0),
      String(section.description?.length ?? 0),
    ];

    // Simple hash function
    const str = parts.join('|');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return hash.toString(36);
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Estimate section height using the singleton estimator
 *
 * This is the recommended function for general use, replacing
 * the old estimateSectionHeight function.
 */
export function estimateSectionHeight(
  section: CardSection,
  context?: HeightEstimationContext
): number {
  return HeightEstimator.getInstance().estimate(section, context);
}

/**
 * Record an actual height measurement for learning
 */
export function recordHeightMeasurement(
  type: string,
  estimated: number,
  actual: number,
  contentHash?: string
): void {
  HeightEstimator.getInstance().recordActualHeight(type, estimated, actual, contentHash);
}

/**
 * Get height statistics for a section type
 */
export function getHeightStatistics(type: string): HeightStatistics | undefined {
  return HeightEstimator.getInstance().getStatistics(type);
}

/**
 * Batch estimate heights for multiple sections
 */
export function estimateHeights(
  sections: CardSection[],
  context?: HeightEstimationContext
): Map<string, number> {
  return HeightEstimator.getInstance().estimateAll(sections, context);
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy constants for backward compatibility
 * @deprecated Use HEIGHT_MULTIPLIERS instead
 */
export const SECTION_HEIGHT_ESTIMATES = BASE_HEIGHT_ESTIMATES;
export const HEIGHT_PER_ITEM = HEIGHT_MULTIPLIERS.perItem;
export const HEIGHT_PER_FIELD = HEIGHT_MULTIPLIERS.perField;
export const SECTION_HEADER_HEIGHT = HEIGHT_MULTIPLIERS.headerHeight;
export const SECTION_PADDING = HEIGHT_MULTIPLIERS.padding;

/**
 * Legacy measureContentDensity function
 * Now uses the HeightEstimator for consistency
 */
export function measureContentDensity(section: CardSection): number {
  const textLength =
    (section.description?.length ?? 0) +
    (section.fields?.reduce(
      (acc: number, f: CardField) => acc + String(f.value ?? '').length + (f.label?.length ?? 0),
      0
    ) ?? 0);
  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;

  const textScore = textLength / 50;
  const itemScore = itemCount * 3;
  const fieldScore = fieldCount * 2;

  return Math.round(textScore + itemScore + fieldScore);
}
