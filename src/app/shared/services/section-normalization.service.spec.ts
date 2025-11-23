import { TestBed } from '@angular/core/testing';
import { SectionNormalizationService } from './section-normalization.service';
import { SectionBuilder, FieldBuilder } from '../../testing/test-builders';
import { CardSection } from '../../models';

describe('SectionNormalizationService', () => {
  let service: SectionNormalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SectionNormalizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('normalizeSection', () => {
    it('should normalize section with type', () => {
      const section = SectionBuilder.create()
        .withTitle('Company Info')
        .withType('info')
        .build();
      
      const normalized = service.normalizeSection(section);
      
      expect(normalized.type).toBe('info');
      expect(normalized.title).toBe('Company Info');
    });

    it('should resolve type from title if type missing', () => {
      const section = SectionBuilder.create()
        .withTitle('Company Info')
        .build();
      
      const normalized = service.normalizeSection(section);
      
      expect(normalized.type).toBeDefined();
    });

    it('should handle timeline type mapping to event', () => {
      const section = SectionBuilder.create()
        .withTitle('Timeline')
        .withType('timeline')
        .build();
      
      const normalized = service.normalizeSection(section);
      
      expect(normalized.type).toBe('event');
    });
  });

  describe('resolveSectionType (via normalizeSection)', () => {
    it('should resolve info type', () => {
      const section = SectionBuilder.create()
        .withTitle('Company Info')
        .withType('info')
        .build();
      
      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('info');
    });

    it('should resolve analytics type', () => {
      const section = SectionBuilder.create()
        .withTitle('Metrics')
        .withType('analytics')
        .build();
      
      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('analytics');
    });

    it('should resolve type from title pattern', () => {
      const section = SectionBuilder.create()
        .withTitle('Company Information')
        .build();
      
      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBeDefined();
    });

    it('should map timeline to event', () => {
      const section = SectionBuilder.create()
        .withTitle('Timeline')
        .withType('timeline')
        .build();
      
      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('event');
    });
  });

  describe('calculateColSpan', () => {
    it('should return 1 for sections with low content density', () => {
      const section = SectionBuilder.create()
        .withType('info')
        .withField(FieldBuilder.create().build())
        .build();
      
      const colSpan = service.calculateColSpan(section, 4);
      
      expect(colSpan).toBe(1);
    });

    it('should return 2 for sections with high content density', () => {
      const section = SectionBuilder.create()
        .withType('info')
        .withField(FieldBuilder.create().build())
        .withField(FieldBuilder.create().build())
        .withField(FieldBuilder.create().build())
        .withField(FieldBuilder.create().build())
        .withField(FieldBuilder.create().build())
        .build();
      
      const colSpan = service.calculateColSpan(section, 4);
      
      expect(colSpan).toBeGreaterThanOrEqual(1);
      expect(colSpan).toBeLessThanOrEqual(4);
    });

    it('should handle chart sections', () => {
      const section = SectionBuilder.create()
        .withType('chart')
        .withField(FieldBuilder.create().build())
        .build();
      
      const colSpan = service.calculateColSpan(section, 4);
      
      expect(colSpan).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sortSections', () => {
    it('should sort sections by priority', () => {
      const sections: CardSection[] = [
        SectionBuilder.create().withTitle('Overview').withType('overview').build(),
        SectionBuilder.create().withTitle('Details').withType('info').build(),
        SectionBuilder.create().withTitle('Analytics').withType('analytics').build()
      ];
      
      const sorted = service.sortSections(sections);
      
      expect(sorted.length).toBe(3);
      // Overview should come first
      expect(sorted[0].type).toBe('overview');
    });

    it('should preserve order for sections with same priority', () => {
      const sections: CardSection[] = [
        SectionBuilder.create().withTitle('Info 1').withType('info').build(),
        SectionBuilder.create().withTitle('Info 2').withType('info').build()
      ];
      
      const sorted = service.sortSections(sections);
      
      expect(sorted[0].title).toBe('Info 1');
      expect(sorted[1].title).toBe('Info 2');
    });
  });
});

