import React from 'react';
import { AISectionConfig, InfoField } from '../../types';
import { Users, Award, MessageSquare, Calendar } from 'lucide-react';

interface NetworkCardSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const NetworkCardSection: React.FC<NetworkCardSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as InfoField[] || [];

  const getNetworkIcon = (fieldId: string) => {
    if (fieldId.includes('report')) return <Users className="w-5 h-5 text-blue-400" />;
    if (fieldId.includes('board') || fieldId.includes('award')) return <Award className="w-5 h-5 text-yellow-400" />;
    if (fieldId.includes('advisor')) return <MessageSquare className="w-5 h-5 text-green-400" />;
    if (fieldId.includes('speaking') || fieldId.includes('event')) return <Calendar className="w-5 h-5 text-purple-400" />;
    return <Users className="w-5 h-5 text-primary" />;
  };

  const handleFieldClick = (field: InfoField) => {
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
      
      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/70 transition-colors cursor-pointer"
            onClick={() => handleFieldClick(field)}
          >
            {getNetworkIcon(field.id)}
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">
                {field.label}
              </div>
              <div className="text-sm font-medium text-foreground">
                {field.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};