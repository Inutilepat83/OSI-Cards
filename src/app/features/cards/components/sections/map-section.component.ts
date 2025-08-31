import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CardSection } from '../../../../models/card.model';
import { LazyLoader } from '../../../../core/performance/bundle-optimizer';
import { LoggerService } from '../../../../core/services/enhanced-logging.service';

interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
}

@Component({
  selector: 'app-map-section',
  templateUrl: './map-section.component.html',
  styleUrls: ['./map-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSectionComponent implements AfterViewInit, OnDestroy {
  @Input() section!: CardSection;
  @Input() center: { lat: number; lng: number } | [number, number] = [51.505, -0.09];
  @Input() zoom: number = 13;
  @Input() markers: MapMarker[] = [];

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map: any = null;
  private leafletModule: any = null;
  private readonly logger = this.loggerService.createChildLogger('MapSection');
  private isLoading = false;

  constructor(private loggerService: LoggerService) {}

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private async initializeMap(): Promise<void> {
    if (!this.mapContainer || this.isLoading) return;

    try {
      this.isLoading = true;
      this.logger.debug('Loading Leaflet module...');

      // Lazy load Leaflet
      this.leafletModule = await LazyLoader.loadLeaflet();
      const L = this.leafletModule;

      // Determine center either from input or section
      let mapCenter: [number, number];

      if (this.section?.mapCenter) {
        mapCenter = [this.section.mapCenter.lat, this.section.mapCenter.lng];
      } else if (Array.isArray(this.center)) {
        mapCenter = this.center;
      } else {
        mapCenter = [this.center.lat, this.center.lng];
      }

      // Determine zoom level
      const zoomLevel = this.section?.zoom || this.zoom;

      // Initialize map
      this.map = L.map(this.mapContainer.nativeElement, {
        center: mapCenter,
        zoom: zoomLevel,
        layers: [
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
      });

      // Add markers from either input props or section
      const markersToAdd = this.section?.markers || this.markers;

      if (markersToAdd && Array.isArray(markersToAdd)) {
        markersToAdd.forEach((marker: MapMarker) => {
          if (marker.lat && marker.lng) {
            L.marker([marker.lat, marker.lng])
              .addTo(this.map!)
              .bindPopup(marker.title || '');
          }
        });
      }

      this.logger.debug('Map initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize map', error);
    } finally {
      this.isLoading = false;
    }
  }
}
