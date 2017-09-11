function createAndAppendDivWithClass(parent, className) {
  const result = document.createElement('div');
  if (className) result.className = className;
  parent.appendChild(result);
  return result;
}

function hashString(s) {
  // http://stackoverflow.com/a/15710692
  return s.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
}

function clamp(min, num, max) {
  return Math.min(max, Math.max(min, num));
}

// eslint-disable-next-line prefer-const
let debug = () => {};
