/**
 * Layout Test Fixtures
 *
 * Test fixtures and helpers for layout algorithm E2E tests:
 * - Parametrized algorithm tests (Point 66)
 * - Position snapshot testing (Point 67)
 * - Edge case fixtures (Point 68)
 * - Benchmark configurations (Point 69)
 * - Gap validation thresholds (Point 70)
 */

import { CardSection } from '../../projects/osi-cards-lib/src/lib/models/card.model';

// ============================================================================
// ALGORITHM PARAMETRIZATION (Point 66)
// ============================================================================

/**
 * Available packing algorithms for parametrized testing
 */
export const PACKING_ALGORITHMS = ['row-first', 'legacy', 'skyline'] as const;
export type PackingAlgorithm = typeof PACKING_ALGORITHMS[number];

/**
 * Configuration for parametrized algorithm tests
 */
export interface AlgorithmTestConfig {
  name: string;
  algorithm: PackingAlgorithm;
  sections: CardSection[];
  columns: number;
  expectedUtilization?: number; // Minimum expected utilization %
  expectedMaxGaps?: number;
  expectedMaxHeight?: number;
}

/**
 * Generate test configurations for all algorithms
 */
export function generateAlgorithmTestConfigs(
  testName: string,
  sections: CardSection[],
  columns: number = 4
): AlgorithmTestConfig[] {
  return PACKING_ALGORITHMS.map(algorithm => ({
    name: `${testName} - ${algorithm}`,
    algorithm,
    sections,
    columns,
  }));
}

// ============================================================================
// POSITION SNAPSHOTS (Point 67)
// ============================================================================

/**
 * Expected position for a section in layout
 */
export interface ExpectedPosition {
  key: string;
  column: number;
  top: number;
  colSpan: number;
  height: number;
  tolerance?: number; // Pixel tolerance for comparison
}

/**
 * Layout position snapshot
 */
export interface PositionSnapshot {
  name: string;
  algorithm: PackingAlgorithm;
  columns: number;
  containerWidth: number;
  positions: ExpectedPosition[];
  totalHeight: number;
  utilizationPercent: number;
  gapCount: number;
}

/**
 * Compare actual positions against expected snapshot
 */
export function comparePositions(
  actual: Array<{ key: string; column: number; top: number; colSpan: number; height: number }>,
  expected: ExpectedPosition[],
  defaultTolerance: number = 5
): {
  passed: boolean;
  differences: Array<{
    key: string;
    field: string;
    expected: number;
    actual: number;
    diff: number;
  }>;
} {
  const differences: Array<{
    key: string;
    field: string;
    expected: number;
    actual: number;
    diff: number;
  }> = [];

  for (const exp of expected) {
    const act = actual.find(a => a.key === exp.key);

    if (!act) {
      differences.push({
        key: exp.key,
        field: 'presence',
        expected: 1,
        actual: 0,
        diff: 1,
      });
      continue;
    }

    const tolerance = exp.tolerance ?? defaultTolerance;

    // Compare column
    if (Math.abs(act.column - exp.column) > 0) {
      differences.push({
        key: exp.key,
        field: 'column',
        expected: exp.column,
        actual: act.column,
        diff: Math.abs(act.column - exp.column),
      });
    }

    // Compare top with tolerance
    if (Math.abs(act.top - exp.top) > tolerance) {
      differences.push({
        key: exp.key,
        field: 'top',
        expected: exp.top,
        actual: act.top,
        diff: Math.abs(act.top - exp.top),
      });
    }

    // Compare colSpan
    if (act.colSpan !== exp.colSpan) {
      differences.push({
        key: exp.key,
        field: 'colSpan',
        expected: exp.colSpan,
        actual: act.colSpan,
        diff: Math.abs(act.colSpan - exp.colSpan),
      });
    }

    // Compare height with tolerance
    if (Math.abs(act.height - exp.height) > tolerance) {
      differences.push({
        key: exp.key,
        field: 'height',
        expected: exp.height,
        actual: act.height,
        diff: Math.abs(act.height - exp.height),
      });
    }
  }

  return {
    passed: differences.length === 0,
    differences,
  };
}

// ============================================================================
// EDGE CASE FIXTURES (Point 68)
// ============================================================================

/**
 * Empty sections test case
 */
export const EMPTY_SECTIONS_FIXTURE: CardSection[] = [];

/**
 * Single section test case
 */
export const SINGLE_SECTION_FIXTURE: CardSection[] = [
  {
    type: 'info',
    title: 'Single Section',
    fields: [
      { label: 'Field 1', value: 'Value 1' },
    ],
  },
];

/**
 * All same size sections (should fill perfectly)
 */
export const UNIFORM_SECTIONS_FIXTURE: CardSection[] = Array.from({ length: 8 }, (_, i) => ({
  type: 'info',
  title: `Section ${i + 1}`,
  colSpan: 1,
  fields: [
    { label: 'Label', value: 'Value' },
    { label: 'Label 2', value: 'Value 2' },
  ],
}));

/**
 * Alternating wide and narrow sections
 */
export const ALTERNATING_WIDTH_FIXTURE: CardSection[] = Array.from({ length: 6 }, (_, i) => ({
  type: i % 2 === 0 ? 'overview' : 'info',
  title: `Section ${i + 1}`,
  colSpan: i % 2 === 0 ? 2 : 1,
  fields: Array.from({ length: i % 2 === 0 ? 6 : 2 }, (_, j) => ({
    label: `Field ${j + 1}`,
    value: `Value ${j + 1}`,
  })),
}));

/**
 * One full-width section followed by small sections
 */
export const FULL_WIDTH_FIRST_FIXTURE: CardSection[] = [
  {
    type: 'overview',
    title: 'Full Width Overview',
    colSpan: 4,
    fields: Array.from({ length: 8 }, (_, i) => ({
      label: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
    })),
  },
  ...Array.from({ length: 4 }, (_, i) => ({
    type: 'info',
    title: `Small Section ${i + 1}`,
    colSpan: 1,
    fields: [{ label: 'Label', value: 'Value' }],
  })),
];

/**
 * Many small sections that should fill gaps
 */
export const MANY_SMALL_SECTIONS_FIXTURE: CardSection[] = Array.from({ length: 20 }, (_, i) => ({
  type: 'info',
  title: `Small ${i + 1}`,
  colSpan: 1,
  fields: [{ label: 'L', value: 'V' }],
}));

/**
 * Sections with explicit constraints
 */
export const CONSTRAINED_SECTIONS_FIXTURE: CardSection[] = [
  {
    type: 'chart',
    title: 'Chart (min 2 cols)',
    minColumns: 2,
    preferredColumns: 2,
    canShrink: false,
    canGrow: true,
    fields: [],
  },
  {
    type: 'info',
    title: 'Flexible Info',
    canShrink: true,
    canGrow: true,
    fields: [{ label: 'Data', value: '12345' }],
  },
  {
    type: 'list',
    title: 'Fixed Width List',
    colSpan: 1,
    canShrink: false,
    canGrow: false,
    items: [
      { title: 'Item 1' },
      { title: 'Item 2' },
    ],
  },
];

/**
 * Pathological case: all 3-column sections in 4-column grid
 */
export const ORPHAN_COLUMN_FIXTURE: CardSection[] = Array.from({ length: 4 }, (_, i) => ({
  type: 'analytics',
  title: `Analytics ${i + 1}`,
  colSpan: 3,
  fields: Array.from({ length: 4 }, (_, j) => ({
    label: `Metric ${j + 1}`,
    value: String((j + 1) * 100),
  })),
}));

/**
 * Tall and short sections mixed
 */
export const VARYING_HEIGHT_FIXTURE: CardSection[] = [
  {
    type: 'list',
    title: 'Very Tall List',
    items: Array.from({ length: 15 }, (_, i) => ({
      title: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
    })),
  },
  {
    type: 'info',
    title: 'Short Info',
    fields: [{ label: 'One', value: '1' }],
  },
  {
    type: 'info',
    title: 'Medium Info',
    fields: Array.from({ length: 4 }, (_, i) => ({
      label: `Field ${i + 1}`,
      value: `Value ${i + 1}`,
    })),
  },
  {
    type: 'chart',
    title: 'Tall Chart',
    colSpan: 2,
    fields: [],
  },
];

/**
 * All edge case fixtures
 */
export const EDGE_CASE_FIXTURES: Record<string, CardSection[]> = {
  empty: EMPTY_SECTIONS_FIXTURE,
  single: SINGLE_SECTION_FIXTURE,
  uniform: UNIFORM_SECTIONS_FIXTURE,
  alternating: ALTERNATING_WIDTH_FIXTURE,
  fullWidthFirst: FULL_WIDTH_FIRST_FIXTURE,
  manySmall: MANY_SMALL_SECTIONS_FIXTURE,
  constrained: CONSTRAINED_SECTIONS_FIXTURE,
  orphanColumn: ORPHAN_COLUMN_FIXTURE,
  varyingHeight: VARYING_HEIGHT_FIXTURE,
};

// ============================================================================
// BENCHMARK CONFIGURATIONS (Point 69)
// ============================================================================

/**
 * Benchmark size configuration
 */
export interface BenchmarkConfig {
  name: string;
  sectionCount: number;
  expectedMaxTimeMs: number;
}

/**
 * Standard benchmark sizes
 */
export const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  { name: 'small', sectionCount: 10, expectedMaxTimeMs: 50 },
  { name: 'medium', sectionCount: 50, expectedMaxTimeMs: 100 },
  { name: 'large', sectionCount: 100, expectedMaxTimeMs: 200 },
  { name: 'xlarge', sectionCount: 500, expectedMaxTimeMs: 1000 },
];

/**
 * Generate benchmark sections
 */
export function generateBenchmarkSections(count: number): CardSection[] {
  const types = ['info', 'list', 'overview', 'chart', 'analytics', 'stats'];

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length]!;
    const fieldCount = (i % 5) + 1;

    return {
      type,
      title: `Section ${i + 1}`,
      colSpan: (i % 4) + 1 > 4 ? 1 : (i % 3) + 1,
      fields: Array.from({ length: fieldCount }, (_, j) => ({
        label: `Field ${j + 1}`,
        value: `Value ${j + 1} for section ${i + 1}`,
      })),
    };
  });
}

/**
 * Run a layout benchmark
 */
export async function runBenchmark(
  algorithm: PackingAlgorithm,
  sections: CardSection[],
  columns: number = 4
): Promise<{
  timeMs: number;
  utilizationPercent: number;
  gapCount: number;
  totalHeight: number;
}> {
  const start = performance.now();

  // Import dynamically to avoid circular dependencies in test files
  const { packSectionsIntoRows } = await import(
    '../../projects/osi-cards-lib/src/lib/utils/row-packer.util'
  );
  const { binPack2D } = await import(
    '../../projects/osi-cards-lib/src/lib/utils/smart-grid.util'
  );
  const { SkylinePacker } = await import(
    '../../projects/osi-cards-lib/src/lib/utils/skyline-algorithm.util'
  );

  let utilizationPercent = 0;
  let gapCount = 0;
  let totalHeight = 0;

  switch (algorithm) {
    case 'row-first': {
      const result = packSectionsIntoRows(sections, {
        totalColumns: columns,
        prioritizeSpaceFilling: true,
        allowShrinking: true,
        allowGrowing: true,
      });
      utilizationPercent = result.utilizationPercent;
      gapCount = result.rowsWithGaps;
      totalHeight = result.totalHeight;
      break;
    }

    case 'skyline': {
      const packer = new SkylinePacker({
        columns,
        containerWidth: columns * 260 + (columns - 1) * 12,
        gap: 12,
      });
      const result = packer.pack(sections);
      utilizationPercent = result.utilization;
      gapCount = result.gapCount;
      totalHeight = result.totalHeight;
      break;
    }

    case 'legacy': {
      const result = binPack2D(sections, columns);
      if (result.length > 0) {
        const maxTop = Math.max(...result.map(s => (s.top ?? 0) + s.estimatedHeight));
        totalHeight = maxTop;
        const totalArea = columns * maxTop;
        const usedArea = result.reduce((sum, s) => sum + s.colSpan * s.estimatedHeight, 0);
        utilizationPercent = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
      }
      break;
    }
  }

  const timeMs = performance.now() - start;

  return {
    timeMs,
    utilizationPercent,
    gapCount,
    totalHeight,
  };
}

// ============================================================================
// GAP VALIDATION (Point 70)
// ============================================================================

/**
 * Gap validation thresholds (tightened from 80% to 95%)
 */
export const GAP_VALIDATION = {
  /** Minimum acceptable utilization for passing tests */
  minUtilization: 85, // Increased from implicit ~80%

  /** Target utilization for "good" layouts */
  targetUtilization: 95,

  /** Maximum gaps per 10 sections */
  maxGapsPerTenSections: 2,

  /** Maximum allowed gap height relative to section height */
  maxGapHeightRatio: 0.5,

  /** Strictness levels for different test scenarios */
  strictness: {
    /** For general layout tests */
    normal: {
      minUtilization: 85,
      maxGapsPerTenSections: 2,
    },
    /** For optimized/ideal scenarios */
    strict: {
      minUtilization: 92,
      maxGapsPerTenSections: 1,
    },
    /** For edge cases that are hard to optimize */
    lenient: {
      minUtilization: 75,
      maxGapsPerTenSections: 4,
    },
  },
};

/**
 * Validate layout gaps
 */
export function validateGaps(
  utilizationPercent: number,
  gapCount: number,
  sectionCount: number,
  strictness: 'normal' | 'strict' | 'lenient' = 'normal'
): {
  valid: boolean;
  reason?: string;
} {
  const thresholds = GAP_VALIDATION.strictness[strictness];

  // Check utilization
  if (utilizationPercent < thresholds.minUtilization) {
    return {
      valid: false,
      reason: `Utilization ${utilizationPercent.toFixed(1)}% below threshold ${thresholds.minUtilization}%`,
    };
  }

  // Check gap count relative to section count
  const maxAllowedGaps = Math.ceil(sectionCount / 10) * thresholds.maxGapsPerTenSections;
  if (gapCount > maxAllowedGaps) {
    return {
      valid: false,
      reason: `Gap count ${gapCount} exceeds maximum ${maxAllowedGaps} for ${sectionCount} sections`,
    };
  }

  return { valid: true };
}

/**
 * Calculate gap score for comparison
 */
export function calculateGapScore(
  utilizationPercent: number,
  gapCount: number,
  sectionCount: number
): number {
  // Score from 0-100, higher is better
  let score = utilizationPercent;

  // Penalty for gaps
  const gapPenalty = gapCount * (100 / Math.max(sectionCount, 1)) * 5;
  score -= gapPenalty;

  // Bonus for exceeding target
  if (utilizationPercent > GAP_VALIDATION.targetUtilization) {
    score += (utilizationPercent - GAP_VALIDATION.targetUtilization) * 0.5;
  }

  return Math.max(0, Math.min(100, score));
}



