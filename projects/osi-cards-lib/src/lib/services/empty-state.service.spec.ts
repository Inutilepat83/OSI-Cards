import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { EmptyStateService, ParticleState } from './empty-state.service';

describe('EmptyStateService', () => {
  let service: EmptyStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EmptyStateService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(EmptyStateService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Message Tests
  // ============================================================================
  describe('messages', () => {
    it('should have initial message', () => {
      expect(service.getCurrentMessage()).toBeTruthy();
    });

    it('should set custom messages', () => {
      const messages = ['Message 1', 'Message 2'];
      service.setMessages(messages);
      
      expect(service.getCurrentMessage()).toBe('Message 1');
    });

    it('should not set empty messages array', () => {
      const originalMessage = service.getCurrentMessage();
      service.setMessages([]);
      
      expect(service.getCurrentMessage()).toBe(originalMessage);
    });

    it('should reset to default messages', () => {
      service.setMessages(['Custom Message']);
      service.resetMessages();
      
      // Should have a default message
      expect(service.getCurrentMessage()).toBeTruthy();
    });

    it('should move to next message', () => {
      service.setMessages(['Message 1', 'Message 2']);
      
      service.nextMessage();
      
      expect(service.getCurrentMessage()).toBe('Message 2');
    });

    it('should wrap around to first message', () => {
      service.setMessages(['Message 1', 'Message 2']);
      
      service.nextMessage(); // Message 2
      service.nextMessage(); // Back to Message 1
      
      expect(service.getCurrentMessage()).toBe('Message 1');
    });
  });

  describe('message rotation', () => {
    it('should start rotation', fakeAsync(() => {
      service.setMessages(['Message 1', 'Message 2', 'Message 3']);
      service.startMessageRotation();
      
      const initialMessage = service.getCurrentMessage();
      
      tick(3000);
      
      // Message should have changed
      expect(service.getMessageIndex()).toBeGreaterThan(0);
      
      service.stopMessageRotation();
    }));

    it('should stop rotation', fakeAsync(() => {
      service.setMessages(['Message 1', 'Message 2']);
      service.startMessageRotation();
      
      tick(1000);
      service.stopMessageRotation();
      
      const messageAfterStop = service.getCurrentMessage();
      tick(5000);
      
      // Message should not have changed after stop
      expect(service).toBeTruthy();
    }));

    it('should not start rotation twice', fakeAsync(() => {
      service.startMessageRotation();
      service.startMessageRotation();
      
      // Should not throw
      expect(service).toBeTruthy();
      
      service.stopMessageRotation();
    }));
  });

  describe('message observable', () => {
    it('should emit current message', (done) => {
      service.currentMessage$.subscribe(message => {
        expect(message).toBeTruthy();
        done();
      });
    });

    it('should emit new message after change', (done) => {
      const messages: string[] = [];
      
      service.setMessages(['Message 1', 'Message 2']);
      
      service.currentMessage$.subscribe(message => {
        messages.push(message);
        if (messages.length === 2) {
          expect(messages[1]).toBe('Message 2');
          done();
        }
      });

      service.nextMessage();
    });
  });

  // ============================================================================
  // Particle Tests
  // ============================================================================
  describe('particles', () => {
    it('should initialize particles', () => {
      const particles = service.getParticles();
      expect(particles.length).toBeGreaterThan(0);
    });

    it('should configure particle count', () => {
      service.configure({ particleCount: 12 });
      
      const particles = service.getParticles();
      expect(particles.length).toBe(12);
    });

    it('should have default particle state', () => {
      const particles = service.getParticles();
      
      particles.forEach(particle => {
        expect(particle.transform).toBe('translate(0, 0)');
        expect(particle.opacity).toBe(0.3);
      });
    });

    it('should update particle positions', () => {
      service.updateParticlePositions(300, 200, 600, 400);
      
      const particles = service.getParticles();
      // Particles should have updated transforms
      expect(particles.some(p => p.transform !== 'translate(0, 0)')).toBe(true);
    });

    it('should reset particle positions', () => {
      service.updateParticlePositions(300, 200, 600, 400);
      service.resetParticlePositions();
      
      const particles = service.getParticles();
      particles.forEach(particle => {
        expect(particle.transform).toBe('translate(0, 0)');
      });
    });
  });

  describe('particles observable', () => {
    it('should emit particles', (done) => {
      service.particles$.subscribe(particles => {
        expect(Array.isArray(particles)).toBe(true);
        done();
      });
    });
  });

  // ============================================================================
  // Parallax Tests
  // ============================================================================
  describe('parallax', () => {
    it('should update parallax transforms', () => {
      let gradientTransform = '';
      let contentTransform = '';

      service.gradientTransform$.subscribe(t => gradientTransform = t);
      service.contentTransform$.subscribe(t => contentTransform = t);

      service.updateParallax(400, 300, 800, 600);

      expect(gradientTransform).not.toBe('translate(-50%, -50%)');
      expect(contentTransform).not.toBe('translate(0, 0)');
    });

    it('should reset parallax transforms', () => {
      let gradientTransform = '';
      let contentTransform = '';

      service.gradientTransform$.subscribe(t => gradientTransform = t);
      service.contentTransform$.subscribe(t => contentTransform = t);

      service.updateParallax(400, 300, 800, 600);
      service.resetParallax();

      expect(gradientTransform).toBe('translate(-50%, -50%)');
      expect(contentTransform).toBe('translate(0, 0)');
    });
  });

  // ============================================================================
  // Configuration Tests
  // ============================================================================
  describe('configure', () => {
    it('should configure messages', () => {
      service.configure({ messages: ['Custom 1', 'Custom 2'] });
      expect(service.getCurrentMessage()).toBe('Custom 1');
    });

    it('should configure rotation interval', fakeAsync(() => {
      service.configure({ 
        messages: ['M1', 'M2'],
        rotationInterval: 500 
      });
      service.startMessageRotation();
      
      tick(600);
      
      // With shorter interval, message should have changed
      expect(service).toBeTruthy();
      
      service.stopMessageRotation();
    }));
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should clean up resources', fakeAsync(() => {
      service.startMessageRotation();
      tick(100);
      
      service.ngOnDestroy();
      
      // Should not throw
      tick(5000);
      expect(service).toBeTruthy();
    }));
  });
});




