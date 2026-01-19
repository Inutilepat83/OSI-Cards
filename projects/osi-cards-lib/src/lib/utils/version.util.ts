/**
 * Version Utilities
 *
 * Provides semantic version comparison and validation utilities.
 * Used for version enforcement and compatibility checking.
 *
 * @example
 * ```typescript
 * import { compareVersions, satisfiesVersion, checkVersionRequirement } from './version.util';
 *
 * // Compare versions
 * const result = compareVersions('1.5.52', '1.5.0'); // returns 1 (greater)
 *
 * // Check if version satisfies requirement
 * const satisfied = satisfiesVersion('1.5.52', '>=1.5.0'); // returns true
 * const satisfied2 = satisfiesVersion('1.5.52', '^1.5.0'); // returns true
 *
 * // Check version requirement and log warning if needed
 * checkVersionRequirement('1.5.52', '>=1.6.0'); // logs warning
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Parsed version components
 */
export interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

// ============================================================================
// VERSION PARSING
// ============================================================================

/**
 * Parse semantic version string into components
 *
 * @param version - Version string (e.g., "1.5.52" or "1.5.52-beta.1")
 * @returns Parsed version components
 * @throws Error if version format is invalid
 *
 * @example
 * ```typescript
 * const parsed = parseVersion('1.5.52');
 * // { major: 1, minor: 5, patch: 52 }
 * ```
 */
export function parseVersion(version: string): ParsedVersion {
  // Remove leading 'v' if present
  const cleanVersion = version.trim().replace(/^v/, '');

  // Match semantic version pattern: major.minor.patch[-prerelease][+build]
  const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([\w.-]+))?(?:\+([\w.-]+))?$/);

  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  // match[1], match[2], match[3] are guaranteed to exist because they're in required groups
  const major = match[1]!;
  const minor = match[2]!;
  const patch = match[3]!;

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease: match[4] || undefined,
    build: match[5] || undefined,
  };
}

// ============================================================================
// VERSION COMPARISON
// ============================================================================

/**
 * Compare two semantic versions
 *
 * @param version1 - First version string
 * @param version2 - Second version string
 * @returns Comparison result:
 *   - Negative number if version1 < version2
 *   - Zero if version1 === version2
 *   - Positive number if version1 > version2
 *
 * @example
 * ```typescript
 * compareVersions('1.5.52', '1.5.0'); // returns 52
 * compareVersions('1.5.0', '1.5.52'); // returns -52
 * compareVersions('1.5.0', '1.5.0'); // returns 0
 * ```
 */
export function compareVersions(version1: string, version2: string): number {
  const v1 = parseVersion(version1);
  const v2 = parseVersion(version2);

  // Compare major version
  if (v1.major !== v2.major) {
    return v1.major - v2.major;
  }

  // Compare minor version
  if (v1.minor !== v2.minor) {
    return v1.minor - v2.minor;
  }

  // Compare patch version
  if (v1.patch !== v2.patch) {
    return v1.patch - v2.patch;
  }

  // If both have prerelease, compare lexicographically
  // Prerelease versions are considered lower than release versions
  if (v1.prerelease && v2.prerelease) {
    return v1.prerelease.localeCompare(v2.prerelease);
  }

  // Version with prerelease is lower than version without
  if (v1.prerelease && !v2.prerelease) {
    return -1;
  }

  if (!v1.prerelease && v2.prerelease) {
    return 1;
  }

  // Versions are equal
  return 0;
}

// ============================================================================
// VERSION SATISFACTION
// ============================================================================

/**
 * Check if installed version satisfies the required version constraint
 *
 * Supports:
 * - Exact version: "1.5.52"
 * - Minimum version: ">=1.5.0", ">1.5.0"
 * - Range matching: "^1.5.0", "~1.5.0"
 *
 * @param installedVersion - Currently installed version
 * @param requiredVersion - Required version constraint
 * @returns True if installed version satisfies the requirement
 *
 * @example
 * ```typescript
 * satisfiesVersion('1.5.52', '1.5.52'); // true
 * satisfiesVersion('1.5.52', '>=1.5.0'); // true
 * satisfiesVersion('1.5.52', '>=1.6.0'); // false
 * satisfiesVersion('1.5.52', '^1.5.0'); // true
 * satisfiesVersion('1.5.52', '~1.5.0'); // true
 * ```
 */
export function satisfiesVersion(installedVersion: string, requiredVersion: string): boolean {
  const trimmed = requiredVersion.trim();

  // Exact version match
  if (!/^[<>=^~]/.test(trimmed)) {
    return compareVersions(installedVersion, trimmed) === 0;
  }

  // Greater than or equal (>=)
  if (trimmed.startsWith('>=')) {
    const minVersion = trimmed.substring(2).trim();
    return compareVersions(installedVersion, minVersion) >= 0;
  }

  // Greater than (>)
  if (trimmed.startsWith('>')) {
    const minVersion = trimmed.substring(1).trim();
    return compareVersions(installedVersion, minVersion) > 0;
  }

  // Less than or equal (<=)
  if (trimmed.startsWith('<=')) {
    const maxVersion = trimmed.substring(2).trim();
    return compareVersions(installedVersion, maxVersion) <= 0;
  }

  // Less than (<)
  if (trimmed.startsWith('<')) {
    const maxVersion = trimmed.substring(1).trim();
    return compareVersions(installedVersion, maxVersion) < 0;
  }

  // Caret range (^) - compatible within same major version
  // ^1.5.0 means >=1.5.0 <2.0.0
  if (trimmed.startsWith('^')) {
    const baseVersion = trimmed.substring(1).trim();
    const base = parseVersion(baseVersion);
    const installed = parseVersion(installedVersion);

    // Same major version and >= base version
    if (installed.major !== base.major) {
      return false;
    }

    return compareVersions(installedVersion, baseVersion) >= 0;
  }

  // Tilde range (~) - compatible within same minor version
  // ~1.5.0 means >=1.5.0 <1.6.0
  if (trimmed.startsWith('~')) {
    const baseVersion = trimmed.substring(1).trim();
    const base = parseVersion(baseVersion);
    const installed = parseVersion(installedVersion);

    // Same major and minor version and >= base version
    if (installed.major !== base.major || installed.minor !== base.minor) {
      return false;
    }

    return compareVersions(installedVersion, baseVersion) >= 0;
  }

  // Unknown format, try exact match as fallback
  console.warn(
    `[OSI Cards] Unknown version constraint format: ${requiredVersion}. Treating as exact version.`
  );
  return compareVersions(installedVersion, trimmed) === 0;
}

// ============================================================================
// VERSION CHECK WITH LOGGING
// ============================================================================

/**
 * Check version requirement and log warning if not satisfied
 *
 * This function performs a non-blocking version check and logs a warning
 * if the installed version does not meet the requirement.
 *
 * @param installedVersion - Currently installed library version
 * @param requiredVersion - Required minimum version constraint
 * @param libraryName - Optional library name for warning message (default: "OSI Cards")
 * @returns True if requirement is satisfied, false otherwise
 *
 * @example
 * ```typescript
 * // In provideOsiCards()
 * checkVersionRequirement(VERSION, config.minVersion || '>=1.5.0');
 * ```
 */
export function checkVersionRequirement(
  installedVersion: string,
  requiredVersion: string | undefined,
  libraryName: string = 'OSI Cards'
): boolean {
  if (!requiredVersion) {
    return true; // No requirement specified
  }

  try {
    const satisfied = satisfiesVersion(installedVersion, requiredVersion);

    if (!satisfied) {
      console.warn(
        `[${libraryName}] Version warning: Installed version ${installedVersion} does not meet minimum requirement ${requiredVersion}. ` +
          `Please update to a compatible version. Some features may not work correctly.`
      );
    }

    return satisfied;
  } catch (error) {
    // Invalid version format - log error but don't block
    console.error(
      `[${libraryName}] Version check error: Failed to parse version constraint "${requiredVersion}":`,
      error
    );
    return true; // Return true to allow initialization to continue
  }
}
