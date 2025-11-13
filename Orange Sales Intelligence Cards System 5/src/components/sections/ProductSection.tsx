import React from 'react';
import { AISectionConfig } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  DollarSign, 
  Users, 
  Award, 
  Zap, 
  Target, 
  Phone, 
  Mail, 
  TrendingUp,
  CheckCircle2,
  Star,
  ArrowRight
} from 'lucide-react';

interface ProductField {
  id: string;
  label: string;
  value: string;
  category?: 'pricing' | 'features' | 'process' | 'references' | 'contacts' | 'advantages';
  priority?: 'high' | 'medium' | 'low';
  icon?: string;
  contact?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
  reference?: {
    company: string;
    testimonial?: string;
    logo?: string;
  };
}

interface ProductSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as ProductField[] || [];

  const getFieldsByCategory = (category: string) => {
    return fields.filter(field => field.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'features': return <Zap className="w-5 h-5 text-blue-400" />;
      case 'process': return <Target className="w-5 h-5 text-purple-400" />;
      case 'references': return <Award className="w-5 h-5 text-yellow-400" />;
      case 'contacts': return <Users className="w-5 h-5 text-orange-400" />;
      case 'advantages': return <TrendingUp className="w-5 h-5 text-primary" />;
      default: return <CheckCircle2 className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'pricing': return 'Pricing & Packages';
      case 'features': return 'Key Features';
      case 'process': return 'Sales Process';
      case 'references': return 'Client References';
      case 'contacts': return 'Internal Contacts';
      case 'advantages': return 'Competitive Advantages';
      default: return 'Product Information';
    }
  };



  const handleFieldClick = (field: ProductField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      fieldLabel: field.label,
      action: 'click',
      value: field
    });
  };

  const renderCategorySection = (category: string) => {
    const categoryFields = getFieldsByCategory(category);
    if (categoryFields.length === 0) return null;

    const isReferences = category === 'references';
    
    return (
      <Card key={category} className={`bg-card/30 border border-border/40 hover:border-primary/30 transition-colors ${isReferences ? 'bg-gradient-to-br from-card/50 to-primary/5' : ''}`}>
        <CardContent className={`${isReferences ? 'p-6' : 'p-5'}`}>
          <div className="flex items-center gap-3 mb-6">
            {getCategoryIcon(category)}
            <h4 className={`font-semibold text-foreground ${isReferences ? 'text-lg' : ''}`}>{getCategoryTitle(category)}</h4>
            {isReferences && categoryFields.length > 0 && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 ml-auto">
                {categoryFields.length} {categoryFields.length === 1 ? 'Reference' : 'References'}
              </Badge>
            )}
          </div>

          <div className={`${isReferences ? 'space-y-6' : 'space-y-3'}`}>
            {categoryFields.map((field, index) => (
              <div
                key={`${field.label}-${index}`}
                className="group cursor-pointer"
                onClick={() => handleFieldClick(field)}
              >
                {category === 'contacts' && field.contact ? (
                  // Special rendering for contacts
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {field.contact.name}
                        </h5>
                        <p className="text-sm text-muted-foreground mb-2">{field.contact.role}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {field.contact.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{field.contact.email}</span>
                            </div>
                          )}
                          {field.contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{field.contact.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                ) : category === 'references' && field.reference ? (
                  // Enhanced full-width rendering for references
                  <div className="p-6 rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                          {field.reference.company}
                        </h5>
                        {field.reference.testimonial && (
                          <blockquote className="text-base text-muted-foreground italic leading-relaxed mb-3 border-l-4 border-primary/30 pl-4">
                            "{field.reference.testimonial}"
                          </blockquote>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-4 h-4 fill-primary text-primary" />
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">Verified Client</span>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            Success Story
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Standard rendering for other fields
                  <div className="flex items-start justify-between p-3 rounded-lg bg-muted/10 border border-border/30 hover:border-primary/40 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {field.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {field.value}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
      </div>

      {/* Product categories in organized grid */}
      <div className="space-y-6">
        {/* Client References - Full width section */}
        {getFieldsByCategory('references').length > 0 && (
          <div className="w-full">
            {renderCategorySection('references')}
          </div>
        )}
        
        {/* Other categories in responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['pricing', 'features', 'advantages', 'process', 'contacts'].map(category => 
            renderCategorySection(category)
          )}
        </div>
      </div>

      {/* Summary stats */}
      {fields.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{getFieldsByCategory('features').length}</div>
                <div className="text-sm text-muted-foreground">Features</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{getFieldsByCategory('references').length}</div>
                <div className="text-sm text-muted-foreground">References</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{getFieldsByCategory('contacts').length}</div>
                <div className="text-sm text-muted-foreground">Contacts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{getFieldsByCategory('advantages').length}</div>
                <div className="text-sm text-muted-foreground">Advantages</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};