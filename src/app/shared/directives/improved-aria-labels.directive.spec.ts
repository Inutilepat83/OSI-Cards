import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ImprovedAriaLabelDirective } from './improved-aria-labels.directive';

@Component({
  template: `
    <button
      appImprovedAriaLabel="Test Label"
      [appAriaDescription]="description"
      [appAriaLive]="live"
    >
      Click me
    </button>
    <a appImprovedAriaLabel="Link Label">Link</a>
    <div appImprovedAriaLabel="Div Label" [appAriaDescription]="null">Content</div>
  `,
})
class TestComponent {
  description = 'Test description';
  live = 'polite';
}

describe('ImprovedAriaLabelDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let buttonElement: DebugElement;
  let linkElement: DebugElement;
  let divElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [ImprovedAriaLabelDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    buttonElement = fixture.debugElement.query(By.css('button'));
    linkElement = fixture.debugElement.query(By.css('a'));
    divElement = fixture.debugElement.query(By.css('div'));
  });

  it('should create an instance', () => {
    const directive = new ImprovedAriaLabelDirective();
    expect(directive).toBeTruthy();
  });

  describe('aria-label', () => {
    it('should set aria-label attribute', () => {
      expect(buttonElement.nativeElement.getAttribute('aria-label')).toBe('Test Label');
    });

    it('should update aria-label when input changes', () => {
      const directive = buttonElement.injector.get(ImprovedAriaLabelDirective);
      directive.appImprovedAriaLabel = 'Updated Label';
      directive.ngOnInit();
      fixture.detectChanges();

      expect(buttonElement.nativeElement.getAttribute('aria-label')).toBe('Updated Label');
    });
  });

  describe('aria-describedby', () => {
    it('should create and link aria-describedby element', () => {
      const describedBy = buttonElement.nativeElement.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();

      const descriptionElement = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement.textContent).toContain('Test description');
    });

    it('should update description when input changes', () => {
      component.description = 'New description';
      fixture.detectChanges();

      const describedBy = buttonElement.nativeElement.getAttribute('aria-describedby');
      const descriptionElement = fixture.nativeElement.querySelector(`#${describedBy}`);
      expect(descriptionElement.textContent).toContain('New description');
    });

    it('should handle null description', () => {
      component.description = null as any;
      fixture.detectChanges();

      const describedBy = divElement.nativeElement.getAttribute('aria-describedby');
      // Should still have the attribute or be null
      expect(describedBy === null || describedBy === '').toBe(true);
    });
  });

  describe('aria-live', () => {
    it('should set aria-live attribute', () => {
      expect(buttonElement.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should update aria-live when input changes', () => {
      component.live = 'assertive';
      fixture.detectChanges();

      expect(buttonElement.nativeElement.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('role attribute', () => {
    it('should set role for button elements', () => {
      expect(buttonElement.nativeElement.getAttribute('role')).toBe('button');
    });

    it('should set role for link elements', () => {
      expect(linkElement.nativeElement.getAttribute('role')).toBe('link');
    });

    it('should not override existing role', () => {
      const element = fixture.nativeElement.querySelector('button');
      element.setAttribute('role', 'custom-role');
      fixture.detectChanges();

      expect(element.getAttribute('role')).toBe('custom-role');
    });
  });

  describe('accessibility', () => {
    it('should create visually hidden description element', () => {
      const describedBy = buttonElement.nativeElement.getAttribute('aria-describedby');
      const descriptionElement = fixture.nativeElement.querySelector(`#${describedBy}`);

      expect(descriptionElement).toBeTruthy();
      // Should be visually hidden
      const styles = window.getComputedStyle(descriptionElement);
      expect(styles.position).toBe('absolute');
      expect(styles.width).toBe('1px');
      expect(styles.height).toBe('1px');
    });
  });
});
