/**
 * Command pattern models for undo/redo functionality
 */

/**
 * Base command interface
 */
export interface Command {
  /**
   * Execute the command
   */
  execute(): void;

  /**
   * Undo the command
   */
  undo(): void;

  /**
   * Redo the command (same as execute)
   */
  redo(): void;

  /**
   * Get command description for UI
   */
  getDescription(): string;

  /**
   * Optional metadata for the command
   */
  readonly metadata?: CommandMetadata | undefined;
}

/**
 * Command types
 */
export type CommandType =
  | 'card-edit'
  | 'json-change'
  | 'section-add'
  | 'section-remove'
  | 'section-modify'
  | 'field-change'
  | 'item-change'
  | 'card-type-change'
  | 'card-variant-change';

/**
 * Command metadata
 */
export interface CommandMetadata {
  type: CommandType;
  timestamp: number;
  description: string;
  cardId?: string;
  sectionId?: string;
  fieldId?: string;
  itemId?: string;
}

/**
 * Generic command implementation
 */
export class GenericCommand implements Command {
  public readonly metadata: CommandMetadata | undefined;

  constructor(
    private executeFn: () => void,
    private undoFn: () => void,
    private description: string,
    metadata?: CommandMetadata
  ) {
    this.metadata = metadata;
  }

  execute(): void {
    this.executeFn();
  }

  undo(): void {
    this.undoFn();
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return this.description;
  }
}

/**
 * Card edit command
 */
export class CardEditCommand implements Command {
  public readonly metadata: CommandMetadata | undefined;

  constructor(
    private cardId: string,
    private oldCard: unknown,
    private newCard: unknown,
    private updateFn: (card: unknown) => void,
    metadata?: CommandMetadata
  ) {
    this.metadata = metadata;
  }

  execute(): void {
    this.updateFn(this.newCard);
  }

  undo(): void {
    this.updateFn(this.oldCard);
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return this.metadata?.description || `Edit card: ${this.cardId}`;
  }
}

/**
 * JSON change command
 */
export class JsonChangeCommand implements Command {
  public readonly metadata: CommandMetadata | undefined;

  constructor(
    private oldJson: string,
    private newJson: string,
    private updateFn: (json: string) => void,
    metadata?: CommandMetadata
  ) {
    this.metadata = metadata;
  }

  execute(): void {
    this.updateFn(this.newJson);
  }

  undo(): void {
    this.updateFn(this.oldJson);
  }

  redo(): void {
    this.execute();
  }

  getDescription(): string {
    return this.metadata?.description || 'JSON change';
  }
}
