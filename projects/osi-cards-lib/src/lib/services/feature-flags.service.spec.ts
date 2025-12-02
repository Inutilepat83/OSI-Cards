import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { 
  FeatureFlagsService, 
  OSI_FEATURE_FLAGS, 
  FEATURE_FLAG_META,
  FeatureFlagKey 
} from './feature-flags.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    TestBed.configureTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(FeatureFlagsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================
  describe('initialization', () => {
    it('should initialize with default values', () => {
      const all = service.getAll();
      
      // Check that defaults are applied
      expect(all[OSI_FEATURE_FLAGS.FLIP_ANIMATIONS]).toBe(true); // Default: true
      expect(all[OSI_FEATURE_FLAGS.PLUGINS]).toBe(true); // Default: true
      expect(all[OSI_FEATURE_FLAGS.VIRTUAL_SCROLL]).toBe(false); // Default: false
    });

    it('should have all feature flags defined in metadata', () => {
      const allFlags = Object.values(OSI_FEATURE_FLAGS);
      
      for (const flag of allFlags) {
        expect(FEATURE_FLAG_META[flag]).toBeDefined();
        expect(FEATURE_FLAG_META[flag].description).toBeDefined();
        expect(typeof FEATURE_FLAG_META[flag].defaultValue).toBe('boolean');
      }
    });
  });

  // ============================================================================
  // Query Methods Tests
  // ============================================================================
  describe('isEnabled', () => {
    it('should return default value for unset flags', () => {
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(false);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.FLIP_ANIMATIONS)).toBe(true);
    });

    it('should return set value after enabling', () => {
      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
    });

    it('should return set value after disabling', () => {
      service.disable(OSI_FEATURE_FLAGS.FLIP_ANIMATIONS);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.FLIP_ANIMATIONS)).toBe(false);
    });
  });

  describe('observe', () => {
    it('should emit current value immediately', (done) => {
      service.observe(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL).subscribe(value => {
        expect(value).toBe(false);
        done();
      });
    });

    it('should emit new values when flag changes', (done) => {
      const values: boolean[] = [];
      
      service.observe(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL).subscribe(value => {
        values.push(value);
        if (values.length === 2) {
          expect(values).toEqual([false, true]);
          done();
        }
      });

      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
    });
  });

  describe('getAll', () => {
    it('should return all flags with their current values', () => {
      const all = service.getAll();
      const allFlags = Object.values(OSI_FEATURE_FLAGS);

      for (const flag of allFlags) {
        expect(all[flag]).toBeDefined();
      }
    });
  });

  describe('getMeta', () => {
    it('should return metadata for known flags', () => {
      const meta = service.getMeta(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      
      expect(meta).toBeDefined();
      expect(meta?.description).toContain('virtual scrolling');
      expect(meta?.experimental).toBe(false);
      expect(meta?.mutable).toBe(true);
    });

    it('should return undefined for unknown flags', () => {
      const meta = service.getMeta('unknown-flag' as FeatureFlagKey);
      expect(meta).toBeUndefined();
    });
  });

  describe('getExperimentalFlags', () => {
    it('should return only experimental flags', () => {
      const experimental = service.getExperimentalFlags();
      
      for (const flag of experimental) {
        expect(FEATURE_FLAG_META[flag].experimental).toBe(true);
      }
    });

    it('should include web workers and streaming v2', () => {
      const experimental = service.getExperimentalFlags();
      
      expect(experimental).toContain(OSI_FEATURE_FLAGS.WEB_WORKERS);
      expect(experimental).toContain(OSI_FEATURE_FLAGS.STREAMING_V2);
    });
  });

  // ============================================================================
  // Mutation Methods Tests
  // ============================================================================
  describe('enable', () => {
    it('should enable a mutable flag', () => {
      const result = service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      
      expect(result).toBe(true);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
    });

    it('should return false for immutable flags', () => {
      const result = service.enable(OSI_FEATURE_FLAGS.STREAMING_V2);
      
      // STREAMING_V2 is not mutable
      expect(result).toBe(false);
    });
  });

  describe('disable', () => {
    it('should disable a mutable flag', () => {
      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      const result = service.disable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      
      expect(result).toBe(true);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(false);
    });
  });

  describe('toggle', () => {
    it('should toggle flag from false to true', () => {
      service.toggle(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
    });

    it('should toggle flag from true to false', () => {
      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      service.toggle(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(false);
    });
  });

  describe('setFlag', () => {
    it('should set flag to specified value', () => {
      service.setFlag(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL, true);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
      
      service.setFlag(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL, false);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(false);
    });

    it('should return false for unknown flags', () => {
      const result = service.setFlag('unknown-flag' as FeatureFlagKey, true);
      expect(result).toBe(false);
    });

    it('should return false for immutable flags', () => {
      const result = service.setFlag(OSI_FEATURE_FLAGS.PLUGINS, false);
      expect(result).toBe(false);
    });
  });

  describe('configure', () => {
    it('should configure multiple flags at once', () => {
      service.configure({
        [OSI_FEATURE_FLAGS.VIRTUAL_SCROLL]: true,
        [OSI_FEATURE_FLAGS.SKYLINE_PACKING]: true,
        [OSI_FEATURE_FLAGS.DEBUG_OVERLAY]: true,
      });

      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.SKYLINE_PACKING)).toBe(true);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.DEBUG_OVERLAY)).toBe(true);
    });

    it('should skip immutable flags', () => {
      const originalValue = service.isEnabled(OSI_FEATURE_FLAGS.PLUGINS);
      
      service.configure({
        [OSI_FEATURE_FLAGS.PLUGINS]: !originalValue,
      });

      // Should remain unchanged
      expect(service.isEnabled(OSI_FEATURE_FLAGS.PLUGINS)).toBe(originalValue);
    });
  });

  describe('reset', () => {
    it('should reset all flags to defaults', () => {
      // Change some flags
      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      service.disable(OSI_FEATURE_FLAGS.FLIP_ANIMATIONS);

      // Reset
      service.reset();

      // Check defaults are restored
      expect(service.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(false);
      expect(service.isEnabled(OSI_FEATURE_FLAGS.FLIP_ANIMATIONS)).toBe(true);
    });
  });

  describe('enableExperimental', () => {
    it('should enable all mutable experimental flags', () => {
      service.enableExperimental();

      const experimental = service.getExperimentalFlags();
      
      for (const flag of experimental) {
        const meta = FEATURE_FLAG_META[flag];
        if (meta.mutable) {
          expect(service.isEnabled(flag)).toBe(true);
        }
      }
    });
  });

  // ============================================================================
  // Persistence Tests
  // ============================================================================
  describe('persistence', () => {
    it('should persist mutable flags to localStorage', () => {
      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
      
      const stored = localStorage.getItem('osi-cards-feature-flags');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed[OSI_FEATURE_FLAGS.VIRTUAL_SCROLL]).toBe(true);
    });

    it('should not persist immutable flags', () => {
      // PLUGINS is immutable
      const stored = localStorage.getItem('osi-cards-feature-flags');
      const parsed = stored ? JSON.parse(stored) : {};
      
      expect(parsed[OSI_FEATURE_FLAGS.PLUGINS]).toBeUndefined();
    });

    it('should load persisted flags on initialization', () => {
      // Set up localStorage before creating new service
      localStorage.setItem('osi-cards-feature-flags', JSON.stringify({
        [OSI_FEATURE_FLAGS.VIRTUAL_SCROLL]: true,
      }));

      // Create new service instance
      const newService = new FeatureFlagsService();
      
      expect(newService.isEnabled(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
    });
  });

  // ============================================================================
  // State Observable Tests
  // ============================================================================
  describe('flags$', () => {
    it('should emit current flags state', (done) => {
      service.flags$.subscribe(flags => {
        expect(flags instanceof Map).toBe(true);
        done();
      });
    });

    it('should emit updated state when flags change', (done) => {
      let emissions = 0;
      
      service.flags$.subscribe(flags => {
        emissions++;
        if (emissions === 2) {
          expect(flags.get(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL)).toBe(true);
          done();
        }
      });

      service.enable(OSI_FEATURE_FLAGS.VIRTUAL_SCROLL);
    });
  });
});









