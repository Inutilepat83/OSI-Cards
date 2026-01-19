import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CardSection } from '@osi-cards/models';
import { SectionLayoutPreferenceService } from '@osi-cards/services';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';

/**
 * Map Section Component
 *
 * Displays geographic data with embedded maps using Leaflet.
 * Features: markers, location pins, interactive maps.
 *
 * Note: Requires Leaflet library to be installed.
 */
@Component({
  selector: 'lib-map-section',
  standalone: true,
  imports: [CommonModule, SectionHeaderComponent, EmptyStateComponent],
  templateUrl: './map-section.component.html',
  styleUrl: './map-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSectionComponent
  extends BaseSectionComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);
  mapInitFailed = false;
  tilesLoading = true;

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('map', (section: CardSection, availableColumns: number) => {
      return this.calculateMapLayoutPreferences(section, availableColumns);
    });
  }
  @ViewChild('mapElement', { static: false }) mapElement?: ElementRef<HTMLDivElement>;

  private mapInstance: any;
  private markersAdded = false;
  private tileLayer: any;
  private fallbackTileLayer: any;
  private tileErrors: Map<string, number> = new Map();
  private maxTileRetries = 3;
  private loadedTiles = 0;
  private failedTiles = 0;
  private tileLoadTimeout: any;
  private usingFallback = false;

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  /**
   * Initialize Leaflet map
   */
  private async initializeMap(): Promise<void> {
    const fields = this.section?.fields;
    if (!this.mapElement || !fields || fields.length === 0) {
      console.warn('[MapSection] No map element or fields available');
      return;
    }

    try {
      // Dynamic import of Leaflet
      const leafletModule = await import('leaflet');
      // ESM/CJS interop: depending on bundler, Leaflet may be exposed as default export
      const L: any = (leafletModule as any).default ?? leafletModule;
      if (!L || typeof L.map !== 'function') {
        throw new Error('Leaflet loaded but L.map is not a function');
      }

      // Process places with comprehensive logging
      const { validLocations, invalidLocations } = this.processPlaces(fields);

      if (validLocations.length === 0) {
        console.warn('[MapSection] No valid coordinates found in map section fields');
        if (invalidLocations.length > 0) {
          console.warn(
            `[MapSection] ${invalidLocations.length} places were skipped due to invalid coordinates`
          );
        }
        return;
      }

      // Get first location coordinates for initial view
      const firstLocation = validLocations[0];
      if (!firstLocation) {
        console.warn('[MapSection] No valid location found');
        return;
      }
      const initialLat = firstLocation.lat;
      const initialLng = firstLocation.lng;

      // Create map with lower zoom for minimalistic view
      this.mapInstance = L.map(this.mapElement.nativeElement, {
        zoomControl: true,
        attributionControl: true,
      }).setView([initialLat, initialLng], 10);

      // Create custom dark theme marker icon
      const darkMarkerIcon = L.divIcon({
        className: 'dark-map-marker',
        html: '<div class="marker-pin"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 20],
        popupAnchor: [0, -20],
      });

      // Add primary tile layer with error handling
      this.addTileLayerWithErrorHandling(L);

      // Invalidate map size to ensure proper rendering
      setTimeout(() => {
        if (this.mapInstance) {
          this.mapInstance.invalidateSize();
        }
      }, 0);

      // Add markers after a short delay to ensure map is ready
      setTimeout(() => {
        this.addMarkersToMap(L, validLocations, darkMarkerIcon);

        // Fit map bounds to show all markers if multiple locations
        if (validLocations.length > 1 && this.mapInstance) {
          const bounds = L.latLngBounds(validLocations.map((loc) => [loc.lat, loc.lng]));
          this.mapInstance.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 12, // Limit max zoom for minimalistic view
          });
        }
      }, 200);

      // Set timeout to mark tiles as loaded (fallback if events don't fire)
      this.tileLoadTimeout = setTimeout(() => {
        this.tilesLoading = false;
        this.cdr.markForCheck();
      }, 5000);
    } catch (error) {
      this.mapInitFailed = true;
      this.tilesLoading = false;
      console.warn('[MapSection] Leaflet not available', error);
      this.destroyMap();
      this.cdr.markForCheck();
    }
  }

  /**
   * Process places from JSON with comprehensive logging
   */
  private processPlaces(fields: any[]): {
    validLocations: Array<{ lat: number; lng: number; location: any }>;
    invalidLocations: Array<{ location: any; reason: string }>;
  } {
    console.log(`[MapSection] Processing ${fields.length} places from JSON`);

    const validLocations: Array<{ lat: number; lng: number; location: any }> = [];
    const invalidLocations: Array<{ location: any; reason: string }> = [];

    fields.forEach((location: any, index: number) => {
      const locationName = location.name || `Location ${index + 1}`;
      const lat = location.x || location.coordinates?.lat;
      const lng = location.y || location.coordinates?.lng;

      // Validate coordinates
      if (lat == null || lng == null) {
        const reason = `Missing coordinates (lat: ${lat}, lng: ${lng})`;
        console.warn(`[MapSection] Skipping place "${locationName}": ${reason}`);
        invalidLocations.push({ location, reason });
        return;
      }

      if (isNaN(lat) || isNaN(lng)) {
        const reason = `Invalid coordinate format (lat: ${lat}, lng: ${lng})`;
        console.warn(`[MapSection] Skipping place "${locationName}": ${reason}`);
        invalidLocations.push({ location, reason });
        return;
      }

      // Validate coordinate ranges
      if (lat < -90 || lat > 90) {
        const reason = `Latitude out of range: ${lat} (must be between -90 and 90)`;
        console.warn(`[MapSection] Skipping place "${locationName}": ${reason}`);
        invalidLocations.push({ location, reason });
        return;
      }

      if (lng < -180 || lng > 180) {
        const reason = `Longitude out of range: ${lng} (must be between -180 and 180)`;
        console.warn(`[MapSection] Skipping place "${locationName}": ${reason}`);
        invalidLocations.push({ location, reason });
        return;
      }

      // Valid location
      validLocations.push({ lat, lng, location });
      console.log(`[MapSection] Valid place "${locationName}" at [${lat}, ${lng}]`);
    });

    console.log(
      `[MapSection] Place processing complete: ${validLocations.length} valid, ${invalidLocations.length} invalid`
    );

    if (invalidLocations.length > 0) {
      console.warn(
        `[MapSection] ${invalidLocations.length} places could not be added to the map. Check console for details.`
      );
    }

    return { validLocations, invalidLocations };
  }

  /**
   * Add tile layer with error handling and retry logic
   */
  private addTileLayerWithErrorHandling(L: any): void {
    // Primary tile layer (CartoDB Dark Matter)
    const primaryTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    this.tileLayer = L.tileLayer(primaryTileUrl, {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
      minZoom: 1,
      crossOrigin: true,
    });

    // Fallback tile layer (OpenStreetMap)
    this.fallbackTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 1,
      crossOrigin: true,
    });

    // Track tile loading
    this.loadedTiles = 0;
    this.failedTiles = 0;
    this.tileErrors.clear();

    // Handle tile errors with retry logic
    this.tileLayer.on('tileerror', (error: any, tile: any) => {
      // Validate tile and coords exist before accessing
      if (
        !tile ||
        !tile.coords ||
        typeof tile.coords.z !== 'number' ||
        typeof tile.coords.x !== 'number' ||
        typeof tile.coords.y !== 'number'
      ) {
        console.warn('[MapSection] Tile error with invalid tile structure:', { tile, error });
        this.failedTiles++;
        // Switch to fallback if too many tiles fail
        if (this.failedTiles > 10 && !this.usingFallback) {
          this.switchToFallbackTiles(L);
        }
        return;
      }

      const tileKey = `${tile.coords.z}/${tile.coords.x}/${tile.coords.y}`;
      const errorCount = (this.tileErrors.get(tileKey) || 0) + 1;
      this.tileErrors.set(tileKey, errorCount);
      this.failedTiles++;

      if (errorCount <= this.maxTileRetries) {
        console.debug(
          `[MapSection] Tile error for ${tileKey}, retry ${errorCount}/${this.maxTileRetries}`
        );
        // Leaflet will automatically retry, but we track it
        setTimeout(() => {
          if (this.tileLayer && !this.usingFallback) {
            this.tileLayer.redraw();
          }
        }, 1000 * errorCount); // Exponential backoff
      } else {
        console.warn(`[MapSection] Tile ${tileKey} failed after ${this.maxTileRetries} retries`);
        // Switch to fallback if too many tiles fail
        if (this.failedTiles > 10 && !this.usingFallback) {
          this.switchToFallbackTiles(L);
        }
      }
    });

    // Track successful tile loads
    this.tileLayer.on('tileload', () => {
      this.loadedTiles++;
      if (this.loadedTiles === 1) {
        console.log('[MapSection] First tile loaded successfully');
      }
    });

    // Handle tile layer load event
    this.tileLayer.on('load', () => {
      console.log(
        `[MapSection] Tile layer loaded: ${this.loadedTiles} tiles loaded, ${this.failedTiles} failed`
      );
      this.tilesLoading = false;
      if (this.tileLoadTimeout) {
        clearTimeout(this.tileLoadTimeout);
      }
      this.cdr.markForCheck();
    });

    // Add primary tile layer to map
    this.tileLayer.addTo(this.mapInstance);

    // Set timeout to switch to fallback if primary doesn't load
    setTimeout(() => {
      if (this.loadedTiles === 0 && !this.usingFallback) {
        console.warn('[MapSection] Primary tile layer failed to load, switching to fallback');
        this.switchToFallbackTiles(L);
      }
    }, 10000);
  }

  /**
   * Switch to fallback tile provider
   */
  private switchToFallbackTiles(L: any): void {
    if (this.usingFallback || !this.mapInstance) return;

    this.usingFallback = true;
    console.log('[MapSection] Switching to fallback tile provider (OpenStreetMap)');

    // Remove primary tile layer
    if (this.tileLayer) {
      this.mapInstance.removeLayer(this.tileLayer);
    }

    // Add fallback tile layer
    this.fallbackTileLayer.addTo(this.mapInstance);

    // Track fallback tile loading
    this.fallbackTileLayer.on('tileerror', (error: any, tile: any) => {
      const tileKey = `${tile.coords.z}/${tile.coords.x}/${tile.coords.y}`;
      console.warn(`[MapSection] Fallback tile error for ${tileKey}`);
    });

    this.fallbackTileLayer.on('load', () => {
      console.log('[MapSection] Fallback tile layer loaded');
      this.tilesLoading = false;
      if (this.tileLoadTimeout) {
        clearTimeout(this.tileLoadTimeout);
      }
      this.cdr.markForCheck();
    });
  }

  /**
   * Add markers to the map
   */
  private addMarkersToMap(
    L: any,
    locations: Array<{ lat: number; lng: number; location: any }>,
    icon: any
  ): void {
    if (!this.mapInstance || this.markersAdded) return;

    try {
      let addedCount = 0;
      let failedCount = 0;

      locations.forEach(({ lat, lng, location }) => {
        try {
          const locationName = location.name || 'Location';
          const marker = L.marker([lat, lng], { icon })
            .addTo(this.mapInstance)
            .bindPopup(
              `<div class="dark-popup"><b>${locationName}</b><br>${location.address || ''}</div>`
            );

          // Ensure marker is visible
          const markerElement = marker.getElement();
          if (markerElement) {
            markerElement.style.display = 'block';
            markerElement.style.visibility = 'visible';
            markerElement.style.opacity = '1';
          }

          // Force marker to be visible after a short delay
          setTimeout(() => {
            const element = marker.getElement();
            if (element) {
              element.style.display = 'block';
              element.style.visibility = 'visible';
              element.style.opacity = '1';
            }
          }, 50);

          addedCount++;
          console.debug(`[MapSection] Marker added for "${locationName}" at [${lat}, ${lng}]`);
        } catch (error) {
          failedCount++;
          console.warn(
            `[MapSection] Failed to add marker for location: ${location.name || 'Unknown'}`,
            error
          );
        }
      });

      this.markersAdded = true;
      console.log(`[MapSection] Markers added: ${addedCount} successful, ${failedCount} failed`);
    } catch (error) {
      console.warn('[MapSection] Failed to add markers to map', error);
    }
  }

  /**
   * Destroy map instance
   */
  private destroyMap(): void {
    if (this.tileLoadTimeout) {
      clearTimeout(this.tileLoadTimeout);
      this.tileLoadTimeout = null;
    }

    if (this.tileLayer) {
      try {
        this.mapInstance?.removeLayer(this.tileLayer);
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.tileLayer = null;
    }

    if (this.fallbackTileLayer) {
      try {
        this.mapInstance?.removeLayer(this.fallbackTileLayer);
      } catch (e) {
        // Ignore errors during cleanup
      }
      this.fallbackTileLayer = null;
    }

    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }

    this.markersAdded = false;
    this.tileErrors.clear();
    this.loadedTiles = 0;
    this.failedTiles = 0;
    this.usingFallback = false;
    this.tilesLoading = true;
  }

  /**
   * Calculate layout preferences for map section based on content.
   * Map sections: 2 cols default, can shrink to 1, expands to 3-4 for wide maps
   */
  private calculateMapLayoutPreferences(
    section: CardSection,
    availableColumns: number
  ): SectionLayoutPreferences {
    // Map sections prefer 2 columns for optimal viewing
    // Can expand to 3-4 for wide maps, shrink to 1 for compact layouts
    let preferredColumns: 1 | 2 | 3 | 4 = 2;

    // Maps benefit from wider layouts when space is available
    if (availableColumns >= 3) {
      preferredColumns = 3;
    }

    // Respect explicit preferences
    if (section.preferredColumns) {
      preferredColumns = section.preferredColumns;
    }

    preferredColumns = Math.min(preferredColumns, availableColumns) as 1 | 2 | 3 | 4;

    return {
      preferredColumns,
      minColumns: (section.minColumns ?? 1) as 1 | 2 | 3 | 4,
      maxColumns: Math.min((section.maxColumns ?? 4) as 1 | 2 | 3 | 4, availableColumns) as
        | 1
        | 2
        | 3
        | 4,
      canShrinkToFill: true,
      shrinkPriority: 25, // Higher priority for shrinking (promotes side-by-side placement)
      expandOnContent: {
        // Maps can expand based on location count
      },
    };
  }

  /**
   * Get layout preferences for map section.
   */
  override getLayoutPreferences(availableColumns: number = 4): SectionLayoutPreferences {
    const servicePrefs = this.layoutService.getPreferences(this.section, availableColumns);
    if (servicePrefs) {
      return servicePrefs;
    }
    return this.calculateMapLayoutPreferences(this.section, availableColumns);
  }
}
