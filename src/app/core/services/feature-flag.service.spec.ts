import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FeatureFlagService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flag', () => {
      expect(service.isEnabled('nonExistentFlag')).toBe(false);
    });

    it('should return true for enabled flag', () => {
      service.enable('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(true);
    });

    it('should return false for disabled flag', () => {
      service.disable('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(false);
    });
  });

  describe('enable', () => {
    it('should enable a flag', () => {
      service.enable('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(true);
    });

    it('should persist to localStorage when persist is true', () => {
      service.enable('testFlag', true);
      const stored = localStorage.getItem('featureFlags');
      expect(stored).toBeTruthy();
      const flags = JSON.parse(stored!);
      expect(flags.testFlag).toBe(true);
    });
  });

  describe('disable', () => {
    it('should disable a flag', () => {
      service.enable('testFlag', false);
      service.disable('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should toggle flag from false to true', () => {
      service.disable('testFlag', false);
      service.toggle('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(true);
    });

    it('should toggle flag from true to false', () => {
      service.enable('testFlag', false);
      service.toggle('testFlag', false);
      expect(service.isEnabled('testFlag')).toBe(false);
    });
  });

  describe('setFlags', () => {
    it('should set multiple flags at once', () => {
      service.setFlags({ flag1: true, flag2: false }, false);
      expect(service.isEnabled('flag1')).toBe(true);
      expect(service.isEnabled('flag2')).toBe(false);
    });
  });

  describe('getAllFlags', () => {
    it('should return all flags', () => {
      service.enable('flag1', false);
      service.disable('flag2', false);
      const flags = service.getAllFlags();
      expect(flags.flag1).toBe(true);
      expect(flags.flag2).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all flags to defaults', () => {
      service.enable('customFlag', false);
      service.reset(false);
      // Custom flag should be gone, defaults should remain
      const flags = service.getAllFlags();
      expect(flags.customFlag).toBeUndefined();
    });
  });
});
