import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardsContainerComponent } from './cards-container.component';
import { CardDataService } from '../../../../core/services/card-data/card-data.service';
import { ErrorHandlingService } from '../../../../core/services/error-handling.service';
import { of, throwError } from 'rxjs';
import { CardBuilder } from '../../../../testing/test-builders';
import { AICardRendererComponent } from '../ai-card-renderer.component';

describe('CardsContainerComponent', () => {
  let component: CardsContainerComponent;
  let fixture: ComponentFixture<CardsContainerComponent>;
  let cardDataService: jasmine.SpyObj<CardDataService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlingService>;

  beforeEach(async () => {
    const cardDataSpy = jasmine.createSpyObj('CardDataService', ['getAllCards']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlingService', ['handleError']);

    await TestBed.configureTestingModule({
      imports: [CardsContainerComponent, AICardRendererComponent],
      providers: [
        { provide: CardDataService, useValue: cardDataSpy },
        { provide: ErrorHandlingService, useValue: errorHandlerSpy }
      ]
    }).compileComponents();

    cardDataService = TestBed.inject(CardDataService) as jasmine.SpyObj<CardDataService>;
    errorHandler = TestBed.inject(ErrorHandlingService) as jasmine.SpyObj<ErrorHandlingService>;

    fixture = TestBed.createComponent(CardsContainerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.cards).toEqual([]);
    expect(component.itemHeight).toBe(400);
    expect(component.minBufferPx).toBe(200);
    expect(component.maxBufferPx).toBe(400);
  });

  it('should load cards on init', () => {
    const mockCards = [
      CardBuilder.create().withTitle('Card 1').build(),
      CardBuilder.create().withTitle('Card 2').build()
    ];

    cardDataService.getAllCards.and.returnValue(of(mockCards));

    component.ngOnInit();
    fixture.detectChanges();

    expect(cardDataService.getAllCards).toHaveBeenCalled();
    expect(component.cards.length).toBe(2);
  });

  it('should handle empty cards array', () => {
    cardDataService.getAllCards.and.returnValue(of([]));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.cards).toEqual([]);
  });

  it('should handle error when loading cards', () => {
    const error = new Error('Failed to load cards');
    cardDataService.getAllCards.and.returnValue(throwError(() => error));

    component.ngOnInit();
    fixture.detectChanges();

    expect(errorHandler.handleError).toHaveBeenCalledWith(
      error,
      'CardsContainerComponent.loadExampleCards'
    );
  });

  it('should track cards by ID', () => {
    const card1 = CardBuilder.create().withId('card-1').withTitle('Card 1').build();
    const card2 = CardBuilder.create().withId('card-2').withTitle('Card 2').build();

    const track1 = component.trackByCardId(0, card1);
    const track2 = component.trackByCardId(1, card2);

    expect(track1).toBe('card-1');
    expect(track2).toBe('card-2');
  });

  it('should track cards by index when ID is missing', () => {
    const card = CardBuilder.create().withTitle('Card Without ID').build();
    delete (card as any).id;

    const track = component.trackByCardId(5, card);

    expect(track).toBe('5');
  });

  it('should load example cards when loadExampleCards is called', () => {
    const mockCards = [
      CardBuilder.create().withTitle('Example Card 1').build(),
      CardBuilder.create().withTitle('Example Card 2').build()
    ];

    cardDataService.getAllCards.and.returnValue(of(mockCards));

    component.loadExampleCards();
    fixture.detectChanges();

    expect(cardDataService.getAllCards).toHaveBeenCalled();
    expect(component.cards.length).toBe(2);
  });

  it('should update cards array when new cards are loaded', () => {
    const initialCards = [
      CardBuilder.create().withTitle('Card 1').build()
    ];

    cardDataService.getAllCards.and.returnValue(of(initialCards));

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.cards.length).toBe(1);

    const newCards = [
      CardBuilder.create().withTitle('Card 1').build(),
      CardBuilder.create().withTitle('Card 2').build(),
      CardBuilder.create().withTitle('Card 3').build()
    ];

    cardDataService.getAllCards.and.returnValue(of(newCards));

    component.loadExampleCards();
    fixture.detectChanges();

    expect(component.cards.length).toBe(3);
  });
});

