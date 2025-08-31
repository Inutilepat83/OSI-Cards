import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, timer } from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  tap,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { AppState } from './enhanced-app.state';
import * as CardsActions from './cards/cards.actions';
import * as UiActions from './ui/ui.actions';
import * as UserActions from './user/user.actions';

// Mock services - replace with actual services
@Injectable()
export class CardsEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  // Load cards with error handling and retry logic
  loadCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.loadCards),
      mergeMap(() =>
        // Mock API call - replace with actual service
        of({ cards: [] }).pipe(
          map(response =>
            CardsActions.loadCardsSuccess({
              cards: response.cards,
            })
          ),
          catchError(error => of(CardsActions.loadCardsFailure({ error: error.message })))
        )
      )
    )
  );

  // Auto-save cards with debouncing
  autoSaveCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.updateCard),
      debounceTime(1000),
      distinctUntilChanged(),
      mergeMap(action =>
        // Mock save operation
        of(action).pipe(
          map(() => CardsActions.updateCardSuccess({ card: action.card })),
          catchError(error =>
            of(
              CardsActions.updateCardFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );

  // Handle card creation
  createCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.createCard),
      mergeMap(action =>
        // Mock API call
        of({ ...action.card, id: `card_${Date.now()}` }).pipe(
          map(card =>
            CardsActions.createCardSuccess({
              card,
            })
          ),
          catchError(error =>
            of(
              CardsActions.createCardFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );

  // Search cards with debouncing
  searchCards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CardsActions.searchCards),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.query === curr.query),
      mergeMap(action =>
        // Mock search API
        of({ cards: [], query: action.query }).pipe(
          map(response =>
            CardsActions.searchCardsSuccess({
              cards: response.cards,
              query: response.query,
            })
          ),
          catchError(error =>
            of(
              CardsActions.searchCardsFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );
}

@Injectable()
export class UiEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  // Auto-dismiss notifications
  autoDismissNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UiActions.addNotification),
      mergeMap(action => {
        if (action.notification.autoClose) {
          return timer(action.notification.duration).pipe(
            map(() => UiActions.removeNotification({ id: action.notification.id }))
          );
        }
        return of();
      })
    )
  );

  // Handle theme changes
  themeChange$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.setTheme),
        tap(action => {
          // Apply theme to document
          document.documentElement.setAttribute('data-theme', action.theme);
          localStorage.setItem('preferred-theme', action.theme);
        })
      ),
    { dispatch: false }
  );

  // Handle search with debouncing
  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UiActions.setSearchQuery),
      debounceTime(300),
      distinctUntilChanged(),
      map(action => UiActions.performSearch({ query: action.query }))
    )
  );

  // Perform search
  performSearch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UiActions.performSearch),
      mergeMap(action =>
        // Mock search across different entities
        of({ results: [], query: action.query }).pipe(
          map(response =>
            UiActions.searchSuccess({
              results: response.results,
              query: response.query,
            })
          ),
          catchError(error =>
            of(
              UiActions.searchFailure({
                error: error.message,
              })
            )
          )
        )
      )
    )
  );

  // Handle modal interactions
  modalInteraction$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UiActions.openModal),
        tap(() => {
          // Focus management for accessibility
          setTimeout(() => {
            const modal = document.querySelector('.modal');
            if (modal) {
              (modal as HTMLElement).focus();
            }
          }, 100);
        })
      ),
    { dispatch: false }
  );
}

@Injectable()
export class UserEffects {
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) {}

  // Handle login
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.login),
      mergeMap(action =>
        // Mock login API
        of({
          user: {
            id: '1',
            email: action.email,
            firstName: 'John',
            lastName: 'Doe',
            role: 'user' as const,
            createdAt: new Date(),
            lastLoginAt: new Date(),
          },
          token: 'mock-jwt-token',
        }).pipe(
          map(response =>
            UserActions.loginSuccess({
              user: response.user,
              token: response.token,
            })
          ),
          catchError(error => of(UserActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  // Handle logout
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.logout),
      tap(() => {
        // Clear local storage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('refresh-token');
      }),
      map(() => UserActions.logoutSuccess())
    )
  );

  // Auto-refresh token
  autoRefreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loginSuccess),
      mergeMap(() => {
        // Calculate refresh time (e.g., 5 minutes before expiry)
        const refreshTime = 5 * 60 * 1000; // 5 minutes
        return timer(refreshTime).pipe(map(() => UserActions.refreshToken()));
      })
    )
  );

  // Refresh token
  refreshToken$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.refreshToken),
      mergeMap(() =>
        // Mock token refresh
        of({
          token: 'new-mock-jwt-token',
        }).pipe(
          map(response =>
            UserActions.refreshTokenSuccess({
              token: response.token,
            })
          ),
          catchError(() => of(UserActions.refreshTokenFailure({ error: 'Token refresh failed' })))
        )
      )
    )
  );

  // Load user profile
  loadUserProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.loadUserProfile),
      mergeMap(() =>
        // Mock profile API
        of({
          id: '1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'user' as const,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }).pipe(
          map(user => UserActions.loadUserProfileSuccess({ user })),
          catchError(error => of(UserActions.loadUserProfileFailure({ error: error.message })))
        )
      )
    )
  );

  // Update user preferences
  updatePreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserActions.updateUserPreferences),
      mergeMap(action =>
        // Mock preferences update
        of(action.preferences).pipe(
          map(preferences => UserActions.updateUserPreferencesSuccess({ preferences })),
          catchError(error =>
            of(UserActions.updateUserPreferencesFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
