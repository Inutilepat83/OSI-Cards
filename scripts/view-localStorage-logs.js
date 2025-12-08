#!/usr/bin/env node
/**
 * View logs from localStorage
 * Run this in browser console or use: node scripts/view-localStorage-logs.js
 */

// For browser console:
if (typeof window !== 'undefined') {
  const logs = JSON.parse(localStorage.getItem('masonry-grid-logs') || '[]');
  console.log(`Found ${logs.length} logs in localStorage:`);
  console.table(logs.slice(-20)); // Show last 20
  console.log('\nFull logs:', logs);
} else {
  console.log('Run this in browser console:');
  console.log('JSON.parse(localStorage.getItem("masonry-grid-logs") || "[]")');
}
