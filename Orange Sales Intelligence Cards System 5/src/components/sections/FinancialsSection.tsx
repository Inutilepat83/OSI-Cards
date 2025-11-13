import React from 'react';
import { AISectionConfig, FinancialField } from '../../types';
import { TrendingUp, TrendingDown, Minus, DollarSign } from 'lucide-react';

interface FinancialsSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const FinancialsSection: React.FC<FinancialsSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as FinancialField[] || [];

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const formatValue = (value: string, format?: string) => {
    if (format === 'currency') {
      return (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          {value}
        </div>
      );
    }
    return value;
  };

  const handleFieldClick = (field: FinancialField) => {
    onFieldInteraction?.({
      sectionId: section.id,
      fieldId: field.id,
      action: 'click',
      value: field.value
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground border-b border-border pb-2">
        {section.title}
      </h3>
      
      <div className="grid gap-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex justify-between items-center p-4 rounded-lg bg-card/50 border border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
            onClick={() => handleFieldClick(field)}
          >
            <div className="flex-1">
              <span className="text-sm text-muted-foreground">
                {field.label}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-medium text-foreground">
                  {formatValue(field.value, field.format)}
                </span>
                {field.trend && getTrendIcon(field.trend)}
              </div>
            </div>
            
            {field.change !== undefined && (
              <div className="text-right">
                <span 
                  className={`text-sm font-medium ${
                    field.change > 0 ? 'text-green-400' : 
                    field.change < 0 ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  {field.change > 0 ? '+' : ''}{field.change}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};