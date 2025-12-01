/**
 * Contract Testing Utilities (Point 21)
 * 
 * Provides utilities for testing the public API contract to ensure
 * backward compatibility across versions.
 * 
 * @example
 * ```typescript
 * import { 
 *   verifyPublicAPI,
 *   captureAPISnapshot,
 *   compareAPISnapshots
 * } from 'osi-cards-lib/testing';
 * 
 * describe('Public API Contract', () => {
 *   it('should maintain backward compatibility', () => {
 *     const snapshot = captureAPISnapshot();
 *     expect(verifyPublicAPI(snapshot, baseline)).toHaveNoBreakingChanges();
 *   });
 * });
 * ```
 */

/**
 * Export signature for contract testing
 */
export interface ExportSignature {
  name: string;
  type: 'function' | 'class' | 'const' | 'type' | 'interface' | 'enum' | 'unknown';
  isDefault?: boolean;
}

/**
 * API snapshot for comparison
 */
export interface APISnapshot {
  version: string;
  timestamp: string;
  exports: ExportSignature[];
  dependencies: Record<string, string>;
}

/**
 * Breaking change detection result
 */
export interface BreakingChangeResult {
  hasBreakingChanges: boolean;
  removedExports: string[];
  typeChanges: Array<{
    name: string;
    oldType: string;
    newType: string;
  }>;
  addedExports: string[];
}

/**
 * Expected exports from OSI Cards library
 * This list should be maintained with each release
 */
export const EXPECTED_PUBLIC_EXPORTS: ExportSignature[] = [
  // Core Components
  { name: 'AICardRendererComponent', type: 'class' },
  { name: 'OSICardsComponent', type: 'class' },
  { name: 'SectionRendererComponent', type: 'class' },
  { name: 'MasonryGridComponent', type: 'class' },
  { name: 'CardSkeletonComponent', type: 'class' },
  { name: 'CardPreviewComponent', type: 'class' },
  { name: 'ErrorBoundaryComponent', type: 'class' },
  
  // Section Components
  { name: 'InfoSectionComponent', type: 'class' },
  { name: 'AnalyticsSectionComponent', type: 'class' },
  { name: 'ContactCardSectionComponent', type: 'class' },
  { name: 'ListSectionComponent', type: 'class' },
  { name: 'NewsSectionComponent', type: 'class' },
  { name: 'ChartSectionComponent', type: 'class' },
  { name: 'EventSectionComponent', type: 'class' },
  { name: 'MapSectionComponent', type: 'class' },
  
  // Services
  { name: 'OSICardsStreamingService', type: 'class' },
  { name: 'ThemeService', type: 'class' },
  { name: 'CardFacadeService', type: 'class' },
  { name: 'SectionUtilsService', type: 'class' },
  
  // Providers
  { name: 'provideOsiCards', type: 'function' },
  { name: 'provideOSICardsTheme', type: 'function' },
  
  // Models/Types
  { name: 'AICardConfig', type: 'interface' },
  { name: 'CardSection', type: 'interface' },
  { name: 'CardField', type: 'interface' },
  { name: 'CardItem', type: 'interface' },
  { name: 'CardAction', type: 'interface' },
  { name: 'SectionType', type: 'type' },
  
  // Utilities
  { name: 'CardFactory', type: 'class' },
  { name: 'createStreamingSimulator', type: 'function' },
  
  // Registry
  { name: 'getFixture', type: 'function' },
  { name: 'SECTION_FIXTURES', type: 'const' },
  { name: 'COMPLETE_FIXTURES', type: 'const' },
  
  // Patterns
  { name: 'CircuitBreaker', type: 'class' },
  { name: 'createRepository', type: 'function' },
  { name: 'createEventChannel', type: 'function' },
  { name: 'ok', type: 'function' },
  { name: 'err', type: 'function' },
];

/**
 * Capture current API snapshot
 * Note: This is a simplified version - in production, use TypeScript compiler API
 */
export function captureAPISnapshot(
  exports: ExportSignature[] = EXPECTED_PUBLIC_EXPORTS,
  version: string = '1.0.0'
): APISnapshot {
  return {
    version,
    timestamp: new Date().toISOString(),
    exports,
    dependencies: {
      '@angular/core': '^18.0.0',
      '@angular/common': '^18.0.0',
      'rxjs': '^7.8.0'
    }
  };
}

/**
 * Compare two API snapshots
 */
export function compareAPISnapshots(
  baseline: APISnapshot,
  current: APISnapshot
): BreakingChangeResult {
  const baselineNames = new Set(baseline.exports.map(e => e.name));
  const currentNames = new Set(current.exports.map(e => e.name));
  
  // Find removed exports (breaking change)
  const removedExports = baseline.exports
    .filter(e => !currentNames.has(e.name))
    .map(e => e.name);
  
  // Find added exports (non-breaking)
  const addedExports = current.exports
    .filter(e => !baselineNames.has(e.name))
    .map(e => e.name);
  
  // Find type changes (potentially breaking)
  const typeChanges: BreakingChangeResult['typeChanges'] = [];
  for (const baseExport of baseline.exports) {
    const currentExport = current.exports.find(e => e.name === baseExport.name);
    if (currentExport && currentExport.type !== baseExport.type) {
      typeChanges.push({
        name: baseExport.name,
        oldType: baseExport.type,
        newType: currentExport.type
      });
    }
  }
  
  return {
    hasBreakingChanges: removedExports.length > 0 || typeChanges.length > 0,
    removedExports,
    typeChanges,
    addedExports
  };
}

/**
 * Verify public API against expected exports
 */
export function verifyPublicAPI(
  actualExports: string[],
  expectedExports: ExportSignature[] = EXPECTED_PUBLIC_EXPORTS
): {
  missing: string[];
  unexpected: string[];
  valid: boolean;
} {
  const expectedNames = new Set(expectedExports.map(e => e.name));
  const actualNames = new Set(actualExports);
  
  const missing = expectedExports
    .filter(e => !actualNames.has(e.name))
    .map(e => e.name);
    
  const unexpected = actualExports
    .filter(name => !expectedNames.has(name));
  
  return {
    missing,
    unexpected,
    valid: missing.length === 0
  };
}

/**
 * Generate contract test file
 */
export function generateContractTests(
  exports: ExportSignature[] = EXPECTED_PUBLIC_EXPORTS
): string {
  const imports = exports.map(e => e.name).join(',\n  ');
  
  return `/**
 * AUTO-GENERATED CONTRACT TESTS
 * Verifies that all expected exports are available
 * Run: npm run test:contract
 */

import {
  ${imports}
} from 'osi-cards-lib';

describe('OSI Cards Public API Contract', () => {
  ${exports.map(e => `
  it('should export ${e.name} as ${e.type}', () => {
    expect(${e.name}).toBeDefined();
  });
`).join('')}
});
`;
}

/**
 * Create contract test matcher
 */
export function createContractMatcher() {
  return {
    toHaveNoBreakingChanges(received: BreakingChangeResult) {
      const pass = !received.hasBreakingChanges;
      
      if (pass) {
        return {
          pass: true,
          message: () => 'Expected breaking changes but found none'
        };
      } else {
        const messages: string[] = [];
        
        if (received.removedExports.length > 0) {
          messages.push(`Removed exports: ${received.removedExports.join(', ')}`);
        }
        
        if (received.typeChanges.length > 0) {
          const changes = received.typeChanges
            .map(c => `${c.name}: ${c.oldType} → ${c.newType}`)
            .join(', ');
          messages.push(`Type changes: ${changes}`);
        }
        
        return {
          pass: false,
          message: () => `Breaking changes detected:\n${messages.join('\n')}`
        };
      }
    }
  };
}

