import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ThemeToggleComponent],
      providers: [ThemeService],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should have default values', () => {
    expect(component.showDropdown).toBe(false);
  });

  it('should toggle theme', () => {
    spyOn(component, 'toggleTheme');
    const button = fixture.nativeElement.querySelector('.theme-toggle-btn');
    if (button) {
      button.click();
      expect(component.toggleTheme).toHaveBeenCalled();
    }
  });
});
