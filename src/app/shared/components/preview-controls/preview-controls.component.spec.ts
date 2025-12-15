import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreviewControlsComponent } from './preview-controls.component';
import { By } from '@angular/platform-browser';

describe('PreviewControlsComponent', () => {
  let component: PreviewControlsComponent;
  let fixture: ComponentFixture<PreviewControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewControlsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('fullscreen toggle', () => {
    it('should emit toggleFullscreen when button clicked', () => {
      spyOn(component.toggleFullscreen, 'emit');
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      button.nativeElement.click();

      expect(component.toggleFullscreen.emit).toHaveBeenCalled();
    });

    it('should show "Fullscreen" text when not in fullscreen', () => {
      component.isFullscreen = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      expect(button.nativeElement.textContent).toContain('Fullscreen');
    });

    it('should show "Exit" text when in fullscreen', () => {
      component.isFullscreen = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      expect(button.nativeElement.textContent).toContain('Exit');
    });

    it('should set correct aria-label when not fullscreen', () => {
      component.isFullscreen = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Enter fullscreen');
    });

    it('should set correct aria-label when fullscreen', () => {
      component.isFullscreen = true;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      expect(button.nativeElement.getAttribute('aria-label')).toBe('Exit fullscreen');
    });

    it('should set correct title attribute', () => {
      component.isFullscreen = false;
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.control-button'));
      expect(button.nativeElement.getAttribute('title')).toBe('Enter fullscreen');

      component.isFullscreen = true;
      fixture.detectChanges();
      expect(button.nativeElement.getAttribute('title')).toBe('Exit fullscreen');
    });
  });

  describe('default values', () => {
    it('should have default isFullscreen as false', () => {
      expect(component.isFullscreen).toBe(false);
    });
  });
});

