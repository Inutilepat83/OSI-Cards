/** @type { import('@storybook/angular').StorybookConfig } */
const config = {
  stories: [
    '../projects/osi-cards-lib/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-performance',
    '@chromatic-com/storybook',
  ],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../src/assets'],
  core: {
    disableTelemetry: true,
  },
  typescript: {
    check: true,
    reactDocgen: false,
  },
};
export default config;

