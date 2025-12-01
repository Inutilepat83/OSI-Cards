import { TestBed } from '@angular/core/testing';
import { IconService } from './icon.service';

describe('IconService', () => {
  let service: IconService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IconService]
    });
    service = TestBed.inject(IconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // getFieldIcon Tests
  // ============================================================================
  describe('getFieldIcon', () => {
    // Business & Finance icons
    it('should return dollar-sign icon for revenue', () => {
      expect(service.getFieldIcon('revenue')).toBe('dollar-sign');
    });

    it('should return trending-up icon for profit', () => {
      expect(service.getFieldIcon('profit')).toBe('trending-up');
    });

    it('should return trending-down icon for expenses', () => {
      expect(service.getFieldIcon('expenses')).toBe('trending-down');
    });

    it('should return pie-chart icon for budget', () => {
      expect(service.getFieldIcon('budget')).toBe('pie-chart');
    });

    it('should return shopping-cart icon for sales', () => {
      expect(service.getFieldIcon('sales')).toBe('shopping-cart');
    });

    // Contact & Communication icons
    it('should return mail icon for email', () => {
      expect(service.getFieldIcon('email')).toBe('mail');
    });

    it('should return phone icon for phone', () => {
      expect(service.getFieldIcon('phone')).toBe('phone');
    });

    it('should return map-pin icon for address', () => {
      expect(service.getFieldIcon('address')).toBe('map-pin');
    });

    it('should return globe icon for website', () => {
      expect(service.getFieldIcon('website')).toBe('globe');
    });

    // Time & Dates icons
    it('should return calendar icon for date', () => {
      expect(service.getFieldIcon('date')).toBe('calendar');
    });

    it('should return clock icon for time', () => {
      expect(service.getFieldIcon('time')).toBe('clock');
    });

    // Status & Progress icons
    it('should return check-circle icon for completed', () => {
      expect(service.getFieldIcon('completed')).toBe('check-circle');
    });

    it('should return alert-triangle icon for warning', () => {
      expect(service.getFieldIcon('warning')).toBe('alert-triangle');
    });

    // Business Operations icons
    it('should return building icon for company', () => {
      expect(service.getFieldIcon('company')).toBe('building');
    });

    it('should return users icon for team', () => {
      expect(service.getFieldIcon('team')).toBe('users');
    });

    // Normalization tests
    it('should normalize field names (case insensitive)', () => {
      expect(service.getFieldIcon('REVENUE')).toBe('dollar-sign');
      expect(service.getFieldIcon('Revenue')).toBe('dollar-sign');
      expect(service.getFieldIcon('reVeNuE')).toBe('dollar-sign');
    });

    it('should normalize field names (remove special characters)', () => {
      expect(service.getFieldIcon('e-mail')).toBe('mail');
      expect(service.getFieldIcon('e_mail')).toBe('mail');
      expect(service.getFieldIcon('e mail')).toBe('mail');
    });

    // Partial matching tests
    it('should match partial field names', () => {
      expect(service.getFieldIcon('totalRevenue')).toBe('dollar-sign');
      expect(service.getFieldIcon('emailAddress')).toBe('mail');
      expect(service.getFieldIcon('companyName')).toBe('building');
    });

    // Default fallback tests
    it('should return default icon for unknown fields', () => {
      expect(service.getFieldIcon('unknownField')).toBe('circle');
      expect(service.getFieldIcon('xyz123')).toBe('circle');
    });

    it('should return default icon for empty string', () => {
      expect(service.getFieldIcon('')).toBe('circle');
    });
  });

  // ============================================================================
  // getFieldIconClass Tests
  // ============================================================================
  describe('getFieldIconClass', () => {
    // Business & Finance classes
    it('should return green class for revenue', () => {
      expect(service.getFieldIconClass('revenue')).toBe('text-green-500');
    });

    it('should return green class for profit', () => {
      expect(service.getFieldIconClass('profit')).toBe('text-green-600');
    });

    it('should return red class for expenses', () => {
      expect(service.getFieldIconClass('expenses')).toBe('text-red-500');
    });

    // Contact & Communication classes
    it('should return blue class for email', () => {
      expect(service.getFieldIconClass('email')).toBe('text-blue-500');
    });

    it('should return green class for phone', () => {
      expect(service.getFieldIconClass('phone')).toBe('text-green-500');
    });

    // Status classes
    it('should return green class for completed', () => {
      expect(service.getFieldIconClass('completed')).toBe('text-green-500');
    });

    it('should return yellow class for pending', () => {
      expect(service.getFieldIconClass('pending')).toBe('text-yellow-500');
    });

    it('should return red class for failed', () => {
      expect(service.getFieldIconClass('failed')).toBe('text-red-500');
    });

    it('should return amber class for warning', () => {
      expect(service.getFieldIconClass('warning')).toBe('text-amber-500');
    });

    // Normalization tests
    it('should normalize class lookups (case insensitive)', () => {
      expect(service.getFieldIconClass('REVENUE')).toBe('text-green-500');
      expect(service.getFieldIconClass('Revenue')).toBe('text-green-500');
    });

    // Default fallback tests
    it('should return default class for unknown fields', () => {
      expect(service.getFieldIconClass('unknownField')).toBe('text-gray-500');
    });

    it('should return default class for empty string', () => {
      expect(service.getFieldIconClass('')).toBe('text-gray-500');
    });
  });
});






