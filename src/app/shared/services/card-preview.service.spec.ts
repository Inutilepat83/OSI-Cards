import { TestBed } from '@angular/core/testing';
import { CardPreviewService } from './card-preview.service';
import { CardBuilder } from '../../testing/test-builders';
import { CardChangeType } from '../utils/card-diff.util';

describe('CardPreviewService', () => {
  let service: CardPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardPreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('updateCard', () => {
    it('should update card in state', (done) => {
      const card = CardBuilder.create().withTitle('Test').build();
      
      service.state$.subscribe(state => {
        if (state.card) {
          expect(state.card.cardTitle).toBe('Test');
          done();
        }
      });
      
      service.updateCard(card, 'structural');
    });

    it('should update change type', (done) => {
      const card = CardBuilder.create().withTitle('Test').build();
      
      service.state$.subscribe(state => {
        if (state.changeType === 'content') {
          expect(state.changeType).toBe('content');
          done();
        }
      });
      
      service.updateCard(card, 'content');
    });
  });

  describe('updateLivePreview', () => {
    it('should update live preview card', (done) => {
      const card = CardBuilder.create().withTitle('Live').build();
      
      service.state$.subscribe(state => {
        if (state.livePreviewCard) {
          expect(state.livePreviewCard.cardTitle).toBe('Live');
          done();
        }
      });
      
      service.updateLivePreview(card);
    });
  });

  describe('setGenerating', () => {
    it('should update generating state', (done) => {
      service.state$.subscribe(state => {
        if (state.isGenerating === true) {
          expect(state.isGenerating).toBe(true);
          done();
        }
      });
      
      service.setGenerating(true);
    });
  });

  describe('setInitialized', () => {
    it('should update initialized state', (done) => {
      service.state$.subscribe(state => {
        if (state.isInitialized === true) {
          expect(state.isInitialized).toBe(true);
          done();
        }
      });
      
      service.setInitialized(true);
    });
  });

  describe('toggleFullscreen', () => {
    it('should toggle fullscreen state', () => {
      const initialState = service.getState().isFullscreen;
      service.toggleFullscreen();
      expect(service.getState().isFullscreen).toBe(!initialState);
    });
  });

  describe('setFullscreen', () => {
    it('should set fullscreen state', () => {
      service.setFullscreen(true);
      expect(service.getState().isFullscreen).toBe(true);
      
      service.setFullscreen(false);
      expect(service.getState().isFullscreen).toBe(false);
    });
  });

  describe('clearLivePreview', () => {
    it('should clear live preview', () => {
      const card = CardBuilder.create().withTitle('Test').build();
      service.updateLivePreview(card);
      service.clearLivePreview();
      expect(service.getState().livePreviewCard).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const card = CardBuilder.create().withTitle('Test').build();
      service.updateCard(card);
      service.setGenerating(true);
      service.setFullscreen(true);
      
      service.reset();
      
      const state = service.getState();
      expect(state.card).toBeNull();
      expect(state.isGenerating).toBe(false);
      expect(state.isFullscreen).toBe(false);
      expect(state.livePreviewCard).toBeNull();
    });
  });
});








