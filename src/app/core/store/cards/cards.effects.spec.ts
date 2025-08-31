/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';
import { reducers } from '../app.reducer';
import { CardsEffects } from './cards.effects';
import { LocalCardConfigurationService } from '../../services/local-card-configuration.service';

describe('CardsEffects', () => {
  let effects: CardsEffects;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot(reducers)],
      providers: [CardsEffects, LocalCardConfigurationService],
    });

    effects = TestBed.inject(CardsEffects);
  });

  it('should be created', () => {
    expect(!!effects).toBe(true);
  });
});
