let suiteTests_ = [];
let testFailed_ = null;

function assert(condition) {
  testFailed_ |= !condition;
}

function addTest(name, fn) {
  suiteTests_.push({name, fn});
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
  if (typeof beforeSuite !== 'undefined') beforeSuite();
  suiteTests_.forEach(test => {
    if (typeof beforeTest !== 'undefined') beforeTest();
    testFailed_ = false;
    const element = createTestElement_(document.body, test.name);
    test.fn();
    applyTestResultToElement_(testFailed_, element);
  });
}

function createTestElement_(parentElement, name) {
  const div = document.createElement('div');
  parentElement.appendChild(div);
  div.append(`Test '${name}' `);
  const span = document.createElement('span');
  div.appendChild(span);
  span.textContent = 'running...';
  span.style.color = 'goldenrod';
  return span;
}

function applyTestResultToElement_(testFailed, element) {
  element.textContent = testFailed ? 'failed' : 'passed';
  element.style.color = testFailed ? 'crimson' : 'limegreen';
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
