import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardPreviewComponent } from './card-preview.component';
import { AICardConfig } from '../../../../models';
import { CardDataService } from '../../../../core';
import { Subject } from 'rxjs';

describe('CardPreviewComponent', () => {
  let fixture: ComponentFixture<CardPreviewComponent>;
  let component: CardPreviewComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardPreviewComponent],
      providers: [
        { provide: CardDataService, useValue: { getCardSectionsStreaming: () => new Subject() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CardPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows skeleton while generating', () => {
    component.generatedCard = null;
    component.isGenerating = true;
    fixture.detectChanges();
    expect(component.showCardSkeleton).toBeTrue();
    const element = fixture.nativeElement.querySelector('.card-preview-container');
    expect(element).toBeFalsy();
  });

  it('renders generated card when not simulating', () => {
    const card: AICardConfig = { cardTitle: 'G', sections: [{ title: 'S', type: 'info', fields: [{ label: 'A', value: '1' }] }] } as any;
    component.generatedCard = card;
    component.isGenerating = false;
    fixture.detectChanges();
    const renderer = fixture.nativeElement.querySelector('app-ai-card-renderer');
    expect(renderer).toBeTruthy();
  });

  it('displayCard respects LLM stream state and progressive state', () => {
    const genCard: AICardConfig = { cardTitle: 'G', sections: [{ title: 'S', type: 'info' }] } as any;
    const progressCard: AICardConfig = { cardTitle: 'P', sections: [{ title: 'P', type: 'info' }] } as any;
    const llmCard: AICardConfig = { cardTitle: 'L', sections: [{ title: 'L', type: 'info' }] } as any;

    // default uses generated
    component.generatedCard = genCard;
    component.llmStreamState = null as any;
    component.progressiveCard = null;
    fixture.detectChanges();
    expect(component.displayCard).toBe(genCard);

    // progressive shown when skeleton active
    component.showSkeleton = true;
    component.progressiveCard = progressCard;
    fixture.detectChanges();
    expect(component.displayCard).toBe(progressCard);

    // LLM streaming overrides to llmPreviewCard
    component.showSkeleton = false;
    component.llmStreamState = { isSimulating: true, stage: 'streaming', progress: 0.5 } as any;
    component.llmPreviewCard = llmCard;
    fixture.detectChanges();
    expect(component.displayCard).toBe(llmCard);
  });

  it('shows llmPreviewCard when simulating', () => {
    const card: AICardConfig = { cardTitle: 'LLM', sections: [{ title: 'S', type: 'info' }] } as any;
    component.llmStreamState = { isSimulating: true, stage: 'streaming', progress: 0.5, tokensPushed: 1, totalTokens: 10, statusLabel: 'stream', hint: '...', error: undefined } as any;
    component.llmPreviewCard = card;
    fixture.detectChanges();
    const renderer = fixture.nativeElement.querySelector('app-ai-card-renderer');
    expect(renderer).toBeTruthy();
    // The skeleton shouldn't show
    expect(component.showCardSkeleton).toBeFalse();
  });
});
