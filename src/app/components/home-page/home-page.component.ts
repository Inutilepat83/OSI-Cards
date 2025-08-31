import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AICardConfig } from '../../models/card.model';
import { LocalCardConfigurationService } from '../../core/services/local-card-configuration.service';
import { LocalInitializationService } from '../../core/services/local-initialization.service';
import { LoggingService } from '../../core/services/logging.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  providers: [MessageService],
})
export class HomePageComponent implements OnInit {
  jsonInput = new FormControl('{}', [Validators.required, this.jsonValidator]);

  cardTypes: ('company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event')[] = [
    'company',
    'contact',
    'opportunity',
    'product',
    'analytics',
    'event',
  ];

  cardType: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event' = 'company';
  cardVariant: 1 | 2 | 3 = 1;
  generatedCard: AICardConfig | null = null;
  isGenerating = false;
  systemStats = { totalFiles: 18 };
  switchingType = false;
  jsonError = '';
  isJsonValid = true;
  isInitialized = false;
  isFullscreen = false;

  @ViewChild('cardPreview') cardPreview!: ElementRef;

  constructor(
    private cardConfigService: LocalCardConfigurationService,
    private initService: LocalInitializationService,
    private messageService: MessageService,
    private logger: LoggingService
  ) {}

  ngOnInit(): void {
    // Initialize system
    this.initializeSystem();

    // Setup JSON input listener with validation
    this.jsonInput.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(value => {
      if (value) {
        this.validateJsonInput(value);
        if (this.isJsonValid) {
          this.generateCard(value);
        }
      }
    });

    // Load from localStorage if available
    this.loadSavedConfiguration();
  }

  // Custom JSON validator
  jsonValidator(control: FormControl): { [key: string]: any } | null {
    try {
      JSON.parse(control.value);
      return null;
    } catch {
      return { jsonInvalid: true };
    }
  }

  validateJsonInput(value: string): void {
    try {
      JSON.parse(value);
      this.isJsonValid = true;
      this.jsonError = '';
    } catch (error: any) {
      this.isJsonValid = false;
      this.jsonError = error.message;
    }
  }

  initializeSystem(): void {
    this.initService.initialize().subscribe((result: any) => {
      if (result.success && result.initialCard) {
        // Clean the template
        const cleanTemplate = this.removeAllIds(result.initialCard);
        const templateJson = JSON.stringify(cleanTemplate, null, 2);

        this.jsonInput.setValue(templateJson);
        this.isInitialized = true;

        // Show success message
        this.messageService.add({
          severity: 'success',
          summary: 'System Initialized',
          detail: 'Templates and services loaded successfully',
        });

        // Show warnings if any
        if (result.warnings.length > 0) {
          this.logger.warn('HomePageComponent', 'Initialization warnings', result.warnings);
          result.warnings.forEach((warning: any) => {
            this.messageService.add({
              severity: 'warn',
              summary: 'Warning',
              detail: warning,
            });
          });
        }
      } else {
        this.logger.error('HomePageComponent', 'Initialization failed');

        this.messageService.add({
          severity: 'error',
          summary: 'Initialization Failed',
          detail: 'Could not load required templates',
        });

        // Set fallback minimal card
        const minimalFallback: AICardConfig = {
          cardTitle: 'System Initialization Failed',
          cardType: 'company',
          sections: [
            {
              title: 'Error Details',
              type: 'info',
              fields: [
                {
                  label: 'Error',
                  value: 'Failed to initialize system',
                },
              ],
            },
          ],
        };

        this.jsonInput.setValue(JSON.stringify(minimalFallback, null, 2));
        this.isInitialized = true;
      }
    });
  }

  generateCard(inputJson: string, silentMode = false): void {
    try {
      this.isGenerating = true;

      // Check if JSON is empty
      if (!inputJson || inputJson.trim() === '' || inputJson.trim() === '{}') {
        this.generatedCard = null;
        this.isJsonValid = true;
        this.jsonError = '';
        return;
      }

      const data = JSON.parse(inputJson);

      // Auto-generate ID if not provided
      if (!data.id) {
        data.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Validate card data
      if (data.cardTitle && data.cardType && data.sections && Array.isArray(data.sections)) {
        this.generatedCard = data;
        this.isJsonValid = true;
        this.jsonError = '';

        if (!silentMode) {
          this.messageService.add({
            severity: 'success',
            summary: 'Card Generated',
            detail: 'Card configuration loaded successfully',
          });
        }
      } else {
        throw new Error(
          'Invalid card configuration format - missing required fields (cardTitle, cardType, sections)'
        );
      }
    } catch (error: any) {
      this.logger.error('HomePageComponent', 'Card generation error', error);
      this.isJsonValid = false;
      this.jsonError = error.message;
      this.generatedCard = null;

      if (!silentMode) {
        this.messageService.add({
          severity: 'error',
          summary: 'Card Generation Failed',
          detail: error.message,
        });
      }
    } finally {
      this.isGenerating = false;
    }
  }

  switchCardType(
    type: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event'
  ): void {
    if (this.switchingType) return;

    this.switchingType = true;
    this.cardType = type;

    this.cardConfigService.getTemplate(type, this.cardVariant).subscribe(
      (template: any) => {
        if (template) {
          // Clean the template
          const cleanTemplate = this.removeAllIds(template);
          const templateJson = JSON.stringify(cleanTemplate, null, 2);

          this.jsonInput.setValue(templateJson);
          this.messageService.add({
            severity: 'success',
            summary: 'Template Loaded',
            detail: `${type.charAt(0).toUpperCase() + type.slice(1)} template (variant ${this.cardVariant}) loaded`,
          });
        }
        this.switchingType = false;
      },
      (error: any) => {
        this.logger.error('HomePageComponent', 'Error switching card type', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Template Error',
          detail: `Failed to load ${type} template`,
        });
        this.switchingType = false;
      }
    );
  }

  handleVariantChange(variant: any): void {
    if (this.switchingType) return;

    // Ensure variant is one of the allowed values: 1, 2, or 3
    const safeVariant =
      variant === 1 || variant === 2 || variant === 3 ? (variant as 1 | 2 | 3) : 1;
    this.cardVariant = safeVariant;
    this.switchingType = true;

    this.cardConfigService.getTemplate(this.cardType, safeVariant).subscribe(
      (template: any) => {
        if (template) {
          // Clean the template
          const cleanTemplate = this.removeAllIds(template);
          const templateJson = JSON.stringify(cleanTemplate, null, 2);

          this.jsonInput.setValue(templateJson);
          this.messageService.add({
            severity: 'success',
            summary: 'Variant Loaded',
            detail: `${this.cardType.charAt(0).toUpperCase() + this.cardType.slice(1)} variant ${variant} loaded`,
          });
        }
        this.switchingType = false;
      },
      (error: any) => {
        this.logger.error('HomePageComponent', 'Error switching variant', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Variant Error',
          detail: `Failed to load variant ${variant}`,
        });
        this.switchingType = false;
      }
    );
  }

  handleFieldInteraction(data: any): void {
    this.logger.log('HomePageComponent', 'Field interaction in preview', data);
    this.messageService.add({
      severity: 'info',
      summary: 'Field Interaction',
      detail: `Clicked on field: ${data.field.label}`,
    });
  }

  handleCardInteraction(event: any): void {
    this.logger.log('HomePageComponent', 'Card interaction in preview', event);
    this.messageService.add({
      severity: 'info',
      summary: 'Card Interaction',
      detail: `Action: ${event.action}`,
    });
  }

  handleFullscreenToggle(fullscreen: boolean): void {
    this.isFullscreen = fullscreen;
  }

  // Save current configuration to localStorage
  saveConfiguration(): void {
    if (!this.isJsonValid || !this.generatedCard) {
      this.messageService.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Cannot save invalid configuration',
      });
      return;
    }

    try {
      const key = `osi-card-config-${this.cardType}-${this.cardVariant}`;
      localStorage.setItem(key, this.jsonInput.value as string);

      this.messageService.add({
        severity: 'success',
        summary: 'Configuration Saved',
        detail: 'Card configuration saved to local storage',
      });
    } catch (error: any) {
      this.logger.error('HomePageComponent', 'Error saving configuration', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Could not save to local storage',
      });
    }
  }

  // Load saved configuration from localStorage
  loadSavedConfiguration(): void {
    try {
      const key = `osi-card-config-${this.cardType}-${this.cardVariant}`;
      const saved = localStorage.getItem(key);

      if (saved) {
        this.validateJsonInput(saved);
        if (this.isJsonValid) {
          this.jsonInput.setValue(saved);
          this.messageService.add({
            severity: 'info',
            summary: 'Configuration Loaded',
            detail: 'Loaded saved configuration from local storage',
          });
        }
      }
    } catch (error: any) {
      this.logger.error('HomePageComponent', 'Error loading saved configuration', error);
    }
  }

  // Export card as PNG
  exportAsPng(): void {
    if (!this.generatedCard || !this.cardPreview) {
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'No card to export',
      });
      return;
    }

    try {
      // This would use html2canvas or similar library to export
      // For this demonstration, we'll just show a success message
      this.messageService.add({
        severity: 'success',
        summary: 'Card Exported',
        detail: 'Card exported as PNG',
      });
    } catch (error: any) {
      this.logger.error('HomePageComponent', 'Error exporting PNG', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Export Failed',
        detail: 'Could not export card as PNG',
      });
    }
  }

  // Helper method to remove all IDs from objects recursively
  private removeAllIds(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeAllIds(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'id') {
          newObj[key] = this.removeAllIds(value);
        }
      }
      return newObj;
    }
    return obj;
  }
}
