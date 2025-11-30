import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, ViewChild } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MasonryGridComponent, MasonryLayoutInfo } from './masonry-grid.component';
import { CardSection } from '../../models/card.model';

// Host component for testing
@Component({
  template: `
    <div style="width: 1000px;">
      <app-masonry-grid
        #grid
        [sections]="sections"
        [gap]="gap"
        [minColumnWidth]="minColumnWidth"
        [maxColumns]="maxColumns"
        [containerWidth]="containerWidth"
        (sectionEvent)="onSectionEvent($event)"
        (layoutChange)="onLayoutChange($event)"
      ></app-masonry-grid>
    </div>
  `
})
class TestHostComponent {
  @ViewChild('grid') grid!: MasonryGridComponent;
  sections: CardSection[] = [];
  gap = 12;
  minColumnWidth = 260;
  maxColumns = 4;
  containerWidth?: number;
  
  lastSectionEvent: any;
  lastLayoutChange: MasonryLayoutInfo | undefined;
  
  onSectionEvent(event: any) {
    this.lastSectionEvent = event;
  }
  
  onLayoutChange(info: MasonryLayoutInfo) {
    this.lastLayoutChange = info;
  }
}

describe('MasonryGridComponent', () => {
  let hostComponent: TestHostComponent;
  let hostFixture: ComponentFixture<TestHostComponent>;
  let component: MasonryGridComponent;

  const createSections = (count: number): CardSection[] => {
    return Array.from({ length: count }, (_, i) => ({
      title: `Section ${i + 1}`,
      type: 'info' as const,
      preferredColumns: 1
    }));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasonryGridComponent],
      declarations: [TestHostComponent]
    }).compileComponents();

    hostFixture = TestBed.createComponent(TestHostComponent);
    hostComponent = hostFixture.componentInstance;
    hostFixture.detectChanges();
    component = hostComponent.grid;
  });

  // ============================================================================
  // Basic Component Tests
  // ============================================================================
  describe('basic functionality', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render empty container with no sections', () => {
      hostComponent.sections = [];
      hostFixture.detectChanges();
      
      const container = hostFixture.debugElement.query(By.css('.masonry-container'));
      expect(container).toBeTruthy();
    });

    it('should render sections', fakeAsync(() => {
      hostComponent.sections = createSections(3);
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const items = hostFixture.debugElement.queryAll(By.css('.masonry-item'));
      expect(items.length).toBe(3);
    }));

    it('should update when sections change', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      tick(100);
      
      hostComponent.sections = createSections(4);
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const items = hostFixture.debugElement.queryAll(By.css('.masonry-item'));
      expect(items.length).toBe(4);
    }));
  });

  // ============================================================================
  // Input Property Tests
  // ============================================================================
  describe('input properties', () => {
    it('should use default gap of 12', () => {
      expect(component.gap).toBe(12);
    });

    it('should use default minColumnWidth of 260', () => {
      expect(component.minColumnWidth).toBe(260);
    });

    it('should use default maxColumns of 4', () => {
      expect(component.maxColumns).toBe(4);
    });

    it('should accept custom gap', () => {
      hostComponent.gap = 24;
      hostFixture.detectChanges();
      
      expect(component.gap).toBe(24);
    });

    it('should accept custom minColumnWidth', () => {
      hostComponent.minColumnWidth = 200;
      hostFixture.detectChanges();
      
      expect(component.minColumnWidth).toBe(200);
    });

    it('should accept custom maxColumns', () => {
      hostComponent.maxColumns = 3;
      hostFixture.detectChanges();
      
      expect(component.maxColumns).toBe(3);
    });

    it('should accept containerWidth override', () => {
      hostComponent.containerWidth = 800;
      hostFixture.detectChanges();
      
      expect(component.containerWidth).toBe(800);
    });
  });

  // ============================================================================
  // Orientation Tests
  // ============================================================================
  describe('section orientation', () => {
    it('should return vertical for overview sections', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      
      expect(component.getOrientation(section)).toBe('vertical');
    });

    it('should return horizontal for contact-card sections', () => {
      const section: CardSection = {
        title: 'Contacts',
        type: 'contact-card'
      };
      
      expect(component.getOrientation(section)).toBe('horizontal');
    });

    it('should return horizontal for analytics sections', () => {
      const section: CardSection = {
        title: 'Analytics',
        type: 'analytics'
      };
      
      expect(component.getOrientation(section)).toBe('horizontal');
    });

    it('should return auto for chart sections', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      
      expect(component.getOrientation(section)).toBe('auto');
    });

    it('should use explicit orientation when set', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info',
        orientation: 'horizontal'
      };
      
      expect(component.getOrientation(section)).toBe('horizontal');
    });

    it('should return vertical for null section', () => {
      expect(component.getOrientation(null)).toBe('vertical');
      expect(component.getOrientation(undefined)).toBe('vertical');
    });

    it('should apply orientation class to DOM', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Test', type: 'contact-card' }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--horizontal'));
      expect(item).toBeTruthy();
    }));
  });

  // ============================================================================
  // Priority Tests
  // ============================================================================
  describe('section priority', () => {
    it('should apply priority-critical class', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Test', type: 'overview', priority: 'critical' }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--priority-critical'));
      expect(item).toBeTruthy();
    }));

    it('should apply priority-important class', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Test', type: 'chart', priority: 'important' }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--priority-important'));
      expect(item).toBeTruthy();
    }));

    it('should set data-priority attribute', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Test', type: 'info', priority: 'standard' }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item'));
      expect(item.nativeElement.getAttribute('data-priority')).toBe('standard');
    }));
  });

  // ============================================================================
  // Sticky Section Tests
  // ============================================================================
  describe('sticky sections', () => {
    it('should apply sticky class', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Sticky', type: 'overview', sticky: true }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--sticky'));
      expect(item).toBeTruthy();
    }));

    it('should not apply sticky class when false', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Normal', type: 'info', sticky: false }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--sticky'));
      expect(item).toBeFalsy();
    }));
  });

  // ============================================================================
  // Flex Grow Tests
  // ============================================================================
  describe('flex grow sections', () => {
    it('should apply flex-grow class', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Expanding', type: 'info', flexGrow: true }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--flex-grow'));
      expect(item).toBeTruthy();
    }));
  });

  // ============================================================================
  // Data Attributes Tests
  // ============================================================================
  describe('data attributes', () => {
    it('should set data-col-span attribute', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Wide', type: 'chart', preferredColumns: 2 }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item'));
      const colSpan = item.nativeElement.getAttribute('data-col-span');
      expect(colSpan).toBeTruthy();
    }));

    it('should set data-orientation attribute', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Test', type: 'contact-card' }
      ];
      hostFixture.detectChanges();
      tick(100);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item'));
      expect(item.nativeElement.getAttribute('data-orientation')).toBe('horizontal');
    }));
  });

  // ============================================================================
  // Section ID Tests
  // ============================================================================
  describe('getSectionId', () => {
    it('should generate ID from title', () => {
      const section: CardSection = {
        title: 'Test Section',
        type: 'info'
      };
      
      const id = component.getSectionId(section);
      
      expect(id).toBe('section-test-section');
    });

    it('should sanitize special characters', () => {
      const section: CardSection = {
        title: 'Test & Section #1',
        type: 'info'
      };
      
      const id = component.getSectionId(section);
      
      expect(id).toMatch(/^section-[a-z0-9-]+$/);
    });

    it('should use section id when available', () => {
      const section: CardSection = {
        id: 'custom-id',
        title: 'Test',
        type: 'info'
      };
      
      const id = component.getSectionId(section);
      
      expect(id).toBe('section-custom-id');
    });

    it('should handle null section', () => {
      expect(component.getSectionId(null)).toBe('section-unknown');
      expect(component.getSectionId(undefined)).toBe('section-unknown');
    });
  });

  // ============================================================================
  // Track By Function Tests
  // ============================================================================
  describe('trackItem', () => {
    it('should return key for valid item', () => {
      const item = {
        section: { title: 'Test', type: 'info' as const },
        key: 'test-key',
        colSpan: 1,
        left: '0px',
        top: 0,
        width: '100%'
      };
      
      const result = component.trackItem(0, item);
      
      expect(result).toBe('test-key');
    });

    it('should return fallback for null item', () => {
      const result = component.trackItem(5, null as any);
      
      expect(result).toBe('null-item-5');
    });
  });

  // ============================================================================
  // Layout Change Event Tests
  // ============================================================================
  describe('layout change events', () => {
    it('should emit layoutChange on initial layout', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostComponent.containerWidth = 1000;
      hostFixture.detectChanges();
      tick(200);
      
      expect(hostComponent.lastLayoutChange).toBeDefined();
      expect(hostComponent.lastLayoutChange?.columns).toBeGreaterThan(0);
    }));

    it('should include breakpoint in layout info', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostComponent.containerWidth = 1000;
      hostFixture.detectChanges();
      tick(200);
      
      expect(hostComponent.lastLayoutChange?.breakpoint).toBeDefined();
    }));

    it('should include containerWidth in layout info', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostComponent.containerWidth = 800;
      hostFixture.detectChanges();
      tick(200);
      
      expect(hostComponent.lastLayoutChange?.containerWidth).toBeGreaterThan(0);
    }));
  });

  // ============================================================================
  // Container Height Tests
  // ============================================================================
  describe('container height', () => {
    it('should set container height', fakeAsync(() => {
      hostComponent.sections = createSections(5);
      hostFixture.detectChanges();
      tick(200);
      hostFixture.detectChanges();
      
      expect(component.containerHeight).toBeGreaterThan(0);
    }));

    it('should update height when sections added', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      tick(200);
      const initialHeight = component.containerHeight;
      
      hostComponent.sections = createSections(6);
      hostFixture.detectChanges();
      tick(200);
      
      expect(component.containerHeight).toBeGreaterThanOrEqual(initialHeight);
    }));
  });

  // ============================================================================
  // Positioned Sections Tests
  // ============================================================================
  describe('positioned sections', () => {
    it('should position all sections', fakeAsync(() => {
      hostComponent.sections = createSections(4);
      hostFixture.detectChanges();
      tick(200);
      
      expect(component.positionedSections.length).toBe(4);
    }));

    it('should set position properties', fakeAsync(() => {
      hostComponent.sections = createSections(1);
      hostFixture.detectChanges();
      tick(200);
      
      const positioned = component.positionedSections[0];
      expect(positioned.left).toBeDefined();
      expect(positioned.top).toBeDefined();
      expect(positioned.width).toBeDefined();
      expect(positioned.colSpan).toBeDefined();
    }));

    it('should handle sections with different column spans', fakeAsync(() => {
      hostComponent.sections = [
        { title: 'Wide', type: 'chart', preferredColumns: 2 },
        { title: 'Narrow', type: 'info', preferredColumns: 1 }
      ];
      hostFixture.detectChanges();
      tick(200);
      
      const wideSection = component.positionedSections.find(p => p.section.title === 'Wide');
      const narrowSection = component.positionedSections.find(p => p.section.title === 'Narrow');
      
      expect(wideSection?.colSpan).toBeGreaterThan(narrowSection?.colSpan || 0);
    }));
  });

  // ============================================================================
  // Layout Ready State Tests
  // ============================================================================
  describe('layout ready state', () => {
    it('should set isLayoutReady after initial layout', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      tick(500);
      hostFixture.detectChanges();
      
      expect(component.isLayoutReady).toBe(true);
    }));

    it('should apply ready class to container', fakeAsync(() => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      tick(500);
      hostFixture.detectChanges();
      
      const item = hostFixture.debugElement.query(By.css('.masonry-item--ready'));
      expect(item).toBeTruthy();
    }));

    it('should apply loading class when not ready', () => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      
      // Before layout is ready
      expect(component.isLayoutReady).toBe(false);
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('cleanup', () => {
    it('should not throw on destroy', () => {
      hostComponent.sections = createSections(2);
      hostFixture.detectChanges();
      
      expect(() => {
        hostFixture.destroy();
      }).not.toThrow();
    });

    it('should handle empty sections on destroy', () => {
      hostComponent.sections = [];
      hostFixture.detectChanges();
      
      expect(() => {
        hostFixture.destroy();
      }).not.toThrow();
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================
  describe('edge cases', () => {
    it('should handle sections without title', fakeAsync(() => {
      hostComponent.sections = [
        { title: '', type: 'info' }
      ];
      hostFixture.detectChanges();
      tick(100);
      
      expect(component.positionedSections.length).toBe(1);
    }));

    it('should handle rapid section updates', fakeAsync(() => {
      for (let i = 1; i <= 5; i++) {
        hostComponent.sections = createSections(i);
        hostFixture.detectChanges();
        tick(50);
      }
      
      hostFixture.detectChanges();
      tick(200);
      
      expect(component.positionedSections.length).toBe(5);
    }));

    it('should handle very large section count', fakeAsync(() => {
      hostComponent.sections = createSections(50);
      hostFixture.detectChanges();
      tick(500);
      
      expect(component.positionedSections.length).toBe(50);
    }));

    it('should handle sections with all new properties', fakeAsync(() => {
      hostComponent.sections = [
        {
          title: 'Full Featured',
          type: 'overview',
          orientation: 'horizontal',
          priority: 'critical',
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: 3,
          flexGrow: true,
          sticky: false,
          groupId: 'test-group',
          columnAffinity: 0
        }
      ];
      hostFixture.detectChanges();
      tick(200);
      
      expect(component.positionedSections.length).toBe(1);
    }));
  });
});

