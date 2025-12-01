import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { HomePageComponent } from './home-page.component';
import { reducer as cardsReducer } from '../../../../store/cards/cards.state';

describe('HomePageComponent (a11y smoke)', () => {
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideStore({ cards: cardsReducer })],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
  });

  it('renders a main landmark and a status live region', () => {
    const main = fixture.nativeElement.querySelector('main');
    const status = fixture.nativeElement.querySelector('[role="status"], [role="alert"]');
    expect(main).toBeTruthy();
    expect(status).toBeTruthy();
  });
});
