import { TestBed } from '@angular/core/testing';
import { FeatureFlagsService } from './feature-flags.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureFlagsService],
    });

    service = TestBed.inject(FeatureFlagsService);

    // Clear localStorage
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Feature Flag Management', () => {
    it('should check if feature is enabled', () => {
      const enabled = service.isEnabled('dark-mode');
      expect(typeof enabled).toBe('boolean');
    });

    it('should enable feature', () => {
      service.enable('new-layout');
      expect(service.isEnabled('new-layout')).toBe(true);
    });

    it('should disable feature', () => {
      service.enable('dark-mode');
      service.disable('dark-mode');
      expect(service.isEnabled('dark-mode')).toBe(false);
    });

    it('should toggle feature', () => {
      const initial = service.isEnabled('streaming');
      service.toggle('streaming');
      expect(service.isEnabled('streaming')).toBe(!initial);
    });
  });

  describe('Rollout Percentage', () => {
    it('should set rollout percentage', () => {
      service.setRolloutPercentage('new-layout', 50);
      const flag = service.getFlag('new-layout');
      expect(flag?.rolloutPercentage).toBe(50);
    });

    it('should clamp rollout percentage to 0-100', () => {
      service.setRolloutPercentage('new-layout', 150);
      const flag = service.getFlag('new-layout');
      expect(flag?.rolloutPercentage).toBe(100);

      service.setRolloutPercentage('new-layout', -50);
      const flag2 = service.getFlag('new-layout');
      expect(flag2?.rolloutPercentage).toBe(0);
    });
  });

  describe('Flag Retrieval', () => {
    it('should get all flags', () => {
      const flags = service.getAllFlags();
      expect(Array.isArray(flags)).toBe(true);
      expect(flags.length).toBeGreaterThan(0);
    });

    it('should get specific flag', () => {
      const flag = service.getFlag('dark-mode');
      expect(flag).toBeTruthy();
      expect(flag?.key).toBe('dark-mode');
    });

    it('should return undefined for unknown flag', () => {
      const flag = service.getFlag('unknown-flag');
      expect(flag).toBeUndefined();
    });
  });

  describe('Persistence', () => {
    it('should persist flag changes to localStorage', () => {
      service.enable('new-layout');

      const stored = localStorage.getItem('feature-flags');
      expect(stored).toBeTruthy();
    });

    it('should load flags from localStorage', () => {
      // Set flag
      service.enable('experimental-animations');

      // Create new service instance
      const newService = new FeatureFlagsService();

      // Should load from storage
      expect(newService.isEnabled('experimental-animations')).toBe(true);
    });

    it('should reset to defaults', () => {
      service.enable('new-layout');
      service.resetToDefaults();

      const flag = service.getFlag('new-layout');
      expect(flag?.enabled).toBe(false); // Default is false
    });
  });

  describe('Observable API', () => {
    it('should provide observable for flag status', (done) => {
      service.isEnabled$('dark-mode').subscribe((enabled) => {
        expect(typeof enabled).toBe('boolean');
        done();
      });
    });

    it('should provide observable for all flags', (done) => {
      service.flags$().subscribe((flags) => {
        expect(Array.isArray(flags)).toBe(true);
        done();
      });
    });
  });
});
