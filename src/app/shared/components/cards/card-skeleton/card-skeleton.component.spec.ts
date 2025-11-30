import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardSkeletonComponent } from './card-skeleton.component';

describe('CardSkeletonComponent', () => {
  let component: CardSkeletonComponent;
  let fixture: ComponentFixture<CardSkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardSkeletonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardSkeletonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.cardTitle).toBe('');
    expect(component.sectionCount).toBe(0);
    expect(component.isFullscreen).toBe(false);
  });

  it('should accept cardTitle input', () => {
    component.cardTitle = 'Test Card Title';
    fixture.detectChanges();

    expect(component.cardTitle).toBe('Test Card Title');
  });

  it('should accept sectionCount input', () => {
    component.sectionCount = 3;
    fixture.detectChanges();

    expect(component.sectionCount).toBe(3);
  });

  it('should accept isFullscreen input', () => {
    component.isFullscreen = true;
    fixture.detectChanges();

    expect(component.isFullscreen).toBe(true);
  });

  it('should render card title when provided', () => {
    component.cardTitle = 'My Card';
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.skeleton-title');
    expect(titleElement).toBeTruthy();
    expect(titleElement.textContent.trim()).toBe('My Card');
  });

  it('should render placeholder when card title is not provided', () => {
    component.cardTitle = '';
    fixture.detectChanges();

    const placeholderElement = fixture.nativeElement.querySelector('.skeleton-title-placeholder');
    expect(placeholderElement).toBeTruthy();
  });

  it('should render skeleton sections when sectionCount > 0', () => {
    component.sectionCount = 2;
    fixture.detectChanges();

    const sectionElements = fixture.nativeElement.querySelectorAll('.skeleton-section');
    expect(sectionElements.length).toBe(2);
  });

  it('should not render skeleton sections when sectionCount is 0', () => {
    component.sectionCount = 0;
    fixture.detectChanges();

    const sectionElements = fixture.nativeElement.querySelectorAll('.skeleton-section');
    expect(sectionElements.length).toBe(0);
  });

  it('should render empty state when sectionCount is 0', () => {
    component.sectionCount = 0;
    fixture.detectChanges();

    const emptyElement = fixture.nativeElement.querySelector('.card-skeleton-empty');
    expect(emptyElement).toBeTruthy();
  });

  it('should apply fullscreen class when isFullscreen is true', () => {
    component.isFullscreen = true;
    fixture.detectChanges();

    const cardElement = fixture.nativeElement.querySelector('.card-skeleton');
    expect(cardElement.classList.contains('card-skeleton--fullscreen')).toBe(true);
  });

  it('should not apply fullscreen class when isFullscreen is false', () => {
    component.isFullscreen = false;
    fixture.detectChanges();

    const cardElement = fixture.nativeElement.querySelector('.card-skeleton');
    expect(cardElement.classList.contains('card-skeleton--fullscreen')).toBe(false);
  });

  it('should apply animation delay to skeleton sections', () => {
    component.sectionCount = 3;
    fixture.detectChanges();

    const sectionElements = fixture.nativeElement.querySelectorAll('.skeleton-section');
    expect(sectionElements.length).toBe(3);

    // Check that animation delays are applied (staggered)
    sectionElements.forEach((element: HTMLElement, index: number) => {
      const style = window.getComputedStyle(element);
      const animationDelay = style.animationDelay;
      expect(animationDelay).toBeTruthy();
    });
  });

  it('should handle multiple section counts', () => {
    component.sectionCount = 5;
    fixture.detectChanges();

    const sectionElements = fixture.nativeElement.querySelectorAll('.skeleton-section');
    expect(sectionElements.length).toBe(5);
  });

  it('should render skeleton lines within sections', () => {
    component.sectionCount = 1;
    fixture.detectChanges();

    const sectionElement = fixture.nativeElement.querySelector('.skeleton-section');
    const lines = sectionElement.querySelectorAll('.skeleton-line');
    expect(lines.length).toBeGreaterThan(0);
  });
});









