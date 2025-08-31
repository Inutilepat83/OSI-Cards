import { AICardConfig, InitializationResult } from '../types';

class LocalInitializationService {
  private static instance: LocalInitializationService;
  private isInitialized = false;

  static getInstance(): LocalInitializationService {
    if (!LocalInitializationService.instance) {
      LocalInitializationService.instance = new LocalInitializationService();
    }
    return LocalInitializationService.instance;
  }

  async initialize(): Promise<InitializationResult> {
    try {
      console.log('🚀 LocalInitializationService: Starting initialization...');
      
      const warnings: string[] = [];
      
      // Import the service dynamically to avoid circular dependencies
      const { localCardConfigurationService } = await import('./localCardConfigurationService');
      
      // Verify template service is working
      const availableTypes = localCardConfigurationService.getAvailableCardTypes();
      console.log('📋 Available card types:', availableTypes);
      
      if (availableTypes.length === 0) {
        throw new Error('No card types available in template service');
      }

      // Load default template (Company, Variant 1)
      const defaultTemplate = await localCardConfigurationService.getTemplate('Company', 1);
      
      if (!defaultTemplate) {
        throw new Error('Failed to load default Company template variant 1');
      }

      console.log('✅ Default template loaded:', defaultTemplate.cardTitle);

      // Validate the default template
      const validation = localCardConfigurationService.validateCardConfig(defaultTemplate);
      if (!validation.isValid) {
        warnings.push(`Default template validation warnings: ${validation.errors.join(', ')}`);
      }

      // Check template availability for all types
      for (const cardType of availableTypes) {
        const templateCount = localCardConfigurationService.getTemplateCount(cardType);
        console.log(`📊 ${cardType}: ${templateCount} templates available`);
        
        if (templateCount === 0) {
          warnings.push(`No templates available for card type: ${cardType}`);
        }
      }

      // Verify localStorage is available
      try {
        localStorage.setItem('osi-test', 'test');
        localStorage.removeItem('osi-test');
      } catch (error) {
        warnings.push('localStorage not available - saving/loading features will be limited');
      }

      // Test card generation ID service
      const testId = localCardConfigurationService.generateCardId();
      if (!testId || testId.length < 10) {
        warnings.push('Card ID generation may not be working properly');
      }

      this.isInitialized = true;
      
      console.log('✅ LocalInitializationService: Initialization completed successfully');
      
      return {
        success: true,
        initialCard: defaultTemplate,
        warnings
      };

    } catch (error) {
      console.error('❌ LocalInitializationService: Initialization failed:', error);
      
      // Create a minimal fallback card
      const fallbackCard: AICardConfig = {
        id: 'fallback-card',
        cardTitle: 'System Initialization Failed',
        cardType: 'Company',
        sections: [
          {
            id: 'error-info',
            title: 'System Status',
            type: 'info',
            fields: [
              {
                id: 'status',
                label: 'Status',
                value: 'Initialization Error'
              },
              {
                id: 'error',
                label: 'Error Details',
                value: error instanceof Error ? error.message : 'Unknown error occurred'
              },
              {
                id: 'timestamp',
                label: 'Time',
                value: new Date().toLocaleString()
              }
            ]
          }
        ]
      };

      return {
        success: false,
        initialCard: fallbackCard,
        warnings: [
          'System initialization failed',
          error instanceof Error ? error.message : 'Unknown error',
          'Using fallback configuration'
        ]
      };
    }
  }

  async reinitialize(): Promise<InitializationResult> {
    console.log('🔄 LocalInitializationService: Reinitializing...');
    this.isInitialized = false;
    return this.initialize();
  }

  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  async getSystemInfo() {
    try {
      const { localCardConfigurationService } = await import('./localCardConfigurationService');
      const availableTypes = localCardConfigurationService.getAvailableCardTypes();
      const templateCounts = availableTypes.reduce((acc, type) => {
        acc[type] = localCardConfigurationService.getTemplateCount(type);
        return acc;
      }, {} as Record<string, number>);

      const totalTemplates = Object.values(templateCounts).reduce((sum, count) => sum + count, 0);

      return {
        isInitialized: this.isInitialized,
        availableCardTypes: availableTypes,
        templateCounts,
        totalTemplates,
        initializationTime: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      return {
        isInitialized: false,
        availableCardTypes: [],
        templateCounts: {},
        totalTemplates: 0,
        initializationTime: new Date().toISOString()
      };
    }
  }
}

export const localInitializationService = LocalInitializationService.getInstance();
export default localInitializationService;