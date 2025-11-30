import { ApplicationConfig } from '@angular/core';
import { provideOSICards } from 'osi-cards-lib';

export const config: ApplicationConfig = {
  providers: [
    provideOSICards()
  ]
};




