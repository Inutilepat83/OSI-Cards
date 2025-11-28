import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardTypeSelectorComponent } from './card-type-selector.component';
import { CardType } from '../../../models';
import { By } from '@angular/platform-browser';

describe('CardTypeSelectorComponent', () => {
  let component: CardTypeSelectorComponent;
  let fixture: ComponentFixture<CardTypeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardTypeSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardTypeSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('card type selection', () => {
    it('should display all card types', () => {
      component.cardTypes = ['company', 'contact', 'product'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(3);
    });

    it('should mark selected type as active', () => {
      component.selectedType = 'company';
      component.cardTypes = ['company', 'contact', 'product'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const companyButton = buttons[0];
      expect(companyButton.nativeElement.classList.contains('active')).toBe(true);
    });

    it('should emit typeChange when type is clicked', () => {
      spyOn(component.typeChange, 'emit');
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[1].nativeElement.click();

      expect(component.typeChange.emit).toHaveBeenCalledWith('contact');
    });

    it('should not emit when disabled', () => {
      spyOn(component.typeChange, 'emit');
      component.disabled = true;
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons[0].nativeElement.click();

      expect(component.typeChange.emit).not.toHaveBeenCalled();
    });

    it('should format SKO type correctly', () => {
      component.cardTypes = ['sko'];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button.nativeElement.textContent.trim()).toBe('SKO');
    });

    it('should capitalize other types correctly', () => {
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.textContent.trim()).toBe('Company');
      expect(buttons[1].nativeElement.textContent.trim()).toBe('Contact');
    });
  });

  describe('accessibility', () => {
    it('should set aria-pressed for active button', () => {
      component.selectedType = 'company';
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.getAttribute('aria-pressed')).toBe('true');
      expect(buttons[1].nativeElement.getAttribute('aria-pressed')).toBe('false');
    });

    it('should set aria-label for each button', () => {
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons[0].nativeElement.getAttribute('aria-label')).toBe('Select company card type');
      expect(buttons[1].nativeElement.getAttribute('aria-label')).toBe('Select contact card type');
    });
  });

  describe('disabled state', () => {
    it('should disable all buttons when disabled is true', () => {
      component.disabled = true;
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.disabled).toBe(true);
      });
    });

    it('should enable buttons when disabled is false', () => {
      component.disabled = false;
      component.cardTypes = ['company', 'contact'];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        expect(button.nativeElement.disabled).toBe(false);
      });
    });
  });

  describe('default values', () => {
    it('should have default selectedType', () => {
      expect(component.selectedType).toBe('company');
    });

    it('should have default cardTypes', () => {
      expect(component.cardTypes.length).toBeGreaterThan(0);
      expect(component.cardTypes).toContain('company');
    });

    it('should have default disabled as false', () => {
      expect(component.disabled).toBe(false);
    });
  });
});




