/**
 * Debug utility to measure spacing inconsistencies across all section items
 */

const SERVER_ENDPOINT = 'http://127.0.0.1:7245/ingest/ae037419-79db-44fb-9060-a10d5503303a';

// Import export function
import { exportSpacingData } from './export-spacing-data';

interface SpacingMeasurement {
  sectionType: string;
  itemIndex: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  gap: number | null;
  computedGap: string | null;
  width: number;
  height: number;
  sectionItemClass: string;
  parentGap: number | null;
  parentComputedGap: string | null;
  actualHorizontalGap?: number | null;
  actualVerticalGap?: number | null;
}

function logMeasurement(location: string, message: string, data: any, hypothesisId: string): void {
  const logEntry = {
    location,
    message,
    data,
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId,
  };

  // Try HTTP endpoint
  fetch(SERVER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(logEntry),
  }).catch(() => {});

  // Fallback: console and localStorage
  console.log(`[Spacing Debug ${hypothesisId}]`, message, data);

  // Store in localStorage as backup
  try {
    const existing = localStorage.getItem('spacing-debug-logs');
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(logEntry);
    localStorage.setItem('spacing-debug-logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Measure spacing for a single section item
 */
function measureSectionItem(
  element: HTMLElement,
  sectionType: string,
  itemIndex: number
): SpacingMeasurement | null {
  const styles = window.getComputedStyle(element);

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:measureSectionItem',
    'Measuring section item',
    {
      sectionType,
      itemIndex,
      className: element.className,
      tagName: element.tagName,
    },
    'A'
  );
  // #endregion

  const paddingTop = parseFloat(styles.paddingTop) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const paddingBottom = parseFloat(styles.paddingBottom) || 0;
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;

  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginRight = parseFloat(styles.marginRight) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  const marginLeft = parseFloat(styles.marginLeft) || 0;

  // Get gap (for flex/grid containers)
  const gap = styles.gap;
  const gapValue = gap && gap !== 'normal' ? parseFloat(gap) : null;

  const parent = element.parentElement;
  let parentGap: number | null = null;
  let parentComputedGap: string | null = null;
  let actualHorizontalGap: number | null = null;
  let actualVerticalGap: number | null = null;

  if (parent) {
    const parentStyles = window.getComputedStyle(parent);
    const parentDisplay = parentStyles.display;
    parentComputedGap = parentStyles.gap;
    parentGap =
      parentComputedGap && parentComputedGap !== 'normal' ? parseFloat(parentComputedGap) : null;

    // Measure actual gap between this item and next sibling
    const nextSibling = element.nextElementSibling as HTMLElement;
    if (nextSibling && nextSibling.classList.contains('section-item')) {
      const rect1 = element.getBoundingClientRect();
      const rect2 = nextSibling.getBoundingClientRect();

      if (parentDisplay === 'grid') {
        // For grid, check if items are in same row (horizontal gap) or different rows (vertical gap)
        const horizontalGap = Math.max(0, rect2.left - rect1.right);
        const verticalGap = Math.max(0, rect2.top - rect1.bottom);

        // If items are roughly at same Y position (within 5px), they're in same row
        const sameRow = Math.abs(rect1.top - rect2.top) < 5;
        if (sameRow && horizontalGap > 0) {
          actualHorizontalGap = horizontalGap;
        } else if (!sameRow && verticalGap > 0) {
          actualVerticalGap = verticalGap;
        }

        // #region agent log
        logMeasurement(
          'spacing-debug.util.ts:measureSectionItem',
          'Grid gap measurement',
          {
            sectionType,
            itemIndex,
            horizontalGap,
            verticalGap,
            sameRow,
            actualHorizontalGap,
            actualVerticalGap,
            rect1Top: rect1.top,
            rect2Top: rect2.top,
          },
          'H7'
        );
        // #endregion
      } else if (parentDisplay === 'flex') {
        const flexDirection = parentStyles.flexDirection;
        const horizontalGap = Math.max(0, rect2.left - rect1.right);
        const verticalGap = Math.max(0, rect2.top - rect1.bottom);

        if (flexDirection === 'column' || flexDirection === '' || !flexDirection) {
          // Default flex direction is column
          actualVerticalGap = verticalGap;
        } else if (flexDirection === 'row') {
          actualHorizontalGap = horizontalGap;
        }

        // #region agent log
        logMeasurement(
          'spacing-debug.util.ts:measureSectionItem',
          'Flex gap measurement',
          {
            sectionType,
            itemIndex,
            flexDirection,
            horizontalGap,
            verticalGap,
            actualHorizontalGap,
            actualVerticalGap,
          },
          'H7'
        );
        // #endregion
      }
    }

    // #region agent log
    logMeasurement(
      'spacing-debug.util.ts:measureSectionItem',
      'Parent element gap analysis',
      {
        sectionType,
        itemIndex,
        parentTag: parent.tagName,
        parentClass: parent.className,
        parentDisplay,
        parentGap,
        parentComputedGap,
        actualHorizontalGap,
        actualVerticalGap,
        isFlexOrGrid: parentDisplay === 'flex' || parentDisplay === 'grid',
      },
      'H3'
    );
    // #endregion
  }

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:measureSectionItem',
    'Computed spacing values',
    {
      sectionType,
      itemIndex,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
      marginTop,
      marginRight,
      marginBottom,
      marginLeft,
      gap: gapValue,
      parentGap,
      isUniformPadding:
        paddingTop === paddingRight &&
        paddingRight === paddingBottom &&
        paddingBottom === paddingLeft,
      isUniformMargin:
        marginTop === marginRight && marginRight === marginBottom && marginBottom === marginLeft,
    },
    'B'
  );
  // #endregion

  return {
    sectionType,
    itemIndex,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    marginTop,
    marginRight,
    marginBottom,
    marginLeft,
    gap: gapValue,
    computedGap: gap,
    width: element.offsetWidth,
    height: element.offsetHeight,
    sectionItemClass: element.className,
    parentGap,
    parentComputedGap,
    actualHorizontalGap,
    actualVerticalGap,
  };
}

/**
 * Find section type from parent container
 * Handles both regular DOM and Shadow DOM
 */
function findSectionType(element: HTMLElement): string {
  let current: HTMLElement | null = element;
  let depth = 0;
  while (current && depth < 10) {
    const classList = current.classList;
    if (classList.contains('ai-section')) {
      // Extract section type from class like "ai-section--analytics"
      for (const className of Array.from(classList)) {
        if (className.startsWith('ai-section--')) {
          return className.replace('ai-section--', '');
        }
      }
      return 'unknown';
    }

    // Get parent (works in both regular DOM and Shadow DOM)
    current = current.parentElement;
    if (!current) {
      // Try to get parent from shadow root
      const shadowRoot = (element as any).getRootNode();
      if (shadowRoot && shadowRoot !== document && shadowRoot.host) {
        current = shadowRoot.host as HTMLElement;
      }
    }
    depth++;
  }
  return 'unknown';
}

/**
 * Find all section items including those in Shadow DOM
 */
function findAllSectionItems(): HTMLElement[] {
  const items: HTMLElement[] = [];

  // Find in regular DOM
  const regularItems = document.querySelectorAll<HTMLElement>('.section-item');
  items.push(...Array.from(regularItems));

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:findAllSectionItems',
    'Regular DOM search',
    { count: regularItems.length },
    'C'
  );
  // #endregion

  // Find in Shadow DOM - check all possible shadow hosts
  const shadowHosts = document.querySelectorAll('app-ai-card-renderer');
  let shadowItemsCount = 0;

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:findAllSectionItems',
    'Found shadow hosts',
    { count: shadowHosts.length },
    'H1'
  );
  // #endregion

  shadowHosts.forEach((host, index) => {
    try {
      const shadowRoot = (host as any).shadowRoot;
      if (shadowRoot) {
        // #region agent log
        logMeasurement(
          'spacing-debug.util.ts:findAllSectionItems',
          'Accessing shadow root',
          { hostIndex: index, hasShadowRoot: true },
          'H1'
        );
        // #endregion

        // Try multiple selectors
        const selectors = [
          '.section-item',
          '[class*="section-item"]',
          'ai-section .section-item',
          'app-section-renderer .section-item',
        ];

        selectors.forEach((selector) => {
          try {
            const shadowItems = shadowRoot.querySelectorAll(selector) as NodeListOf<HTMLElement>;
            const shadowItemsArray = Array.from(shadowItems);
            shadowItemsArray.forEach((item) => {
              if (!items.includes(item)) {
                items.push(item);
                shadowItemsCount++;
              }
            });
            // #region agent log
            if (shadowItemsArray.length > 0) {
              logMeasurement(
                'spacing-debug.util.ts:findAllSectionItems',
                'Found items with selector',
                { selector, count: shadowItemsArray.length, hostIndex: index },
                'H1'
              );
            }
            // #endregion
          } catch (e) {
            // Ignore selector errors
          }
        });

        // Also check for section components inside shadow root
        const sectionComponents = shadowRoot.querySelectorAll(
          '[class*="ai-section"], app-section-renderer'
        );
        // #region agent log
        logMeasurement(
          'spacing-debug.util.ts:findAllSectionItems',
          'Found section components in shadow',
          { count: sectionComponents.length, hostIndex: index },
          'H1'
        );
        // #endregion

        sectionComponents.forEach((section: any) => {
          const sectionItems = section.querySelectorAll?.('.section-item') as
            | NodeListOf<HTMLElement>
            | undefined;
          if (sectionItems) {
            Array.from(sectionItems).forEach((item) => {
              if (!items.includes(item)) {
                items.push(item);
                shadowItemsCount++;
              }
            });
          }
        });
      } else {
        // #region agent log
        logMeasurement(
          'spacing-debug.util.ts:findAllSectionItems',
          'No shadow root found',
          { hostIndex: index, hostTag: host.tagName },
          'H1'
        );
        // #endregion
      }
    } catch (e) {
      // #region agent log
      logMeasurement(
        'spacing-debug.util.ts:findAllSectionItems',
        'Error accessing shadow root',
        { hostIndex: index, error: String(e) },
        'H1'
      );
      // #endregion
    }
  });

  // Also try to find section components directly (they might not be in shadow DOM)
  const sectionComponents = document.querySelectorAll('[class*="ai-section"]');
  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:findAllSectionItems',
    'Found section components in regular DOM',
    { count: sectionComponents.length },
    'H1'
  );
  // #endregion

  sectionComponents.forEach((section) => {
    const sectionItems = section.querySelectorAll('.section-item') as NodeListOf<HTMLElement>;
    Array.from(sectionItems).forEach((item) => {
      if (!items.includes(item)) {
        items.push(item);
      }
    });
  });

  // Remove duplicates based on element reference
  const uniqueItems = Array.from(new Set(items));

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:findAllSectionItems',
    'Total items found',
    {
      regular: regularItems.length,
      shadow: shadowItemsCount,
      total: uniqueItems.length,
    },
    'C'
  );
  // #endregion

  return uniqueItems;
}

/**
 * Measure all section items on the page
 * Waits for sections to appear if they're not ready yet
 * Handles Shadow DOM and uses MutationObserver for better detection
 */
export function measureAllSectionItems(maxWaitMs = 10000): void {
  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:measureAllSectionItems',
    'Starting measurement of all section items',
    { timestamp: Date.now(), maxWaitMs },
    'C'
  );
  // #endregion

  const startTime = Date.now();
  let observer: MutationObserver | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  function attemptMeasurement(): void {
    const sectionItems = findAllSectionItems();

    // #region agent log
    logMeasurement(
      'spacing-debug.util.ts:measureAllSectionItems',
      'Found section items',
      { count: sectionItems.length, elapsed: Date.now() - startTime },
      'C'
    );
    // #endregion

    // If items found, proceed with measurement
    if (sectionItems.length > 0) {
      if (observer) {
        observer.disconnect();
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      performMeasurement(sectionItems);
      return;
    }

    // If no items found and we haven't waited too long, try again
    if (Date.now() - startTime < maxWaitMs) {
      timeoutId = setTimeout(attemptMeasurement, 500);
      return;
    }

    // If still no items after waiting, log and return
    if (observer) {
      observer.disconnect();
    }
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // #region agent log
    logMeasurement(
      'spacing-debug.util.ts:measureAllSectionItems',
      'No section items found after waiting',
      { elapsed: Date.now() - startTime },
      'C'
    );
    // #endregion

    console.warn(
      '[Spacing Debug] No section items found. Make sure a card with sections is loaded.'
    );
    console.warn(
      '[Spacing Debug] Try running: measureAllSectionItems() manually after the card loads'
    );
  }

  // Use MutationObserver to watch for section items being added
  observer = new MutationObserver(() => {
    const items = findAllSectionItems();
    if (items.length > 0) {
      attemptMeasurement();
    }
  });

  // Observe the document body and any shadow roots
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also observe shadow roots if they exist
  const shadowHosts = document.querySelectorAll('app-ai-card-renderer');
  shadowHosts.forEach((host) => {
    try {
      const shadowRoot = (host as any).shadowRoot;
      if (shadowRoot) {
        observer.observe(shadowRoot, {
          childList: true,
          subtree: true,
        });
      }
    } catch (e) {
      // Ignore
    }
  });

  // Start measurement attempt immediately
  attemptMeasurement();

  // Cleanup after max wait time
  setTimeout(() => {
    if (observer) {
      observer.disconnect();
    }
  }, maxWaitMs);
}

/**
 * Perform the actual measurement on found section items
 */
function performMeasurement(sectionItems: HTMLElement[]): void {
  const measurements: SpacingMeasurement[] = [];

  sectionItems.forEach((item, index) => {
    const sectionType = findSectionType(item);
    const measurement = measureSectionItem(item, sectionType, index);

    if (measurement) {
      measurements.push(measurement);

      // #region agent log
      logMeasurement(
        'spacing-debug.util.ts:performMeasurement',
        'Section item measurement',
        measurement,
        'D'
      );
      // #endregion
    }
  });

  // Analyze inconsistencies
  const paddingValues = new Set<number>();
  const gapValues = new Set<number | null>();
  const actualHorizontalGaps = new Set<number | null>();
  const actualVerticalGaps = new Set<number | null>();
  const sectionGroups = new Map<string, SpacingMeasurement[]>();
  const asymmetricPadding: SpacingMeasurement[] = [];
  const inconsistentGapsInitial: { measurement: SpacingMeasurement; expectedGap: number }[] = [];
  const zeroGapItems: {
    measurement: SpacingMeasurement;
    gapType: 'horizontal' | 'vertical' | 'both';
  }[] = [];

  measurements.forEach((m) => {
    paddingValues.add(m.paddingTop);
    paddingValues.add(m.paddingRight);
    paddingValues.add(m.paddingBottom);
    paddingValues.add(m.paddingLeft);
    gapValues.add(m.gap);
    gapValues.add(m.parentGap);
    if (m.actualHorizontalGap !== null && m.actualHorizontalGap !== undefined) {
      actualHorizontalGaps.add(m.actualHorizontalGap);
    }
    if (m.actualVerticalGap !== null && m.actualVerticalGap !== undefined) {
      actualVerticalGaps.add(m.actualVerticalGap);
    }

    if (!sectionGroups.has(m.sectionType)) {
      sectionGroups.set(m.sectionType, []);
    }
    sectionGroups.get(m.sectionType)!.push(m);

    // Check for asymmetric padding
    if (
      m.paddingTop !== m.paddingRight ||
      m.paddingRight !== m.paddingBottom ||
      m.paddingBottom !== m.paddingLeft
    ) {
      asymmetricPadding.push(m);
    }

    // Check for inconsistent gaps (should be 6px)
    if (m.parentGap !== null && m.parentGap !== 6) {
      inconsistentGapsInitial.push({ measurement: m, expectedGap: 6 });
    }

    // Check for zero gaps
    if (m.actualHorizontalGap !== null && m.actualHorizontalGap === 0) {
      zeroGapItems.push({ measurement: m, gapType: 'horizontal' });
    }
    if (m.actualVerticalGap !== null && m.actualVerticalGap === 0) {
      zeroGapItems.push({
        measurement: m,
        gapType: zeroGapItems.find((z) => z.measurement === m) ? 'both' : 'vertical',
      });
    }
  });

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:performMeasurement',
    'Inconsistency analysis',
    {
      totalItems: measurements.length,
      asymmetricPaddingCount: asymmetricPadding.length,
      inconsistentGapsCount: inconsistentGapsInitial.length,
      zeroGapItemsCount: zeroGapItems.length,
      uniquePaddingValues: Array.from(paddingValues).sort((a, b) => a - b),
      uniqueGapValues: Array.from(gapValues)
        .filter((v) => v !== null)
        .sort((a, b) => (a || 0) - (b || 0)),
      uniqueActualHorizontalGaps: Array.from(actualHorizontalGaps)
        .filter((v) => v !== null)
        .sort((a, b) => (a || 0) - (b || 0)),
      uniqueActualVerticalGaps: Array.from(actualVerticalGaps)
        .filter((v) => v !== null)
        .sort((a, b) => (a || 0) - (b || 0)),
      zeroGapItems: zeroGapItems.map((z) => ({
        sectionType: z.measurement.sectionType,
        itemIndex: z.measurement.itemIndex,
        gapType: z.gapType,
        parentGap: z.measurement.parentGap,
        actualHorizontalGap: z.measurement.actualHorizontalGap,
        actualVerticalGap: z.measurement.actualVerticalGap,
      })),
    },
    'H6'
  );
  // #endregion

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:performMeasurement',
    'Spacing analysis summary',
    {
      totalItems: measurements.length,
      uniquePaddingValues: Array.from(paddingValues).sort((a, b) => a - b),
      uniqueGapValues: Array.from(gapValues)
        .filter((v) => v !== null)
        .sort((a, b) => (a || 0) - (b || 0)),
      sectionsByType: Array.from(sectionGroups.entries()).map(([type, items]) => ({
        type,
        count: items.length,
        paddingTop: items.map((i) => i.paddingTop),
        paddingRight: items.map((i) => i.paddingRight),
        paddingBottom: items.map((i) => i.paddingBottom),
        paddingLeft: items.map((i) => i.paddingLeft),
        gaps: items.map((i) => i.gap).filter((g) => g !== null),
        parentGaps: items.map((i) => i.parentGap).filter((g) => g !== null),
      })),
    },
    'E'
  );
  // #endregion

  // Check for asymmetric padding
  const asymmetricItems = measurements.filter(
    (m) =>
      m.paddingTop !== m.paddingRight ||
      m.paddingRight !== m.paddingBottom ||
      m.paddingBottom !== m.paddingLeft
  );

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:performMeasurement',
    'Asymmetric padding detected',
    {
      count: asymmetricItems.length,
      items: asymmetricItems.map((m) => ({
        sectionType: m.sectionType,
        itemIndex: m.itemIndex,
        padding: {
          top: m.paddingTop,
          right: m.paddingRight,
          bottom: m.paddingBottom,
          left: m.paddingLeft,
        },
      })),
    },
    'F'
  );
  // #endregion

  // Check for inconsistent gaps
  const inconsistentGapsDetailed: {
    sectionType: string;
    itemIndex: number;
    gap: number | null;
    parentGap: number | null;
  }[] = [];

  sectionGroups.forEach((items, sectionType) => {
    const gaps = items.map((i) => i.gap).filter((g) => g !== null) as number[];
    const parentGaps = items.map((i) => i.parentGap).filter((g) => g !== null) as number[];

    if (gaps.length > 0) {
      const uniqueGaps = new Set(gaps);
      if (uniqueGaps.size > 1) {
        items.forEach((item) => {
          if (item.gap !== null) {
            inconsistentGapsDetailed.push({
              sectionType,
              itemIndex: item.itemIndex,
              gap: item.gap,
              parentGap: item.parentGap,
            });
          }
        });
      }
    }

    if (parentGaps.length > 0) {
      const uniqueParentGaps = new Set(parentGaps);
      if (uniqueParentGaps.size > 1) {
        items.forEach((item) => {
          if (item.parentGap !== null) {
            inconsistentGapsDetailed.push({
              sectionType,
              itemIndex: item.itemIndex,
              gap: item.gap,
              parentGap: item.parentGap,
            });
          }
        });
      }
    }
  });

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:performMeasurement',
    'Inconsistent gaps detected',
    {
      count: inconsistentGapsDetailed.length,
      items: inconsistentGapsDetailed,
    },
    'G'
  );
  // #endregion

  const summary = {
    totalItems: measurements.length,
    uniquePaddingValues: Array.from(paddingValues).sort((a, b) => a - b),
    uniqueGapValues: Array.from(gapValues)
      .filter((v) => v !== null)
      .sort((a, b) => (a || 0) - (b || 0)),
    uniqueActualHorizontalGaps: Array.from(actualHorizontalGaps)
      .filter((v) => v !== null)
      .sort((a, b) => (a || 0) - (b || 0)),
    uniqueActualVerticalGaps: Array.from(actualVerticalGaps)
      .filter((v) => v !== null)
      .sort((a, b) => (a || 0) - (b || 0)),
    zeroGapItemsCount: zeroGapItems.length,
    asymmetricPaddingCount: asymmetricItems.length,
    inconsistentGapsCount: inconsistentGapsDetailed.length,
    measurements,
    sectionGroups: Array.from(sectionGroups.entries()).map(([type, items]) => ({
      type,
      count: items.length,
      paddingValues: {
        top: [...new Set(items.map((i) => i.paddingTop))].sort((a, b) => a - b),
        right: [...new Set(items.map((i) => i.paddingRight))].sort((a, b) => a - b),
        bottom: [...new Set(items.map((i) => i.paddingBottom))].sort((a, b) => a - b),
        left: [...new Set(items.map((i) => i.paddingLeft))].sort((a, b) => a - b),
      },
      gaps: [...new Set(items.map((i) => i.gap).filter((g) => g !== null))].sort(
        (a, b) => (a || 0) - (b || 0)
      ),
      parentGaps: [...new Set(items.map((i) => i.parentGap).filter((g) => g !== null))].sort(
        (a, b) => (a || 0) - (b || 0)
      ),
      actualHorizontalGaps: [
        ...new Set(
          items.map((i) => i.actualHorizontalGap).filter((g) => g !== null && g !== undefined)
        ),
      ].sort((a, b) => (a || 0) - (b || 0)),
      actualVerticalGaps: [
        ...new Set(
          items.map((i) => i.actualVerticalGap).filter((g) => g !== null && g !== undefined)
        ),
      ].sort((a, b) => (a || 0) - (b || 0)),
    })),
    asymmetricItems: asymmetricItems.map((m) => ({
      sectionType: m.sectionType,
      itemIndex: m.itemIndex,
      padding: {
        top: m.paddingTop,
        right: m.paddingRight,
        bottom: m.paddingBottom,
        left: m.paddingLeft,
      },
    })),
    inconsistentGaps: inconsistentGapsDetailed,
    zeroGapItems: zeroGapItems.map((z) => ({
      sectionType: z.measurement.sectionType,
      itemIndex: z.measurement.itemIndex,
      gapType: z.gapType,
      parentGap: z.measurement.parentGap,
      actualHorizontalGap: z.measurement.actualHorizontalGap,
      actualVerticalGap: z.measurement.actualVerticalGap,
    })),
  };

  console.log('[Spacing Debug] Measurements complete:', summary);
  console.log('[Spacing Debug] Copy this data:', JSON.stringify(summary, null, 2));

  // #region agent log
  logMeasurement(
    'spacing-debug.util.ts:performMeasurement',
    'Final summary with all data',
    summary,
    'H'
  );
  // #endregion

  // Store complete summary in localStorage with compression and size limits
  try {
    const summaryString = JSON.stringify(summary);
    const summarySize = new Blob([summaryString]).size;
    const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit

    // If summary is too large, store only essential data
    if (summarySize > MAX_STORAGE_SIZE) {
      const compressedSummary = {
        totalItems: summary.totalItems,
        uniquePaddingValues: summary.uniquePaddingValues,
        uniqueGapValues: summary.uniqueGapValues,
        uniqueActualHorizontalGaps: summary.uniqueActualHorizontalGaps,
        uniqueActualVerticalGaps: summary.uniqueActualVerticalGaps,
        zeroGapItemsCount: summary.zeroGapItemsCount,
        asymmetricPaddingCount: summary.asymmetricPaddingCount,
        inconsistentGapsCount: summary.inconsistentGapsCount,
        // Store only first 10 measurements to reduce size
        measurements: summary.measurements.slice(0, 10),
        sectionGroups: summary.sectionGroups,
        asymmetricItems: summary.asymmetricItems.slice(0, 10),
        inconsistentGaps: summary.inconsistentGaps.slice(0, 10),
        zeroGapItems: summary.zeroGapItems.slice(0, 10),
      };
      localStorage.setItem('spacing-debug-summary', JSON.stringify(compressedSummary));
      console.warn('[Spacing Debug] Summary too large, stored compressed version');
    } else {
      localStorage.setItem('spacing-debug-summary', summaryString);
    }
  } catch (e) {
    // Handle quota exceeded - try to clear old data and retry with minimal data
    if ((e as any)?.name === 'QuotaExceededError') {
      try {
        // Clear old spacing debug data
        localStorage.removeItem('spacing-debug-summary');
        localStorage.removeItem('spacing-debug-logs');

        // Store only essential summary
        const minimalSummary = {
          totalItems: summary.totalItems,
          uniquePaddingValues: summary.uniquePaddingValues,
          uniqueGapValues: summary.uniqueGapValues,
          zeroGapItemsCount: summary.zeroGapItemsCount,
          asymmetricPaddingCount: summary.asymmetricPaddingCount,
          inconsistentGapsCount: summary.inconsistentGapsCount,
        };
        localStorage.setItem('spacing-debug-summary', JSON.stringify(minimalSummary));
        console.warn('[Spacing Debug] localStorage quota exceeded, stored minimal summary');
      } catch (retryError) {
        console.warn(
          '[Spacing Debug] Could not store in localStorage even after cleanup:',
          retryError
        );
      }
    } else {
      console.warn('[Spacing Debug] Could not store in localStorage:', e);
    }
  }

  // Also log a simplified version for quick analysis
  console.group('[Spacing Debug] Quick Analysis');
  console.log('Total items:', summary.totalItems);
  console.log('Unique padding values:', summary.uniquePaddingValues);
  console.log('Unique gap values (CSS):', summary.uniqueGapValues);
  console.log('Actual horizontal gaps (measured):', summary.uniqueActualHorizontalGaps);
  console.log('Actual vertical gaps (measured):', summary.uniqueActualVerticalGaps);
  console.log('⚠️ Zero gap items:', summary.zeroGapItemsCount);
  console.log('Asymmetric padding items:', summary.asymmetricPaddingCount);
  console.log('Inconsistent gaps:', summary.inconsistentGapsCount);

  if (summary.zeroGapItems.length > 0) {
    console.log('\n🚨 ZERO GAP ITEMS DETECTED:');
    summary.zeroGapItems.forEach((item) => {
      console.log(
        `  ${item.sectionType}[${item.itemIndex}]: ${item.gapType} gap = 0px (parent gap: ${item.parentGap}px)`
      );
    });
  }

  console.log('\nBy Section Type:');
  summary.sectionGroups.forEach((group) => {
    console.log(`\n${group.type} (${group.count} items):`);
    console.log('  Padding Top:', group.paddingValues.top);
    console.log('  Padding Right:', group.paddingValues.right);
    console.log('  Padding Bottom:', group.paddingValues.bottom);
    console.log('  Padding Left:', group.paddingValues.left);
    console.log('  CSS Gaps:', group.gaps);
    console.log('  Parent CSS Gaps:', group.parentGaps);
    console.log(
      '  ⚠️ Actual Horizontal Gaps:',
      group.actualHorizontalGaps.length > 0 ? group.actualHorizontalGaps : 'N/A'
    );
    console.log(
      '  ⚠️ Actual Vertical Gaps:',
      group.actualVerticalGaps.length > 0 ? group.actualVerticalGaps : 'N/A'
    );
  });
  if (summary.asymmetricItems.length > 0) {
    console.log('\n⚠️ Asymmetric Padding Items:');
    summary.asymmetricItems.forEach((item) => {
      console.log(`  ${item.sectionType}[${item.itemIndex}]:`, item.padding);
    });
  }
  console.groupEnd();
  console.log('\n💡 To export full data, run: exportSpacingData()');
  console.log('💡 To measure again, run: measureAllSectionItems()');
}
