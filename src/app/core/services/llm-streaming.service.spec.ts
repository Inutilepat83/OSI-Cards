import { TestBed } from '@angular/core/testing';
import { LLMStreamingService, LLMStreamingState } from './llm-streaming.service';
import { AppConfigService } from './app-config.service';
import { CardBuilder, FieldBuilder, SectionBuilder } from '../../testing/test-builders';
import { AICardConfig } from '../../models';
import { fakeAsync, tick } from '@angular/core/testing';

describe('LLMStreamingService', () => {
  let service: LLMStreamingService;
  let appConfigService: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LLMStreamingService,
        {
          provide: AppConfigService,
          useValue: {
            LLM_SIMULATION: {
              THINKING_DELAY_MS: 100,
              MIN_CHUNK_SIZE: 10,
              MAX_CHUNK_SIZE: 50,
              MIN_CHUNK_DELAY_MS: 20,
              MAX_CHUNK_DELAY_MS: 100,
              FAST_TOKEN_RATE: 0.1,
            },
          },
        },
      ],
    });
    service = TestBed.inject(LLMStreamingService);
    appConfigService = TestBed.inject(AppConfigService);
  });

  afterEach(() => {
    service.stop();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have idle state initially', () => {
      const state = service.getState();
      expect(state.isActive).toBe(false);
      expect(state.stage).toBe('idle');
      expect(state.progress).toBe(0);
    });

    it('should emit initial state', (done) => {
      service.state$.subscribe((state) => {
        expect(state.isActive).toBe(false);
        expect(state.stage).toBe('idle');
        done();
      });
    });
  });

  describe('start', () => {
    it('should start streaming with valid JSON', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section 1').withType('info').build())
        .build();

      const json = JSON.stringify(card);
      service.start(json);

      tick(50);
      const state = service.getState();
      expect(state.isActive).toBe(true);
      expect(state.stage).toBe('thinking');
    }));

    it('should transition to streaming after thinking delay', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      const json = JSON.stringify(card);

      service.start(json);
      tick(100); // Thinking delay

      const state = service.getState();
      expect(state.stage).toBe('streaming');
    }));

    it('should create placeholder card on start', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section').build())
        .build();

      service.start(JSON.stringify(card));
      tick(50);

      const placeholder = service.getPlaceholderCard();
      expect(placeholder).toBeTruthy();
      expect(placeholder?.cardTitle).toContain('Generating');
    }));

    it('should handle empty JSON', () => {
      service.start('');
      const state = service.getState();
      expect(state.stage).toBe('error');
      expect(state.isActive).toBe(false);
    });

    it('should stop previous simulation when starting new one', fakeAsync(() => {
      const card1 = CardBuilder.create().withTitle('Card 1').build();
      const card2 = CardBuilder.create().withTitle('Card 2').build();

      service.start(JSON.stringify(card1));
      tick(50);
      service.start(JSON.stringify(card2));
      tick(50);

      const state = service.getState();
      expect(state.isActive).toBe(true);
    }));
  });

  describe('stop', () => {
    it('should stop active simulation', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      service.start(JSON.stringify(card));
      tick(50);

      service.stop();

      const state = service.getState();
      expect(state.isActive).toBe(false);
      expect(state.stage).toBe('aborted');
    }));

    it('should clear all state on stop', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      service.start(JSON.stringify(card));
      tick(50);

      service.stop();

      expect(service.getPlaceholderCard()).toBeNull();
      const state = service.getState();
      expect(state.bufferLength).toBe(0);
      expect(state.targetLength).toBe(0);
    }));
  });

  describe('chunking', () => {
    it('should create chunks from JSON', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section')
            .withField(FieldBuilder.create().withLabel('Field').withValue('Value').build())
            .build()
        )
        .build();

      const json = JSON.stringify(card);
      service.start(json);
      tick(150);

      // Should have processed some chunks
      const state = service.getState();
      expect(state.bufferLength).toBeGreaterThan(0);
    }));

    it('should emit buffer updates', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      const json = JSON.stringify(card);
      let bufferReceived = false;

      service.bufferUpdates$.subscribe((buffer) => {
        expect(buffer).toBeTruthy();
        bufferReceived = true;
      });

      service.start(json);
      tick(150);

      expect(bufferReceived).toBe(true);
    }));
  });

  describe('card updates', () => {
    it('should emit card updates during streaming', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(
          SectionBuilder.create()
            .withTitle('Section')
            .withField(FieldBuilder.create().withLabel('Field').withValue('Value').build())
            .build()
        )
        .build();

      let updateCount = 0;
      service.cardUpdates$.subscribe((update) => {
        updateCount++;
        expect(update.card).toBeTruthy();
        expect(update.changeType).toBeDefined();
      });

      service.start(JSON.stringify(card));
      tick(200);

      expect(updateCount).toBeGreaterThan(0);
    }));

    it('should complete streaming and emit final card', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section').build())
        .build();

      const json = JSON.stringify(card);
      let finalState: LLMStreamingState | null = null;

      service.state$.subscribe((state) => {
        if (state.stage === 'complete') {
          finalState = state;
        }
      });

      service.start(json);
      // Wait for all chunks to process
      tick(1000);

      expect(finalState).toBeTruthy();
      if (finalState) {
        expect(finalState.progress).toBe(1);
        expect(finalState.isActive).toBe(false);
      }
    }));
  });

  describe('progress tracking', () => {
    it('should update progress during streaming', fakeAsync(() => {
      const card = CardBuilder.create()
        .withTitle('Test Card')
        .withSection(SectionBuilder.create().withTitle('Section').build())
        .build();

      const json = JSON.stringify(card);
      service.start(json);

      tick(100);
      const state1 = service.getState();
      expect(state1.progress).toBeGreaterThanOrEqual(0);

      tick(200);
      const state2 = service.getState();
      expect(state2.progress).toBeGreaterThanOrEqual(state1.progress);
    }));

    it('should have progress of 1 when complete', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      const json = JSON.stringify(card);
      let completed = false;

      service.state$.subscribe((state) => {
        if (state.stage === 'complete') {
          expect(state.progress).toBe(1);
          completed = true;
        }
      });

      service.start(json);
      tick(1000);

      expect(completed).toBe(true);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should stop simulation on destroy', fakeAsync(() => {
      const card = CardBuilder.create().withTitle('Test').build();
      service.start(JSON.stringify(card));
      tick(50);

      service.ngOnDestroy();

      const state = service.getState();
      expect(state.isActive).toBe(false);
    }));
  });
});
