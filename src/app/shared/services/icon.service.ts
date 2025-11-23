/**
 * Icon service for mapping field names and action types to Lucide icons
 * 
 * Provides intelligent icon mapping based on field names, action types, and keywords.
 * Supports both exact matches and partial keyword matching for flexible icon selection.
 * 
 * @example
 * ```typescript
 * const iconService = inject(IconService);
 * 
 * // Get icon for field
 * const icon = iconService.getFieldIcon('email'); // "mail"
 * const icon = iconService.getFieldIcon('revenue'); // "dollar-sign"
 * 
 * // Get CSS class for field icon
 * const className = iconService.getFieldIconClass('email'); // "text-blue-500"
 * ```
 */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconMap: Record<string, string> = {
    // Business & Finance
    'revenue': 'dollar-sign',
    'profit': 'trending-up',
    'expenses': 'trending-down',
    'budget': 'pie-chart',
    'sales': 'shopping-cart',
    'cost': 'calculator',
    'price': 'tag',
    'value': 'star',
    'growth': 'arrow-up',
    'decline': 'arrow-down',
    
    // Contact & Communication
    'email': 'mail',
    'phone': 'phone',
    'address': 'map-pin',
    'website': 'globe',
    'linkedin': 'linkedin',
    'twitter': 'twitter',
    'facebook': 'facebook',
    'instagram': 'instagram',
    'contact': 'user',
    'message': 'message-circle',
    
    // Time & Dates
    'date': 'calendar',
    'time': 'clock',
    'deadline': 'calendar-x',
    'schedule': 'calendar-check',
    'created': 'calendar-plus',
    'updated': 'refresh-cw',
    'duration': 'timer',
    
    // Status & Progress
    'status': 'info',
    'progress': 'activity',
    'completed': 'check-circle',
    'pending': 'clock',
    'failed': 'x-circle',
    'warning': 'alert-triangle',
    'success': 'check',
    'error': 'alert-circle',
    
    // Business Operations
    'company': 'building',
    'department': 'users',
    'team': 'users',
    'manager': 'user-check',
    'employee': 'user',
    'position': 'briefcase',
    'role': 'shield',
    'title': 'tag',
    
    // Products & Services
    'product': 'package',
  'service': 'wrench',
    'category': 'folder',
    'type': 'type',
    'brand': 'award',
    'model': 'box',
    'version': 'git-branch',
    
    // Metrics & Analytics
    'metric': 'bar-chart',
    'analytics': 'trending-up',
    'performance': 'zap',
    'efficiency': 'target',
    'quality': 'award',
    'rating': 'star',
    'score': 'hash',
    'rank': 'trending-up',
    
    // Default fallbacks
    'default': 'circle',
    'unknown': 'help-circle'
  };

  private classMap: Record<string, string> = {
    // Business & Finance
    'revenue': 'text-green-500',
    'profit': 'text-green-600',
    'expenses': 'text-red-500',
    'budget': 'text-blue-500',
    'sales': 'text-purple-500',
    'cost': 'text-orange-500',
    'price': 'text-yellow-600',
    'value': 'text-amber-500',
    'growth': 'text-green-500',
    'decline': 'text-red-500',
    
    // Contact & Communication
    'email': 'text-blue-500',
    'phone': 'text-green-500',
    'address': 'text-red-500',
    'website': 'text-blue-600',
    'linkedin': 'text-blue-700',
    'twitter': 'text-sky-500',
    'facebook': 'text-blue-600',
    'instagram': 'text-pink-500',
    'contact': 'text-gray-600',
    'message': 'text-blue-500',
    
    // Status & Progress
    'status': 'text-blue-500',
    'progress': 'text-orange-500',
    'completed': 'text-green-500',
    'pending': 'text-yellow-500',
    'failed': 'text-red-500',
    'warning': 'text-amber-500',
    'success': 'text-green-500',
    'error': 'text-red-500',
    
    // Default
    'default': 'text-gray-500'
  };

  /**
   * Get icon name for a field based on its name
   * 
   * Uses intelligent matching to find the most appropriate icon for a field name.
   * Tries exact match first, then partial keyword matching.
   * 
   * @param fieldName - The name of the field to get an icon for
   * @returns Lucide icon name, or 'circle' as default
   * 
   * @example
   * ```typescript
   * const icon = iconService.getFieldIcon('email'); // "mail"
   * const icon = iconService.getFieldIcon('userEmail'); // "mail" (partial match)
   * const icon = iconService.getFieldIcon('unknown'); // "circle" (default)
   * ```
   */
  getFieldIcon(fieldName: string): string {
    const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try exact match first
    if (this.iconMap[normalizedName]) {
      return this.iconMap[normalizedName];
    }
    
    // Try partial matches
    for (const [key, icon] of Object.entries(this.iconMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return icon;
      }
    }
    
    return this.iconMap['default'];
  }

  /**
   * Get CSS class for a field icon based on its name
   * 
   * Returns appropriate color classes for field icons based on semantic meaning.
   * Uses the same matching logic as getFieldIcon.
   * 
   * @param fieldName - The name of the field to get a class for
   * @returns CSS class string, or 'text-gray-500' as default
   * 
   * @example
   * ```typescript
   * const className = iconService.getFieldIconClass('email'); // "text-blue-500"
   * const className = iconService.getFieldIconClass('revenue'); // "text-green-500"
   * ```
   */
  getFieldIconClass(fieldName: string): string {
    const normalizedName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try exact match first
    if (this.classMap[normalizedName]) {
      return this.classMap[normalizedName];
    }
    
    // Try partial matches
    for (const [key, className] of Object.entries(this.classMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return className;
      }
    }
    
    return this.classMap['default'];
  }
}
