import { TestBed } from '@angular/core/testing';
import { MagneticTiltService, MousePosition } from '../../core/services/magnetic-tilt.service';

describe('MagneticTiltService', () => {
  let service: MagneticTiltService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MagneticTiltService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateTilt', () => {
    it('should calculate tilt for element', (done) => {
      const element = document.createElement('div');
      element.style.width = '1000px';
      element.style.height = '800px';
      document.body.appendChild(element);
      
      const mousePos: MousePosition = { x: 500, y: 400 };
      
      service.calculateTilt(mousePos, element);
      
      service.tiltCalculations$.subscribe(calculations => {
        expect(calculations).toBeDefined();
        expect(calculations.rotateX).toBeDefined();
        expect(calculations.rotateY).toBeDefined();
        document.body.removeChild(element);
        done();
      });
    });

    it('should reset tilt when element is null', (done) => {
      const mousePos: MousePosition = { x: 500, y: 400 };
      
      service.calculateTilt(mousePos, null);
      
      service.tiltCalculations$.subscribe(calculations => {
        expect(calculations.rotateX).toBe(0);
        expect(calculations.rotateY).toBe(0);
        done();
      });
    });
  });

  describe('tiltCalculations$', () => {
    it('should emit tilt calculations', (done) => {
      service.tiltCalculations$.subscribe(calculations => {
        expect(calculations).toBeDefined();
        expect(calculations).toHaveProperty('rotateX');
        expect(calculations).toHaveProperty('rotateY');
        expect(calculations).toHaveProperty('glowBlur');
        expect(calculations).toHaveProperty('glowOpacity');
        expect(calculations).toHaveProperty('reflectionOpacity');
        done();
      });
    });
  });
});

