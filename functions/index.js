const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');
const { pk, ck } = require('./content');


if (!admin.apps.length) {
  admin.initializeApp();
}

// Configuration (Exported for testing overrides)
exports.config = {
  BATCH_SIZE: 50,
  SCHEDULE_DELAY: 300, // 5 minutes
  CUTOFF_DAYS: 90
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

// 1. Offloading Function (Recursive Loop)
// This strictly follows the "Scan by Key" pattern.
exports.offloadOldMaps = functions.tasks.taskQueue().onDispatch(async (data) => {
  const { BATCH_SIZE, SCHEDULE_DELAY, CUTOFF_DAYS } = exports.config;
  // Calculate cutoff based on config
  const CUTOFF_TIME = Date.now() - (CUTOFF_DAYS * 24 * 60 * 60 * 1000); 
  
  console.log(`Starting offload batch (Size: ${BATCH_SIZE})...`);
  
  // 1. Get Watermark
  const watermarkRef = admin.database().ref('bookkeeping/lastProcessedMid');
  const watermarkSnap = await watermarkRef.once('value');
  const lastProcessedMid = watermarkSnap.val();

  // 2. Query Batch
  let query = admin.database().ref('maps').orderByKey().limitToFirst(BATCH_SIZE);
  if (lastProcessedMid) {
    query = query.startAfter(lastProcessedMid);
  }

  const snapshot = await query.once('value');
  const mapList = snapshot.val();
  
  if (!mapList) {
    console.log('No more maps to process. Loop finished.');
    await watermarkRef.remove();
    return;
  }

  // 3. Process Batch
  const updates = {}; // If we were doing updates, but here we do individual offloads
  const mids = Object.keys(mapList);
  let lastMid = null;
  let offloadCount = 0;

  for (const mid of mids) {
    lastMid = mid;
    const map = mapList[mid];
    
    // Check if map is "old"
    // Condition: p/m < CUTOFF OR p/m is missing
    const lastMod = (map.p && map.p[pk.lastModified]) || 0;
    
    if (lastMod < CUTOFF_TIME) {
        await offloadMap(mid, map);
        offloadCount++;
    }
  }

  console.log(`Processed ${mids.length} maps. Offloaded ${offloadCount}.`);

  // 4. Update Watermark & Schedule Next
  if (mids.length === BATCH_SIZE) {
    await watermarkRef.set(lastMid);
    // Schedule next run
    const queue = getFunctions().taskQueue('offloadOldMaps');
    await queue.enqueue({}, {
        scheduleDelaySeconds: SCHEDULE_DELAY
    });
    console.log(`Scheduled next batch starting after ${lastMid}`);
  } else {
    // End of DB
    await watermarkRef.remove();
    console.log('Scan complete. Loop finished.');
  }
});

// 2. Janitor Function (Weekly Trigger)
exports.janitor = functions.pubsub.schedule('every 168 hours').onRun(async (context) => {
  const watermarkRef = admin.database().ref('bookkeeping/lastProcessedMid');
  const snap = await watermarkRef.once('value');
  
  if (snap.exists()) {
    console.log('Offload loop already in progress. Janitor skipping.');
    return null;
  }
  
  console.log('Janitor starting new offload loop.');
  const queue = getFunctions().taskQueue('offloadOldMaps');
  await queue.enqueue({});
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
  
  // Ensure version 2.0
  // Ensure version 2.0
  
  // Write back to RTDB
  await admin.database().ref(`maps/${mid}`).set(mapData);
  
  // Delete from GCS
  await file.delete();

  console.log(`Restored map ${mid}.`);
  return { success: true };
});
