import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LLMSimulationControlsComponent } from './llm-simulation-controls.component';
import { By } from '@angular/platform-browser';

describe('LLMSimulationControlsComponent', () => {
  let component: LLMSimulationControlsComponent;
  let fixture: ComponentFixture<LLMSimulationControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LLMSimulationControlsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LLMSimulationControlsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('simulation toggle', () => {
    it('should emit simulationToggle when button clicked', () => {
      spyOn(component.simulationToggle, 'emit');
      component.disabled = false;
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      button.nativeElement.click();

      expect(component.simulationToggle.emit).toHaveBeenCalled();
    });

    it('should not emit when disabled', () => {
      spyOn(component.simulationToggle, 'emit');
      component.disabled = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      button.nativeElement.click();

      expect(component.simulationToggle.emit).not.toHaveBeenCalled();
    });

    it('should show "Simulate LLM" text when not simulating', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.textContent).toContain('Simulate LLM');
    });

    it('should show "Stop Simulation" text when simulating', () => {
      component.isSimulating = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.textContent).toContain('Stop Simulation');
    });

    it('should show spinner when simulating', () => {
      component.isSimulating = true;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('.spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should not show spinner when not simulating', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('.spinner'));
      expect(spinner).toBeFalsy();
    });
  });

  describe('button states', () => {
    it('should have active class when simulating', () => {
      component.isSimulating = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.classList.contains('active')).toBe(true);
    });

    it('should not have active class when not simulating', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.classList.contains('active')).toBe(false);
    });

    it('should be disabled when disabled input is true', () => {
      component.disabled = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should be disabled when simulating', () => {
      component.isSimulating = true;
      component.disabled = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.disabled).toBe(true);
    });

    it('should not be disabled when not simulating and not disabled', () => {
      component.isSimulating = false;
      component.disabled = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.disabled).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('should set aria-pressed when simulating', () => {
      component.isSimulating = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.getAttribute('aria-pressed')).toBe('true');
    });

    it('should set aria-pressed to false when not simulating', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.getAttribute('aria-pressed')).toBe('false');
    });

    it('should set correct aria-label when simulating', () => {
      component.isSimulating = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Stop LLM simulation');
    });

    it('should set correct aria-label when not simulating', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Simulate LLM generation');
    });

    it('should set correct title attribute', () => {
      component.isSimulating = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.simulation-button'));
      expect(button.nativeElement.getAttribute('title')).toContain('Simulate LLM generation');

      component.isSimulating = true;
      fixture.detectChanges();
      expect(button.nativeElement.getAttribute('title')).toBe('Stop simulation');
    });
  });

  describe('default values', () => {
    it('should have default isSimulating as false', () => {
      expect(component.isSimulating).toBe(false);
    });

    it('should have default disabled as false', () => {
      expect(component.disabled).toBe(false);
    });
  });
});




