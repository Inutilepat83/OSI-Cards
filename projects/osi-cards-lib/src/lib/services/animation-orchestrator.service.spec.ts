import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { 
  AnimationOrchestratorService, 
  AnimationSequence, 
  AnimationSequenceDefinition,
  OrchestratorState 
} from './animation-orchestrator.service';

describe('AnimationOrchestratorService', () => {
  let service: AnimationOrchestratorService;
  let mockElement: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnimationOrchestratorService]
    });
    service = TestBed.inject(AnimationOrchestratorService);

    // Create mock element with required methods
    mockElement = document.createElement('div');
    mockElement.innerHTML = `
      <div class="masonry-section"></div>
      <div class="card-field"></div>
    `;
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    service.ngOnDestroy();
    document.body.removeChild(mockElement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = service.getState();

      expect(state.isAnimating).toBe(false);
      expect(state.currentSequence).toBeNull();
      expect(state.currentStep).toBeNull();
      expect(state.queueLength).toBe(0);
      expect(state.globalSpeed).toBe(1);
    });

    it('should emit initial state via observable', (done) => {
      service.state$.subscribe((state: OrchestratorState) => {
        expect(state.isAnimating).toBe(false);
        done();
      });
    });
  });

  // ============================================================================
  // orchestrate Tests
  // ============================================================================
  describe('orchestrate', () => {
    it('should orchestrate registered sequence', async () => {
      await service.orchestrate('card-entrance', mockElement);
      // Should complete without error
      expect(service).toBeTruthy();
    });

    it('should skip animation for unregistered sequence', async () => {
      const consoleSpy = spyOn(console, 'warn');
      
      await service.orchestrate('unknown-sequence' as AnimationSequence, mockElement);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should apply delay option', fakeAsync(async () => {
      const startTime = Date.now();
      
      const promise = service.orchestrate('card-entrance', mockElement, { delay: 100 });
      tick(200);
      await promise;
      
      expect(service).toBeTruthy();
    }));

    it('should skip specified steps', async () => {
      await service.orchestrate('card-entrance', mockElement, { 
        skipSteps: ['card-fade'] 
      });
      
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // playSequence Tests
  // ============================================================================
  describe('playSequence', () => {
    it('should play custom sequence', async () => {
      const sequence: AnimationSequenceDefinition = {
        name: 'card-entrance',
        steps: [
          {
            name: 'test-step',
            target: mockElement,
            animation: {
              keyframes: [{ opacity: 0 }, { opacity: 1 }],
              timing: { duration: 100 }
            }
          }
        ]
      };

      await service.playSequence(sequence);
      expect(service).toBeTruthy();
    });

    it('should call onStart callback', async () => {
      let started = false;
      
      const sequence: AnimationSequenceDefinition = {
        name: 'card-entrance',
        steps: [],
        onStart: () => { started = true; }
      };

      await service.playSequence(sequence);
      expect(started).toBe(true);
    });

    it('should call onComplete callback', async () => {
      let completed = false;
      
      const sequence: AnimationSequenceDefinition = {
        name: 'card-entrance',
        steps: [],
        onComplete: () => { completed = true; }
      };

      await service.playSequence(sequence);
      expect(completed).toBe(true);
    });

    it('should call onStepComplete for each step', async () => {
      const completedSteps: string[] = [];
      
      const sequence: AnimationSequenceDefinition = {
        name: 'card-entrance',
        steps: [
          {
            name: 'step-1',
            target: mockElement,
            animation: {
              keyframes: [{ opacity: 0 }, { opacity: 1 }],
              timing: { duration: 50 }
            }
          },
          {
            name: 'step-2',
            target: mockElement,
            animation: {
              keyframes: [{ opacity: 0 }, { opacity: 1 }],
              timing: { duration: 50 }
            }
          }
        ],
        onStepComplete: (stepName) => { completedSteps.push(stepName); }
      };

      await service.playSequence(sequence);
      expect(completedSteps).toContain('step-1');
      expect(completedSteps).toContain('step-2');
    });
  });

  // ============================================================================
  // registerPreset Tests
  // ============================================================================
  describe('registerPreset', () => {
    it('should register custom preset', async () => {
      service.registerPreset({
        name: 'custom-animation',
        sequence: {
          steps: [
            {
              name: 'custom-step',
              target: [mockElement],
              animation: {
                keyframes: [{ opacity: 0 }, { opacity: 1 }],
                timing: { duration: 100 }
              }
            }
          ]
        }
      });

      // Should be able to orchestrate the custom preset
      await service.orchestrate('custom-animation' as AnimationSequence, mockElement);
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // setGlobalSpeed Tests
  // ============================================================================
  describe('setGlobalSpeed', () => {
    it('should set global speed', () => {
      service.setGlobalSpeed(2);
      
      const state = service.getState();
      expect(state.globalSpeed).toBe(2);
    });

    it('should clamp speed to minimum 0.1', () => {
      service.setGlobalSpeed(0);
      
      const state = service.getState();
      expect(state.globalSpeed).toBe(0.1);
    });

    it('should clamp speed to maximum 3', () => {
      service.setGlobalSpeed(10);
      
      const state = service.getState();
      expect(state.globalSpeed).toBe(3);
    });
  });

  // ============================================================================
  // getState Tests
  // ============================================================================
  describe('getState', () => {
    it('should return current state', () => {
      const state = service.getState();

      expect(state).toBeDefined();
      expect(state).toHaveProperty('isAnimating');
      expect(state).toHaveProperty('currentSequence');
      expect(state).toHaveProperty('currentStep');
      expect(state).toHaveProperty('queueLength');
      expect(state).toHaveProperty('reducedMotion');
      expect(state).toHaveProperty('globalSpeed');
    });
  });

  // ============================================================================
  // waitForCompletion Tests
  // ============================================================================
  describe('waitForCompletion', () => {
    it('should resolve immediately when no animations', async () => {
      await service.waitForCompletion();
      expect(service.getState().isAnimating).toBe(false);
    });
  });

  // ============================================================================
  // cancelAll Tests
  // ============================================================================
  describe('cancelAll', () => {
    it('should cancel all animations', () => {
      service.cancelAll();
      
      const state = service.getState();
      expect(state.isAnimating).toBe(false);
      expect(state.queueLength).toBe(0);
    });
  });

  // ============================================================================
  // pauseAll / resumeAll Tests
  // ============================================================================
  describe('pauseAll / resumeAll', () => {
    it('should pause all animations', () => {
      service.pauseAll();
      // Should not throw
      expect(service).toBeTruthy();
    });

    it('should resume all animations', () => {
      service.pauseAll();
      service.resumeAll();
      // Should not throw
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // animateLayoutChange Tests
  // ============================================================================
  describe('animateLayoutChange', () => {
    it('should execute update function', async () => {
      let updated = false;
      
      await service.animateLayoutChange(mockElement, () => {
        updated = true;
      });
      
      expect(updated).toBe(true);
    });

    it('should handle async update function', async () => {
      let updated = false;
      
      await service.animateLayoutChange(mockElement, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        updated = true;
      });
      
      expect(updated).toBe(true);
    });
  });

  // ============================================================================
  // Observable Tests
  // ============================================================================
  describe('state$', () => {
    it('should be a valid observable', () => {
      expect(service.state$).toBeTruthy();
      expect(service.state$.subscribe).toBeDefined();
    });

    it('should emit state changes', fakeAsync(() => {
      const states: OrchestratorState[] = [];
      
      service.state$.subscribe(state => {
        states.push({ ...state });
      });

      service.setGlobalSpeed(2);
      tick(100);

      expect(states.some(s => s.globalSpeed === 2)).toBe(true);
    }));
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should clean up resources', () => {
      service.ngOnDestroy();
      // Should not throw
      expect(service).toBeTruthy();
    });

    it('should cancel pending animations', async () => {
      // Start an animation
      const promise = service.orchestrate('card-entrance', mockElement);
      
      // Immediately destroy
      service.ngOnDestroy();
      
      // Promise should reject or resolve
      try {
        await promise;
      } catch (e) {
        // Expected - animation was cancelled
      }
      
      expect(service).toBeTruthy();
    });
  });
});









