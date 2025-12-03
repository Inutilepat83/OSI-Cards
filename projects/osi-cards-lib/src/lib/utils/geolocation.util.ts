/**
 * Geolocation Utilities
 *
 * Utilities for geolocation operations including position tracking,
 * distance calculations, and address geocoding.
 *
 * @example
 * ```typescript
 * import { getCurrentPosition, calculateDistance } from '@osi-cards/utils';
 *
 * const position = await getCurrentPosition();
 * const distance = calculateDistance(lat1, lon1, lat2, lon2);
 * ```
 */

export interface Position {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Get current position
 */
export function getCurrentPosition(options?: GeolocationOptions): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });
      },
      reject,
      options
    );
  });
}

/**
 * Watch position
 */
export function watchPosition(
  callback: (position: Position) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: GeolocationOptions
): number {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
      });
    },
    errorCallback,
    options
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = Math.atan2(y, x);
  return (bearing * 180) / Math.PI;
}

/**
 * Check if point is within radius
 */
export function isWithinRadius(
  lat: number,
  lon: number,
  centerLat: number,
  centerLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat, lon, centerLat, centerLon);
  return distance <= radiusKm;
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lon).toFixed(6)}° ${lonDir}`;
}

