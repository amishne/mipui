function createAndAppendDivWithClass(parent, className) {
  const result = document.createElement('div');
  if (className) result.className = className;
  parent.appendChild(result);
  return result;
}
