import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem, CardSection } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';

type MapLocation = (CardField & CardItem) & {
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  name: string;
  type?: string;
};

interface MapInteraction {
  item: MapLocation;
  metadata?: Record<string, unknown>;
}

@Component({
  selector: 'app-map-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './map-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MapSectionComponent {
  @Input({ required: true }) section!: CardSection;
  @Output() itemInteraction = new EventEmitter<MapInteraction>();

  get locations(): MapLocation[] {
    const fromFields = (this.section.fields as MapLocation[]) ?? [];
    const mappedFields = fromFields
      .map((field) => ({
        ...field,
        name: field.name || field.title || field.label || field.id
      }))
      .filter((field) => !!field.name);

    if (Array.isArray(this.section.items) && this.section.items.length) {
      return mappedFields.concat(
        (this.section.items as MapLocation[]).map((item) => ({
          ...item,
          name: item.name || item.title || item.id
        }))
      );
    }

    return mappedFields;
  }

  get hasLocations(): boolean {
    return this.locations.length > 0;
  }

  onLocationClick(location: MapLocation): void {
    this.itemInteraction.emit({
      item: location,
      metadata: {
        sectionId: this.section.id,
        sectionTitle: this.section.title
      }
    });
  }

  getAnimationDelay(index: number, baseDelay = 60): string {
    return `${index * baseDelay}ms`;
  }

  getAnimationDuration(duration = 0.6): string {
    return `fadeInUp ${duration}s ease-out forwards`;
  }

  formatCoordinates(location: MapLocation): string | null {
    if (!location.coordinates) {
      return null;
    }
    const { lat, lng } = location.coordinates;
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }

  trackLocation(index: number, location: MapLocation): string {
    return location.id ?? `${location.name}-${index}`;
  }
}
