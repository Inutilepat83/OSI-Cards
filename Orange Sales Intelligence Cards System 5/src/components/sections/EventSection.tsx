import React from 'react';
import { AISectionConfig, EventField } from '../../types';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video, 
  BookOpen, 
  Coffee, 
  Briefcase,
  Handshake,
  Trophy,
  Sparkles,
  Globe,
  Building
} from 'lucide-react';

interface EventSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const EventSection: React.FC<EventSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as EventField[] || [];

  const getEventTypeData = (type?: string, title?: string) => {
    // Detect event category from type or title
    const eventText = `${type || ''} ${title || ''}`.toLowerCase();
    
    if (eventText.includes('partner') || eventText.includes('collaboration') || eventText.includes('alliance')) {
      return {
        category: 'partner',
        icon: <Handshake className="w-6 h-6 text-blue-400" />,
        bgGradient: 'from-blue-500/20 to-blue-500/5',
        borderColor: 'border-blue-500/30',
        accentColor: 'text-blue-400'
      };
    } else if (eventText.includes('client') || eventText.includes('customer') || eventText.includes('user')) {
      return {
        category: 'client',
        icon: <Users className="w-6 h-6 text-green-400" />,
        bgGradient: 'from-green-500/20 to-green-500/5',
        borderColor: 'border-green-500/30',
        accentColor: 'text-green-400'
      };
    } else if (eventText.includes('conference') || eventText.includes('summit') || eventText.includes('expo')) {
      return {
        category: 'conference',
        icon: <Globe className="w-6 h-6 text-purple-400" />,
        bgGradient: 'from-purple-500/20 to-purple-500/5',
        borderColor: 'border-purple-500/30',
        accentColor: 'text-purple-400'
      };
    } else if (eventText.includes('training') || eventText.includes('workshop') || eventText.includes('education')) {
      return {
        category: 'training',
        icon: <BookOpen className="w-6 h-6 text-yellow-400" />,
        bgGradient: 'from-yellow-500/20 to-yellow-500/5',
        borderColor: 'border-yellow-500/30',
        accentColor: 'text-yellow-400'
      };
    } else if (eventText.includes('award') || eventText.includes('recognition') || eventText.includes('ceremony')) {
      return {
        category: 'awards',
        icon: <Trophy className="w-6 h-6 text-amber-400" />,
        bgGradient: 'from-amber-500/20 to-amber-500/5',
        borderColor: 'border-amber-500/30',
        accentColor: 'text-amber-400'
      };
    } else if (eventText.includes('webinar') || eventText.includes('online') || eventText.includes('virtual')) {
      return {
        category: 'webinar',
        icon: <Video className="w-6 h-6 text-cyan-400" />,
        bgGradient: 'from-cyan-500/20 to-cyan-500/5',
        borderColor: 'border-cyan-500/30',
        accentColor: 'text-cyan-400'
      };
    } else if (eventText.includes('social') || eventText.includes('networking') || eventText.includes('mixer')) {
      return {
        category: 'social',
        icon: <Coffee className="w-6 h-6 text-pink-400" />,
        bgGradient: 'from-pink-500/20 to-pink-500/5',
        borderColor: 'border-pink-500/30',
        accentColor: 'text-pink-400'
      };
    } else if (eventText.includes('meeting') || eventText.includes('quarterly') || eventText.includes('board')) {
      return {
        category: 'meeting',
        icon: <Briefcase className="w-6 h-6 text-slate-400" />,
        bgGradient: 'from-slate-500/20 to-slate-500/5',
        borderColor: 'border-slate-500/30',
        accentColor: 'text-slate-400'
      };
    } else {
      return {
        category: 'general',
        icon: <Calendar className="w-6 h-6 text-primary" />,
        bgGradient: 'from-primary/20 to-primary/5',
        borderColor: 'border-primary/30',
        accentColor: 'text-primary'
      };
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ongoing': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-primary/20 text-primary border-primary/30';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
      };
    } catch {
      return { day: '--', month: 'N/A', year: new Date().getFullYear(), weekday: 'N/A' };
    }
  };

  const handleEventClick = (field: EventField) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      eventTitle: field.title,
      action: 'click',
      value: field
    });
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'partner': return 'Partner Event';
      case 'client': return 'Client Event';
      case 'conference': return 'Conference';
      case 'training': return 'Training';
      case 'awards': return 'Awards';
      case 'webinar': return 'Webinar';
      case 'social': return 'Social';
      case 'meeting': return 'Meeting';
      default: return 'Event';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">{section.title}</h3>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => {
          const eventData = getEventTypeData(field.type, field.title);
          const dateInfo = formatDate(field.date);
          
          return (
            <Card
              key={`${field.title}-${index}`}
              className={`group cursor-pointer bg-gradient-to-r ${eventData.bgGradient} border ${eventData.borderColor} hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
              onClick={() => handleEventClick(field)}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Date Display */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-xl bg-card border border-border/50 flex flex-col items-center justify-center">
                      <div className="text-lg font-bold text-foreground">{dateInfo.day}</div>
                      <div className="text-xs text-muted-foreground uppercase">{dateInfo.month}</div>
                    </div>
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-card/50">
                          {eventData.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {field.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${eventData.accentColor}`}>
                              {getCategoryLabel(eventData.category)}
                            </Badge>
                            {field.status && (
                              <Badge className={`text-xs ${getStatusColor(field.status)}`}>
                                {field.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {field.description && (
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {field.description}
                      </p>
                    )}

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {field.time && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{field.time}</span>
                        </div>
                      )}
                      
                      {field.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{field.location}</span>
                        </div>
                      )}
                      
                      {field.attendees !== undefined && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{field.attendees} attendees</span>
                        </div>
                      )}
                    </div>

                    {/* Category-specific content */}
                    {eventData.category === 'partner' && (
                      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Building className="w-4 h-4" />
                          <span className="text-sm font-medium">Partnership Opportunity</span>
                        </div>
                      </div>
                    )}

                    {eventData.category === 'client' && (
                      <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-400">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">Client Engagement</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Event Summary */}
      {fields.length > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">{fields.length}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {fields.filter(f => f.status === 'scheduled').length}
                </div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {fields.filter(f => getEventTypeData(f.type, f.title).category === 'partner').length}
                </div>
                <div className="text-sm text-muted-foreground">Partner Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {fields.filter(f => getEventTypeData(f.type, f.title).category === 'client').length}
                </div>
                <div className="text-sm text-muted-foreground">Client Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fields.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No events scheduled</p>
          <p className="text-sm">Check back later for upcoming events</p>
        </div>
      )}
    </div>
  );
};