import React from 'react';
import { AISectionConfig, AnalyticsField } from '../../types';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

interface AnalyticsSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as AnalyticsField[] || [];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      default:
        return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getValueColor = () => {
    return 'text-primary bg-primary/10';
  };

  const getTrendColor = (trend?: string, change?: number) => {
    if (change === undefined) return 'text-muted-foreground';
    
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      case 'stable':
        return 'text-yellow-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const handleFieldClick = (field: AnalyticsField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      fieldLabel: field.label,
      fieldValue: field.value,
      action: 'click'
    });
  };

  // Vertical layout - display metrics as rows instead of columns
  const getResponsiveLayout = () => {
    // Always use single column layout for vertical stacking
    return 'flex flex-col gap-4';
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        </div>
        {fields.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {fields.length} metrics
          </Badge>
        )}
      </div>

      <div className={`${getResponsiveLayout()} flex-1`}>
        {fields.map((field, index) => (
          <div
            key={`${field.label}-${index}`}
            className="group p-4 rounded-lg bg-gradient-to-br from-muted/20 to-muted/10 border border-border/30 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg"
            onClick={() => handleFieldClick(field)}
          >
            {/* Header with trend icon */}
            <div className="flex items-center gap-2 mb-3">
              {getTrendIcon(field.trend)}
              <span className="text-sm font-medium text-muted-foreground">
                {field.label}
              </span>
            </div>

            {/* Main value */}
            <div className="mb-3">
              <div className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                {field.value}
              </div>
            </div>

            {/* Progress bar (if percentage available) */}
            {field.percentage !== undefined && (
              <div className="mb-3">
                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-primary/60"
                    style={{ width: `${Math.min(field.percentage, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {field.percentage}%
                </div>
              </div>
            )}

            {/* Change indicator */}
            {field.change !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Change:</span>
                <span className={getTrendColor(field.trend, field.change)}>
                  {field.change > 0 ? '+' : ''}{field.change}%
                </span>
                {getTrendIcon(field.trend)}
              </div>
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
          <div>
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Analytics Data</p>
            <p className="text-sm">Configure analytics fields to see metrics here</p>
          </div>
        </div>
      )}
    </div>
  );
};