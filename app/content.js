// Content types.
// * "ct" contains "layer"s.
// * Each "layer" contains "kind"s.
// * Each "kind" contains "variation"s.
const ct = {
  terrain: {
    classNames: ['terrain-cell'],
    wall: {
      classNames: ['wall-cell', 'wall-cell-_ADDING_'],
      generic: {},
    },
    floor: {
      classNames: ['floor-cell', 'floor-cell-_ADDING_'],
      generic: {},
    },
  },
  doors: {
    door: {
      classNames: [
        'door-cell',
        'door-cell-_ROLE_',
        'door-cell-_ADDING-REMOVING_'
      ],
      single: {},
      double: {
        classNames: ['double-door-cell-_ROLE_'],
      },
      secret: {
        classNames: ['secret-door-cell'],
      },
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
};

// Content keys.
const ck = {
  kind: 'k',
  variation: 'v',
  startCell: 's',
  endCell: 'e',
  text: 't',
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
    if (['classNames', 'name', 'id'].includes(prop)) return;
    field.name = prop;
    initializeContentTypes(field);
    field.id = children.length;
    children.push(field);
  });
  obj.children = children;
}

initializeContentTypes(ct);
