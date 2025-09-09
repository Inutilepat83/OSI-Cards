import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CardSelectorComponent, Card } from './card-selector.component';

describe('CardSelectorComponent', () => {
  let component: CardSelectorComponent;
  let fixture: ComponentFixture<CardSelectorComponent>;
  let debugElement: DebugElement;

  const mockCards: Card[] = [
    { id: '1', title: 'Card 1', description: 'Description 1' },
    { id: '2', title: 'Card 2', description: 'Description 2', imageUrl: 'image2.jpg' },
    { id: '3', title: 'Card 3' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardSelectorComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.cards).toEqual([]);
      expect(component.allowMultipleSelection).toBeFalse();
      expect(component.showClearSelectionButton).toBeTrue();
    });

    it('should validate card data on init', () => {
      spyOn(console, 'warn');
      component.cards = [{ id: '', title: '' }];
      component.ngOnInit();
      expect(console.warn).toHaveBeenCalledWith(
        'Card selector received cards with missing required properties (id or title)'
      );
    });

    it('should auto-select first card when enabled', () => {
      component.cards = mockCards;
      component.autoSelectFirst = true;
      component.ngOnInit();
      expect(component.getSelectedCardIds()).toEqual(['1']);
    });
  });

  describe('Input Properties', () => {
    it('should set title correctly', () => {
      component.title = 'Test Title';
      fixture.detectChanges();
      const titleElement = debugElement.query(By.css('h3'));
      expect(titleElement.nativeElement.textContent).toBe('Test Title');
    });

    it('should handle allowMultipleSelection changes', () => {
      component.allowMultipleSelection = true;
      expect(component.allowMultipleSelection).toBeTrue();
    });

    it('should handle autoSelectFirst changes', () => {
      component.cards = mockCards;
      component.autoSelectFirst = true;
      expect(component.getSelectedCardIds()).toEqual(['1']);
    });
  });

  describe('Card Selection Logic', () => {
    beforeEach(() => {
      component.cards = mockCards;
      fixture.detectChanges();
    });

    it('should track cards by id', () => {
      const result = component.trackByCardId(0, mockCards[0]);
      expect(result).toBe('1');
    });

    it('should check if card is selected', () => {
      component.setSelectedCardIds(['1']);
      expect(component.isCardSelected('1')).toBeTrue();
      expect(component.isCardSelected('2')).toBeFalse();
    });

    it('should toggle card selection (single mode)', () => {
      spyOn(component.selectionChange, 'emit');
      component.allowMultipleSelection = false;

      component.toggleCardSelection(mockCards[0]);
      expect(component.getSelectedCardIds()).toEqual(['1']);
      expect(component.selectionChange.emit).toHaveBeenCalledWith([mockCards[0]]);

      component.toggleCardSelection(mockCards[1]);
      expect(component.getSelectedCardIds()).toEqual(['2']);
      expect(component.selectionChange.emit).toHaveBeenCalledWith([mockCards[1]]);
    });

    it('should toggle card selection (multiple mode)', () => {
      spyOn(component.selectionChange, 'emit');
      component.allowMultipleSelection = true;

      component.toggleCardSelection(mockCards[0]);
      expect(component.getSelectedCardIds()).toEqual(['1']);

      component.toggleCardSelection(mockCards[1]);
      expect(component.getSelectedCardIds()).toEqual(['1', '2']);

      component.toggleCardSelection(mockCards[0]);
      expect(component.getSelectedCardIds()).toEqual(['2']);
    });

    it('should handle invalid card toggle', () => {
      spyOn(console, 'warn');
      component.toggleCardSelection({} as Card);
      expect(console.warn).toHaveBeenCalledWith('Attempted to toggle selection on invalid card', {});
    });

    it('should clear selection', () => {
      spyOn(component.selectionChange, 'emit');
      component.setSelectedCardIds(['1', '2']);
      component.clearSelection();
      expect(component.getSelectedCardIds()).toEqual([]);
      expect(component.selectionChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('Computed Properties', () => {
    it('should compute selected count correctly', () => {
      component.setSelectedCardIds(['1', '2']);
      fixture.detectChanges();
      const footerElement = debugElement.query(By.css('.card-selector-footer p'));
      expect(footerElement.nativeElement.textContent).toContain('2 card(s) selected');
    });

    it('should compute display title correctly', () => {
      component.title = 'Test Title';
      fixture.detectChanges();
      const titleElement = debugElement.query(By.css('h3'));
      expect(titleElement.nativeElement.textContent).toBe('Test Title');
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      component.cards = mockCards;
      fixture.detectChanges();
    });

    it('should render cards correctly', () => {
      const cardElements = debugElement.queryAll(By.css('.card-item'));
      expect(cardElements.length).toBe(3);
    });

    it('should render card titles', () => {
      const titleElements = debugElement.queryAll(By.css('.card-title'));
      expect(titleElements[0].nativeElement.textContent).toBe('Card 1');
      expect(titleElements[1].nativeElement.textContent).toBe('Card 2');
    });

    it('should render card descriptions when available', () => {
      const descElements = debugElement.queryAll(By.css('.card-description'));
      expect(descElements.length).toBe(2); // Only cards 1 and 2 have descriptions
    });

    it('should render images when available', () => {
      const imageElements = debugElement.queryAll(By.css('.card-image img'));
      expect(imageElements.length).toBe(1); // Only card 2 has image
      expect(imageElements[0].attributes['src']).toBe('image2.jpg');
    });

    it('should show title when provided', () => {
      component.title = 'Test Title';
      fixture.detectChanges();
      const titleElement = debugElement.query(By.css('h3'));
      expect(titleElement.nativeElement.textContent).toBe('Test Title');
    });

    it('should hide title when not provided', () => {
      const titleElement = debugElement.query(By.css('h3'));
      expect(titleElement).toBeNull();
    });

    it('should show footer when cards are selected', () => {
      component.setSelectedCardIds(['1']);
      fixture.detectChanges();
      const footerElement = debugElement.query(By.css('.card-selector-footer'));
      expect(footerElement).toBeTruthy();
      expect(footerElement.nativeElement.textContent).toContain('1 card(s) selected');
    });

    it('should hide footer when no cards are selected', () => {
      const footerElement = debugElement.query(By.css('.card-selector-footer'));
      expect(footerElement).toBeNull();
    });

    it('should show clear selection button when enabled', () => {
      component.setSelectedCardIds(['1']);
      component.showClearSelectionButton = true;
      fixture.detectChanges();
      const clearButton = debugElement.query(By.css('.clear-selection-btn'));
      expect(clearButton).toBeTruthy();
    });

    it('should hide clear selection button when disabled', () => {
      component.setSelectedCardIds(['1']);
      component.showClearSelectionButton = false;
      fixture.detectChanges();
      const clearButton = debugElement.query(By.css('.clear-selection-btn'));
      expect(clearButton).toBeNull();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      component.cards = mockCards;
      fixture.detectChanges();
    });

    it('should have correct ARIA attributes', () => {
      const container = debugElement.query(By.css('.card-selector-container'));
      expect(container.attributes['role']).toBe('region');

      const listbox = debugElement.query(By.css('.cards-list'));
      expect(listbox.attributes['role']).toBe('listbox');
    });

    it('should set aria-selected correctly', () => {
      component.setSelectedCardIds(['1']);
      fixture.detectChanges();
      const cardElements = debugElement.queryAll(By.css('.card-item'));
      expect(cardElements[0].attributes['aria-selected']).toBe('true');
      expect(cardElements[1].attributes['aria-selected']).toBe('false');
    });

    it('should set tabindex correctly', () => {
      const cardElements = debugElement.queryAll(By.css('.card-item'));
      expect(cardElements[0].attributes['tabindex']).toBe('0');
      expect(cardElements[1].attributes['tabindex']).toBe('-1');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      component.cards = mockCards;
      fixture.detectChanges();
    });

    it('should handle Enter key to toggle selection', () => {
      spyOn(component, 'toggleCardSelection');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.handleKeyDown(event, mockCards[0]);
      expect(component.toggleCardSelection).toHaveBeenCalledWith(mockCards[0]);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('should handle Space key to toggle selection', () => {
      spyOn(component, 'toggleCardSelection');
      const event = new KeyboardEvent('keydown', { key: ' ' });
      component.handleKeyDown(event, mockCards[0]);
      expect(component.toggleCardSelection).toHaveBeenCalledWith(mockCards[0]);
      expect(event.defaultPrevented).toBeTrue();
    });

    it('should handle ArrowRight key for navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      spyOn(event, 'preventDefault');
      component.handleKeyDown(event, mockCards[0]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle ArrowLeft key for navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      spyOn(event, 'preventDefault');
      component.handleKeyDown(event, mockCards[1]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle Home key for navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      spyOn(event, 'preventDefault');
      component.handleKeyDown(event, mockCards[1]);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should handle End key for navigation', () => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      spyOn(event, 'preventDefault');
      component.handleKeyDown(event, mockCards[0]);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component.cards = mockCards;
      fixture.detectChanges();
    });

    it('should emit selection change on card click', () => {
      spyOn(component.selectionChange, 'emit');
      const cardElement = debugElement.query(By.css('.card-item'));
      cardElement.triggerEventHandler('click', null);
      expect(component.selectionChange.emit).toHaveBeenCalled();
    });

    it('should emit selection change on clear selection', () => {
      spyOn(component.selectionChange, 'emit');
      component.setSelectedCardIds(['1']);
      component.clearSelection();
      expect(component.selectionChange.emit).toHaveBeenCalledWith([]);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle empty cards array', () => {
      component.cards = [];
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle cards with missing properties gracefully', () => {
      component.cards = [{ id: '1', title: 'Test' }, {} as Card];
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle large number of cards', () => {
      const largeCards = Array.from({ length: 100 }, (_, i) => ({
        id: `card-${i}`,
        title: `Card ${i}`
      }));
      component.cards = largeCards;
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });
});
