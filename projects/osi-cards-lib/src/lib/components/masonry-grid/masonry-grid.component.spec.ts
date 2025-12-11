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
});
