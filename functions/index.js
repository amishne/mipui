const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { pk } = require('./content');


if (!admin.apps.length) {
  admin.initializeApp();
}

// Configuration (Exported for testing overrides)
exports.config = {
  BATCH_SIZE: 10,
  SCHEDULE_DELAY: 60, // 1 minute
  CUTOFF_DAYS: 90,
  MAX_RETRIES: 3,
};

// Helper to offload a single map
async function offloadMap(mid, mapData) {
  if (!mapData) return;
  const bucket = admin.storage().bucket();
  const file = bucket.file(`maps/${mid}.mipui`);

  // Write to GCS
  await file.save(JSON.stringify(mapData), {
    contentType: 'application/json',
    metadata: {
      metadata: {
        originalLastModified: mapData.p && mapData.p[pk.lastModified]
      }
    }
  });

  // Remove from RTDB
  await admin.database().ref(`maps/${mid}`).remove();
  console.log(`Offloaded map ${mid} to Cold Storage.`);
}

// 1. Offloading Function (Scheduled + Recursive)
// Architecture: Hybrid Strategy (SDK Main Loop + REST Poison Pill)
//
// 1. Normal Operation (SDK Mode):
//    - Uses standard Firebase Admin SDK (`orderByKey`, `limitToFirst`, `startAfter`).
//    - Efficient for small batch processing (Batch Size: 10).
//    - Memory Friendly: Fetches data only for the current batch.
//
// 2. Poison Pill Handling (REST Mode):
//    - Triggered when a specific map causes repeated failures (Retry Count >= 3).
//    - Problem: Reading a massive map ("Monster Map") via SDK might cause OOM, blocking the queue forever.
//    - Solution: Switch to REST API with `shallow=true` to fetch keys *without* content.
//    - Action: Identifies the next map key and advances the watermark past the "Monster Map", effectively skipping it.
//
exports.offloadOldMaps = functions.runWith({ memory: '1GB' }).tasks.taskQueue().onDispatch(async (data) => {
  const { getAllMapKeys } = require('./utils');
  const { BATCH_SIZE, SCHEDULE_DELAY, CUTOFF_DAYS, MAX_RETRIES } = exports.config;
  const CUTOFF_TIME = Date.now() - (CUTOFF_DAYS * 24 * 60 * 60 * 1000);

  // --- Step 1: State Retrieval ---
  const bookkeepingRef = admin.database().ref('bookkeeping');
  const bookkeepingSnap = await bookkeepingRef.once('value');
  const lastProcessedMid = bookkeepingSnap.child('lastProcessedMid').val();
  const retryCount = bookkeepingSnap.child('retryCount').val() || 0;

  // --- Step 2: Adaptive Batch Sizing ---
  // If we had a failure (Retry > 0), reduce batch size to 1 to isolate the problematic map.
  let currentBatchSize = (retryCount > 0) ? 1 : BATCH_SIZE;

  // --- Step 3: Poison Pill Strategy (Hybrid Switch) ---
  if (retryCount >= MAX_RETRIES) {
    console.warn(`[WARN] Poison Pill detected! Stuck after ${lastProcessedMid} for ${retryCount} attempts.`);
    console.warn(`[WARN] Switching to REST API (Key Scan) to skip the stuck map without reading content.`);

    try {
        // Fetch ALL keys (lightweight metadata only)
        const allKeys = await getAllMapKeys();
        
        let nextMid = null;
        if (!lastProcessedMid) {
            if (allKeys.length > 0) nextMid = allKeys[0];
        } else {
            // Find the first key strictly greater than current watermark
            nextMid = allKeys.find(k => k > lastProcessedMid);
        }

        if (!nextMid) {
             console.warn(`[WARN] No next map found via Key Scan. End of DB? Resetting.`);
             await bookkeepingRef.update({ lastProcessedMid: null, retryCount: 0 });
             return;
        }

        console.warn(`[WARN] Identified skipped map: ${nextMid}. Moving watermark forward.`);
        
        // Skip the problematic map by setting watermark to it (next run starts AFTER it)
        await bookkeepingRef.update({
             lastProcessedMid: nextMid,
             retryCount: 0
        });

        // Schedule next run immediately
        const queue = getFunctions().taskQueue('offloadOldMaps');
        await queue.enqueue({}, { scheduleDelaySeconds: SCHEDULE_DELAY });
        return;

    } catch (e) {
        console.error(`[ERROR] Failed to execute Poison Pill via REST API:`, e);
        return; // Will retry via standard Task Queue backoff
    }
  }

  // --- Step 4: Normal SDK Operation ---
  // Commit to this attempt
  await bookkeepingRef.update({ retryCount: retryCount + 1 });

  // Query Batch
  // We fetch (Batch + 1) to handle inclusive startAfter or just to ensure we have a "next" item? 
  // Actually, standard pattern is limitToFirst(N).
  // But strictly, if we use startAfter, we get N items after.
  // We use `currentBatchSize + 1` logic only if we need to peek ahead, but here we iterate `mapList`.
  
  const fetchSize = lastProcessedMid ? currentBatchSize + 1 : currentBatchSize;
  console.log(`[DEBUG] Querying batch: size=${fetchSize}, startAfter=${lastProcessedMid}`);

  let query = admin.database().ref('maps').orderByKey().limitToFirst(fetchSize);
  if (lastProcessedMid) {
    query = query.startAfter(lastProcessedMid);
  }

  const snapshot = await query.once('value');
  const mapList = snapshot.val();
  const resultCount = mapList ? Object.keys(mapList).length : 0;

  if (!mapList) {
    console.log('No maps found. Loop finished.');
    await bookkeepingRef.update({ lastProcessedMid: null, retryCount: 0 });
    return;
  }

  // --- Step 5: Process Batch ---
  const mids = Object.keys(mapList);
  let lastMid = null;
  let processedCount = 0;
  let offloadCount = 0;

  for (const mid of mids) {
    // startAfter is inclusive? No, SDK `startAfter` is exclusive if string? 
    // Wait, `startAfter` in firebase nodejs SDK:
    // "The starting point is exclusive." -> Actually, it depends on version.
    // Documentation says `startAt` is inclusive. `startAfter` is exclusive.
    // Let's assume exclusive.
    // However, in previous tests I saw it might be safer to filter just in case.
    if (mid === lastProcessedMid) continue;
    
    if (processedCount >= currentBatchSize) break;

    lastMid = mid;
    processedCount++;

    const map = mapList[mid];
    const lastMod = (map.p && map.p[pk.lastModified]) || 0;

    /**
     * OFFLOAD CRITERIA:
     * - Map is older than CUTOFF_DAYS (90 days).
     */
    if (lastMod < CUTOFF_TIME) {
      await offloadMap(mid, map);
      offloadCount++;
    }
  }

  console.log(`Processed ${processedCount}. Offloaded ${offloadCount}. Last Mid: ${lastMid}`);

  // --- Step 6: Loop Continuation ---
  // If we processed items, advance watermark.
  let loopContinues = (resultCount >= fetchSize);
  
  if (processedCount > 0) {
     await bookkeepingRef.update({
        lastProcessedMid: lastMid,
        retryCount: 0 // Reset on success
     });
     loopContinues = true;
  } else {
     // If we fetched items but processed 0 (e.g. only watermark returned), loop ends.
     loopContinues = false; 
  }

  if (loopContinues) {
      const queue = getFunctions().taskQueue('offloadOldMaps');
      await queue.enqueue({}, { scheduleDelaySeconds: SCHEDULE_DELAY });
  } else {
      await bookkeepingRef.remove();
      console.log('Scan complete. Watermark cleared.');
  }
});

// 2. Janitor Function (Daily Trigger)
exports.janitor = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
  const bookkeepingRef = admin.database().ref('bookkeeping');
  const snap = await bookkeepingRef.once('value');
  const lastProcessedMid = snap.child('lastProcessedMid').val();
  const janitorLastSeenWatermark = snap.child('janitorLastSeenWatermark').val();

  if (!lastProcessedMid) {
    console.log('Janitor: No offload loop in progress. Starting new loop.');
    const queue = getFunctions().taskQueue('offloadOldMaps');
    await queue.enqueue({});
    return null;
  }

  // Loop in progress. Check if stuck.
  if (lastProcessedMid === janitorLastSeenWatermark) {
    console.error(`Janitor: STUCK LOOP DETECTED! Watermark ${lastProcessedMid} has not moved in 24 hours. Restarting loop.`);
    
    // Resume/Restart logic
    // We don't delete the watermark, we just kick the queue again.
    const queue = getFunctions().taskQueue('offloadOldMaps');
    await queue.enqueue({});
    return null;
  }

  // Loop is progressing. Update "Last Seen".
  console.log(`Janitor: Loop is healthy. Watermark moved from ${janitorLastSeenWatermark} to ${lastProcessedMid}.`);
  await bookkeepingRef.update({ janitorLastSeenWatermark: lastProcessedMid });
  return null;
});

// 3. Restore Function (Callable)
exports.restoreMap = functions.https.onCall(async (data, context) => {
  const mid = data.mid;
  if (!mid) return { success: false, error: 'No MID provided' };

  const bucket = admin.storage().bucket();
  const file = bucket.file(`maps/${mid}.mipui`);
  const [exists] = await file.exists();

  if (!exists) {
    console.log(`Map ${mid} not found in cold storage.`);
    return { success: false, error: 'Map not found' };
  }

  // Read JSON
  const [content] = await file.download();
  const mapData = JSON.parse(content.toString());

  // Update Metadata
  if (!mapData.p) mapData.p = {};
  mapData.p[pk.lastModified] = admin.database.ServerValue.TIMESTAMP;

  // Write back to RTDB
  await admin.database().ref(`maps/${mid}`).set(mapData);

  // Delete from GCS
  await file.delete();

  console.log(`Restored map ${mid}.`);
  return { success: true };
});
