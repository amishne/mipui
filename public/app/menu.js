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
    this.debugMenuItem_ = this.setupDebugMenuItem_();
    this.shortcuts_ = new Map();
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
      if (isTouchDevice) {
        // Hide it.
        this.selectMenuItem_(selectedMenuItem);
      }
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

  addDebugMenu() {
    this.menuItems_.push(this.debugMenuItem_);
    this.createMenuItem_(this.debugMenuItem_,
        document.getElementsByClassName('menu-top')[0],
        document.getElementsByClassName('menu-bottom')[0]);
  }

  createMenuItems_(topElement, bottomElement) {
    this.menuItems_.forEach(menuItem => {
      this.createMenuItem_(menuItem, topElement, bottomElement);
    });
  }

  createMenuItem_(menuItem, topElement, bottomElement) {
    if (menuItem.submenu) {
      const submenuElement =
          createAndAppendDivWithClass(bottomElement, 'submenu');
      menuItem.submenu.element = submenuElement;
      this.createItem_(topElement, menuItem, () => {
        this.selectMenuItem_(menuItem);
      });
      this.populateMenuItem_(menuItem);
      const tipElement =
          createAndAppendDivWithClass(submenuElement, 'menu-tip');
      tipElement.innerHTML = menuItem.tip || '';
    } else if (menuItem.callback) {
      this.createItem_(topElement, menuItem, () => {
        menuItem.callback();
      });
    }
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
      const regex = /&(\w)/;
      elementLabel.innerHTML =
          item.name.replace(regex, '<span class="menu-shortcut">$1</span>');
      const ampIndexMatch = regex.exec(item.name);
      if (ampIndexMatch) {
        const ampIndex = ampIndexMatch.index;
        this.shortcuts_.set(item.name[ampIndex + 1].toLowerCase(), item);
        element.title =
            item.name.slice(0, ampIndex) + item.name.slice(ampIndex + 1);
      }
    }
    if (item.id) element.id = item.id;
    element.onclick = callback;
    item.element = element;
    if (item.group) {
      item.group.items.push(item);
    }
    this.updateItem_(item);
  }

  keydown(key) {
    const menuItem = this.shortcuts_.get(key);
    if (menuItem) {
      // It's a shortcut! Shortcut behavior is as follows:
      // 1. If the current menu is not the active one, switch to it. If the
      //    current menu is hidden, also make the target menu hidden.
      // 2. If the current menu is the active one, go to the next available
      //    _tool_ in that menu. Leave the menu hidden status as-is.
      let display = '';
      if (menuItem.isSelected) {
        // If the current menu is shapes or tokens, and it's already selected,
        // do nothing.
        if (menuItem.name == 'S&hapes' || menuItem.name == 'To&kens') return;
        display = menuItem.submenu.element.style.display;
        const tools =
            menuItem.submenu.items.filter(item => item.type == 'tool');
        if (tools.length == 0) return;
        const selected = tools.findIndex(item => item.isSelected);
        this.selectSubmenuItem_(tools[(selected + 1) % tools.length]);
      } else {
        const hasTools =
            menuItem.submenu.items.findIndex(item => item.type == 'tool') >= 0;
        // If the target menu has no tools, 
        display = hasTools ?
          this.menuItems_.find(item => item.isSelected)
              .submenu.element.style.display : 'block';
        this.selectMenuItem_(menuItem);
      }
      menuItem.submenu.element.style.display = display;
    }
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
    switch (item.presentation) {
      case 'icon':
        this.updateIconItem_(item, item.materialIcon, item.icon);
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
        item.element.className = 'menu-item';
        if (item.isSelected) item.element.classList.add('selected-menu-item');
        item.element.classList.add(...(selectedChild.classNames || []));
        if (selectedChild.presentation == 'cells') {
          this.updateCellsItem_(
              item, selectedChild.cells, selectedChild.deferredSvg);
        } else if (selectedChild.presentation == 'icon_map') {
          this.updateIconMapItem_(item, selectedChild.iconMapRect);
        } else if (selectedChild.presentation == 'icon') {
          this.updateIconItem_(
              item, selectedChild.materialIcon, selectedChild.icon);
        }
        break;
      case 'cells':
        this.updateCellsItem_(item, item.cells, item.deferredSvg);
        break;
      case 'input':
      case 'textarea':
        const textarea = document.createElement(
            item.presentation == 'input' ? 'input' : 'textarea');
        // To prevent keydowns here from acting as shortcuts:
        textarea.onkeydown = e => e.stopPropagation();
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
      case 'icon_map':
        this.updateIconMapItem_(item, item.iconMapRect);
        break;
    }
  }

  updateIconMapItem_(item, iconMapRect) {
    item.element.innerHTML = '';
    item.element.classList.add('menu-icon');
    item.element.classList.add('menu-icon-from-map');
    const {x, y, size} = iconMapRect;
    const scale = 30 / size;
    item.element.style.backgroundImage =
        `url("${state.getMenuIconFile()}")`;
    item.element.style.backgroundPosition =
        `-${x * scale}px -${y * scale}px`;
    item.element.style.backgroundSize = `${716 * scale}px ${376 * scale}px`;
  }

  updateCellsItem_(item, cells, deferredSvg) {
    item.element.innerHTML = '';
    this.createCellsForItem_(item.element, cells);
    if (deferredSvg) {
      const xhr = new XMLHttpRequest();
      xhr.open('get', deferredSvg.path, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState != 4) return;
        const svgElement = xhr.responseXML.documentElement;
        svgElement.classList.add('image');
        svgElement.classList.add(...deferredSvg.classNames);
        Array.from(svgElement.children)
            .forEach(svgChild => svgChild.removeAttribute('fill'));
        const element = item.element.children[deferredSvg.childNum];
        element.innerHTML = '';
        element.appendChild(svgElement);
      };
      xhr.send();
    }
  }

  updateIconItem_(item, materialIcon, icon) {
    item.element.innerHTML = '';
    item.element.classList.remove('menu-icon');
    item.element.classList.remove('menu-icon-from-map');
    item.element.style = '';
    const image = document.createElement('img');
    item.element.classList.add('menu-icon');
    if (materialIcon) {
      image.src = `assets/ic_${materialIcon}_white_24px.svg`;
    } else if (icon) {
      image.src = icon;
      image.style.height = '24px';
      image.style.width = '24px';
    }
    item.element.appendChild(image);
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
      if (!otherMenuItem.submenu) return;
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

  createTextTool_(kind, variation, name, text) {
    const layer = ct.text;
    const classNames =
        (layer.classNames || [])
            .concat(kind.classNames || [])
            .concat(variation.classNames || []);
    return {
      name,
      type: 'tool',
      presentation: 'cells',
      classNames: ['menu-text'],
      isSelected: true,
      callback: () => {
        state.gesture = new TextGesture(kind, variation);
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
          innerHTML: text,
          classNames: [
            'grid-cell',
            'primary-cell',
          ].concat(classNames),
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
      this.tokenSelectedText_ = newText.toLowerCase();
      this.updateTokenSelectorSubmenu_();
    };
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

  downloadPng_(scale, startOffset, endOffset) {
    const overlay = createAndAppendDivWithClass(document.body, 'modal-overlay');
    const message = createAndAppendDivWithClass(overlay, 'modal-message');
    message.textContent = 'Constructing PNG...';
    setTimeout(() => {
      const numColumns = state.getProperty(pk.lastColumn) -
          state.getProperty(pk.firstColumn);
      const numRows = state.getProperty(pk.lastRow) -
          state.getProperty(pk.firstRow);
      const width = scale * (1 + state.theMap.dividerWidth +
          numColumns * (state.theMap.cellWidth +
          state.theMap.dividerWidth));
      const height = scale * (1 + state.theMap.dividerHeight +
          numRows * (state.theMap.cellHeight +
          state.theMap.dividerHeight));
      const theMapElement = document.getElementById('theMap');
      domtoimage.toBlob(theMapElement, {
        style: {
          transform: `scale(${scale})`,
          left: -(startOffset * scale),
          top: -(startOffset * scale),
        },
        width: width - (startOffset + endOffset) * scale,
        height: height - (startOffset + endOffset) * scale,
      }).then(blob => {
        saveAs(blob, 'mipui.png');
        overlay.parentElement.removeChild(overlay);
      }).catch(() => {
        overlay.parentElement.removeChild(overlay);
      });
    }, 10);
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
        name: '&File',
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
                let message = 'This will create a copy of this map and load ' +
                    'it in the current window. Confirm?';
                if (state.isReadOnly()) {
                  const mapHasHiddenStuff =
                      Array.from(state.theMap.cells.entries())
                          .some(([key, cell]) => cell.hasHiddenContent());
                  if (mapHasHiddenStuff) {
                    message =
                        'THIS IS CHEATING! Hidden content will be revealed!' +
                        '\n\n' + message;
                  }
                }
                if (confirm(message)) {
                  state.opCenter.fork();
                  alert('Forked!');
                }
              },
            },
            {
              name: 'PNG, 32px/square',
              type: 'button',
              presentation: 'label',
              text: 'PNG (1:1)',
              enabledInReadonlyMode: true,
              callback: () => {
                this.downloadPng_(1, 0, 0);
              },
            },
            {
              name: 'PNG, 70px/square, edge-cropped',
              type: 'button',
              presentation: 'label',
              text: 'PNG (VTT)',
              enabledInReadonlyMode: true,
              callback: () => {
                // VTTs like 70px per square.
                this.downloadPng_(70 / 32, 3, 4);
              },
            },
            {
              name: 'PNG, 300px/square',
              type: 'button',
              presentation: 'label',
              text: 'PNG (print)',
              enabledInReadonlyMode: true,
              callback: () => {
                // Standard battlemat size is 1 inch per square.
                this.downloadPng_(300 / 32, 0, 0);
              },
            },
            {
              name: "PNG of what's currently shown",
              type: 'button',
              presentation: 'label',
              text: 'PNG (view)',
              enabledInReadonlyMode: true,
              callback: () => {
                const overlay =
                    createAndAppendDivWithClass(document.body, 'modal-overlay');
                overlay.textContent = 'Constructing PNG...';
                setTimeout(() => {
                  const theMapElement = document.getElementById('theMap');
                  const mapContainerElement =
                      document.getElementById('mapContainer');
                  domtoimage.toBlob(theMapElement, {
                    width: mapContainerElement.clientWidth,
                    height: mapContainerElement.clientHeight,
                    style: {
                      left: theMapElement.offsetLeft -
                          mapContainerElement.scrollLeft,
                      top: theMapElement.offsetTop -
                          mapContainerElement.scrollTop,
                    },
                  }).then(blob => {
                    saveAs(blob, 'mipui.png');
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
        name: '&Info',
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
        name: '&Select',
        presentation: 'selected child',
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
              name: 'Crop to Selection',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'crop',
              enabledInReadonlyMode: false,
              callback: () => {
                if (state.gesture instanceof SelectGesture) {
                  state.gesture.cropMapToThisSelection();
                } else {
                  alert('Only valid when something is selected.');
                }
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
        name: '&Map',
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
                state.opCenter.recordOperationComplete();
              },
            },
            {
              name: 'Resize map',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'photo_size_select_large',
              enabledInReadonlyMode: false,
              callback: () => {
                showResizeDialog();
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
        name: '&Walls',
        presentation: 'selected child',
        tip: 'Add a wall by clicking a divider cell between two floor cells.',
        isSelected: true,
        submenu: {
          items: [
            {
              name: 'Wall (auto)',
              type: 'tool',
              presentation: 'icon_map',
              isSelected: true,
              iconMapRect: {
                x: 32,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new WallGesture(1, false); },
            },
            {
              name: 'Wall (manual)',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 128,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new WallGesture(1, true); },
            },
            {
              name: 'Angled wall',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 224,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new AngledWallGesture(
                  ct.walls, ct.walls.smooth, ct.walls.smooth.angled); },
            },
            {
              name: 'Rectangle',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 320,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new SquareRoomGesture(false); },
            },
            {
              name: 'Ellipse',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 416,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new OvalRoomGesture(false); },
            },
            {
              name: 'Rectangular Room',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 512,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new SquareRoomGesture(true); },
            },
            {
              name: 'Elliptical Room',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 608,
                y: 32,
                size: 72,
              },
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new OvalRoomGesture(true); },
            },
            {
              name: 'Paint Bucket',
              type: 'tool',
              presentation: 'icon',
              materialIcon: 'format_color_fill',
              enabledInReadonlyMode: false,
              callback: () => { state.gesture = new PaintBucketGesture(); },
            },
          ],
        },
      },
      {
        name: 'Se&parators',
        presentation: 'selected child',
        tip: 'Drag when placing to create a multi-cell separator.',
        classNames: ['menu-separators'],
        submenu: {
          items: [
            {
              name: 'Single door',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 20,
                y: 132,
                size: 30,
              },
              isSelected: true,
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.door, ct.separators.door.single, true);
              },
            },
            {
              name: 'Double door',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 52,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.door, ct.separators.door.double, true);
              },
            },
            {
              name: 'Secret door',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 84,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.door, ct.separators.door.secret, true);
              },
            },
            {
              name: 'Window',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 116,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.window, ct.separators.window.generic, true);
              },
            },
            {
              name: 'Bars',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 148,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.bars, ct.separators.bars.generic, false);
              },
            },
            {
              name: 'Fence',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 180,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.fence, ct.separators.fence.generic, false);
              },
            },
            {
              name: 'Curtain',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 212,
                y: 132,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.curtain, ct.separators.curtain.generic,
                    false);
              },
            },
          ],
        },
      },
      {
        name: '&Text',
        presentation: 'selected child',
        tip: 'Drag when placing to stretch across multiple cells.',
        submenu: {
          items: [
            this.createTextTool_(
                ct.text.text, ct.text.text.standard, 'Text', 'Text'),
          ],
        },
      },
      {
        name: 'To&kens',
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
        name: 'S&hapes',
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
        name: 'Stai&rs',
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
        name: '&GM Tools',
        presentation: 'icon',
        materialIcon: 'local_library',
        enabledInReadonlyMode: false,
        tip: 'Tools in this menu appear hidden to non-editors. ' +
            '<a target="_blank" href="../docs/gm_tools.html">Learn more</a>',
        submenu: {
          items: [
            {
              name: 'Reveal cells in line of sight',
              type: 'tool',
              presentation: 'icon',
              materialIcon: 'my_location',
              enabledInReadonlyMode: false,
              isSelected: true,
              callback: () => {
                state.gesture = new SightGesture();
              },
            },
            {
              name: 'Hide / reveal single cell',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 37,
                y: 325,
                size: 30,
              },
              enabledInReadonlyMode: false,
              callback: () => {
                state.gesture =
                    new OverlayGesture(
                      ct.mask, ct.mask.hidden, ct.mask.hidden.black);
              },
            },
            {
              name: 'Hide All',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'visibility_off',
              enabledInReadonlyMode: false,
              callback: () => {
                state.theMap.cells.forEach(cell => {
                  cell.setLayerContent(
                      ct.mask, {
                        [ck.kind]: ct.mask.hidden.id,
                        [ck.variation]: ct.mask.hidden.black.id,
                      }, true);
                });
                state.opCenter.recordOperationComplete(true);
                if (state.gesture instanceof SightGesture) {
                  state.gesture.shouldMakeOtherCellsHidden = false;
                }
              },
            },
            {
              name: 'Reveal All',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'visibility',
              enabledInReadonlyMode: false,
              callback: () => {
                state.theMap.cells.forEach(cell => {
                  cell.setLayerContent(ct.mask, null, true);
                });
                state.opCenter.recordOperationComplete();
                if (state.gesture instanceof SightGesture) {
                  state.gesture.shouldMakeOtherCellsHidden = true;
                }
              },
            },
            this.createTextTool_(
                ct.text.gmNote, ct.text.gmNote.standard, 'DM Note', 'Note'),
            {
              name: 'Hidden Secret door',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 148,
                y: 325,
                size: 30,
              },
              callback: () => {
                state.gesture = new SeparatorGesture(
                    ct.separators.door, ct.separators.door.hiddenSecret, true);
              },
            },
            {
              name: 'Region',
              type: 'tool',
              presentation: 'icon_map',
              iconMapRect: {
                x: 197,
                y: 325,
                size: 30,
              },
              enabledInReadonlyMode: false,
              callback: () => {
                state.gesture = new OverlayGesture(
                    ct.gmoverlay,
                    ct.gmoverlay.shape,
                    ct.gmoverlay.shape.square);
              },
            },
            {
              name: 'Hide text & secret doors',
              type: 'button',
              presentation: 'icon',
              materialIcon: 'compare',
              enabledInReadonlyMode: false,
              callback: () => {
                state.theMap.cells.forEach(cell => {
                  if (cell.isVariation(
                      ct.separators, ct.separators.door,
                      ct.separators.door.secret)) {
                    const content = Object.assign({},
                        cell.getLayerContent(ct.separators), {
                          [ck.kind]: ct.separators.door.id,
                          [ck.variation]: ct.separators.door.hiddenSecret.id,
                        });
                    cell.setLayerContent(ct.separators, content, true);
                  }
                  if (cell.isKind(ct.text, ct.text.text)) {
                    const content = Object.assign({},
                        cell.getLayerContent(ct.text), {
                          [ck.kind]: ct.text.gmNote.id,
                          [ck.variation]: ct.text.gmNote.standard.id,
                        });
                    cell.setLayerContent(ct.text, content, true);
                  }
                });
                state.opCenter.recordOperationComplete(true);
              },
            },
          ],
        },
      },
      {
        name: 'He&lp',
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
            {
              name: 'Twitter',
              type: 'button',
              presentation: 'icon',
              icon: 'assets/twitter.png',
              enabledInReadonlyMode: true,
              callback: () => {
                window.open('https://twitter.com/alon_mishne', '_blank');
              },
            },
          ],
        },
      },
      // {
      //   name: 'Survey',
      //   type: 'button',
      //   presentation: 'icon',
      //   materialIcon: 'list',
      //   enabledInReadonlyMode: true,
      //   callback: () => {
      //     window.open('https://goo.gl/forms/MMJBHazJNHfJEafn2', '_blank');
      //   },
      // },
    ];
  }

  setupDebugMenuItem_() {
    return {
      name: 'Debug',
      presentation: 'icon',
      materialIcon: 'build',
      enabledInReadonlyMode: true,
      submenu: {
        items: [
          {
            name: 'New in-place',
            type: 'button',
            presentation: 'icon',
            materialIcon: 'create_new_folder',
            enabledInReadonlyMode: true,
            callback: () => { window.open('.', '_self'); },
          },
          {
            name: 'Save map locally',
            type: 'button',
            presentation: 'icon',
            materialIcon: 'save',
            enabledInReadonlyMode: true,
            callback: () => {
              const blob =
                  new Blob([JSON.stringify(state.pstate_)],
                    {type: 'application/json'});
              saveAs(blob, `mipui_${state.getMid() || 'unnamed'}.json`);
            },
          },
          {
            name: 'Load local map',
            type: 'button',
            presentation: 'icon',
            materialIcon: 'unarchive',
            enabledInReadonlyMode: true,
            callback: () => {
              const inputElement = document.createElement('input');
              inputElement.type = 'file';
              inputElement.addEventListener('change', () => {
                const files = inputElement.files;
                if (files && files.length > 0) {
                  const fr = new FileReader();
                  fr.addEventListener('load', () => {
                    state.load(JSON.parse(fr.result));
                    state.opCenter.fork();
                  });
                  fr.readAsText(files[0]);
                }
              });
              inputElement.click();
            },
          },
        ],
      },
    };
  }
}
