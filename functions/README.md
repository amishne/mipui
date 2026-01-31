# Mipui Cold Storage Cloud Functions

## Overview
This system implements "Cold Storage" for the Mipui mapping application. It automatically offloads inactive maps from the expensive Realtime Database (RTDB) to cost-effective Google Cloud Storage (GCS) and allows users to restore them seamlessly on demand.

## Architecture

*   **Source**: Firebase Realtime Database (`maps/`)
*   **Destination**: Google Cloud Storage (`maps/`)
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
