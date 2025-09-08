import { createAction, props } from '@ngrx/store';
import { AICardConfig } from '../../models/card.model';

// Card Loading Actions
export const loadCards = createAction('[Cards] Load Cards');
export const loadCardsSuccess = createAction(
  '[Cards] Load Cards Success', 
  props<{ cards: AICardConfig[] }>()
);
export const loadCardsFailure = createAction(
  '[Cards] Load Cards Failure', 
  props<{ error: string }>()
);

// Card Type and Variant Actions
export const setCardType = createAction(
  '[Cards] Set Card Type', 
  props<{ cardType: string }>()
);
export const setCardVariant = createAction(
  '[Cards] Set Card Variant', 
  props<{ variant: number }>()
);

// JSON Input and Card Generation Actions
export const updateJsonInput = createAction(
  '[Cards] Update JSON Input', 
  props<{ jsonInput: string }>()
);
export const generateCard = createAction(
  '[Cards] Generate Card', 
  props<{ config: AICardConfig }>()
);
export const generateCardSuccess = createAction(
  '[Cards] Generate Card Success', 
  props<{ card: AICardConfig }>()
);
export const generateCardFailure = createAction(
  '[Cards] Generate Card Failure', 
  props<{ error: string }>()
);

// UI State Actions
export const toggleFullscreen = createAction('[Cards] Toggle Fullscreen');
export const setFullscreen = createAction(
  '[Cards] Set Fullscreen', 
  props<{ fullscreen: boolean }>()
);

// Template Loading Actions
export const loadTemplate = createAction(
  '[Cards] Load Template', 
  props<{ cardType: string; variant: number }>()
);
export const loadTemplateSuccess = createAction(
  '[Cards] Load Template Success', 
  props<{ template: AICardConfig }>()
);
export const loadTemplateFailure = createAction(
  '[Cards] Load Template Failure', 
  props<{ error: string }>()
);

// Clear State Actions
export const clearError = createAction('[Cards] Clear Error');
export const resetCardState = createAction('[Cards] Reset Card State');

// Performance Tracking Actions
export const trackPerformance = createAction(
  '[Cards] Track Performance', 
  props<{ action: string; duration: number }>()
);
