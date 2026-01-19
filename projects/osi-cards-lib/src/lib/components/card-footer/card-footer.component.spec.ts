/**
 * Card Footer Component Tests
 *
 * Unit tests for CardFooterComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardFooterComponent } from './card-footer.component';
import { By } from '@angular/platform-browser';
import { CardAction } from '@osi-cards/models';
import { LucideIconsModule } from '@osi-cards/icons';

describe('CardFooterComponent', () => {
  let component: CardFooterComponent;
  let fixture: ComponentFixture<CardFooterComponent>;

  const mockActions: CardAction[] = [
    {
      id: 'action-1',
      label: 'Primary Action',
      variant: 'primary',
      type: 'website',
      url: 'https://example.com',
    },
    {
      id: 'action-2',
      label: 'Secondary Action',
      variant: 'secondary',
      type: 'mail',
      email: {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardFooterComponent, LucideIconsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CardFooterComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render footer when hasActions is true', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const footer = fixture.debugElement.query(By.css('.card-footer'));
      expect(footer).toBeTruthy();
    });

    it('should render footer when showSignature is true', () => {
      component.actions = [];
      component.showSignature = true;
      fixture.detectChanges();

      const footer = fixture.debugElement.query(By.css('.card-footer'));
      expect(footer).toBeTruthy();
    });

    it('should not render footer when hasActions is false and showSignature is false', () => {
      component.actions = [];
      component.showSignature = false;
      fixture.detectChanges();

      const footer = fixture.debugElement.query(By.css('.card-footer'));
      expect(footer).toBeFalsy();
    });
  });

  describe('Actions Rendering', () => {
    it('should render action buttons', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(2);
    });

    it('should render action labels', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const labels = buttons.map((b) => b.nativeElement.textContent.trim());
      expect(labels[0]).toContain('Primary Action');
      expect(labels[1]).toContain('Secondary Action');
    });

    it('should handle empty actions array', () => {
      component.actions = [];
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(0);
    });

    it('should handle undefined actions', () => {
      component.actions = undefined as unknown as CardAction[];
      fixture.detectChanges();

      expect(component.hasActions).toBeFalsy();
    });
  });

  describe('Action Variants', () => {
    it('should apply primary variant classes', () => {
      component.actions = [{ id: '1', label: 'Primary', variant: 'primary' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      const classes = component.getActionButtonClasses(component.actions[0]!);
      expect(classes['action-button--primary']).toBe(true);
    });

    it('should apply secondary variant classes', () => {
      component.actions = [{ id: '1', label: 'Secondary', variant: 'secondary' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      const classes = component.getActionButtonClasses(component.actions[0]!);
      expect(classes['action-button--secondary']).toBe(true);
    });

    it('should default to secondary when variant is not specified', () => {
      component.actions = [{ id: '1', label: 'Default' }];
      fixture.detectChanges();

      const classes = component.getActionButtonClasses(component.actions[0]!);
      expect(classes['action-button--secondary']).toBe(true);
    });
  });

  describe('Icons', () => {
    it('should render lucide icon when icon is a string and not URL', () => {
      component.actions = [{ id: '1', label: 'With Icon', icon: 'mail' }];
      fixture.detectChanges();

      const iconName = component.getActionIconNameForDisplay(component.actions[0]!);
      expect(iconName).toBe('mail');
    });

    it('should not render lucide icon when icon is a URL', () => {
      component.actions = [
        { id: '1', label: 'With URL Icon', icon: 'https://example.com/icon.png' },
      ];
      fixture.detectChanges();

      const iconName = component.getActionIconNameForDisplay(component.actions[0]!);
      expect(iconName).toBeNull();
    });

    it('should detect image icon correctly', () => {
      const action: CardAction = {
        id: '1',
        label: 'Image Icon',
        icon: 'https://example.com/icon.png',
      };
      expect(component.hasImageIcon(action)).toBe(true);
    });

    it('should detect text icon correctly', () => {
      const action: CardAction = {
        id: '1',
        label: 'Text Icon',
        icon: '🚀',
      };
      expect(component.hasTextIcon(action)).toBe(true);
    });

    it('should not detect text icon for URLs', () => {
      const action: CardAction = {
        id: '1',
        label: 'URL Icon',
        icon: 'https://example.com/icon.png',
      };
      expect(component.hasTextIcon(action)).toBe(false);
    });
  });

  describe('Click Events', () => {
    it('should emit actionClick when button is clicked', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      spyOn(component.actionClick, 'emit');
      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(component.actionClick.emit).toHaveBeenCalled();
    });

    it('should emit correct action in click event', () => {
      const testAction = mockActions[0]!;
      component.actions = [testAction];
      fixture.detectChanges();

      let emittedAction: CardAction | undefined;
      component.actionClick.subscribe((action) => {
        emittedAction = action;
      });

      const button = fixture.debugElement.query(By.css('button'));
      button.nativeElement.click();

      expect(emittedAction).toBeDefined();
      expect(emittedAction?.id).toBe(testAction.id);
    });

    it('should handle keyboard Enter key', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      spyOn(component.actionClick, 'emit');
      const button = fixture.debugElement.query(By.css('button'));
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      button.nativeElement.dispatchEvent(event);

      expect(component.actionClick.emit).toHaveBeenCalled();
    });

    it('should handle keyboard Space key', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      spyOn(component.actionClick, 'emit');
      const button = fixture.debugElement.query(By.css('button'));
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      button.nativeElement.dispatchEvent(event);

      expect(component.actionClick.emit).toHaveBeenCalled();
    });
  });

  describe('Signature', () => {
    it('should render signature when showSignature is true', () => {
      component.showSignature = true;
      fixture.detectChanges();

      const signature = fixture.debugElement.query(By.css('.card-signature'));
      expect(signature).toBeTruthy();
    });

    it('should display default signature text', () => {
      component.showSignature = true;
      fixture.detectChanges();

      const signature = fixture.debugElement.query(By.css('.card-signature'));
      expect(signature.nativeElement.textContent.trim()).toBe(
        'Powered by Orange Sales Intelligence'
      );
    });

    it('should display custom signature text', () => {
      component.showSignature = true;
      component.signatureText = 'Custom Signature';
      fixture.detectChanges();

      const signature = fixture.debugElement.query(By.css('.card-signature'));
      expect(signature.nativeElement.textContent.trim()).toBe('Custom Signature');
    });

    it('should not render signature when showSignature is false', () => {
      component.showSignature = false;
      fixture.detectChanges();

      const signature = fixture.debugElement.query(By.css('.card-signature'));
      expect(signature).toBeFalsy();
    });
  });

  describe('TrackBy Function', () => {
    it('should track actions by id', () => {
      const action: CardAction = { id: 'action-1', label: 'Test' };
      const result = component.trackAction(0, action);
      expect(result).toBe('action-1');
    });

    it('should track actions by type and index when id is missing', () => {
      const action: CardAction = { label: 'Test', type: 'website' };
      const result = component.trackAction(1, action);
      expect(result).toBe('website-1');
    });
  });

  describe('hasActions Getter', () => {
    it('should return true when actions array has items', () => {
      component.actions = mockActions;
      expect(component.hasActions).toBe(true);
    });

    it('should return false when actions array is empty', () => {
      component.actions = [];
      expect(component.hasActions).toBe(false);
    });

    it('should return false when actions is null', () => {
      component.actions = null as unknown as CardAction[];
      expect(component.hasActions).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle actions with missing properties', () => {
      component.actions = [{ label: 'Minimal Action' } as CardAction];
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });

    it('should handle very long action labels', () => {
      component.actions = [
        {
          id: '1',
          label: 'A'.repeat(100),
        },
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });
  });
});
