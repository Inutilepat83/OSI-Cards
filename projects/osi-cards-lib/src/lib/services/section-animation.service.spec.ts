import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { SectionAnimationService, DEFAULT_ANIMATION_CONFIG } from './section-animation.service';

describe('SectionAnimationService', () => {
  let service: SectionAnimationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SectionAnimationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(SectionAnimationService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================
  describe('configure', () => {
    it('should merge configuration with defaults', () => {
      service.configure({ staggerDelayMs: 100 });
      
      const config = service.getConfig();
      expect(config.staggerDelayMs).toBe(100);
      expect(config.entranceDurationMs).toBe(DEFAULT_ANIMATION_CONFIG.entranceDurationMs);
    });

    it('should override multiple values', () => {
      service.configure({
        staggerDelayMs: 50,
        entranceDurationMs: 500,
        exitDurationMs: 300
      });

      const config = service.getConfig();
      expect(config.staggerDelayMs).toBe(50);
      expect(config.entranceDurationMs).toBe(500);
      expect(config.exitDurationMs).toBe(300);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = service.getConfig();
      
      expect(config.staggerDelayMs).toBeDefined();
      expect(config.entranceDurationMs).toBeDefined();
      expect(config.exitDurationMs).toBeDefined();
      expect(config.respectReducedMotion).toBeDefined();
    });

    it('should return copy of configuration', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      
      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  // ============================================================================
  // Animation State Management Tests
  // ============================================================================
  describe('markSectionEntering', () => {
    it('should mark section as entering', () => {
      service.markSectionEntering('section-1', 0);
      
      expect(service.getAnimationState('section-1')).toBe('entering');
    });

    it('should skip if section already animated', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      // Try to mark entering again
      service.markSectionEntering('section-1', 1);
      
      // Should still be 'entered', not 'entering'
      expect(service.getAnimationState('section-1')).toBe('entered');
    });

    it('should cap stagger index at 15', () => {
      service.markSectionEntering('section-1', 100);
      
      const delay = service.getStaggerDelay('section-1');
      const expectedMaxDelay = 15 * DEFAULT_ANIMATION_CONFIG.staggerDelayMs;
      
      expect(delay).toBeLessThanOrEqual(expectedMaxDelay);
    });

    it('should add to pending animations', () => {
      service.markSectionEntering('section-1', 0);
      
      expect(service.hasPendingAnimations()).toBe(true);
      expect(service.getPendingCount()).toBe(1);
    });
  });

  describe('markSectionAnimated', () => {
    it('should mark section as animated', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      expect(service.hasAnimated('section-1')).toBe(true);
    });

    it('should remove from pending animations', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      expect(service.hasPendingAnimations()).toBe(false);
    });

    it('should update state to entered', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      expect(service.getAnimationState('section-1')).toBe('entered');
    });
  });

  describe('shouldAnimate', () => {
    it('should return true for entering sections', () => {
      service.markSectionEntering('section-1', 0);
      
      expect(service.shouldAnimate('section-1')).toBe(true);
    });

    it('should return false for already animated sections', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      expect(service.shouldAnimate('section-1')).toBe(false);
    });

    it('should return false for unknown sections', () => {
      expect(service.shouldAnimate('unknown')).toBe(false);
    });

    it('should respect reduced motion preference', () => {
      // Note: This test would require mocking window.matchMedia
      // For now, test the configuration flag
      service.configure({ respectReducedMotion: false });
      service.markSectionEntering('section-1', 0);
      
      expect(service.shouldAnimate('section-1')).toBe(true);
    });
  });

  describe('hasAnimated', () => {
    it('should return true for animated sections', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      
      expect(service.hasAnimated('section-1')).toBe(true);
    });

    it('should return false for non-animated sections', () => {
      expect(service.hasAnimated('section-1')).toBe(false);
    });
  });

  describe('getAnimationState', () => {
    it('should return none for unknown sections', () => {
      expect(service.getAnimationState('unknown')).toBe('none');
    });

    it('should return entering for entering sections', () => {
      service.markSectionEntering('section-1', 0);
      expect(service.getAnimationState('section-1')).toBe('entering');
    });

    it('should return entered for completed sections', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      expect(service.getAnimationState('section-1')).toBe('entered');
    });
  });

  describe('getAnimationClass', () => {
    it('should return empty string for unknown sections', () => {
      expect(service.getAnimationClass('unknown')).toBe('');
    });

    it('should return streaming class for entering sections', () => {
      service.markSectionEntering('section-1', 0);
      expect(service.getAnimationClass('section-1')).toBe('section-streaming');
    });

    it('should return entered class for completed sections', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionAnimated('section-1');
      expect(service.getAnimationClass('section-1')).toBe('section-entered');
    });
  });

  describe('getStaggerDelay', () => {
    it('should return 0 for unknown sections', () => {
      expect(service.getStaggerDelay('unknown')).toBe(0);
    });

    it('should return calculated delay based on index', () => {
      service.markSectionEntering('section-1', 3);
      
      const expectedDelay = 3 * DEFAULT_ANIMATION_CONFIG.staggerDelayMs;
      expect(service.getStaggerDelay('section-1')).toBe(expectedDelay);
    });
  });

  // ============================================================================
  // Batch Operations Tests
  // ============================================================================
  describe('resetAll', () => {
    it('should clear all animation states', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionEntering('section-2', 1);
      service.markSectionAnimated('section-1');
      
      service.resetAll();
      
      expect(service.hasAnimated('section-1')).toBe(false);
      expect(service.getAnimationState('section-2')).toBe('none');
      expect(service.hasPendingAnimations()).toBe(false);
    });
  });

  describe('finalizeAllAnimations', () => {
    it('should mark all pending animations as complete', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionEntering('section-2', 1);
      service.markSectionEntering('section-3', 2);
      
      service.finalizeAllAnimations();
      
      expect(service.hasAnimated('section-1')).toBe(true);
      expect(service.hasAnimated('section-2')).toBe(true);
      expect(service.hasAnimated('section-3')).toBe(true);
      expect(service.hasPendingAnimations()).toBe(false);
    });
  });

  describe('hasPendingAnimations', () => {
    it('should return false when no animations pending', () => {
      expect(service.hasPendingAnimations()).toBe(false);
    });

    it('should return true when animations are pending', () => {
      service.markSectionEntering('section-1', 0);
      expect(service.hasPendingAnimations()).toBe(true);
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 when no animations pending', () => {
      expect(service.getPendingCount()).toBe(0);
    });

    it('should return correct count of pending animations', () => {
      service.markSectionEntering('section-1', 0);
      service.markSectionEntering('section-2', 1);
      service.markSectionEntering('section-3', 2);
      
      expect(service.getPendingCount()).toBe(3);
    });
  });

  // ============================================================================
  // Helper Methods Tests
  // ============================================================================
  describe('isPrefersReducedMotion', () => {
    it('should return boolean value', () => {
      const result = service.isPrefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('calculateTotalDuration', () => {
    it('should calculate total duration including stagger', () => {
      const staggerIndex = 5;
      const expectedDelay = 5 * DEFAULT_ANIMATION_CONFIG.staggerDelayMs;
      const expectedDuration = expectedDelay + DEFAULT_ANIMATION_CONFIG.entranceDurationMs;
      
      expect(service.calculateTotalDuration(staggerIndex)).toBe(expectedDuration);
    });

    it('should cap stagger index at 15', () => {
      const maxStaggerDelay = 15 * DEFAULT_ANIMATION_CONFIG.staggerDelayMs;
      const expectedDuration = maxStaggerDelay + DEFAULT_ANIMATION_CONFIG.entranceDurationMs;
      
      expect(service.calculateTotalDuration(100)).toBe(expectedDuration);
    });
  });

  // ============================================================================
  // Automatic Animation Completion Tests
  // ============================================================================
  describe('automatic animation completion', () => {
    it('should automatically complete animation after delay', fakeAsync(() => {
      service.markSectionEntering('section-1', 0);
      
      expect(service.hasPendingAnimations()).toBe(true);
      
      // Wait for animation to complete
      const totalDuration = service.calculateTotalDuration(0);
      tick(totalDuration + 100);
      
      expect(service.hasAnimated('section-1')).toBe(true);
      expect(service.hasPendingAnimations()).toBe(false);
    }));

    it('should handle multiple sections with different delays', fakeAsync(() => {
      service.markSectionEntering('section-1', 0);
      service.markSectionEntering('section-2', 5);
      
      const duration1 = service.calculateTotalDuration(0);
      const duration2 = service.calculateTotalDuration(5);
      
      // First section should complete first
      tick(duration1 + 50);
      expect(service.hasAnimated('section-1')).toBe(true);
      expect(service.hasAnimated('section-2')).toBe(false);
      
      // Then second section
      tick(duration2 - duration1 + 100);
      expect(service.hasAnimated('section-2')).toBe(true);
    }));
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should clean up resources', fakeAsync(() => {
      service.markSectionEntering('section-1', 0);
      
      service.ngOnDestroy();
      
      // Should not throw errors
      tick(1000);
      expect(service).toBeTruthy();
    }));
  });
});




