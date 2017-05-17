// Content types.
// * "ct" contains "layer"s.
// * Each "layer" contains "kind"s.
// * Each "kind" contains "variation"s.
const ct = {
  floors: {
    classNames: ['floor-cell'],
    floor: {
      generic: {},
    },
  },
  walls: {
    classNames: ['wall-cell', ],
    smooth: {
      square: {
        classNames: [
          'square-wall-cell',
          'square-wall-cell-_ADDING_',
          'square-wall-cell-_REMOVING_',
        ],
      },
      angled: {
        classNames: [
          'angled-wall-cell-_ROLE_',
          'angled-wall-cell-_ROLE_-_CONNECTIONS_',
          'angled-wall-cell-_ADDING_',
          'angled-wall-cell-_REMOVING_',
        ],
      },
    },
  },
  images: {
    image: {
      classNames: [
        'image-cell',
        'image-cell-_ADDING-REMOVING_',
        'image-cell-_EDITING_',
      ],
      black: {classNames: ['image-black']},
    }
  },
  doors: {
    door: {
      classNames: [
        'door-cell',
        'door-cell-_ROLE_',
        'door-cell-_ADDING-REMOVING_'
      ],
      single: {},
      double: {classNames: ['double-door-cell-_ROLE_']},
      secret: {classNames: ['secret-door-cell']},
    },
  },
  text: {
    text: {
      classNames: [
        'text-cell',
        'text-cell-_ADDING-REMOVING_',
        'text-cell-_EDITING_',
      ],
      standard: {},
    },
  },
  shapes: {
    classNames: ['shape-cell'],
    square: {
      classNames: [
        'square-cell-_CONNECTIONS_',
        'square-cell-_ROLE_',
        'square-cell-_ROLE_-_ADDING-REMOVING_',
      ],
      green: {
        classNames: ['green-square', 'green-square-_ADDING-REMOVING_'],
      },
      brown: {
        classNames: ['brown-square', 'brown-square-_ADDING-REMOVING_'],
      },
      blue: {
        classNames: ['blue-square', 'blue-square-_ADDING-REMOVING_'],
      },
      red: {
        classNames: ['red-square', 'red-square-_ADDING-REMOVING_'],
      },
      white: {
        classNames: ['white-square', 'white-square-_ADDING-REMOVING_'],
      },
    },
    circle: {
      classNames: [
        'circle-cell-_CONNECTIONS_',
        'circle-cell-_ROLE_',
        'circle-cell-_ROLE_-_ADDING-REMOVING_',
      ],
      green: {
        classNames: ['green-circle', 'green-circle-_ADDING-REMOVING_'],
      },
      brown: {
        classNames: ['brown-circle', 'brown-circle-_ADDING-REMOVING_'],
      },
      blue: {
        classNames: ['blue-circle', 'blue-circle-_ADDING-REMOVING_'],
      },
      red: {
        classNames: ['red-circle', 'red-circle-_ADDING-REMOVING_'],
      },
      white: {
        classNames: ['white-circle', 'white-circle-_ADDING-REMOVING_'],
      },
    },
  },
  stairs: {
    classNames: [
      'stairs-cell',
      'stairs-cell-_ADDING-REMOVING_',
      'stairs-cell-_EDITING_',
    ],
    horizontal: { generic: {imagePath: 'assets/stairs-horizontal.svg'} },
    vertical: { generic: {imagePath: 'assets/stairs-vertical.svg'} },
    spiral: { generic: {imagePath: 'assets/stairs-spiral.svg'} },
  }
};

// Content keys.
const ck = {
  kind: 'k',
  variation: 'v',
  startCell: 's',
  endCell: 'e',
  text: 't',
  image: 'i',
  imageHash: 'h',
  useVariationImage: 'u',
  connections: 'c',
};

// Property keys.
const pk = {
  title: 'n',
  longDescription: 'd',
  firstRow: 't',
  lastRow: 'b',
  firstColumn: 'l',
  lastColumn: 'r',
};

function sameContent(c1, c2) {
  if (!c1 && !c2) return true;
  if (!!c1 != !!c2) return false;
  return Object.keys(ck).every(k => {
    const key = ck[k];
    const has1 = c1.hasOwnProperty(key);
    const has2 = c2.hasOwnProperty(key);
    if (has1 != has2) return false;
    return c1[key] === c2[key];
  });
}

function getContentType(layer, content) {
  return ct
      .children[layer.id]
      .children[content[ck.kind]]
      .children[content[ck.variation]];
}

function initializeContentTypes(obj) {
  const children = [];
  Object.keys(obj).forEach(prop => {
    const field = obj[prop];
    if (['classNames', 'name', 'id', 'imagePath'].includes(prop)) return;
    field.name = prop;
    initializeContentTypes(field);
    field.id = children.length;
    children.push(field);
  });
  obj.children = children;
}

initializeContentTypes(ct);
