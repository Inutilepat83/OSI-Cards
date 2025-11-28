// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    ignores: [
      ".storybook/**",
      "e2e/**",
      "tools/schematics/**",
      "ng-doc*.ts",
      "scripts/**",
      "postcss.config.js",
    ],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      // Enforce maximum file length to prevent overly large components
      "max-lines": [
        "warn",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Enforce maximum function complexity
      "complexity": ["warn", 15],
      // Enforce maximum function length
      "max-lines-per-function": [
        "warn",
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Enforce consistent return statements
      "consistent-return": "warn",
      // Require default cases in switch statements
      "default-case": "warn",
      // Disallow empty functions
      "no-empty-function": ["warn", { allow: ["constructors"] }],
      // Require use of OnPush change detection strategy
      "@angular-eslint/prefer-on-push-component-change-detection": "warn",
      // Unused imports and variables
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "no-unused-vars": "off", // Turn off base rule as it conflicts with TypeScript version
      // Error handling patterns
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "warn",
      "no-throw-literal": "warn",
      "@typescript-eslint/only-throw-error": "warn",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {},
  },
);
