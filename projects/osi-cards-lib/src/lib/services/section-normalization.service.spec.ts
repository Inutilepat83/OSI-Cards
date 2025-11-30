import { TestBed } from '@angular/core/testing';
import { SectionNormalizationService, PRIORITY_BANDS, PriorityBand } from './section-normalization.service';
import { CardSection } from '../models/card.model';

describe('SectionNormalizationService', () => {
  let service: SectionNormalizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SectionNormalizationService]
    });
    service = TestBed.inject(SectionNormalizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Section Normalization Tests
  // ============================================================================
  describe('normalizeSection', () => {
    it('should preserve existing type', () => {
      const section: CardSection = {
        title: 'Test Section',
        type: 'analytics'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.type).toBe('analytics');
    });

    it('should resolve timeline type to event', () => {
      const section: CardSection = {
        title: 'Timeline',
        type: 'timeline'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.type).toBe('event');
    });

    it('should resolve metrics type to analytics', () => {
      const section: CardSection = {
        title: 'Metrics',
        type: 'metrics'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.type).toBe('analytics');
    });

    it('should add preferredColumns from type defaults', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.preferredColumns).toBeDefined();
    });

    it('should preserve explicit preferredColumns', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info',
        preferredColumns: 3
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.preferredColumns).toBe(3);
    });

    it('should set priority band on section', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.priority).toBe('critical');
    });

    it('should preserve explicit priority', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info',
        priority: 'important'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.priority).toBe('important');
    });

    it('should add meta with colSpanThresholds', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.meta).toBeDefined();
      const meta = result.meta as Record<string, unknown>;
      expect(meta['colSpanThresholds']).toBeDefined();
    });

    it('should add meta with priorityBand', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info'
      };
      
      const result = service.normalizeSection(section);
      
      const meta = result.meta as Record<string, unknown>;
      expect(meta['priorityBand']).toBeDefined();
    });

    it('should use subtitle as description when description missing', () => {
      const section: CardSection = {
        title: 'Test',
        type: 'info',
        subtitle: 'This is a subtitle'
      };
      
      const result = service.normalizeSection(section);
      
      expect(result.description).toBe('This is a subtitle');
    });
  });

  // ============================================================================
  // Priority Band Tests
  // ============================================================================
  describe('getPriorityBandForType', () => {
    it('should return critical for overview', () => {
      expect(service.getPriorityBandForType('overview')).toBe('critical');
    });

    it('should return critical for contact-card', () => {
      expect(service.getPriorityBandForType('contact-card')).toBe('critical');
    });

    it('should return important for analytics', () => {
      expect(service.getPriorityBandForType('analytics')).toBe('important');
    });

    it('should return important for chart', () => {
      expect(service.getPriorityBandForType('chart')).toBe('important');
    });

    it('should return important for stats', () => {
      expect(service.getPriorityBandForType('stats')).toBe('important');
    });

    it('should return important for financials', () => {
      expect(service.getPriorityBandForType('financials')).toBe('important');
    });

    it('should return standard for info', () => {
      expect(service.getPriorityBandForType('info')).toBe('standard');
    });

    it('should return standard for list', () => {
      expect(service.getPriorityBandForType('list')).toBe('standard');
    });

    it('should return standard for product', () => {
      expect(service.getPriorityBandForType('product')).toBe('standard');
    });

    it('should return optional for event', () => {
      expect(service.getPriorityBandForType('event')).toBe('optional');
    });

    it('should return optional for timeline', () => {
      expect(service.getPriorityBandForType('timeline')).toBe('optional');
    });

    it('should return optional for quotation', () => {
      expect(service.getPriorityBandForType('quotation')).toBe('optional');
    });

    it('should return standard for unknown types', () => {
      expect(service.getPriorityBandForType('unknown-type')).toBe('standard');
    });

    it('should be case insensitive', () => {
      expect(service.getPriorityBandForType('OVERVIEW')).toBe('critical');
      expect(service.getPriorityBandForType('Overview')).toBe('critical');
    });
  });

  // ============================================================================
  // Condensation Order Tests
  // ============================================================================
  describe('getCondensationOrder', () => {
    it('should return 999 for critical sections (never condense)', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      
      const order = service.getCondensationOrder(section);
      
      expect(order).toBe(999);
    });

    it('should return 3 for important sections (condense last)', () => {
      const section: CardSection = {
        title: 'Chart',
        type: 'chart'
      };
      
      const order = service.getCondensationOrder(section);
      
      expect(order).toBe(3);
    });

    it('should return 2 for standard sections (condense always)', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info'
      };
      
      const order = service.getCondensationOrder(section);
      
      expect(order).toBe(2);
    });

    it('should return 1 for optional sections (condense first)', () => {
      const section: CardSection = {
        title: 'Event',
        type: 'event'
      };
      
      const order = service.getCondensationOrder(section);
      
      expect(order).toBe(1);
    });

    it('should use explicit priority when set', () => {
      const section: CardSection = {
        title: 'Info',
        type: 'info',
        priority: 'critical'
      };
      
      const order = service.getCondensationOrder(section);
      
      expect(order).toBe(999);
    });
  });

  // ============================================================================
  // Condensation Application Tests
  // ============================================================================
  describe('applyCondensation', () => {
    it('should not collapse sections when count is within limit', () => {
      const sections: CardSection[] = [
        { title: 'S1', type: 'info' },
        { title: 'S2', type: 'list' }
      ];
      
      const result = service.applyCondensation(sections, 5);
      
      expect(result.every(s => !s.collapsed)).toBe(true);
    });

    it('should collapse low priority sections first', () => {
      const sections: CardSection[] = [
        { title: 'Overview', type: 'overview' },    // critical - never collapse
        { title: 'Chart', type: 'chart' },          // important - collapse last
        { title: 'Info', type: 'info' },            // standard - collapse always
        { title: 'Event', type: 'event' }           // optional - collapse first
      ];
      
      const result = service.applyCondensation(sections, 2);
      
      // Overview should not be collapsed (critical)
      const overviewSection = result.find(s => s.title === 'Overview');
      expect(overviewSection?.collapsed).toBeFalsy();
      
      // Event should be collapsed (optional = condense first)
      const eventSection = result.find(s => s.title === 'Event');
      expect(eventSection?.collapsed).toBe(true);
    });

    it('should never collapse critical sections', () => {
      const sections: CardSection[] = [
        { title: 'Overview', type: 'overview' },
        { title: 'Contact', type: 'contact-card' },
        { title: 'Event1', type: 'event' },
        { title: 'Event2', type: 'event' }
      ];
      
      const result = service.applyCondensation(sections, 1);
      
      // Critical sections should never be collapsed
      const overview = result.find(s => s.title === 'Overview');
      const contact = result.find(s => s.title === 'Contact');
      
      expect(overview?.collapsed).toBeFalsy();
      expect(contact?.collapsed).toBeFalsy();
    });

    it('should preserve original section order', () => {
      const sections: CardSection[] = [
        { title: 'First', type: 'overview' },
        { title: 'Second', type: 'info' },
        { title: 'Third', type: 'event' }
      ];
      
      const result = service.applyCondensation(sections, 2);
      
      expect(result[0]?.title).toBe('First');
      expect(result[1]?.title).toBe('Second');
      expect(result[2]?.title).toBe('Third');
    });
  });

  // ============================================================================
  // Section Priority Tests
  // ============================================================================
  describe('getSectionPriority', () => {
    it('should return low priority for overview', () => {
      const section: CardSection = {
        title: 'Overview',
        type: 'overview'
      };
      
      const priority = service.getSectionPriority(section);
      
      expect(priority).toBeLessThan(2);
    });

    it('should return low priority for contact-card', () => {
      const section: CardSection = {
        title: 'Contacts',
        type: 'contact-card'
      };
      
      const priority = service.getSectionPriority(section);
      
      expect(priority).toBeLessThan(2);
    });

    it('should use explicit priority when set', () => {
      const section: CardSection = {
        title: 'Event',
        type: 'event',
        priority: 'critical'
      };
      
      const priority = service.getSectionPriority(section);
      
      expect(priority).toBe(1);
    });

    it('should give lower priority (higher number) to optional sections', () => {
      const criticalSection: CardSection = { title: 'Overview', type: 'overview' };
      const optionalSection: CardSection = { title: 'Event', type: 'event' };
      
      const criticalPriority = service.getSectionPriority(criticalSection);
      const optionalPriority = service.getSectionPriority(optionalSection);
      
      expect(criticalPriority).toBeLessThan(optionalPriority);
    });

    it('should handle title-based overrides', () => {
      const section: CardSection = {
        title: 'Company Overview',
        type: 'info'
      };
      
      const priority = service.getSectionPriority(section);
      
      expect(priority).toBe(1); // Title contains 'overview'
    });
  });

  // ============================================================================
  // Section Sorting Tests
  // ============================================================================
  describe('sortSections', () => {
    it('should sort sections by priority', () => {
      const sections: CardSection[] = [
        { title: 'Event', type: 'event' },
        { title: 'Overview', type: 'overview' },
        { title: 'Info', type: 'info' }
      ];
      
      const result = service.sortSections(sections);
      
      // Overview should come first (lowest priority number)
      expect(result[0]?.type).toBe('overview');
    });

    it('should respect streaming order when present', () => {
      const sections: CardSection[] = [
        { title: 'Second', type: 'overview', meta: { streamingOrder: 2 } },
        { title: 'First', type: 'info', meta: { streamingOrder: 1 } },
        { title: 'Third', type: 'event', meta: { streamingOrder: 3 } }
      ];
      
      const result = service.sortSections(sections);
      
      expect(result[0]?.title).toBe('First');
      expect(result[1]?.title).toBe('Second');
      expect(result[2]?.title).toBe('Third');
    });

    it('should not mutate original array', () => {
      const sections: CardSection[] = [
        { title: 'Event', type: 'event' },
        { title: 'Overview', type: 'overview' }
      ];
      const originalOrder = sections.map(s => s.title);
      
      service.sortSections(sections);
      
      expect(sections.map(s => s.title)).toEqual(originalOrder);
    });
  });

  // ============================================================================
  // Normalize and Sort Tests
  // ============================================================================
  describe('normalizeAndSortSections', () => {
    it('should normalize and sort in one call', () => {
      const sections: CardSection[] = [
        { title: 'Timeline', type: 'timeline' },  // Should resolve to 'event'
        { title: 'Overview', type: 'overview' }
      ];
      
      const result = service.normalizeAndSortSections(sections);
      
      // Should be sorted (overview first)
      expect(result[0]?.type).toBe('overview');
      // Timeline should be normalized to event
      expect(result[1]?.type).toBe('event');
    });

    it('should add required properties', () => {
      const sections: CardSection[] = [
        { title: 'Test', type: 'info' }
      ];
      
      const result = service.normalizeAndSortSections(sections);
      
      expect(result[0]?.preferredColumns).toBeDefined();
      expect(result[0]?.priority).toBeDefined();
      expect(result[0]?.meta).toBeDefined();
    });
  });

  // ============================================================================
  // Preferred Columns Tests
  // ============================================================================
  describe('getPreferredColumnsForType', () => {
    it('should return 2 for chart sections', () => {
      const columns = service.getPreferredColumnsForType('chart');
      expect(columns).toBe(2);
    });

    it('should return 2 for map sections', () => {
      const columns = service.getPreferredColumnsForType('map');
      expect(columns).toBe(2);
    });

    it('should return 1 for contact-card sections', () => {
      const columns = service.getPreferredColumnsForType('contact-card');
      expect(columns).toBe(1);
    });

    it('should return 1 for project sections', () => {
      const columns = service.getPreferredColumnsForType('project');
      expect(columns).toBe(1);
    });

    it('should return default for unknown types', () => {
      const columns = service.getPreferredColumnsForType('unknown');
      expect(columns).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // PRIORITY_BANDS Export Tests
  // ============================================================================
  describe('PRIORITY_BANDS export', () => {
    it('should export PRIORITY_BANDS constant', () => {
      expect(PRIORITY_BANDS).toBeDefined();
    });

    it('should have all priority bands', () => {
      const bands: PriorityBand[] = ['critical', 'important', 'standard', 'optional'];
      bands.forEach(band => {
        expect(PRIORITY_BANDS[band]).toBeDefined();
        expect(PRIORITY_BANDS[band].types).toBeDefined();
        expect(PRIORITY_BANDS[band].condensePriority).toBeDefined();
        expect(PRIORITY_BANDS[band].order).toBeDefined();
      });
    });
  });
});
