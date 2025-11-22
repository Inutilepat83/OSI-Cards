/**
 * Snapshot testing utilities
 * Create snapshot tests for component outputs and state
 */

/**
 * Create a snapshot of an object
 */
export function createSnapshot<T>(obj: T): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Compare snapshots
 */
export function compareSnapshots(snapshot1: string, snapshot2: string): {
  match: boolean;
  differences?: string[];
} {
  if (snapshot1 === snapshot2) {
    return { match: true };
  }

  // Simple diff (for more complex diffs, use a library like diff)
  const lines1 = snapshot1.split('\n');
  const lines2 = snapshot2.split('\n');
  const differences: string[] = [];

  const maxLength = Math.max(lines1.length, lines2.length);
  for (let i = 0; i < maxLength; i++) {
    if (lines1[i] !== lines2[i]) {
      differences.push(`Line ${i + 1}: Expected "${lines2[i] || '(missing)'}", got "${lines1[i] || '(missing)'}"`);
    }
  }

  return {
    match: false,
    differences
  };
}

/**
 * Normalize snapshot (remove non-deterministic values)
 */
export function normalizeSnapshot<T>(obj: T, keysToRemove: string[] = ['id', 'timestamp', 'createdAt', 'updatedAt']): T {
  const normalized = JSON.parse(JSON.stringify(obj));

  function removeKeys(obj: any): void {
    if (Array.isArray(obj)) {
      obj.forEach(item => removeKeys(item));
    } else if (obj && typeof obj === 'object') {
      keysToRemove.forEach(key => {
        delete obj[key];
      });
      Object.values(obj).forEach(value => {
        if (value && typeof value === 'object') {
          removeKeys(value);
        }
      });
    }
  }

  removeKeys(normalized);
  return normalized;
}


