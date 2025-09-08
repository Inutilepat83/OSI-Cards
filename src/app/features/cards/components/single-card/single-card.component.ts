import { Component, Input, OnInit } from '@angular/core';
import { AICardConfig, CardField } from '../../../../models/card.model';
import { LocalCardConfigurationService } from '../../../../core/services/local-card-configuration.service';
import { IconService } from '../../../../shared/services/icon.service';

@Component({
  selector: 'app-single-card',
  templateUrl: './single-card.component.html',
  styleUrls: ['./single-card.component.css'],
  // Not standalone so it can be part of the CardsModule which already imports SharedModule
})
export class SingleCardComponent implements OnInit {
  @Input() cardId!: string;
  card?: AICardConfig;

  constructor(
    private cardService: LocalCardConfigurationService,
    private iconService: IconService
  ) {}

  ngOnInit(): void {
    this.loadCard();
  }

  loadCard(): void {
    this.cardService.getAllExampleCards().subscribe({
      next: (cards) => {
        this.card = cards.find((c) => c.id === this.cardId);
      },
      error: (err) => console.error(err)
    });
  }

  onField(field: CardField): void {
    // Handle field click
    console.log('Field clicked:', field);
  }

  getFieldIconClass(label: string): string {
    return this.iconService.getFieldIconClass(label);
  }

  getFieldIcon(label: string): string {
    return this.iconService.getFieldIcon(label);
  }
}
