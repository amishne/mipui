const suiteTests_ = [{mocked: []}];
let currentTestIndex_ = 0;
const PATH_FUNCTION_REGEX = /\([^)]*\)$/;
const PATH_FUNCTION_MATCH_REGEX = /\(([^)]*)\)$/;
let allowMatchers = true;
let singleMode_ = false;

function assert(condition) {
  suiteTests_[currentTestIndex_].passed &= !!condition;
  if (!condition) {
    console.log(`Assert failed in '${suiteTests_[currentTestIndex_].name}':`);
    console.trace();
  }
}

function testCompleted() {
  if (typeof afterTest !== 'undefined') afterTest();
  const currentTest = suiteTests_[currentTestIndex_];
  applyTestResultToElement_(currentTest.passed, currentTest.element);
  revertMocks_(currentTest);
  if (!singleMode_) {
    currentTestIndex_++;
    runNextTest_();
  }
}

function addTest(name, fn) {
  suiteTests_.push({name, fn, passed: true, element: null, mocked: []});
}

function mock(path, obj) {
  let prefix = [];
  const parts = path.split('.').map(name => {
    const result = {name, prefix};
    prefix = prefix.concat([name]);
    return result;
  });
  let child = obj;
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i];
    allowMatchers = false;
    const parent =
        part.prefix.length == 0 ? window : globalFromPath_(part.prefix);
    allowMatchers = true;
    child = mockPart_(parent, part, child);
  }
}

function runTests() {
  currentTestIndex_ = 0;
  if (typeof beforeSuite !== 'undefined') beforeSuite();
  currentTestIndex_ = 1;
  runNextTest_();
}

function runNextTest_() {
  setTimeout(() => {
    const test = suiteTests_[currentTestIndex_];
    if (!test) return;
    if (typeof beforeTest !== 'undefined') {
      beforeTest(() => {
        test.passed = true;
        test.element = createTestElement_(document.body, test.name);
        test.fn();
      });
    } else {
      test.passed = true;
      test.element = createTestElement_(document.body, test.name);
      test.fn();
    }
  }, 0);
}

function createTestElement_(parentElement, name) {
  const div = document.createElement('div');
  parentElement.appendChild(div);
  div.append(`Test ${currentTestIndex_} '${name}' `);
  const span = document.createElement('span');
  div.appendChild(span);
  span.textContent = 'running...';
  span.style.color = 'goldenrod';
  return span;
}

function applyTestResultToElement_(testPassed, element) {
  element.textContent = testPassed ? 'passed' : 'failed';
  element.style.color = testPassed ? 'limegreen' : 'crimson';
  const button = document.createElement('button');
  button.textContent = singleMode_ ? 'Retry all' : 'Retry';
  element.appendChild(button);
  const currentIndex = currentTestIndex_;
  button.onclick = () => {
    document.body.innerHTML = '';
    singleMode_ = !singleMode_;
    currentTestIndex_ = singleMode_ ? currentIndex : 1;
    runNextTest_();
  };
}

function globalFromPath_(path) {
  let global = window;
  for (let i = 0; i < path.length; i++) {
    const part = path[i];
    global = global[part.replace(PATH_FUNCTION_REGEX, '')];
    if (!global) return null;
    const args = getArgs_(part);
    if (args != null) {
      global = global.apply(this, args);
    }
  }
  return global;
}

function getArgs_(part) {
  const argStringMatch = part.match(PATH_FUNCTION_MATCH_REGEX);
  return argStringMatch != null ? eval('[' + argStringMatch[1] + ']') : null;
}

function mockPart_(parent, part, child) {
  const args = getArgs_(part.name);
  if (args != null) {
    return mockFunc_(
        parent, part, part.name.replace(PATH_FUNCTION_REGEX, ''), child, args);
  } else {
    return mockField_(parent, part, child);
  }
}

function mockField_(parent, part, child) {
  const currentTest = suiteTests_[currentTestIndex_];
  const fullPath =
      part.prefix.join('.') + (part.prefix.length > 0 ? '.' : '') + part.name;
  const field = {[part.name]: child};
  if (parent) {
    currentTest.mocked.push({
      path: fullPath,
      obj: parent[part.name],
    });
    Object.assign(parent, field);
    return parent;
  } else {
    currentTest.mocked.push({
      path: fullPath,
      obj: undefined,
    });
    return field;
  }
}

function mockFunc_(parent, part, name, child, args) {
  let existingFunc = () => null;
  if (parent && parent[name] && typeof parent[name] === 'function') {
    existingFunc = parent[name];
  }
  const func = function() {
    for (let i = 0; i < Math.max(args.length, arguments.length); i++) {
      if (i >= args.length) return existingFunc.apply(this, arguments);
      if (allowMatchers && args[i] == '$all') break;
      if (allowMatchers && args[i] == '$any') continue;
      if (i >= arguments.length || arguments[i] != args[i]) {
        return existingFunc.apply(this, arguments);
      }
    }
    return child;
  };

  const currentTest = suiteTests_[currentTestIndex_];
  const fullPath =
      part.prefix.join('.') + (part.prefix.length > 0 ? '.' : '') + name;
  if (parent) {
    currentTest.mocked.push({
      path: fullPath,
      obj: parent[name],
    });
    parent[name] = func;
    return parent;
  } else {
    currentTest.mocked.push({
      path: fullPath,
      obj: undefined,
    });
    return {[name]: func};
  }
}

function revertMocks_(test) {
  test.mocked.forEach(({path, obj}) => {
    console.log(`reverting by mock(${path}, ${obj})`);
    mock(path, obj);
  });
}

window.onload = () => runTests();
