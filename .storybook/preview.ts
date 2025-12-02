import { setCompodocJson } from '@storybook/addon-docs/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

// Import styles
import '!style-loader!css-loader!sass-loader!../src/styles.scss';

// Import compodoc documentation if available
// setCompodocJson(require('../documentation.json'));

/**
 * Global decorator for all stories
 * Provides Angular application configuration and module metadata
 */
export const decorators = [
  moduleMetadata({
    imports: []
  }),
  applicationConfig({
    providers: [
      provideAnimations(),
      provideHttpClient(withInterceptorsFromDi()),
      provideRouter([]),
      importProvidersFrom(BrowserModule)
    ]
  })
];

/**
 * Global parameters for all stories
 */
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i
    },
    expanded: true,
    sort: 'requiredFirst'
  },
  docs: {
    toc: true,
    source: {
      type: 'code',
      state: 'open'
    }
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff'
      },
      {
        name: 'dark',
        value: '#1a1a1a'
      },
      {
        name: 'gray',
        value: '#f5f5f5'
      }
    ]
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px'
        }
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px'
        }
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1920px',
          height: '1080px'
        }
      }
    }
  },
  layout: 'padded',
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true
        },
        {
          id: 'keyboard-accessibility',
          enabled: true
        }
      ]
    },
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true
    }
  }
};

/**
 * Global arg types for consistent controls across stories
 */
export const argTypes = {
  theme: {
    control: 'select',
    options: ['light', 'dark'],
    description: 'Theme for the component'
  }
};















