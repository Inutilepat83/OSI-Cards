import React from 'react';
import { AISectionConfig, MapField } from '../../types';
import { LeafletMap } from '../LeafletMap';

interface MapSectionProps {
  section: AISectionConfig;
  onFieldInteraction?: (data: any) => void;
}

export const MapSection: React.FC<MapSectionProps> = ({
  section,
  onFieldInteraction
}) => {
  const fields = section.fields as MapField[] || [];

  // Sample real-world coordinates for major business locations
  const locationCoordinates = {
    'New York': { lat: 40.7128, lng: -74.0060, x: 25, y: 35 },
    'London': { lat: 51.5074, lng: -0.1278, x: 50, y: 30 },
    'Tokyo': { lat: 35.6762, lng: 139.6503, x: 85, y: 40 },
    'San Francisco': { lat: 37.7749, lng: -122.4194, x: 15, y: 38 },
    'Singapore': { lat: 1.3521, lng: 103.8198, x: 80, y: 60 },
    'Frankfurt': { lat: 50.1109, lng: 8.6821, x: 52, y: 32 },
    'Hong Kong': { lat: 22.3193, lng: 114.1694, x: 82, y: 52 },
    'Sydney': { lat: -33.8688, lng: 151.2093, x: 88, y: 75 },
    'Toronto': { lat: 43.6532, lng: -79.3832, x: 22, y: 33 },
    'Dubai': { lat: 25.2048, lng: 55.2708, x: 62, y: 50 },
    'Mumbai': { lat: 19.0760, lng: 72.8777, x: 70, y: 52 },
    'São Paulo': { lat: -23.5505, lng: -46.6333, x: 30, y: 70 },
    'Shanghai': { lat: 31.2304, lng: 121.4737, x: 83, y: 42 },
    'Berlin': { lat: 52.5200, lng: 13.4050, x: 53, y: 30 },
    'Paris': { lat: 48.8566, lng: 2.3522, x: 51, y: 32 }
  };

  // Enhanced field mapping with real coordinates
  const enhancedFields = fields.map(field => {
    // Try to match location name to real coordinates
    const locationKey = Object.keys(locationCoordinates).find(key => 
      field.name.toLowerCase().includes(key.toLowerCase()) ||
      field.address?.toLowerCase().includes(key.toLowerCase())
    );
    
    if (locationKey) {
      const coords = locationCoordinates[locationKey as keyof typeof locationCoordinates];
      return {
        ...field,
        x: coords.x,
        y: coords.y,
        coordinates: {
          lat: coords.lat,
          lng: coords.lng
        }
      };
    }
    
    return field;
  });

  const handleLocationClick = (location: any) => {
    onFieldInteraction?.({
      sectionTitle: section.title,
      locationName: location.name,
      action: 'click',
      value: location
    });
  };

  return (
    <div className="map-container section-container space-y-4">
      <h3 className="text-xl font-semibold text-foreground border-b border-border pb-3">
        {section.title} ({enhancedFields.length})
      </h3>
      
      {/* Enhanced Leaflet Map */}
      <div className="relative">
        <LeafletMap
          locations={enhancedFields.map(field => ({
            name: field.name,
            x: field.x,
            y: field.y,
            type: field.type || 'office'
          }))}
          className="rounded-xl border-2 border-border/50 shadow-lg"
        />
      </div>
    </div>
  );
};