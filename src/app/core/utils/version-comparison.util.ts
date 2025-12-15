/**
 * Version Comparison Utility
 * Provides functions to compare semantic versions (e.g., "1.5.40", "1.5.2")
 */

/**
 * Compare two semantic version strings
 * @param version1 First version string (e.g., "1.5.40")
 * @param version2 Second version string (e.g., "1.5.2")
 * @returns -1 if version1 < version2, 0 if equal, 1 if version1 > version2
 */
export function compareVersions(version1: string, version2: string): number {
  if (!version1 || !version2) {
    // Treat missing versions as older
    if (!version1 && !version2) {
      return 0;
    }
    return !version1 ? -1 : 1;
  }

  // Normalize versions (remove 'v' prefix if present)
  const v1 = version1.replace(/^v/i, '').trim();
  const v2 = version2.replace(/^v/i, '').trim();

  // Split into parts and parse
  const parts1 = v1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = v2.split('.').map((p) => parseInt(p, 10) || 0);

  // Ensure both arrays have the same length (pad with zeros)
  const maxLength = Math.max(parts1.length, parts2.length);
  while (parts1.length < maxLength) {
    parts1.push(0);
  }
  while (parts2.length < maxLength) {
    parts2.push(0);
  }

  // Compare each part
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] ?? 0;
    const part2 = parts2[i] ?? 0;
    if (part1 < part2) {
      return -1;
    }
    if (part1 > part2) {
      return 1;
    }
  }

  return 0;
}

/**
 * Check if version1 is newer than version2
 * @param version1 First version string
 * @param version2 Second version string
 * @returns true if version1 > version2
 */
export function isVersionNewer(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) > 0;
}

/**
 * Check if version1 is older than version2
 * @param version1 First version string
 * @param version2 Second version string
 * @returns true if version1 < version2
 */
export function isVersionOlder(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) < 0;
}

/**
 * Check if two versions are equal
 * @param version1 First version string
 * @param version2 Second version string
 * @returns true if versions are equal
 */
export function areVersionsEqual(version1: string, version2: string): boolean {
  return compareVersions(version1, version2) === 0;
}

/**
 * Check if a cached version is valid (matches or is compatible with current version)
 * Treats entries without version as outdated (invalid)
 * @param cachedVersion Version stored in cache (may be undefined for old entries)
 * @param currentVersion Current application version
 * @returns true if cached version is valid, false if it should be invalidated
 */
export function isCachedVersionValid(
  cachedVersion: string | undefined,
  currentVersion: string
): boolean {
  // If cached entry has no version, treat it as outdated
  if (!cachedVersion) {
    return false;
  }

  // Versions must match exactly for cache to be valid
  return areVersionsEqual(cachedVersion, currentVersion);
}
