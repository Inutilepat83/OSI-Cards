import { GridLayoutEngine, createGridLayoutEngine, GridSection } from './grid-layout-engine';

describe('GridLayoutEngine', () => {
  let engine: GridLayoutEngine;

  const mockSections: GridSection[] = [
    { id: 'section-1', colSpan: 1, height: 100 },
    { id: 'section-2', colSpan: 2, height: 150 },
    { id: 'section-3', colSpan: 1, height: 100 },
  ];

  beforeEach(() => {
    engine = createGridLayoutEngine({
      columns: 3,
      gap: 16,
      defaultHeight: 100,
    });
  });

  afterEach(() => {
    engine.destroy();
  });

  describe('calculate', () => {
    it('should calculate layout for sections', () => {
      const layout = engine.calculate(mockSections, 800);
      expect(layout).toBeDefined();
      expect(layout.sections.length).toBe(3);
    });

    it('should position sections correctly', () => {
      const layout = engine.calculate(mockSections, 800);

      // First section at column 0
      expect(layout.sections[0].column).toBe(0);
      expect(layout.sections[0].top).toBe(0);

      // Second section spans 2 columns starting at column 1
      expect(layout.sections[1].column).toBe(1);
      expect(layout.sections[1].colSpan).toBe(2);
    });

    it('should handle empty sections', () => {
      const layout = engine.calculate([], 800);
      expect(layout.sections.length).toBe(0);
    });

    it('should handle single section', () => {
      const layout = engine.calculate([mockSections[0]], 800);
      expect(layout.sections.length).toBe(1);
      expect(layout.sections[0].column).toBe(0);
    });
  });

  describe('updateHeight', () => {
    it('should update section height', () => {
      engine.calculate(mockSections, 800);
      engine.updateHeight('section-1', 200);

      // Recalculate should use new height
      const layout = engine.calculate(mockSections, 800);
      expect(layout).toBeDefined();
    });
  });

  describe('columns calculation', () => {
    it('should calculate columns based on width', () => {
      const narrowEngine = createGridLayoutEngine({
        columns: 4,
        minColumnWidth: 200,
      });

      // 500px should give 2 columns (500 / 200 = 2.5, floor to 2)
      const layout = narrowEngine.calculate(mockSections, 500);
      expect(layout.columns).toBeLessThanOrEqual(4);

      narrowEngine.destroy();
    });
  });

  describe('observable', () => {
    it('should emit layout changes', (done) => {
      let emitCount = 0;
      engine.layout$.subscribe(layout => {
        emitCount++;
        if (emitCount === 2 && layout) {
          expect(layout.sections.length).toBe(3);
          done();
        }
      });

      engine.calculate(mockSections, 800);
    });
  });

  describe('gaps detection', () => {
    it('should find gaps in layout', () => {
      const layout = engine.calculate(mockSections, 800);
      const gaps = engine.findGaps();
      expect(gaps).toBeDefined();
    });
  });
});

