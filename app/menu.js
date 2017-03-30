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
    if (!submenuItem.callback) {
      // This isn't an interactive item.
      return;
    }
    submenuItem.parent.submenu.items.forEach(otherSubmenuItem => {
      const isThisItem = submenuItem == otherSubmenuItem;
      otherSubmenuItem.isSelected = isThisItem;
      otherSubmenuItem.element
          .classList[isThisItem ? 'add' : 'remove']('selected-submenu-item');
    });
    if (submenuItem.parent.presentation == 'selected child') {
      this.updateItem_(submenuItem.parent);
    }
    submenuItem.callback();
  }

  createTerrainTool_() {
    return {
      name: 'Wall/floor',
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-terrain'],
      isSelected: true,
      callback: () => {
        state.gesture = new WallGesture();
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
        materialIcon: 'error_outline',
        submenu: {
          items: [
            {
              name: 'Status',
              type: 'label',
              presentation: 'text',
              id: 'status-text',
            },
          ],
        },
      },
      {
        name: 'View',
        presentation: 'icon',
        materialIcon: 'search',
        submenu: {
          items: [
            {
              name: 'Reset view',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'zoom_out_map',
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
            this.createTerrainTool_(),
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
    ];
  }
}
