class Menu {
  constructor() {
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

  createMenuItems_(topElement, bottomElement) {
    this.menuItems_.forEach(menuItem => {
      this.createMenuItem_(menuItem, topElement, bottomElement);
    });
  }

  createMenuItem_(menuItem, topElement, bottomElement) {
    const submenuElement =
        createAndAppendDivWithClass(bottomElement, 'submenu');
    menuItem.submenu.element = submenuElement;
    menuItem.submenu.items.forEach(submenuItem => {
      // Wire it to its parent.
      submenuItem.parent = menuItem;
      this.createItem_(submenuElement, submenuItem, () => {
        this.selectSubmenuItem_(submenuItem);
      });
    });
    const tipElement =
        createAndAppendDivWithClass(submenuElement, 'menu-tip');
    tipElement.textContent = menuItem.tip;
    this.createItem_(topElement, menuItem, () => {
      this.selectMenuItem_(menuItem);
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
        item.element.classList.add('material-icons');
        item.element.classList.add('menu-icon');
        item.element.textContent = item.materialIcon;
        break;
      case 'label':
        item.element.classList.add('menu-label');
        // textContent is dynamically set.
        break;
      case 'selected child':
        const selectedChild = item.submenu.items.find(item => item.isSelected);
        cells = selectedChild.cells;
        item.element.classList.add(...selectedChild.classNames);
        // Intentional fallthrough.
      case 'cells':
        item.element.innerHTML = '';
        this.createCellsForItem_(item.element, cells || item.cells);
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
      otherMenuItem.submenu.element.style.display = isThisItem ? 'flex' : 'none';
    });
    // Select the currently-selected tool in this submenu, if one exists.
    menuItem.submenu.items.forEach(submenuItem => {
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
    state.gesture = null;
    submenuItem.parent.submenu.items.forEach(otherSubmenuItem => {
      const isThisItem = submenuItem == otherSubmenuItem;
      otherSubmenuItem.isSelected = isThisItem;
      otherSubmenuItem.element
          .classList[isThisItem && otherSubmenuItem.type == 'tool' ?
              'add' : 'remove']('selected-submenu-item');
    });
    if (submenuItem.parent.presentation == 'selected child') {
      this.updateItem_(submenuItem.parent);
    }
    submenuItem.callback();
  }

  createTerrainTool_(size, isManual, isSelected) {
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
      classNames: ['menu-terrain'],
      isSelected,
      callback: () => {
        state.gesture = new WallGesture(size, isManual);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'terrain-cell',
            'wall-cell',
          ],
        },
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'terrain-cell',
            'floor-cell',
          ],
        },
      ].concat(descriptionCells),
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
            'terrain-cell',
            'floor-cell',
          ],
        },
        {
          classNames: [
            'grid-cell',
            'vertical-cell',
            'terrain-cell',
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
            'terrain-cell',
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
            'terrain-cell',
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
            'terrain-cell',
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
          new ShapeGesture(kind, variation);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'terrain-cell',
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
    let image = '';
    switch (kind.id) {
      case ct.stairs.horizontal.id:
        image = 'assets/stairs-horizontal.svg';
        break;
      case ct.stairs.vertical.id:
        image = 'assets/stairs-vertical.svg';
        break;
      case ct.stairs.spiral.id:
        image = 'assets/stairs-spiral.svg';
        break;
    }
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
            image,
            false);
      },
      cells: [
        {
          classNames: [
            'grid-cell',
            'primary-cell',
            'terrain-cell',
            'floor-cell',
          ],
        },
        {
          innerHTML: `<img src=${image} >`,
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
    //           type: 'label' | 'button' | 'tool'
    //           presentation: 'icon' | 'cells',
    //           [id: 'element-id',]
    //           [materialIcon: 'icon_name',]
    //           [isSelected: true,]
    //           [classNames: ['classname1', 'classname2'],]
    //           [enabledInReadonlyMode: true,]
    //           [callback: () => {...},],
    //           [cells: [
    //             {
    //               classNames: ['classname1', 'classname2'],
    //               innerHTML: '...',
    //             },
    //           ]]
    //         }
    //       ]
    //     }
    //   }
    // ]
    return [
      {
        name: 'Status',
        presentation: 'icon',
        id: 'status-icon',
        materialIcon: 'swap_vertical_circle',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Status',
              type: 'label',
              presentation: 'text',
              id: 'status-text',
              enabledInReadonlyMode: true,
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
          ],
        },
      },
      {
        name: 'View',
        presentation: 'icon',
        materialIcon: 'search',
        enabledInReadonlyMode: true,
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
        name: 'Terrain',
        presentation: 'selected child',
        tip: 'Add a wall by clicking a divider cell between two floor cells.',
        isSelected: true,
        submenu: {
          items: [
            this.createTerrainTool_(1, false, true),
            this.createTerrainTool_(3, false, false),
            this.createTerrainTool_(5, false, false),
            this.createTerrainTool_(7, false, false),
            this.createTerrainTool_(9, false, false),
            this.createTerrainTool_(1, true, false),
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
        name: 'Images',
        presentation: 'selected child',
        tip: 'Drag when placing to stretch across multiple cells.',
        submenu: {
          items: [
            this.createImageTool_(),
          ],
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
