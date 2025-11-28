import { NgDocConfiguration } from '@ng-doc/builder';

/**
 * NgDoc Configuration
 * 
 * Main configuration for ng-doc documentation generation.
 * Defines where documentation pages are located and how they're organized.
 */
const config: NgDocConfiguration = {
  pages: 'src/app/features/documentation',
  route: 'docs',
  appRoot: 'src',
  keywords: {
    'OSI Cards': {
      title: 'OSI Cards Library',
      description: 'OrangeSales Intelligence OSI Cards - A versatile card generator for sales intelligence agents',
      url: 'https://github.com/Inutilepat83/OSI-Cards'
    },
    'LLM': {
      title: 'LLM Integration',
      description: 'Large Language Model integration for card generation',
      url: '/docs/llm-integration'
    },
    'Section Types': {
      title: 'Section Types',
      description: 'All available section types for card composition',
      url: '/docs/section-types'
    },
    'AICardConfig': {
      title: 'AICardConfig',
      description: 'Main card configuration interface',
      url: '/docs/api/models/aicardconfig'
    },
    'CardSection': {
      title: 'CardSection',
      description: 'Card section interface',
      url: '/docs/api/models/cardsection'
    }
  }
};

export default config;

