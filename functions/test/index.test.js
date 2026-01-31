const test = require('firebase-functions-test')();
const assert = require('chai').assert;
const sinon = require('sinon');
const admin = require('firebase-admin');

describe('Cloud Functions', () => {
  let myFunctions;
  let dbRefStub;
  let storageBucketStub;

  // Store originals to restore later
  let originalInit;
  let originalDatabase;
  let originalStorage;

  before(async () => {
    // 1. Manually Mock Admin methods using defineProperty to handle getters
    originalInit = admin.initializeApp;
    // Make sure we define it as configurable so we can restore it later
    Object.defineProperty(admin, 'initializeApp', { value: () => {}, configurable: true, writable: true });

    dbRefStub = sinon.stub();
    // Use get() to handle if it's a getter or value, or just defineProperty 'get'
    // Safe approach: define 'get'
    const dbStub = () => ({ ref: dbRefStub });
    // Keep ServerValue if possible, or mock it.
    dbStub.ServerValue = { TIMESTAMP: 'MOCK_TIMESTAMP' };
    
    const dbDescriptor = Object.getOwnPropertyDescriptor(admin, 'database');
    originalDatabase = dbDescriptor;
    Object.defineProperty(admin, 'database', { get: () => dbStub, configurable: true });

    storageBucketStub = sinon.stub();
    const storageStub = () => ({ bucket: storageBucketStub });
    
    const storageDescriptor = Object.getOwnPropertyDescriptor(admin, 'storage');
    originalStorage = storageDescriptor;
    Object.defineProperty(admin, 'storage', { get: () => storageStub, configurable: true });

    // 2. Require index.js
    myFunctions = require('../index');
  });

  after(() => {
    // Restore originals
    // For initializeApp, it's a value property.
    if (originalInit) {
        // Try restoring using defineProperty to ensure it's exact
        try {
            Object.defineProperty(admin, 'initializeApp', { value: originalInit, writable: true, configurable: true });
        } catch (e) {
            // Fallback: direct assignment if writable
            admin.initializeApp = originalInit;
        }
    }

    if (originalDatabase) {
        try {
            Object.defineProperty(admin, 'database', originalDatabase);
        } catch (e) { console.error('Failed to restore admin.database', e); }
    }
    
    if (originalStorage) {
         try {
            Object.defineProperty(admin, 'storage', originalStorage);
         } catch (e) { console.error('Failed to restore admin.storage', e); }
    }
    
    test.cleanup();
  });

  afterEach(() => {
    dbRefStub.resetHistory();
    storageBucketStub.resetHistory();
  });

  describe('offloadOldMaps', () => {
    it('should offload maps older than 90 days', async () => {
      const now = Date.now();
      const oldTime = now - (91 * 24 * 60 * 60 * 1000); // 91 days ago
      
      // Setup DB Chain
      const watermarkRef = {
        once: sinon.stub().resolves({ val: () => null }),
        set: sinon.stub().resolves(),
        remove: sinon.stub().resolves()
      };
      
      const mapData = {
        'recentMap': { p: { m: now } },
        'oldMap': { p: { m: oldTime } }
      };
      
      const mapsQueryStub = {
        once: sinon.stub().resolves({ val: () => mapData })
      };
      
      // Fix: orderByKey() returns Query. limitToFirst() returns Query.
      // We need to chain these.
      const queryChain = {
        limitToFirst: sinon.stub().returns({
             startAfter: () => mapsQueryStub,
             ...mapsQueryStub
        }),
        startAfter: () => mapsQueryStub,
        ...mapsQueryStub
      };
      // The implementation calls: db.ref('maps').orderByKey().limitToFirst()
      // So orderByKey returns an object that has limitToFirst.
      
      const mapsRefStub = {
        orderByKey: sinon.stub().returns(queryChain)
      };
      
      // Setup default db behaviors
      dbRefStub.withArgs('bookkeeping/lastProcessedMid').returns(watermarkRef);
      dbRefStub.withArgs('maps').returns(mapsRefStub);
      
      const oldMapRemovalStub = sinon.stub().resolves();
      dbRefStub.withArgs('maps/oldMap').returns({ remove: oldMapRemovalStub });

      // Setup Storage Chain
      const fileSaveStub = sinon.stub().resolves();
      const bucketObj = { 
        file: sinon.stub().returns({ save: fileSaveStub }) 
      };
      storageBucketStub.returns(bucketObj);

      // Execute with wrapped function
      // Note: offloadOldMaps is onDispatch (Cloud Tasks)
      // test.wrap handles the correct signature invocation
      const wrapped = test.wrap(myFunctions.offloadOldMaps);
      await wrapped({});

      // Assertions
      assert.isTrue(oldMapRemovalStub.calledOnce, 'Should remove oldMap');
      assert.isTrue(fileSaveStub.calledOnce, 'Should save oldMap to storage');
      assert.isTrue(bucketObj.file.calledWith('maps/oldMap.mipui'));
    });
  });

  describe('restoreMap', () => {
    it('should restore map from storage', async () => {
      const mid = 'test_mid';

      // Mock Storage
      const fileStub = {
        exists: sinon.stub().resolves([true]),
        download: sinon.stub().resolves([Buffer.from(JSON.stringify({ 
             payload: { fullMap: {} },
             p: { m: 100 }
        }))]),
        delete: sinon.stub().resolves()
      };
      storageBucketStub.returns({ file: sinon.stub().returns(fileStub) });

      // Mock DB
      const setStub = sinon.stub().resolves();
      dbRefStub.withArgs(`maps/${mid}`).returns({ set: setStub });

      // Execute
      // restoreMap is onCall
      const wrapped = test.wrap(myFunctions.restoreMap);
      const result = await wrapped({ mid });

      // Verify
      assert.deepEqual(result, { success: true });
      assert.isTrue(setStub.calledOnce);
      assert.isTrue(fileStub.delete.calledOnce);
    });
  });
});
