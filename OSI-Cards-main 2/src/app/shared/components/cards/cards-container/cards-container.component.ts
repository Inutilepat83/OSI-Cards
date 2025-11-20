import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';
import { CardDataService } from '../../../../core';
import { ErrorHandlingService } from '../../../../core/services/error-handling.service';
import { AICardRendererComponent } from '../ai-card-renderer.component';

@Component({
  selector: 'app-cards-container',
  templateUrl: './cards-container.component.html',
  styleUrls: ['./cards-container.component.css'],
  standalone: true,
  imports: [CommonModule, AICardRendererComponent]
})
export class CardsContainerComponent implements OnInit {
  cards: AICardConfig[] = [];
  private cardService = inject(CardDataService);
  private errorHandler = inject(ErrorHandlingService);

  ngOnInit(): void {
    this.loadExampleCards();
  }

  loadExampleCards(): void {
    this.cardService.getAllCards().subscribe({
      next: (cards: AICardConfig[]) => {
        this.cards = cards;
      },
      error: (error: unknown) => {
        this.errorHandler.handleError(error, 'CardsContainerComponent.loadExampleCards');
      }
    });
  }

  trackByCardId(index: number, card: AICardConfig): string {
    return card.id || index.toString();
  }
}
