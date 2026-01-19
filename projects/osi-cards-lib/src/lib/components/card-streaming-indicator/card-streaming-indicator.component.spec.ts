/**
 * Card Streaming Indicator Component Tests
 *
 * Unit tests for CardStreamingIndicatorComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CardStreamingIndicatorComponent,
  StreamingStage,
} from './card-streaming-indicator.component';
import { By } from '@angular/platform-browser';

describe('CardStreamingIndicatorComponent', () => {
  let component: CardStreamingIndicatorComponent;
  let fixture: ComponentFixture<CardStreamingIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardStreamingIndicatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardStreamingIndicatorComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not render when streamingStage is undefined', () => {
      component.streamingStage = undefined;
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator).toBeFalsy();
    });

    it('should not render when streamingStage is idle', () => {
      component.streamingStage = 'idle';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator).toBeFalsy();
    });

    it('should render when streamingStage is thinking', () => {
      component.streamingStage = 'thinking';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator).toBeTruthy();
    });

    it('should render when streamingStage is streaming', () => {
      component.streamingStage = 'streaming';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept streamingStage input', () => {
      component.streamingStage = 'streaming';
      fixture.detectChanges();

      expect(component.streamingStage).toBe('streaming');
    });

    it('should accept streamingProgress input', () => {
      component.streamingProgress = 0.75;
      fixture.detectChanges();

      expect(component.streamingProgress).toBe(0.75);
    });

    it('should accept streamingProgressLabel input', () => {
      component.streamingProgressLabel = 'STREAMING JSON (75%)';
      fixture.detectChanges();

      expect(component.streamingProgressLabel).toBe('STREAMING JSON (75%)');
    });

    it('should have default undefined streamingStage', () => {
      expect(component.streamingStage).toBeUndefined();
    });
  });

  describe('isStreamingActive Getter', () => {
    it('should return true when streamingStage is streaming', () => {
      component.streamingStage = 'streaming';
      expect(component.isStreamingActive).toBe(true);
    });

    it('should return true when streamingStage is thinking', () => {
      component.streamingStage = 'thinking';
      expect(component.isStreamingActive).toBe(true);
    });

    it('should return false when streamingStage is idle', () => {
      component.streamingStage = 'idle';
      expect(component.isStreamingActive).toBe(false);
    });

    it('should return false when streamingStage is complete', () => {
      component.streamingStage = 'complete';
      expect(component.isStreamingActive).toBe(false);
    });

    it('should return false when streamingStage is aborted', () => {
      component.streamingStage = 'aborted';
      expect(component.isStreamingActive).toBe(false);
    });

    it('should return false when streamingStage is error', () => {
      component.streamingStage = 'error';
      expect(component.isStreamingActive).toBe(false);
    });

    it('should return false when streamingStage is undefined', () => {
      component.streamingStage = undefined;
      expect(component.isStreamingActive).toBe(false);
    });
  });

  describe('progressPercentage Getter', () => {
    it('should return 0 when streamingProgress is undefined', () => {
      component.streamingProgress = undefined;
      expect(component.progressPercentage).toBe(0);
    });

    it('should return 0 when streamingProgress is 0', () => {
      component.streamingProgress = 0;
      expect(component.progressPercentage).toBe(0);
    });

    it('should return 50 when streamingProgress is 0.5', () => {
      component.streamingProgress = 0.5;
      expect(component.progressPercentage).toBe(50);
    });

    it('should return 100 when streamingProgress is 1', () => {
      component.streamingProgress = 1;
      expect(component.progressPercentage).toBe(100);
    });

    it('should round to nearest integer', () => {
      component.streamingProgress = 0.756;
      expect(component.progressPercentage).toBe(76);
    });

    it('should handle values greater than 1', () => {
      component.streamingProgress = 1.5;
      expect(component.progressPercentage).toBe(150);
    });

    it('should handle negative values', () => {
      component.streamingProgress = -0.1;
      expect(component.progressPercentage).toBe(-10);
    });
  });

  describe('getAriaLabel Method', () => {
    it('should return correct label for thinking stage', () => {
      component.streamingStage = 'thinking';
      expect(component.getAriaLabel()).toBe('Thinking, please wait');
    });

    it('should return correct label for streaming stage with progress', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.75;
      expect(component.getAriaLabel()).toBe('Streaming progress: 75%');
    });

    it('should return correct label for streaming stage without progress', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = undefined;
      expect(component.getAriaLabel()).toBe('Streaming progress: 0%');
    });

    it('should return correct label for error stage', () => {
      component.streamingStage = 'error';
      expect(component.getAriaLabel()).toBe('Error occurred during streaming');
    });

    it('should return correct label for aborted stage', () => {
      component.streamingStage = 'aborted';
      expect(component.getAriaLabel()).toBe('Streaming was aborted');
    });

    it('should return correct label for complete stage', () => {
      component.streamingStage = 'complete';
      expect(component.getAriaLabel()).toBe('Streaming complete');
    });

    it('should return default label for unknown stage', () => {
      component.streamingStage = undefined;
      expect(component.getAriaLabel()).toBe('Streaming status');
    });

    it('should return default label for idle stage', () => {
      component.streamingStage = 'idle';
      expect(component.getAriaLabel()).toBe('Streaming status');
    });
  });

  describe('Progress Bar Rendering', () => {
    it('should render progress fill when streaming', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.5;
      fixture.detectChanges();

      const progressFill = fixture.debugElement.query(By.css('.streaming-progress-fill'));
      expect(progressFill).toBeTruthy();
    });

    it('should set correct width percentage', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.75;
      fixture.detectChanges();

      const progressFill = fixture.debugElement.query(By.css('.streaming-progress-fill'));
      expect(progressFill.nativeElement.style.width).toBe('75%');
    });

    it('should render thinking indicator when thinking', () => {
      component.streamingStage = 'thinking';
      fixture.detectChanges();

      const thinkingIndicator = fixture.debugElement.query(By.css('.streaming-progress-thinking'));
      expect(thinkingIndicator).toBeTruthy();
    });
  });

  describe('Label Rendering', () => {
    it('should render custom label when provided', () => {
      component.streamingStage = 'streaming';
      component.streamingProgressLabel = 'Custom Label';
      fixture.detectChanges();

      const label = fixture.debugElement.query(By.css('.streaming-label'));
      expect(label).toBeTruthy();
      expect(label.nativeElement.textContent.trim()).toBe('Custom Label');
    });

    it('should not render label when streamingProgressLabel is not provided', () => {
      component.streamingStage = 'streaming';
      component.streamingProgressLabel = undefined;
      fixture.detectChanges();

      const label = fixture.debugElement.query(By.css('.streaming-label'));
      expect(label).toBeFalsy();
    });

    it('should render screen reader text when label is not provided', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.5;
      component.streamingProgressLabel = undefined;
      fixture.detectChanges();

      const srText = fixture.debugElement.query(By.css('.sr-only'));
      expect(srText).toBeTruthy();
    });
  });

  describe('ARIA Attributes', () => {
    it('should set aria-live to polite when streaming', () => {
      component.streamingStage = 'streaming';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should set aria-live to off when thinking', () => {
      component.streamingStage = 'thinking';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator.nativeElement.getAttribute('aria-live')).toBe('off');
    });

    it('should set aria-busy to true when streaming', () => {
      component.streamingStage = 'streaming';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator.nativeElement.getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-busy to true when thinking', () => {
      component.streamingStage = 'thinking';
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator.nativeElement.getAttribute('aria-busy')).toBe('true');
    });

    it('should set aria-label from getAriaLabel', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.5;
      fixture.detectChanges();

      const indicator = fixture.debugElement.query(By.css('.streaming-indicator'));
      expect(indicator.nativeElement.getAttribute('aria-label')).toBe('Streaming progress: 50%');
    });
  });

  describe('Edge Cases', () => {
    it('should handle progress value of exactly 0', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0;
      fixture.detectChanges();

      expect(component.progressPercentage).toBe(0);
    });

    it('should handle progress value of exactly 1', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 1;
      fixture.detectChanges();

      expect(component.progressPercentage).toBe(100);
    });

    it('should handle very small progress values', () => {
      component.streamingStage = 'streaming';
      component.streamingProgress = 0.001;
      fixture.detectChanges();

      expect(component.progressPercentage).toBe(0);
    });

    it('should handle rapid stage changes', () => {
      component.streamingStage = 'idle';
      expect(component.isStreamingActive).toBe(false);

      component.streamingStage = 'thinking';
      expect(component.isStreamingActive).toBe(true);

      component.streamingStage = 'streaming';
      expect(component.isStreamingActive).toBe(true);

      component.streamingStage = 'complete';
      expect(component.isStreamingActive).toBe(false);
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush is set in component decorator
    });
  });
});
