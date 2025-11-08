import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { provideAppStore } from '../../../../store/app.state';
import { provideCardsFeature } from '@data-access/cards';

describe('HomePageComponent (a11y smoke)', () => {
  let fixture: ComponentFixture<HomePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        provideAppStore(),
        provideCardsFeature()
      ]
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


