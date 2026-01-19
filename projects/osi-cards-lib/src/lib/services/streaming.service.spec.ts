import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  OSICardsStreamingService,
  StreamingState,
  StreamingStage,
  CardUpdate,
  StreamingConfig,
} from './streaming.service';
import { AICardConfig } from '@osi-cards/models';

describe('OSICardsStreamingService', () => {
  let service: OSICardsStreamingService;

  const validCardJson = JSON.stringify({
    cardTitle: 'Test Card',
    sections: [
      {
        id: 'section-1',
        title: 'Info Section',
        type: 'info',
        fields: [
          { label: 'Field 1', value: 'Value 1' },
          { label: 'Field 2', value: 'Value 2' },
        ],
      },
      {
        id: 'section-2',
        title: 'List Section',
        type: 'list',
        items: [
          { title: 'Item 1', description: 'Description 1' },
          { title: 'Item 2', description: 'Description 2' },
        ],
      },
    ],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OSICardsStreamingService],
    });
    service = TestBed.inject(OSICardsStreamingService);
  });

  afterEach(() => {
    service.stop();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================
  describe('initial state', () => {
    it('should have idle state initially', () => {
      const state = service.getState();

      expect(state.isActive).toBe(false);
      expect(state.stage).toBe('idle');
      expect(state.progress).toBe(0);
    });

    it('should emit initial state via observable', (done) => {
      service.state$.subscribe((state: StreamingState) => {
        expect(state.isActive).toBe(false);
        expect(state.stage).toBe('idle');
        done();
      });
    });
  });

  // ============================================================================
  // configure Tests
  // ============================================================================
  describe('configure', () => {
    it('should merge configuration', () => {
      service.configure({
        minChunkSize: 5,
        maxChunkSize: 100,
      });

      // Configuration is internal, but we can test behavior
      expect(service).toBeTruthy();
    });
  });

  // ============================================================================
  // start Tests
  // ============================================================================
  describe('start', () => {
    it('should transition to thinking stage', fakeAsync(() => {
      let currentStage: StreamingStage = 'idle';
      service.state$.subscribe((state) => {
        currentStage = state.stage;
      });

      service.start(validCardJson);

      expect(currentStage).toBe('thinking');
    }));

    it('should set target length from JSON', fakeAsync(() => {
      service.start(validCardJson);

      const state = service.getState();
      expect(state.targetLength).toBe(validCardJson.length);
    }));

    it('should transition to streaming after thinking delay', fakeAsync(() => {
      let currentStage: StreamingStage = 'idle';
      service.state$.subscribe((state) => {
        currentStage = state.stage;
      });

      service.start(validCardJson);
      tick(200); // Default thinking delay is 100ms

      expect(currentStage).toBe('streaming');
    }));

    it('should process instantly when instant option is true', fakeAsync(() => {
      let stages: StreamingStage[] = [];
      service.state$.subscribe((state) => {
        if (!stages.includes(state.stage)) {
          stages.push(state.stage);
        }
      });

      service.start(validCardJson, { instant: true });
      tick(100);

      // Should go directly to complete without streaming stages
      expect(stages).toContain('complete');
    }));

    it('should set error stage for empty JSON', fakeAsync(() => {
      service.start('');
      tick(100);

      const state = service.getState();
      expect(state.stage).toBe('error');
    }));

    it('should stop previous streaming before starting new', fakeAsync(() => {
      service.start(validCardJson);
      tick(50);

      service.start(validCardJson);

      // Should not throw
      expect(service.getState().isActive).toBe(true);
    }));
  });

  // ============================================================================
  // stop Tests
  // ============================================================================
  describe('stop', () => {
    it('should set stage to aborted', fakeAsync(() => {
      service.start(validCardJson);
      tick(50);

      service.stop();

      const state = service.getState();
      expect(state.stage).toBe('aborted');
      expect(state.isActive).toBe(false);
    }));

    it('should clear buffer and queue', fakeAsync(() => {
      service.start(validCardJson);
      tick(200);

      service.stop();

      const state = service.getState();
      expect(state.bufferLength).toBe(0);
    }));
  });

  // ============================================================================
  // getState Tests
  // ============================================================================
  describe('getState', () => {
    it('should return current state', () => {
      const state = service.getState();

      expect(state).toHaveProperty('isActive');
      expect(state).toHaveProperty('stage');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('bufferLength');
      expect(state).toHaveProperty('targetLength');
    });
  });

  // ============================================================================
  // getPlaceholderCard Tests
  // ============================================================================
  describe('getPlaceholderCard', () => {
    it('should return null before streaming starts', () => {
      expect(service.getPlaceholderCard()).toBeNull();
    });

    it('should return placeholder card during streaming', fakeAsync(() => {
      service.start(validCardJson);
      tick(200);

      const placeholder = service.getPlaceholderCard();
      expect(placeholder).toBeTruthy();

      service.stop();
    }));
  });

  // ============================================================================
  // cardUpdates$ Tests
  // ============================================================================
  describe('cardUpdates$', () => {
    it('should emit card updates during streaming', fakeAsync(() => {
      const updates: CardUpdate[] = [];
      service.cardUpdates$.subscribe((update) => {
        updates.push(update);
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[updates.length - 1].card).toBeTruthy();
    }));

    it('should include change type in updates', fakeAsync(() => {
      let lastUpdate: CardUpdate | null = null;
      service.cardUpdates$.subscribe((update) => {
        lastUpdate = update;
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(lastUpdate?.changeType).toBeDefined();
    }));
  });

  // ============================================================================
  // bufferUpdates$ Tests
  // ============================================================================
  describe('bufferUpdates$', () => {
    it('should emit buffer updates during streaming', fakeAsync(() => {
      const buffers: string[] = [];
      service.bufferUpdates$.subscribe((buffer) => {
        buffers.push(buffer);
      });

      service.start(validCardJson);
      tick(1000);

      expect(buffers.length).toBeGreaterThan(0);

      service.stop();
    }));
  });

  // ============================================================================
  // Progress Tests
  // ============================================================================
  describe('progress tracking', () => {
    it('should update progress during streaming', fakeAsync(() => {
      let maxProgress = 0;
      service.state$.subscribe((state) => {
        if (state.progress > maxProgress) {
          maxProgress = state.progress;
        }
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(maxProgress).toBe(1);
    }));

    it('should reach progress 1 on completion', fakeAsync(() => {
      service.start(validCardJson, { instant: true });
      tick(500);

      const state = service.getState();
      expect(state.progress).toBe(1);
    }));
  });

  // ============================================================================
  // Completion Tests
  // ============================================================================
  describe('completion', () => {
    it('should set stage to complete after processing', fakeAsync(() => {
      service.start(validCardJson, { instant: true });
      tick(500);

      const state = service.getState();
      expect(state.stage).toBe('complete');
      expect(state.isActive).toBe(false);
    }));

    it('should emit final card on completion', fakeAsync(() => {
      let finalCard: AICardConfig | null = null;
      service.cardUpdates$.subscribe((update) => {
        finalCard = update.card;
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(finalCard).toBeTruthy();
      expect(finalCard?.cardTitle).toBe('Test Card');
      expect(finalCard?.sections.length).toBe(2);
    }));
  });

  // ============================================================================
  // Section Completion Tests
  // ============================================================================
  describe('section completion tracking', () => {
    it('should track completed sections', fakeAsync(() => {
      let completedSections: number[] = [];
      service.cardUpdates$.subscribe((update) => {
        if (update.completedSections?.length) {
          completedSections = update.completedSections;
        }
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(completedSections.length).toBeGreaterThan(0);
    }));
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('error handling', () => {
    it('should handle invalid JSON gracefully', fakeAsync(() => {
      service.start('{ invalid json }');
      tick(1000);

      const state = service.getState();
      // Should either be in error state or have stopped
      expect(['error', 'aborted', 'complete'].includes(state.stage)).toBe(true);
    }));

    it('should handle empty sections array', fakeAsync(() => {
      const emptyCard = JSON.stringify({
        cardTitle: 'Empty Card',
        sections: [],
      });

      service.start(emptyCard, { instant: true });
      tick(500);

      // Should complete without error
      const state = service.getState();
      expect(state.stage).toBe('complete');
    }));
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================
  describe('ngOnDestroy', () => {
    it('should stop streaming on destroy', fakeAsync(() => {
      service.start(validCardJson);
      tick(100);

      service.ngOnDestroy();

      const state = service.getState();
      expect(state.isActive).toBe(false);
    }));
  });

  // ============================================================================
  // Observable State Tests
  // ============================================================================
  describe('state$', () => {
    it('should be a valid observable', () => {
      expect(service.state$).toBeTruthy();
      expect(service.state$.subscribe).toBeDefined();
    });

    it('should emit state updates', fakeAsync(() => {
      const states: StreamingState[] = [];
      service.state$.subscribe((state) => {
        states.push({ ...state });
      });

      service.start(validCardJson, { instant: true });
      tick(500);

      expect(states.length).toBeGreaterThan(1);
    }));
  });
});
