import React from 'react';
import { AISectionConfig, ContactField } from '../../types';
import { Badge } from '../ui/badge';
import { User, Mail, Phone, MapPin, Building, Users } from 'lucide-react';

interface ContactCardSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const ContactCardSection: React.FC<ContactCardSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as ContactField[] || [];



  const handleContactClick = (field: ContactField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      contactName: field.name,
      action: 'click',
      value: field
    });
  };

  const handleEmailClick = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`mailto:${email}`, '_blank');
  };

  const handlePhoneClick = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${phone}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
        </div>
        {fields.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {fields.length} contacts
          </Badge>
        )}
      </div>

      <div className="space-y-4 flex-1">
        {fields.map((field, index) => (
          <div
            key={`${field.name}-${index}`}
            className="group p-4 rounded-lg bg-gradient-to-br from-card/50 to-card/30 border border-border/40 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-lg"
            onClick={() => handleContactClick(field)}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  {field.avatar ? (
                    <img 
                      src={field.avatar} 
                      alt={field.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {field.name}
                  </h4>
                  {field.role && (
                    <p className="text-sm text-muted-foreground">{field.role}</p>
                  )}
                </div>

                {/* Contact Details */}
                <div className="space-y-2 text-sm">
                  {field.email && (
                    <div 
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      onClick={(e) => handleEmailClick(field.email!, e)}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{field.email}</span>
                    </div>
                  )}
                  
                  {field.phone && (
                    <div 
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      onClick={(e) => handlePhoneClick(field.phone!, e)}
                    >
                      <Phone className="w-4 h-4" />
                      <span>{field.phone}</span>
                    </div>
                  )}
                  
                  {field.department && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span>{field.department}</span>
                    </div>
                  )}
                  
                  {field.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{field.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="text-center py-12 text-muted-foreground flex-1 flex items-center justify-center">
          <div>
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No Contacts</p>
            <p className="text-sm">No contact information available</p>
          </div>
        </div>
      )}
    </div>
  );
};