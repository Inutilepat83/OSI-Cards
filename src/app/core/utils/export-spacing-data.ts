/**
 * Export spacing debug data to a downloadable file
 */

export function exportSpacingData(): void {
  try {
    const summary = localStorage.getItem('spacing-debug-summary');
    if (summary) {
      const data = JSON.parse(summary);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spacing-debug-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('[Spacing Debug] Data exported to file');
    } else {
      console.warn('[Spacing Debug] No data found in localStorage');
    }
  } catch (e) {
    console.error('[Spacing Debug] Failed to export data:', e);
  }
}

// Make it available globally for easy access
if (typeof window !== 'undefined') {
  (window as any).exportSpacingData = exportSpacingData;
}
