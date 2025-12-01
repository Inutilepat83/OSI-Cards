/**
 * Layout Calculation Web Worker (Improvement #11)
 * 
 * Offloads expensive masonry layout calculations to a Web Worker
 * to prevent main thread blocking during complex grid layouts.
 * 
 * This worker handles:
 * - FFDH (First Fit Decreasing Height) algorithm
 * - Column span optimization
 * - Gap filling calculations
 * - Virtual scroll positioning
 */

/// <reference lib="webworker" />

// ============================================================================
// TYPES
// ============================================================================

interface Section {
  id: string;
  type: string;
  title: string;
  preferredColumns: 1 | 2 | 3 | 4;
  colSpan?: number;
  estimatedHeight?: number;
}

interface LayoutConfig {
  containerWidth: number;
  minColumnWidth: number;
  maxColumns: number;
  gap: number;
  optimizeLayout: boolean;
  packingAlgorithm: 'legacy' | 'row-first' | 'skyline';
}

interface PositionedSection {
  id: string;
  colSpan: number;
  columnIndex: number;
  top: number;
  width: string;
  left: string;
  expanded: boolean;
}

interface LayoutResult {
  positions: PositionedSection[];
  containerHeight: number;
  columns: number;
  metrics: LayoutMetrics;
}

interface LayoutMetrics {
  calculationTimeMs: number;
  sectionsProcessed: number;
  gapsFilled: number;
  sectionsExpanded: number;
  utilizationPercent: number;
}

interface WorkerMessage {
  type: 'calculate' | 'optimize' | 'estimate';
  id: string;
  sections?: Section[];
  config?: LayoutConfig;
  sectionHeights?: Map<string, number>;
}

interface WorkerResponse {
  type: 'result' | 'error' | 'progress';
  id: string;
  result?: LayoutResult;
  error?: string;
  progress?: number;
}

// ============================================================================
// COLUMN CALCULATION
// ============================================================================

function calculateColumns(containerWidth: number, config: LayoutConfig): number {
  const { minColumnWidth, maxColumns, gap } = config;
  
  // Account for gaps between columns
  const availableWidth = containerWidth;
  const columnWithGap = minColumnWidth + gap;
  
  // Calculate how many columns can fit
  let columns = Math.floor((availableWidth + gap) / columnWithGap);
  
  // Clamp to valid range
  columns = Math.max(1, Math.min(columns, maxColumns));
  
  return columns;
}

function getColumnWidth(containerWidth: number, columns: number, gap: number): number {
  return (containerWidth - gap * (columns - 1)) / columns;
}

// ============================================================================
// WIDTH/LEFT EXPRESSION GENERATION
// ============================================================================

function generateWidthExpression(columns: number, colSpan: number, gap: number): string {
  if (columns === 1 || colSpan === columns) {
    return '100%';
  }
  
  const totalGaps = gap * (columns - 1);
  const columnFraction = colSpan / columns;
  const gapContribution = gap * (colSpan - 1);
  
  return `calc(${columnFraction * 100}% - ${totalGaps / columns * (columns - colSpan)}px + ${gapContribution}px)`;
}

function generateLeftExpression(columns: number, columnIndex: number, gap: number): string {
  if (columnIndex === 0) {
    return '0px';
  }
  
  const columnFraction = columnIndex / columns;
  const gapContribution = gap * columnIndex;
  
  return `calc(${columnFraction * 100}% + ${gapContribution - (gap * (columns - 1) / columns * columnIndex)}px)`;
}

// ============================================================================
// SECTION TYPE PREFERENCES
// ============================================================================

const SECTION_COLUMN_PREFERENCES: Record<string, number> = {
  'chart': 2,
  'map': 2,
  'table': 2,
  'financials': 2,
  'network-card': 2,
  'overview': 2,
  'analytics': 1,
  'info': 1,
  'contact-card': 1,
  'list': 1,
  'event': 1,
  'product': 1,
  'news': 1,
  'social-media': 1,
  'quotation': 1,
  'text-reference': 1,
  'solutions': 1,
  'brand-colors': 1
};

function getPreferredColumns(section: Section): number {
  if (section.preferredColumns) {
    return section.preferredColumns;
  }
  return SECTION_COLUMN_PREFERENCES[section.type] || 1;
}

// ============================================================================
// HEIGHT ESTIMATION
// ============================================================================

function estimateSectionHeight(section: Section): number {
  if (section.estimatedHeight) {
    return section.estimatedHeight;
  }
  
  // Base heights by type
  const baseHeights: Record<string, number> = {
    'chart': 350,
    'map': 400,
    'table': 300,
    'overview': 250,
    'analytics': 180,
    'info': 200,
    'contact-card': 180,
    'network-card': 200,
    'list': 220,
    'event': 200,
    'product': 250,
    'news': 280,
    'social-media': 220,
    'financials': 300,
    'quotation': 150,
    'text-reference': 180,
    'solutions': 240,
    'brand-colors': 160
  };
  
  return baseHeights[section.type] || 200;
}

// ============================================================================
// FFDH ALGORITHM (First Fit Decreasing Height)
// ============================================================================

function layoutFFDH(
  sections: Section[],
  columns: number,
  config: LayoutConfig
): PositionedSection[] {
  const { gap } = config;
  const colHeights = new Array(columns).fill(0);
  const positions: PositionedSection[] = [];
  
  // Sort sections by estimated height (descending)
  const sortedSections = [...sections].sort((a, b) => {
    const heightA = estimateSectionHeight(a);
    const heightB = estimateSectionHeight(b);
    return heightB - heightA;
  });
  
  for (const section of sortedSections) {
    const preferredSpan = Math.min(getPreferredColumns(section), columns);
    const height = estimateSectionHeight(section);
    
    // Find best column position for this span
    let bestColumn = 0;
    let bestHeight = Infinity;
    
    for (let col = 0; col <= columns - preferredSpan; col++) {
      // Find max height across the span
      let maxHeight = 0;
      for (let c = col; c < col + preferredSpan; c++) {
        if (colHeights[c]! > maxHeight) {
          maxHeight = colHeights[c]!;
        }
      }
      
      if (maxHeight < bestHeight) {
        bestHeight = maxHeight;
        bestColumn = col;
      }
    }
    
    // Check if we should expand to fill remaining space
    const remainingCols = columns - bestColumn - preferredSpan;
    const expanded = remainingCols > 0 && remainingCols < 2;
    const finalSpan = expanded ? preferredSpan + remainingCols : preferredSpan;
    
    // Calculate position
    const top = bestHeight;
    const width = generateWidthExpression(columns, finalSpan, gap);
    const left = generateLeftExpression(columns, bestColumn, gap);
    
    // Update column heights
    const newHeight = top + height + gap;
    for (let c = bestColumn; c < bestColumn + finalSpan; c++) {
      colHeights[c] = newHeight;
    }
    
    positions.push({
      id: section.id,
      colSpan: finalSpan,
      columnIndex: bestColumn,
      top,
      width,
      left,
      expanded
    });
  }
  
  return positions;
}

// ============================================================================
// ROW-FIRST PACKING ALGORITHM
// ============================================================================

interface PackedRow {
  sections: Array<{ section: Section; colSpan: number }>;
  totalSpan: number;
  height: number;
}

function layoutRowFirst(
  sections: Section[],
  columns: number,
  config: LayoutConfig
): PositionedSection[] {
  const { gap } = config;
  const rows: PackedRow[] = [];
  const remainingSections = [...sections];
  
  // Pack sections into rows
  while (remainingSections.length > 0) {
    const row: PackedRow = { sections: [], totalSpan: 0, height: 0 };
    
    // Try to fill the row
    for (let i = remainingSections.length - 1; i >= 0; i--) {
      const section = remainingSections[i]!;
      const preferredSpan = Math.min(getPreferredColumns(section), columns);
      const availableSpan = columns - row.totalSpan;
      
      if (preferredSpan <= availableSpan) {
        row.sections.push({ section, colSpan: preferredSpan });
        row.totalSpan += preferredSpan;
        row.height = Math.max(row.height, estimateSectionHeight(section));
        remainingSections.splice(i, 1);
        
        if (row.totalSpan === columns) break;
      }
    }
    
    // If no sections could be added, take the first remaining and expand it
    if (row.sections.length === 0 && remainingSections.length > 0) {
      const section = remainingSections.shift()!;
      row.sections.push({ section, colSpan: columns });
      row.totalSpan = columns;
      row.height = estimateSectionHeight(section);
    }
    
    // Expand sections to fill gaps if needed
    if (row.totalSpan < columns && row.sections.length > 0) {
      const gap = columns - row.totalSpan;
      const expandableSections = row.sections.filter(s => {
        const canGrow = !['info', 'contact-card'].includes(s.section.type);
        return canGrow && s.colSpan < columns;
      });
      
      if (expandableSections.length > 0) {
        const extraPerSection = Math.floor(gap / expandableSections.length);
        let remainder = gap % expandableSections.length;
        
        for (const s of expandableSections) {
          s.colSpan += extraPerSection;
          if (remainder > 0) {
            s.colSpan++;
            remainder--;
          }
        }
        row.totalSpan = columns;
      }
    }
    
    rows.push(row);
  }
  
  // Convert rows to positions
  const positions: PositionedSection[] = [];
  let currentTop = 0;
  
  for (const row of rows) {
    let currentCol = 0;
    
    for (const { section, colSpan } of row.sections) {
      positions.push({
        id: section.id,
        colSpan,
        columnIndex: currentCol,
        top: currentTop,
        width: generateWidthExpression(columns, colSpan, gap),
        left: generateLeftExpression(columns, currentCol, gap),
        expanded: colSpan > getPreferredColumns(section)
      });
      
      currentCol += colSpan;
    }
    
    currentTop += row.height + gap;
  }
  
  return positions;
}

// ============================================================================
// SKYLINE ALGORITHM
// ============================================================================

interface SkylineSegment {
  left: number;
  right: number;
  height: number;
}

function layoutSkyline(
  sections: Section[],
  columns: number,
  config: LayoutConfig
): PositionedSection[] {
  const { gap, containerWidth } = config;
  const colWidth = getColumnWidth(containerWidth, columns, gap);
  const positions: PositionedSection[] = [];
  
  // Initialize skyline
  let skyline: SkylineSegment[] = [{ left: 0, right: columns, height: 0 }];
  
  // Sort sections by height descending
  const sortedSections = [...sections].sort((a, b) => 
    estimateSectionHeight(b) - estimateSectionHeight(a)
  );
  
  for (const section of sortedSections) {
    const preferredSpan = Math.min(getPreferredColumns(section), columns);
    const height = estimateSectionHeight(section);
    
    // Find lowest position that can fit this section
    let bestPos = { col: 0, height: Infinity };
    
    for (let col = 0; col <= columns - preferredSpan; col++) {
      // Find max height in this span from skyline
      let maxHeight = 0;
      for (const seg of skyline) {
        if (seg.left < col + preferredSpan && seg.right > col) {
          maxHeight = Math.max(maxHeight, seg.height);
        }
      }
      
      if (maxHeight < bestPos.height) {
        bestPos = { col, height: maxHeight };
      }
    }
    
    const top = bestPos.height;
    const colIndex = bestPos.col;
    
    // Update skyline
    const newHeight = top + height + gap;
    const newSkyline: SkylineSegment[] = [];
    
    for (const seg of skyline) {
      if (seg.right <= colIndex || seg.left >= colIndex + preferredSpan) {
        // Segment not affected
        newSkyline.push(seg);
      } else {
        // Segment overlaps with new section
        if (seg.left < colIndex) {
          newSkyline.push({ left: seg.left, right: colIndex, height: seg.height });
        }
        if (seg.right > colIndex + preferredSpan) {
          newSkyline.push({ left: colIndex + preferredSpan, right: seg.right, height: seg.height });
        }
      }
    }
    
    // Add new segment for this section
    newSkyline.push({ left: colIndex, right: colIndex + preferredSpan, height: newHeight });
    
    // Merge adjacent segments with same height
    newSkyline.sort((a, b) => a.left - b.left);
    skyline = [];
    for (const seg of newSkyline) {
      const last = skyline[skyline.length - 1];
      if (last && last.right === seg.left && last.height === seg.height) {
        last.right = seg.right;
      } else {
        skyline.push(seg);
      }
    }
    
    positions.push({
      id: section.id,
      colSpan: preferredSpan,
      columnIndex: colIndex,
      top,
      width: generateWidthExpression(columns, preferredSpan, gap),
      left: generateLeftExpression(columns, colIndex, gap),
      expanded: false
    });
  }
  
  return positions;
}

// ============================================================================
// MAIN LAYOUT FUNCTION
// ============================================================================

function calculateLayout(
  sections: Section[],
  config: LayoutConfig
): LayoutResult {
  const startTime = performance.now();
  
  const columns = calculateColumns(config.containerWidth, config);
  let positions: PositionedSection[];
  
  switch (config.packingAlgorithm) {
    case 'row-first':
      positions = layoutRowFirst(sections, columns, config);
      break;
    case 'skyline':
      positions = layoutSkyline(sections, columns, config);
      break;
    case 'legacy':
    default:
      positions = layoutFFDH(sections, columns, config);
      break;
  }
  
  // Calculate container height
  let containerHeight = 0;
  for (const pos of positions) {
    const section = sections.find(s => s.id === pos.id);
    const height = section ? estimateSectionHeight(section) : 200;
    containerHeight = Math.max(containerHeight, pos.top + height);
  }
  
  // Calculate metrics
  const totalArea = config.containerWidth * containerHeight;
  let usedArea = 0;
  for (const pos of positions) {
    const section = sections.find(s => s.id === pos.id);
    const height = section ? estimateSectionHeight(section) : 200;
    const width = (config.containerWidth / columns) * pos.colSpan;
    usedArea += width * height;
  }
  
  const calculationTimeMs = performance.now() - startTime;
  
  return {
    positions,
    containerHeight,
    columns,
    metrics: {
      calculationTimeMs,
      sectionsProcessed: sections.length,
      gapsFilled: 0, // TODO: track gap fills
      sectionsExpanded: positions.filter(p => p.expanded).length,
      utilizationPercent: totalArea > 0 ? (usedArea / totalArea) * 100 : 0
    }
  };
}

// ============================================================================
// WORKER MESSAGE HANDLER
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id, sections, config } = event.data;
  
  try {
    switch (type) {
      case 'calculate':
        if (!sections || !config) {
          throw new Error('Missing sections or config');
        }
        
        const result = calculateLayout(sections, config);
        
        const response: WorkerResponse = {
          type: 'result',
          id,
          result
        };
        
        self.postMessage(response);
        break;
        
      case 'estimate':
        if (!sections) {
          throw new Error('Missing sections');
        }
        
        const estimates = sections.map(s => ({
          id: s.id,
          height: estimateSectionHeight(s)
        }));
        
        self.postMessage({
          type: 'result',
          id,
          result: { estimates }
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    const errorResponse: WorkerResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(errorResponse);
  }
};

// Export types for TypeScript consumers
export type { Section, LayoutConfig, PositionedSection, LayoutResult, LayoutMetrics };

