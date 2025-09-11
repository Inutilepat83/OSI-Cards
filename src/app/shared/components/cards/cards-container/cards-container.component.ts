import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AICardConfig } from '../../../../models';
import { CardDataService } from '../../../../core';
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

  ngOnInit(): void {
    this.loadExampleCards();
  }

  loadExampleCards(): void {
    this.cardService.getAllCards().subscribe({
      next: (cards: AICardConfig[]) => {
        this.cards = cards;
      },
      error: (error: unknown) => {
        console.error('Error loading example cards:', error);
      }
    });
  }

  trackByCardId(index: number, card: AICardConfig): string {
    return card.id || index.toString();
  }
}
