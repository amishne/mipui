class Menu {
  constructor() {
    this.gameIcons_ = gameIcons;
    this.groups_ = {
      shapeKindTools: {
        selectedKind: ct.shapes.square,
        items: [],
      },
      shapeVariationTools: {
        selectedVariation: ct.shapes.square.green,
        items: [],
      },
      imageIconTools: {
        selectedIcon: gameIcons.find(icon => icon.name == 'wyvern'),
        items: [],
      },
      imageVariationTools: {
        selectedVariation: ct.images.image.black,
        items: [],
      },
    };
    this.tokenSelector_ = null;
    this.tokenSelectedCategory_ = '<all>';
    this.tokenSelectedText_ = '';
    this.menuItems_ = this.setupMenuItems_();
  }

  createMenu() {
    const containerElement = document.getElementById('menuContainer');
    const menuElement = createAndAppendDivWithClass(containerElement, 'menu');
    //    menuElement.onwheel = (e) => e.stopPropagation();
    //    menuElement.onmousemove = (e) => e.stopPropagation();
    //    menuElement.ontouchstart = (e) => e.stopPropagation();
    //    menuElement.ontouchmove = (e) => e.stopPropagation();
    //    menuElement.ontouchend = (e) => e.stopPropagation();

    const topElement = createAndAppendDivWithClass(menuElement, 'menu-top');
    const bottomElement =
        createAndAppendDivWithClass(menuElement, 'menu-bottom');
    this.createMenuItems_(topElement, bottomElement);
  }

  setToInitialSelection() {
    const selectedMenuItem =
        this.menuItems_.find(menuItem => menuItem.isSelected);
    if (selectedMenuItem) {
      // Toggle it off so that the selection will toggle it on properly.
      selectedMenuItem.isSelected = false;
      this.selectMenuItem_(selectedMenuItem);
    }
  }

  descChanged() {
    document.querySelector('#mapTitle textarea').value =
        state.getProperty(pk.title);
    document.querySelector('#mapLongDesc textarea').value =
        state.getProperty(pk.longDescription);
    document.querySelector('#mapTheme select').selectedIndex =
        state.getProperty(pk.theme);
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
    const container =
        createAndAppendDivWithClass(parent, 'menu-item-container');
    const element =
        createAndAppendDivWithClass(
            container,
            'menu-item ' + ((item.classNames || []).join(' ') || ''));
    if (item.name) {
      const elementLabel =
          createAndAppendDivWithClass(container, 'menu-item-label');
      elementLabel.innerText = item.name;
      element.title = item.name;
    }
    if (item.id) element.id = item.id;
    element.onclick = callback;
    item.element = element;
    if (item.group) {
      item.group.items.push(item);
    }
    this.updateItem_(item);
  }

  createSeparator_() {
    return {
      presentation: 'separator',
      classNames: ['menu-separator'],
    };
  }

  updateItem_(item) {
    if (!item.enabledInReadonlyMode) {
      item.element.classList.add('disabled-in-read-only-mode');
    }
    let cells = null;
    let deferredSvg = null;
    switch (item.presentation) {
      case 'icon':
        const image = document.createElement('img');
        item.element.classList.add('menu-icon');
        if (item.materialIcon) {
          image.src = `assets/ic_${item.materialIcon}_white_24px.svg`;
        } else if (item.icon) {
          image.src = item.icon;
          image.style.height = '24px';
          image.style.width = '24px';
        }
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
        const selectedChild =
            item.submenu.allItems.find(item => item.isSelected);
        cells = selectedChild.cells;
        deferredSvg = selectedChild.deferredSvg;
        item.element.className = 'menu-item';
        if (item.isSelected) item.element.classList.add('selected-menu-item');
        item.element.classList.add(...selectedChild.classNames);
        // Intentional fallthrough.
      case 'cells':
        item.element.innerHTML = '';
        this.createCellsForItem_(item.element, cells || item.cells);
        deferredSvg = deferredSvg || item.deferredSvg;
        if (deferredSvg) {
          const xhr = new XMLHttpRequest();
          xhr.open('get', deferredSvg.path, true);
          xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            const svgElement = xhr.responseXML.documentElement;
            svgElement.classList.add('image');
            svgElement.classList.add(...deferredSvg.classNames);
            const element = item.element.children[deferredSvg.childNum];
            element.innerHTML = '';
            element.appendChild(svgElement);
          };
          xhr.send();
        }
        break;
      case 'input':
      case 'textarea':
        const textarea = document.createElement(
            item.presentation == 'input' ? 'input' : 'textarea');
        if (item.presentation == 'textarea') {
          textarea.rows = item.rows;
        }
        if (item.rows == '1' || item.presentation == 'input') {
          textarea.classList.add('menu-input-element');
        }
        textarea.classList.add('menu-textarea-input');
        if (item.datalistId) {
          textarea.setAttribute('list', item.datalistId);
        }
        item.element.appendChild(textarea);
        item.oldText = '';
        if (item.onChange) {
          textarea.onchange = () => {
            item.onChange(item.oldText, textarea.value);
            item.oldText = textarea.value;
          };
        }
        if (item.onInput) {
          textarea.oninput = () => {
            item.onInput(item.oldText, textarea.value);
            item.oldText = textarea.value;
          };
        }
        break;
      case 'dropdown':
        const select = document.createElement('select');
        item.element.appendChild(select);
        select.classList.add('menu-select-element');
        item.dropdownValues.forEach((dropdownValue, index) => {
          const option = document.createElement('option');
          option.textContent = dropdownValue;
          if (index == 0) option.selected = true;
          select.add(option);
        });
        if (item.onChange) {
          select.onchange = event => item.onChange(event.target.selectedIndex);
        }
        break;
    }
  }

  createCellsForItem_(parent, cells) {
    cells.forEach(cell => {
      const element =
          createAndAppendDivWithClass(parent, cell.classNames.join(' '));
      element.innerHTML = cell.innerHTML || '';
      if (cell.children) this.createCellsForItem_(element, cell.children);
    });
  }

  selectMenuItem_(menuItem) {
    if (menuItem.element.classList.contains('disabled-menu-item')) {
      alert('This is a read-only view of this map; fork to edit.');
      return;
    }
    if (menuItem.isSelected &&
        menuItem.submenu.element.style.display != 'none') {
      // If it's already selected, just hide its content.
      menuItem.submenu.element.style.display = 'none';
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
        if (submenuItem.group != otherSubmenuItem.group) return;
        const isThisItem = submenuItem == otherSubmenuItem;
        otherSubmenuItem.isSelected = isThisItem;
        otherSubmenuItem.element
            .classList[isThisItem && otherSubmenuItem.type == 'tool' ?
              'add' : 'remove']('selected-submenu-item');
      });
    }
    submenuItem.callback();
    if (submenuItem.type == 'tool') {
      if (submenuItem.parent.presentation == 'selected child') {
        this.updateItem_(submenuItem.parent);
      }
      if (submenuItem.parent.parent &&
          submenuItem.parent.parent.presentation == 'selected child') {
        this.updateItem_(submenuItem.parent.parent);
      }
    }
  }

  createSeparatorTool_(name, kind, variation, requiredWall, isSelected) {
    const separatorClassNames = [];
    switch (kind.id) {
      case ct.separators.door.id:
        separatorClassNames.push('door-cell');
        break;
      case ct.separators.window.id:
        separatorClassNames.push('window-cell');
        separatorClassNames.push('window-cell-vertical');
        break;
      case ct.separators.bars.id:
        separatorClassNames.push('bars-cell-vertical');
        break;
      case ct.separators.fence.id:
        separatorClassNames.push('fence-cell-vertical');
        break;
      case ct.separators.curtain.id:
        separatorClassNames.push('curtain-cell-vertical');
        break;
    }
    switch (variation.id) {
      case ct.separators.door.double.id:
        separatorClassNames.push('double-door-cell-vertical');
        break;
      case ct.separators.door.secret.id:
        separatorClassNames.push('secret-door-cell');
        break;
    }
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-separators'],
      isSelected,
      callback: () => {
        state.gesture = new SeparatorGesture(kind, variation, requiredWall);
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
            requiredWall ? 'wall-cell' : 'floor-cell',
            requiredWall ? 'square-wall-cell' : '',
          ],
        },
        {
          innerHTML:
              variation.imagePath ? `<img src=${variation.imagePath} >` : '',
          classNames: [
            'vertical-cell',
            'separator-cell',
          ].concat(separatorClassNames),
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

  updateShapeTool_(item, kind, variation) {
    item.callback = () => {
      state.gesture = new ShapeGesture(ct.shapes, kind, variation);
      if (item.group == this.groups_.shapeKindTools) {
        this.groups_.shapeVariationTools.items.forEach(shapeVariationItem => {
          this.updateShapeTool_(
              shapeVariationItem, kind, shapeVariationItem.variation);
        });
      } else {
        this.groups_.shapeKindTools.items.forEach(shapeKindItem => {
          this.updateShapeTool_(shapeKindItem, shapeKindItem.kind, variation);
        });
      }
    };

    const kindClassNames = kind.id == ct.shapes.square.id ? [
      'square-cell-0',
      'square-cell-primary',
    ] : [
      'circle-cell-0',
      'circle-cell-primary',
    ];
    item.cells = [{
      classNames: [
        'grid-cell',
        'primary-cell',
        'floor-cell',
      ],
    }, {
      classNames: [
        'grid-cell',
        'primary-cell',
        'shape-cell',
      ].concat(kindClassNames).concat(variation.classNames),
    }];
    if (item.element) {
      this.updateItem_(item);
    }
  }

  createShapeTool_(name, kind, variation, group, isSelected) {
    const item = {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-shapes'],
      group,
      isSelected,
      kind,
      variation,
    };
    this.updateShapeTool_(item, kind, variation);
    return item;
  }

  createShapeKindTool_(name, kind, isSelected) {
    const variation = this.groups_.shapeVariationTools.selectedVariation;
    this.groups_.shapeKindTools.selectedKind = kind;
    return this.createShapeTool_(
        name, kind, variation, this.groups_.shapeKindTools, isSelected);
  }

  createShapeVariationTool_(name, variationName, isSelected) {
    const kind = this.groups_.shapeKindTools.selectedKind;
    const variation = kind[variationName];
    this.groups_.shapeVariationTools.selectedVariation = variation;
    return this.createShapeTool_(
        name, kind, variation, this.groups_.shapeVariationTools, isSelected);
  }

  createStairsTool_(name, kind, variation, isSelected) {
    const kindClassNames = kind.classNames || [];
    const variationClassNames = variation.classNames || [];
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-stairs'],
      isSelected,
      callback: () => {
        state.gesture = new StaticBoxGesture(ct.stairs, kind, variation);
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
            'stairs-cell',
          ].concat(kindClassNames).concat(variationClassNames),
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

  createTokenCategoryDropdown_() {
    const valueSet = new Set();
    this.gameIcons_.forEach(gameIcon => {
      gameIcon.tags.forEach(tag => valueSet.add(tag));
    });
    const values = Array.from(valueSet).concat('<all>');
    values.sort();
    return {
      name: 'Category',
      type: 'inputContainer',
      presentation: 'dropdown',
      classNames: ['menu-input-container'],
      id: 'tokenCategory',
      dropdownValues: values,
      enabledInReadonlyMode: false,
      onChange: newChoiceNum => {
        this.tokenSelectedCategory_ = values[newChoiceNum];
        this.updateTokenSelectorSubmenu_();
      },
    };
  }

  createTokenSelector_() {
    const selector = {
      name: 'Find by name',
      type: 'inputContainer',
      id: 'tokenSelector',
      classNames: ['menu-textarea', 'menu-input-container'],
      presentation: 'input',
      datalistId: 'gameIcons',
      rows: 1,
      enabledInReadonlyMode: false,
      submenu: {},
    };
    selector.onInput = (oldText, newText) => {
      this.tokenSelectedText_ = newText;
      this.updateTokenSelectorSubmenu_();
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
    this.tokenSelector_ = selector;
    return selector;
  }

  updateImageTool_(item, gameIcon, variation) {
    const path = gameIcon.path.replace('public/app/', '');
    item.callback = () => {
      this.groups_.imageIconTools.selectedIcon = gameIcon;
      state.gesture = new ImageGesture(
          ct.images,
          ct.images.image,
          variation,
          path,
          false,
          gameIcon.hash);
      if (item.group == this.groups_.imageIconTools) {
        this.groups_.imageIconTools.selectedIcon = gameIcon;
        this.groups_.imageVariationTools.items.forEach(variationItem => {
          this.updateImageTool_(
              variationItem, gameIcon, variationItem.variation);
        });
      } else {
        this.groups_.imageVariationTools.selectedVariation = variation;
        this.groups_.imageIconTools.items.forEach(iconItem => {
          this.updateImageTool_(iconItem, iconItem.gameIcon, variation);
        });
      }
    };
    item.cells = [{
      classNames: [
        'grid-cell',
        'primary-cell',
        'floor-cell',
      ],
    }, {
      classNames: [
        'grid-cell',
        'primary-cell',
        'image-cell',
      ].concat(variation.classNames),
    }];
    item.deferredSvg = {
      path,
      classNames: variation.classNames,
      childNum: 1,
    };
    if (item.element) {
      this.updateItem_(item);
    }
  }

  createTokenButton_(gameIcon) {
    const item = {
      name: gameIcon.name.replace('-', ' '),
      type: 'tool',
      presentation: 'cells',
      group: this.groups_.imageIconTools,
      classNames: ['menu-tokens'],
      isSelected: false,
      id: 'token_' + gameIcon.name,
      gameIcon,
    };
    this.updateImageTool_(
        item, gameIcon, this.groups_.imageVariationTools.selectedVariation);
    return item;
  }

  updateTokenSelectorSubmenu_() {
    const selector = this.tokenSelector_;
    const text = this.tokenSelectedText_;
    const category = this.tokenSelectedCategory_;
    if (!selector.submenu.element) {
      selector.submenu.element =
          createAndAppendDivWithClass(
              selector.parent.submenu.element, 'selector-submenu');
    }
    this.selectSubmenuItem_(selector.parent.submenu.items[1]);
    if (category == '<all>' && text.length < 2) {
      selector.submenu.element.style.display = 'none';
      return;
    }

    selector.submenu.element.innerHTML = '';
    let matchingIcons = this.gameIcons_.filter(gameIcon => {
      if (category != '<all>' && !gameIcon.tags.includes(category)) {
        // Not in current category.
        return false;
      }
      if (gameIcon.name.includes(text)) return true;
      return category == '<all>' &&
          gameIcon.tags.some(tag => tag.includes(text));
    });
    matchingIcons = matchingIcons.slice(0, 200);
    const buttons = matchingIcons.map(icon => this.createTokenButton_(icon));
    selector.submenu.items = buttons;
    selector.submenu.allItems =
        buttons.concat(selector.parent.submenu.items.slice(2));
    this.populateMenuItem_(selector);
    selector.parent.submenu.allItems = selector.submenu.allItems;
    selector.submenu.element.style.display = 'block';
  }

  iconNameMatch_(gameIcon, text) {
    return gameIcon.name.includes(text) ||
        gameIcon.tags.find(tag => tag.includes(text));
  }

  createTokenColorTool_(name, variation, isSelected) {
    const gameIcon = this.groups_.imageIconTools.selectedIcon;
    const item = {
      name,
      type: 'tool',
      presentation: 'cells',
      group: this.groups_.imageVariationTools,
      classNames: ['menu-tokens'],
      isSelected,
      variation,
    };
    this.updateImageTool_(item, gameIcon, variation);
    return item;
  }

  createWallTool_(name, isSelected, callback, cellClasses, extraCells) {
    const createDividerRow = () => ({
      classNames: ['menu-wall-tool-cell-row'],
      children: [
        {classNames: ['corner-cell']},
        {classNames: ['horizontal-cell']},
        {classNames: ['corner-cell']},
        {classNames: ['horizontal-cell']},
        {classNames: ['corner-cell']},
      ],
    });
    const createPrimaryRow = () => ({
      classNames: ['menu-wall-tool-cell-row'],
      children: [
        {classNames: ['vertical-cell']},
        {classNames: ['primary-cell']},
        {classNames: ['vertical-cell']},
        {classNames: ['primary-cell']},
        {classNames: ['vertical-cell']},
      ],
    });
    const cells = [
      createDividerRow(),
      createPrimaryRow(),
      createDividerRow(),
      createPrimaryRow(),
      createDividerRow(),
    ];
    cells.forEach(cell => {
      cell.children.forEach(child => child.classNames.push('grid-cell'));
    });
    cellClasses.forEach((cellClass, index) => {
      cells[Math.floor(index / 5)]
          .children[index % 5].classNames.push(cellClass);
    });
    (extraCells || []).forEach(extraCell => {
      const index = extraCell.index;
      const parentCell = cells[Math.floor(index / 5)].children[index % 5];
      if (!parentCell.children) parentCell.children = [];
      parentCell.children.push({classNames: extraCell.classNames});
    });
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-wall-tool'],
      isSelected,
      callback,
      cells,
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
        name: 'File',
        presentation: 'icon',
        materialIcon: 'insert_drive_file',
        id: 'statusIconParent',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Status',
              presentation: 'icon',
              materialIcon: 'cloud_queue',
              classNames: ['menu-label'],
              id: 'statusIcon',
              enabledInReadonlyMode: true,
            },
            {
              name: 'New',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'create_new_folder',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('.', '_blank');
              },
            },
            {
              name: 'Share read-only',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'share',
              enabledInReadonlyMode: true,
              callback: () => {
                this.showShareDialog_(state.getMid(), null);
              },
            },
            {
              name: 'Share editable',
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
                alert('Forked!');
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
                  const scale = 2.1875;
                  const numColumns = (state.getProperty(pk.lastColumn) -
                      state.getProperty(pk.firstColumn)) - 1;
                  const numRows = (state.getProperty(pk.lastRow) -
                      state.getProperty(pk.firstRow)) - 1;
                  const width = scale * (2 + numColumns *
                      (state.theMap.cellWidth + 1 +
                      state.theMap.dividerWidth + 1));
                  const height = scale * (2 + numRows *
                      (state.theMap.cellHeight + 1 +
                      state.theMap.dividerHeight + 1));
                  const theMapElement = document.getElementById('theMap');
                  domtoimage.toBlob(theMapElement, {
                    style: {
                      transform: `matrix(${scale}, 0, 0, ${scale}, 0, 0)`,
                    },
                    width,
                    height,
                  }).then(blob => {
                    saveAs(blob, 'mipui.png');
                    overlay.parentElement.removeChild(overlay);
                  }).catch(() => {
                    overlay.parentElement.removeChild(overlay);
                  });
                }, 10);
              },
            },
            {
              name: 'Download PNG of viewport',
              type: 'button',
              presentation: 'label',
              text: 'PNG (view)',
              enabledInReadonlyMode: true,
              callback: () => {
                const overlay =
                    createAndAppendDivWithClass(document.body, 'modal-overlay');
                overlay.textContent = 'Constructing PNG...';
                setTimeout(() => {
                  const appElement = document.getElementById('app');
                  const theMapElement = document.getElementById('theMap');
                  domtoimage.toBlob(theMapElement, {
                    width: appElement.clientWidth,
                    height: appElement.clientHeight,
                  }).then(blob => {
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
                  const numColumns = (state.getProperty(pk.lastColumn) -
                      state.getProperty(pk.firstColumn)) - 1;
                  const numRows = (state.getProperty(pk.lastRow) -
                      state.getProperty(pk.firstRow)) - 1;
                  const width = 2 + numColumns *
                      (state.theMap.cellWidth + 1 +
                      state.theMap.dividerWidth + 1);
                  const height = 2 + numRows *
                      (state.theMap.cellHeight + 1 +
                      state.theMap.dividerHeight + 1);
                  const theMapElement = document.getElementById('theMap');
                  domtoimage.toSvg(theMapElement, {
                    style: { transform: '' },
                    width,
                    height,
                  }).then(dataUrl => {
                    const blob =
                        new Blob([dataUrl.substr(33)], {type: 'image/svg+xml'});
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
        name: 'Info',
        presentation: 'icon',
        materialIcon: 'error_outline',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Title',
              type: 'inputContainer',
              id: 'mapTitle',
              classNames: ['menu-textarea', 'menu-input-container'],
              presentation: 'textarea',
              rows: 1,
              enabledInReadonlyMode: false,
              onChange: (oldText, newText) => {
                state.setProperty(pk.title, newText, true);
                state.opCenter.recordOperationComplete();
              },
            },
            {
              name: 'Description',
              type: 'inputContainer',
              id: 'mapLongDesc',
              classNames: ['menu-textarea', 'menu-input-container'],
              rows: 2,
              presentation: 'textarea',
              enabledInReadonlyMode: false,
              onChange: (oldText, newText) => {
                state.setProperty(pk.longDescription, newText, true);
                state.opCenter.recordOperationComplete();
              },
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
        name: 'Select',
        presentation: 'icon',
        materialIcon: 'select_all',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'Select Region',
              type: 'tool',
              presentation: 'icon',
              materialIcon: 'fullscreen',
              enabledInReadonlyMode: true,
              isSelected: true,
              callback: () => {
                state.gesture = new RegionSelectGesture();
              },
            },
            {
              name: 'Magic Wand Selection',
              type: 'tool',
              presentation: 'icon',
              materialIcon: 'flare',
              callback: () => {
                state.gesture = new MagicWandSelectGesture();
              },
            },
            {
              name: 'Invert Selection',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'fullscreen_exit',
              enabledInReadonlyMode: true,
              callback: () => {
                if (state.gesture instanceof SelectGesture) {
                  state.gesture.invert();
                } else {
                  alert('Only valid when something is selected.');
                }
              },
            },
            {
              name: 'Cut',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'content_cut',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof SelectGesture) {
                  state.gesture.cut();
                } else {
                  alert('Only valid when something is selected.');
                }
              },
            },
            {
              name: 'Copy',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'content_copy',
              enabledInReadonlyMode: true,
              callback: () => {
                if (state.gesture instanceof SelectGesture) {
                  state.gesture.copy();
                } else {
                  alert('Only valid when something is selected.');
                }
              },
            },
            {
              name: 'Paste',
              type: 'tool',
              presentation: 'icon',
              materialIcon: 'content_paste',
              enabledInReadonlyMode: false,
              callback: () => {
                state.gesture = new PasteGesture();
              },
            },
            {
              name: 'Delete Selection',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'clear',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof SelectGesture) {
                  state.gesture.deleteSelection();
                } else {
                  alert('Only valid when something is selected.');
                }
              },
            },
            /*
            {
              name: 'Rotate Left',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'rotate_left',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof PasteGesture) {
                  state.gesture.rotateLeft();
                } else {
                  alert('Only valid when the paste tool is active.');
                }
              },
            },
            {
              name: 'Rotate Right',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'rotate_right',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof PasteGesture) {
                  state.gesture.rotateRight();
                } else {
                  alert('Only valid when the paste tool is active.');
                }
              },
            },
            {
              name: 'Flip Horizontally',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'flip',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof PasteGesture) {
                  state.gesture.flipForizontally();
                } else {
                  alert('Only valid when the paste tool is active.');
                }
              },
            },
            {
              name: 'Flip Vertically',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'flip',
              enabledInReadonlyMode: false,
              classNames: ['rotate-90'],
              callback: () => {
                if (state.gesture instanceof PasteGesture) {
                  state.gesture.flipVertically();
                } else {
                  alert('Only valid when the paste tool is active.');
                }
              },
            },
            */
          ],
        },
      },
      {
        name: 'Map',
        presentation: 'icon',
        materialIcon: 'grid_on',
        enabledInReadonlyMode: true,
        tip: 'Pan with middle mouse button or touch pad, ' +
            'zoom with mousewheel or pinch.',
        submenu: {
          items: [
            {
              name: 'Theme',
              type: 'inputContainer',
              presentation: 'dropdown',
              classNames: ['menu-input-container'],
              id: 'mapTheme',
              dropdownValues: themes.map(theme => theme.name),
              enabledInReadonlyMode: false,
              onChange: newChoiceNum => {
                state.setProperty(pk.theme, newChoiceNum, true);
                state.reloadTheme();
              },
            },
            {
              name: 'Zoom in',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'zoom_in',
              enabledInReadonlyMode: true,
              callback: () => {
                zoom({
                  x: 0,
                  y: 0,
                  deltaY: -1,
                });
              },
            },
            {
              name: 'Zoom out',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'zoom_out',
              enabledInReadonlyMode: true,
              callback: () => {
                zoom({
                  x: 0,
                  y: 0,
                  deltaY: 1,
                });
              },
            },
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
            {
              name: 'Undo',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'undo',
              callback: () => {
                state.opCenter.undo();
                state.opCenter.recordOperationComplete();
              },
            },
            {
              name: 'Redo',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'redo',
              callback: () => {
                state.opCenter.redo();
                state.opCenter.recordOperationComplete();
              },
            },
            {
              name: 'Clear map',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'delete',
              callback: () => {
                resetGrid();
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
            this.createWallTool_(
                'Wall (auto)',
                true,
                () => { state.gesture = new WallGesture(1, false); },
                new Array(3).fill('square-wall-cell')
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(new Array(3).fill('square-wall-cell'))
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(new Array(5).fill('square-wall-cell'))
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(new Array(3).fill('square-wall-cell'))
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(new Array(3).fill('square-wall-cell'))),
            this.createWallTool_(
                'Wall (manual)',
                false,
                () => { state.gesture = new WallGesture(1, true); },
                new Array(6).fill('floor-cell')
                    .concat(['square-wall-cell'])
                    .concat(new Array(5).fill('floor-cell'))
                    .concat(['square-wall-cell'])
                    .concat(new Array(3).fill('floor-cell'))
                    .concat(['square-wall-cell'])
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(['square-wall-cell'])
                    .concat(new Array(3).fill('floor-cell'))
                    .concat(['square-wall-cell'])
                    .concat(['floor-cell'])),
            this.createWallTool_(
                'Angled wall',
                false,
                () => { state.gesture = new AngledWallGesture(
                    ct.walls, ct.walls.smooth, ct.walls.smooth.angled); },
                new Array(2).fill('floor-cell')
                    .concat(['square-wall-cell'])
                    .concat(new Array(4).fill('floor-cell'))
                    .concat(['square-wall-cell'])
                    .concat(new Array(2).fill('floor-cell'))
                    .concat(new Array(3).fill('square-wall-cell'))
                    .concat(new Array(11).fill('floor-cell'))
                    .concat(['square-wall-cell']),
                [{
                  index: 6,
                  classNames: ['angled-wall-cell', 'angled-wall-cell-118'],
                }, {
                  index: 8,
                  classNames: ['angled-wall-cell', 'angled-wall-cell-200'],
                }, {
                  index: 16,
                  classNames: ['angled-wall-cell', 'angled-wall-cell-145'],
                }, {
                  index: 18,
                  classNames: ['angled-wall-cell', 'angled-wall-cell-160'],
                }]),
            this.createWallTool_(
                'Rectangle',
                false,
                () => { state.gesture = new SquareRoomGesture(false); },
                new Array(25).fill('square-wall-cell')),
            this.createWallTool_(
                'Ellipse',
                false,
                () => { state.gesture = new OvalRoomGesture(false); },
                new Array(25).fill('floor-cell'),
                new Array(25).fill(null).map((_, i) => {
                  // The corners are empty.
                  if (i == 0 || i == 4 || i == 20 || i == 24) return null;
                  const classNames = ['square-wall-cell'];
                  if (i == 7 || i == 11 || i == 12 || i == 13 || i == 17) {
                    // Do nothing; these are filled.
                  } else {
                    classNames.push('ellipse-cell-' + i);
                  }
                  return {
                    index: i,
                    classNames,
                  };
                }).filter(x => x != null)),
            this.createWallTool_(
                'Rectangular Room',
                false,
                () => { state.gesture = new SquareRoomGesture(true); },
                new Array(6).fill('square-wall-cell')
                    .concat(new Array(3).fill('floor-cell'))
                    .concat(new Array(2).fill('square-wall-cell'))
                    .concat(new Array(3).fill('floor-cell'))
                    .concat(new Array(2).fill('square-wall-cell'))
                    .concat(new Array(3).fill('floor-cell'))
                    .concat(new Array(6).fill('square-wall-cell'))),
            this.createWallTool_(
                'Elliptical Room',
                false,
                () => { state.gesture = new OvalRoomGesture(true); },
                new Array(25).fill('floor-cell'),
                new Array(25).fill(null).map((_, i) => {
                  // The corners are empty.
                  if (i == 0 || i == 4 || i == 20 || i == 24) return null;
                  const classNames = [];
                  if (i == 7 || i == 11 || i == 12 || i == 13 || i == 17) {
                    // Do nothing; these are empty.
                  } else {
                    classNames.push('square-wall-cell');
                    classNames.push('ellipse-hollow-cell-' + i);
                  }
                  return {
                    index: i,
                    classNames,
                  };
                }).filter(x => x != null)),
          ],
        },
      },
      {
        name: 'Separators',
        presentation: 'selected child',
        tip: 'Drag when placing to create a multi-cell separator.',
        classNames: ['menu-separators'],
        submenu: {
          items: [
            this.createSeparatorTool_('Single door', ct.separators.door,
                ct.separators.door.single, true, true),
            this.createSeparatorTool_('Double door', ct.separators.door,
                ct.separators.door.double, true, false),
            this.createSeparatorTool_('Secret door', ct.separators.door,
                ct.separators.door.secret, true, false),
            this.createSeparatorTool_('Window', ct.separators.window,
                ct.separators.window.generic, true, false),
            this.createSeparatorTool_('Bars', ct.separators.bars,
                ct.separators.bars.generic, false, false),
            this.createSeparatorTool_('Fence', ct.separators.fence,
                ct.separators.fence.generic, false, false),
            this.createSeparatorTool_('Curtain', ct.separators.curtain,
                ct.separators.curtain.generic, false, false),
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
          items: [
            this.createTokenCategoryDropdown_(),
            this.createTokenSelector_(),
            this.createTokenColorTool_('Black', ct.images.image.black, true),
            this.createTokenColorTool_('Green', ct.images.image.green),
            this.createTokenColorTool_('Brown', ct.images.image.brown),
            this.createTokenColorTool_('Blue', ct.images.image.blue),
            this.createTokenColorTool_('Red', ct.images.image.red),
          ],
        },
      },
      {
        name: 'Shapes',
        presentation: 'selected child',
        submenu: {
          items: [
            this.createShapeKindTool_('Square', ct.shapes.square, true),
            this.createShapeKindTool_('Circle', ct.shapes.circle),
            this.createSeparator_(),
            this.createShapeVariationTool_('Green', 'green', true),
            this.createShapeVariationTool_('Brown', 'brown'),
            this.createShapeVariationTool_('Blue', 'blue'),
            this.createShapeVariationTool_('Red', 'red'),
            this.createShapeVariationTool_('White', 'white'),
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
            this.createStairsTool_(
                'Horizontal stairs',
                ct.stairs.horizontal,
                ct.stairs.horizontal.generic,
                true),
            this.createStairsTool_(
                'Ascending left',
                ct.stairs.horizontal,
                ct.stairs.horizontal.ascendingLeft,
                false),
            this.createStairsTool_(
                'Ascending right',
                ct.stairs.horizontal,
                ct.stairs.horizontal.ascendingRight,
                false),
            this.createStairsTool_(
                'Vertical stairs',
                ct.stairs.vertical,
                ct.stairs.vertical.generic,
                true),
            this.createStairsTool_(
                'Ascending top',
                ct.stairs.vertical,
                ct.stairs.vertical.ascendingTop,
                false),
            this.createStairsTool_(
                'Ascending bottom',
                ct.stairs.vertical,
                ct.stairs.vertical.ascendingBottom,
                false),
            this.createStairsTool_(
                'Spiral stairs',
                ct.stairs.spiral,
                ct.stairs.spiral.generic,
                false),
          ],
        },
      },
      {
        name: 'Help',
        presentation: 'icon',
        materialIcon: 'help',
        tip: '',
        enabledInReadonlyMode: true,
        submenu: {
          items: [
            {
              name: 'About',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'help',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('../index.html', '_blank');
              },
            },
            {
              name: 'Feedback',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'bug_report',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('https://feedback.userreport.com' +
                    '/7e918812-4e93-4a8f-9541-9af34d0f4231/', '_blank');
              },
            },
            {
              name: 'Contact',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'email',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('mailto:contact@mipui.net', '_blank');
              },
            },
            {
              name: 'Source Code',
              type: 'button',
              presentation: 'icon',
              icon: 'assets/GitHub-Mark-Light-32px.png',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('https://github.com/amishne/mipui', '_blank');
              },
            },
            {
              name: 'Subreddit',
              type: 'button',
              presentation: 'icon',
              icon: 'assets/reddit_white.svg',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('https://reddit.com/r/Mipui/', '_blank');
              },
            },
          ],
        },
      },
    ];
  }
}
