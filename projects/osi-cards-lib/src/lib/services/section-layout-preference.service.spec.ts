import { TestBed } from '@angular/core/testing';
import { SectionLayoutPreferenceService } from './section-layout-preference.service';
import { CardSection } from '../models';
import { SectionLayoutPreferences } from '../components';
import { LayoutContext } from '../types';

describe('SectionLayoutPreferenceService', () => {
  let service: SectionLayoutPreferenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SectionLayoutPreferenceService],
    });
    service = TestBed.inject(SectionLayoutPreferenceService);
  });

  afterEach(() => {
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('LayoutContext integration', () => {
    it('should pass LayoutContext to preference functions', () => {
      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 10,
      };

      let receivedContext: LayoutContext | undefined;

      service.register('test-section', (section, availableColumns, ctx) => {
        receivedContext = ctx;
        return {
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: 4,
          canShrinkToFill: true,
        };
      });

      const section: CardSection = {
        id: 'test-1',
        type: 'test-section',
        title: 'Test',
      };

      service.getPreferences(section, 4, context);

      expect(receivedContext).toEqual(context);
    });

    it('should include context values in cache key', () => {
      const context1: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 10,
      };

      const context2: LayoutContext = {
        containerWidth: 800,
        gridGap: 12,
        currentBreakpoint: 'md',
        totalSections: 10,
      };

      let callCount = 0;

      service.register('test-section', () => {
        callCount++;
        return {
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: 4,
          canShrinkToFill: true,
        };
      });

      const section: CardSection = {
        id: 'test-1',
        type: 'test-section',
        title: 'Test',
      };

      // First call with context1
      service.getPreferences(section, 4, context1);
      expect(callCount).toBe(1);

      // Second call with same context should use cache
      service.getPreferences(section, 4, context1);
      expect(callCount).toBe(1);

      // Third call with different context should recalculate
      service.getPreferences(section, 4, context2);
      expect(callCount).toBe(2);
    });
  });

  describe('Enhanced preferences with orientation', () => {
    it('should return preferences with orientation', () => {
      service.register('contact-card', (section) => {
        return {
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: 4,
          canShrinkToFill: true,
          orientation: 'squared',
          contentDensity: 4,
          aspectRatio: 1.0,
        };
      });

      const section: CardSection = {
        id: 'contact-1',
        type: 'contact-card',
        fields: [{ title: 'John Doe' }, { title: 'Jane Doe' }],
      };

      const prefs = service.getPreferences(section, 4);

      expect(prefs).not.toBeNull();
      expect(prefs?.orientation).toBe('squared');
      expect(prefs?.contentDensity).toBe(4);
      expect(prefs?.aspectRatio).toBe(1.0);
    });
  });

  describe('Cache management', () => {
    it('should clear cache when context changes', () => {
      const context: LayoutContext = {
        containerWidth: 1200,
        gridGap: 12,
        currentBreakpoint: 'lg',
        totalSections: 10,
      };

      let callCount = 0;

      service.register('test-section', () => {
        callCount++;
        return {
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: 4,
          canShrinkToFill: true,
        };
      });

      const section: CardSection = {
        id: 'test-1',
        type: 'test-section',
      };

      // First call
      service.getPreferences(section, 4, context);
      expect(callCount).toBe(1);

      // Cached call
      service.getPreferences(section, 4, context);
      expect(callCount).toBe(1);

      // Clear cache
      service.clearCache();

      // Should recalculate
      service.getPreferences(section, 4, context);
      expect(callCount).toBe(2);
    });
  });

  describe('Backward compatibility', () => {
    it('should work without LayoutContext', () => {
      service.register('test-section', (section, availableColumns) => {
        return {
          preferredColumns: 2,
          minColumns: 1,
          maxColumns: availableColumns,
          canShrinkToFill: true,
        };
      });

      const section: CardSection = {
        id: 'test-1',
        type: 'test-section',
      };

      const prefs = service.getPreferences(section, 4);

      expect(prefs).not.toBeNull();
      expect(prefs?.preferredColumns).toBe(2);
    });
  });
});
