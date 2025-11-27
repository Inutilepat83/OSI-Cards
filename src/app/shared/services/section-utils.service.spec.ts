import { TestBed } from '@angular/core/testing';
import { SectionUtilsService } from './section-utils.service';

describe('SectionUtilsService', () => {
  let service: SectionUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SectionUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTrendIcon', () => {
    it('should return up icon for up trend', () => {
      const icon = service.getTrendIcon('up');
      expect(icon).toBe('trending-up');
    });

    it('should return down icon for down trend', () => {
      const icon = service.getTrendIcon('down');
      expect(icon).toBe('trending-down');
    });

    it('should return stable icon for stable trend', () => {
      const icon = service.getTrendIcon('stable');
      expect(icon).toBe('minus');
    });

    it('should return default icon for neutral trend', () => {
      const icon = service.getTrendIcon('neutral');
      expect(icon).toBe('bar-chart-3');
    });
  });

  describe('calculateTrend', () => {
    it('should return up for positive change', () => {
      const trend = service.calculateTrend(10);
      expect(trend).toBe('up');
    });

    it('should return down for negative change', () => {
      const trend = service.calculateTrend(-10);
      expect(trend).toBe('down');
    });

    it('should return stable for zero change', () => {
      const trend = service.calculateTrend(0);
      expect(trend).toBe('stable');
    });

    it('should return neutral for undefined change', () => {
      const trend = service.calculateTrend(undefined);
      expect(trend).toBe('neutral');
    });
  });

  describe('getTrendClass', () => {
    it('should return positive class for up trend', () => {
      const className = service.getTrendClass('up');
      expect(className).toContain('positive');
    });

    it('should return negative class for down trend', () => {
      const className = service.getTrendClass('down');
      expect(className).toContain('negative');
    });

    it('should return neutral class for stable trend', () => {
      const className = service.getTrendClass('stable');
      expect(className).toContain('neutral');
    });

    it('should calculate class from change value', () => {
      const className = service.getTrendClass(10);
      expect(className).toBeDefined();
    });
  });

  describe('formatChange', () => {
    it('should format positive change with + sign', () => {
      const formatted = service.formatChange(10);
      expect(formatted).toContain('+');
    });

    it('should format negative change with - sign', () => {
      const formatted = service.formatChange(-10);
      expect(formatted).toContain('-');
    });

    it('should format zero change', () => {
      const formatted = service.formatChange(0);
      expect(formatted).toBeDefined();
    });

    it('should handle undefined change', () => {
      const formatted = service.formatChange(undefined);
      expect(formatted).toBe('');
    });
  });

  describe('getStatusClasses', () => {
    it('should return status class for status string', () => {
      const classes = service.getStatusClasses('active');
      expect(classes).toBeDefined();
    });

    it('should handle undefined status', () => {
      const classes = service.getStatusClasses(undefined);
      expect(classes).toBeDefined();
    });
  });
});








