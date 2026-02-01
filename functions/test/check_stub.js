const sinon = require('sinon');
const adminFns = require('firebase-admin/functions');

console.log('Original type:', typeof adminFns.getFunctions);

const stub = sinon.stub(adminFns, 'getFunctions');
stub.returns('MOCKED_FUNCTIONS');

const { getFunctions } = require('firebase-admin/functions');
console.log('Destructured call result:', getFunctions());

if (getFunctions() === 'MOCKED_FUNCTIONS') {
    console.log('SUCCESS: Can stub getFunctions');
    process.exit(0);
} else {
    console.log('FAILURE: Cannot stub getFunctions');
    process.exit(1);
}
