function createAndAppendDivWithClass(parent, className) {
  const result = document.createElement('div');
  result.className = className;
  parent.appendChild(result);
  return result;
}
