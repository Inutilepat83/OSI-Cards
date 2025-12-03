/**
 * Backup Utilities
 *
 * Utilities for data backup and restore operations.
 *
 * @example
 * ```typescript
 * import { createBackup, restoreBackup } from '@osi-cards/utils';
 *
 * const backup = await createBackup({ users, settings });
 * await restoreBackup(backup);
 * ```
 */

export interface BackupData {
  version: string;
  timestamp: Date;
  data: any;
  checksum?: string;
}

/**
 * Create backup
 */
export async function createBackup(data: any): Promise<BackupData> {
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: new Date(),
    data,
  };

  const json = JSON.stringify(backup.data);
  backup.checksum = await simpleHash(json);

  return backup;
}

/**
 * Export backup to file
 */
export function exportBackup(backup: BackupData, filename: string): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Import backup from file
 */
export async function importBackup(file: File): Promise<BackupData> {
  const text = await file.text();
  return JSON.parse(text);
}

/**
 * Verify backup integrity
 */
export async function verifyBackup(backup: BackupData): Promise<boolean> {
  if (!backup.checksum) return true;

  const json = JSON.stringify(backup.data);
  const hash = await simpleHash(json);
  return hash === backup.checksum;
}

/**
 * Restore backup
 */
export async function restoreBackup<T = any>(backup: BackupData): Promise<T> {
  const valid = await verifyBackup(backup);

  if (!valid) {
    throw new Error('Backup integrity check failed');
  }

  return backup.data;
}

/**
 * Create auto-backup
 */
export function createAutoBackup(
  getData: () => any,
  interval: number = 60000
): () => void {
  const timer = setInterval(async () => {
    const data = getData();
    const backup = await createBackup(data);
    localStorage.setItem('auto_backup', JSON.stringify(backup));
  }, interval);

  return () => clearInterval(timer);
}

/**
 * Get auto-backup
 */
export function getAutoBackup(): BackupData | null {
  const stored = localStorage.getItem('auto_backup');
  return stored ? JSON.parse(stored) : null;
}

/**
 * Simple hash for checksum
 */
async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

