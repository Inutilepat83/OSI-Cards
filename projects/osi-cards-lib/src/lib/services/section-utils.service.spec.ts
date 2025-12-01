import { TestBed } from '@angular/core/testing';
import { SectionUtilsService, StatusValue, PriorityValue, TrendValue } from './section-utils.service';

describe('SectionUtilsService', () => {
  let service: SectionUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SectionUtilsService]
    });
    service = TestBed.inject(SectionUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getStatusClasses Tests
  // ============================================================================
  describe('getStatusClasses', () => {
    it('should return completed class for completed status', () => {
      expect(service.getStatusClasses('completed')).toBe('status--completed');
    });

    it('should return completed class for success status', () => {
      expect(service.getStatusClasses('success')).toBe('status--completed');
    });

    it('should return active class for active status', () => {
      expect(service.getStatusClasses('active')).toBe('status--active');
    });

    it('should return active class for in-progress status', () => {
      expect(service.getStatusClasses('in-progress')).toBe('status--active');
    });

    it('should return pending class for pending status', () => {
      expect(service.getStatusClasses('pending')).toBe('status--pending');
    });

    it('should return pending class for warning status', () => {
      expect(service.getStatusClasses('warning')).toBe('status--pending');
    });

    it('should return blocked class for cancelled status', () => {
      expect(service.getStatusClasses('cancelled')).toBe('status--blocked');
    });

    it('should return blocked class for blocked status', () => {
      expect(service.getStatusClasses('blocked')).toBe('status--blocked');
    });

    it('should return blocked class for delayed status', () => {
      expect(service.getStatusClasses('delayed')).toBe('status--blocked');
    });

    it('should return blocked class for inactive status', () => {
      expect(service.getStatusClasses('inactive')).toBe('status--blocked');
    });

    it('should return blocked class for error status', () => {
      expect(service.getStatusClasses('error')).toBe('status--blocked');
    });

    it('should return default class for unknown status', () => {
      expect(service.getStatusClasses('unknown')).toBe('status--default');
    });

    it('should return default class for undefined status', () => {
      expect(service.getStatusClasses(undefined)).toBe('status--default');
    });

    it('should be case insensitive', () => {
      expect(service.getStatusClasses('COMPLETED')).toBe('status--completed');
      expect(service.getStatusClasses('Completed')).toBe('status--completed');
      expect(service.getStatusClasses('Active')).toBe('status--active');
    });

    it('should trim whitespace', () => {
      expect(service.getStatusClasses('  completed  ' as StatusValue)).toBe('status--completed');
    });
  });

  // ============================================================================
  // getPriorityClasses Tests
  // ============================================================================
  describe('getPriorityClasses', () => {
    it('should return high class for high priority', () => {
      expect(service.getPriorityClasses('high')).toBe('priority--high');
    });

    it('should return medium class for medium priority', () => {
      expect(service.getPriorityClasses('medium')).toBe('priority--medium');
    });

    it('should return low class for low priority', () => {
      expect(service.getPriorityClasses('low')).toBe('priority--low');
    });

    it('should return default class for unknown priority', () => {
      expect(service.getPriorityClasses('critical' as PriorityValue)).toBe('priority--default');
    });

    it('should return default class for undefined priority', () => {
      expect(service.getPriorityClasses(undefined)).toBe('priority--default');
    });

    it('should be case insensitive', () => {
      expect(service.getPriorityClasses('HIGH')).toBe('priority--high');
      expect(service.getPriorityClasses('High')).toBe('priority--high');
    });

    it('should trim whitespace', () => {
      expect(service.getPriorityClasses('  high  ' as PriorityValue)).toBe('priority--high');
    });
  });

  // ============================================================================
  // getTrendIcon Tests
  // ============================================================================
  describe('getTrendIcon', () => {
    it('should return trending-up icon for up trend', () => {
      expect(service.getTrendIcon('up')).toBe('trending-up');
    });

    it('should return trending-down icon for down trend', () => {
      expect(service.getTrendIcon('down')).toBe('trending-down');
    });

    it('should return minus icon for stable trend', () => {
      expect(service.getTrendIcon('stable')).toBe('minus');
    });

    it('should return minus icon for neutral trend', () => {
      expect(service.getTrendIcon('neutral')).toBe('minus');
    });

    it('should return bar-chart-3 icon for unknown trend', () => {
      expect(service.getTrendIcon('unknown')).toBe('bar-chart-3');
    });

    it('should return bar-chart-3 icon for undefined trend', () => {
      expect(service.getTrendIcon(undefined)).toBe('bar-chart-3');
    });

    it('should be case insensitive', () => {
      expect(service.getTrendIcon('UP')).toBe('trending-up');
      expect(service.getTrendIcon('Up')).toBe('trending-up');
    });
  });

  // ============================================================================
  // getTrendClass Tests
  // ============================================================================
  describe('getTrendClass', () => {
    // String trends
    it('should return up class for up trend', () => {
      expect(service.getTrendClass('up')).toBe('trend--up');
    });

    it('should return down class for down trend', () => {
      expect(service.getTrendClass('down')).toBe('trend--down');
    });

    it('should return stable class for stable trend', () => {
      expect(service.getTrendClass('stable')).toBe('trend--stable');
    });

    it('should return neutral class for unknown trend', () => {
      expect(service.getTrendClass('unknown')).toBe('trend--neutral');
    });

    it('should return neutral class for undefined trend', () => {
      expect(service.getTrendClass(undefined)).toBe('trend--neutral');
    });

    // Numeric trends
    it('should return up class for positive numbers', () => {
      expect(service.getTrendClass(10)).toBe('trend--up');
      expect(service.getTrendClass(0.1)).toBe('trend--up');
      expect(service.getTrendClass(100)).toBe('trend--up');
    });

    it('should return down class for negative numbers', () => {
      expect(service.getTrendClass(-10)).toBe('trend--down');
      expect(service.getTrendClass(-0.1)).toBe('trend--down');
      expect(service.getTrendClass(-100)).toBe('trend--down');
    });

    it('should return stable class for zero', () => {
      expect(service.getTrendClass(0)).toBe('trend--stable');
    });

    it('should be case insensitive for strings', () => {
      expect(service.getTrendClass('UP')).toBe('trend--up');
      expect(service.getTrendClass('Down')).toBe('trend--down');
    });
  });

  // ============================================================================
  // calculateTrend Tests
  // ============================================================================
  describe('calculateTrend', () => {
    it('should return up for positive values', () => {
      expect(service.calculateTrend(10)).toBe('up');
      expect(service.calculateTrend(0.1)).toBe('up');
      expect(service.calculateTrend(1000)).toBe('up');
    });

    it('should return down for negative values', () => {
      expect(service.calculateTrend(-10)).toBe('down');
      expect(service.calculateTrend(-0.1)).toBe('down');
      expect(service.calculateTrend(-1000)).toBe('down');
    });

    it('should return stable for zero', () => {
      expect(service.calculateTrend(0)).toBe('stable');
    });

    it('should return neutral for undefined', () => {
      expect(service.calculateTrend(undefined)).toBe('neutral');
    });

    it('should return neutral for null', () => {
      expect(service.calculateTrend(null as unknown as number)).toBe('neutral');
    });
  });

  // ============================================================================
  // formatChange Tests
  // ============================================================================
  describe('formatChange', () => {
    it('should format positive changes with plus sign', () => {
      expect(service.formatChange(10)).toBe('+10%');
      expect(service.formatChange(0.5)).toBe('+0.5%');
      expect(service.formatChange(100)).toBe('+100%');
    });

    it('should format negative changes with minus sign', () => {
      expect(service.formatChange(-10)).toBe('-10%');
      expect(service.formatChange(-0.5)).toBe('-0.5%');
      expect(service.formatChange(-100)).toBe('-100%');
    });

    it('should format zero without sign', () => {
      expect(service.formatChange(0)).toBe('0%');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatChange(undefined)).toBe('');
    });

    it('should return empty string for null', () => {
      expect(service.formatChange(null as unknown as number)).toBe('');
    });
  });
});




