function createAndAppendDivWithClass(parent, className) {
  const result = document.createElement('div');
  if (className) result.className = className;
  parent.appendChild(result);
  return result;
//  parent.insertAdjacentHTML(
//      'beforeend', `<div${className? ` class="${className}"` : ''}></div>`);
//  return parent.lastChild;
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

function debug(s) {
  if (!state.isProd) console.log(s);
}

function sanitizeFilename(input) {
  const replacement = '_';
  return input
      .replace(/[/?<>\\:*|":]/g, replacement)
      .replace(/[\x00-\x1f\x80-\x9f]/g, replacement)
      .replace(/^\.+$/, replacement)
      .replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, replacement)
      .replace(/[. ]+$/, replacement);
}
