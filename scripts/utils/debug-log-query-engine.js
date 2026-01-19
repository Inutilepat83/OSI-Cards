#!/usr/bin/env node

/**
 * Debug Log Query Engine
 *
 * Core query engine for filtering, searching, and aggregating debug logs
 * from NDJSON format log files.
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse NDJSON log file into array of log entries
 * @param {string} filePath - Path to log file
 * @returns {Array<Object>} Array of parsed log entries
 */
function parseLogFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim());
  const logs = [];

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      logs.push(entry);
    } catch (error) {
      // Skip invalid JSON lines
      console.warn(`Skipping invalid log line: ${error.message}`);
    }
  }

  return logs;
}

/**
 * Check if value matches filter (string, RegExp, or function)
 * @param {any} value - Value to check
 * @param {string|RegExp|function} filter - Filter to apply
 * @returns {boolean} True if matches
 */
function matchesFilter(value, filter) {
  if (!filter) return true;
  if (!value) return false;

  if (typeof filter === 'function') {
    return filter(value);
  }

  if (filter instanceof RegExp) {
    return filter.test(String(value));
  }

  if (typeof filter === 'string') {
    return String(value).includes(filter);
  }

  return false;
}

/**
 * Check if value is in array (case-insensitive for strings)
 * @param {any} value - Value to check
 * @param {string|string[]} filter - Single value or array to match
 * @returns {boolean} True if matches
 */
function matchesArrayFilter(value, filter) {
  if (!filter) return true;
  if (!value) return false;

  const filters = Array.isArray(filter) ? filter : [filter];
  const valueStr = String(value).toLowerCase();

  return filters.some((f) => String(f).toLowerCase() === valueStr);
}

/**
 * Get nested value from object using dot notation
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path (e.g., 'data.sectionsCount')
 * @returns {any} Value at path or undefined
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Check if value matches data field filter
 * @param {any} value - Value to check
 * @param {Object} filter - Filter configuration {value, min, max, operator}
 * @returns {boolean} True if matches
 */
function matchesDataFieldFilter(value, filter) {
  if (filter === undefined || filter === null) return true;

  // Handle exact value match
  if (filter.value !== undefined) {
    return value === filter.value;
  }

  // Handle numeric range
  if (typeof value === 'number') {
    if (filter.min !== undefined && value < filter.min) return false;
    if (filter.max !== undefined && value > filter.max) return false;
    return true;
  }

  // Handle operator-based comparison
  if (filter.operator) {
    const op = filter.operator;
    const compareValue = filter.value !== undefined ? filter.value : filter.min ?? filter.max ?? 0;

    switch (op) {
      case '==':
        return value == compareValue;
      case '!=':
        return value != compareValue;
      case '>':
        return value > compareValue;
      case '>=':
        return value >= compareValue;
      case '<':
        return value < compareValue;
      case '<=':
        return value <= compareValue;
      default:
        return true;
    }
  }

  // Default: check if value exists
  return value !== undefined && value !== null;
}

/**
 * Apply filters to log entries
 * @param {Array<Object>} logs - Array of log entries
 * @param {Object} filters - Filter configuration
 * @returns {Array<Object>} Filtered log entries
 */
function filterLogs(logs, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return logs;
  }

  return logs.filter((log) => {
    // Filter by location
    if (filters.location !== undefined && !matchesFilter(log.location, filters.location)) {
      return false;
    }

    // Filter by message
    if (filters.message !== undefined && !matchesFilter(log.message, filters.message)) {
      return false;
    }

    // Filter by hypothesisId
    if (filters.hypothesisId !== undefined && !matchesArrayFilter(log.hypothesisId, filters.hypothesisId)) {
      return false;
    }

    // Filter by sessionId
    if (filters.sessionId !== undefined && !matchesArrayFilter(log.sessionId, filters.sessionId)) {
      return false;
    }

    // Filter by runId
    if (filters.runId !== undefined && !matchesArrayFilter(log.runId, filters.runId)) {
      return false;
    }

    // Filter by timestamp range
    if (filters.timestamp) {
      const ts = log.timestamp || 0;
      if (filters.timestamp.min !== undefined && ts < filters.timestamp.min) {
        return false;
      }
      if (filters.timestamp.max !== undefined && ts > filters.timestamp.max) {
        return false;
      }
    }

    // Filter by nested data fields
    if (filters.data) {
      for (const [fieldPath, fieldFilter] of Object.entries(filters.data)) {
        const fieldValue = getNestedValue(log, fieldPath);
        if (!matchesDataFieldFilter(fieldValue, fieldFilter)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Search logs by text (searches in message and stringified data)
 * @param {Array<Object>} logs - Array of log entries
 * @param {string} searchText - Text to search for
 * @returns {Array<Object>} Matching log entries
 */
function searchLogs(logs, searchText) {
  if (!searchText || !searchText.trim()) {
    return logs;
  }

  const searchLower = searchText.toLowerCase();

  return logs.filter((log) => {
    // Search in message
    if (log.message && String(log.message).toLowerCase().includes(searchLower)) {
      return true;
    }

    // Search in stringified data
    if (log.data) {
      try {
        const dataStr = JSON.stringify(log.data).toLowerCase();
        if (dataStr.includes(searchLower)) {
          return true;
        }
      } catch {
        // Skip if data cannot be stringified
      }
    }

    return false;
  });
}

/**
 * Aggregate logs by field
 * @param {Array<Object>} logs - Array of log entries
 * @param {Object} options - Aggregation options
 * @returns {Object} Aggregation results
 */
function aggregateLogs(logs, options) {
  if (!options || !options.groupBy) {
    return { groups: {}, total: logs.length };
  }

  const groups = {};
  const { groupBy, dataField } = options;

  logs.forEach((log) => {
    const groupKey = log[groupBy] || '(unknown)';
    const key = String(groupKey);

    if (!groups[key]) {
      groups[key] = {
        count: 0,
        values: [],
      };
    }

    groups[key].count++;

    // Collect values for numeric aggregation
    if (dataField) {
      const value = getNestedValue(log, dataField);
      if (typeof value === 'number') {
        groups[key].values.push(value);
      }
    }
  });

  // Calculate statistics if requested
  const result = {};
  for (const [key, group] of Object.entries(groups)) {
    result[key] = {
      count: group.count,
    };

    if (options.sum && group.values.length > 0) {
      result[key].sum = group.values.reduce((a, b) => a + b, 0);
    }

    if (options.avg && group.values.length > 0) {
      result[key].avg = group.values.reduce((a, b) => a + b, 0) / group.values.length;
    }

    if (group.values.length > 0) {
      result[key].min = Math.min(...group.values);
      result[key].max = Math.max(...group.values);
    }
  }

  return {
    groups: result,
    total: logs.length,
  };
}

/**
 * Query logs with filters, search, and aggregation
 * @param {string} filePath - Path to log file
 * @param {Object} options - Query options
 * @returns {Object} Query results
 */
function queryLogs(filePath, options = {}) {
  const startTime = Date.now();

  // Parse log file
  const allLogs = parseLogFile(filePath);
  const total = allLogs.length;

  // Apply filters
  let filteredLogs = allLogs;
  if (options.filters) {
    filteredLogs = filterLogs(filteredLogs, options.filters);
  }

  // Apply search
  if (options.search) {
    filteredLogs = searchLogs(filteredLogs, options.search);
  }

  const filtered = filteredLogs.length;

  // Apply pagination
  let resultLogs = filteredLogs;
  if (options.offset) {
    resultLogs = resultLogs.slice(options.offset);
  }
  if (options.limit) {
    resultLogs = resultLogs.slice(0, options.limit);
  }

  // Apply aggregation
  let aggregation = undefined;
  if (options.aggregate) {
    aggregation = aggregateLogs(filteredLogs, options.aggregate);
  }

  const queryTime = Date.now() - startTime;

  return {
    logs: resultLogs,
    total,
    filtered,
    aggregation,
    queryTime,
  };
}

module.exports = {
  parseLogFile,
  filterLogs,
  searchLogs,
  aggregateLogs,
  queryLogs,
  getNestedValue,
};
