import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Zap, Code2, Sparkles, Target, Settings, FileText, Download, Save, Grid } from 'lucide-react';

import { AICardRenderer } from './AICardRenderer';
import { FlexGridContainer, FlexGridItem } from './ui/CardGrid';
import { toast } from "sonner@2.0.3";
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { AICardConfig } from '../types';

interface HomePageProps {
  documentsFileCount?: number;
}

export const HomePage: React.FC<HomePageProps> = ({ documentsFileCount = 18 }) => {
  const [jsonInput, setJsonInput] = useState('{}');
  const [cardType, setCardType] = useState<'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event'>('company');
  const [cardVariant, setCardVariant] = useState<1 | 2 | 3>(1);
  const [generatedCard, setGeneratedCard] = useState<AICardConfig | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [systemStats, setSystemStats] = useState<{ totalFiles: number }>({ totalFiles: documentsFileCount });
  const [switchingType, setSwitchingType] = useState(false);
  const [jsonError, setJsonError] = useState<string>('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedJsonRef = useRef<string>(''); // Track last processed JSON to prevent loops

  // Helper function to remove all IDs from objects recursively
  const removeAllIds = useCallback((obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => removeAllIds(item));
    } else if (obj && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key !== 'id') { // Skip all id fields
          newObj[key] = removeAllIds(value);
        }
      }
      return newObj;
    }
    return obj;
  }, []);

  // Debounced card generation to avoid rapid updates - Fixed version without jsonInput in dependencies
  const generateCard = useCallback(async (inputJson: string, silentMode = false) => {
    // Prevent processing the same JSON multiple times
    if (lastProcessedJsonRef.current === inputJson) {
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // Check if inputJson is empty or whitespace only
      if (!inputJson || inputJson.trim() === '' || inputJson.trim() === '{}') {
        if (!silentMode) {
          console.log('🔍 JSON input is empty, skipping card generation');
        }
        setGeneratedCard(null);
        setIsJsonValid(true);
        setJsonError('');
        lastProcessedJsonRef.current = inputJson;
        return;
      }
      
      const data = JSON.parse(inputJson);
      
      // Auto-generate id if not provided (for internal use only)
      if (!data.id) {
        data.id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Auto-generate section and field IDs if missing
      if (data.sections && Array.isArray(data.sections)) {
        data.sections = data.sections.map((section: any, sIndex: number) => {
          if (!section.id) {
            section.id = `section_${sIndex}`;
          }
          if (section.fields && Array.isArray(section.fields)) {
            section.fields = section.fields.map((field: any, fIndex: number) => {
              if (!field.id) {
                field.id = `field_${sIndex}_${fIndex}`;
              }
              return field;
            });
          }
          return section;
        });
      }

      // Auto-generate action IDs if missing
      if (data.actions && Array.isArray(data.actions)) {
        data.actions = data.actions.map((action: any, aIndex: number) => {
          if (!action.id) {
            action.id = `action_${aIndex}`;
          }
          return action;
        });
      }
      
      // Validate and use the card data
      if (data.cardTitle && data.cardType && data.sections && Array.isArray(data.sections)) {
        console.log('✅ Setting generated card:', data);
        setGeneratedCard(data);
        setIsJsonValid(true);
        setJsonError('');
        lastProcessedJsonRef.current = inputJson; // Mark as processed
        if (!silentMode) {
          toast.success('Card configuration loaded successfully!');
        }
      } else {
        throw new Error('Invalid card configuration format - missing required fields (cardTitle, cardType, sections)');
      }
    } catch (error: any) {
      console.error('❌ Card generation error:', error);
      setIsJsonValid(false);
      setJsonError(error.message);
      if (!silentMode) {
        toast.error(`Error generating card: ${error.message}`);
      }
      setGeneratedCard(null);
      lastProcessedJsonRef.current = inputJson; // Mark as processed even if error
    } finally {
      setIsGenerating(false);
    }
  }, []); // No dependencies to prevent loops

  // Debounced JSON processing - Fixed to prevent infinite loops
  useEffect(() => {
    if (!isInitialized) return; // Don't process until initialized
    
    // Skip if this JSON was already processed
    if (lastProcessedJsonRef.current === jsonInput) {
      return;
    }

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      generateCard(jsonInput, true);
    }, 300); // 300ms delay

    // Cleanup
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [jsonInput, isInitialized, generateCard]);

  const switchCardType = useCallback(async (type: 'company' | 'contact' | 'opportunity' | 'product' | 'analytics' | 'event') => {
    if (switchingType) return; // Prevent concurrent switches
    
    try {
      setSwitchingType(true);
      setCardType(type);
      
      console.log(`🔄 Switching to ${type} card type, variant ${cardVariant}...`);
      
      // Import and use the local card configuration service
      const localCardConfigurationService = (await import('../services/localCardConfigurationService')).default;
      const template = await localCardConfigurationService.getTemplate(type, cardVariant);
      
      if (template) {
        // Clean the template for JSON display - remove ALL IDs and unused fields
        const cleanTemplate = removeAllIds({ ...template });
        delete cleanTemplate.cardSubtitle;
        
        const templateJson = JSON.stringify(cleanTemplate, null, 2);
        console.log(`✅ Template loaded for ${type} variant ${cardVariant}, JSON length: ${templateJson.length}`);
        
        // Reset the processed JSON reference before updating
        lastProcessedJsonRef.current = '';
        setJsonInput(templateJson);
        
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} template (variant ${cardVariant}) loaded!`);
      } else {
        throw new Error(`No template available for ${type} variant ${cardVariant}`);
      }
      
    } catch (error) {
      console.error(`❌ Error switching to ${type} template variant ${cardVariant}:`, error);
      
      // Set a minimal fallback card as last resort
      const minimalFallback = {
        cardTitle: `Error Loading ${type.charAt(0).toUpperCase() + type.slice(1)} Card`,
        cardType: 'Company' as const,
        sections: []
      };
      
      lastProcessedJsonRef.current = '';
      setJsonInput(JSON.stringify(minimalFallback, null, 2));
      toast.error(`Failed to load ${type} template variant ${cardVariant}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSwitchingType(false);
    }
  }, [cardVariant, removeAllIds, switchingType]);

  // Handle variant change with immediate template switching
  const handleVariantChange = useCallback(async (variant: 1 | 2 | 3) => {
    if (switchingType) return; // Prevent concurrent switches
    
    console.log(`🔄 Changing to variant ${variant} for ${cardType}`);
    setCardVariant(variant);
    
    try {
      setSwitchingType(true);
      
      const localCardConfigurationService = (await import('../services/localCardConfigurationService')).default;
      const template = await localCardConfigurationService.getTemplate(cardType, variant);
      
      if (template) {
        // Clean the template for JSON display - remove ALL IDs and unused fields
        const cleanTemplate = removeAllIds({ ...template });
        delete cleanTemplate.cardSubtitle;
        
        const templateJson = JSON.stringify(cleanTemplate, null, 2);
        
        // Reset the processed JSON reference before updating
        lastProcessedJsonRef.current = '';
        setJsonInput(templateJson);
        toast.success(`${cardType.charAt(0).toUpperCase() + cardType.slice(1)} variant ${variant} loaded!`);
      }
    } catch (error) {
      console.error('Error switching variant:', error);
      toast.error('Failed to load variant');
    } finally {
      setSwitchingType(false);
    }
  }, [cardType, removeAllIds, switchingType]);

  // Handle keyboard shortcuts for JSON editor
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Ctrl/Cmd + A to select all
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      if (textareaRef.current) {
        textareaRef.current.select();
      }
    }
    
    // Handle Tab for proper indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character
      const newValue = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      
      // Reset processed reference before updating
      lastProcessedJsonRef.current = '';
      setJsonInput(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }, []);

  // Handle JSON input changes
  const handleJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Reset processed reference before updating
    lastProcessedJsonRef.current = '';
    setJsonInput(e.target.value);
  }, []);

  // Load initial template and system stats using local services
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 HomePage: Starting local data initialization...');
        
        // Import the local initialization service
        const localInitializationService = (await import('../services/localInitializationService')).default;
        const result = await localInitializationService.initialize();
        
        console.log('📊 Initialization result:', result);
        
        if (result.success && result.initialCard) {
          // Clean the template for JSON display - remove ALL IDs and unused fields
          const cleanTemplate = removeAllIds({ ...result.initialCard });
          delete cleanTemplate.cardSubtitle;
          
          const templateJson = JSON.stringify(cleanTemplate, null, 2);
          console.log('✅ Setting initial card JSON:', templateJson.length, 'characters');
          
          lastProcessedJsonRef.current = ''; // Reset before setting initial
          setJsonInput(templateJson);
          setCardType('company');
          setIsInitialized(true); // Mark as initialized
          
          toast.success('System initialized successfully in local mode!');
          
          // Show any warnings
          if (result.warnings.length > 0) {
            console.warn('⚠️ Initialization warnings:', result.warnings);
            result.warnings.forEach(warning => {
              toast.warning(warning, { duration: 3000 });
            });
          }
        } else {
          throw new Error(`Local initialization failed: ${result.warnings.join(', ')}`);
        }
        
      } catch (error) {
        console.error('❌ Error initializing local data:', error);
        toast.error(`Failed to initialize system: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Set a minimal fallback card as last resort
        const minimalFallback = {
          cardTitle: 'System Initialization Failed',
          cardType: 'Company' as const,
          sections: [
            {
              title: 'Error Details',
              type: 'info' as const,
              fields: [
                {
                  label: 'Error',
                  value: error instanceof Error ? error.message : 'Unknown error'
                }
              ]
            }
          ]
        };
        
        console.log('🚨 Setting fallback card:', minimalFallback);
        lastProcessedJsonRef.current = '';
        setJsonInput(JSON.stringify(minimalFallback, null, 2));
        setIsInitialized(true); // Mark as initialized even with fallback
      }
    };

    // Initialize immediately when component mounts
    initializeData();
  }, [documentsFileCount, removeAllIds]);

  const handleFieldInteraction = useCallback((data: any) => {
    console.log('Field interaction in preview:', data);
  }, []);

  const handleCardInteraction = useCallback((action: string, card: AICardConfig) => {
    console.log('Card interaction in preview:', action, card);
  }, []);

  const handleFullscreenToggle = useCallback((fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-background px-4 sm:px-6 py-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4">
              <span className="text-white">Orange </span>
              <span className="text-primary">Sales Intelligence</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-12 lg:mb-16 px-4">
              OSI Cards is a versatile card generator used by sales intelligence agents. 
              It features structured formatting that can design cards for any form of business intelligence data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 lg:mb-20">
            <Card className="bg-card border border-border/50 text-foreground hover:border-primary/50 transition-colors">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">AI-Powered Generation</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Intelligent card generation with magnetic physics and interactive animations
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border/50 text-foreground hover:border-primary/50 transition-colors">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Instant Generation</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Real-time conversion from JSON data to interactive business cards
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border border-border/50 text-foreground hover:border-primary/50 transition-colors md:col-span-2 lg:col-span-1">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                  <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">JSON Configuration</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Simple, powerful JSON-driven card creation and customization
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interactive Demo Section */}
      <div className="px-4 sm:px-6 py-2">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-6">Interactive Demo</h3>
            
            {/* Card Type Selector with Label */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
              <span className="text-sm text-muted-foreground">Card Type:</span>
              <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                {(['company', 'contact', 'opportunity', 'product', 'analytics', 'event'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => switchCardType(type)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
                      cardType === type
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg scale-105'
                        : 'bg-card text-foreground border border-border hover:border-primary/50 hover:scale-105'
                    }`}
                    disabled={switchingType}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Variant Selector - Enhanced with live switching */}
            <div className="flex justify-center items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
              <span className="text-sm text-muted-foreground">Variants:</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((variant) => (
                  <button
                    key={variant}
                    onClick={() => handleVariantChange(variant as 1 | 2 | 3)}
                    className={`w-8 h-8 rounded-full text-xs font-medium transition-all duration-200 ${
                      cardVariant === variant
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg scale-110'
                        : 'bg-card text-foreground border border-border hover:border-primary/50 hover:scale-105'
                    }`}
                    disabled={switchingType}
                    title={`Load variant ${variant} of ${cardType} template`}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>


          </div>



          {/* Enhanced Responsive Layout with Fullscreen Support */}
          <div className={`transition-all duration-500 ease-in-out mb-16 min-h-[800px] ${
            isFullscreen 
              ? 'flex flex-col gap-8' 
              : 'grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8 items-start'
          }`}>
            
            {/* Card Preview - Full width when fullscreen, otherwise responsive */}
            <div className={`flex flex-col ${isFullscreen ? 'order-1 w-full' : 'lg:col-span-3 order-2 lg:order-2'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-semibold">Live Preview</span>
                {generatedCard && (
                  <span className="text-sm text-muted-foreground">
                    • {generatedCard.cardType} Card
                  </span>
                )}
                {isFullscreen && (
                  <Badge className="bg-primary/20 text-primary border-primary/30 ml-2">
                    Fullscreen Mode
                  </Badge>
                )}
              </div>

              <div className="flex-1">
                {isGenerating || !isInitialized ? (
                  /* Loading State */
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-20">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <div>
                      <p className="text-lg font-medium text-foreground">
                        {!isInitialized ? 'Initializing System...' : 'Generating Card...'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {!isInitialized ? 'Loading templates and services' : 'Processing your configuration'}
                      </p>
                    </div>
                  </div>
                ) : generatedCard ? (
                  /* Card Display */
                  <div className={`w-full ${isFullscreen ? 'max-w-none' : ''}`}>
                    <AICardRenderer
                      cardConfig={generatedCard}
                      onFieldInteraction={handleFieldInteraction}
                      onCardInteraction={handleCardInteraction}
                      className="w-full"
                      isFullscreen={isFullscreen}
                      onFullscreenToggle={handleFullscreenToggle}
                    />
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                      <Code2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-foreground mb-2">No Card Preview</p>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        Enter a valid JSON configuration or select a template to see your card preview here.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Valid JSON will auto-generate cards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span>Interactive effects respond to mouse</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        <span>Export cards as high-quality PNG</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* JSON Configuration - Full width when fullscreen, otherwise responsive */}
            <div className={`flex flex-col space-y-4 ${isFullscreen ? 'order-2 w-full' : 'lg:col-span-2 order-1 lg:order-1'}`}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold">JSON Configuration</span>
                {!isJsonValid && (
                  <Badge variant="destructive" className="text-xs">
                    Invalid JSON
                  </Badge>
                )}
              </div>
              
              <Textarea
                ref={textareaRef}
                value={jsonInput}
                onChange={handleJsonChange}
                onKeyDown={handleKeyDown}
                className={`font-mono text-sm resize-none overflow-y-auto border-2 transition-all duration-300 ${
                  isJsonValid ? 'border-gray-600' : 'border-red-500/50'
                } focus:border-gray-500 bg-input-background text-foreground p-4 ${
                  isFullscreen ? 'max-h-[300px]' : 'max-h-[500px] lg:max-h-[600px]'
                }`}
                placeholder="Enter your card configuration JSON here..."
                style={{ 
                  minHeight: isFullscreen ? '250px' : '400px',
                  maxHeight: isFullscreen ? '300px' : (window.innerWidth >= 1024 ? '600px' : '500px')
                }}
              />
              
              {jsonError && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                  <strong>JSON Error:</strong> {jsonError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 sm:px-6 py-12 sm:py-16 bg-muted/50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">System Capabilities</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise-grade features designed for modern sales intelligence workflows
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">Real-time Generation</h4>
                <p className="text-muted-foreground text-sm">
                  Instant card generation with live preview and JSON validation
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">Flexible Configuration</h4>
                <p className="text-muted-foreground text-sm">
                  Multiple card types with customizable sections and fields
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">PNG Export</h4>
                <p className="text-muted-foreground text-sm">
                  High-quality PNG export with 2x scaling for presentations
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">TypeScript Support</h4>
                <p className="text-muted-foreground text-sm">
                  Full TypeScript integration with comprehensive type definitions
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Save className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">Save & Load</h4>
                <p className="text-muted-foreground text-sm">
                  Save your card configurations and load them anytime from local storage
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                <Code2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary mb-4" />
                <h4 className="text-lg font-semibold mb-3">Component Architecture</h4>
                <p className="text-muted-foreground text-sm">
                  Modular design with {systemStats.totalFiles} documented components
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};