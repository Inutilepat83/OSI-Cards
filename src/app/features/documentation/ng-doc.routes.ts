import { Routes } from '@angular/router';

/**
 * Documentation routes
 * Auto-generated from page files - do not edit manually
 * Uses DocPageComponent (no NgDoc dependency for Angular 20 compatibility)
 * Generated: 2025-12-01T11:32:35.508Z
 */

export const NG_DOC_ROUTING: Routes = [
  {
    path: '',
    redirectTo: 'getting-started',
    pathMatch: 'full',
  },
  {
    path: 'best-practices',
    loadComponent: () => import('./best-practices/page.component').then((m) => m.default),
  },
  {
    path: 'getting-started',
    loadComponent: () => import('./getting-started/page.component').then((m) => m.default),
  },
  {
    path: 'installation',
    loadComponent: () => import('./installation/page.component').then((m) => m.default),
  },
  {
    path: 'library-usage',
    loadComponent: () => import('./library-usage/page.component').then((m) => m.default),
  },
  {
    path: 'llm-integration',
    loadComponent: () => import('./llm-integration/page.component').then((m) => m.default),
  },
  {
    path: 'library-docs',
    children: [
      {
        path: '',
        redirectTo: 'agentic-flow',
        pathMatch: 'full',
      },
      {
        path: 'agentic-flow',
        loadComponent: () =>
          import('./library-docs/agentic-flow/page.component').then((m) => m.default),
      },
      {
        path: 'events',
        loadComponent: () => import('./library-docs/events/page.component').then((m) => m.default),
      },
      {
        path: 'services',
        loadComponent: () =>
          import('./library-docs/services/page.component').then((m) => m.default),
      },
      {
        path: 'theming',
        loadComponent: () => import('./library-docs/theming/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'schemas',
    children: [
      {
        path: '',
        redirectTo: 'ai-card-config',
        pathMatch: 'full',
      },
      {
        path: 'ai-card-config',
        loadComponent: () =>
          import('./schemas/ai-card-config/page.component').then((m) => m.default),
      },
      {
        path: 'card-action',
        loadComponent: () => import('./schemas/card-action/page.component').then((m) => m.default),
      },
      {
        path: 'card-field',
        loadComponent: () => import('./schemas/card-field/page.component').then((m) => m.default),
      },
      {
        path: 'card-item',
        loadComponent: () => import('./schemas/card-item/page.component').then((m) => m.default),
      },
      {
        path: 'card-section',
        loadComponent: () => import('./schemas/card-section/page.component').then((m) => m.default),
      },
      {
        path: 'email-config',
        loadComponent: () => import('./schemas/email-config/page.component').then((m) => m.default),
      },
      {
        path: 'type-aliases',
        loadComponent: () => import('./schemas/type-aliases/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'section-types',
    children: [
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./section-types/analytics/page.component').then((m) => m.default),
      },
      {
        path: 'base',
        loadComponent: () => import('./section-types/base/page.component').then((m) => m.default),
      },
      {
        path: 'brand-colors',
        loadComponent: () =>
          import('./section-types/brand-colors/page.component').then((m) => m.default),
      },
      {
        path: 'chart',
        loadComponent: () => import('./section-types/chart/page.component').then((m) => m.default),
      },
      {
        path: 'contact-card',
        loadComponent: () =>
          import('./section-types/contact-card/page.component').then((m) => m.default),
      },
      {
        path: 'event',
        loadComponent: () => import('./section-types/event/page.component').then((m) => m.default),
      },
      {
        path: 'financials',
        loadComponent: () =>
          import('./section-types/financials/page.component').then((m) => m.default),
      },
      {
        path: 'info',
        loadComponent: () => import('./section-types/info/page.component').then((m) => m.default),
      },
      {
        path: 'list',
        loadComponent: () => import('./section-types/list/page.component').then((m) => m.default),
      },
      {
        path: 'map',
        loadComponent: () => import('./section-types/map/page.component').then((m) => m.default),
      },
      {
        path: 'network-card',
        loadComponent: () =>
          import('./section-types/network-card/page.component').then((m) => m.default),
      },
      {
        path: 'news',
        loadComponent: () => import('./section-types/news/page.component').then((m) => m.default),
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./section-types/overview/page.component').then((m) => m.default),
      },
      {
        path: 'product',
        loadComponent: () =>
          import('./section-types/product/page.component').then((m) => m.default),
      },
      {
        path: 'quotation',
        loadComponent: () =>
          import('./section-types/quotation/page.component').then((m) => m.default),
      },
      {
        path: 'social-media',
        loadComponent: () =>
          import('./section-types/social-media/page.component').then((m) => m.default),
      },
      {
        path: 'solutions',
        loadComponent: () =>
          import('./section-types/solutions/page.component').then((m) => m.default),
      },
      {
        path: 'text-reference',
        loadComponent: () =>
          import('./section-types/text-reference/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'streaming',
    children: [
      {
        path: '',
        redirectTo: 'card-updates',
        pathMatch: 'full',
      },
      {
        path: 'card-updates',
        loadComponent: () =>
          import('./streaming/card-updates/page.component').then((m) => m.default),
      },
      {
        path: 'config',
        loadComponent: () => import('./streaming/config/page.component').then((m) => m.default),
      },
      {
        path: 'error-handling',
        loadComponent: () =>
          import('./streaming/error-handling/page.component').then((m) => m.default),
      },
      {
        path: 'lifecycle',
        loadComponent: () => import('./streaming/lifecycle/page.component').then((m) => m.default),
      },
      {
        path: 'overview',
        loadComponent: () => import('./streaming/overview/page.component').then((m) => m.default),
      },
      {
        path: 'progressive-rendering',
        loadComponent: () =>
          import('./streaming/progressive-rendering/page.component').then((m) => m.default),
      },
      {
        path: 'state',
        loadComponent: () => import('./streaming/state/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'services',
    children: [
      {
        path: '',
        redirectTo: 'animation-orchestrator',
        pathMatch: 'full',
      },
      {
        path: 'animation-orchestrator',
        loadComponent: () =>
          import('./services/animation-orchestrator/page.component').then((m) => m.default),
      },
      {
        path: 'event-middleware-service',
        loadComponent: () =>
          import('./services/event-middleware-service/page.component').then((m) => m.default),
      },
      {
        path: 'icon-service',
        loadComponent: () =>
          import('./services/icon-service/page.component').then((m) => m.default),
      },
      {
        path: 'layout-worker-service',
        loadComponent: () =>
          import('./services/layout-worker-service/page.component').then((m) => m.default),
      },
      {
        path: 'magnetic-tilt-service',
        loadComponent: () =>
          import('./services/magnetic-tilt-service/page.component').then((m) => m.default),
      },
      {
        path: 'section-normalization',
        loadComponent: () =>
          import('./services/section-normalization/page.component').then((m) => m.default),
      },
      {
        path: 'section-plugin-registry',
        loadComponent: () =>
          import('./services/section-plugin-registry/page.component').then((m) => m.default),
      },
      {
        path: 'section-utils-service',
        loadComponent: () =>
          import('./services/section-utils-service/page.component').then((m) => m.default),
      },
      {
        path: 'streaming-service',
        loadComponent: () =>
          import('./services/streaming-service/page.component').then((m) => m.default),
      },
      {
        path: 'theme-service',
        loadComponent: () =>
          import('./services/theme-service/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'components',
    children: [
      {
        path: '',
        redirectTo: 'ai-card-renderer',
        pathMatch: 'full',
      },
      {
        path: 'ai-card-renderer',
        loadComponent: () =>
          import('./components/ai-card-renderer/page.component').then((m) => m.default),
      },
      {
        path: 'card-actions',
        loadComponent: () =>
          import('./components/card-actions/page.component').then((m) => m.default),
      },
      {
        path: 'card-header',
        loadComponent: () =>
          import('./components/card-header/page.component').then((m) => m.default),
      },
      {
        path: 'card-preview',
        loadComponent: () =>
          import('./components/card-preview/page.component').then((m) => m.default),
      },
      {
        path: 'card-skeleton',
        loadComponent: () =>
          import('./components/card-skeleton/page.component').then((m) => m.default),
      },
      {
        path: 'card-streaming-indicator',
        loadComponent: () =>
          import('./components/card-streaming-indicator/page.component').then((m) => m.default),
      },
      {
        path: 'masonry-grid',
        loadComponent: () =>
          import('./components/masonry-grid/page.component').then((m) => m.default),
      },
      {
        path: 'osi-cards',
        loadComponent: () => import('./components/osi-cards/page.component').then((m) => m.default),
      },
      {
        path: 'osi-cards-container',
        loadComponent: () =>
          import('./components/osi-cards-container/page.component').then((m) => m.default),
      },
      {
        path: 'section-renderer',
        loadComponent: () =>
          import('./components/section-renderer/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'integration',
    children: [
      {
        path: '',
        redirectTo: 'agent-systems',
        pathMatch: 'full',
      },
      {
        path: 'agent-systems',
        loadComponent: () =>
          import('./integration/agent-systems/page.component').then((m) => m.default),
      },
      {
        path: 'angular-18',
        loadComponent: () =>
          import('./integration/angular-18/page.component').then((m) => m.default),
      },
      {
        path: 'angular-20',
        loadComponent: () =>
          import('./integration/angular-20/page.component').then((m) => m.default),
      },
      {
        path: 'card-generation-prompt',
        loadComponent: () =>
          import('./integration/card-generation-prompt/page.component').then((m) => m.default),
      },
      {
        path: 'card-validation',
        loadComponent: () =>
          import('./integration/card-validation/page.component').then((m) => m.default),
      },
      {
        path: 'dependencies',
        loadComponent: () =>
          import('./integration/dependencies/page.component').then((m) => m.default),
      },
      {
        path: 'error-recovery',
        loadComponent: () =>
          import('./integration/error-recovery/page.component').then((m) => m.default),
      },
      {
        path: 'json-schema-llm',
        loadComponent: () =>
          import('./integration/json-schema-llm/page.component').then((m) => m.default),
      },
      {
        path: 'lazy-loading',
        loadComponent: () =>
          import('./integration/lazy-loading/page.component').then((m) => m.default),
      },
      {
        path: 'llm-overview',
        loadComponent: () =>
          import('./integration/llm-overview/page.component').then((m) => m.default),
      },
      {
        path: 'module-based',
        loadComponent: () =>
          import('./integration/module-based/page.component').then((m) => m.default),
      },
      {
        path: 'npm-installation',
        loadComponent: () =>
          import('./integration/npm-installation/page.component').then((m) => m.default),
      },
      {
        path: 'prompt-engineering',
        loadComponent: () =>
          import('./integration/prompt-engineering/page.component').then((m) => m.default),
      },
      {
        path: 'pwa',
        loadComponent: () => import('./integration/pwa/page.component').then((m) => m.default),
      },
      {
        path: 'quick-start',
        loadComponent: () =>
          import('./integration/quick-start/page.component').then((m) => m.default),
      },
      {
        path: 'rate-limiting',
        loadComponent: () =>
          import('./integration/rate-limiting/page.component').then((m) => m.default),
      },
      {
        path: 'ssr',
        loadComponent: () => import('./integration/ssr/page.component').then((m) => m.default),
      },
      {
        path: 'standalone-components',
        loadComponent: () =>
          import('./integration/standalone-components/page.component').then((m) => m.default),
      },
      {
        path: 'streaming-responses',
        loadComponent: () =>
          import('./integration/streaming-responses/page.component').then((m) => m.default),
      },
      {
        path: 'websocket-integration',
        loadComponent: () =>
          import('./integration/websocket-integration/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'advanced',
    children: [
      {
        path: '',
        redirectTo: 'accessibility',
        pathMatch: 'full',
      },
      {
        path: 'accessibility',
        loadComponent: () =>
          import('./advanced/accessibility/page.component').then((m) => m.default),
      },
      {
        path: 'css-properties',
        loadComponent: () =>
          import('./advanced/css-properties/page.component').then((m) => m.default),
      },
      {
        path: 'custom-sections',
        loadComponent: () =>
          import('./advanced/custom-sections/page.component').then((m) => m.default),
      },
      {
        path: 'error-patterns',
        loadComponent: () =>
          import('./advanced/error-patterns/page.component').then((m) => m.default),
      },
      {
        path: 'event-middleware',
        loadComponent: () =>
          import('./advanced/event-middleware/page.component').then((m) => m.default),
      },
      {
        path: 'i18n',
        loadComponent: () => import('./advanced/i18n/page.component').then((m) => m.default),
      },
      {
        path: 'performance',
        loadComponent: () => import('./advanced/performance/page.component').then((m) => m.default),
      },
      {
        path: 'security',
        loadComponent: () => import('./advanced/security/page.component').then((m) => m.default),
      },
      {
        path: 'theme-presets',
        loadComponent: () =>
          import('./advanced/theme-presets/page.component').then((m) => m.default),
      },
      {
        path: 'theming-overview',
        loadComponent: () =>
          import('./advanced/theming-overview/page.component').then((m) => m.default),
      },
    ],
  },
  {
    path: 'utilities',
    children: [
      {
        path: '',
        redirectTo: 'card-type-guards',
        pathMatch: 'full',
      },
      {
        path: 'card-type-guards',
        loadComponent: () =>
          import('./utilities/card-type-guards/page.component').then((m) => m.default),
      },
      {
        path: 'card-utils',
        loadComponent: () => import('./utilities/card-utils/page.component').then((m) => m.default),
      },
      {
        path: 'ensure-card-ids',
        loadComponent: () =>
          import('./utilities/ensure-card-ids/page.component').then((m) => m.default),
      },
      {
        path: 'is-valid-section-type',
        loadComponent: () =>
          import('./utilities/is-valid-section-type/page.component').then((m) => m.default),
      },
      {
        path: 'resolve-section-type',
        loadComponent: () =>
          import('./utilities/resolve-section-type/page.component').then((m) => m.default),
      },
      {
        path: 'sanitize-card-config',
        loadComponent: () =>
          import('./utilities/sanitize-card-config/page.component').then((m) => m.default),
      },
    ],
  },
  // Fallback for unknown routes
  {
    path: '**',
    redirectTo: 'getting-started',
  },
];
