# Masonry Grid Logs

This folder contains logs from the Masonry Grid component.

## How to Enable Logging

1. **Start the log server** (in a separate terminal):
   ```bash
   npm run log:server
   # or
   node scripts/log-server.js
   ```

2. **Run your application**:
   ```bash
   npm start
   ```

3. **Logs will be automatically saved** to this folder as files named:
   - `masonry-grid-YYYY-MM-DDTHH-MM-SS.log`

## Log Format

Logs are saved as JSON Lines format (one JSON object per line):

```json
{"timestamp":"2024-01-01T12:00:00.000Z","level":"info","message":"Layout complete","data":{...},"source":"MasonryGridComponent"}
```

## Viewing Logs

You can view logs using:
- Text editor
- `cat masonry-grid-*.log`
- `tail -f masonry-grid-*.log` (for real-time viewing)

## Log Levels

- `debug`: Detailed debugging information
- `info`: General information about layout operations
- `warn`: Warnings about potential issues
- `error`: Error messages

## Notes

- Logs are automatically saved when the log server is running
- If the log server is not running, logs are still stored in browser localStorage via LoggerService
- The log server runs on `http://localhost:3001`
- Logs are appended to files, so multiple sessions will create multiple log files
