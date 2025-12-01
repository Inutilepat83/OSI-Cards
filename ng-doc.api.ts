import { NgDocApi } from '@ng-doc/core';

/**
 * NgDoc API Configuration
 * 
 * Automatically generates API documentation from code comments and TypeScript types.
 * This configuration defines which files to include in the API documentation.
 */
const api: NgDocApi = {
  title: 'API Reference',
  scopes: [
    {
      name: 'osi-cards-lib',
      route: 'api/library',
      include: 'projects/osi-cards-lib/src/lib/**/*.ts',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts'
      ]
    },
    {
      name: 'core-services',
      route: 'api/services',
      include: 'src/app/core/services/**/*.ts',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    },
    {
      name: 'components',
      route: 'api/components',
      include: 'src/app/shared/components/**/*.ts',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/index.ts'
      ]
    },
    {
      name: 'models',
      route: 'api/models',
      include: 'src/app/models/**/*.ts',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    },
    {
      name: 'utilities',
      route: 'api/utilities',
      include: 'src/app/shared/utils/**/*.ts',
      exclude: [
        '**/*.spec.ts',
        '**/*.test.ts'
      ]
    }
  ]
};

export default api;













