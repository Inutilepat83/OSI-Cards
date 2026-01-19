/**
 * Streaming Worker
 *
 * Web Worker for off-thread JSON parsing and card processing.
 * Keeps the main thread responsive during heavy streaming operations.
 *
 * @since 2.0.0
 */

// Worker message types
export type WorkerMessageType =
  | 'PARSE_JSON'
  | 'PARSE_CHUNK'
  | 'DIFF_CARDS'
  | 'VALIDATE_CARD'
  | 'EXTRACT_SECTIONS';

export interface WorkerMessage<T = unknown> {
  id: string;
  type: WorkerMessageType;
  payload: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: WorkerMessageType;
  success: boolean;
  result?: T;
  error?: string;
  duration: number;
}

// Payload types
export interface ParseJsonPayload {
  json: string;
}

export interface ParseChunkPayload {
  chunk: string;
  buffer: string;
}

export interface DiffCardsPayload {
  oldCard: unknown;
  newCard: unknown;
}

export interface ValidateCardPayload {
  card: unknown;
}

export interface ExtractSectionsPayload {
  buffer: string;
}

// Result types
export interface ParseJsonResult {
  card: unknown | null;
  isValid: boolean;
}

export interface ParseChunkResult {
  buffer: string;
  partialCard: unknown | null;
  completeSections: number;
  newlyCompletedIndices: number[];
}

export interface DiffCardsResult {
  hasChanges: boolean;
  changeType: 'structural' | 'content' | 'none';
  changedSections: number[];
  changedFields: { sectionIndex: number; fieldIndex: number }[];
}

export interface ValidateCardResult {
  isValid: boolean;
  errors: string[];
}

export interface ExtractSectionsResult {
  sections: unknown[];
  cardTitle: string;
  isComplete: boolean;
}

/**
 * Worker context (available in Worker scope)
 * DedicatedWorkerGlobalScope is available in lib.webworker.d.ts
 */
declare const self: typeof globalThis & {
  postMessage(message: any, transfer?: Transferable[]): void;
  onmessage: ((this: any, ev: MessageEvent) => any) | null;
};

// ============================================
// Worker Implementation
// ============================================

/**
 * Handle incoming messages
 */
function handleMessage(event: MessageEvent<WorkerMessage>): void {
  const { id, type, payload } = event.data;
  const startTime = performance.now();

  try {
    let result: unknown;

    switch (type) {
      case 'PARSE_JSON':
        result = parseJson(payload as ParseJsonPayload);
        break;

      case 'PARSE_CHUNK':
        result = parseChunk(payload as ParseChunkPayload);
        break;

      case 'DIFF_CARDS':
        result = diffCards(payload as DiffCardsPayload);
        break;

      case 'VALIDATE_CARD':
        result = validateCard(payload as ValidateCardPayload);
        break;

      case 'EXTRACT_SECTIONS':
        result = extractSections(payload as ExtractSectionsPayload);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    const duration = performance.now() - startTime;

    self.postMessage({
      id,
      type,
      success: true,
      result,
      duration,
    } as WorkerResponse);
  } catch (error) {
    const duration = performance.now() - startTime;

    self.postMessage({
      id,
      type,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    } as WorkerResponse);
  }
}

/**
 * Parse JSON string to card
 */
function parseJson(payload: ParseJsonPayload): ParseJsonResult {
  try {
    const card = JSON.parse(payload.json);
    return {
      card,
      isValid: isValidCard(card),
    };
  } catch {
    return {
      card: null,
      isValid: false,
    };
  }
}

/**
 * Parse a chunk and update buffer
 */
function parseChunk(payload: ParseChunkPayload): ParseChunkResult {
  const buffer = payload.buffer + payload.chunk;

  // Try to parse complete JSON
  try {
    const card = JSON.parse(buffer);
    const sections = Array.isArray(card.sections) ? card.sections : [];

    return {
      buffer,
      partialCard: card,
      completeSections: sections.length,
      newlyCompletedIndices: sections.map((_: unknown, i: number) => i),
    };
  } catch {
    // JSON incomplete, extract what we can
  }

  // Extract partial data
  const extracted = extractSections({ buffer });

  return {
    buffer,
    partialCard: {
      cardTitle: extracted.cardTitle || 'Generating...',
      sections: extracted.sections,
    },
    completeSections: extracted.sections.length,
    newlyCompletedIndices: [], // Would need tracking state
  };
}

/**
 * Diff two cards and find changes
 */
function diffCards(payload: DiffCardsPayload): DiffCardsResult {
  const { oldCard, newCard } = payload;

  if (!oldCard || !newCard) {
    return {
      hasChanges: true,
      changeType: 'structural',
      changedSections: [],
      changedFields: [],
    };
  }

  const oldSections = getCardSections(oldCard);
  const newSections = getCardSections(newCard);

  // Check for structural changes (section count changed)
  if (oldSections.length !== newSections.length) {
    return {
      hasChanges: true,
      changeType: 'structural',
      changedSections: newSections.map((_, i) => i),
      changedFields: [],
    };
  }

  // Check for content changes
  const changedSections: number[] = [];
  const changedFields: { sectionIndex: number; fieldIndex: number }[] = [];

  for (let i = 0; i < newSections.length; i++) {
    const oldSection = oldSections[i] || {};
    const newSection = newSections[i] || {};

    // Check section-level changes
    if (
      getSectionTitle(oldSection) !== getSectionTitle(newSection) ||
      getSectionType(oldSection) !== getSectionType(newSection)
    ) {
      changedSections.push(i);
      continue;
    }

    // Check field changes
    const oldFields = getSectionFields(oldSection);
    const newFields = getSectionFields(newSection);

    for (let j = 0; j < Math.max(oldFields.length, newFields.length); j++) {
      const oldField = oldFields[j];
      const newField = newFields[j];

      if (!fieldEquals(oldField, newField)) {
        changedFields.push({ sectionIndex: i, fieldIndex: j });
      }
    }

    // Check item changes
    const oldItems = getSectionItems(oldSection);
    const newItems = getSectionItems(newSection);

    if (oldItems.length !== newItems.length) {
      changedSections.push(i);
    }
  }

  const hasChanges = changedSections.length > 0 || changedFields.length > 0;

  return {
    hasChanges,
    changeType: changedSections.length > 0 ? 'structural' : hasChanges ? 'content' : 'none',
    changedSections,
    changedFields,
  };
}

/**
 * Validate card structure
 */
function validateCard(payload: ValidateCardPayload): ValidateCardResult {
  const { card } = payload;
  const errors: string[] = [];

  if (!card || typeof card !== 'object') {
    errors.push('Card must be an object');
    return { isValid: false, errors };
  }

  const cardObj = card as Record<string, unknown>;

  // Check required fields
  if (typeof cardObj.cardTitle !== 'string') {
    errors.push('cardTitle must be a string');
  }

  if (!Array.isArray(cardObj.sections)) {
    errors.push('sections must be an array');
  } else {
    // Validate each section
    (cardObj.sections as unknown[]).forEach((section, i) => {
      if (!section || typeof section !== 'object') {
        errors.push(`Section ${i} must be an object`);
        return;
      }

      const sectionObj = section as Record<string, unknown>;

      if (typeof sectionObj.title !== 'string' && typeof sectionObj.title !== 'undefined') {
        errors.push(`Section ${i} title must be a string`);
      }

      if (sectionObj.fields && !Array.isArray(sectionObj.fields)) {
        errors.push(`Section ${i} fields must be an array`);
      }

      if (sectionObj.items && !Array.isArray(sectionObj.items)) {
        errors.push(`Section ${i} items must be an array`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Extract sections from buffer using balanced braces
 */
function extractSections(payload: ExtractSectionsPayload): ExtractSectionsResult {
  const { buffer } = payload;
  const sections: unknown[] = [];
  let cardTitle = '';
  let isComplete = false;

  // Extract card title
  const titleMatch = buffer.match(/"cardTitle"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (titleMatch && titleMatch[1]) {
    cardTitle = titleMatch[1];
  }

  // Find sections array
  const sectionsMatch = buffer.match(/"sections"\s*:\s*\[/);
  if (!sectionsMatch || sectionsMatch.index === undefined) {
    return { sections, cardTitle, isComplete: false };
  }

  const sectionsStart = sectionsMatch.index + sectionsMatch[0].length;
  const sectionsContent = buffer.slice(sectionsStart);

  // Parse sections
  let i = 0;
  while (i < sectionsContent.length) {
    // Skip whitespace and commas
    while (i < sectionsContent.length && /[\s,]/.test(sectionsContent[i] || '')) {
      i++;
    }

    if (i >= sectionsContent.length) {
      break;
    }

    if (sectionsContent[i] === ']') {
      isComplete = true;
      break;
    }

    if (sectionsContent[i] === '{') {
      const result = extractObject(sectionsContent, i);
      if (result.endIndex !== -1 && result.json) {
        try {
          const section = JSON.parse(result.json);
          sections.push(section);
          i = result.endIndex + 1;
        } catch {
          i++;
        }
      } else {
        break;
      }
    } else {
      i++;
    }
  }

  return { sections, cardTitle, isComplete };
}

// ============================================
// Helper Functions
// ============================================

function extractObject(str: string, start: number): { endIndex: number; json: string | null } {
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let j = start; j < str.length; j++) {
    const char = str[j];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\' && inString) {
      escape = true;
      continue;
    }

    if (char === '"' && !escape) {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return {
          endIndex: j,
          json: str.slice(start, j + 1),
        };
      }
    }
  }

  return { endIndex: -1, json: null };
}

function isValidCard(card: unknown): boolean {
  if (!card || typeof card !== 'object') {
    return false;
  }
  const obj = card as Record<string, unknown>;
  return typeof obj.cardTitle === 'string' && Array.isArray(obj.sections);
}

function getCardSections(card: unknown): unknown[] {
  if (!card || typeof card !== 'object') {
    return [];
  }
  const sections = (card as Record<string, unknown>).sections;
  return Array.isArray(sections) ? sections : [];
}

function getSectionTitle(section: unknown): string {
  if (!section || typeof section !== 'object') {
    return '';
  }
  return String((section as Record<string, unknown>).title || '');
}

function getSectionType(section: unknown): string {
  if (!section || typeof section !== 'object') {
    return 'overview';
  }
  return String((section as Record<string, unknown>).type || 'overview');
}

function getSectionFields(section: unknown): unknown[] {
  if (!section || typeof section !== 'object') {
    return [];
  }
  const fields = (section as Record<string, unknown>).fields;
  return Array.isArray(fields) ? fields : [];
}

function getSectionItems(section: unknown): unknown[] {
  if (!section || typeof section !== 'object') {
    return [];
  }
  const items = (section as Record<string, unknown>).items;
  return Array.isArray(items) ? items : [];
}

function fieldEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  return aObj.label === bObj.label && aObj.value === bObj.value && aObj.type === bObj.type;
}

// ============================================
// Worker Entry Point
// ============================================

// Only add event listener if running as a Worker
if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  self.addEventListener('message', handleMessage);
}

// Export for testing and type checking
export { parseJson, parseChunk, diffCards, validateCard, extractSections };
