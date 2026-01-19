/**
 * Version Utilities Tests
 */

import {
  parseVersion,
  compareVersions,
  satisfiesVersion,
  checkVersionRequirement,
  ParsedVersion,
} from './version.util';

describe('Version Utilities', () => {
  describe('parseVersion', () => {
    it('should parse standard semantic version', () => {
      const result = parseVersion('1.5.52');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
      });
    });

    it('should parse version with leading v', () => {
      const result = parseVersion('v1.5.52');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
      });
    });

    it('should parse version with prerelease', () => {
      const result = parseVersion('1.5.52-beta.1');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
        prerelease: 'beta.1',
      });
    });

    it('should parse version with build metadata', () => {
      const result = parseVersion('1.5.52+build.123');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
        build: 'build.123',
      });
    });

    it('should parse version with both prerelease and build', () => {
      const result = parseVersion('1.5.52-beta.1+build.123');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
        prerelease: 'beta.1',
        build: 'build.123',
      });
    });

    it('should throw error for invalid version format', () => {
      expect(() => parseVersion('invalid')).toThrow('Invalid version format');
      expect(() => parseVersion('1.5')).toThrow('Invalid version format');
      expect(() => parseVersion('1')).toThrow('Invalid version format');
      expect(() => parseVersion('1.5.52.4')).toThrow('Invalid version format');
    });

    it('should handle whitespace', () => {
      const result = parseVersion('  1.5.52  ');
      expect(result).toEqual({
        major: 1,
        minor: 5,
        patch: 52,
      });
    });
  });

  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.5.52', '1.5.52')).toBe(0);
      expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
    });

    it('should return negative for version1 < version2', () => {
      expect(compareVersions('1.5.0', '1.5.52')).toBeLessThan(0);
      expect(compareVersions('1.4.0', '1.5.0')).toBeLessThan(0);
      expect(compareVersions('0.9.0', '1.0.0')).toBeLessThan(0);
    });

    it('should return positive for version1 > version2', () => {
      expect(compareVersions('1.5.52', '1.5.0')).toBeGreaterThan(0);
      expect(compareVersions('1.6.0', '1.5.0')).toBeGreaterThan(0);
      expect(compareVersions('2.0.0', '1.9.0')).toBeGreaterThan(0);
    });

    it('should compare major version first', () => {
      expect(compareVersions('2.0.0', '1.9.99')).toBeGreaterThan(0);
      expect(compareVersions('1.9.99', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor version when major is equal', () => {
      expect(compareVersions('1.6.0', '1.5.99')).toBeGreaterThan(0);
      expect(compareVersions('1.5.99', '1.6.0')).toBeLessThan(0);
    });

    it('should compare patch version when major and minor are equal', () => {
      expect(compareVersions('1.5.52', '1.5.0')).toBeGreaterThan(0);
      expect(compareVersions('1.5.0', '1.5.52')).toBeLessThan(0);
    });

    it('should handle versions with leading v', () => {
      expect(compareVersions('v1.5.52', '1.5.52')).toBe(0);
      expect(compareVersions('1.5.52', 'v1.5.52')).toBe(0);
    });

    it('should treat prerelease as lower than release', () => {
      expect(compareVersions('1.5.52-beta.1', '1.5.52')).toBeLessThan(0);
      expect(compareVersions('1.5.52', '1.5.52-beta.1')).toBeGreaterThan(0);
    });

    it('should compare prerelease versions lexicographically', () => {
      expect(compareVersions('1.5.52-alpha.1', '1.5.52-beta.1')).toBeLessThan(0);
      expect(compareVersions('1.5.52-beta.1', '1.5.52-alpha.1')).toBeGreaterThan(0);
    });

    it('should handle versions with build metadata (build metadata ignored in comparison)', () => {
      expect(compareVersions('1.5.52+build.1', '1.5.52+build.2')).toBe(0);
      expect(compareVersions('1.5.52', '1.5.52+build.123')).toBe(0);
    });
  });

  describe('satisfiesVersion', () => {
    describe('exact version matching', () => {
      it('should match exact version', () => {
        expect(satisfiesVersion('1.5.52', '1.5.52')).toBe(true);
        expect(satisfiesVersion('1.5.52', '1.5.0')).toBe(false);
      });

      it('should handle exact version with leading v', () => {
        expect(satisfiesVersion('v1.5.52', '1.5.52')).toBe(true);
        expect(satisfiesVersion('1.5.52', 'v1.5.52')).toBe(true);
      });
    });

    describe('greater than or equal (>=)', () => {
      it('should satisfy when version is equal', () => {
        expect(satisfiesVersion('1.5.52', '>=1.5.52')).toBe(true);
        expect(satisfiesVersion('1.5.0', '>=1.5.0')).toBe(true);
      });

      it('should satisfy when version is greater', () => {
        expect(satisfiesVersion('1.5.52', '>=1.5.0')).toBe(true);
        expect(satisfiesVersion('1.6.0', '>=1.5.0')).toBe(true);
        expect(satisfiesVersion('2.0.0', '>=1.5.0')).toBe(true);
      });

      it('should not satisfy when version is less', () => {
        expect(satisfiesVersion('1.4.99', '>=1.5.0')).toBe(false);
        expect(satisfiesVersion('0.9.0', '>=1.5.0')).toBe(false);
      });

      it('should handle whitespace', () => {
        expect(satisfiesVersion('1.5.52', '>= 1.5.0')).toBe(true);
        expect(satisfiesVersion('1.5.52', ' >=1.5.0 ')).toBe(true);
      });
    });

    describe('greater than (>)', () => {
      it('should satisfy when version is greater', () => {
        expect(satisfiesVersion('1.5.52', '>1.5.0')).toBe(true);
        expect(satisfiesVersion('1.6.0', '>1.5.0')).toBe(true);
      });

      it('should not satisfy when version is equal', () => {
        expect(satisfiesVersion('1.5.0', '>1.5.0')).toBe(false);
        expect(satisfiesVersion('1.5.52', '>1.5.52')).toBe(false);
      });

      it('should not satisfy when version is less', () => {
        expect(satisfiesVersion('1.4.99', '>1.5.0')).toBe(false);
      });
    });

    describe('less than or equal (<=)', () => {
      it('should satisfy when version is equal', () => {
        expect(satisfiesVersion('1.5.52', '<=1.5.52')).toBe(true);
      });

      it('should satisfy when version is less', () => {
        expect(satisfiesVersion('1.4.99', '<=1.5.0')).toBe(true);
        expect(satisfiesVersion('1.5.0', '<=1.5.52')).toBe(true);
      });

      it('should not satisfy when version is greater', () => {
        expect(satisfiesVersion('1.6.0', '<=1.5.0')).toBe(false);
      });
    });

    describe('less than (<)', () => {
      it('should satisfy when version is less', () => {
        expect(satisfiesVersion('1.4.99', '<1.5.0')).toBe(true);
        expect(satisfiesVersion('1.5.0', '<1.5.52')).toBe(true);
      });

      it('should not satisfy when version is equal', () => {
        expect(satisfiesVersion('1.5.0', '<1.5.0')).toBe(false);
      });

      it('should not satisfy when version is greater', () => {
        expect(satisfiesVersion('1.6.0', '<1.5.0')).toBe(false);
      });
    });

    describe('caret range (^)', () => {
      it('should satisfy when same major version and >= base version', () => {
        expect(satisfiesVersion('1.5.52', '^1.5.0')).toBe(true);
        expect(satisfiesVersion('1.6.0', '^1.5.0')).toBe(true);
        expect(satisfiesVersion('1.9.99', '^1.5.0')).toBe(true);
      });

      it('should not satisfy when major version differs', () => {
        expect(satisfiesVersion('2.0.0', '^1.5.0')).toBe(false);
        expect(satisfiesVersion('0.9.0', '^1.5.0')).toBe(false);
      });

      it('should not satisfy when version is less than base', () => {
        expect(satisfiesVersion('1.4.99', '^1.5.0')).toBe(false);
      });

      it('should handle ^0.x.x correctly', () => {
        expect(satisfiesVersion('0.5.52', '^0.5.0')).toBe(true);
        expect(satisfiesVersion('0.6.0', '^0.5.0')).toBe(false);
        expect(satisfiesVersion('1.0.0', '^0.5.0')).toBe(false);
      });
    });

    describe('tilde range (~)', () => {
      it('should satisfy when same major and minor version and >= base version', () => {
        expect(satisfiesVersion('1.5.52', '~1.5.0')).toBe(true);
        expect(satisfiesVersion('1.5.99', '~1.5.0')).toBe(true);
      });

      it('should not satisfy when minor version differs', () => {
        expect(satisfiesVersion('1.6.0', '~1.5.0')).toBe(false);
        expect(satisfiesVersion('1.4.99', '~1.5.0')).toBe(false);
      });

      it('should not satisfy when major version differs', () => {
        expect(satisfiesVersion('2.5.0', '~1.5.0')).toBe(false);
      });

      it('should not satisfy when version is less than base', () => {
        expect(satisfiesVersion('1.5.0', '~1.5.1')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle prerelease versions', () => {
        expect(satisfiesVersion('1.5.52-beta.1', '>=1.5.0')).toBe(true);
        expect(satisfiesVersion('1.5.52', '>=1.5.52-beta.1')).toBe(true);
      });

      it('should handle version 0.x.x', () => {
        expect(satisfiesVersion('0.5.0', '>=0.5.0')).toBe(true);
        expect(satisfiesVersion('0.5.1', '>=0.5.0')).toBe(true);
      });
    });
  });

  describe('checkVersionRequirement', () => {
    let consoleWarnSpy: jasmine.Spy;
    let consoleErrorSpy: jasmine.Spy;

    beforeEach(() => {
      consoleWarnSpy = spyOn(console, 'warn');
      consoleErrorSpy = spyOn(console, 'error');
    });

    it('should return true when no requirement is specified', () => {
      const result = checkVersionRequirement('1.5.52', '');
      expect(result).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return true when requirement is satisfied', () => {
      const result = checkVersionRequirement('1.5.52', '>=1.5.0');
      expect(result).toBe(true);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should return false and log warning when requirement is not satisfied', () => {
      const result = checkVersionRequirement('1.4.99', '>=1.5.0');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OSI Cards] Version warning:')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Installed version 1.4.99 does not meet minimum requirement >=1.5.0'
        )
      );
    });

    it('should use custom library name in warning', () => {
      checkVersionRequirement('1.4.99', '>=1.5.0', 'My Library');
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('[My Library]'));
    });

    it('should handle invalid version format gracefully', () => {
      const result = checkVersionRequirement('1.5.52', 'invalid-version');
      expect(result).toBe(true); // Returns true to allow initialization
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OSI Cards] Version check error:')
      );
    });

    it('should handle parse errors gracefully', () => {
      // Test with invalid version format that will trigger parse error
      const result = checkVersionRequirement('1.5.52', 'invalid-version-format');
      expect(result).toBe(true); // Returns true to allow initialization
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
