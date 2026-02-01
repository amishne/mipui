const test = require('firebase-functions-test')();
const assert = require('chai').assert;
const sinon = require('sinon');
const admin = require('firebase-admin');
const adminFunctions = require('firebase-admin/functions');

// Require utils to mock it
const utils = require('../utils');

describe('Cloud Functions', () => {
  let myFunctions;
  let dbRefStub;
  let storageBucketStub;
  let getAllMapKeysStub;

  // Store originals to restore later
  let originalInit;
  let originalDatabase;
  let originalStorage;

  before(async () => {
    // 1. Mock Admin
    originalInit = admin.initializeApp;
    Object.defineProperty(admin, 'initializeApp', { value: () => {}, configurable: true, writable: true });

    dbRefStub = sinon.stub();
    const dbStub = () => ({ ref: dbRefStub });
    dbStub.ServerValue = { TIMESTAMP: 'MOCK_TIMESTAMP' };
    
    const dbDescriptor = Object.getOwnPropertyDescriptor(admin, 'database');
    originalDatabase = dbDescriptor;
    Object.defineProperty(admin, 'database', { get: () => dbStub, configurable: true });

    storageBucketStub = sinon.stub();
    const storageStub = () => ({ bucket: storageBucketStub });
    
    const storageDescriptor = Object.getOwnPropertyDescriptor(admin, 'storage');
    originalStorage = storageDescriptor;
    Object.defineProperty(admin, 'storage', { get: () => storageStub, configurable: true });

    // 2. Mock getFunctions
    sinon.stub(adminFunctions, 'getFunctions').returns({
        taskQueue: sinon.stub().returns({
            enqueue: sinon.stub().resolves()
        })
    });

    // 3. Mock getAllMapKeys
    getAllMapKeysStub = sinon.stub(utils, 'getAllMapKeys');

    // 4. Require index.js
    delete require.cache[require.resolve('../index')];
    myFunctions = require('../index');
  });

  after(() => {
    if (adminFunctions.getFunctions.restore) adminFunctions.getFunctions.restore();
    if (utils.getAllMapKeys.restore) utils.getAllMapKeys.restore();
    if (originalInit) admin.initializeApp = originalInit;
    if (originalDatabase) Object.defineProperty(admin, 'database', originalDatabase);
    if (originalStorage) Object.defineProperty(admin, 'storage', originalStorage);
    test.cleanup();
  });

  afterEach(() => {
    dbRefStub.resetHistory();
    storageBucketStub.resetHistory();
    getAllMapKeysStub.reset();
  });

  describe('offloadOldMaps', () => {
    let clock;
    
    beforeEach(() => {
        clock = sinon.useFakeTimers(Date.now());
    });
    
    afterEach(() => {
        clock.restore();
    });

    it('should offload maps older than 90 days (Normal SDK Flow)', async () => {
      const now = Date.now();
      const oldTime = now - (91 * 24 * 60 * 60 * 1000); 
      
      const mapsData = {
          'oldMap': { p: { m: oldTime }, data: 'full' },
          'recentMap': { p: { m: now }, data: 'full' }
      };

      // Mock Bookkeeping: Retry=0, No Watermark
      const bookkeepingUpdateStub = sinon.stub().resolves();
      dbRefStub.withArgs('bookkeeping').returns({
         once: sinon.stub().resolves({ val: () => ({ lastProcessedMid: null, retryCount: 0 }), child: (k) => ({ val: () => (k === 'retryCount' ? 0 : null) }) }),
         update: bookkeepingUpdateStub
      });

      // Mock SDK Quer: Expect limitToFirst(10) (default batch)
      const queryChain = {
          limitToFirst: sinon.stub().returnsThis(),
          startAfter: sinon.stub().returnsThis(),
          once: sinon.stub().resolves({ val: () => mapsData })
      };
      dbRefStub.withArgs('maps').returns({ orderByKey: sinon.stub().returns(queryChain) });

      // Mock Removal & Storage
      dbRefStub.withArgs('maps/oldMap').returns({ remove: sinon.stub().resolves() });
      const fileSaveStub = sinon.stub().resolves();
      storageBucketStub.returns({ file: sinon.stub().returns({ save: fileSaveStub, delete: sinon.stub().resolves() }) });

      // Execute
      const wrapped = test.wrap(myFunctions.offloadOldMaps);
      await wrapped({});

      // Verify
      assert.isTrue(getAllMapKeysStub.notCalled, 'Should NOT use REST keys for normal flow');
      assert.isTrue(queryChain.limitToFirst.calledWith(10), 'Should use default batch size 10'); 
      assert.isTrue(fileSaveStub.calledWith(sinon.match.string), 'Should save oldMap');
      assert.equal(bookkeepingUpdateStub.lastCall.args[0].lastProcessedMid, 'recentMap');
    });

    it('should reduce batch size to 1 if retry > 0 (Intermediate Failure)', async () => {
        // Mock Retry = 1
        const bookkeepingUpdateStub = sinon.stub().resolves();
        dbRefStub.withArgs('bookkeeping').returns({
             once: sinon.stub().resolves({ val: () => ({ lastProcessedMid: 'mid_0', retryCount: 1 }), child: (k) => ({ val: () => (k === 'retryCount' ? 1 : 'mid_0') }) }),
             update: bookkeepingUpdateStub
        });

        // Mock SDK Query: limitToFirst(2) -> 1 + 1 buffer
        const mapsData = { 'mid_1': { p: { m: 0 } } };
        const queryChain = {
            limitToFirst: sinon.stub().returnsThis(),
            startAfter: sinon.stub().returnsThis(),
            once: sinon.stub().resolves({ val: () => mapsData })
        };
        dbRefStub.withArgs('maps').returns({ orderByKey: sinon.stub().returns(queryChain) });

        // MOCK REMOVE for mid_1
        dbRefStub.withArgs('maps/mid_1').returns({ 
            once: sinon.stub().resolves({ val: () => ({ p: { m: 0 } }) }), // For the check inside loop? No, loop data comes from mapsData.
            // Wait, offloadMap does a fresh fetch? No.
            remove: sinon.stub().resolves() 
        });
        
        // Wait, logic in code:
        // const map = mapList[mid]; // from batch query
        // offloadMap(mid, map);
        // Inside offloadMap: admin.database().ref(`maps/${mid}`).remove();
        // So we need dbRefStub.withArgs('maps/mid_1').returns({ remove: ... })

        // Execute
        const wrapped = test.wrap(myFunctions.offloadOldMaps);
        await wrapped({});

        // Verify
        assert.isTrue(queryChain.limitToFirst.calledWith(2), 'Should reduce batch size to 1 (fetching 1+1)');
        assert.isTrue(queryChain.startAfter.calledWith('mid_0'), 'Should start after previous watermark');
        assert.equal(bookkeepingUpdateStub.firstCall.args[0].retryCount, 2, 'Should increment retry count');
    });

    it('should skip poison pill using REST Key Scan (Hybrid Strategy)', async () => {
       // Mock Retry = 3 (Poison Pill Trigger)
       const bookkeepingUpdateStub = sinon.stub().resolves();
       dbRefStub.withArgs('bookkeeping').returns({
         once: sinon.stub().resolves({ val: () => ({ lastProcessedMid: 'map_1', retryCount: 3 }), child: (k) => ({ val: () => (k === 'retryCount' ? 3 : 'map_1') }) }),
         update: bookkeepingUpdateStub
       });

       // Mock REST Keys: Lexicographically sorted
       getAllMapKeysStub.resolves(['map_0', 'map_1', 'map_2']);

       // Execute
       const wrapped = test.wrap(myFunctions.offloadOldMaps);
       await wrapped({});

       // Verify
       assert.isTrue(getAllMapKeysStub.calledOnce, 'Should use REST keys for Poison Pill');
       assert.deepEqual(bookkeepingUpdateStub.lastCall.args[0], { 
           lastProcessedMid: 'map_2', // Should skip to map_2
           retryCount: 0 
       });
    });

    it('should handle end of database correctly', async () => {
         const bookkeepingUpdateStub = sinon.stub().resolves();
         dbRefStub.withArgs('bookkeeping').returns({
            once: sinon.stub().resolves({ val: () => ({ lastProcessedMid: 'last_mid', retryCount: 0 }), child: (k) => ({ val: () => (k === 'retryCount' ? 0 : 'last_mid') }) }),
            update: bookkeepingUpdateStub,
            remove: sinon.stub().resolves()
         });

         // Mock Empty Maps Query
         const queryChain = {
             limitToFirst: sinon.stub().returnsThis(),
             startAfter: sinon.stub().returnsThis(),
             once: sinon.stub().resolves({ val: () => null })
         };
         dbRefStub.withArgs('maps').returns({ orderByKey: sinon.stub().returns(queryChain) });
 
         // Execute
         const wrapped = test.wrap(myFunctions.offloadOldMaps);
         await wrapped({});
 
         // Verify
         // Should delete bookkeeping
         assert.isTrue(bookkeepingUpdateStub.calledWith({ lastProcessedMid: null, retryCount: 0 }), 'Should reset if empty batch returned (or actually remove if completely done?)'); 
         // Logic: if (!mapList) -> update(null, 0).
         // Logic: if check loopContinues == false -> remove.
         // Here mapList is null, so it hits the "No maps found" block -> update(null, 0).
         assert.deepEqual(bookkeepingUpdateStub.lastCall.args[0], { lastProcessedMid: null, retryCount: 0 });
    });
  });
  
  // (Janitor and Restore tests omitted/preserved as they don't depend on key scan)
  // Re-adding Janitor tests for completeness of this file overwrite?
  // Yes, I should include them.
  
  describe('janitor', () => {
    let enqueueStub;

    beforeEach(() => {
        enqueueStub = sinon.stub().resolves();
        adminFunctions.getFunctions.returns({
            taskQueue: sinon.stub().returns({ enqueue: enqueueStub })
        });
    });

    it('should start new loop', async () => {
        dbRefStub.withArgs('bookkeeping').returns({
           once: sinon.stub().resolves({ child: () => ({ val: () => null }) })
        });
        const wrapped = test.wrap(myFunctions.janitor);
        await wrapped({});
        assert.isTrue(enqueueStub.calledOnce);
    });
  });

    describe('restoreMap', () => {
    it('should restore map from storage', async () => {
      const mid = 'test_mid';
      const fileStub = {
        exists: sinon.stub().resolves([true]),
        download: sinon.stub().resolves([Buffer.from(JSON.stringify({ p: { m: 100 } }))]),
        delete: sinon.stub().resolves()
      };
      storageBucketStub.returns({ file: sinon.stub().returns(fileStub) });
      const setStub = sinon.stub().resolves();
      dbRefStub.withArgs(`maps/${mid}`).returns({ set: setStub });

      const wrapped = test.wrap(myFunctions.restoreMap);
      const result = await wrapped({ mid });

      assert.deepEqual(result, { success: true });
      assert.isTrue(setStub.calledOnce);
    });
  });
});
