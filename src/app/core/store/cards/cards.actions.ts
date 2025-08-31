import { createAction, props } from '@ngrx/store';
import { AICardConfig } from '../../../models/card.model';

export const loadCards = createAction('[Cards] Load Cards');

export const loadCardsSuccess = createAction(
  '[Cards] Load Cards Success',
  props<{ cards: AICardConfig[] }>()
);

export const loadCardsFailure = createAction(
  '[Cards] Load Cards Failure',
  props<{ error: string }>()
);

export const selectCard = createAction('[Cards] Select Card', props<{ card: AICardConfig }>());

export const createCard = createAction('[Cards] Create Card', props<{ card: AICardConfig }>());

export const createCardSuccess = createAction(
  '[Cards] Create Card Success',
  props<{ card: AICardConfig }>()
);

export const createCardFailure = createAction(
  '[Cards] Create Card Failure',
  props<{ error: string }>()
);

export const updateCard = createAction('[Cards] Update Card', props<{ card: AICardConfig }>());

export const updateCardSuccess = createAction(
  '[Cards] Update Card Success',
  props<{ card: AICardConfig }>()
);

export const updateCardFailure = createAction(
  '[Cards] Update Card Failure',
  props<{ error: string }>()
);

export const deleteCard = createAction('[Cards] Delete Card', props<{ cardId: string }>());

export const deleteCardSuccess = createAction(
  '[Cards] Delete Card Success',
  props<{ cardId: string }>()
);

export const deleteCardFailure = createAction(
  '[Cards] Delete Card Failure',
  props<{ error: string }>()
);

export const duplicateCard = createAction('[Cards] Duplicate Card', props<{ cardId: string }>());

export const duplicateCardSuccess = createAction(
  '[Cards] Duplicate Card Success',
  props<{ card: AICardConfig }>()
);

export const duplicateCardFailure = createAction(
  '[Cards] Duplicate Card Failure',
  props<{ error: string }>()
);

export const exportCard = createAction(
  '[Cards] Export Card',
  props<{ cardId: string; format: 'json' | 'png' | 'pdf' }>()
);

export const exportCardSuccess = createAction(
  '[Cards] Export Card Success',
  props<{ cardId: string; format: 'json' | 'png' | 'pdf'; data: any }>()
);

export const exportCardFailure = createAction(
  '[Cards] Export Card Failure',
  props<{ error: string }>()
);

export const importCard = createAction(
  '[Cards] Import Card',
  props<{ data: any; format: 'json' | 'png' | 'pdf' }>()
);

export const importCardSuccess = createAction(
  '[Cards] Import Card Success',
  props<{ card: AICardConfig }>()
);

export const importCardFailure = createAction(
  '[Cards] Import Card Failure',
  props<{ error: string }>()
);

export const searchCards = createAction('[Cards] Search Cards', props<{ query: string }>());

export const searchCardsSuccess = createAction(
  '[Cards] Search Cards Success',
  props<{ cards: AICardConfig[]; query: string }>()
);

export const searchCardsFailure = createAction(
  '[Cards] Search Cards Failure',
  props<{ error: string }>()
);

export const filterCards = createAction('[Cards] Filter Cards', props<{ filters: any }>());

export const filterCardsSuccess = createAction(
  '[Cards] Filter Cards Success',
  props<{ cards: AICardConfig[]; filters: any }>()
);

export const filterCardsFailure = createAction(
  '[Cards] Filter Cards Failure',
  props<{ error: string }>()
);

export const sortCards = createAction(
  '[Cards] Sort Cards',
  props<{ sortBy: string; sortOrder: 'asc' | 'desc' }>()
);

export const sortCardsSuccess = createAction(
  '[Cards] Sort Cards Success',
  props<{ cards: AICardConfig[]; sortBy: string; sortOrder: 'asc' | 'desc' }>()
);

export const sortCardsFailure = createAction(
  '[Cards] Sort Cards Failure',
  props<{ error: string }>()
);

export const loadCardTemplates = createAction('[Cards] Load Card Templates');

export const loadCardTemplatesSuccess = createAction(
  '[Cards] Load Card Templates Success',
  props<{ templates: AICardConfig[] }>()
);

export const loadCardTemplatesFailure = createAction(
  '[Cards] Load Card Templates Failure',
  props<{ error: string }>()
);

export const saveCardAsTemplate = createAction(
  '[Cards] Save Card As Template',
  props<{ card: AICardConfig; templateName: string }>()
);

export const saveCardAsTemplateSuccess = createAction(
  '[Cards] Save Card As Template Success',
  props<{ template: AICardConfig }>()
);

export const saveCardAsTemplateFailure = createAction(
  '[Cards] Save Card As Template Failure',
  props<{ error: string }>()
);
