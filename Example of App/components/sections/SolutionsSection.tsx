import React from 'react';
import { AISectionConfig } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Lightbulb, 
  Target, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Clock, 
  TrendingUp,
  Settings,
  Sparkles
} from 'lucide-react';

interface SolutionField {
  id: string;
  title: string;
  description: string;
  category?: 'consulting' | 'technology' | 'managed' | 'training' | 'support';
  benefits?: string[];
  deliveryTime?: string;
  complexity?: 'low' | 'medium' | 'high';
  teamSize?: string;
  outcomes?: string[];
}

interface SolutionsSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const SolutionsSection: React.FC<SolutionsSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as SolutionField[] || [];

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'consulting': return <Lightbulb className="w-6 h-6 text-yellow-400" />;
      case 'technology': return <Zap className="w-6 h-6 text-blue-400" />;
      case 'managed': return <Settings className="w-6 h-6 text-green-400" />;
      case 'training': return <Users className="w-6 h-6 text-purple-400" />;
      case 'support': return <Target className="w-6 h-6 text-red-400" />;
      default: return <Sparkles className="w-6 h-6 text-primary" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'consulting': return 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 'technology': return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
      case 'managed': return 'from-green-500/20 to-green-500/5 border-green-500/30';
      case 'training': return 'from-purple-500/20 to-purple-500/5 border-purple-500/30';
      case 'support': return 'from-red-500/20 to-red-500/5 border-red-500/30';
      default: return 'from-primary/20 to-primary/5 border-primary/30';
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const handleSolutionClick = (solution: SolutionField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      solutionTitle: solution.title,
      action: 'click',
      value: solution
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((solution, index) => (
          <Card
            key={`${solution.title}-${index}`}
            className={`group cursor-pointer bg-gradient-to-br ${getCategoryColor(solution.category)} border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}
            onClick={() => handleSolutionClick(solution)}
          >
            <CardContent className="p-6">
              {/* Solution Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 rounded-xl bg-card/50">
                  {getCategoryIcon(solution.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                    {solution.title}
                  </h4>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {solution.category && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {solution.category}
                      </Badge>
                    )}
                    {solution.complexity && (
                      <Badge className={`text-xs ${getComplexityColor(solution.complexity)}`}>
                        {solution.complexity} complexity
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {solution.description}
                  </p>
                </div>
              </div>

              {/* Solution Details */}
              <div className="space-y-4">
                {/* Key Benefits */}
                {solution.benefits && solution.benefits.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2">Key Benefits</h5>
                    <div className="space-y-1">
                      {solution.benefits.slice(0, 3).map((benefit, bIndex) => (
                        <div key={bIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {solution.deliveryTime && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{solution.deliveryTime}</span>
                    </div>
                  )}
                  {solution.teamSize && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{solution.teamSize}</span>
                    </div>
                  )}
                </div>

                {/* Expected Outcomes */}
                {solution.outcomes && solution.outcomes.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-2">Expected Outcomes</h5>
                    <div className="space-y-1">
                      {solution.outcomes.slice(0, 2).map((outcome, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Arrow */}
              <div className="flex justify-end mt-4 pt-4 border-t border-border/30">
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Solutions Summary */}
      {fields.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{fields.length}</div>
                <div className="text-sm text-muted-foreground">Solutions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {new Set(fields.map(f => f.category)).size}
                </div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {fields.filter(f => f.complexity === 'low').length}
                </div>
                <div className="text-sm text-muted-foreground">Quick Start</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {fields.reduce((acc, f) => acc + (f.benefits?.length || 0), 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Benefits</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};