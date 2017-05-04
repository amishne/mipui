class Menu {
  constructor() {
    this.gameIcons_ = gameIcons;
    this.menuItems_ = this.setupMenuItems_();
  }

  createMenu() {
    const appElement = document.getElementById('app');
    const menuElement = createAndAppendDivWithClass(appElement, 'menu');

    const topElement = createAndAppendDivWithClass(menuElement, 'menu-top');
    const bottomElement =
        createAndAppendDivWithClass(menuElement, 'menu-bottom');
    this.createMenuItems_(topElement, bottomElement);
  }

  setToInitialSelection() {
    const selectedMenuItem =
        this.menuItems_.find(menuItem => menuItem.isSelected);
    if (selectedMenuItem) {
      this.selectMenuItem_(selectedMenuItem);
    }
  }

  descChanged() {
    document.querySelector('#mapTitle textarea').value = state.getDesc().title;
    document.querySelector('#mapLongDesc textarea').value =
        state.getDesc().long;
  }

  createMenuItems_(topElement, bottomElement) {
    this.menuItems_.forEach(menuItem => {
      this.createMenuItem_(menuItem, topElement, bottomElement);
    });
  }

  createMenuItem_(menuItem, topElement, bottomElement) {
    const submenuElement =
        createAndAppendDivWithClass(bottomElement, 'submenu');
    menuItem.submenu.element = submenuElement;
    this.createItem_(topElement, menuItem, () => {
      this.selectMenuItem_(menuItem);
    });
    this.populateMenuItem_(menuItem);
    const tipElement =
        createAndAppendDivWithClass(submenuElement, 'menu-tip');
    tipElement.textContent = menuItem.tip;
  }

  populateMenuItem_(menuItem) {
    menuItem.submenu.items.forEach(submenuItem => {
      // Wire it to its parent.
      submenuItem.parent = menuItem;
      this.createItem_(menuItem.submenu.element, submenuItem, () => {
        this.selectSubmenuItem_(submenuItem);
      });
    });
  }

  createItem_(parent, item, callback) {
    const element =
        createAndAppendDivWithClass(
            parent, 'menu-item ' + ((item.classNames || []).join(' ') || ''));
    element.title = item.name;
    if (item.id) element.id = item.id;
    element.onclick = callback;
    item.element = element;
    this.updateItem_(item);
  }

  updateItem_(item) {
    if (!item.enabledInReadonlyMode) {
      item.element.classList.add('disabled-in-read-only-mode');
    }
    let cells = null;
    switch (item.presentation) {
      case 'icon':
        const image = document.createElement('img');
        item.element.classList.add('menu-icon');
        image.src = `assets/ic_${item.materialIcon}_white_24px.svg`;
        item.element.appendChild(image);
        break;
      case 'label':
        item.element.classList.add('menu-label');
        if (item.text) {
          item.element.textContent = item.text;
        }
        break;
      case 'selected child':
        if (!item.submenu.allItems) {
          item.submenu.allItems = item.submenu.items;
        }
        let selectedChild = item.submenu.allItems.find(item => item.isSelected);
        cells = selectedChild.cells;
        item.element.classList.add(...selectedChild.classNames);
        // Intentional fallthrough.
      case 'cells':
        item.element.innerHTML = '';
        this.createCellsForItem_(item.element, cells || item.cells);
        break;
      case 'input':
      case 'textarea':
        const label =
            createAndAppendDivWithClass(item.element, 'menu-textarea-label');
        label.textContent = item.name;
        const textarea = document.createElement(
            item.presentation == 'input' ? 'input' : 'textarea');
        if (item.presentation == 'textarea') {
          textarea.rows = item.rows;
        }
        textarea.className = 'menu-textarea-input';
        if (item.datalistId) {
          textarea.setAttribute('list', item.datalistId);
        }
        item.element.appendChild(textarea);
        item.oldText = '';
        if (item.onChange) {
          textarea.onchange = () => {
            item.onChange(item.oldText, textarea.value);
            item.oldText = textarea.value;
          }
        }
        if (item.onInput) {
          textarea.oninput = () => {
            item.onInput(item.oldText, textarea.value);
            item.oldText = textarea.value;
          }
        }
        break;
    }
  }

  createCellsForItem_(parent, cells) {
    cells.forEach(cell => {
      const element =
          createAndAppendDivWithClass(parent, cell.classNames.join(' '));
      element.innerHTML = cell.innerHTML || '';
    });
  }

  selectMenuItem_(menuItem) {
    if (menuItem.element.classList.contains('disabled-menu-item')) {
      alert('This is a read-only view of this map; fork to edit.');
      return;
    }
    this.menuItems_.forEach(otherMenuItem => {
      const isThisItem = menuItem == otherMenuItem;
      otherMenuItem.isSelected = isThisItem;
      otherMenuItem.element
          .classList[isThisItem ? 'add' : 'remove']('selected-menu-item');
      otherMenuItem.submenu.element.style.display =
          isThisItem ? 'block' : 'none';
    });
    // Select the currently-selected tool in this submenu, if one exists.
    if (!menuItem.submenu.allItems) {
      menuItem.submenu.allItems = menuItem.submenu.items;
    }
    menuItem.submenu.allItems.forEach(submenuItem => {
      if (submenuItem.isSelected) {
        this.selectSubmenuItem_(submenuItem);
      }
    });
  }

  selectSubmenuItem_(submenuItem) {
    if (submenuItem.element.classList.contains('disabled-menu-item')) {
      alert('This is a read-only view of this map; fork to edit.');
      return;
    }
    if (!submenuItem.callback) {
      // This isn't an interactive item.
      return;
    }
    if (submenuItem.type == 'tool') {
      state.gesture = null;
      submenuItem.parent.submenu.allItems.forEach(otherSubmenuItem => {
        const isThisItem = submenuItem == otherSubmenuItem;
        otherSubmenuItem.isSelected = isThisItem;
        otherSubmenuItem.element
            .classList[isThisItem && otherSubmenuItem.type == 'tool' ?
                'add' : 'remove']('selected-submenu-item');
      });
      if (submenuItem.parent.presentation == 'selected child') {
        this.updateItem_(submenuItem.parent);
      }
      if (submenuItem.parent.parent &&
          submenuItem.parent.parent.presentation == 'selected child') {
        this.updateItem_(submenuItem.parent.parent);
      }
    }
    submenuItem.callback();
  }

  createWallTool_(size, isManual, isSelected) {
    const descriptionCells = [];
    if (size > 1 || isManual) {
      descriptionCells.push({
        innerHTML: size > 1 ? `${size}x${size}` : 'Man-<br/>ual',
        classNames: [
          'grid-cell',
          'primary-cell',
          'text-cell',
        ],
      });
    }
    return {
      name: `Wall/floor, ${size}x${size}`,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-walls'],
      isSelected,
      callback: () => {
        state.gesture = new WallGesture(size, isManual);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'wall-cell',
          ],
        },
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
      ].concat(descriptionCells),
    };
  }

  createNoncardinalWallTool_(kind, variation) {
    const kindClassNames = kind.id == ct.shapes.square.id ? [
      'square-cell-0',
      'square-cell-primary',
    ] : [
      'circle-cell-0',
      'circle-cell-primary',
    ];
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-walls'],
      isSelected: false,
      callback: () => {
        state.gesture = new NoncardinalWallGesture(ct.walls, kind, variation);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'shape-cell',
          ].concat(kindClassNames).concat(variation.classNames),
        },
      ],
    };
  }

  createDoorTool_(name, variation, isSelected) {
    let doorClassName = '';
    switch (variation.id) {
      case ct.doors.door.double.id:
        doorClassName = 'double-door-cell-vertical';
        break;
      case ct.doors.door.secret.id:
        doorClassName = 'secret-door-cell';
        break;
    }
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-doors'],
      isSelected,
      callback: () => {
        state.gesture = new DoorGesture(variation);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          classNames: [
            'grid-cell',
            'vertical-cell',
            'wall-cell',
          ],
        },
        {
          classNames: [
            'vertical-cell',
            'door-cell',
            'door-cell-vertical',
          ].concat([doorClassName]),
        },
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
      ],
    };
  }

  createTextTool_() {
    return {
      name: 'Text',
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-text'],
      isSelected: true,
      callback: () => {
        state.gesture = new TextGesture();
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          innerHTML: 'Text',
          classNames: [
            'grid-cell',
            'primary-cell',
            'text-cell',
          ],
        },
      ],
    };
  }

  createImageTool_() {
    return {
      name: 'Images',
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-images'],
      isSelected: true,
      callback: () => {
        state.gesture = new ImageGesture(
            ct.images,
            ct.images.image,
            ct.images.image.background,
            'assets/wyvern.svg',
            true);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          innerHTML: '<img src="assets/wyvern.svg">',
          classNames: [
            'grid-cell',
            'primary-cell',
            'image-cell',
          ],
        },
      ],
    };
  }

  createShapeTool_(name, kind, variation, isSelected) {
    const kindClassNames = kind.id == ct.shapes.square.id ? [
      'square-cell-0',
      'square-cell-primary',
    ] : [
      'circle-cell-0',
      'circle-cell-primary',
    ];
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-shapes'],
      isSelected,
      callback: () => {
        state.gesture =
          new ShapeGesture(ct.shapes, kind, variation);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'shape-cell',
          ].concat(kindClassNames).concat(variation.classNames),
        },
      ],
    };
  }

  createStairsTool_(name, kind, isSelected) {
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-stairs'],
      isSelected,
      callback: () => {
        state.gesture = new ImageGesture(
            ct.stairs,
            kind,
            kind.generic,
            false);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          innerHTML: `<img src=${kind.generic.imagePath} >`,
          classNames: [
            'grid-cell',
            'primary-cell',
            'stairs-cell',
          ],
        },
      ],
    };
  }

  showShareDialog_(mid, secret) {
    if (!mid) {
      alert('Cannot share empty map.');
      return;
    }
    const loc = window.location;
    const pageUrl =
        `${loc.protocol}//${loc.hostname}:${loc.port}${loc.pathname}`;
    let url = `${pageUrl}?mid=${encodeURIComponent(mid)}`;
    let message = 'URL to a read-only view of this map.';
    if (secret) {
      url = `${url}&secret=${encodeURIComponent(secret)}`;
      message = 'URL to a writable version of this map.';
    }
    window.prompt(message, url);
  }

  createTokenSelector_() {
    const selector = {
      name: 'Find by name',
      type: 'textarea',
      id: 'tokenSelector',
      classNames: ['menu-textarea'],
      presentation: 'input',
      datalistId: 'gameIcons',
      rows: 1,
      enabledInReadonlyMode: false,
      submenu: {},
    };
    selector.onInput = (oldText, newText) => {
      this.updateTokenSelectorSubmenu_(selector, newText);
    };
    // Completions. Disable until a more intuitive solution is in place, for
    // example having both a category drop-down AND a free-text filter.
//    const completions = new Set();
//    this.gameIcons_.forEach(icon => {
//      // Disabling this for now, it leads to too many items:
//      //completions.add(icon.name);
//      icon.tags.forEach(tag => completions.add(tag));
//    });
//    const datalist = document.createElement('datalist');
//    datalist.id = selector.datalistId;
//    completions.forEach(completion => {
//      const option = document.createElement('option');
//      option.value = completion;
//      datalist.appendChild(option);
//    });
//    document.getElementById('app').appendChild(datalist);
    return selector;
  }

  createTokenButtons_() {
    return [
      this.createTokenButton_(
          this.gameIcons_.find(icon => icon.name == 'wyvern')),
    ];
  }

  createTokenButton_(gameIcon) {
    const path = gameIcon.path.replace('public/app/', '');
    return {
      name: gameIcon.name.replace('-', ' '),
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-tokens'],
      isSelected: gameIcon.name == 'wyvern',
      id: 'token_' + gameIcon.name,
      callback: () => {
        state.gesture = new ImageGesture(
            ct.images,
            ct.images.image,
            ct.images.image.background,
            path,
            false,
            gameIcon.hash);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'floor-cell',
          ],
        },
        {
          innerHTML: `<img src="${path}">`,
          classNames: [
            'grid-cell',
            'primary-cell',
            'image-cell',
          ],
        },
      ],
    };
  }

  updateTokenSelectorSubmenu_(selector, text) {
    if (!selector.submenu.element) {
      selector.submenu.element =
          createAndAppendDivWithClass(selector.parent.submenu.element, 'selector-submenu');
    }
    this.selectSubmenuItem_(selector.parent.submenu.items[1]);
    if (text.length < 2) {
      selector.submenu.element.style.display = 'none';
      return;
    }

    selector.submenu.element.innerHTML = '';
    let matchingIcons = text.length < 2 ? [] :
        this.gameIcons_.filter(gameIcon => this.iconNameMatch_(gameIcon, text));
    matchingIcons = matchingIcons.slice(0, 200);
    const buttons = matchingIcons.map(icon => this.createTokenButton_(icon));
    selector.submenu.items = buttons;
    selector.submenu.allItems =
        buttons.concat(selector.parent.submenu.items.slice(1));
    this.populateMenuItem_(selector);
    selector.parent.submenu.allItems = selector.submenu.allItems;
    selector.submenu.element.style.display = 'block';
  }

  iconNameMatch_(gameIcon, text) {
    return gameIcon.name.includes(text) ||
        gameIcon.tags.find(tag => tag.includes(text));
  }

  setupMenuItems_() {
    // Format is:
    // [
    //   {
    //     name: 'Menu item name',
    //     presentation: 'icon' | 'selected child',
    //     [id: 'element-id',]
    //     [materialIcon: 'icon_name',]
    //     [tip: 'Long text displayed in submenu',]
    //     [isSelected: true,]
    //     [classNames: ['classname1', 'classname2'],]
    //     [enabledInReadonlyMode: true,]
    //     submenu: {
    //       items: [
    //         {
    //           name: 'Submenu item name',
    //           type: 'label' | 'button' | 'tool',
    //           presentation: 'icon' | 'cells' | 'label',
    //           [id: 'element-id',]
    //           [materialIcon: 'icon_name',]
    //           [isSelected: true,]
    //           [classNames: ['classname1', 'classname2'],]
    //           [enabledInReadonlyMode: true,]
    //           [text: 'text',]
    //           [callback: () => {...},]
    //           [cells: [
    //             {
    //               classNames: ['classname1', 'classname2'],
    //               innerHTML: '...',
    //             },
    //           ],]
    //         },
    //       ],
    //     },
    //   },
    // ]
    return [
      {
        name: 'Status',
        presentation: 'icon',
        id: 'statusIcon',
        materialIcon: 'swap_vertical_circle',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Status',
              type: 'label',
              presentation: 'label',
              id: 'statusText',
              enabledInReadonlyMode: true,
            },
          ],
        },
      },
      {
        name: 'Info',
        presentation: 'icon',
        materialIcon: 'error_outline',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Title',
              type: 'textarea',
              id: 'mapTitle',
              classNames: ['menu-textarea'],
              presentation: 'textarea',
              rows: 1,
              enabledInReadonlyMode: false,
              onChange: (oldText, newText) => {
                state.opCenter.recordDescChange('title', oldText, newText);
                state.opCenter.recordOperationComplete();
              }
            },
            {
              name: 'Description',
              type: 'textarea',
              id: 'mapLongDesc',
              classNames: ['menu-textarea'],
              rows: 2,
              presentation: 'textarea',
              enabledInReadonlyMode: false,
              onChange: (oldText, newText) => {
                state.opCenter.recordDescChange('long', oldText, newText);
                state.opCenter.recordOperationComplete();
              }
            },
            {
              name: 'Created on',
              type: 'label',
              id: 'createdOn',
              presentation: 'label',
              enabledInReadonlyMode: true,
              text: 'Map not yet created',
            },
          ],
        },
      },
      {
        name: 'Share',
        presentation: 'icon',
        materialIcon: 'share',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Read-only URL',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'lock',
              enabledInReadonlyMode: true,
              callback: () => {
                this.showShareDialog_(state.getMid(), null);
              },
            },
            {
              name: 'Read-write URL',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'lock_open',
              callback: () => {
                const secret = state.getSecret();
                if (!secret) {
                  alert('Cannot share a writable version of a read-only map.');
                  return;
                }
                this.showShareDialog_(state.getMid(), state.getSecret());
              },
            },
            {
              name: 'Fork',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'call_split',
              enabledInReadonlyMode: true,
              callback: () => {
                state.opCenter.fork();
              },
            },
            {
              name: 'Download PNG',
              type: 'button',
              presentation: 'label',
              text: 'PNG',
              enabledInReadonlyMode: true,
              callback: () => {
                const overlay =
                    createAndAppendDivWithClass(document.body, 'modal-overlay');
                overlay.textContent = 'Constructing PNG...';
                setTimeout(() => {
                  domtoimage.toBlob(document.getElementById('theMap'))
                      .then(blob => {
                    saveAs(blob, 'mipui.png');
                    overlay.parentElement.removeChild(overlay);
                  }).catch(() => {
                    overlay.parentElement.removeChild(overlay);
                  });
                }, 10);
              },
            },
            {
              name: 'Download SVG',
              type: 'button',
              presentation: 'label',
              text: 'SVG',
              enabledInReadonlyMode: true,
              callback: () => {
                const overlay =
                    createAndAppendDivWithClass(document.body, 'modal-overlay');
                overlay.textContent = 'Constructing SVG...';
                setTimeout(() => {
                  domtoimage.toSvg(document.getElementById('theMap'))
                      .then(dataUrl => {
                    const blob = new Blob([dataUrl.substr(33)], {type: "image/svg+xml"});
                    saveAs(blob, 'mipui.svg');
                    overlay.parentElement.removeChild(overlay);
                  }).catch(() => {
                    overlay.parentElement.removeChild(overlay);
                  });
                }, 10);
              },
            },
          ],
        },
      },
      {
        name: 'View',
        presentation: 'icon',
        materialIcon: 'search',
        enabledInReadonlyMode: true,
        tip: 'Pan with middle mouse button or touch pan, zoom with mousewheel or pinch.',
        submenu: {
          items: [
            {
              name: 'Reset view',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'zoom_out_map',
              enabledInReadonlyMode: true,
              callback: () => {
                resetView();
              },
            },
          ],
        },
      },
      {
        name: 'Grid',
        presentation: 'icon',
        materialIcon: 'grid_on',
        tip: '',
        submenu: {
          items: [
            {
              name: 'Reset grid',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'delete',
              callback: () => {
                resetGrid();
              },
            },
            {
              name: 'Expand grid',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'settings_overscan',
              callback: () => {
                expandGrid(2);
              },
            },
          ],
        },
      },
      {
        name: 'Walls',
        presentation: 'selected child',
        tip: 'Add a wall by clicking a divider cell between two floor cells.',
        isSelected: true,
        submenu: {
          items: [
            this.createWallTool_(1, false, true),
            this.createWallTool_(3, false, false),
            this.createWallTool_(5, false, false),
            this.createWallTool_(7, false, false),
            this.createWallTool_(9, false, false),
            this.createWallTool_(1, true, false),
            this.createNoncardinalWallTool_(ct.walls.smooth, ct.walls.smooth.angled),
          ],
        },
      },
      {
        name: 'Doors',
        presentation: 'selected child',
        tip: 'Drag when placing to create a multi-cell door.',
        classNames: ['menu-doors'],
        submenu: {
          items: [
            this.createDoorTool_('Single door', ct.doors.door.single, true),
            this.createDoorTool_('Double door', ct.doors.door.double, false),
            this.createDoorTool_('Secret door', ct.doors.door.secret, false),
          ],
        },
      },
      {
        name: 'Text',
        presentation: 'selected child',
        tip: 'Drag when placing to stretch across multiple cells.',
        submenu: {
          items: [
            this.createTextTool_(),
          ],
        },
      },
      {
        name: 'Tokens',
        presentation: 'selected child',
        tip: 'Drag when placing to stretch across multiple cells.',
        submenu: {
          items: [this.createTokenSelector_()]
              .concat(this.createTokenButtons_()),
        },
      },
      {
        name: 'Shapes',
        presentation: 'selected child',
        submenu: {
          items: [
            this.createShapeTool_('Green square', ct.shapes.square, ct.shapes.square.green, true),
            this.createShapeTool_('Green circle', ct.shapes.circle, ct.shapes.square.green, false),
            this.createShapeTool_('Brown square', ct.shapes.square, ct.shapes.square.brown, false),
            this.createShapeTool_('Brown circle', ct.shapes.circle, ct.shapes.square.brown, false),
            this.createShapeTool_('Blue square', ct.shapes.square, ct.shapes.square.blue, false),
            this.createShapeTool_('blue circle', ct.shapes.circle, ct.shapes.square.blue, false),
            this.createShapeTool_('Red square', ct.shapes.square, ct.shapes.square.red, false),
            this.createShapeTool_('Red circle', ct.shapes.circle, ct.shapes.square.red, false),
            this.createShapeTool_('White square', ct.shapes.square, ct.shapes.square.white, false),
            this.createShapeTool_('White circle', ct.shapes.circle, ct.shapes.square.white, false),
          ],
        },
      },
      {
        name: 'Stairs',
        presentation: 'selected child',
        tip: 'Drag when placing to stretch across multiple cells.',
        classNames: ['menu-stairs'],
        submenu: {
          items: [
            this.createStairsTool_('Horizontal stairs', ct.stairs.horizontal, true),
            this.createStairsTool_('Vertical stairs', ct.stairs.vertical, false),
            this.createStairsTool_('Spiral stairs', ct.stairs.spiral, false),
          ],
        },
      },
    ];
  }
}
