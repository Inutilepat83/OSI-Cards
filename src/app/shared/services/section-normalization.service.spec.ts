import { TestBed } from '@angular/core/testing';
import { SectionNormalizationService } from './section-normalization.service';
import { FieldBuilder, SectionBuilder } from '../../testing/test-builders';
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
      const section = SectionBuilder.create().withTitle('Company Info').withType('info').build();

      const normalized = service.normalizeSection(section);

      expect(normalized.type).toBe('info');
      expect(normalized.title).toBe('Company Info');
    });

    it('should resolve type from title if type missing', () => {
      const section = SectionBuilder.create().withTitle('Company Info').build();

      const normalized = service.normalizeSection(section);

      expect(normalized.type).toBeDefined();
    });

    it('should handle timeline type mapping to event', () => {
      const section = SectionBuilder.create().withTitle('Timeline').withType('timeline').build();

      const normalized = service.normalizeSection(section);

      expect(normalized.type).toBe('event');
    });
  });

  describe('resolveSectionType (via normalizeSection)', () => {
    it('should resolve info type', () => {
      const section = SectionBuilder.create().withTitle('Company Info').withType('info').build();

      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('info');
    });

    it('should resolve analytics type', () => {
      const section = SectionBuilder.create().withTitle('Metrics').withType('analytics').build();

      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('analytics');
    });

    it('should resolve type from title pattern', () => {
      const section = SectionBuilder.create().withTitle('Company Information').build();

      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBeDefined();
    });

    it('should map timeline to event', () => {
      const section = SectionBuilder.create().withTitle('Timeline').withType('timeline').build();

      const normalized = service.normalizeSection(section);
      expect(normalized.type).toBe('event');
    });
  });

  describe('getPreferredColumns', () => {
    it('should return preferred columns for info type', () => {
      const columns = service.getPreferredColumns('info');
      expect(columns).toBeGreaterThanOrEqual(1);
    });

    it('should return preferred columns for chart type', () => {
      const columns = service.getPreferredColumns('chart');
      expect(columns).toBeGreaterThanOrEqual(1);
    });

    it('should return preferred columns for overview type', () => {
      const columns = service.getPreferredColumns('overview');
      expect(columns).toBeGreaterThanOrEqual(1);
    });

    it('should handle unknown type', () => {
      const columns = service.getPreferredColumns('unknown');
      expect(columns).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculatePreferredColumns', () => {
    it('should calculate columns for contact-card based on field count', () => {
      const section = SectionBuilder.create()
        .withType('contact-card')
        .withField(FieldBuilder.create().build())
        .withField(FieldBuilder.create().build())
        .build();
      const columns = service.calculatePreferredColumns(section);
      expect(columns).toBeGreaterThanOrEqual(1);
      expect(columns).toBeLessThanOrEqual(4);
    });

    it('should return 4 for overview sections', () => {
      const section = SectionBuilder.create().withType('overview').build();
      expect(service.calculatePreferredColumns(section)).toBe(4);
    });

    it('should return 1 for info sections', () => {
      const section = SectionBuilder.create().withType('info').build();
      expect(service.calculatePreferredColumns(section)).toBe(1);
    });
  });

  describe('getSectionPriority', () => {
    it('should return low priority for overview sections', () => {
      const section = SectionBuilder.create().withType('overview').build();
      expect(service.getSectionPriority(section)).toBeLessThan(3);
    });

    it('should return higher priority for event sections', () => {
      const section = SectionBuilder.create().withType('event').build();
      expect(service.getSectionPriority(section)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('sortSections', () => {
    it('should sort sections by priority', () => {
      const sections: CardSection[] = [
        SectionBuilder.create().withTitle('Overview').withType('overview').build(),
        SectionBuilder.create().withTitle('Details').withType('info').build(),
        SectionBuilder.create().withTitle('Analytics').withType('analytics').build(),
      ];

      const sorted = service.sortSections(sections);

      expect(sorted.length).toBe(3);
      // Overview should come first
      expect(sorted[0]?.type).toBe('overview');
    });

    it('should preserve order for sections with same priority', () => {
      const sections: CardSection[] = [
        SectionBuilder.create().withTitle('Info 1').withType('info').build(),
        SectionBuilder.create().withTitle('Info 2').withType('info').build(),
      ];

      const sorted = service.sortSections(sections);

      expect(sorted[0]?.title).toBe('Info 1');
      expect(sorted[1]?.title).toBe('Info 2');
    });
  });
});
