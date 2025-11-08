# Error Logging System

## Overview
The MirrorMyTV application now includes an automatic error logging system that tracks and summarizes all errors in a JSON file.

## Error Log File
- **Location**: `errors.json`
- **Format**: JSON
- **Max Entries**: 100 (automatically rotates old errors)

## What Gets Logged

### 1. FFmpeg Errors
- Window capture failures
- Encoding errors
- Process crashes
- Exit code errors

### 2. Stream Errors
- Stream start failures
- Client connection issues
- Process spawn errors

### 3. System Errors
- API failures
- File system errors

## Error Entry Structure
```json
{
  "id": "unique-uuid",
  "timestamp": "2025-01-XX...",
  "type": "Error Type",
  "details": "Detailed error message",
  "clientId": "client-uuid-or-null"
}
```

## API Endpoints

### View Errors
```bash
GET /api/errors
```

### Clear Error Log
```bash
POST /api/errors/clear
```

## Example Error Entry
```json
{
  "id": "abc123...",
  "timestamp": "2025-01-15T10:30:45.123Z",
  "type": "FFmpeg Error",
  "details": "Client: xyz789, Window: Firefox\nCan't find window 'YouTube - Mozilla Firefox', aborting.",
  "clientId": "xyz789"
}
```

## Viewing Errors

### Via Browser Console
Open browser DevTools and run:
```javascript
fetch('/api/errors')
  .then(r => r.json())
  .then(data => console.table(data.errors));
```

### Via File
Simply open `errors.json` in any text editor or JSON viewer.

### Via Terminal
```bash
# Windows PowerShell
Get-Content errors.json | ConvertFrom-Json | ConvertTo-Json

# Linux/Mac
cat errors.json | jq
```

## Benefits
- ✅ Automatic error tracking
- ✅ Persistent error history
- ✅ Easy debugging
- ✅ Client-specific error correlation
- ✅ Timestamp tracking
- ✅ Automatic cleanup (keeps last 100 errors)

## Notes
- The error log file is automatically added to `.gitignore`
- Errors are logged in real-time as they occur
- The system is non-blocking - logging failures won't crash the app

