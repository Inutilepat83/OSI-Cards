// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    ignores: [
      '.storybook/**',
      'e2e/**',
      'tools/schematics/**',
      'ng-doc*.ts',
      'scripts/**',
      'postcss.config.js',
      'src/app/core/index.ts',
      'src/app/features/index.ts',
      'src/app/models/index.ts',
      'src/app/shared/index.ts',
      'src/app/store/index.ts',
      'projects/osi-cards-lib/**/*.ts',
    ],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // ============================================================
      // ANGULAR-SPECIFIC RULES
      // ============================================================
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      // Require use of OnPush change detection strategy
      '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
      // Prefer standalone components
      '@angular-eslint/prefer-standalone': 'warn',

      // ============================================================
      // CODE COMPLEXITY LIMITS (Point 22 - reduced from 15 to 10)
      // ============================================================
      // Enforce maximum file length to prevent overly large components
      'max-lines': [
        'warn',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Enforce maximum function complexity (reduced from 15 to 10)
      complexity: ['warn', 10],
      // Enforce maximum function length
      'max-lines-per-function': [
        'warn',
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Maximum depth of nested blocks
      'max-depth': ['warn', 4],
      // Maximum number of parameters
      'max-params': ['warn', 5],
      // Maximum number of statements in a function
      'max-statements': ['warn', 25],

      // ============================================================
      // TYPESCRIPT TYPE SAFETY (Points 2, 9, 19)
      // ============================================================
      // Explicit return types for functions (Point 19)
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
      // Explicit member accessibility
      '@typescript-eslint/explicit-member-accessibility': [
        'warn',
        {
          accessibility: 'explicit',
          overrides: {
            constructors: 'no-public',
            accessors: 'explicit',
            methods: 'explicit',
            properties: 'explicit',
            parameterProperties: 'explicit',
          },
        },
      ],
      // Disallow any type (Point 2)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Unused imports and variables
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-unused-vars': 'off',
      // Prefer const over let when possible
      'prefer-const': 'error',
      // No var declarations
      'no-var': 'error',

      // ============================================================
      // IMPORT RULES (Point 20)
      // ============================================================
      // Enforce import order
      'sort-imports': [
        'warn',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
      // No duplicate imports
      'no-duplicate-imports': 'error',
      // Warn on deep relative imports (encourage path aliases)
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['../../*', '../../../*', '../../../../*'],
              message: 'Prefer path aliases (@osi-cards/*) over deep relative imports',
            },
          ],
        },
      ],

      // ============================================================
      // CODE QUALITY
      // ============================================================
      // Enforce consistent return statements
      'consistent-return': 'warn',
      // Require default cases in switch statements
      'default-case': 'warn',
      // Disallow empty functions
      'no-empty-function': ['warn', { allow: ['constructors'] }],
      // No console statements in production
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // No debugger statements
      'no-debugger': 'error',
      // Require curly braces for all control statements
      curly: ['warn', 'all'],
      // Enforce dot notation when possible
      'dot-notation': 'warn',
      // Require === and !==
      eqeqeq: ['error', 'always'],
      // No magic numbers (except common ones)
      'no-magic-numbers': [
        'warn',
        {
          ignore: [-1, 0, 1, 2, 100],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          enforceConst: true,
        },
      ],

      // ============================================================
      // ERROR HANDLING
      // ============================================================
      '@typescript-eslint/no-floating-promises': 'warn',
      'no-throw-literal': 'warn',
      '@typescript-eslint/only-throw-error': 'warn',
      // Prefer Promise.reject with Error
      'prefer-promise-reject-errors': 'warn',

      // ============================================================
      // NAMING CONVENTIONS (Point 21)
      // ============================================================
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
          filter: {
            regex:
              '^(AICardConfig|CardSection|CardField|CardItem|CardAction|EmailConfig|EmailContact)$',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['const', 'exported'],
          format: ['UPPER_CASE', 'camelCase'],
        },
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        {
          selector: 'method',
          format: ['camelCase'],
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
      ],
    },
  },
  {
    files: ['projects/osi-cards-lib/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.json',
          './projects/osi-cards-lib/tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      // Library-specific rules can be added here if needed
      // For now, inherit from main config
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // ============================================================
      // TEMPLATE ACCESSIBILITY (Point 23)
      // ============================================================
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/elements-content': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/no-autofocus': 'warn',
      '@angular-eslint/template/no-positive-tabindex': 'error',
      '@angular-eslint/template/role-has-required-aria': 'warn',
      '@angular-eslint/template/table-scope': 'warn',
      '@angular-eslint/template/valid-aria': 'error',

      // ============================================================
      // TEMPLATE BEST PRACTICES
      // ============================================================
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/no-call-expression': 'warn',
      '@angular-eslint/template/use-track-by-function': 'warn',
    },
  }
);
