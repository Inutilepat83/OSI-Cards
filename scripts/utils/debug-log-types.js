/**
 * Debug Log Type Definitions
 *
 * Type definitions for debug log query system (JSDoc annotations)
 */

/**
 * @typedef {Object} DebugLogEntry
 * @property {string} location - Source location (e.g., "streaming.service.ts:start")
 * @property {string} message - Log message
 * @property {any} [data] - Additional data object
 * @property {number} timestamp - Unix timestamp in milliseconds
 * @property {string} [sessionId] - Session identifier
 * @property {string} [runId] - Run identifier
 * @property {string} [hypothesisId] - Hypothesis identifier for testing
 */

/**
 * @typedef {Object} TimestampRange
 * @property {number} [min] - Minimum timestamp (inclusive)
 * @property {number} [max] - Maximum timestamp (inclusive)
 */

/**
 * @typedef {Object} DataFieldFilter
 * @property {number} [value] - Exact value match
 * @property {number} [min] - Minimum value (inclusive)
 * @property {number} [max] - Maximum value (inclusive)
 * @property {string} [operator] - Comparison operator: '==', '!=', '>', '>=', '<', '<='
 */

/**
 * @typedef {Object<string, DataFieldFilter>} DataFilters
 * Filters for nested data fields using dot notation (e.g., "sectionsCount", "data.completedSectionsCount")
 */

/**
 * @typedef {Object} DebugLogFilters
 * @property {string|RegExp|function(string):boolean} [location] - Filter by location (string, regex, or function)
 * @property {string|RegExp|function(string):boolean} [message] - Filter by message (string, regex, or function)
 * @property {string|string[]} [hypothesisId] - Filter by hypothesis ID(s)
 * @property {string|string[]} [sessionId] - Filter by session ID(s)
 * @property {string|string[]} [runId] - Filter by run ID(s)
 * @property {TimestampRange} [timestamp] - Filter by timestamp range
 * @property {DataFilters} [data] - Filter by nested data fields
 */

/**
 * @typedef {Object} AggregationOptions
 * @property {string} groupBy - Field to group by ('location', 'hypothesisId', 'sessionId', 'runId', 'message')
 * @property {boolean} [count=true] - Include count in results
 * @property {boolean} [sum] - Include sum for numeric fields
 * @property {boolean} [avg] - Include average for numeric fields
 * @property {string} [dataField] - Numeric data field to aggregate (e.g., 'sectionsCount')
 */

/**
 * @typedef {Object} DebugLogQueryOptions
 * @property {DebugLogFilters} [filters] - Filter options
 * @property {string} [search] - Text search in message and data
 * @property {AggregationOptions} [aggregate] - Aggregation options
 * @property {number} [limit] - Maximum number of results
 * @property {number} [offset] - Number of results to skip
 */

/**
 * @typedef {Object} AggregationResult
 * @property {Object<string, number>} groups - Grouped counts/values
 * @property {number} total - Total count
 */

/**
 * @typedef {Object} DebugLogQueryResult
 * @property {DebugLogEntry[]} logs - Filtered log entries
 * @property {number} total - Total number of logs before filtering
 * @property {number} filtered - Number of logs after filtering
 * @property {AggregationResult} [aggregation] - Aggregation results (if requested)
 * @property {number} queryTime - Query execution time in milliseconds
 */

module.exports = {
  // Types are exported as JSDoc comments
};
