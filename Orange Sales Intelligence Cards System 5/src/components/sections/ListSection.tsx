import React from 'react';
import { AISectionConfig, ListField } from '../../types';
import { Badge } from '../ui/badge';
import { CheckCircle2, Clock, AlertCircle, XCircle, Circle, List } from 'lucide-react';

interface ListSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const ListSection: React.FC<ListSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as ListField[] || [];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'pending':
        return <Circle className="w-4 h-4 text-yellow-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in-progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleItemClick = (field: ListField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      itemTitle: field.title,
      action: 'click',
      value: field
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        </div>
        {fields.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {fields.length} items
          </Badge>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {fields.map((field, index) => (
          <div
            key={`${field.title}-${index}`}
            className="group flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-card/30 border border-border/40 hover:border-primary/50 transition-all duration-200 cursor-pointer hover:bg-card/50"
            onClick={() => handleItemClick(field)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getStatusIcon(field.status)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm sm:text-base">
                  {field.title}
                </h4>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {field.priority && (
                    <Badge className={`text-xs px-2 py-0.5 ${getPriorityColor(field.priority)}`}>
                      {field.priority}
                    </Badge>
                  )}
                  {field.status && (
                    <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(field.status)}`}>
                      {field.status}
                    </Badge>
                  )}
                </div>
              </div>

              {field.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 leading-relaxed">
                  {field.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  {field.assignee && (
                    <span>Assigned: <span className="text-foreground font-medium">{field.assignee}</span></span>
                  )}
                  {field.value && (
                    <span>Value: <span className="text-foreground font-medium">{field.value}</span></span>
                  )}
                </div>
                {field.date && (
                  <span className="text-foreground font-medium">{field.date}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
          <div>
            <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Items</p>
            <p className="text-sm">This list is currently empty</p>
          </div>
        </div>
      )}
    </div>
  );
};