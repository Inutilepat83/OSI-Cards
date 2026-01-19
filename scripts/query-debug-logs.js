#!/usr/bin/env node

/**
 * Query Debug Logs CLI Utility
 *
 * Command-line utility for querying and filtering debug logs from .cursor/debug.log
 *
 * Usage:
 *   node scripts/query-debug-logs.js --hypothesisId STREAM_START
 *   node scripts/query-debug-logs.js --location "streaming.service.ts" --format table
 *   node scripts/query-debug-logs.js --data.sectionsCount "> 0" --aggregate location
 *   node scripts/query-debug-logs.js --search "card update" --limit 50
 */

const path = require('path');
const { queryLogs } = require('./utils/debug-log-query-engine');

const LOG_FILE = path.join(__dirname, '..', '.cursor', 'debug.log');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    filters: {},
    search: undefined,
    aggregate: undefined,
    limit: undefined,
    offset: undefined,
    format: 'json', // json, table, summary
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === '--hypothesisId' && nextArg) {
      options.filters.hypothesisId = nextArg;
      i += 2;
    } else if (arg === '--sessionId' && nextArg) {
      options.filters.sessionId = nextArg;
      i += 2;
    } else if (arg === '--runId' && nextArg) {
      options.filters.runId = nextArg;
      i += 2;
    } else if (arg === '--location' && nextArg) {
      options.filters.location = nextArg;
      i += 2;
    } else if (arg === '--message' && nextArg) {
      options.filters.message = nextArg;
      i += 2;
    } else if (arg === '--timestampMin' && nextArg) {
      if (!options.filters.timestamp) options.filters.timestamp = {};
      options.filters.timestamp.min = parseInt(nextArg);
      i += 2;
    } else if (arg === '--timestampMax' && nextArg) {
      if (!options.filters.timestamp) options.filters.timestamp = {};
      options.filters.timestamp.max = parseInt(nextArg);
      i += 2;
    } else if (arg.startsWith('--data.') && nextArg) {
      const fieldPath = arg.substring(7); // Remove '--data.' prefix
      if (!options.filters.data) options.filters.data = {};

      // Parse comparison operators (>, <, >=, <=, ==, !=)
      const operatorMatch = nextArg.match(/^\s*(>=|<=|==|!=|>|<)\s*(\d+\.?\d*)$/);
      if (operatorMatch) {
        const [, operator, value] = operatorMatch;
        options.filters.data[fieldPath] = {
          operator,
          value: parseFloat(value),
        };
      } else {
        // Simple value or range
        const rangeMatch = nextArg.match(/^(\d+\.?\d*)\s*-\s*(\d+\.?\d*)$/);
        if (rangeMatch) {
          const [, min, max] = rangeMatch;
          options.filters.data[fieldPath] = {
            min: parseFloat(min),
            max: parseFloat(max),
          };
        } else {
          const numValue = parseFloat(nextArg);
          options.filters.data[fieldPath] = isNaN(numValue) ? { value: nextArg } : { value: numValue };
        }
      }
      i += 2;
    } else if (arg === '--search' && nextArg) {
      options.search = nextArg;
      i += 2;
    } else if (arg === '--aggregate' && nextArg) {
      options.aggregate = {
        groupBy: nextArg,
        count: true,
      };
      i += 2;
    } else if (arg === '--aggregateSum' && nextArg === 'true') {
      if (options.aggregate) options.aggregate.sum = true;
      i += 2;
    } else if (arg === '--aggregateAvg' && nextArg === 'true') {
      if (options.aggregate) options.aggregate.avg = true;
      i += 2;
    } else if (arg === '--aggregateDataField' && nextArg) {
      if (options.aggregate) options.aggregate.dataField = nextArg;
      i += 2;
    } else if (arg === '--limit' && nextArg) {
      options.limit = parseInt(nextArg);
      i += 2;
    } else if (arg === '--offset' && nextArg) {
      options.offset = parseInt(nextArg);
      i += 2;
    } else if (arg === '--format' && nextArg) {
      options.format = nextArg;
      i += 2;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      console.warn(`Unknown argument: ${arg}`);
      i++;
    }
  }

  // Clean up empty filters
  if (Object.keys(options.filters).length === 0) {
    options.filters = undefined;
  }
  if (options.filters && Object.keys(options.filters).length === 0) {
    options.filters = undefined;
  }

  return options;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Query Debug Logs CLI Utility

Usage:
  node scripts/query-debug-logs.js [options]

Options:
  --hypothesisId <id>          Filter by hypothesis ID
  --sessionId <id>             Filter by session ID
  --runId <id>                 Filter by run ID
  --location <pattern>         Filter by location (substring match)
  --message <pattern>          Filter by message (substring match)
  --timestampMin <ms>          Minimum timestamp (milliseconds)
  --timestampMax <ms>          Maximum timestamp (milliseconds)
  --data.<field> <value>       Filter by data field (e.g., --data.sectionsCount "> 0")
                               Supports: >, <, >=, <=, ==, !=, or range (e.g., "1-10")
  --search <text>              Text search in message and data
  --aggregate <field>          Aggregate by field (location, hypothesisId, sessionId, runId, message)
  --aggregateSum true          Include sum in aggregation (requires --aggregateDataField)
  --aggregateAvg true          Include average in aggregation (requires --aggregateDataField)
  --aggregateDataField <path>  Data field for numeric aggregation (e.g., data.sectionsCount)
  --limit <number>             Maximum number of results
  --offset <number>            Number of results to skip
  --format <format>            Output format: json (default), table, summary
  --help, -h                   Show this help message

Examples:
  # Filter by hypothesis ID
  node scripts/query-debug-logs.js --hypothesisId STREAM_START

  # Filter by location and format as table
  node scripts/query-debug-logs.js --location "streaming.service.ts" --format table

  # Filter by data field with comparison
  node scripts/query-debug-logs.js --data.sectionsCount "> 0" --format table

  # Aggregate by location
  node scripts/query-debug-logs.js --aggregate location --format summary

  # Text search
  node scripts/query-debug-logs.js --search "card update" --limit 50

  # Complex query
  node scripts/query-debug-logs.js --hypothesisId STREAM_SECTION --data.sectionsCount ">= 1" --aggregate location
`);
}

/**
 * Format results as table
 */
function formatAsTable(result) {
  if (result.logs.length === 0) {
    console.log('No logs found.');
    return;
  }

  // Determine column widths
  const maxLocation = Math.max(30, ...result.logs.map((log) => (log.location || '').length));
  const maxMessage = Math.max(40, ...result.logs.map((log) => (log.message || '').substring(0, 60).length));

  // Header
  console.log('─'.repeat(maxLocation + maxMessage + 50));
  console.log(
    `Location`.padEnd(maxLocation) +
      ` | Message`.padEnd(maxMessage) +
      ` | HypothesisId`.padEnd(15) +
      ` | Timestamp`
  );
  console.log('─'.repeat(maxLocation + maxMessage + 50));

  // Rows
  result.logs.forEach((log) => {
    const location = (log.location || '').substring(0, maxLocation);
    const message = (log.message || '').substring(0, maxMessage);
    const hypothesisId = (log.hypothesisId || '').substring(0, 15);
    const timestamp = new Date(log.timestamp || 0).toISOString().substring(11, 23);

    console.log(
      location.padEnd(maxLocation) +
        ` | ${message}`.padEnd(maxMessage) +
        ` | ${hypothesisId}`.padEnd(15) +
        ` | ${timestamp}`
    );
  });

  console.log('─'.repeat(maxLocation + maxMessage + 50));
  console.log(`Total: ${result.total}, Filtered: ${result.filtered}, Query time: ${result.queryTime}ms`);
}

/**
 * Format results as summary
 */
function formatAsSummary(result) {
  console.log(`Total logs: ${result.total}`);
  console.log(`Filtered logs: ${result.filtered}`);
  console.log(`Query time: ${result.queryTime}ms`);

  if (result.aggregation) {
    console.log('\nAggregation:');
    const entries = Object.entries(result.aggregation.groups).sort((a, b) => b[1].count - a[1].count);
    entries.forEach(([key, value]) => {
      let line = `  ${key}: ${value.count}`;
      if (value.sum !== undefined) line += ` (sum: ${value.sum})`;
      if (value.avg !== undefined) line += ` (avg: ${value.avg.toFixed(2)})`;
      if (value.min !== undefined) line += ` (min: ${value.min}, max: ${value.max})`;
      console.log(line);
    });
  }

  if (result.logs.length > 0 && result.logs.length <= 10) {
    console.log('\nSample logs:');
    result.logs.forEach((log, index) => {
      console.log(`  ${index + 1}. [${log.location}] ${log.message}`);
    });
  }
}

/**
 * Main function
 */
function main() {
  const options = parseArgs();

  try {
    const result = queryLogs(LOG_FILE, options);

    // Output based on format
    switch (options.format) {
      case 'table':
        formatAsTable(result);
        break;
      case 'summary':
        formatAsSummary(result);
        break;
      case 'json':
      default:
        console.log(JSON.stringify(result, null, 2));
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error querying logs:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { parseArgs, formatAsTable, formatAsSummary };
