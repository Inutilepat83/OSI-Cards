import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Building2, 
  User, 
  Target, 
  Calendar, 
  BarChart3, 
  Package,
  Mail,
  Phone,
  MapPin,
  Globe,
  Users,
  DollarSign,
  Clock,
  Star,
  Briefcase,
  Settings,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';

interface OverviewSectionProps {
  section: {
    id: string;
    title: string;
    type: string;
    fields: Array<{
      id: string;
      label: string;
      value: string;
      status?: string;
    }>;
  };
  onFieldInteraction?: (data: any) => void;
}

const getCardTypeIcon = (cardType: string) => {
  switch (cardType.toLowerCase()) {
    case 'company':
      return <Building2 className="w-6 h-6" />;
    case 'contact':
      return <User className="w-6 h-6" />;
    case 'opportunity':
      return <Target className="w-6 h-6" />;
    case 'event':
      return <Calendar className="w-6 h-6" />;
    case 'analytics':
      return <BarChart3 className="w-6 h-6" />;
    case 'product':
      return <Package className="w-6 h-6" />;
    default:
      return <Settings className="w-6 h-6" />;
  }
};

const getFieldIcon = (label: string) => {
  const labelLower = label.toLowerCase();
  
  if (labelLower.includes('email')) return <Mail className="w-4 h-4" />;
  if (labelLower.includes('phone')) return <Phone className="w-4 h-4" />;
  if (labelLower.includes('location') || labelLower.includes('address') || labelLower.includes('headquarters')) return <MapPin className="w-4 h-4" />;
  if (labelLower.includes('website') || labelLower.includes('url')) return <Globe className="w-4 h-4" />;
  if (labelLower.includes('employee') || labelLower.includes('team') || labelLower.includes('staff')) return <Users className="w-4 h-4" />;
  if (labelLower.includes('revenue') || labelLower.includes('budget') || labelLower.includes('value') || labelLower.includes('price')) return <DollarSign className="w-4 h-4" />;
  if (labelLower.includes('date') || labelLower.includes('time') || labelLower.includes('duration')) return <Clock className="w-4 h-4" />;
  if (labelLower.includes('score') || labelLower.includes('rating') || labelLower.includes('performance')) return <Star className="w-4 h-4" />;
  if (labelLower.includes('title') || labelLower.includes('position') || labelLower.includes('role')) return <Briefcase className="w-4 h-4" />;
  if (labelLower.includes('trend') || labelLower.includes('growth') || labelLower.includes('increase')) return <TrendingUp className="w-4 h-4" />;
  if (labelLower.includes('security') || labelLower.includes('compliance')) return <Shield className="w-4 h-4" />;
  if (labelLower.includes('probability') || labelLower.includes('success') || labelLower.includes('win')) return <Zap className="w-4 h-4" />;
  
  return <Settings className="w-4 h-4" />;
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'excellent':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'pending':
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'inactive':
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-primary/20 text-primary border-primary/30';
  }
};

export const OverviewSection: React.FC<OverviewSectionProps> = ({ section, onFieldInteraction }) => {
  const handleFieldClick = (fieldId: string) => {
    onFieldInteraction?.({ 
      sectionId: section.id, 
      fieldId, 
      action: 'click' 
    });
  };

  // Determine card type from section context or field values
  const cardType = section.fields.find(f => f.label.toLowerCase().includes('type'))?.value || 'overview';
  const cardIcon = getCardTypeIcon(cardType);

  return (
    <Card className="section-container overflow-hidden bg-gradient-to-br from-card via-card/95 to-card/90 border-2 border-primary/20 shadow-2xl hover:shadow-3xl hover:border-primary/40 transition-all duration-300 group">
      {/* Enhanced Header with Gradient Background */}
      <CardHeader className="relative pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
        
        <div className="relative">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {section.title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="section-content p-6 space-y-1">
        {/* Enhanced Responsive Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 lg:gap-6">
          {section.fields.map((field, index) => (
            <div
              key={field.id}
              onClick={() => handleFieldClick(field.id)}
              className="group/field cursor-pointer p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border/30 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 transition-all duration-300 hover:shadow-lg"
              style={{
                animationDelay: `${index * 50}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className="flex items-start gap-3">
              
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-muted-foreground group-hover/field:text-foreground transition-colors duration-300">
                      {field.label}
                    </p>
                    {field.status && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-0.5 ${getStatusColor(field.status)}`}
                      >
                        {field.status}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-base font-semibold text-foreground group-hover/field:text-primary transition-colors duration-300 truncate">
                    {field.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        
      </CardContent>
    </Card>
  );
};

// Overview sections should span 2 columns for better content display
OverviewSection.colSpan = 2;