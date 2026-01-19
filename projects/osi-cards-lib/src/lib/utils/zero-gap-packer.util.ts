/**
 * Zero-Gap Packing Algorithm
 *
 * A convenience wrapper around the library’s packing engines that aims for
 * maximal density (minimal gaps) using multiple optimization passes.
 *
 * This API is intentionally lightweight: it returns a standard packing result
 * shape with gap metrics that can be used by layout services and diagnostics.
 */

import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { LayoutContext } from '@osi-cards/types';
import { packSectionsIntoColumns, type ColumnPackingResult } from './column-packer.util';

export interface ZeroGapPackingResult extends ColumnPackingResult {}

/**
 * Pack sections while aggressively minimizing gaps.
 *
 * @param sections Sections to pack
 * @param columns Total number of columns in the grid
 * @param gap Gap between items (px)
 * @param preferenceService Optional: layout preference service (type-based colSpan constraints)
 * @param context Optional: layout context (container width, breakpoints, etc.)
 */
export function packWithZeroGapsGuarantee(
  sections: CardSection[],
  columns: number = 4,
  gap: number = 12,
  preferenceService?: SectionLayoutPreferenceService,
  context?: LayoutContext
): ZeroGapPackingResult {
  if (sections.length === 0) {
    return {
      positionedSections: [],
      totalHeight: 0,
      columns,
      utilization: 100,
      gapCount: 0,
      gapArea: 0,
      heightVariance: 0,
      algorithm: 'ffdh',
    };
  }

  // Prefer the real measured container width when available, but provide a safe default
  // for Node/test environments and docs examples.
  const containerWidth = context?.containerWidth ?? 1200;

  const result = packSectionsIntoColumns(sections, {
    columns,
    gap,
    containerWidth,
    packingMode: 'hybrid',
    allowReordering: true,
    sortByHeight: true,
    // Aggressive: switch to Skyline as soon as we detect any meaningful gaps
    useSkylineThreshold: 1,
    // Aggressive multi-pass compaction
    optimizationPasses: 5,
    enableGapAwarePlacement: true,
    // Column packer supports a generic preference service contract
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    layoutPreferenceService: preferenceService as any,
  });

  // Ensure utilization always reports a sensible number (tests expect 100 for empty,
  // and >0 for non-empty typical layouts).
  const utilization = Number.isFinite(result.utilization) ? result.utilization : 0;

  return {
    ...result,
    utilization,
  };
}
