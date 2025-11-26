import { TestBed } from '@angular/core/testing';
import { CommandService } from './command.service';
import { LoggingService } from '../../core/services/logging.service';
import { KeyboardShortcutsService } from './keyboard-shortcuts.service';
import { Command, GenericCommand } from '../models/command.model';

describe('CommandService', () => {
  let service: CommandService;
  let loggingService: jasmine.SpyObj<LoggingService>;
  let keyboardShortcutsService: jasmine.SpyObj<KeyboardShortcutsService>;

  beforeEach(() => {
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['debug', 'info', 'warn', 'error']);
    const keyboardSpy = jasmine.createSpyObj('KeyboardShortcutsService', ['register']);

    TestBed.configureTestingModule({
      providers: [
        CommandService,
        { provide: LoggingService, useValue: loggingSpy },
        { provide: KeyboardShortcutsService, useValue: keyboardSpy }
      ]
    });

    service = TestBed.inject(CommandService);
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    keyboardShortcutsService = TestBed.inject(KeyboardShortcutsService) as jasmine.SpyObj<KeyboardShortcutsService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty history initially', (done) => {
      service.state$.subscribe(state => {
        expect(state.canUndo).toBe(false);
        expect(state.canRedo).toBe(false);
        expect(state.historySize).toBe(0);
        expect(state.currentIndex).toBe(-1);
        done();
      });
    });

    it('should return false for canUndo initially', () => {
      expect(service.canUndo()).toBe(false);
    });

    it('should return false for canRedo initially', () => {
      expect(service.canRedo()).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute a command and add to history', () => {
      let executed = false;
      const command = new GenericCommand(
        () => { executed = true; },
        () => {},
        'Test command'
      );

      service.execute(command);

      expect(executed).toBe(true);
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(false);
    });

    it('should update state after execution', (done) => {
      const command = new GenericCommand(
        () => {},
        () => {},
        'Test command'
      );

      service.state$.subscribe(state => {
        if (state.historySize > 0) {
          expect(state.canUndo).toBe(true);
          expect(state.historySize).toBe(1);
          expect(state.currentIndex).toBe(0);
          done();
        }
      });

      service.execute(command);
    });

    it('should limit history size to MAX_HISTORY_SIZE', () => {
      for (let i = 0; i < 60; i++) {
        const command = new GenericCommand(
          () => {},
          () => {},
          `Command ${i}`
        );
        service.execute(command);
      }

      const state = service.getState();
      expect(state.historySize).toBeLessThanOrEqual(50);
    });

    it('should remove future commands when executing after undo', () => {
      const command1 = new GenericCommand(() => {}, () => {}, 'Command 1');
      const command2 = new GenericCommand(() => {}, () => {}, 'Command 2');
      const command3 = new GenericCommand(() => {}, () => {}, 'Command 3');

      service.execute(command1);
      service.execute(command2);
      service.execute(command3);
      expect(service.getState().historySize).toBe(3);

      service.undo();
      expect(service.getState().historySize).toBe(3);
      expect(service.canRedo()).toBe(true);

      const newCommand = new GenericCommand(() => {}, () => {}, 'New Command');
      service.execute(newCommand);
      
      const state = service.getState();
      expect(state.historySize).toBe(3); // Should have removed command3
      expect(state.canRedo()).toBe(false);
    });
  });

  describe('undo', () => {
    it('should undo last command', () => {
      let undone = false;
      const command = new GenericCommand(
        () => {},
        () => { undone = true; },
        'Test command'
      );

      service.execute(command);
      const result = service.undo();

      expect(result).toBe(true);
      expect(undone).toBe(true);
      expect(service.canUndo()).toBe(false);
      expect(service.canRedo()).toBe(true);
    });

    it('should return false when nothing to undo', () => {
      const result = service.undo();
      expect(result).toBe(false);
    });

    it('should update state after undo', (done) => {
      const command = new GenericCommand(() => {}, () => {}, 'Test');
      service.execute(command);

      service.state$.subscribe(state => {
        if (state.currentIndex === -1 && state.canRedo) {
          expect(state.canUndo).toBe(false);
          expect(state.canRedo).toBe(true);
          done();
        }
      });

      service.undo();
    });

    it('should undo multiple commands in order', () => {
      const undoOrder: number[] = [];
      const command1 = new GenericCommand(() => {}, () => { undoOrder.push(1); }, 'Command 1');
      const command2 = new GenericCommand(() => {}, () => { undoOrder.push(2); }, 'Command 2');

      service.execute(command1);
      service.execute(command2);

      service.undo();
      expect(undoOrder).toEqual([2]);

      service.undo();
      expect(undoOrder).toEqual([2, 1]);
    });
  });

  describe('redo', () => {
    it('should redo last undone command', () => {
      let redone = false;
      const command = new GenericCommand(
        () => { redone = true; },
        () => {},
        'Test command'
      );

      service.execute(command);
      service.undo();
      const result = service.redo();

      expect(result).toBe(true);
      expect(redone).toBe(true);
      expect(service.canUndo()).toBe(true);
      expect(service.canRedo()).toBe(false);
    });

    it('should return false when nothing to redo', () => {
      const result = service.redo();
      expect(result).toBe(false);
    });

    it('should update state after redo', (done) => {
      const command = new GenericCommand(() => {}, () => {}, 'Test');
      service.execute(command);
      service.undo();

      service.state$.subscribe(state => {
        if (state.currentIndex === 0 && !state.canRedo) {
          expect(state.canUndo).toBe(true);
          expect(state.canRedo).toBe(false);
          done();
        }
      });

      service.redo();
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', () => {
      const command1 = new GenericCommand(() => {}, () => {}, 'Command 1');
      const command2 = new GenericCommand(() => {}, () => {}, 'Command 2');

      service.execute(command1);
      service.execute(command2);
      expect(service.getState().historySize).toBe(2);

      service.clearHistory();

      const state = service.getState();
      expect(state.historySize).toBe(0);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
      expect(state.currentIndex).toBe(-1);
    });
  });

  describe('factory methods', () => {
    it('should create generic command', () => {
      let executed = false;
      const command = service.createGenericCommand(
        () => { executed = true; },
        () => {},
        'Test',
        'field-change'
      );

      service.execute(command);
      expect(executed).toBe(true);
    });

    it('should create card edit command', () => {
      const oldCard = { cardTitle: 'Old', sections: [] };
      const newCard = { cardTitle: 'New', sections: [] };
      
      const command = service.createCardEditCommand(
        'card-1',
        oldCard,
        newCard,
        () => {}
      );

      expect(command.getDescription()).toContain('Edit card');
      service.execute(command);
      expect(service.canUndo()).toBe(true);
    });

    it('should create JSON change command', () => {
      const command = service.createJsonChangeCommand(
        'old json',
        'new json',
        () => {}
      );

      expect(command.getDescription()).toContain('JSON change');
      service.execute(command);
      expect(service.canUndo()).toBe(true);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = service.getState();
      expect(state).toBeDefined();
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
      expect(state.historySize).toBe(0);
    });

    it('should return updated state after command', () => {
      const command = new GenericCommand(() => {}, () => {}, 'Test');
      service.execute(command);

      const state = service.getState();
      expect(state.historySize).toBe(1);
      expect(state.canUndo).toBe(true);
    });
  });
});

