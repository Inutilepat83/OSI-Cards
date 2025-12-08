/**
 * Layout Calculation Web Worker
 * Offloads heavy layout calculations to a background thread
 */

/**
 * Message types for worker communication
 */
type WorkerMessageType =
  | 'calculate-layout'
  | 'calculate-columns'
  | 'estimate-heights'
  | 'optimize-layout';

/**
 * Worker message structure
 */
interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  payload: any;
}

/**
 * Worker response structure
 */
interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
}

/**
 * Layout calculation request
 */
interface LayoutCalculationRequest {
  sections: any[];
  containerWidth: number;
  columns: number;
  gap: number;
  algorithm: 'row-first' | 'ffdh' | 'skyline';
}

/**
 * Layout calculation result
 */
interface LayoutCalculationResult {
  positions: Array<{
    id: string;
    column: number;
    row: number;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  totalHeight: number;
  columnHeights: number[];
}

// Worker message handler
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  try {
    let result: any;

    switch (type) {
      case 'calculate-layout':
        result = calculateLayout(payload);
        break;

      case 'calculate-columns':
        result = calculateColumns(payload);
        break;

      case 'estimate-heights':
        result = estimateHeights(payload);
        break;

      case 'optimize-layout':
        result = optimizeLayout(payload);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const response: WorkerResponse = { id, result };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
});

/**
 * Calculate complete layout
 */
function calculateLayout(request: LayoutCalculationRequest): LayoutCalculationResult {
  const { sections, containerWidth, columns, gap, algorithm } = request;

  switch (algorithm) {
    case 'row-first':
      return calculateRowFirstLayout(sections, columns, gap);

    case 'ffdh':
      return calculateFFDHLayout(sections, columns, gap);

    case 'skyline':
      return calculateSkylineLayout(sections, columns, gap);

    default:
      throw new Error(`Unknown algorithm: ${algorithm}`);
  }
}

/**
 * Row-first packing algorithm
 */
function calculateRowFirstLayout(
  sections: any[],
  totalColumns: number,
  gap: number
): LayoutCalculationResult {
  const positions: LayoutCalculationResult['positions'] = [];
  const columnHeights: number[] = Array(totalColumns).fill(0);

  let currentRow = 0;
  let currentColumn = 0;

  sections.forEach((section) => {
    const colSpan = Math.min(section.colSpan || 1, totalColumns);

    // Check if section fits in current row
    if (currentColumn + colSpan > totalColumns) {
      currentRow++;
      currentColumn = 0;
    }

    // Calculate position
    const columnWidth = 100 / totalColumns;
    const left = currentColumn * columnWidth;
    const top = Math.max(...columnHeights.slice(currentColumn, currentColumn + colSpan));

    positions.push({
      id: section.id,
      column: currentColumn,
      row: currentRow,
      left,
      top,
      width: columnWidth * colSpan - gap,
      height: section.height || 200,
    });

    // Update column heights
    for (let i = currentColumn; i < currentColumn + colSpan; i++) {
      columnHeights[i] = top + (section.height || 200) + gap;
    }

    currentColumn += colSpan;
  });

  return {
    positions,
    totalHeight: Math.max(...columnHeights),
    columnHeights,
  };
}

/**
 * FFDH (First Fit Decreasing Height) algorithm
 */
function calculateFFDHLayout(
  sections: any[],
  totalColumns: number,
  gap: number
): LayoutCalculationResult {
  // Sort sections by height (tallest first)
  const sorted = [...sections].sort((a, b) => (b.height || 200) - (a.height || 200));

  const positions: LayoutCalculationResult['positions'] = [];
  const columnHeights: number[] = Array(totalColumns).fill(0);

  sorted.forEach((section) => {
    const colSpan = Math.min(section.colSpan || 1, totalColumns);

    // Find shortest column span
    let bestColumn = 0;
    let minHeight = Infinity;

    for (let col = 0; col <= totalColumns - colSpan; col++) {
      const maxHeight = Math.max(...columnHeights.slice(col, col + colSpan));
      if (maxHeight < minHeight) {
        minHeight = maxHeight;
        bestColumn = col;
      }
    }

    // Calculate position
    const columnWidth = 100 / totalColumns;
    const left = bestColumn * columnWidth;
    const top = minHeight;

    positions.push({
      id: section.id,
      column: bestColumn,
      row: 0, // Row concept doesn't apply to FFDH
      left,
      top,
      width: columnWidth * colSpan - gap,
      height: section.height || 200,
    });

    // Update column heights
    for (let i = bestColumn; i < bestColumn + colSpan; i++) {
      columnHeights[i] = top + (section.height || 200) + gap;
    }
  });

  return {
    positions,
    totalHeight: Math.max(...columnHeights),
    columnHeights,
  };
}

/**
 * Skyline algorithm
 */
function calculateSkylineLayout(
  sections: any[],
  totalColumns: number,
  gap: number
): LayoutCalculationResult {
  // Simplified skyline implementation
  // Full implementation would track skyline segments
  return calculateFFDHLayout(sections, totalColumns, gap);
}

/**
 * Calculate optimal number of columns
 */
function calculateColumns(payload: {
  containerWidth: number;
  minColumnWidth: number;
  maxColumns: number;
}): number {
  const { containerWidth, minColumnWidth, maxColumns } = payload;

  if (containerWidth <= 0) return 1;

  const calculatedColumns = Math.floor(containerWidth / minColumnWidth);
  return Math.min(Math.max(1, calculatedColumns), maxColumns);
}

/**
 * Estimate section heights
 */
function estimateHeights(payload: { sections: any[] }): Record<string, number> {
  const { sections } = payload;
  const heights: Record<string, number> = {};

  sections.forEach((section) => {
    // Base height
    let estimatedHeight = 100;

    // Add height for title
    if (section.title) {
      estimatedHeight += 30;
    }

    // Add height for description
    if (section.description) {
      estimatedHeight += Math.ceil(section.description.length / 50) * 20;
    }

    // Add height for fields
    if (section.fields && Array.isArray(section.fields)) {
      estimatedHeight += section.fields.length * 40;
    }

    // Add height for items
    if (section.items && Array.isArray(section.items)) {
      estimatedHeight += section.items.length * 35;
    }

    // Type-specific adjustments
    switch (section.type) {
      case 'chart':
        estimatedHeight = Math.max(estimatedHeight, 300);
        break;
      case 'map':
        estimatedHeight = Math.max(estimatedHeight, 350);
        break;
      case 'contact-card':
        estimatedHeight = Math.max(estimatedHeight, 250);
        break;
      case 'gallery':
        estimatedHeight = Math.max(estimatedHeight, 400);
        break;
    }

    heights[section.id] = estimatedHeight;
  });

  return heights;
}

/**
 * Optimize layout
 */
function optimizeLayout(payload: { positions: any[]; columns: number }): LayoutCalculationResult {
  // Simplified optimization
  // Full implementation would perform swaps and gap filling
  const { positions, columns } = payload;

  return {
    positions,
    totalHeight: Math.max(...positions.map((p) => p.top + p.height)),
    columnHeights: [],
  };
}

export {};



