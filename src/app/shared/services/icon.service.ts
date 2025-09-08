import { Injectable } from '@angular/core';

export interface IconMapping {
  cssClass: string;
  svgPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconMap: Record<string, IconMapping> = {
    'Name': {
      cssClass: 'icon-user',
      svgPath: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2'
    },
    'Email': {
      cssClass: 'icon-mail',
      svgPath: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    'Phone': {
      cssClass: 'icon-phone',
      svgPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
    },
    'Address': {
      cssClass: 'icon-map-pin',
      svgPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
    },
    'Company': {
      cssClass: 'icon-building',
      svgPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    },
    'Revenue': {
      cssClass: 'icon-dollar-sign',
      svgPath: 'M12 1v22m0-22l-4 4m4-4l4 4'
    },
    'Employees': {
      cssClass: 'icon-users',
      svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    'Industry': {
      cssClass: 'icon-briefcase',
      svgPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6'
    },
    'Website': {
      cssClass: 'icon-globe',
      svgPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9m-9 9a9 9 0 01-9-9m9 9c0-1.657 4.03-3 9-3s-9 1.343-9 3m-9-9a9 9 0 01-9 9m9-9c0 1.657-4.03 3-9 3s-9-1.343-9-3'
    },
    'Status': {
      cssClass: 'icon-check-circle',
      svgPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    'Priority': {
      cssClass: 'icon-flag',
      svgPath: 'M3 21v-4a4 4 0 014-4h5a4 4 0 014 4v4M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.85'
    },
    'Date': {
      cssClass: 'icon-calendar',
      svgPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    'Amount': {
      cssClass: 'icon-dollar-sign',
      svgPath: 'M12 1v22m0-22l-4 4m4-4l4 4'
    },
    'Description': {
      cssClass: 'icon-file-text',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8'
    },
    'Location': {
      cssClass: 'icon-map-pin',
      svgPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
    },
    'Type': {
      cssClass: 'icon-tag',
      svgPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
    },
    // Additional icon mappings for JSON-based icons
    'mail': {
      cssClass: 'icon-mail',
      svgPath: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    'phone': {
      cssClass: 'icon-phone',
      svgPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
    },
    'map-marker': {
      cssClass: 'icon-map-pin',
      svgPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z'
    },
    'linkedin': {
      cssClass: 'icon-linkedin',
      svgPath: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 2a2 2 0 11-4 0 2 2 0 014 0z'
    },
    // Emoji-based icons from JSON configurations
    '🌐': {
      cssClass: 'icon-globe',
      svgPath: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 9c1.657 0 3 4.03 3 9s-1.343 9-3 9m-9 9a9 9 0 01-9-9m9 9c0-1.657 4.03-3 9-3s-9 1.343-9 3m-9-9a9 9 0 01-9 9m9-9c0 1.657-4.03 3-9 3s-9-1.343-9-3'
    },
    '📧': {
      cssClass: 'icon-mail',
      svgPath: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    '☁️': {
      cssClass: 'icon-cloud',
      svgPath: 'M20.618 8.45c.77-.77.77-2.02 0-2.79L18.83 4.88c-.77-.77-2.02-.77-2.79 0L15.25 6.67c-.77.77-.77 2.02 0 2.79l1.79 1.79c.77.77 2.02.77 2.79 0l1.79-1.79zM9.5 3.5c.77-.77.77-2.02 0-2.79L7.71 0c-.77-.77-2.02-.77-2.79 0L3.13 1.79c-.77.77-.77 2.02 0 2.79l1.79 1.79c.77.77 2.02.77 2.79 0L9.5 3.5zM3.13 13.33c-.77-.77-.77-2.02 0-2.79l1.79-1.79c.77-.77 2.02-.77 2.79 0L9.5 11.75c.77.77.77 2.02 0 2.79l-1.79 1.79c-.77.77-2.02.77-2.79 0L3.13 13.33z'
    },
    '🏥': {
      cssClass: 'icon-hospital',
      svgPath: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    },
    '🎫': {
      cssClass: 'icon-ticket',
      svgPath: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v-3a2 2 0 00-2-2m14 0a2 2 0 012 2v3a2 2 0 01-4 0v-3a2 2 0 012-2z'
    },
    '📅': {
      cssClass: 'icon-calendar',
      svgPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    '🎩': {
      cssClass: 'icon-user-tie',
      svgPath: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    '🎤': {
      cssClass: 'icon-microphone',
      svgPath: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
    },
    '💼': {
      cssClass: 'icon-briefcase',
      svgPath: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6'
    },
    '📊': {
      cssClass: 'icon-bar-chart',
      svgPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    '📞': {
      cssClass: 'icon-phone',
      svgPath: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
    },
    '📄': {
      cssClass: 'icon-file-text',
      svgPath: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8'
    },
    '🤝': {
      cssClass: 'icon-handshake',
      svgPath: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    '📈': {
      cssClass: 'icon-trending-up',
      svgPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    '🎨': {
      cssClass: 'icon-palette',
      svgPath: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z'
    }
  };

  private defaultIcon: IconMapping = {
    cssClass: 'icon-circle',
    svgPath: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
  };

  /**
   * Get the CSS class for a field label
   * @param label The field label
   * @returns CSS class string
   */
  getFieldIconClass(label: string): string {
    return this.iconMap[label]?.cssClass || this.defaultIcon.cssClass;
  }

  /**
   * Get the SVG path for a field label
   * @param label The field label
   * @returns SVG path string
   */
  getFieldIcon(label: string): string {
    return this.iconMap[label]?.svgPath || this.defaultIcon.svgPath;
  }

  /**
   * Get the complete icon mapping for a field label
   * @param label The field label
   * @returns IconMapping object
   */
  getIconMapping(label: string): IconMapping {
    return this.iconMap[label] || this.defaultIcon;
  }

  /**
   * Get all available icon labels
   * @returns Array of available icon labels
   */
  getAvailableIcons(): string[] {
    return Object.keys(this.iconMap);
  }

  /**
   * Add or update an icon mapping
   * @param label The field label
   * @param mapping The icon mapping
   */
  setIconMapping(label: string, mapping: IconMapping): void {
    this.iconMap[label] = mapping;
  }

  /**
   * Remove an icon mapping
   * @param label The field label to remove
   */
  removeIconMapping(label: string): void {
    delete this.iconMap[label];
  }
}
