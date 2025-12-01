import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardField, CardItem } from '../../../../../models';
import { LucideIconsModule } from '../../../../icons/lucide-icons.module';
import { BaseSectionComponent } from '../base-section.component';

type MapLocation = (CardField & CardItem) & {
  coordinates?: {
    lat: number;
    lng: number;
  };
  address?: string;
  name: string;
  type?: string;
};

@Component({
  selector: 'app-map-section',
  standalone: true,
  imports: [CommonModule, LucideIconsModule],
  templateUrl: './map-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapSectionComponent extends BaseSectionComponent<MapLocation> {
  get locations(): MapLocation[] {
    const fromFields = super.getFields() as MapLocation[];
    const mappedFields = fromFields
      .map((field) => ({
        ...field,
        name: field.name || field.title || field.label || field.id || 'Unknown Location',
      }))
      .filter((field): field is MapLocation => !!field.name && typeof field.name === 'string');

    const items = super.getItems() as MapLocation[];
    if (items.length) {
      const mappedItems = items
        .map((item) => ({
          ...item,
          name: item.name || item.title || item.id || 'Unknown Location',
        }))
        .filter((item): item is MapLocation => !!item.name && typeof item.name === 'string');

      return mappedFields.concat(mappedItems);
    }

    return mappedFields;
  }

  override get hasItems(): boolean {
    return this.locations.length > 0;
  }

  onLocationClick(location: MapLocation): void {
    this.emitItemInteraction(location);
  }

  formatCoordinates(location: MapLocation): string | null {
    if (!location.coordinates) {
      return null;
    }
    const { lat, lng } = location.coordinates;
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }

  override trackItem(index: number, location: MapLocation): string {
    return location.id ?? `${location.name}-${index}`;
  }
}
