import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Onboarding tour component
 * Creates an interactive onboarding tour for new users
 */
@Component({
  selector: 'app-onboarding-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="currentStep" class="tour-overlay" (click)="onOverlayClick()">
      <div
        class="tour-tooltip"
        [style.top.px]="tooltipTop"
        [style.left.px]="tooltipLeft"
        [class]="'tour-tooltip--' + (currentStep.position || 'bottom')"
      >
        <div class="tour-header">
          <h3 class="tour-title">{{ currentStep.title }}</h3>
          <button
            type="button"
            class="tour-close"
            (click)="skipTour()"
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>
        <p class="tour-description">{{ currentStep.description }}</p>
        <div class="tour-footer">
          <button
            type="button"
            class="tour-button tour-button--secondary"
            (click)="previousStep()"
            [disabled]="currentStepIndex === 0"
          >
            Previous
          </button>
          <div class="tour-progress">
            Step {{ currentStepIndex + 1 }} of {{ steps.length }}
          </div>
          <button
            type="button"
            class="tour-button tour-button--primary"
            (click)="nextStep()"
          >
            {{ currentStepIndex === steps.length - 1 ? 'Finish' : 'Next' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tour-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      pointer-events: all;
    }

    .tour-tooltip {
      position: absolute;
      background: rgba(20, 30, 50, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      padding: 1.5rem;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      pointer-events: all;
    }

    .tour-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .tour-title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--card-text-primary, #FFFFFF);
    }

    .tour-close {
      background: transparent;
      border: none;
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tour-close:hover {
      color: var(--card-text-primary, #FFFFFF);
    }

    .tour-description {
      margin: 0 0 1.5rem 0;
      color: var(--card-text-secondary, #B8C5D6);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .tour-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .tour-button {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .tour-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .tour-button--primary {
      background: var(--color-brand, #FF7900);
      color: white;
    }

    .tour-button--secondary {
      background: rgba(255, 255, 255, 0.1);
      color: var(--card-text-primary, #FFFFFF);
    }

    .tour-progress {
      font-size: 0.75rem;
      color: var(--card-text-secondary, #B8C5D6);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingTourComponent implements OnInit, OnDestroy {
  @Input() steps: TourStep[] = [];
  @Input() enabled = true;

  @Output() tourComplete = new EventEmitter<void>();
  @Output() tourSkipped = new EventEmitter<void>();

  currentStep: TourStep | null = null;
  currentStepIndex = 0;
  tooltipTop = 0;
  tooltipLeft = 0;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.enabled && this.steps.length > 0) {
      this.startTour();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startTour(): void {
    this.currentStepIndex = 0;
    this.showStep(0);
  }

  nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.showStep(this.currentStepIndex);
    } else {
      this.completeTour();
    }
  }

  previousStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.showStep(this.currentStepIndex);
    }
  }

  skipTour(): void {
    this.currentStep = null;
    this.tourSkipped.emit();
  }

  completeTour(): void {
    this.currentStep = null;
    this.tourComplete.emit();
  }

  private showStep(index: number): void {
    const step = this.steps[index];
    if (!step) {
      return;
    }

    this.currentStep = step;
    this.updateTooltipPosition(step.targetSelector);
  }

  private updateTooltipPosition(selector: string): void {
    const target = document.querySelector(selector) as HTMLElement;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const position = this.currentStep?.position || 'bottom';

    switch (position) {
      case 'top':
        this.tooltipTop = rect.top - 20;
        this.tooltipLeft = rect.left + rect.width / 2;
        break;
      case 'bottom':
        this.tooltipTop = rect.bottom + 20;
        this.tooltipLeft = rect.left + rect.width / 2;
        break;
      case 'left':
        this.tooltipTop = rect.top + rect.height / 2;
        this.tooltipLeft = rect.left - 20;
        break;
      case 'right':
        this.tooltipTop = rect.top + rect.height / 2;
        this.tooltipLeft = rect.right + 20;
        break;
    }
  }

  onOverlayClick(): void {
    // Don't close on overlay click - require explicit action
  }
}


