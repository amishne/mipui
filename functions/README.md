# Mipui Cold Storage Cloud Functions

## Overview
This system implements "Cold Storage" for the Mipui mapping application. It automatically offloads inactive maps from the expensive Realtime Database (RTDB) to cost-effective Google Cloud Storage (GCS) and allows users to restore them seamlessly on demand.

## Architecture

*   **Source**: Firebase Realtime Database (`maps/`)
  *   **Predeploy Hook**: `firebase.json` is configured to copy `../public/app/content.js` to `functions/content.js` before deployment. This ensures code sharing without repo duplication.
*   **Metadata**: `bookkeeping/lastProcessedMid` (Watermark for batch processing)

## Functions

### 1. `offloadOldMaps` (Task Queue)
*   **Trigger**: Cloud Tasks (Recursive)
*   **Logic**:
    *   Scans `maps` in batches of 500 (configurable).
    *   Checks `lastModified` timestamp.
    *   If map is older than 90 days, moves it to GCS and deletes from RTDB.
    *   If more maps exist, schedules the next batch execution.

### 2. `janitor` (Scheduled)
*   **Trigger**: Pub/Sub (Weekly)
*   **Logic**:
    *   Checks if an offload loop is already running (via watermark).
    *   If not, starts a new `offloadOldMaps` cycle.

### 3. `restoreMap` (Callable)
*   **Trigger**: Client-side (HTTPS Callable)
*   **Logic**:
    *   Called when a user attempts to load a missing map.
    *   Retrieves the map file from GCS.
    *   Updates `lastModified` to current time.
    *   Writes back to RTDB.

## Deployment

**Safety First**: Ensure you are targeting the correct project environment (`dev`, `test`, or `prod`).

1.  **Check Active Project**:
    ```bash
    firebase use
    ```
2.  **Switch Environment**:
    ```bash
    firebase use dev  # or default (prod)
    ```
3.  **Deploy Functions**:
    ```bash
    firebase deploy --only functions
    ```

## Testing

### Unit Tests
Run locally using `firebase-functions-test`:
```bash
npm test
```

### Integration Tests
Run against the Firebase Emulator Suite (Java 21+ required):
```bash
npm run test:integration
```
Note: Ensure `JAVA_HOME` is set if Java is not in your global PATH.

### Troubleshooting Tests

If `npm run test:integration` fails to start the emulators:

1.  **Java Version**: The Firebase Emulator Suite requires **Java 21 or higher**.
    *   Verify with `java -version`.
2.  **Environment Variables**:
    *   Ensure `JAVA_HOME` points to your JDK installation (e.g., `C:\Program Files\Java\jdk-21...`).
    *   Ensure `%JAVA_HOME%\bin` is in your system `PATH`.
    *   *PowerShell Example*:
        ```powershell
        $env:JAVA_HOME="C:\Path\To\Jdk"; $env:PATH="$env:JAVA_HOME\bin;$env:PATH"; npm run test:integration
        ```
3.  **Port Conflicts**:
    *   If you see "Port 9000 is not open" or "Address already in use", a zombie Java process might be holding the port.
    *   **Fix**: Find and kill the process.
        ```powershell
        netstat -ano | findstr :9000
        taskkill /F /PID <PID>
        ```

### Log Retention (Cost Saving)
Since `janitor` runs frequently, logs can accumulate. To save costs, set the retention of your default log bucket to 1 day:
```bash
gcloud logging buckets update _Default --location=global --retention-days=1 --project=mipui-dev
```
