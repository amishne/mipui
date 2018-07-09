/* eslint-disable max-len */
function createShapeSvgContent(kind, role, connections) {
  if (role == 'corner') {
    return "<polygon points='0 0, 22 0, 22 22, 0 22'/>";
  }
  const s = kind == ct.shapes.square;
  switch (connections) {
    case 0:
      return s ?
        "<polygon points='6 6, 20 6, 20 20, 6 20'/>" :
        "<circle cx='13' cy='13' r='7'/>";
    case 1:
      return s ?
        "<polygon points='6 -2, 20 -2, 20 20, 6 20'/>" :
        "<path d='M 6 -2, H 20, V 13, A 7 7 0 1 1 6 13, z'/>";
    case 2:
      return s ?
        "<polygon points='6 6, 27 6, 27 20, 6 20'/>" :
        "<path d='M 30 6, V 20, H 13, A 7 7 0 1 1 13 6, z'/>";
    case 3:
      return s ?
        "<polygon points='6 -2, 20 -2, 20 6, 27 6, 27 20, 6 20'/>" :
        "<path d='M 6 -2, H 20, V 0, A 6 6 0 0 0 26 6, H 27, V 20, H 26, A 20 20 0 0 1 6 0, z'/>";
    case 4:
      return s ?
        "<polygon points='6 6, 20 6, 20 27, 6 27'/>" :
        "<path d='M 6 27, H 20, V 13, A 7 7 0 0 0 6 13, z'/>";
    case 5:
      return "<polygon points='6 -2, 20 -2, 20 27, 6 27'/>";
    case 6:
      return s ?
        "<polygon points='6 6, 27 6, 27 20, 20 20, 20 27, 6 27'/>" :
        "<path d='M 27 6, V 20, H 26, A 6 6 0 0 0 20 26, V 27, H 6, V 26, A 20 20 0 0 1 26 6, z'/>";
    case 7:
      return s ?
        "<polygon points='6 -2, 20 -2, 20 6, 27 6, 27 20, 20 20, 20 27, 6 27'/>" :
        "<path d='M 20 -2, V 0, A 6 6 0 0 0 26 6, H 27, V 20, H 26, A 6 6 0 0 0 20 26, V 27, H 6, V -2, z'/>";
    case 8:
      return s ?
        "<polygon points='-2 6, 20 6, 20 20, -2 20'/>" :
        "<path d='M -2 20, V 6, H 13, A 7 7 0 1 1 13 20, z'/>";
    case 9:
      return s ?
        "<polygon points='-2 6, 6 6, 6 -2, 20 -2, 20 20, -2 20'/>" :
        "<path d='M 6 -2, H 20, V 0, A 20 20 0 0 1 0 20, H -2, V 6, H 0, A 6 6 0 0 0 6 0, z'/>";
    case 10:
      return "<polygon points='-2 6, 27 6, 27 20, -2 20'/>";
    case 11:
      return s ?
        "<polygon points='6 -2, 20 -2, 20 6, 27 6, 27 20, -2 20, -2 6, 6 6'/>" :
        "<path d='M -2 6, H 0, A 6 6 0 0 0 6 0, V -2, H 20, V 0, A 6 6 0 0 0 26 6, H 27, V 20, H -2, z'/>";
    case 12:
      return s ?
        "<polygon points='-2 6, 20 6, 20 27, 6 27, 6 20, -2 20'/>" :
        "<path d='M -2 6, H 0, A 20 20 0 0 1 20 26, V 27, H 6, A 6 6 0 0 0 0 20, H -2, z'/>";
    case 13:
      return s ?
        "<polygon points='6 -2, 20 -2, 20 27, 6 27, 6 20, -2 20, -2 6, 6 6'/>" :
        "<path d='M 6 -2, H 20, V 27, H 6, V 26, A 6 6 0 0 0 0 20, H -2, V 6, H 0, A 6 6 0 0 0 6 0, z'/>";
    case 14:
      return s ?
        "<polygon points='-2 6, 27 6, 27 20, 20 20, 20 27, 6 27, 6 20, -2 20'/>" :
        "<path d='M -2 6, H 27, V 20, H 26, A 6 6 0 0 0 20 26, V 27, H 6, V 26, A 6 6 0 0 0 0 20, H -2, z'/>";
    case 15:
      return s ?
        "<polygon points='-2 6, 6 6, 6 -2, 20 -2, 20 6, 27 6, 27 20, 20 20, 20 27, 6 27, 6 20, -2 20'/>" :
        "<path d='M -2 6, H 0, A 6 6 0 0 0 6 0, V -2, H 20, V 0, A 6 6 0 0 0 26 6, H 27, V 20, A 6 6 0 0 0 20 26, V 27, H 6, V 26, A 6 6 0 0 0 0 20, H -2, z'/>";
  }
}
/* eslint-enable max-len */

function createPitSvgContent(role, connections) {
  const p =
      (cssClass, points) => `<polygon class='${cssClass}' points='${points}'/>`;
  const c = connections;
  switch (role) {
    case 'vertical':
      return (c & 1 ? '' : p('pit-top', '-1 1, 10 1, 10 5, -1 5')) +
          (c & 4 ? '' : p('pit-bottom', '-1 19, 10 19, 10 23, -1 23'));
    case 'horizontal':
      return (c & 2 ? '' : p('pit-right', '23 -1, 23 10, 19 10, 19 -1')) +
          (c & 8 ? '' : p('pit-left', '1 -1, 5 -1, 5 10, 1 10'));
    case 'corner':
      return '';
  }
  // Otherwise, it's a primary.
  const topRightCorner = c & 16 ? '' :
    p('pit-top', '23 1, 19 5, 26 5, 25 1') +
    p('pit-right', '23 1, 19 5, 19 -1, 23 -1');
  const bottomRightCorner = c & 32 ? '' :
    p('pit-right', '23 23, 19 19, 19 26, 23 26') +
    p('pit-bottom', '19 19, 23 23, 26 23, 26 19');
  const bottomLeftCorner = c & 64 ? '' :
    p('pit-bottom', '-1 19, 5 19, 1 23, -1 23') +
    p('pit-left', '5 19, 5 26, 1 26, 1 23');
  const topLeftCorner = c & 128 ? '' :
    p('pit-top', '1 1, 5 5, -1 5, -1 1') +
    p('pit-left', '1 1, 5 5, 5 -1, 1 -1');
  switch (c & 15) {
    case 0:
      return p('pit-top', '1 1, 23 1, 19 5, 5 5') +
          p('pit-right', '23 1, 23 23, 19 19, 19 5') +
          p('pit-bottom', '5 19, 19 19, 23 23, 1 23') +
          p('pit-left', '1 1, 5 5, 5 19, 1 23');
    case 1:
      return p('pit-right', '23 -1, 23 23, 19 19, 19 -1') +
          p('pit-bottom', '5 19, 19 19, 23 23, 1 23') +
          p('pit-left', '1 -1, 5 -5, 5 19, 1 23');
    case 2:
      return p('pit-top', '1 1, 26 1, 26 5, 5 5') +
          p('pit-bottom', '5 19, 26 19, 26 23, 1 23') +
          p('pit-left', '1 1, 5 5, 5 19, 1 23');
    case 3:
      return topRightCorner +
          p('pit-bottom', '5 19, 26 19, 26 23, 1 23') +
          p('pit-left', '1 -1, 5 -5, 5 19, 1 23');
    case 4:
      return p('pit-top', '1 1, 23 1, 19 5, 5 5') +
          p('pit-right', '23 1, 23 26, 19 26, 19 5') +
          p('pit-left', '1 1, 5 5, 5 26, 1 26');
    case 5:
      return p('pit-right', '23 -1, 23 26, 19 26, 19 -1') +
          p('pit-left', '1 -1, 5 -1, 5 26, 1 26');
    case 6:
      return bottomRightCorner +
          p('pit-top', '1 1, 26 1, 26 5, 5 5') +
          p('pit-left', '1 1, 5 5, 5 26, 1 26');
    case 7:
      return topRightCorner + bottomRightCorner +
          p('pit-left', '1 -1, 5 -1, 5 26, 1 26');
    case 8:
      return p('pit-top', '-1 1, 23 1, 19 5, -1 5') +
          p('pit-right', '23 1, 23 23, 19 19, 19 5') +
          p('pit-bottom', '-1 19, 19 19, 23 23, -1 23');
    case 9:
      return topLeftCorner +
          p('pit-right', '23 -1, 23 23, 19 19, 19 -1') +
          p('pit-bottom', '-1 19, 19 19, 23 23, -1 23');
    case 10:
      return p('pit-top', '-1 1, 26 1, 26 5, -1 5') +
          p('pit-bottom', '-1 19, 26 19, 26 23, -1 23');
    case 11:
      return topRightCorner + topLeftCorner +
          p('pit-bottom', '-1 19, 26 19, 26 23, -1 23');
    case 12:
      return p('pit-top', '-1 1, 23 1, 19 5, -1 5') +
          p('pit-right', '23 1, 23 26, 19 26, 19 5') +
          bottomLeftCorner;
    case 13:
      return topLeftCorner + bottomLeftCorner +
          p('pit-right', '23 -1, 23 26, 19 26, 19 -1');
    case 14:
      return bottomLeftCorner + bottomRightCorner +
          p('pit-top', '-1 1, 26 1, 26 5, -1 5');
    case 15:
      return topRightCorner + bottomRightCorner +
          bottomLeftCorner + topLeftCorner;
  }
}

function createPassageSvgContent(role, connections) {
  const s = stopName => {
    switch (stopName) {
      case 0: return -1;
      case 1: return 3;
      case 2: return 21;
      case 3: return 26;
      case 'd': return 11;
    }
  };
  const h = (x1name, y1name, x2name) => {
    const y = s(y1name);
    return `<line x1='${s(x1name)}' y1='${y}' x2='${s(x2name)}' y2='${y}'/>`;
  };
  const v = (x1name, y1name, y2name) => {
    const x = s(x1name);
    return `<line x1='${x}' y1='${s(y1name)}' x2='${x}' y2='${s(y2name)}'/>`;
  };
  const c = connections;
  switch (role) {
    case 'vertical':
      return (c & 1 ? '' : h(0, 1, 'd')) + (c & 4 ? '' : h(0, 2, 'd'));
    case 'horizontal':
      return (c & 2 ? '' : v(2, 0, 'd')) + (c & 8 ? '' : v(1, 0, 'd'));
    case 'corner':
      return '';
  }
  const shapes = [];
  const a = shape => { shapes.push(shape); };
  // Add straight sides.
  if ((c & 1) == 0) {
    const start = c & 8 ? 0 : 1;
    const end = c & 2 ? 3 : 2;
    a(h(start, 1, end));
  }
  if ((c & 2) == 0) {
    const start = c & 1 ? 0 : 1;
    const end = c & 4 ? 3 : 2;
    a(v(2, start, end));
  }
  if ((c & 4) == 0) {
    const start = c & 8 ? 0 : 1;
    const end = c & 2 ? 3 : 2;
    a(h(start, 2, end));
  }
  if ((c & 8) == 0) {
    const start = c & 1 ? 0 : 1;
    const end = c & 4 ? 3 : 2;
    a(v(1, start, end));
  }
  // Add corners
  if ((c & 3) == 3 && (c & 16) == 0) {
    a(h(2, 1, 3));
    a(v(2, 0, 1));
  }
  if ((c & 6) == 6 && (c & 32) == 0) {
    a(h(2, 2, 3));
    a(v(2, 2, 3));
  }
  if ((c & 12) == 12 && (c & 64) == 0) {
    a(h(0, 2, 1));
    a(v(1, 2, 3));
  }
  if ((c & 9) == 9 && (c & 128) == 0) {
    a(h(0, 1, 1));
    a(v(1, 0, 1));
  }
  return shapes.join('');
}
