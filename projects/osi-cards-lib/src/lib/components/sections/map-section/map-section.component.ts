import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { EmptyStateComponent, SectionHeaderComponent } from '../../shared';
import { BaseSectionComponent } from '../base-section.component';

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
export class MapSectionComponent extends BaseSectionComponent implements AfterViewInit, OnDestroy {
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
}
