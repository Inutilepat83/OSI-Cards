import React, { useEffect, useRef, useState } from 'react';

// Declare Leaflet global types
declare global {
  interface Window {
    L: any;
  }
}

interface Location {
  name: string;
  x: number; // longitude equivalent 
  y: number; // latitude equivalent
  type: string;
}

interface LeafletMapProps {
  locations?: Location[];
  className?: string;
}

export function LeafletMap({ locations = [], className = "" }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const loadLeaflet = async () => {
      try {
        // Set a timeout to show fallback if loading takes too long
        timeoutId = setTimeout(() => {
          console.warn('Map loading timeout, showing fallback');
          setShowFallback(true);
          setIsLoading(false);
        }, 5000);

        // Load CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.css';
          cssLink.crossOrigin = 'anonymous';
          document.head.appendChild(cssLink);
          
          // Wait for CSS to load
          await new Promise((resolve) => {
            cssLink.onload = resolve;
            cssLink.onerror = resolve; // Continue even if CSS fails
          });
        }

        // Load JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/leaflet.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        // Clear timeout since we loaded successfully
        clearTimeout(timeoutId);

        // Small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        if (mapRef.current && window.L && !mapInstanceRef.current) {
          initializeMap();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
        clearTimeout(timeoutId);
        setHasError(true);
        setShowFallback(true);
        setIsLoading(false);
      }
    };

    loadLeaflet();

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && window.L && locations.length > 0) {
      // Small delay to ensure map is fully rendered
      setTimeout(() => updateMarkers(), 100);
    }
  }, [locations]);

  const initializeMap = () => {
    if (!mapRef.current || !window.L) {
      console.warn('Map ref or Leaflet not available');
      return;
    }

    try {
      // Enable fractional zoom
      window.L.Map.mergeOptions({
        zoomSnap: 0.1,
        zoomDelta: 0.1
      });

      // Create map
      const map = window.L.map(mapRef.current, {
        center: [30, 0],
        zoom: 1.8,
        zoomControl: false, // We'll add custom positioned controls
        attributionControl: false, // Hide the attribution control
        preferCanvas: false,
        minZoom: 1,
        maxZoom: 18,
        wheelPxPerZoomLevel: 60,
        zoomAnimation: true
      });

      // Add zoom control to bottom right
      const zoomControl = window.L.control.zoom({
        position: 'bottomright'
      });
      zoomControl.addTo(map);

      // Style the zoom controls
      setTimeout(() => {
        const zoomButtons = mapRef.current?.querySelectorAll('.leaflet-control-zoom a');
        zoomButtons?.forEach((button: any) => {
          button.style.backgroundColor = '#2a2a2a';
          button.style.color = 'white';
          button.style.border = '1px solid #444';
          button.style.borderRadius = '4px';
        });
      }, 100);

      // Add dark tile layer
      const tileLayer = window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '', // Remove attribution
        subdomains: 'abcd',
        maxZoom: 18
      });

      tileLayer.addTo(map);

      // Wait for tiles to load
      tileLayer.on('load', () => {
        console.log('Tiles loaded successfully');
      });

      mapInstanceRef.current = map;
      
      // Add locations if available
      if (locations.length > 0) {
        setTimeout(() => updateMarkers(), 200);
      }

      console.log('Map initialized successfully');
    } catch (error) {
      console.error('Error initializing map:', error);
      setHasError(true);
      setShowFallback(true);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        mapInstanceRef.current.removeLayer(marker);
      });
      markersRef.current = [];

      // Convert percentage coordinates to lat/lng
      const convertCoordinates = (x: number, y: number) => {
        const lng = (x / 100) * 360 - 180;
        const lat = 70 - (y / 100) * 130;
        return [lat, lng];
      };

      // Add markers for each location
      locations.forEach((location, index) => {
        const [lat, lng] = convertCoordinates(location.x, location.y);
        
        // Choose color based on location name and type
        let color = '#026DFC';
        let legendType = 'Global Presence';
        
        if (location.name.toLowerCase().includes('hq') || 
            location.name.toLowerCase().includes('headquarters') ||
            location.name.toLowerCase().includes('head office')) {
          color = '#FF7900';
          legendType = 'Headquarters';
        } else if (location.name.toLowerCase().includes('office') ||
                   location.name.toLowerCase().includes('regional') ||
                   location.name.toLowerCase().includes('operations')) {
          color = '#FFC999';
          legendType = 'Regional Office';
        }

        // Create circle marker
        const marker = window.L.circleMarker([lat, lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.8,
          radius: 6,
          weight: 2,
          opacity: 1
        });

        // Create popup content
        const popupContent = `
          <div style="min-width: 150px; font-family: Arial, sans-serif;">
            <strong style="color: #333;">${location.name}</strong><br>
            <span style="color: #666;">Category: ${legendType}</span><br>
            <span style="color: #666;">Coordinates: ${lat.toFixed(2)}°, ${lng.toFixed(2)}°</span>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 300
        });

        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      });

      console.log(`Added ${locations.length} markers to map`);
    } catch (error) {
      console.error('Error updating markers:', error);
    }
  };

  // Fallback simple map
  const renderFallbackMap = () => (
    <div className="relative w-full h-full bg-[#2a2a2a] flex items-center justify-center rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <svg viewBox="0 0 1000 500" className="w-full h-full" style={{ filter: 'contrast(1.2)' }}>
          <g fill="#1a1a1a" stroke="none">
            {/* Simplified world map */}
            <path d="M150 100 L250 90 L280 120 L300 140 L280 180 L250 200 L200 190 L150 160 Z" />
            <path d="M180 200 L220 210 L240 230 L200 250 L160 240 L150 220 Z" />
            <path d="M220 280 L240 270 L260 290 L270 320 L280 380 L260 420 L240 410 L220 380 L210 340 L200 300 Z" />
            <path d="M450 120 L500 110 L520 130 L510 150 L480 160 L450 150 Z" />
            <path d="M480 180 L520 170 L540 200 L550 250 L540 320 L520 360 L500 370 L480 360 L470 320 L460 250 L470 200 Z" />
            <path d="M550 100 L650 90 L720 100 L750 120 L780 140 L800 160 L790 180 L770 200 L720 190 L670 180 L620 170 L580 160 L550 140 Z" />
            <path d="M700 350 L750 340 L780 360 L770 380 L730 390 L700 380 Z" />
          </g>
        </svg>
        
        {/* Location dots */}
        {locations.map((location, index) => {
          let color = '#026DFC';
          if (location.name.toLowerCase().includes('hq')) color = '#FF7900';
          else if (location.name.toLowerCase().includes('office')) color = '#FFC999';
          
          return (
            <div
              key={index}
              className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{
                left: `${location.x}%`,
                top: `${location.y}%`,
                backgroundColor: color,
                boxShadow: `0 0 8px ${color}80`
              }}
              title={location.name}
            />
          );
        })}
      </div>
      
      <div className="absolute bottom-2 left-2 text-xs text-gray-400">
        {hasError ? 'Fallback Map View' : 'Simple Map View'}
      </div>
    </div>
  );

  return (
    <div className={`relative w-full aspect-[16/9] bg-white/60 ${className}`}>
      {showFallback ? (
        renderFallbackMap()
      ) : (
        <>
          <div 
            ref={mapRef} 
            className="w-full h-full rounded-lg overflow-hidden"
            style={{ 
              background: '#1a1a1a'
            }}
          />
          
          {/* Custom Legend - positioned in bottom left, away from zoom controls */}
          {!isLoading && !hasError && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white p-3 rounded text-xs z-[1000] backdrop-blur-sm">
              <h4 className="margin-0 mb-2 font-bold">Legend</h4>
              <div className="flex items-center mb-1">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#026DFC' }}
                ></span>
                <span>Global Presence</span>
              </div>
              <div className="flex items-center mb-1">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#FFC999' }}
                ></span>
                <span>Regional Office</span>
              </div>
              <div className="flex items-center">
                <span 
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: '#FF7900' }}
                ></span>
                <span>Headquarters</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading overlay */}
      {isLoading && !showFallback && (
        <div className="absolute inset-0 bg-[#1a1a1a] flex items-center justify-center z-[1001]">
          <div className="text-white text-sm flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Loading interactive map...
          </div>
        </div>
      )}
    </div>
  );
}