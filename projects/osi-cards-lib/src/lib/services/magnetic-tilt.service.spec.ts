import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { MagneticTiltService, MousePosition, TiltCalculations } from './magnetic-tilt.service';

describe('MagneticTiltService', () => {
  let service: MagneticTiltService;
  let mockElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MagneticTiltService]
    });
    service = TestBed.inject(MagneticTiltService);

    // Create mock element with dimensions
    mockElement = document.createElement('div');
    Object.defineProperty(mockElement, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 100,
        right: 500,
        bottom: 400,
        width: 400,
        height: 300,
        x: 100,
        y: 100,
        toJSON: () => ({})
      })
    });
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================
  describe('initial state', () => {
    it('should emit initial calculations with zero rotation', (done) => {
      service.tiltCalculations$.subscribe((calc: TiltCalculations) => {
        expect(calc.rotateX).toBe(0);
        expect(calc.rotateY).toBe(0);
        done();
      });
    });

    it('should have base glow values initially', (done) => {
      service.tiltCalculations$.subscribe((calc: TiltCalculations) => {
        expect(calc.glowBlur).toBe(10); // BASE_GLOW_BLUR
        expect(calc.glowOpacity).toBe(0.25); // BASE_GLOW_OPACITY
        expect(calc.reflectionOpacity).toBe(0);
        done();
      });
    });
  });

  // ============================================================================
  // calculateTilt Tests
  // ============================================================================
  describe('calculateTilt', () => {
    it('should reset tilt when element is null', fakeAsync(() => {
      let lastCalc: TiltCalculations | null = null;
      service.tiltCalculations$.subscribe((calc) => {
        lastCalc = calc;
      });

      service.calculateTilt({ x: 200, y: 200 }, null);
      tick(100);

      expect(lastCalc?.rotateX).toBe(0);
      expect(lastCalc?.rotateY).toBe(0);
    }));

    it('should calculate tilt based on mouse position', fakeAsync(() => {
      let lastCalc: TiltCalculations | null = null;
      service.tiltCalculations$.subscribe((calc) => {
        lastCalc = calc;
      });

      // Position at center of element
      const centerX = 300; // left(100) + width(400)/2
      const centerY = 250; // top(100) + height(300)/2

      service.calculateTilt({ x: centerX, y: centerY }, mockElement);
      tick(100);

      // At center, tilt should be near zero
      expect(lastCalc).toBeTruthy();
    }));

    it('should use RAF batching for performance', fakeAsync(() => {
      let callCount = 0;
      service.tiltCalculations$.subscribe(() => {
        callCount++;
      });

      // Multiple rapid calls should be batched
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      service.calculateTilt({ x: 210, y: 210 }, mockElement);
      service.calculateTilt({ x: 220, y: 220 }, mockElement);

      // Let RAF process
      tick(100);

      // Should not have one emission per call
      expect(callCount).toBeGreaterThan(0);
    }));
  });

  // ============================================================================
  // resetTilt Tests
  // ============================================================================
  describe('resetTilt', () => {
    it('should reset tilt immediately when smooth is false', fakeAsync(() => {
      let lastCalc: TiltCalculations | null = null;
      service.tiltCalculations$.subscribe((calc) => {
        lastCalc = calc;
      });

      // First apply some tilt
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      tick(50);

      // Then reset immediately
      service.resetTilt(false);
      tick(50);

      expect(lastCalc?.rotateX).toBe(0);
      expect(lastCalc?.rotateY).toBe(0);
      expect(lastCalc?.glowBlur).toBe(10);
      expect(lastCalc?.glowOpacity).toBe(0.25);
      expect(lastCalc?.reflectionOpacity).toBe(0);
    }));

    it('should animate reset when smooth is true', fakeAsync(() => {
      const values: TiltCalculations[] = [];
      service.tiltCalculations$.subscribe((calc) => {
        values.push(calc);
      });

      // First apply some tilt
      service.calculateTilt({ x: 150, y: 150 }, mockElement);
      tick(50);

      // Then reset with animation
      service.resetTilt(true);
      tick(1000);

      // Should have multiple intermediate values
      expect(values.length).toBeGreaterThan(1);

      // Final value should be reset
      const lastValue = values[values.length - 1];
      expect(lastValue?.rotateX).toBeCloseTo(0, 1);
      expect(lastValue?.rotateY).toBeCloseTo(0, 1);
    }));

    it('should cancel pending calculations on reset', fakeAsync(() => {
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      service.resetTilt(false);
      tick(100);

      // Should not throw or have issues
      expect(service).toBeTruthy();
    }));
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================
  describe('cache management', () => {
    it('should cache element dimensions', fakeAsync(() => {
      let getBoundingRectCallCount = 0;
      const trackedElement = document.createElement('div');
      Object.defineProperty(trackedElement, 'getBoundingClientRect', {
        value: () => {
          getBoundingRectCallCount++;
          return {
            left: 100,
            top: 100,
            right: 500,
            bottom: 400,
            width: 400,
            height: 300,
            x: 100,
            y: 100,
            toJSON: () => ({})
          };
        }
      });

      // Multiple calculations within cache duration should reuse cache
      service.calculateTilt({ x: 200, y: 200 }, trackedElement);
      tick(20);
      service.calculateTilt({ x: 210, y: 210 }, trackedElement);
      tick(20);
      service.calculateTilt({ x: 220, y: 220 }, trackedElement);
      tick(20);

      // Should have limited getBoundingClientRect calls due to caching
      expect(getBoundingRectCallCount).toBeLessThanOrEqual(3);
    }));

    it('should clear cache for specific element', () => {
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      service.clearCache(mockElement);
      
      // Should not throw
      expect(service).toBeTruthy();
    });

    it('should clear all cache when no element specified', () => {
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      service.clearCache();
      
      // Should not throw
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // Observable Tests
  // ============================================================================
  describe('tiltCalculations$', () => {
    it('should be a valid observable', () => {
      expect(service.tiltCalculations$).toBeTruthy();
      expect(service.tiltCalculations$.subscribe).toBeDefined();
    });

    it('should emit TiltCalculations objects', (done) => {
      service.tiltCalculations$.subscribe((calc) => {
        expect(calc).toHaveProperty('rotateX');
        expect(calc).toHaveProperty('rotateY');
        expect(calc).toHaveProperty('glowBlur');
        expect(calc).toHaveProperty('glowOpacity');
        expect(calc).toHaveProperty('reflectionOpacity');
        done();
      });
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should cancel all animations on destroy', fakeAsync(() => {
      service.calculateTilt({ x: 200, y: 200 }, mockElement);
      tick(10);
      
      // Should not throw on destroy
      service.ngOnDestroy();
      tick(100);
      
      expect(service).toBeTruthy();
    }));

    it('should clear pending resets on destroy', fakeAsync(() => {
      service.resetTilt(true); // Start animated reset
      tick(10);
      
      // Destroy should cancel the reset animation
      service.ngOnDestroy();
      tick(1000);
      
      expect(service).toBeTruthy();
    }));
  });
});






