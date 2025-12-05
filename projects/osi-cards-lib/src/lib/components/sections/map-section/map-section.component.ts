import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent, SectionLayoutPreferences } from '../base-section.component';
import { SectionLayoutPreferenceService } from '../../../services/section-layout-preference.service';
import { CardSection } from '../../../models';

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
})
export class MapSectionComponent
  extends BaseSectionComponent
  implements AfterViewInit, OnDestroy, OnInit
{
  private readonly layoutService = inject(SectionLayoutPreferenceService);

  ngOnInit(): void {
    // Register layout preference function for this section type
    this.layoutService.register('map', (section: CardSection, availableColumns: number) => {
      return this.calculateMapLayoutPreferences(section, availableColumns);
    });
  }
  @ViewChild('mapElement', { static: false }) mapElement?: ElementRef<HTMLDivElement>;

  private mapInstance: any;

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
    if (!this.mapElement || !fields || fields.length === 0) return;

    try {
      // Dynamic import of Leaflet
      const L = await import('leaflet');

      // Get first location coordinates
      const firstLocation: any = fields[0];
      const lat = firstLocation.x || firstLocation.coordinates?.lat || 0;
      const lng = firstLocation.y || firstLocation.coordinates?.lng || 0;

      // Create map
      this.mapInstance = L.map(this.mapElement.nativeElement).setView([lat, lng], 13);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.mapInstance);

      // Add markers for all locations
      fields.forEach((location: any) => {
        const locLat = location.x || location.coordinates?.lat;
        const locLng = location.y || location.coordinates?.lng;

        if (locLat && locLng) {
          L.marker([locLat, locLng])
            .addTo(this.mapInstance)
            .bindPopup(`<b>${location.name}</b><br>${location.address || ''}`);
        }
      });
    } catch (error) {
      console.warn('Leaflet not available', error);
    }
  }

  /**
   * Destroy map instance
   */
  private destroyMap(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
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
