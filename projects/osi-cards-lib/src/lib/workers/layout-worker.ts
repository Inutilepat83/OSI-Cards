/**
 * Layout Worker
 * 
 * Web Worker for offloading heavy layout calculations from the main thread.
 * Handles bin-packing, gap analysis, and position calculations.
 * 
 * Message Types:
 * - PACK_SECTIONS: Run bin-packing algorithm on sections
 * - CALCULATE_POSITIONS: Calculate positions for sections
 * - ANALYZE_GAPS: Analyze gaps in current layout
 * - OPTIMIZE_LAYOUT: Run layout optimization
 */

// Worker context - use global self
declare const self: {
  postMessage(message: LayoutWorkerResponse, transfer?: Transferable[]): void;
  onmessage: ((ev: MessageEvent<LayoutWorkerMessage>) => void) | null;
};

// ============================================================================
// MESSAGE TYPES
// ============================================================================

export type LayoutWorkerMessageType = 
  | 'PACK_SECTIONS'
  | 'CALCULATE_POSITIONS'
  | 'ANALYZE_GAPS'
  | 'OPTIMIZE_LAYOUT'
  | 'COMPUTE_HEIGHTS'
  | 'SKYLINE_PACK';

/**
 * Payload types for different worker message types
 */
export interface PackSectionsPayload {
  sections: WorkerSection[];
  columns: number;
  gap?: number;
  algorithm?: 'ffdh' | 'skyline';
}

export interface AnalyzeGapsPayload {
  placements: PositionedSection[];
  columns: number;
  containerHeight: number;
}

export interface ComputeHeightsPayload {
  sections: WorkerSection[];
}

export type LayoutWorkerPayload = PackSectionsPayload | AnalyzeGapsPayload | ComputeHeightsPayload;

export interface LayoutWorkerMessage {
  type: LayoutWorkerMessageType;
  id: string;
  payload: LayoutWorkerPayload;
}

/**
 * Result types for different worker operations
 */
export type LayoutWorkerResult = PackResult | GapAnalysis | PositionedSection[] | Array<{ key: string; height: number }>;

export interface LayoutWorkerResponse {
  type: LayoutWorkerMessageType;
  id: string;
  success: boolean;
  result?: LayoutWorkerResult;
  error?: string;
  duration?: number;
}

// ============================================================================
// SECTION TYPES (Simplified for Worker)
// ============================================================================

interface WorkerSection {
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  colSpan?: number;
  preferredColumns?: number;
  fields?: Array<{ label?: string; value?: string | number | boolean | null }>;
  items?: Array<{ title?: string; description?: string }>;
}

interface PositionedSection {
  key: string;
  colSpan: number;
  column: number;
  top: number;
  left: string;
  width: string;
  height: number;
}

// ============================================================================
// LAYOUT ALGORITHMS
// ============================================================================

/**
 * Estimates section height based on content
 */
function estimateHeight(section: WorkerSection): number {
  const baseHeights: Record<string, number> = {
    'overview': 180,
    'contact-card': 160,
    'analytics': 200,
    'chart': 280,
    'map': 250,
    'info': 180,
    'list': 220,
    'default': 180,
  };

  const type = (section.type ?? 'default').toLowerCase();
  const base = baseHeights[type] ?? baseHeights['default'] ?? 180;

  const itemCount = section.items?.length ?? 0;
  const fieldCount = section.fields?.length ?? 0;

  const contentHeight = Math.max(itemCount * 50, fieldCount * 32);
  
  return Math.max(base, 48 + contentHeight + 20);
}

/**
 * Calculates optimal column span for a section
 */
function calculateColSpan(section: WorkerSection, maxColumns: number): number {
  if (section.colSpan && section.colSpan > 0) {
    return Math.min(section.colSpan, maxColumns);
  }

  if (section.preferredColumns) {
    return Math.min(section.preferredColumns, maxColumns);
  }

  const type = (section.type ?? '').toLowerCase();
  const typeDefaults: Record<string, number> = {
    'overview': 4,
    'chart': 2,
    'map': 2,
    'contact-card': 1,
    'info': 1,
    'list': 1,
  };

  return Math.min(typeDefaults[type] ?? 1, maxColumns);
}

/**
 * Generates section key
 */
function getSectionKey(section: WorkerSection, index: number): string {
  return section.id ?? `${section.title ?? 'section'}-${section.type ?? 'info'}-${index}`;
}

/**
 * Generates CSS width expression
 */
function generateWidth(columns: number, colSpan: number, gap: number): string {
  if (columns <= 0 || colSpan <= 0) return '100%';

  const totalGap = gap * (columns - 1);
  const singleCol = `calc((100% - ${totalGap}px) / ${columns})`;

  if (colSpan === 1) return singleCol;

  const spanGaps = gap * (colSpan - 1);
  return `calc(${singleCol} * ${colSpan} + ${spanGaps}px)`;
}

/**
 * Generates CSS left expression
 */
function generateLeft(columns: number, columnIndex: number, gap: number): string {
  if (columns <= 0 || columnIndex <= 0) return '0px';

  const totalGap = gap * (columns - 1);
  const singleCol = `calc((100% - ${totalGap}px) / ${columns})`;

  return `calc((${singleCol} + ${gap}px) * ${columnIndex})`;
}

// ============================================================================
// BIN PACKING ALGORITHM
// ============================================================================

interface PackResult {
  placements: PositionedSection[];
  containerHeight: number;
  utilization: number;
  gapCount: number;
}

function packSections(
  sections: WorkerSection[],
  columns: number,
  gap: number = 12
): PackResult {
  const colHeights = new Array(columns).fill(0);
  const placements: PositionedSection[] = [];

  // Prepare sections with metrics and sort by height (FFDH)
  const withMetrics = sections.map((section, index) => ({
    section,
    index,
    height: estimateHeight(section),
    colSpan: calculateColSpan(section, columns),
    key: getSectionKey(section, index),
  }));

  // Sort by height descending for better packing
  withMetrics.sort((a, b) => b.height - a.height);

  for (const item of withMetrics) {
    const { section, height, colSpan, key } = item;
    const effectiveColSpan = Math.min(colSpan, columns);

    // Find best column
    let bestColumn = 0;
    let minHeight = Infinity;

    for (let col = 0; col <= columns - effectiveColSpan; col++) {
      let maxColHeight = 0;
      for (let c = col; c < col + effectiveColSpan; c++) {
        const colHeight = colHeights[c] ?? 0;
        if (colHeight > maxColHeight) {
          maxColHeight = colHeight;
        }
      }

      if (maxColHeight < minHeight) {
        minHeight = maxColHeight;
        bestColumn = col;
      }
    }

    const top = minHeight === Infinity ? 0 : minHeight;

    // Update column heights
    const newHeight = top + height + gap;
    for (let c = bestColumn; c < bestColumn + effectiveColSpan; c++) {
      colHeights[c] = newHeight;
    }

    placements.push({
      key,
      colSpan: effectiveColSpan,
      column: bestColumn,
      top,
      left: generateLeft(columns, bestColumn, gap),
      width: generateWidth(columns, effectiveColSpan, gap),
      height,
    });
  }

  // Restore original order
  placements.sort((a, b) => {
    const idxA = withMetrics.findIndex(m => m.key === a.key);
    const idxB = withMetrics.findIndex(m => m.key === b.key);
    return (withMetrics[idxA]?.index ?? 0) - (withMetrics[idxB]?.index ?? 0);
  });

  const containerHeight = Math.max(...colHeights, 0);
  const totalArea = columns * containerHeight;
  const usedArea = placements.reduce((sum, p) => sum + (p.colSpan * p.height), 0);
  const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

  // Count gaps
  const maxHeight = Math.max(...colHeights);
  const gapCount = colHeights.filter(h => h < maxHeight).length;

  return {
    placements,
    containerHeight,
    utilization: Math.round(utilization * 100) / 100,
    gapCount,
  };
}

// ============================================================================
// SKYLINE PACKING ALGORITHM
// ============================================================================

interface SkylineSegment {
  x: number;
  width: number;
  y: number;
}

function skylinePack(
  sections: WorkerSection[],
  columns: number,
  gap: number = 12
): PackResult {
  let skyline: SkylineSegment[] = [{ x: 0, width: columns, y: 0 }];
  const placements: PositionedSection[] = [];

  const withMetrics = sections.map((section, index) => ({
    section,
    index,
    height: estimateHeight(section),
    colSpan: calculateColSpan(section, columns),
    key: getSectionKey(section, index),
  }));

  // Sort by height descending
  withMetrics.sort((a, b) => b.height - a.height);

  for (const item of withMetrics) {
    const { section, height, colSpan, key } = item;
    const effectiveColSpan = Math.min(colSpan, columns);

    // Find best position in skyline
    let bestX = 0;
    let bestY = Infinity;
    let bestSegmentIndex = 0;

    for (let i = 0; i < skyline.length; i++) {
      const segment = skyline[i];
      if (!segment) continue;

      for (let x = segment.x; x <= segment.x + segment.width - effectiveColSpan; x++) {
        // Find max Y for this placement
        let maxY = 0;
        for (const seg of skyline) {
          if (seg.x < x + effectiveColSpan && seg.x + seg.width > x) {
            maxY = Math.max(maxY, seg.y);
          }
        }

        if (maxY < bestY) {
          bestY = maxY;
          bestX = x;
          bestSegmentIndex = i;
        }
      }
    }

    const top = bestY === Infinity ? 0 : bestY;
    const newTop = top + height + gap;

    // Update skyline
    skyline = updateSkyline(skyline, bestX, effectiveColSpan, newTop);

    placements.push({
      key,
      colSpan: effectiveColSpan,
      column: bestX,
      top,
      left: generateLeft(columns, bestX, gap),
      width: generateWidth(columns, effectiveColSpan, gap),
      height,
    });
  }

  // Restore original order
  placements.sort((a, b) => {
    const idxA = withMetrics.findIndex(m => m.key === a.key);
    const idxB = withMetrics.findIndex(m => m.key === b.key);
    return (withMetrics[idxA]?.index ?? 0) - (withMetrics[idxB]?.index ?? 0);
  });

  const containerHeight = Math.max(...skyline.map(s => s.y), 0);
  const totalArea = columns * containerHeight;
  const usedArea = placements.reduce((sum, p) => sum + (p.colSpan * p.height), 0);
  const utilization = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
  const gapCount = skyline.length - 1;

  return {
    placements,
    containerHeight,
    utilization: Math.round(utilization * 100) / 100,
    gapCount,
  };
}

function updateSkyline(
  skyline: SkylineSegment[],
  x: number,
  width: number,
  newY: number
): SkylineSegment[] {
  const newSkyline: SkylineSegment[] = [];
  const placementEnd = x + width;

  for (const segment of skyline) {
    const segmentEnd = segment.x + segment.width;

    // No overlap
    if (segmentEnd <= x || segment.x >= placementEnd) {
      newSkyline.push({ ...segment });
      continue;
    }

    // Partial overlap on left
    if (segment.x < x) {
      newSkyline.push({
        x: segment.x,
        width: x - segment.x,
        y: segment.y,
      });
    }

    // Partial overlap on right
    if (segmentEnd > placementEnd) {
      newSkyline.push({
        x: placementEnd,
        width: segmentEnd - placementEnd,
        y: segment.y,
      });
    }
  }

  // Add new segment
  newSkyline.push({ x, width, y: newY });

  // Sort and merge
  newSkyline.sort((a, b) => a.x - b.x);

  return mergeAdjacentSegments(newSkyline);
}

function mergeAdjacentSegments(segments: SkylineSegment[]): SkylineSegment[] {
  if (segments.length <= 1) return segments;

  const merged: SkylineSegment[] = [];
  let current = { ...segments[0]! };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i]!;

    if (current.x + current.width === next.x && current.y === next.y) {
      current.width += next.width;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

// ============================================================================
// GAP ANALYSIS
// ============================================================================

interface GapInfo {
  column: number;
  top: number;
  height: number;
  width: number;
}

interface GapAnalysis {
  gaps: GapInfo[];
  totalGapArea: number;
  gapCount: number;
  utilizationPercent: number;
}

function analyzeGaps(
  placements: PositionedSection[],
  columns: number,
  containerHeight: number
): GapAnalysis {
  const gaps: GapInfo[] = [];
  const gridRes = 10;
  const rows = Math.ceil(containerHeight / gridRes);
  const grid: boolean[][] = Array.from({ length: rows }, () => new Array(columns).fill(false));

  // Mark occupied cells
  for (const p of placements) {
    const startRow = Math.floor(p.top / gridRes);
    const endRow = Math.ceil((p.top + p.height) / gridRes);

    for (let r = startRow; r < Math.min(endRow, rows); r++) {
      for (let c = p.column; c < Math.min(p.column + p.colSpan, columns); c++) {
        const row = grid[r];
        if (row) row[c] = true;
      }
    }
  }

  // Find gaps
  for (let c = 0; c < columns; c++) {
    let gapStart: number | null = null;

    for (let r = 0; r < rows; r++) {
      const isOccupied = grid[r]?.[c] ?? false;

      if (!isOccupied && gapStart === null) {
        gapStart = r;
      } else if (isOccupied && gapStart !== null) {
        const gapHeight = (r - gapStart) * gridRes;
        if (gapHeight >= 50) {
          gaps.push({
            column: c,
            top: gapStart * gridRes,
            height: gapHeight,
            width: 1,
          });
        }
        gapStart = null;
      }
    }
  }

  const totalGapArea = gaps.reduce((sum, g) => sum + g.height * g.width, 0);
  const totalArea = columns * containerHeight;
  const usedArea = placements.reduce((sum, p) => sum + p.colSpan * p.height, 0);
  const utilizationPercent = totalArea > 0 ? (usedArea / totalArea) * 100 : 100;

  return {
    gaps,
    totalGapArea,
    gapCount: gaps.length,
    utilizationPercent: Math.round(utilizationPercent * 100) / 100,
  };
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

self.onmessage = (event: MessageEvent<LayoutWorkerMessage>) => {
  const { type, id, payload } = event.data;
  const startTime = performance.now();

  try {
    let result: LayoutWorkerResult;

    switch (type) {
      case 'PACK_SECTIONS': {
        const p = payload as PackSectionsPayload;
        result = packSections(p.sections, p.columns, p.gap ?? 12);
        break;
      }

      case 'SKYLINE_PACK': {
        const p = payload as PackSectionsPayload;
        result = skylinePack(p.sections, p.columns, p.gap ?? 12);
        break;
      }

      case 'CALCULATE_POSITIONS': {
        const p = payload as PackSectionsPayload;
        const packed = packSections(p.sections, p.columns, p.gap ?? 12);
        result = packed.placements;
        break;
      }

      case 'ANALYZE_GAPS': {
        const p = payload as AnalyzeGapsPayload;
        result = analyzeGaps(p.placements, p.columns, p.containerHeight);
        break;
      }

      case 'COMPUTE_HEIGHTS': {
        const p = payload as ComputeHeightsPayload;
        result = p.sections.map((s: WorkerSection, i: number) => ({
          key: getSectionKey(s, i),
          height: estimateHeight(s),
        }));
        break;
      }

      case 'OPTIMIZE_LAYOUT': {
        const p = payload as PackSectionsPayload;
        const packFn = p.algorithm === 'skyline' ? skylinePack : packSections;
        result = packFn(p.sections, p.columns, p.gap ?? 12);
        break;
      }

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const duration = performance.now() - startTime;

    self.postMessage({
      type,
      id,
      success: true,
      result,
      duration,
    } as LayoutWorkerResponse);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown worker error';
    self.postMessage({
      type,
      id,
      success: false,
      error: errorMessage,
      duration: performance.now() - startTime,
    } as LayoutWorkerResponse);
  }
};

// Export types for main thread usage
export type { WorkerSection, PositionedSection, PackResult, GapAnalysis };

