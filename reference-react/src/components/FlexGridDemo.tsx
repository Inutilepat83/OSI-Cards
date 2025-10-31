import React, { useState, useEffect } from 'react';
import { FlexGridContainer, FlexGridItem } from './ui/CardGrid';
import { AICardRenderer } from './AICardRenderer';
import { AICardConfig } from '../types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Grid, Sparkles } from 'lucide-react';

interface FlexGridDemoProps {
  className?: string;
}

export const FlexGridDemo: React.FC<FlexGridDemoProps> = ({ className = '' }) => {
  const [demoCards, setDemoCards] = useState<AICardConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const loadDemoCards = async () => {
      try {
        const localCardConfigurationService = (await import('../services/localCardConfigurationService')).default;

        const cards = await Promise.all([
          localCardConfigurationService.getTemplate('company', 2),
          localCardConfigurationService.getTemplate('contact', 1),
          localCardConfigurationService.getTemplate('analytics', 1),
          localCardConfigurationService.getTemplate('company', 3),
          localCardConfigurationService.getTemplate('product', 1),
          localCardConfigurationService.getTemplate('opportunity', 2)
        ]);

        const validCards = cards.filter(Boolean).map((card, index) => ({
          ...card,
          columns: card.columns || [2, 1, 1, 3, 1, 2][index] || 1,
        })) as AICardConfig[];

        setDemoCards(validCards);
      } catch (error) {
        console.error('Error loading demo cards:', error);
        setLoadError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadDemoCards();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Grid className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-white">
            Figma-Style Flexible Grid System
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Cards can span 1, 2, or 3 columns with automatic height adjustment. 
          Drag your mouse over cards to see the magnetic tilt effects in action.
        </p>
      </div>

      {loadError && (
        <div className="text-center text-red-500 font-medium">
          Failed to load some card templates. Please check your configuration service.
        </div>
      )}

      {demoCards.length === 0 && !loadError && (
        <div className="text-center text-muted-foreground py-12">
          No demo cards available. Please check configuration source.
        </div>
      )}

      <FlexGridContainer maxColumns={3} gap={24} className="grid w-full" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {demoCards.map((card, index) => {
          const columns = card.columns || 1;
          return (
            <FlexGridItem key={card.id || `card-${index}`} columns={columns as 1 | 2 | 3}>
              <Card className="relative bg-card/50 border border-border/30 hover:border-primary/50 transition-colors overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className="bg-primary/10 text-primary border-primary/30"
                    >
                      {columns} Column{columns !== 1 ? 's' : ''}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {card.cardType}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <AICardRenderer
                    cardConfig={{ ...card, columns }}
                    className="border-none shadow-none bg-transparent"
                  />
                </CardContent>
              </Card>
            </FlexGridItem>
          );
        })}
      </FlexGridContainer>

      <div className="mt-8 p-6 bg-card/30 rounded-xl border border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-white">Grid System Features</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Dynamic column spanning (1-3 columns)</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Content-hugging height adjustment</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Responsive mobile-first design</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Magnetic tilt effects preserved</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>Figma-inspired layout system</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
            <span>JSON-configurable grid spans</span>
          </div>
        </div>
      </div>
    </div>
  );
};