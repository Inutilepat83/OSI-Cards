/**
 * Unit Tests for LayoutStateManager
 */

import { PositionedSection } from './layout-calculation.service';
import { LayoutStateManager, Position } from './layout-state-manager.service';

describe('LayoutStateManager', () => {
  let manager: LayoutStateManager;

  beforeEach(() => {
    manager = new LayoutStateManager();
  });

  describe('initialization', () => {
    it('should initialize with idle state', () => {
      expect(manager.state).toBe('idle');
      expect(manager.isIdle()).toBe(true);
    });

    it('should have empty positions initially', () => {
      expect(manager.getSectionCount()).toBe(0);
      expect(manager.getAllPositions().size).toBe(0);
    });

    it('should have empty column heights initially', () => {
      expect(manager.getColumnHeights()).toEqual([]);
    });
  });

  describe('state management', () => {
    it('should set state correctly', () => {
      manager.setState('calculating');
      expect(manager.state).toBe('calculating');
      expect(manager.isCalculating()).toBe(true);
    });

    it('should emit state changes', (done) => {
      manager.state$.subscribe((state) => {
        if (state === 'ready') {
          expect(state).toBe('ready');
          done();
        }
      });

      manager.setState('ready');
    });

    it('should track state transitions', (done) => {
      manager.stateChanges$.subscribe((event) => {
        if (event && event.to === 'ready') {
          expect(event.from).toBe('idle');
          expect(event.to).toBe('ready');
          expect(event.timestamp).toBeGreaterThan(0);
          done();
        }
      });

      manager.setState('ready');
    });

    it('should not emit if state does not change', () => {
      let emitCount = 0;
      manager.state$.subscribe(() => emitCount++);

      manager.setState('idle'); // Same as initial
      manager.setState('idle'); // Same again

      expect(emitCount).toBe(1); // Only initial emission
    });
  });

  describe('position management', () => {
    const createMockPositionedSection = (key: string, top: number): PositionedSection => ({
      section: { type: 'info', title: 'Test' },
      key,
      colSpan: 1,
      preferredColumns: 1 as any,
      left: '0%',
      top,
      width: '100%',
    });

    it('should update positions', () => {
      const positions = [
        createMockPositionedSection('section-1', 0),
        createMockPositionedSection('section-2', 100),
      ];

      manager.updatePositions(positions);

      expect(manager.getSectionCount()).toBe(2);
      expect(manager.getPosition('section-1')).toBeTruthy();
      expect(manager.getPosition('section-2')).toBeTruthy();
    });

    it('should emit position changes', (done) => {
      const positions = [createMockPositionedSection('section-1', 0)];

      manager.positions$.subscribe((posMap) => {
        if (posMap.size > 0) {
          expect(posMap.size).toBe(1);
          expect(posMap.has('section-1')).toBe(true);
          done();
        }
      });

      manager.updatePositions(positions);
    });

    it('should update single position', () => {
      const position: Position = {
        left: '25%',
        top: 50,
        width: '50%',
        colSpan: 2,
      };

      manager.updatePosition('test-key', position);

      const retrieved = manager.getPosition('test-key');
      expect(retrieved).toEqual(position);
    });

    it('should remove position', () => {
      const positions = [createMockPositionedSection('section-1', 0)];
      manager.updatePositions(positions);

      manager.removePosition('section-1');

      expect(manager.getPosition('section-1')).toBeNull();
      expect(manager.getSectionCount()).toBe(0);
    });

    it('should clear all positions', () => {
      const positions = [
        createMockPositionedSection('section-1', 0),
        createMockPositionedSection('section-2', 100),
      ];
      manager.updatePositions(positions);

      manager.clearPositions();

      expect(manager.getSectionCount()).toBe(0);
      expect(manager.getAllPositions().size).toBe(0);
    });
  });

  describe('column heights', () => {
    it('should update column heights', () => {
      const heights = [100, 150, 120];

      manager.updateColumnHeights(heights);

      expect(manager.getColumnHeights()).toEqual(heights);
    });

    it('should emit column height changes', (done) => {
      const heights = [100, 150, 120];

      manager.columnHeights$.subscribe((h) => {
        if (h.length > 0) {
          expect(h).toEqual(heights);
          done();
        }
      });

      manager.updateColumnHeights(heights);
    });

    it('should calculate total height correctly', () => {
      manager.updateColumnHeights([100, 200, 150]);

      expect(manager.getTotalHeight()).toBe(200);
    });

    it('should return 0 for empty column heights', () => {
      expect(manager.getTotalHeight()).toBe(0);
    });
  });

  describe('metadata', () => {
    it('should update metadata', () => {
      manager.updateMetadata(3, 1200);

      expect(manager.getColumns()).toBe(3);
      expect(manager.getContainerWidth()).toBe(1200);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      // Set up some state
      manager.setState('ready');
      manager.updatePositions([
        {
          section: { type: 'info', title: 'Test' },
          key: 'test',
          colSpan: 1,
          preferredColumns: 1 as any,
          left: '0%',
          top: 0,
          width: '100%',
        },
      ]);
      manager.updateColumnHeights([100, 150]);
      manager.updateMetadata(2, 1200);

      // Reset
      manager.reset();

      // Verify reset
      expect(manager.state).toBe('idle');
      expect(manager.getSectionCount()).toBe(0);
      expect(manager.getColumnHeights()).toEqual([]);
      expect(manager.getColumns()).toBe(0);
      expect(manager.getContainerWidth()).toBe(0);
    });
  });

  describe('history', () => {
    it('should save snapshots when reaching ready state', () => {
      manager.setState('calculating');
      manager.setState('ready');

      const history = manager.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should limit history size', () => {
      manager.setMaxHistorySize(3);

      // Create more snapshots than max
      for (let i = 0; i < 5; i++) {
        manager.setState('calculating');
        manager.setState('ready');
      }

      const history = manager.getHistory();
      expect(history.length).toBeLessThanOrEqual(3);
    });

    it('should get previous snapshot', () => {
      manager.setState('ready');
      manager.setState('calculating');
      manager.setState('ready');

      const previous = manager.getPreviousSnapshot();
      expect(previous).toBeTruthy();
      expect(previous?.state).toBe('ready');
    });

    it('should restore from snapshot', () => {
      // Create initial state
      manager.updateMetadata(3, 1200);
      manager.updateColumnHeights([100, 150, 120]);
      manager.setState('ready');

      const snapshot = manager.getHistory()[0];

      // Change state
      manager.updateMetadata(2, 800);
      manager.setState('calculating');

      // Restore
      if (snapshot) {
        manager.restoreSnapshot(snapshot);

        expect(manager.getColumns()).toBe(3);
        expect(manager.getContainerWidth()).toBe(1200);
        expect(manager.state).toBe('ready');
      }
    });

    it('should clear history', () => {
      manager.setState('ready');
      manager.setState('calculating');
      manager.setState('ready');

      expect(manager.getHistory().length).toBeGreaterThan(0);

      manager.clearHistory();

      expect(manager.getHistory().length).toBe(0);
    });
  });

  describe('observables', () => {
    it('should provide isReady observable', (done) => {
      manager.isReady$.subscribe((ready) => {
        if (ready) {
          expect(ready).toBe(true);
          done();
        }
      });

      manager.setState('ready');
    });

    it('should provide hasError observable', (done) => {
      manager.hasError$.subscribe((hasError) => {
        if (hasError) {
          expect(hasError).toBe(true);
          done();
        }
      });

      manager.setState('error');
    });
  });

  describe('debug', () => {
    it('should provide debug info', () => {
      manager.updateMetadata(3, 1200);
      manager.updateColumnHeights([100, 150, 120]);
      manager.setState('ready');

      const debug = manager.getDebugInfo();

      expect(debug.state).toBe('ready');
      expect(debug.columns).toBe(3);
      expect(debug.totalHeight).toBe(150);
      expect(debug.containerWidth).toBe(1200);
    });

    it('should log state to console', () => {
      spyOn(console, 'group');
      spyOn(console, 'log');
      spyOn(console, 'groupEnd');

      manager.logState();

      expect(console.group).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
      expect(console.groupEnd).toHaveBeenCalled();
    });
  });

  describe('state queries', () => {
    it('should check if ready', () => {
      expect(manager.isReady()).toBe(false);
      manager.setState('ready');
      expect(manager.isReady()).toBe(true);
    });

    it('should check if calculating', () => {
      expect(manager.isCalculating()).toBe(false);
      manager.setState('calculating');
      expect(manager.isCalculating()).toBe(true);
    });

    it('should check if measuring', () => {
      expect(manager.isMeasuring()).toBe(false);
      manager.setState('measuring');
      expect(manager.isMeasuring()).toBe(true);
    });

    it('should check if idle', () => {
      expect(manager.isIdle()).toBe(true);
      manager.setState('calculating');
      expect(manager.isIdle()).toBe(false);
    });

    it('should check if has error', () => {
      expect(manager.hasError()).toBe(false);
      manager.setState('error');
      expect(manager.hasError()).toBe(true);
    });
  });
});
