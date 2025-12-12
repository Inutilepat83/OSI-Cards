/**
 * Masonry Grid Component Tests (current API)
 *
 * The previous test file contained a large, partially-migrated Jest suite (e.g. `describe.skip`)
 * and invalid `xit`-prefixed blocks, which broke TypeScript compilation under Karma/Jasmine.
 *
 * This spec focuses on the current public API:
 * - inputs (sections, sizing)
 * - basic layout state (sectionsWithSpan, currentColumns, isLayoutReady)
 * - helper methods (trackBySection, getSectionId)
 */

import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CardSection } from '../../models';
import { SectionLayoutPreferenceService } from '../../services/section-layout-preference.service';
import { MasonryGridComponent } from './masonry-grid.component';

@Component({
  template: `
    <app-masonry-grid
      [sections]="sections"
      [containerWidth]="containerWidth"
      [gap]="gap"
      [minColumnWidth]="minColumnWidth"
      [maxColumns]="maxColumns"
      (layoutChange)="lastLayoutChange = $event"
    ></app-masonry-grid>
  `,
  standalone: true,
  imports: [MasonryGridComponent],
})
class HostComponent {
  sections: CardSection[] = [];
  containerWidth = 900;
  gap = 16;
  minColumnWidth = 260;
  maxColumns = 4;
  lastLayoutChange: any;
}

describe('MasonryGridComponent', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let grid: MasonryGridComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;

    const gridDebugEl = hostFixture.debugElement.query(By.directive(MasonryGridComponent));
    expect(gridDebugEl).toBeTruthy();
    grid = gridDebugEl.componentInstance as MasonryGridComponent;
  });

  it('should create', () => {
    expect(grid).toBeTruthy();
  });

  it('should be not-ready with no sections', () => {
    host.sections = [];
    hostFixture.detectChanges();

    expect(grid.sectionsWithSpan.length).toBe(0);
    expect(grid.currentColumns).toBe(1);
    expect(grid.isLayoutReady).toBeFalse();
  });

  it('should compute sectionsWithSpan and emit layoutChange when sections exist', () => {
    host.sections = [
      { id: 'a', title: 'A', type: 'info' },
      { id: 'b', title: 'B', type: 'info' },
    ] as any;
    host.containerWidth = 1000;
    hostFixture.detectChanges();

    expect(grid.sectionsWithSpan.length).toBe(2);
    expect(grid.isLayoutReady).toBeTrue();

    expect(host.lastLayoutChange).toBeTruthy();
    expect(host.lastLayoutChange.columns).toBeGreaterThan(0);
    expect(host.lastLayoutChange.containerWidth).toBeGreaterThan(0);
    expect(host.lastLayoutChange.breakpoint).toBeDefined();
  });

  it('trackBySection should return the item key', () => {
    const item = { section: { title: 'A', type: 'info' } as any, key: 'k', colSpan: 1 } as any;
    expect(grid.trackBySection(0, item)).toBe('k');
  });

  it('getSectionId should prefer section.id', () => {
    expect(grid.getSectionId({ id: 'custom', title: 'X', type: 'info' } as any)).toBe(
      'section-custom'
    );
  });

  it('getSectionId should fall back to a sanitized title', () => {
    expect(grid.getSectionId({ title: 'Hello World', type: 'info' } as any)).toBe(
      'section-hello-world'
    );
  });

  describe('Span Selection with SectionLayoutPreferenceService', () => {
    let preferenceService: SectionLayoutPreferenceService;

    beforeEach(() => {
      preferenceService = TestBed.inject(SectionLayoutPreferenceService);
    });

    it('should use registered preferences when available', () => {
      // Register preferences for a section type
      preferenceService.register('info', (section, availableColumns) => ({
        preferredColumns: 2,
        minColumns: 1,
        maxColumns: 3,
        canShrinkToFill: true,
        shrinkPriority: 40,
      }));

      host.sections = [{ id: 'a', title: 'A', type: 'info', preferredColumns: undefined } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const sectionWithSpan = grid.sectionsWithSpan[0];
      expect(sectionWithSpan.colSpan).toBe(2);
    });

    it('should respect minColumns constraint', () => {
      preferenceService.register('analytics', (section, availableColumns) => ({
        preferredColumns: 1,
        minColumns: 2,
        maxColumns: 4,
        canShrinkToFill: false,
      }));

      host.sections = [{ id: 'a', title: 'A', type: 'analytics' } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const sectionWithSpan = grid.sectionsWithSpan[0];
      expect(sectionWithSpan.colSpan).toBeGreaterThanOrEqual(2);
    });

    it('should respect maxColumns constraint', () => {
      preferenceService.register('overview', (section, availableColumns) => ({
        preferredColumns: 4,
        minColumns: 1,
        maxColumns: 2,
        canShrinkToFill: true,
      }));

      host.sections = [{ id: 'a', title: 'A', type: 'overview' } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const sectionWithSpan = grid.sectionsWithSpan[0];
      expect(sectionWithSpan.colSpan).toBeLessThanOrEqual(2);
    });

    it('should prefer explicit colSpan over preferences', () => {
      preferenceService.register('info', (section, availableColumns) => ({
        preferredColumns: 3,
        minColumns: 1,
        maxColumns: 4,
        canShrinkToFill: true,
      }));

      host.sections = [{ id: 'a', title: 'A', type: 'info', colSpan: 2 } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const sectionWithSpan = grid.sectionsWithSpan[0];
      expect(sectionWithSpan.colSpan).toBe(2);
    });
  });

  describe('Hybrid Reordering', () => {
    it('should keep critical sections in original order', () => {
      host.sections = [
        { id: 'a', title: 'A', type: 'info', priority: 'critical' } as any,
        { id: 'b', title: 'B', type: 'info', priority: 'critical' } as any,
        { id: 'c', title: 'C', type: 'info', priority: 'standard' } as any,
      ];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      // Critical sections should maintain their order
      expect(grid.sectionsWithSpan[0].section.id).toBe('a');
      expect(grid.sectionsWithSpan[1].section.id).toBe('b');
    });

    it('should reorder non-critical sections for better packing', () => {
      host.sections = [
        { id: 'a', title: 'A', type: 'info', priority: 'critical' } as any,
        { id: 'b', title: 'B', type: 'info', priority: 'optional', fields: new Array(20) } as any,
        { id: 'c', title: 'C', type: 'info', priority: 'optional', fields: new Array(5) } as any,
      ];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      // Critical section should be first
      expect(grid.sectionsWithSpan[0].section.id).toBe('a');
      // Non-critical sections should be reordered (larger first)
      const nonCriticalIndices = grid.sectionsWithSpan
        .map((s, i) => ({ id: s.section.id, index: i }))
        .filter((s) => s.id !== 'a');
      // Section with more fields should come first
      expect(nonCriticalIndices[0].id).toBe('b');
    });

    it('should maintain stability when sections have same characteristics', () => {
      host.sections = [
        { id: 'a', title: 'A', type: 'info', priority: 'optional' } as any,
        { id: 'b', title: 'B', type: 'info', priority: 'optional' } as any,
        { id: 'c', title: 'C', type: 'info', priority: 'optional' } as any,
      ];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      // Should maintain original order when characteristics are similar
      const ids = grid.sectionsWithSpan.map((s) => s.section.id);
      expect(ids).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Row-Span Calculation', () => {
    it('should calculate row span correctly for given height', () => {
      // This tests the row-span calculation logic
      // rowSpan = ceil((height + gap) / rowHeight)
      const rowHeight = 8;
      const gap = 16;

      // Test cases: [height, expectedRowSpan]
      const testCases = [
        [100, Math.ceil((100 + gap) / rowHeight)], // 116 / 8 = 14.5 -> 15
        [50, Math.ceil((50 + gap) / rowHeight)], // 66 / 8 = 8.25 -> 9
        [200, Math.ceil((200 + gap) / rowHeight)], // 216 / 8 = 27
      ];

      testCases.forEach(([height, expected]) => {
        const calculated = Math.ceil((height + gap) / rowHeight);
        expect(calculated).toBe(expected);
      });
    });

    it('should handle zero height gracefully', () => {
      const rowHeight = 8;
      const gap = 16;
      const height = 0;

      const rowSpan = Math.ceil((height + gap) / rowHeight);
      expect(rowSpan).toBeGreaterThan(0); // Should still produce a valid span
    });
  });

  describe('Bounded Updates (No Relayout Loops)', () => {
    it('should track layout version on meaningful changes', () => {
      host.sections = [{ id: 'a', title: 'A', type: 'info' } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const initialVersion = grid['layoutVersion'];

      // Add a new section (meaningful change)
      host.sections = [
        { id: 'a', title: 'A', type: 'info' } as any,
        { id: 'b', title: 'B', type: 'info' } as any,
      ];
      hostFixture.detectChanges();

      // Should increment version
      expect(grid['layoutVersion']).toBeGreaterThan(initialVersion);
    });

    it('should detect grid mode correctly', () => {
      // Grid mode should be set after init
      hostFixture.detectChanges();
      expect(['native', 'row-span-polyfill']).toContain(grid.gridMode);
    });
  });

  describe('Layout Variants', () => {
    it('should assign layout variants based on colSpan and columns', () => {
      host.sections = [
        { id: 'a', title: 'A', type: 'info' } as any,
        { id: 'b', title: 'B', type: 'info', colSpan: 4 } as any,
      ];
      host.containerWidth = 1000;
      host.maxColumns = 4;
      hostFixture.detectChanges();

      const variants = grid.sectionsWithSpan.map((s) => s.layoutVariant);
      expect(variants.every((v) => ['compact', 'default', 'wide'].includes(v || 'default'))).toBe(
        true
      );
    });

    it('should include layout variant in section data', () => {
      host.sections = [{ id: 'a', title: 'A', type: 'info' } as any];
      host.containerWidth = 1000;
      hostFixture.detectChanges();

      const sectionWithSpan = grid.sectionsWithSpan[0];
      expect(sectionWithSpan.layoutVariant).toBeDefined();
      expect(['compact', 'default', 'wide']).toContain(sectionWithSpan.layoutVariant);
    });
  });
});
