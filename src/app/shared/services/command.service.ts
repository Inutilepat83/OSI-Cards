import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import {
  CardEditCommand,
  Command,
  CommandMetadata,
  CommandType,
  GenericCommand,
  JsonChangeCommand,
} from '../models/command.model';
import { LoggingService } from '../../core/services/logging.service';

export interface CommandHistoryState {
  canUndo: boolean;
  canRedo: boolean;
  historySize: number;
  currentIndex: number;
  lastCommand: CommandMetadata | undefined;
}

/**
 * Command service for undo/redo functionality
 * Implements command pattern for managing command history
 */
@Injectable({
  providedIn: 'root',
})
export class CommandService {
  private readonly logger = inject(LoggingService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly MAX_HISTORY_SIZE = 50;

  private history: Command[] = [];
  private currentIndex = -1;
  private readonly stateSubject = new BehaviorSubject<CommandHistoryState>({
    canUndo: false,
    canRedo: false,
    historySize: 0,
    currentIndex: -1,
    lastCommand: undefined,
  });

  readonly state$: Observable<CommandHistoryState> = this.stateSubject.asObservable();

  constructor() {
    // Register keyboard shortcuts in constructor to ensure they're active immediately
    this.registerKeyboardShortcuts();
  }

  /**
   * Register undo/redo keyboard shortcuts (Ctrl+Z, Ctrl+Y / Cmd+Z, Cmd+Y)
   */
  private registerKeyboardShortcuts(): void {
    // Undo: Ctrl+Z (Windows/Linux) or Cmd+Z (Mac)
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        // Check for Ctrl+Z or Cmd+Z (undo)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          this.undo();
        }
        // Check for Ctrl+Y or Cmd+Shift+Z (redo)
        else if (
          (event.ctrlKey && event.key === 'y') ||
          (event.metaKey && event.shiftKey && event.key === 'z')
        ) {
          event.preventDefault();
          this.redo();
        }
      });
  }

  /**
   * Execute a command and add it to history
   */
  execute(command: Command): void {
    // Remove any commands after current index (when undoing and then executing new command)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Execute the command
    command.execute();

    // Add to history
    this.history.push(command);

    // Limit history size
    if (this.history.length > this.MAX_HISTORY_SIZE) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    this.updateState();
    this.logger.debug(`Command executed: ${command.getDescription()}`, 'CommandService');
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const command = this.history[this.currentIndex];
    if (!command) {
      return false;
    }
    command.undo();
    this.currentIndex--;
    this.updateState();
    this.logger.debug(`Command undone: ${command.getDescription()}`, 'CommandService');
    return true;
  }

  /**
   * Redo last undone command
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    if (!command) {
      return false;
    }
    command.execute();
    this.updateState();
    this.logger.debug(`Command redone: ${command.getDescription()}`, 'CommandService');
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Clear command history
   */
  clearHistory(): void {
    this.history = [];
    this.currentIndex = -1;
    this.updateState();
    this.logger.debug('Command history cleared', 'CommandService');
  }

  /**
   * Get current history state
   */
  getState(): CommandHistoryState {
    return this.stateSubject.value;
  }

  /**
   * Create a generic command
   */
  createGenericCommand(
    executeFn: () => void,
    undoFn: () => void,
    description: string,
    type: CommandType,
    metadata?: Partial<CommandMetadata>
  ): GenericCommand {
    const commandMetadata: CommandMetadata = {
      type,
      timestamp: Date.now(),
      description,
      ...metadata,
    };

    return new GenericCommand(executeFn, undoFn, description, commandMetadata);
  }

  /**
   * Create a card edit command
   */
  createCardEditCommand(
    cardId: string,
    oldCard: unknown,
    newCard: unknown,
    updateFn: (card: unknown) => void,
    description?: string
  ): CardEditCommand {
    const commandMetadata: CommandMetadata = {
      type: 'card-edit',
      timestamp: Date.now(),
      description: description || `Edit card: ${cardId}`,
      cardId,
    };

    return new CardEditCommand(cardId, oldCard, newCard, updateFn, commandMetadata);
  }

  /**
   * Create a JSON change command
   */
  createJsonChangeCommand(
    oldJson: string,
    newJson: string,
    updateFn: (json: string) => void,
    description?: string
  ): JsonChangeCommand {
    const commandMetadata: CommandMetadata = {
      type: 'json-change',
      timestamp: Date.now(),
      description: description || 'JSON change',
    };

    return new JsonChangeCommand(oldJson, newJson, updateFn, commandMetadata);
  }

  /**
   * Update state subject
   */
  private updateState(): void {
    const state: CommandHistoryState = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      historySize: this.history.length,
      currentIndex: this.currentIndex,
      lastCommand: (() => {
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
          return this.history[this.currentIndex]?.metadata;
        }
        return undefined;
      })(),
    };

    this.stateSubject.next(state);
  }
}
