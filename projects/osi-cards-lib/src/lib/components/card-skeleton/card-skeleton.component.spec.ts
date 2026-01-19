/**
 * Card Skeleton Component Tests
 *
 * Unit tests for CardSkeletonComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CardSkeletonComponent,
  SkeletonSection,
  SkeletonSectionType,
} from './card-skeleton.component';
import { By } from '@angular/platform-browser';

describe('CardSkeletonComponent', () => {
  let component: CardSkeletonComponent;
  let fixture: ComponentFixture<CardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardSkeletonComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render skeleton container', () => {
      fixture.detectChanges();
      const container = fixture.debugElement.query(By.css('.card-skeleton'));
      expect(container).toBeTruthy();
    });

    it('should have default values', () => {
      expect(component.cardTitle).toBe('');
      expect(component.sectionCount).toBe(0);
      expect(component.isFullscreen).toBe(false);
      expect(component.sections).toEqual([]);
      expect(component.animated).toBe(true);
    });
  });

  describe('Input Properties', () => {
    it('should accept cardTitle input', () => {
      component.cardTitle = 'Test Card';
      fixture.detectChanges();

      expect(component.cardTitle).toBe('Test Card');
    });

    it('should accept sectionCount input', () => {
      component.sectionCount = 3;
      fixture.detectChanges();

      expect(component.sectionCount).toBe(3);
    });

    it('should accept isFullscreen input', () => {
      component.isFullscreen = true;
      fixture.detectChanges();

      expect(component.isFullscreen).toBe(true);
    });

    it('should accept sections input', () => {
      const sections: SkeletonSection[] = [{ type: 'overview' }, { type: 'analytics' }];
      component.sections = sections;
      fixture.detectChanges();

      expect(component.sections).toEqual(sections);
    });

    it('should accept animated input', () => {
      component.animated = false;
      fixture.detectChanges();

      expect(component.animated).toBe(false);
    });
  });

  describe('effectiveSections Getter', () => {
    it('should return sections when provided', () => {
      const sections: SkeletonSection[] = [
        { type: 'overview', title: 'Overview' },
        { type: 'analytics' },
      ];
      component.sections = sections;

      expect(component.effectiveSections).toEqual(sections);
    });

    it('should generate generic sections when sections array is empty', () => {
      component.sections = [];
      component.sectionCount = 3;

      const effective = component.effectiveSections;
      expect(effective.length).toBe(3);
      expect(effective.every((s) => s.type === 'generic')).toBe(true);
    });

    it('should generate sections based on sectionCount when sections is empty', () => {
      component.sections = [];
      component.sectionCount = 5;

      const effective = component.effectiveSections;
      expect(effective.length).toBe(5);
    });

    it('should return empty array when both sections and sectionCount are empty', () => {
      component.sections = [];
      component.sectionCount = 0;

      expect(component.effectiveSections).toEqual([]);
    });
  });

  describe('getLayout Method', () => {
    it('should return layout for overview type', () => {
      const layout = component.getLayout('overview');
      expect(layout.headerLines).toBe(1);
      expect(layout.contentRows).toBe(6);
    });

    it('should return layout for analytics type', () => {
      const layout = component.getLayout('analytics');
      expect(layout.headerLines).toBe(1);
      expect(layout.contentRows).toBe(2);
      expect(layout.hasGrid).toBe(true);
      expect(layout.gridColumns).toBe(3);
      expect(layout.hasMetrics).toBe(true);
    });

    it('should return layout for chart type', () => {
      const layout = component.getLayout('chart');
      expect(layout.headerLines).toBe(1);
      expect(layout.contentRows).toBe(1);
      expect(layout.hasProgress).toBe(true);
    });

    it('should return layout for contact-card type', () => {
      const layout = component.getLayout('contact-card');
      expect(layout.headerLines).toBe(1);
      expect(layout.contentRows).toBe(2);
      expect(layout.hasAvatar).toBe(true);
      expect(layout.hasGrid).toBe(true);
      expect(layout.gridColumns).toBe(2);
    });

    it('should return generic layout for unknown type', () => {
      const layout = component.getLayout('unknown' as SkeletonSectionType);
      expect(layout.headerLines).toBe(1);
      expect(layout.contentRows).toBe(3);
    });
  });

  describe('range Method', () => {
    it('should generate array of correct length', () => {
      const result = component.range(5);
      expect(result.length).toBe(5);
    });

    it('should generate array with correct indices', () => {
      const result = component.range(3);
      expect(result).toEqual([0, 1, 2]);
    });

    it('should return empty array for zero', () => {
      const result = component.range(0);
      expect(result).toEqual([]);
    });

    it('should handle negative numbers', () => {
      const result = component.range(-1);
      expect(result.length).toBe(0);
    });
  });

  describe('getSectionClasses Method', () => {
    it('should return base classes', () => {
      const section: SkeletonSection = { type: 'overview' };
      const classes = component.getSectionClasses(section);

      expect(classes).toContain('skeleton-section');
      expect(classes).toContain('skeleton-section--overview');
    });

    it('should include animated class when animated is true', () => {
      component.animated = true;
      const section: SkeletonSection = { type: 'analytics' };
      const classes = component.getSectionClasses(section);

      expect(classes).toContain('skeleton-section--animated');
    });

    it('should not include animated class when animated is false', () => {
      component.animated = false;
      const section: SkeletonSection = { type: 'analytics' };
      const classes = component.getSectionClasses(section);

      expect(classes).not.toContain('skeleton-section--animated');
    });

    it('should include type-specific class', () => {
      const section: SkeletonSection = { type: 'chart' };
      const classes = component.getSectionClasses(section);

      expect(classes).toContain('skeleton-section--chart');
    });
  });

  describe('trackBySection Method', () => {
    it('should return title when section has title', () => {
      const section: SkeletonSection = { type: 'overview', title: 'Overview Section' };
      const result = component.trackBySection(0, section);

      expect(result).toBe('Overview Section');
    });

    it('should return section-{index} when section has no title', () => {
      const section: SkeletonSection = { type: 'overview' };
      const result = component.trackBySection(2, section);

      expect(result).toBe('section-2');
    });
  });

  describe('trackByIndex Method', () => {
    it('should return the index', () => {
      expect(component.trackByIndex(0)).toBe(0);
      expect(component.trackByIndex(5)).toBe(5);
      expect(component.trackByIndex(10)).toBe(10);
    });
  });

  describe('Section Type Layouts', () => {
    const sectionTypes: SkeletonSectionType[] = [
      'info',
      'analytics',
      'chart',
      'list',
      'contact-card',
      'network-card',
      'map',
      'event',
      'product',
      'overview',
      'financials',
      'solutions',
      'quotation',
      'generic',
    ];

    sectionTypes.forEach((type) => {
      it(`should have layout configuration for ${type}`, () => {
        const layout = component.getLayout(type);
        expect(layout).toBeDefined();
        expect(layout.headerLines).toBeGreaterThan(0);
        expect(layout.contentRows).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sections array', () => {
      component.sections = [];
      component.sectionCount = 0;
      fixture.detectChanges();

      expect(component.effectiveSections).toEqual([]);
    });

    it('should handle sections with titles', () => {
      const sections: SkeletonSection[] = [
        { type: 'overview', title: 'Section 1' },
        { type: 'analytics', title: 'Section 2' },
      ];
      component.sections = sections;

      expect(component.effectiveSections).toEqual(sections);
    });

    it('should handle large section count', () => {
      component.sectionCount = 100;
      const effective = component.effectiveSections;

      expect(effective.length).toBe(100);
    });
  });
});
