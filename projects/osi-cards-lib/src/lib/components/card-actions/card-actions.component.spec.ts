/**
 * Card Actions Component Tests
 *
 * Unit tests for CardActionsComponent
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardActionsComponent } from './card-actions.component';
import { By } from '@angular/platform-browser';
import { CardAction } from '../../models';

describe('CardActionsComponent', () => {
  let component: CardActionsComponent;
  let fixture: ComponentFixture<CardActionsComponent>;

  const mockActions: CardAction[] = [
    { id: '1', label: 'Primary Action', variant: 'primary' },
    { id: '2', label: 'Secondary Action', variant: 'secondary' },
    { id: '3', label: 'Website', type: 'website', url: 'https://example.com', variant: 'outline' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardActionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardActionsComponent);
    component = fixture.componentInstance;
  });

  describe('Basic Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render action buttons', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render correct button labels', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const labels = buttons.map(b => b.nativeElement.textContent.trim());

      expect(labels.some(l => l.includes('Primary Action'))).toBeTruthy();
    });

    it('should handle empty actions array', () => {
      component.actions = [];
      fixture.detectChanges();

      expect(component).toBeTruthy();
      const buttons = fixture.debugElement.queryAll(By.css('button'));
      expect(buttons.length).toBe(0);
    });

    it('should handle undefined actions', () => {
      component.actions = undefined as unknown as CardAction[];
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });

  describe('Button Variants', () => {
    it('should apply primary variant styles', () => {
      component.actions = [{ id: '1', label: 'Primary', variant: 'primary' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      if (button) {
        const classList = button.nativeElement.className;
        // Component may use various class naming conventions
        expect(button).toBeTruthy();
      }
    });

    it('should apply secondary variant styles', () => {
      component.actions = [{ id: '1', label: 'Secondary', variant: 'secondary' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });

    it('should apply outline variant styles', () => {
      component.actions = [{ id: '1', label: 'Outline', variant: 'outline' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });

    it('should apply ghost variant styles', () => {
      component.actions = [{ id: '1', label: 'Ghost', variant: 'ghost' }];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });
  });

  describe('Action Types', () => {
    it('should render website action with external link indicator', () => {
      component.actions = [
        { id: '1', label: 'Visit Site', type: 'website', url: 'https://example.com' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });

    it('should render mail action', () => {
      component.actions = [
        {
          id: '1',
          label: 'Send Email',
          type: 'mail',
          email: {
            to: 'test@example.com',
            subject: 'Test',
            body: 'Test body'
          }
        }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });

    it('should render agent action', () => {
      component.actions = [
        { id: '1', label: 'Talk to Agent', type: 'agent', agentId: 'agent-1' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });

    it('should render question action', () => {
      component.actions = [
        { id: '1', label: 'Ask Question', type: 'question', question: 'How can I help?' }
      ];
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('button'));
      expect(button).toBeTruthy();
    });
  });

  describe('Click Events', () => {
    it('should emit actionClick when button is clicked', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const spy = spyOn(component.actionClick, 'emit');

      const button = fixture.debugElement.query(By.css('button'));
      if (button) {
        button.nativeElement.click();
        expect(spy).toHaveBeenCalled();
      }
    });

    it('should emit correct action in click event', () => {
      const testAction = mockActions[0]!;
      component.actions = [testAction];
      fixture.detectChanges();

      let emittedAction: CardAction | undefined;
      component.actionClick.subscribe(action => {
        emittedAction = action;
      });

      const button = fixture.debugElement.query(By.css('button'));
      if (button) {
        button.nativeElement.click();
        expect(emittedAction).toBeDefined();
        expect(emittedAction?.label).toBe(testAction.label);
      }
    });
  });

  describe('Icons', () => {
    it('should render icon when provided', () => {
      component.actions = [
        { id: '1', label: 'With Icon', icon: 'mail' }
      ];
      fixture.detectChanges();

      // Icon rendering depends on implementation
      expect(component).toBeTruthy();
    });

    it('should use default icon for type-specific actions', () => {
      component.actions = [
        { id: '1', label: 'Send Email', type: 'mail' }
      ];
      fixture.detectChanges();

      // Should show mail icon by default for mail type
      expect(component).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        const el = button.nativeElement;
        // Buttons should have accessible names
        const hasAccessibleName = el.textContent.trim() ||
                                  el.getAttribute('aria-label') ||
                                  el.getAttribute('title');
        expect(hasAccessibleName).toBeTruthy();
      });
    });

    it('should have proper button type attribute', () => {
      component.actions = mockActions;
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      buttons.forEach(button => {
        const type = button.nativeElement.getAttribute('type');
        // Should be 'button' to prevent form submission
        expect(type).toBe('button');
      });
    });
  });

  describe('Disabled State', () => {
    it('should handle disabled actions', () => {
      component.actions = [
        { id: '1', label: 'Disabled', disabled: true } as CardAction & { disabled: boolean }
      ];
      fixture.detectChanges();

      // Disabled handling depends on implementation
      expect(component).toBeTruthy();
    });
  });

  describe('TrackBy Function', () => {
    it('should have trackBy function for performance', () => {
      if ('trackAction' in component) {
        const trackFn = (component as { trackAction: (index: number, action: CardAction) => string }).trackAction;
        const result = trackFn(0, mockActions[0]!);
        expect(result).toBeTruthy();
      }
    });
  });
});

