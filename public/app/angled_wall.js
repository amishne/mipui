/*
An angled cell is composed of 17 parts (uppercase letters):

 0  7  14 19 2431 38
 v  v  v  v  v v  v
--------------------
|tl|\     t    /|tr| < 0
|  |A\        /B|  |
--------------------
|\C|   \  D /   |E/| < 7
| \|    \  /    |/ |
|  | F   \/   G |  | < 14
|  |\    /\    /|  | < 12
|  | \  /  \  / |  |
|l |H \/  I \/ J| r|
|  |  /\    /\  |  | < 19
|  | /  \  /  \ |  |
|  |/    \/    \|  | < 26
|  |  K  /\  L  \  | < 24
| /|    /  \    |\ |
|/M|   /  N \   |O\| < 31
--------------------
|  |P/        \Q|  |
|bl|/     b    \|br| < 38
--------------------

The 8 potential connections (lowercase letters) control which parts are walls
and which aren't; sectionsFromDirs contains the logic.
*/

function createPolygon(section) {
  let p = null;
  switch (section) {
    case 'A': p = '7 0, 14 7, 7 7'; break;
    case 'B': p = '31 0, 32 0, 32 8, 23 8'; break;
    case 'C': p = '0 7, 7 7, 7 14'; break;
    case 'D': p = '14 7, 24 7, 19 12'; break;
    case 'E': p = '31 7, 38 7, 31 14'; break;
    case 'F': p = '7 7, 14 7, 19 12, 12 19, 7 14'; break;
    case 'G': p = '24 7, 32 7, 32 13, 26 19, 19 12'; break;
    case 'H': p = '7 14, 12 19, 7 24'; break;
    case 'I': p = '19 12, 26 19, 19 26, 12 19'; break;
    case 'J': p = '32 13, 32 25, 26 19'; break;
    case 'K': p = '12 19, 19 26, 13 32, 6 32, 6 25'; break;
    case 'L': p = '26 19, 32 25, 32 32, 25 32, 19 26'; break;
    case 'M': p = '7 24, 7 32, 0 32, 0 31'; break;
    case 'N': p = '19 26, 25 32, 13 32'; break;
    case 'O': p = '31 24, 39 32, 31 32'; break;
    case 'P': p = '7 31, 14 31, 7 38'; break;
    case 'Q': p = '24 31, 32 31, 32 39'; break;
  }
  return `<polygon points='${p}'/>`;
}

function sectionsFromDirs(d) {
  const sections = [];
  const s = sectionName => {
    sections.push(sectionName);
  };
  s('I');
  if (d.t) s('D');
  if (d.r) s('J');
  if (d.b) s('N');
  if (d.l) s('H');
  if (d.tl || d.t || d.l) s('F');
  if (d.tr || d.t || d.r) s('G');
  if (d.br || d.b || d.r) s('L');
  if (d.bl || d.b || d.l) s('K');
  if (d.tl && !d.l) s('C');
  if (d.tl && !d.t) s('A');
  if (d.tr && !d.t) s('B');
  if (d.tr && !d.r) s('E');
  if (d.br && !d.r) s('O');
  if (d.br && !d.b) s('Q');
  if (d.bl && !d.b) s('P');
  if (d.bl && !d.l) s('M');
  return sections;
}

function createAngledWallSvgMask(connections) {
  const directions = {
    't': 1,
    'r': 2,
    'b': 4,
    'l': 8,
    'tr': 16,
    'br': 32,
    'bl': 64,
    'tl': 128,
  };
  const d = {};
  Object.keys(directions).forEach(key => {
    d[key] = (connections & directions[key]) != 0;
  });
  const polygons = createPolygons(d);
  return 'url("data:image/svg+xml;utf8,' +
      "<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' " +
      "shape-rendering='crispEdges'><style>polygon {fill: white;}</style>" +
      `<defs><mask id='m'>${polygons.join('')}</mask></defs>` +
      "<rect x='0' y='0' width='40' height='40' mask='url(%23m)'/></svg>\")";
}

function createPolygons(d) {
  return sectionsFromDirs(d).map(createPolygon);
}
