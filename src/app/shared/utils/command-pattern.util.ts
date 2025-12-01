/**
 * Command pattern utilities
 * Enables undo/redo functionality through command pattern
 */

export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  description?: string;
}

export interface CommandHistory {
  commands: Command[];
  currentIndex: number;
  maxHistory: number;
}

/**
 * Command manager for undo/redo functionality
 */
export class CommandManager {
  private history: CommandHistory = {
    commands: [],
    currentIndex: -1,
    maxHistory: 50,
  };

  /**
   * Execute a command
   */
  execute(command: Command): void {
    // Remove any commands after current index (when undoing and then executing new command)
    if (this.history.currentIndex < this.history.commands.length - 1) {
      this.history.commands = this.history.commands.slice(0, this.history.currentIndex + 1);
    }

    // Execute command
    command.execute();

    // Add to history
    this.history.commands.push(command);
    this.history.currentIndex++;

    // Limit history size
    if (this.history.commands.length > this.history.maxHistory) {
      this.history.commands.shift();
      this.history.currentIndex--;
    }
  }

  /**
   * Undo last command
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    const command = this.history.commands[this.history.currentIndex];
    if (!command) {
      return false;
    }
    command.undo();
    this.history.currentIndex--;
    return true;
  }

  /**
   * Redo last undone command
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    this.history.currentIndex++;
    const command = this.history.commands[this.history.currentIndex];
    if (!command) {
      return false;
    }
    command.redo();
    return true;
  }

  /**
   * Check if undo is possible
   */
  canUndo(): boolean {
    return this.history.currentIndex >= 0;
  }

  /**
   * Check if redo is possible
   */
  canRedo(): boolean {
    return this.history.currentIndex < this.history.commands.length - 1;
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = {
      commands: [],
      currentIndex: -1,
      maxHistory: this.history.maxHistory,
    };
  }

  /**
   * Get history
   */
  getHistory(): Command[] {
    return [...this.history.commands];
  }

  /**
   * Set max history size
   */
  setMaxHistory(size: number): void {
    this.history.maxHistory = size;
    if (this.history.commands.length > size) {
      this.history.commands = this.history.commands.slice(-size);
      this.history.currentIndex = this.history.commands.length - 1;
    }
  }
}

/**
 * Create a simple command
 */
export function createCommand(
  execute: () => void,
  undo: () => void,
  description?: string
): Command {
  return {
    execute,
    undo,
    redo: execute,
    ...(description !== undefined && { description }),
  };
}
