import React from 'react';
import { AISectionConfig, InfoField } from '../../types';
import { Badge } from '../ui/badge';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface InfoSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as InfoField[] || [];



  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-400" />;
      case 'stable':
        return <Minus className="w-3 h-3 text-yellow-400" />;
      default:
        return null;
    }
  };



  const handleFieldClick = (field: InfoField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      fieldLabel: field.label,
      fieldValue: field.value,
      action: 'click'
    });
  };

  // Determine the best responsive layout based on field count
  const getResponsiveLayout = () => {
    const fieldCount = fields.length;
    
    if (fieldCount <= 2) {
      return 'grid grid-cols-1 gap-3'; // Single column for very few fields
    } else if (fieldCount <= 4) {
      return 'grid grid-cols-1 sm:grid-cols-2 gap-3'; // 1-2 columns responsive
    } else if (fieldCount <= 6) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3'; // 2 columns max
    } else {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'; // 3 columns for many fields
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border/50 flex-shrink-0">
      </div>

      <div className={`${getResponsiveLayout()} flex-1`}>
        {fields.map((field, index) => (
          <div
            key={`${field.label}-${index}`}
            className="group p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/40 transition-all duration-200 cursor-pointer hover:bg-muted/20"
            onClick={() => handleFieldClick(field)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground truncate">
                {field.label}
              </span>
              {getTrendIcon(field.trend)}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-foreground group-hover:text-primary transition-colors leading-relaxed">
                {field.value}
              </p>
              
              {field.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {field.description}
                </p>
              )}
              
              {field.change !== undefined && (
                <div className="flex items-center gap-1 text-xs">
                  {getTrendIcon(field.trend)}
                  <span className={`${
                    field.change > 0 ? 'text-green-400' : 
                    field.change < 0 ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    {field.change > 0 ? '+' : ''}{field.change}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground flex-1 flex items-center justify-center">
          <div>
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No information available</p>
          </div>
        </div>
      )}
    </div>
  );
};