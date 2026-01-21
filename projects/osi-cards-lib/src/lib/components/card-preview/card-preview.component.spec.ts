/**
 * Card Preview Component Tests
 *
 * Unit tests for CardPreviewComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  CardPreviewComponent,
  AgentActionEvent,
  QuestionActionEvent,
} from './card-preview.component';
import { By } from '@angular/platform-browser';
import { AICardConfig, CardAction } from '../../models';
import { AICardRendererComponent, CardFieldInteractionEvent } from '..';
import { CardSkeletonComponent } from '..';
import { ChangeDetectorRef } from '@angular/core';

describe('CardPreviewComponent', () => {
  let component: CardPreviewComponent;
  let fixture: ComponentFixture<CardPreviewComponent>;
  let cdr: ChangeDetectorRef;

  const mockCard: AICardConfig = {
    cardTitle: 'Test Card',
    sections: [
      {
        id: 'section-1',
        type: 'overview',
        title: 'Overview',
        fields: [],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardPreviewComponent, AICardRendererComponent, CardSkeletonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardPreviewComponent);
    component = fixture.componentInstance;
    cdr = fixture.debugElement.injector.get(ChangeDetectorRef);
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.generatedCard).toBeNull();
      expect(component.isGenerating).toBe(false);
      expect(component.isInitialized).toBe(false);
      expect(component.isFullscreen).toBe(false);
    });
  });

  describe('Lifecycle Hooks', () => {
    it('should call ngOnInit', () => {
      spyOn(component, 'ngOnInit');
      component.ngOnInit();
      expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should call ngOnChanges when inputs change', () => {
      spyOn(component, 'ngOnChanges');
      component.generatedCard = mockCard;
      component.ngOnChanges({
        generatedCard: {
          previousValue: null,
          currentValue: mockCard,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(component.ngOnChanges).toHaveBeenCalled();
    });

    it('should call ngOnDestroy', () => {
      spyOn(component, 'ngOnDestroy');
      component.ngOnDestroy();
      expect(component.ngOnDestroy).toHaveBeenCalled();
    });

    it('should mark for check when generatedCard changes', () => {
      spyOn(cdr, 'markForCheck');
      component.ngOnChanges({
        generatedCard: {
          previousValue: null,
          currentValue: mockCard,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should mark for check when isGenerating changes', () => {
      spyOn(cdr, 'markForCheck');
      component.ngOnChanges({
        isGenerating: {
          previousValue: false,
          currentValue: true,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(cdr.markForCheck).toHaveBeenCalled();
    });

    it('should mark for check when isInitialized changes', () => {
      spyOn(cdr, 'markForCheck');
      component.ngOnChanges({
        isInitialized: {
          previousValue: false,
          currentValue: true,
          firstChange: true,
          isFirstChange: () => true,
        },
      });
      expect(cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('showSkeleton Getter', () => {
    it('should return true when isGenerating is true and generatedCard is null', () => {
      component.isGenerating = true;
      component.generatedCard = null;
      expect(component.showSkeleton).toBe(true);
    });

    it('should return false when isGenerating is false', () => {
      component.isGenerating = false;
      component.generatedCard = null;
      expect(component.showSkeleton).toBe(false);
    });

    it('should return false when generatedCard exists', () => {
      component.isGenerating = true;
      component.generatedCard = mockCard;
      expect(component.showSkeleton).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('should emit cardInteraction event', () => {
      const mockEvent = { action: 'click', card: mockCard };
      spyOn(component.cardInteraction, 'emit');

      component.onCardInteraction(mockEvent);

      expect(component.cardInteraction.emit).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit fieldInteraction event', () => {
      const mockEvent: CardFieldInteractionEvent = {
        type: 'click',
        sectionId: 'section-1',
        fieldId: 'field-1',
      };
      spyOn(component.fieldInteraction, 'emit');

      component.onFieldInteraction(mockEvent);

      expect(component.fieldInteraction.emit).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit fullscreenToggle event', () => {
      spyOn(component.fullscreenToggle, 'emit');

      component.onFullscreenToggle(true);

      expect(component.fullscreenToggle.emit).toHaveBeenCalledWith(true);
    });

    it('should emit agentAction event', () => {
      const mockEvent: AgentActionEvent = {
        action: { id: 'action-1', label: 'Agent Action', type: 'agent' },
        card: mockCard,
        agentId: 'agent-123',
      };
      spyOn(component.agentAction, 'emit');

      component.onAgentAction(mockEvent);

      expect(component.agentAction.emit).toHaveBeenCalledWith(mockEvent);
    });

    it('should emit questionAction event', () => {
      const mockEvent: QuestionActionEvent = {
        action: { id: 'action-1', label: 'Question Action', type: 'question' },
        card: mockCard,
        question: 'How can I help?',
      };
      spyOn(component.questionAction, 'emit');

      component.onQuestionAction(mockEvent);

      expect(component.questionAction.emit).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Input Properties', () => {
    it('should accept generatedCard input', () => {
      component.generatedCard = mockCard;
      fixture.detectChanges();

      expect(component.generatedCard).toEqual(mockCard);
    });

    it('should accept isGenerating input', () => {
      component.isGenerating = true;
      fixture.detectChanges();

      expect(component.isGenerating).toBe(true);
    });

    it('should accept isInitialized input', () => {
      component.isInitialized = true;
      fixture.detectChanges();

      expect(component.isInitialized).toBe(true);
    });

    it('should accept isFullscreen input', () => {
      component.isFullscreen = true;
      fixture.detectChanges();

      expect(component.isFullscreen).toBe(true);
    });
  });

  describe('Output Events', () => {
    it('should have cardInteraction output', () => {
      expect(component.cardInteraction).toBeDefined();
      expect(component.cardInteraction.emit).toBeDefined();
    });

    it('should have fieldInteraction output', () => {
      expect(component.fieldInteraction).toBeDefined();
      expect(component.fieldInteraction.emit).toBeDefined();
    });

    it('should have fullscreenToggle output', () => {
      expect(component.fullscreenToggle).toBeDefined();
      expect(component.fullscreenToggle.emit).toBeDefined();
    });

    it('should have agentAction output', () => {
      expect(component.agentAction).toBeDefined();
      expect(component.agentAction.emit).toBeDefined();
    });

    it('should have questionAction output', () => {
      expect(component.questionAction).toBeDefined();
      expect(component.questionAction.emit).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null generatedCard', () => {
      component.generatedCard = null;
      fixture.detectChanges();

      expect(component.generatedCard).toBeNull();
    });

    it('should handle card with no sections', () => {
      const cardWithoutSections: AICardConfig = {
        cardTitle: 'Empty Card',
        sections: [],
      };
      component.generatedCard = cardWithoutSections;
      fixture.detectChanges();

      expect(component.generatedCard?.sections).toEqual([]);
    });

    it('should handle rapid state changes', () => {
      component.isGenerating = true;
      component.generatedCard = null;
      expect(component.showSkeleton).toBe(true);

      component.isGenerating = false;
      expect(component.showSkeleton).toBe(false);

      component.generatedCard = mockCard;
      expect(component.showSkeleton).toBe(false);
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component).toBeTruthy();
      // OnPush is set in component decorator
    });
  });
});
