let suiteTests_ = [];
let currentTestIndex_ = 0;

function assert(condition) {
  suiteTests_[currentTestIndex_].passed &= !!condition;
  if (!condition) {
    console.log(`Assert failed in '${suiteTests_[currentTestIndex_].name}':`);
    console.trace();
  }
}

function testCompleted() {
  const currentTest = suiteTests_[currentTestIndex_];
  applyTestResultToElement_(currentTest.passed, currentTest.element);
  currentTestIndex_++;
  runNextTest_();
}

function addTest(name, fn) {
  suiteTests_.push({name, fn, passed: true, element: null});
}

function mock(path, obj) {
  let prefix = [];
  const parts = path.split('.').map(name => {
    const result = {name, prefix};
    prefix = prefix.concat([name]);
    return result;
  });
  const functionObjects = {};
  let child = obj;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    const parent =
        part.prefix.length == 0 ? window : globalFromPath_(part.prefix);
    child = mockPart_(parent, part.name, child);
  }
}

function runTests() {
  currentTestIndex_ = 0;
  if (typeof beforeSuite !== 'undefined') beforeSuite();
  runNextTest_();
}

function runNextTest_() {
  const test = suiteTests_[currentTestIndex_];
  if (!test) return;
  if (typeof beforeTest !== 'undefined') beforeTest();
  test.passed = true;
  test.element = createTestElement_(document.body, test.name);
  test.fn();
}

function createTestElement_(parentElement, name) {
  const div = document.createElement('div');
  parentElement.appendChild(div);
  div.append(`Test ${currentTestIndex_ + 1} '${name}' `);
  const span = document.createElement('span');
  div.appendChild(span);
  span.textContent = 'running...';
  span.style.color = 'goldenrod';
  return span;
}

function applyTestResultToElement_(testPassed, element) {
  element.textContent = testPassed ? 'passed' : 'failed';
  element.style.color = testPassed ? 'limegreen' : 'crimson';
}

function globalFromPath_(path) {
  let global = window;
  for (let i = 0; i < path.length; i++) {
    global = global[path[i].replace('()', '')];
    if (!global) return null;
    if (path[i].endsWith('()')) global = global();
  }
  return global;
}

function mockPart_(parent, name, child) {
  const field = {
    [name.replace('()', '')]: name.endsWith('()') ? () => child : child
  };
  if (parent) {
    Object.assign(parent, field);
    return parent;
  } else {
    return field;
  }
}

window.onload = () => runTests();
