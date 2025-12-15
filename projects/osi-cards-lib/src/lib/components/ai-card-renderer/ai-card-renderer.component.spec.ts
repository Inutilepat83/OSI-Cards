/**
 * AI Card Renderer Component Theme Sync Tests
 *
 * Focus: ensure `data-theme` is applied on the host element (Safari-safe),
 * and that common theme names are normalized (dark/light -> night/day).
 */

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AICardRendererComponent } from './ai-card-renderer.component';

describe('AICardRendererComponent (theme)', () => {
  let fixture: ComponentFixture<AICardRendererComponent>;
  let component: AICardRendererComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AICardRendererComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AICardRendererComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Reset global theme between tests
    document.documentElement.removeAttribute('data-theme');
  });

  it('should normalize explicit theme input "dark" to host data-theme="night"', () => {
    component.cardConfig = {
      cardTitle: 'Test',
      sections: [],
    } as any;
    component.theme = 'dark';

    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-theme')).toBe('night');
  });

  it('should sync host data-theme when documentElement data-theme changes', fakeAsync(() => {
    if (typeof MutationObserver === 'undefined') {
      pending('MutationObserver not available in this test environment');
      return;
    }

    document.documentElement.setAttribute('data-theme', 'day');

    component.cardConfig = {
      cardTitle: 'Test',
      sections: [],
    } as any;

    fixture.detectChanges();
    expect(fixture.nativeElement.getAttribute('data-theme')).toBe('day');

    document.documentElement.setAttribute('data-theme', 'night');
    tick(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.getAttribute('data-theme')).toBe('night');
  }));
});

