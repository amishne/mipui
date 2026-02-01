const admin = require('firebase-admin');
const assert = require('chai').assert;

// Set GOOGLE_APPLICATION_CREDENTIALS to default or require user to provide auth
// For running against 'mipui-test', we need credentials.
// Assuming the environment where verification runs has access (e.g. CI or local user login).
// We use 'firebase-functions-test' in "Online" mode.

// We need project config.
// .firebaserc says "test": "mipui-test"
// The CLI sets FIREBASE_DATABASE_EMULATOR_HOST which admin SDK picks up.
const projectConfig = {
  projectId: 'mipui-test',
  databaseURL: 'http://127.0.0.1:9000?ns=mipui-test', // Emulator URL
  storageBucket: 'test.appspot.com', 
};

// If we don't have a key file, we rely on Google Application Default Credentials.
// const test = require('firebase-functions-test')(projectConfig, './path/to/key.json');
// Without key, it tries to use local creds.
const test = require('firebase-functions-test')(projectConfig);

describe('Integration Tests (mipui-test)', () => {
  let myFunctions;

  before(() => {
    // Initialize the app for integration testing
    // If running sequentially, admin might be shared?
    // Safer to check if apps.length
    if (!admin.apps.length) {
      admin.initializeApp(projectConfig); // Use config from file or defaults
    }
    
    // Require the functions
    myFunctions = require('../index');
  });

  after(() => {
    test.cleanup();
  });

  it('should offload and restore a real map', async () => {
    const mid = 'integration_test_map_' + Date.now();
    const oldTime = Date.now() - (100 * 24 * 60 * 60 * 1000);

    // 1. Seed Real Data
    const mapData = {
      payload: { fullMap: { integration: true } },
      p: { m: oldTime }
    };
    await admin.database().ref(`maps/${mid}`).set(mapData);

    // 2. Trigger Offload
    // offloadOldMaps is task queue. We can invoke the wrapped function logic directly.
    // But checking if it hits the REAL database.
    // The function implementation uses `admin.database()`.
    // Since we required index.js without stubs, it uses the real admin.
    const wrappedOffload = test.wrap(myFunctions.offloadOldMaps);
    await wrappedOffload({});

    // 3. Verify Offload
    // Check RTDB - should be gone (or just stub replaced?)
    const snap = await admin.database().ref(`maps/${mid}`).once('value');
    assert.isNull(snap.val(), 'Map should be removed from RTDB');

    // Check Storage
    const file = admin.storage().bucket().file(`maps/${mid}.mipui`);
    const [exists] = await file.exists();
    assert.isTrue(exists, 'File should exist in Storage');

    // 4. Trigger Restore
    const wrappedRestore = test.wrap(myFunctions.restoreMap);
    const result = await wrappedRestore({ mid });
    assert.deepEqual(result, { success: true });

    // 5. Verify Restore
    const restoredSnap = await admin.database().ref(`maps/${mid}`).once('value');
    const restoredVal = restoredSnap.val();
    assert.isNotNull(restoredVal, 'Map should be back in RTDB');
    assert.equal(restoredVal.payload.fullMap.integration, true);
    // Timestamp should be updated
    assert.isAbove(restoredVal.p.m, oldTime);

    // 6. Cleanup
    await admin.database().ref(`maps/${mid}`).remove();
    // File should be deleted by restore
    const [existsAfter] = await file.exists();
    assert.isFalse(existsAfter, 'File should be deleted from Storage');
  }).timeout(10000); // 10s timeout for network

  it('should process a batch of 11 maps correctly (Batch Size 5)', async () => {
    // Override Config for Test
    myFunctions.config.BATCH_SIZE = 5;
    myFunctions.config.SCHEDULE_DELAY = 1; // 1 second

    // 1. Seed 11 maps (batch size 5, so 3 loops: 5, 5, 1)
    const baseMid = 'batch_map_';
    const updates = {};
    const oldTime = Date.now() - (91 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 11; i++) {
      // Zero-pad for correct string sorting order (batch_map_00 to batch_map_10)
      const mid = baseMid + String(i).padStart(2, '0');
      updates[`maps/${mid}`] = {
        payload: { test: true },
        p: { m: oldTime }
      };
    }
    await admin.database().ref().update(updates);
    
    // Clear any existing watermark
    await admin.database().ref('bookkeeping/lastProcessedMid').remove();
    
    // 2. Mock Task Queue -> Wait for Real Scheduler
    // We expect the first run to handle 5, then schedule 5 more, then 1, then finish.
    // Total wait time should cover these gaps.
    
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const wrappedOffload = test.wrap(myFunctions.offloadOldMaps);

    // Initial Trigger (Test Process)
    // This will process 5 maps and enqueue the next run to the Emulator
    await wrappedOffload({});

    // Poll for completion
    // We expect it to finish in ~3-5 seconds (1s delay per batch)
    let loopCount = 0;
    let completed = false;
    
    const startTime = Date.now();
    while (loopCount < 20) {
      await sleep(1000); // Check every second
      loopCount++;

      const watermarkSnap = await admin.database().ref('bookkeeping/lastProcessedMid').once('value');
      
      // Also check if maps are effectively gone to confirm progress
      const remainingSnap = await admin.database().ref('maps').orderByKey().startAt('batch_map_00').endAt('batch_map_10').limitToFirst(1).once('value');
      
      console.log(`[Poll ${loopCount}] Watermark: ${watermarkSnap.val()}, Remaining: ${remainingSnap.exists()}`);

      if (!watermarkSnap.exists() && !remainingSnap.exists()) {
          completed = true;
          break;
      }
      
      if (Date.now() - startTime > 15000) break; // Timeout
    }

    assert.isTrue(completed, 'Processing did not complete via scheduler within timeout');
    
    // 3. Verify
    const mapsSnap = await admin.database().ref('maps').orderByKey().startAt('batch_map_00').endAt('batch_map_10').once('value');
    assert.isNull(mapsSnap.val(), 'All batch maps should be offloaded');
    
    // Verify watermark cleared
    const watermarkRef = await admin.database().ref('bookkeeping/lastProcessedMid').once('value');
    assert.isNull(watermarkRef.val(), 'Watermark should be cleared');
  }).timeout(30000); // 30s timeout

  it('should skip poison pill using REST Key Scan (Integration)', async () => {
    // Override Config
    myFunctions.config.BATCH_SIZE = 2;

    // 1. Seed Data: 3 "bad" maps.
    // We want to simulate being stuck on 'bad_A'.
    // The previous run processed something before 'bad_A'.
    // Let's say lastProcessedMid was 'bad_A_prev'.
    // And we have tried to process 'bad_A' 3 times.
    
    // We need 'bad_A' to exist in DB.
    // And 'bad_B' to be next.
    
    const updates = {
        'maps/bad_A': { p: { m: 100 }, data: 'Start of badness' },
        'maps/bad_B': { p: { m: 100 }, data: 'Next one' },
        'maps/bad_C': { p: { m: 100 } }
    };
    await admin.database().ref().update(updates);

    // 2. Set State: Retry Count 3 (Threshold), Watermark 'bad_A_prev'
    // Watermark 'bad_A_prev' means next query starts after 'bad_A_prev'.
    // If we assume 'bad_A' is the first key alphabetically after 'bad_A_prev'.
    // Let's use simple keys.
    await admin.database().ref('maps/bad_0_prev').set({ p: { m: 100 } });
    
    await admin.database().ref('bookkeeping').set({
        lastProcessedMid: 'bad_0_prev',
        retryCount: 3
    });

    // 3. Trigger Offload
    // This should trigger the POISON PILL logic.
    // It calls getAllMapKeys() via REST.
    // It finds keys: ['bad_0_prev', 'bad_A', 'bad_B', 'bad_C', ...]
    // It searches for key > 'bad_0_prev' -> 'bad_A'.
    // It updates watermark to 'bad_A' (skipping it).
    // And resets retry count.
    
    const wrappedOffload = test.wrap(myFunctions.offloadOldMaps);
    await wrappedOffload({});

    // 4. Verify
    // 'bad_A' should still be in DB (we skipped reading/processing it)
    const badASnap = await admin.database().ref('maps/bad_A').once('value');
    assert.isNotNull(badASnap.val(), 'Poison/Skipped map should still be in DB');
    
    // Watermark should be advanced to 'bad_A'
    const bookkeepingSnap = await admin.database().ref('bookkeeping').once('value');
    const val = bookkeepingSnap.val();
    
    assert.equal(val.lastProcessedMid, 'bad_A', 'Watermark should be advanced to the skipped map');
    assert.equal(val.retryCount, 0, 'Retry count should be reset');
  });
});
