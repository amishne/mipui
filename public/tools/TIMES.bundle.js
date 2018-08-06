(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(typeof self !== 'undefined' ? self : this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return clamp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return clampUint8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return degrees; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return getX; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return getY; });
/* unused harmony export histogram */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return getIndex; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return isLittleEndian; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return pipe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return radians; });
/* unused harmony export statistics */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core_TIMES__ = __webpack_require__(2);
/*
 *  times: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of times
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with times.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */






/**
 * TODO
 */
const append = function (obj) {
  __WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].storage.push(obj);
  return __WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].storage;
}

/**
 * Clamp value between min and max
 *
 * @author Jean-Christophe Taveau
 */
const clamp = (min_value,max_value) => (value) => Math.max(min_value,Math.min(value,max_value));


/**
 * Clamp value between 0 and 255 (2^8 -1)
 *
 * @author Jean-Christophe Taveau
 */
const clampUint8 = clamp(0,255);


/**
 * Clamp value between 0 and 65535 (2^16 -1)
 *
 * @author Jean-Christophe Taveau
 */
const clampUint16 = clamp(0,65535);

/**
 * Convert radians to degrees
 *
 * @author Jean-Christophe Taveau
 */
const degrees = (radian_angle) => radian_angle * 180.0 / Math.PI;


/**
 * Convert degrees to radians
 *
 * @author Jean-Christophe Taveau
 */
const radians = (degree_angle) => degree_angle * Math.PI / 180.0;



/**
 * Check Endianness
 *
 * @author Jean-Christophe Taveau
 */
const isLittleEndian = () => {
  const checkEndianness = () => {
    // https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
    let buf = new ArrayBuffer(4);
    let buf8 = new Uint8ClampedArray(buf);
    let data = new Uint32Array(buf);
    
    // Determine whether Uint32 is little- or big-endian.
    data[0] = 0x0a0b0c0d;
    __WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].cache.littleEndian = (buf8[0] === 0x0d);
    return __WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].cache.littleEndian;
  };
  
  return (__WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].cache.littleEndian !== undefined) ? __WEBPACK_IMPORTED_MODULE_0__core_TIMES__["a" /* TIMES */].cache.littleEndian : checkEndianness();

};

/**
 * pipe(func1, func2, func3, ..., funcn)
 * From https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
 *
 * @example pipe(func1,func2) returns func2(func1(x))
 *
 * @author Eric Elliott
 */
const pipe = (...fns) => (raster,copy_mode=false) => {
  let fullCopy = T.Raster.from(raster,true);
  return fns.reduce((v, f,i) => {
    return f(v,copy_mode);
    }, fullCopy);
}

/**
 * Computes basic stats: min, max, mean/average and standard deviation of the image.
 * Algorithm for variance found in <a href="https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Two-pass_algorithm">Wikipedia</a>
 * 
 * @param {Raster} img - Input raster
 * @param {boolean} copy_mode - Useless here, only for compatibility with the other processing functions
 * @return {Raster} - Returns a raster with updated statistics: min, max, mean, variance
 *
 * @author Jean-Christophe Taveau
 */
const statistics = (img, copy_mode = true) => {
  let tmp = img.pixelData.reduce ( (accu,px,i) => {
    accu.min = Math.min(accu.min,px);
    accu.max = Math.max(accu.max,px);
    accu.mean += px;
    accu.n++;
    let delta = px - accu.mean2;
    accu.mean2 += delta/accu.n;
    accu.variance += delta * delta;
    return accu;
  },
  {min: Number.MAX_SAFE_INTEGER, max: 0, mean: 0.0, mean2 : 0.0, n: 0, variance: 0.0}
  );

  // Update stats in this TRaster
  img.statistics = {
    min: tmp.min,
    max: tmp.max,
    count : img.pixelData.length,
    mean : tmp.mean / img.pixelData.length,
    stddev : Math.sqrt(tmp.variance / img.pixelData.length)
  };
  return img;
};

/**
 * Computes histogram of the image.
 * Algorithm for variance found in <a href="https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Two-pass_algorithm">Wikipedia</a>
 * 
 * @param {number} binNumber - Bin Number
 * @param {Raster} img - Input raster
 * @param {boolean} copy_mode - Useless here, only for compatibility with the other processing functions
 * @return {Raster} - Returns a raster with updated histogram
 *
 * @author Jean-Christophe Taveau
 */
const histogram = (binNumber) => (raster, copy_mode = true) => {
  // Update statistics
  let stats = T.statistics(raster);
  let delta = (raster.statistics.max - raster.statistics.min);
  raster.statistics.histogram = raster.pixelData.reduce ((bins,px,i) => {
    let index = T.clamp(0,binNumber)( Math.floor( (binNumber - 1) * (px - raster.statistics.min)/ delta));
    bins[index]++;
    return bins;
    },
    new Array(binNumber).fill(0)
  );
  return raster;
};

/**
 * Get index
 */
const getIndex = (x,y,width) => x + y * width;

/**
 *
 */
const getX = (index,width) => index % width;

/**
 *
 */
const getY = (index,width) => Math.floor(index / width);



// Exports




/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return _convolve; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return linearFunc; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return clampBorder; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return clampEdge; });
/* unused harmony export mirror */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return repeat; });
  /*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



// Manage clamp to border - outside: 0
const clampBorder = (pixels,x,y,width,height) => {
  return (x >=0 && x < width && y >=0 && y < height) ? pixels[x + y * width] : 0;
};
  
// Manage clamp to edge - outside: value of the image edge
const clampEdge = (pixels, x,y,width,height) => {
  let xx = Math.min(Math.max(x,0),width  - 1);
  let yy = Math.min(Math.max(y,0),height - 1);
  return pixels[xx + yy * width];
};
  
// Manage repeat - outside: value of the image tile (like OpenGL texture wrap mode)
const repeat = (pixels, x,y,width,height) => {
  let xx = (width  + x ) % width;
  let yy = (height + y ) % height;
  return pixels[xx + yy * width];
};
  
// Manage mirror - outside: value of the image mirrored tile (like OpenGL texture wrap mode)
// HACK: BUG
const mirror = (pixels, x,y, width,height) => {
  let xx = Math.trunc(x / width) * 2 * (width  - 1)  - x;
  let yy = Math.trunc(y / height) * 2 * (height  - 1)  - y;
  return pixels[xx + yy * width];
};
  
// Linear Filter: Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
const linearFunc = (index,pixels,width,height,kernel,borderFunc) => {
  return kernel.reduce( (sum,v) => {
    sum += borderFunc(
      pixels,
      cpu.getX(index,width) + v.offsetX, 
      cpu.getY(index,width) + v.offsetY,
      width,height
    ) * v.weight;
    return sum;
  },0.0); 
};


/*
 * Convolve
 * data - pixels
 * @param {number} width
 * @param {number} height
 * kernel - kernel offsets
 * borderFunc - function handling borders
 * kernelFunc - function computing output pixel value
 */ 
const _convolve = (data,width,height,kernel,borderFunc,kernelFunc) => {
  return data.map( (px, index, pixels) => {
    return kernelFunc(index,pixels,width,height,kernel,borderFunc);
  });
};




/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TIMES; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
const TIMES = {
  storage: [],
  cache : {}
};

TIMES.initStorage = () => TIMES.storage = [];




/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__core_index_js__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__io_loadImage__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__cpu_index_js__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__gpu_index_js__ = __webpack_require__(27);
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "T", function() { return __WEBPACK_IMPORTED_MODULE_0__core_index_js__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "io", function() { return __WEBPACK_IMPORTED_MODULE_1__io_loadImage__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "cpu", function() { return __WEBPACK_IMPORTED_MODULE_2__cpu_index_js__; });
/* harmony reexport (module object) */ __webpack_require__.d(__webpack_exports__, "gpu", function() { return __WEBPACK_IMPORTED_MODULE_3__gpu_index_js__; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 

/* core classes */


/* io/loadImage */


/* cpu/ */


/* gpu/ */








/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__TIMES__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Raster__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Image__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__Stack__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__Volume__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__Window__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__View__ = __webpack_require__(10);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Raster", function() { return __WEBPACK_IMPORTED_MODULE_1__Raster__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Image", function() { return __WEBPACK_IMPORTED_MODULE_2__Image__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Stack", function() { return __WEBPACK_IMPORTED_MODULE_3__Stack__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Volume", function() { return __WEBPACK_IMPORTED_MODULE_4__Volume__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Window", function() { return __WEBPACK_IMPORTED_MODULE_5__Window__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "View", function() { return __WEBPACK_IMPORTED_MODULE_6__View__["a"]; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
















/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 


/**
 * Class for Raster
 *
 * @alias T.Raster
 */
 
class Raster {
  /**
   * Create an empty TRaster.
   * 
   * @param {string} type - One of these: uint8, uint16, float32, rgba
   * @param {number} width - Image Width
   * @param {number} height - Image Height
   * @param {number} offset - Offset
   */
  constructor(type,width,height,depth=1) {
    /**
     * Width
     */
    this.width = width;
    
    /**
     * Height
     */
    this.height = height;
    
    /**
     * Depth Only for 3D data
     */
    this.depth = depth;
    
    /**
     * Label
     */
    this.label = 'None';
    
    /**
     * Length = width * height
     */
    this.length = this.width * this.height * this.depth;
    
    /**
     * Type: uint8, uint16, uint32, float32,rgba
     */
    this.type = type;
    
    /**
     * Pixels array
     */
    this.pixelData; 
    
    /**
     * Image, Stack or Volume parent
     */
    this.parent; 
  }
  
  /*
   * Create the Pixels Array filled in black (value = 0)
   *
   * @alias T.Raster.createPixels
   * @param {string} type - uint8, uint16, uint32, float32,rgba
   */
  static createPixels(type,length) {
    let arr;
    switch (type) {
    case 'uint8': arr = new Uint8ClampedArray(length).fill(0); break;
    case 'uint16': arr = new Uint16Array(length).fill(0);break;
    case 'uint32': arr = new Uint32Array(length).fill(0);break;
    case 'float32': arr = new Float32Array(length).fill(0.0);break;
    case 'abgr':
    case 'rgba': arr = new Uint32Array(length).fill(0);break;
    }
    return arr;
  }
  
  static MIN_VALUE() {
    return 0;
  }
  
  static fromWindow(win, copy = true) {
    let img = new TRaster(win.metadata.type,win.metadata.width,win.metadata.height);
    img.pixelData = (copy === true) ? [...win.raster.pixelData] : win.raster.pixelData; // Copy pixels
    img.setWindow(win);
    return img;
  }
  
  /**
   * Create a new Raster from another Raster
   *
   * @alias T.Raster.from
   * @param {TRaster} other - uint8, uint16, uint32, float32,rgba
   */
  static from(other, copy = true) {
    let img = new T.Raster(other.type,other.width, other.height);
    img.parent = other.parent;
    if (copy === true) {
      img.setPixelData(other.pixelData); // Copy pixels
    }
    else {
      img.pixelData = other.pixelData;  // No copy
    }
    
    return img;
  }
  
  fill(value) {
    this.pixelData.fill(value);
  }
  
    
  /**
   * compose(func1, func2, func3, ..., funcn)
   * From https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
   *
   * @alias T.Raster.compose
   * @example compose(func1,func2) returns func1(func2(x))
   *
   * @author Eric Elliott
   */
  compose (...fns) {
    return fns.reduceRight((v, f) => f(v,false), this);
  }

  /**
   * pipe(func1, func2, func3, ..., funcn)
   * From https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d
   *
   * @example pipe(func1,func2) returns func2(func1(x))
   *
   * @author Eric Elliott
   */
  pipe (...fns) {
    return fns.reduce((v, f) => f(v,false), this);
  }
  
  /**
   * Get pixel value at given index
   *
   * @alias T.Raster~get
   * @param {number} index - Index
   * @returns {number}  Pixel Value
   *
   * @author: Jean-Christophe Taveau
   */
  get(index) {
    return this.pixelData[index];
  }
  
  /**
   * Get pixel value at given X,Y-coordinates
   *
   * @alias T.Raster~getPixel
   * @param {number} x - X-coordinate
   * @param {number} y - Y-coordinate
   * @returns {number}  Pixel Value
   *
   * @author: Jean-Christophe Taveau
   */
  getPixel(x,y) {
    let index = x + y * this.width;
    return this.pixelData[index];
  }
  
  /**
   * Get X,Y-coordinate from index
   *
   * @alias T.Raster~xy
   * @param {number} index - Index
   * @returns {array}  X- and Y-coordinates
   *
   * @author: Jean-Christophe Taveau
   */
  xy(index) {
    return [this.x(index), this.y(index)];
  }
  
  /**
   * Get X-coordinate from index
   *
   * @alias T.Raster~x
   * @param {number} index - Index
   * @returns {number}  X-coordinate
   *
   * @author: Jean-Christophe Taveau
   */
  x(index) {
    return index % this.width;
  }
  
  /**
   * Get Y-coordinate from index
   *
   * @alias T.Raster~y
   * @param {number} index - Index
   * @returns {number}  Y-coordinate
   *
   * @author: Jean-Christophe Taveau
   */
  y(index) {
    return Math.floor(index / this.width);
  }
  
  /**
   * Set pixel value at given index
   *
   * @param {number} index - Pixel index
   * @param {number} value - Pixel value
   * @author Jean-Christophe Taveau
   */
  set(index,value) {
    this.pixelData[index] = value;
  }

  /**
   * Set Raster Dimension
   *
   * @param {number} new_width - New Raster Width
   * @param {number} new_height - New Raster Height
   *
   * @author Jean-Christophe Taveau
   */
  setDimension(new_width,new_height) {
    this.width = new_width;
    this.height = new_height;
    this.length = new_width * new_height;
  }

  /**
   * Set pixel value at given X,Y-coordinates
   *
   * @param {number} x - Pixel X-coordinate
   * @param {number} y - Pixel Y-coordinate
   * @param {number} value - Pixel value
   * @author Jean-Christophe Taveau
   */
  setPixel(x,y,value) {
    this.pixelData[x + y * this.width] = value;
  }

  /**
   * Set pixels 
   *
   * @param {TypedArray} array - Pixel value
   * @author Jean-Christophe Taveau
   */
  setPixelData(array) {
    const table = {uint8: Uint8ClampedArray, uint16: Uint16Array, float32: Float32Array, rgba: Uint32Array };
    // check if correct 
    if (array instanceof table[this.type]) {
      this.pixelData  = array;
    }
    else {
      // Need a conversion
      switch (this.type) {
      case 'uint8': this.pixelData = new Uint8ClampedArray(array); break;
      case 'uint16': this.pixelData = new Uint16Array(array);break;
      case 'uint32': this.pixelData = new Uint32Array(array);break;
      case 'float32': this.pixelData = new Float32Array(array);break;
      case 'abgr':
      case 'rgba': this.pixelData = new Uint32Array(array);break;
      }
    }

  }

  /**
   * Pad a smaller raster within this raster
   *
   * @author Jean-Christophe Taveau
   */
  pad(topleft_x,topleft_y,small_img) {
    for (let y = 0; y < small_img.height; y++) {
      let chunk = small_img.pixelData.slice(y * small_img.width, (y+1) * small_img.width);
      chunk.forEach ( (px, index) => this.pixelData[topleft_x + index + (topleft_y + y)* this.width] = px, this);
    }
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Raster;



/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 


/**
 * Class for Image
 *
 * @alias T.Image
 */
 
class Image {
  /**
   * Create an empty Image.
   * 
   * @param {string} type - One of these: uint8, uint16, float32, rgba
   * @param {number} width - Image Width
   * @param {number} height - Image Height
   * @param {number} offset - Offset
   */
  constructor(type,width,height, pattern="black") {
    
    /**
     * Width
     */
    this.width = width;
    
    /**
     * Height
     */
    this.height = height;
    
    
    /**
     * Length = width * height
     */
    this.length = this.width * this.height;
    
    /**
     * Type: uint8, uint16, uint32, float32,abgr, rgba
     */
    this.type = type;

    /**
     * Metadata containing annotations, information,etc.
     */
    this.metadata = {
      dimension : 2,
      type: type,
      width : width,
      height : height,
      depth : 1,
      fill : pattern
    };
    
    /**
     * Raster containing the pixels
     */
    this.raster = new T.Raster(type,width,height); 
    this.raster.parent = this;
    this.fillPattern(pattern);
  }
  
  
  fillPattern(pattern) {
    let raster = this.raster;
    if (raster.pixelData === undefined) {
      raster.pixelData = T.Raster.createPixels(this.type,this.length);
      console.log(`Create pixels of ${this.type}`);
    }
    if (pattern.toLowerCase() === 'black') {
      raster.pixelData.fill(T.Raster.MIN_VALUE(this.type));
    }
    else if (pattern.toLowerCase() === 'white') {
      raster.pixelData.fill(T.Raster.MAX_VALUE(this.type));
    }
    else if (pattern.toLowerCase() === 'ramp') {
      raster.pixelData.map(x => T.Raster.MAX_VALUE()/ this.width * (i % this.width));
    }
  }
  

  /**
   * Get raster
   *
   * @alias T.Image~getRaster
   * @return {Raster} Returns the raster
   *
   * @author Jean-Christophe Taveau
   */
  getRaster() {
    return this.raster;
  }

  /**
   * Set raster
   *
   * @alias T.Image~setRaster
   * @param {Raster} a_raster - A raster image
   *
   * @author Jean-Christophe Taveau
   */
  setRaster(a_raster) {
    this.raster = a_raster;
  }

  /**
   * Set pixels
   *
   * @alias T.Image~setPixels
   * @param {array} data - Array of pixel values (numbers)
   * @author Jean-Christophe Taveau
   */
  setPixels(data) {
    this.raster.pixelData = data;
  }
  
  setWindow(win) {
    this.window = win;
  }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = Image;



/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
/**
 * @namespace T
 */
 
 
/**
 * Class for Stack
 *
 * @alias T.Stack
 */

class Stack {
  /**
   * Create an empty Stack
   * @param {string} type - Pixel type number: uint8, uint16, float32, rgba
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} nslices - Slice number in the stack
   */
  constructor(type,width,height,nslices,pattern="black") {
    
    /**
     * Width
     */
    this.width = width;
    
    /**
     * Height
     */
    this.height = height;
    
    /**
     * Type: uint8, uint16, uint32, float32,rgba
     */
    this.type = type;
    
    /**
     * Pixels array
     */
    this.pixelData; 
    
    /**
     * Slice number
     */
    this.nslices = nslices;
    
    /**
     * Length = width * height * nslices
     */
    this.length = this.width * this.height * this.nslices;

    /**
     * Metadata containing annotations, information,etc.
     */
    this.metadata = {
      dimension : 2.5,
      title : title,
      type: type,
      width : width,
      height : height,
      nslices : nslices,
      fill : pattern,
    };
    
    /**
     * Array of slices Raster
     */
    this.slices = Array.from({length: nslices}, (x,i) => new T.Raster(type,width,height,i.toString()));
  }

  /**
   * Set pixels
   * 
   * @alias T.Stack~setPixels
   * @author Jean-Christophe Taveau
   */
  setPixels(data) {
    this.slices.forEach( (sli,i) => sli.pixelData = data.slice(i*sli.length, i*sli.length + sli.length) );
  }


  /**
   * Execute function for each slice in this stack
   *
   * @param {function} func - Function run for each slice of the stack
   *
   * @author Jean-Christophe Taveau
   */
  forEach(func) {
    this.slices.forEach( (x,i) => func(x,false));
  }
  
  /**
   * Execute function for each slice in this stack
   *
   * @param {function} func - Function run for each slice of the stack
   * @return {array} - returns an array of objects
   *
   * @author Jean-Christophe Taveau
   */
  map(func) {
    return this.slices.map( (x,i) => func(x,true));
  }
  
  /**
   * Extract one slice at given index 
   *
   * @param {number} index - Slice index must be comprised between 0 and length - 1
   * @return {TRaster} 
   * @author Jean-Christophe Taveau
   */
   slice(index) {
    return this.slices[index];
   }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Stack;




/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

'use script';

/**
 * Class for Volume
 *
 * @alias T.Volume
 */
 
class Volume {
  /**
   * Create an empty Volume
   *
   * @param {string} type - Pixel type number: uint8, uint16, float32, rgba
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {number} depth - Depth
   */
  constructor(type,width,height,depth,pattern="black") {
    
    /**
     * Width
     */
    this.width = width;
    
    /**
     * Height
     */
    this.height = height;
    
    /**
     * Depth
     */
    this.depth = depth;
    
    /**
     * Length = width * height * depth
     */
    this.length = this.width * this.height * this.depth;
    
    /**
     * Type: uint8, uint16, uint32, float32,rgba
     */
    this.type = type;

    /**
     * Metadata containing annotations, information,etc.
     */
    this.metadata = {
      dimension : 3,
      type: type,
      width : width,
      height : height,
      depth : 1,
      fill : pattern
    };
    
    /**
     * Raster containing the pixels
     */
    this.raster = new T.Raster(type,width,height,depth); 
    this.raster.parent = this;
    this.raster.pixelData = T.Raster.createPixels(this.type,this.length);
  }
  
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Volume;



/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

/**
 * Class for Window
 * @alias T.Window
 */
 
class Window {
  /**
   * Create an empty Window.
   * 
   * @param {string} title - Window Title
   * @param {number} width - Window Width
   * @param {number} height - Window Height
   * @param {boolean} forceCPU - By default, all the processing is done in CPU and not in GPU
   *
   * @author Jean-Christophe Taveau
   */
  constructor(title,forceCPU=true) {
    /**
     * Title
     */
    this.title = title;
    
    
    // Build HTML5 elements
    this.root = document.createElement('article');
    this.root.className = "twindow";
    this.root.name = this.title;
    this.root.id = this.title.toLowerCase(); //  + '-' + wm.windows.length;
    this.root.style.left = `${Math.random()*1200}px`;
    this.root.style.top = `${Math.random()*400}px`;
    let header = document.createElement('header');
    header.className = 'theader';
    header.innerHTML = `<label>${title}</label>`;
    this.root.appendChild(header);
    let body = document.createElement('content');
    let footer = document.createElement('footer');
    footer.className = 'tfooter';
    this.root.appendChild(header);
    this.root.appendChild(body);
    this.root.appendChild(footer);

    // Move by click & drag 
    let offset = [];
    const move = (e) => {
      header.parentNode.style.top  = (e.clientY + offset[1]) + 'px';
      header.parentNode.style.left = (e.clientX + offset[0]) + 'px';
    };
    const mouseUp = (e) => {
      e.target.parentNode.style.zIndex = 1;
      window.removeEventListener('mousemove', move, true);
    }
    const mouseDown = (e) => {
      e.target.parentNode.style.zIndex = 99;
      offset = [this.root.offsetLeft - e.clientX, this.root.offsetTop - e.clientY];
      window.addEventListener('mousemove', move, true);
    }
    header.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

    this.element;
    


    // Try to get HW Acceleration
    this.useGPU = !forceCPU;
    /*
    if (!forceCPU) {
      // Get WEBLG 2 context
      this.ctx = this.canvas.getContext("webgl2");
      // no webgl2 for you!
      this.useGPU = (!this.ctx) ? false : true;
    }
    if (!this.useGPU) {
      this.ctx = this.canvas.getContext('2d');
      this.useGPU = false;
    }
    */
  }

  /**
   * Add a view to this window
   *
   * @alias T.Window~addView
   * @param {View} a_view - View
   *
   * @author Jean-Christophe Taveau
   */
  addView(a_view) {
    /*
     * Create an empty canvas
     */
    const createCanvas = (layerData) => {
      let canvas = document.createElement('canvas');
      canvas.layerData = layerData;
      this.element = canvas;
      
      if (!this.useGPU) {
        this.ctx = this.element.getContext('2d');
      }
      // HACK console.log(`${layerData.width} x ${layerData.height} `);
      canvas.width = layerData.width;
      canvas.height = layerData.height;
      this.root.childNodes[1].appendChild(canvas);
      let info = document.createElement('p'); 
      info.className = 'tstatus';
      info.id = this.root.id + '_status';
      info.appendChild(document.createTextNode('') );
      this.root.childNodes[2].appendChild(info);

      // Add events
      // TODO - What about CSS geometric transforms?
      // See https://stackoverflow.com/questions/17130395/real-mouse-position-in-canvas
      canvas.addEventListener('mousemove', function(evt) {
        let canvas = evt.target;
        let the_view = evt.target.parentNode.parentNode.tview;
        let rect = canvas.getBoundingClientRect();
        let x = Math.floor(evt.clientX - rect.left);
        let y = Math.floor(evt.clientY - rect.top);
        let pixels = canvas.layerData.raster.pixelData;
        let w = canvas.layerData.raster.width;
        let pix = (the_view.layers[0].data.raster.type === 'float32') ? pixels[x + y * w] : pixels[x + y * w] >>>0;
        let message = `(${x},${y}): ${pix}`;
        if (the_view.layers[0].data.raster.type === 'rgba' || the_view.layers[0].data.raster.type === 'abgr') {
          message = `(${x},${y}): rgba(${cpu.red(pix)},${cpu.green(pix)},${cpu.blue(pix)},${cpu.alpha(pix)})`;
        }
        let info = canvas.parentNode.nextSibling;
        info.innerHTML = message;
      });
      // TODO Zoom in/out
      // TODO http://phrogz.net/tmp/canvas_zoom_to_cursor.html
      // TODO this.ctx.scale(2.0,2.0);
      // TODO Translate canvas
      // TODO this.ctx.translate(10.0,20.0)
      // TODO this.ctx.drawImage(win.canvas,0,0);
    };

    /* 
     * Create an empty table
     */
    const createTable = () => {
      this.element = document.createElement('table');
      this.root.childNodes[1].appendChild(this.element);
    };
  
    // M A I N
    this.root.tview = a_view;
    // Create all the HTML5 stuff...
    for (let layer of a_view.layers) {
      switch (layer.type) {
        case 'image':
        createCanvas(layer.data);
        break;
      case 'table': 
        createTable(layer.data);
        break;
      default: // Unknown
        // TODO
      }
    }
  }
  
  /**
   * Add this window to DOM and display its contents
   *
   * @alias T.Window~addToDOM
   * @author Jean-Christophe Taveau
   */
   addToDOM(parent) {
    this.root.tview.render(this);
    // show() - Add canvas to the workspace in DOM
    document.getElementById(parent).appendChild(this.root);
   }

}
/* harmony export (immutable) */ __webpack_exports__["a"] = Window;



/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
'use script';

class View {
  constructor(title,type,width,height) {
    /**
     * Title
     */
    this.title = title;
    
    /**
     * Width
     */
    this.width = width;
    
    /**
     * Height
     */
    this.height = height;
    
    
    /**
     * Length = width * height
     */
    this.length = this.width * this.height;
    
    /**
     * Type: uint8, uint16, uint32, float32,rgba
     */
    this.type = type;

    /**
     * Array of Layers
     */
    this.layers = [];
  }
  
  appendLayer(a_layer) {
    this.layers.push(a_layer);
  }
  
  render(win) {
    console.log('render');
    for (let layer of this.layers) {
      switch (layer.type) {
      case '3D':
        render3D(win)(layer.data);
        break;
      case 'graphics':
        cpu.renderVector(win)(layer.data);
        break;
      case 'image':
        cpu.render2D(win)(layer.data);
        break;
      case 'table':
        cpu.renderTable(win)(layer.data);
        break;
      }
    }
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = View;



/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "loadImage", function() { return loadImage; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

'use script';

/**
 * @module io
 */
 

/**
 * Sobel
 *
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - A filtered image
 *
 * @author TODO
 */
const loadImage = (data) => {
  
  return new Promise( resolve => {
    let img = new Image();
    img.onload = () => {
      // Image pixels are loaded as ABGR with ctx.getImageData().data
      // They are stored in UInt8ClampedArray
      let w = img.width;
      let h = img.height;
      // Create T.Image
      let timg = new T.Image('rgba', w, h);
      
      // Load image from canvas
      let canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0,img.width, img.height);
      let pixels = new Uint32Array(ctx.getImageData(0, 0, w, h).data.buffer); // ArrayBuffer with view Uint8ClampedArray
      
      timg.getRaster().pixelData = pixels;
      URL.revokeObjectURL(img.src);
      // document.getElementById('workspace').appendChild(canvas);
      // When it is done, accept the Promise
      resolve({image: timg, status: 'ok'});
    }
    img.onerror = () => resolve({data: data, status: 'error'});

    img.src = data;
    
    console.log('Load...');
  });
};

// Export 




/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toGray8", function() { return toGray8; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__process_utils__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__process_color__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__process_geometry__ = __webpack_require__(14);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__process_edgeDetect__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__process_filters__ = __webpack_require__(16);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__process_hough__ = __webpack_require__(17);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__process_math__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__process_noise__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__process_rankFilters__ = __webpack_require__(20);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__process_statistics__ = __webpack_require__(21);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__process_threshold__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__process_type__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__render_view__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__render_render2D__ = __webpack_require__(25);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__render_renderVector__ = __webpack_require__(26);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "clamp", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "clampUint8", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "degrees", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "getX", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "getY", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "getIndex", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "pipe", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "radians", function() { return __WEBPACK_IMPORTED_MODULE_0__process_utils__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "red", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "blue", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "green", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "alpha", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "luminance", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "chrominanceRed", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "chrominanceBlue", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "hue", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "saturation", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "value", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["l"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "splitChannels", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["j"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "toRGBA", function() { return __WEBPACK_IMPORTED_MODULE_1__process_color__["k"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "crop", function() { return __WEBPACK_IMPORTED_MODULE_2__process_geometry__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "canny", function() { return __WEBPACK_IMPORTED_MODULE_3__process_edgeDetect__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "laplacian3x3", function() { return __WEBPACK_IMPORTED_MODULE_3__process_edgeDetect__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "laplacian5x5", function() { return __WEBPACK_IMPORTED_MODULE_3__process_edgeDetect__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "sobel3x3", function() { return __WEBPACK_IMPORTED_MODULE_3__process_edgeDetect__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "KERNEL_RECTANGLE", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "KERNEL_CROSS", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "KERNEL_DIAMOND", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "KERNEL_CIRCLE", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "KERNEL_SQUARE", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "BORDER_CLAMP_TO_EDGE", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "BORDER_CLAMP_TO_BORDER", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "BORDER_REPEAT", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "BORDER_MIRROR", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "houghLines", function() { return __WEBPACK_IMPORTED_MODULE_5__process_hough__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "houghCircles", function() { return __WEBPACK_IMPORTED_MODULE_5__process_hough__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "convolve", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["k"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "convolutionKernel", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["j"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "mean", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["l"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "meanKernel", function() { return __WEBPACK_IMPORTED_MODULE_4__process_filters__["m"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "black", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "calc", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "chessboard", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "fillColor", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "fill", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "math", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ramp", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "spiral", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "white", function() { return __WEBPACK_IMPORTED_MODULE_6__process_math__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "noise", function() { return __WEBPACK_IMPORTED_MODULE_7__process_noise__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "saltAndPepper", function() { return __WEBPACK_IMPORTED_MODULE_7__process_noise__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "medianFilter", function() { return __WEBPACK_IMPORTED_MODULE_8__process_rankFilters__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "maximumFilter", function() { return __WEBPACK_IMPORTED_MODULE_8__process_rankFilters__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "minimumFilter", function() { return __WEBPACK_IMPORTED_MODULE_8__process_rankFilters__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "varianceFilter", function() { return __WEBPACK_IMPORTED_MODULE_8__process_rankFilters__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "histogram", function() { return __WEBPACK_IMPORTED_MODULE_9__process_statistics__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "statistics", function() { return __WEBPACK_IMPORTED_MODULE_9__process_statistics__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "otsu", function() { return __WEBPACK_IMPORTED_MODULE_10__process_threshold__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "threshold", function() { return __WEBPACK_IMPORTED_MODULE_10__process_threshold__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "fromABGRtoUint8", function() { return __WEBPACK_IMPORTED_MODULE_11__process_type__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "toUint8", function() { return __WEBPACK_IMPORTED_MODULE_11__process_type__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "montage", function() { return __WEBPACK_IMPORTED_MODULE_12__render_view__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "view", function() { return __WEBPACK_IMPORTED_MODULE_12__render_view__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderUint8", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderUint16", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderFloat32", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderABGR", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderRGBA", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "render2D", function() { return __WEBPACK_IMPORTED_MODULE_13__render_render2D__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "renderVector", function() { return __WEBPACK_IMPORTED_MODULE_14__render_renderVector__["a"]; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
 
 /* Process/utils */


/* Process/color */


/* Process/geometry */


/* Process/edgeDetect */


/* Process/filters */


/* Process/hough */


/* Process/math */


/* Process/noise */


/* Process/rankFilters */


//* Process/statistics */


//* Process/type */


//* Process/type */


/* Render/view */


/* Render */








/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return red; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return green; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return blue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return alpha; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return luminance; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return chrominanceRed; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return chrominanceBlue; });
/* unused harmony export average */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return hue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return saturation; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return value; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return toRGBA; });
/* unused harmony export tocolor */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return splitChannels; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__(0);
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
'use script';



/**
 * @module color
 */
 

/*
 * Clamp value between 0 and 255 (2^8 -1)
 *
 * @author Jean-Christophe Taveau
 */
const clampUint8 = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* clamp */])(0,255);
 
/**
 * Compute color pixel value from gray uint8 value 
 * @param {number} gray8 - uint8 gray value 
 * @return {number} color Pixel value 
 */
const fromGray8 = (gray8) => Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? 0xff000000 | gray8 << 16 | gray8 << 8 | gray8 & 0xff : gray8 << 24 | gray8 << 16 | gray8 << 8 | 0xff;

/**
 * Convert color pixel value to an array with red, green, blue, and alpha uint8 values
 * @param {number} color - color Pixel value 
 * @return {array} An array of red, green, blue, and alpha uint8 components
 */
const fromcolor = (color) => [(color >> 24) & 0xff, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];

const tocolor = (r,g,b,a) => ( r << 24) | (g << 16) | (b << 8) | a;

// TODO
const fromABGR = (abgr) => ( abgr << 24) | (abgr << 16) | (abgr << 8) | abgr;

/**
 * Compute RGBA pixel value from four uint8 red, green, blue, and alpha components 
 * @param {number} red - uint8 red component 
 * @param {number} green - uint8 green component 
 * @param {number} blue - uint8 blue component 
 * @param {number} alpha - uint8 alpha component 
 * @return {number} ABGR Pixel value 
 */
const toRGBA = (r,g,b,a) => (Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? (( a << 24) | (b << 16) | (g << 8) | r) : (( r << 24) | (g << 16) | b << 8) | a);

// TODO
const toabgr = (color) => ( (color & 0xff) << 24) | ( (color & 0x00ff00) << 8) | ( (color & 0xff0000) >> 8) | ( (color & 0xff000000) >> 24);

/**
 * Extract red component of color pixel value
 * @param {number} color - color Pixel value 
 * @return {number} uint8 value 
 */
const alpha = (color) => Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? color >> 24 & 0xff : color & 0xff;

/**
 * Extract green component of color pixel value
 * @param {number} color - color Pixel value 
 * @return {number} uint8 value 
 */
const blue = (color) => Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? color >> 16 & 0xff : color >> 8 & 0xff;

/**
 * Extract blue component of color pixel value
 * @param {number} color - color Pixel value 
 * @return {number} uint8 value 
 */
const green = (color) => Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? color >> 8 & 0xff : color >> 16 & 0xff;

/**
 * Extract alpha (transparency) component of color pixel value
 * @param {number} color - color Pixel value 
 * @return {number} - uint8 value 
 */
const red = (color) => Object(__WEBPACK_IMPORTED_MODULE_0__utils__["g" /* isLittleEndian */])() ? color & 0xff : color >> 24 & 0xff;

/**
 * Compute Luminance gray value from color pixel value
 * @param {number} color - color Pixel value 
 * @return {number} Luminance uint8 value 
 */
const luminance = (color) => {
  /*
  Franci Penov and Glenn Slayden
  From https://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
  Photometric/digital ITU BT.709: Y = 0.2126 R + 0.7152 G + 0.0722 B
  Digital ITU BT.601 (gives more weight to the R and B components): Y = 0.299 R + 0.587 G + 0.114 B
  Approximation #1: Y = 0.33 R + 0.5 G + 0.16 B
  Approximation #2: Y = 0.375 R + 0.5 G + 0.125 B
  Fast: Y = (R+R+B+G+G+G)/6
  Fast: Y = (R+R+R+B+G+G+G+G)>>3
  */
  
  let r = red(color);
  let g = green(color);
  let b = blue(color);
  return (r+r+r+b+g+g+g+g)>>3; 
};

/**
 * Extract chrominance red component of color pixel value according to the YUV colorspace
 * @param {number} color - Color Pixel value 
 * @return {number} - uint8 value 
 */
const chrominanceRed = (color) => -0.168736 * red(color) - 0.331264 * green(color) + 0.500000 * blue(color) + 128;

/**
 * Extract chrominance blue component of color pixel value according to the YUV colorspace
 * @param {number} color - color Pixel value 
 * @return {number} - uint8 value 
 */
const chrominanceBlue = (color) => 0.500000 * red(color) - 0.418688 * green(color) - 0.081312 * blue(color) + 128;

/**
 * Convert color pixel value to Average gray value
 * @param {number} color - color Pixel value 
 * @return {number} uint8 value
 */
const average = (color) => Math.floor(red(color) + green(color) + blue(color) / 3.0);

/**
 * Extract hue component of color pixel value according to HSV colorspace
 * @param {number} color - color Pixel value 
 * @return {number} - uint8 value 
 */
const hue = (color) => {
  const ratio = (a,b,delta) => (a-b)/delta;
  
  let r = T.red(color) / 255.0, g = T.green(color) / 255.0, b = T.blue(color) / 255.0;
  let maxi = Math.max(r,Math.max(g,b));
  let mini = Math.min(r,Math.min(g,b));
  let delta = maxi - mini;
  let out = (maxi === 0 || mini === maxi) ? 0 :
    ( (maxi === r) ? (60 * ratio(g,b,delta) + 0) % 360 : 
      ( (maxi === g) ? 60 * ratio(b,r,delta) + 120 : 60 * ratio(r,g,delta) + 240 ) ); 
  return clampUint8(Math.floor(out / 360.0 * 255));
};

const hue2 = (color) => {
  let r = T.red(color), g = T.green(color), b = T.blue(color);
  let maxi = Math.max(r,Math.max(g,b));
  let mini = Math.min(r,Math.min(g,b));

  if (maxi === 0 || maxi === mini) {
    return 0;
  }
  
  if (maxi === r) {
    return  Math.max(0,Math.min(Math.floor(0 + 43 * (g - b) / (maxi - mini),255)));
  }
  else if (maxi === g) {
    return Math.max(0,Math.min(85 + 43 * (b - r) / (maxi - mini)));
  }
  else {
    return Math.max(0,Math.min(171 + 43 * (r - g) / (maxi - mini)));
  }
}

/**
 * Extract saturation component of color pixel value  according to HSV colorspace
 * @param {number} color - color Pixel value 
 * @return {number} - uint8 value 
 */
const saturation = (color) => {
  let r = T.red(color), b = T.blue(color), g = T.green(color);
  let maxi = Math.max(r,Math.max(g,b));
  let mini = Math.min(r,Math.min(g,b));
  return (maxi === 0) ? 0 : (1.0 - mini/maxi) * 255;
};

/**
 * Extract `value` component of color pixel value according to HSV colorspace
 * @param {number} color - color Pixel value 
 * @return {number} - uint8 value 
 */
const value = (color) => Math.max(T.red(color),Math.max(T.green(color), T.blue(color)));


/**
 * Split channels of color Raster according to various colorspaces
 *
 * @param {function} fns - A series of functions among:
 * <ul>
 * <li> red(px), green(px),blue(px),alpha(px),</li>
 * <li> hue(px),saturation(px),value(px),</li>
 * <li> cyan(px),magenta(px),yellow(px),</li>
 * <li> luminance(px), chrominance(px)</li>
 * </ul>
 * @param {Raster} color_img - A color image
 * @param {boolean} copy - Useless here, only for compatibility with the other process functions
 * @return {Stack} Return a stack containing the channels of various colorspaces
 * @see color.js
 */
const splitChannels = (...fns) => (color_img,copy = true) => {
  let stack = new T.Stack("Split Channels","uint8",color_img.width,color_img.height,fns.length);
  stack.slices.forEach( (sli) => sli.pixelData = T.Raster.createPixels('uint8',color_img.length) );
  stack.slices.forEach( (sli,i) => {
    sli.label = fns[i].name;
    sli.pixelData.forEach( (px,j,pixels) => pixels[j] = fns[i](color_img.pixelData[j]));
  });
  return stack;
};


// Exports
 
 
 



/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return crop; });
/*
 *  times: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of times
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with times.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



/**
 * @module geometry
 */

/**
  * Crop raster 
  * @param {number} topleft_x - X-coordinate of the top left corner
  * @param {number} topleft_y - Y-coordinate of the top left corner
  * @param {number} new_width - Width of the cropped raster
  * @param {number} new_height - Height of the cropped raster
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const crop = (top_left_x, top_left_y,new_width,new_height) => (raster,copy_mode=true) => {
  let output = T.Raster.from(raster,false);
  let pixels = Array.from({length: new_height}, (v,i) => top_left_x + (top_left_y + i) * raster.width)
    .reduce( (accu,xy) => {
      let chunk = raster.pixelData.slice( xy, xy + new_width);
      return [...accu, ...chunk];
    },[]);
  output.width = new_width;
  output.height = new_height;
  output.setPixelData(pixels);
  return output;
}
  

/**
  * Flip vertically
  */
const flipV = (angle) => (raster,copy_mode=true) => console.log('TODO: flipV');

/**
  * Flip horizontally
  */
const flipH = (angle) => (raster,copy_mode=true) => console.log('TODO: flipH');

/**
  * Pad - <strong>TODO</strong>
  * 
  */
const pad = (topleft_x,topleft_y,new_width, new_height,value) => (img,copy_mode=true) => {
  let output = new T.Raster(img.type,new_width,new_height);
  output.pixelData = T.Raster.createPixels(output.type,output.length);
  for (let y = 0; y < img.height; y++) {
    let chunk = img.pixelData.slice(y * img.width, (y+1) * img.width);
    chunk.forEach ( (px, index) => ouput.pixelData[topleft_x + index + topleft_y * img.width] = px);
  }
  return output;
};
  
/**
  * Rotate
  */
const rotate = (angle) => (raster,copy_mode=true) => console.log('TODO: rotate');

/**
  * Scale
  */
const scale = (scalex, scaley) => (raster,copy_mode=true) => console.log('TODO: scale');

/**
  * Translate
  */
const translate = (angle) => (raster,copy_mode=true) => console.log('TODO: translate');


// Exports



/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return canny; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return laplacian3x3; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return laplacian5x5; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return sobel3x3; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__filters_common_js__ = __webpack_require__(1);
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */





/**
 * @module edgeDetect
 */
 

/**
 * Laplacian 3x3 Edge Detection Filter
 *    -1,-1,-1,
 *    -1, 8,-1,
 *    -1,-1,-1
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - A filtered image
 *
 * @author Jean-Christophe Taveau
 */
const laplacian3x3 = (wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy=true) => {

  // Laplacian3x3 Filter: Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
  const laplaceFunc = (index,pixels,width,height,kernel,borderFunc) => {
    // All is hard-coded for speed
    // `kernel` is unused
    let x = cpu.getX(index,width);
    let y = cpu.getY(index,width);
    let p0 = borderFunc(pixels, x - 1,  y - 1,width,height);
    let p1 = borderFunc(pixels, x    ,  y - 1,width,height);
    let p2 = borderFunc(pixels, x + 1,  y - 1,width,height);
    let p3 = borderFunc(pixels, x - 1,  y    ,width,height);
    let p4 = borderFunc(pixels, x    ,  y    ,width,height);
    let p5 = borderFunc(pixels, x + 1,  y    ,width,height);
    let p6 = borderFunc(pixels, x - 1,  y + 1,width,height);
    let p7 = borderFunc(pixels, x    ,  y + 1,width,height);
    let p8 = borderFunc(pixels, x + 1,  y + 1,width,height);
   
    return -p0 - p1 - p2 - p3 + 8 * p4 - p5 - p6 - p7 - p8;
  };

  // Main
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

  let output =  T.Raster.from(raster,false);

  // 1-pass filter 
  output.pixelData = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](raster.pixelData,raster.width,raster.height,null,border,laplaceFunc);

  // Normalize image?
  // cpu.statistics(output);

  return output;
}

/**
 * Laplacian 5x5 Edge Detection Filter
 *
 * @param {number} wrap - Wrap mode for border handling
 * @param {Raster} raster - Input raster
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {Raster} - A filtered image
 *
 * @author Jean-Christophe Taveau
 */
const laplacian5x5 = (wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy=true) => {
  // Main
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

  let output =  T.Raster.from(raster,false);

  // Must be hard-coded?
  let kernel = cpu.convolutionKernel(
    cpu.KERNEL_SQUARE, 5, 5,                        
    [
      0, 0,-1, 0, 0,
      0,-1,-2,-1, 0,
     -1,-2,16,-2,-1,
      0,-1,-2,-1, 0,
      0, 0,-1, 0, 0,

   ],
    false // No kernel normalization!!  
  );

  // 1-pass filter 
  output.pixelData = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](raster.pixelData,raster.width,raster.height,kernel,border,__WEBPACK_IMPORTED_MODULE_0__filters_common_js__["d" /* linearFunc */]);

  // Normalize image?
  // cpu.statistics(output);

  return output;
}

/**
 * Sobel 3x3 Edge Detection Filter
 *
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - A filtered image
 *
 * @author Jean-Christophe Taveau
 */
const sobel3x3 = (wrap = cpu.BORDER_CLAMP_TO_EDGE) => (raster,copy=true) => {

  // Sobel Filter: Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
  const sobelFunc = (index,pixels,width,height,kernel,borderFunc) => {
    // All is hard-coded for speed
    // `kernel` is unused
    let x = cpu.getX(index,width);
    let y = cpu.getY(index,width);
    let p0 = borderFunc(pixels, x - 1,  y - 1,width,height);
    let p1 = borderFunc(pixels, x    ,  y - 1,width,height);
    let p2 = borderFunc(pixels, x + 1,  y - 1,width,height);
    let p3 = borderFunc(pixels, x - 1,  y    ,width,height);
    // p4 is always zero, here.
    let p5 = borderFunc(pixels, x + 1,  y    ,width,height);
    let p6 = borderFunc(pixels, x - 1,  y + 1,width,height);
    let p7 = borderFunc(pixels, x    ,  y + 1,width,height);
    let p8 = borderFunc(pixels, x + 1,  y + 1,width,height);

    let Gx = p0 - p2 + 2 * p3 - 2 * p5 + p6 -p8;
    let Gy = p0 + 2 * p1 + p2 - p6 - 2 * p7 - p8;
    
    return Math.sqrt(Gx * Gx + Gy * Gy);
  };

  // Main
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

  let output =  T.Raster.from(raster,false);

  // convolution
  let tmp = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](new Float32Array(raster.pixelData),raster.width,raster.height,null,border,sobelFunc);

  /*
  // Define separable kernels
  let kernelX_pass1 = cpu.convolutionKernel(cpu.KERNEL_SQUARE, 3, 1, [-1,0,1],false);
  let kernelX_pass2 = cpu.convolutionKernel(cpu.KERNEL_SQUARE, 1, 3, [1,2,1],false);
  let kernelY_pass1 = cpu.convolutionKernel(cpu.KERNEL_SQUARE, 3, 1, [1,2,1],false);
  let kernelY_pass2 = cpu.convolutionKernel(cpu.KERNEL_SQUARE, 1, 3, [-1,0,1],false);
  
  let kernelX = cpu.convolutionKernel(
    cpu.KERNEL_SQUARE, 3, 3,                        
    [
       1,0,-1,
       2,0,-2,
       1,0,-1
    ],
    false // No kernel normalization!!  
  );

  let kernelY = cpu.convolutionKernel(
    cpu.KERNEL_SQUARE, 3, 3,                        
    [
       1, 2, 1,
       0, 0, 0,
      -1,-2,-1
    ],
    false // No kernel normalization!!  
  );
  
  // 2-pass filter 

  let tmp = fltr._convolve(raster.pixelData,raster.width,raster.height,kernelX_pass1,border,fltr.linearFunc);
  let gradientX = fltr._convolve(tmp,raster.width,raster.height,kernelX_pass2,border,fltr.linearFunc);
  tmp = fltr._convolve(raster.pixelData,raster.width,raster.height,kernelY_pass1,border,fltr.linearFunc);
  let gradientY = fltr._convolve(raster.pixelData,raster.width,raster.height,kernelY,border,fltr.linearFunc);

  // 1-pass filter 
  // For temporary computations, use Float32Array
  let gradientX = fltr._convolve(new Float32Array(raster.pixelData),raster.width,raster.height,kernelX,border,fltr.linearFunc);
  let gradientY = fltr._convolve(new Float32Array(raster.pixelData),raster.width,raster.height,kernelY,border,fltr.linearFunc);
  
  // Absolute values - faster
  // output.pixelData = gradientX.map( (px,i) => Math.abs(px) + Math.abs(gradientY[i]) );

  // square root
  let tmp = gradientX.map( (gx,i) => Math.trunc(Math.sqrt(gx * gx + gradientY[i] * gradientY[i])) );
 */
  // Normalize image?
  output.pixelData = (output.type === 'uint8' ? new Uint8ClampedArray(tmp) : (output.type === 'uint16' ? new Uint16Array(tmp) : tmp) );

  // cpu.statistics(output);
  console.log('SOBEL');
  console.log(output);
  return output;
}

// http://www.tomgibara.com/computer-vision/CannyEdgeDetector.java

/**
 * Find edges in an image using Canny Algorithm. 
 * This implementation follows the algorithm presented at 
 * https://rosettacode.org/wiki/Canny_edge_detector
 * Ported in ECMAScript
 *
 *
 * @param {number} low_thr - Low threshold for hysteresis
 * @param {number} high_thr - High threshold for hysteresis (ratio 3:1 or 2:1)
 * @param {number} kernelSize - Size of kernel for Gaussian Blur
 * @param {number} sigma - Standard deviation for the Gaussian blur
 *
 * @author Cecilia Ostertag - Canny implementation
 * @author Peter Bock - Gaussian Blur implementation
 */

const canny = (low_thr, high_thr = low_thr * 3, kernelSize = 5, sigma = 1.0, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy_mode=true) => {

  const gaussianKernel = (kernelSize,sigma) => {
    // TODO
  };

  // Kernel Operation for gradient, magnitude, theta and theta direction
  const gradientFunc = (index,pixels,width,height,borderFunc) => {
    // All is hard-coded for speed
    let x = cpu.getX(index,width);
    let y = cpu.getY(index,width);
    let p0 = borderFunc(pixels, x - 1,  y - 1,width,height);
    let p1 = borderFunc(pixels, x    ,  y - 1,width,height);
    let p2 = borderFunc(pixels, x + 1,  y - 1,width,height);
    let p3 = borderFunc(pixels, x - 1,  y    ,width,height);
    // p4 is always zero, here.
    let p5 = borderFunc(pixels, x + 1,  y    ,width,height);
    let p6 = borderFunc(pixels, x - 1,  y + 1,width,height);
    let p7 = borderFunc(pixels, x    ,  y + 1,width,height);
    let p8 = borderFunc(pixels, x + 1,  y + 1,width,height);

    let Gx = p0 - p2 + 2 * p3 - 2 * p5 + p6 -p8;
    let Gy = p0 + 2 * p1 + p2 - p6 - 2 * p7 - p8;
    let magnitude = Math.hypot(Gx, Gy);
    let theta = Math.atan2(Gy,Gx);
    // thetaDirection: 0 (0°), 1 (45°), 2 (90°), 3 (135°)
    let thetaDirection = ((Math.round(theta * (5.0 / Math.PI)) + 5) % 5) % 4;
    return {mag: magnitude, thetaQ: thetaDirection};
  };

  // Specific convolve for returning array of objects
  const gradConvolve = (data,width,height,borderFunc) => {
    return data.reduce( (output, px, index, pixels) => {
      output[index] = gradientFunc(index,pixels,width,height,borderFunc);
      return output;
    }, new Array(width * height));
  };

  // Performs non maximum suppression in 8-connectivity
  // Pixels that are not the maximum value in their gradient direction 
  // are replaced by the lowest pixel value according to the image type
  const nonmaxAndThreshold = (W, H, grad, type,low,high) => {

    // Get pixel value from XY-coordinates
    const valueAt = (array, x,y,width) => array[x + y * width];

    // lowest value according to image type
    let valnull = (type =grad== 'float32') ? -1 : 0;
     
    return grad.reduce( (output,val,i,grd) => {
        let x = i % W;
        let y = Math.floor(i / W);
        let maxValue = 
          // Suppress pixels at the image edge
          ( x === 0 || x === W-1  || y === 0 || y === H-1 ) ? valnull : (  
            (
              //E-W horizontal direction : compare with previous and next pixel
              ( val.thetaQ === 0 && ( val.mag <= valueAt(grd,x-1,y,W).mag || val.mag <= valueAt(grd,x+1,y,W).mag ) ) || 
              //NE-SW direction : compare with previous and next pixel
              ( val.thetaQ === 1 && ( val.mag <= valueAt(grd,x+1,y-1,W).mag || val.mag <= valueAt(grd,x-1,y+1,W).mag ) ) || 
              //N-S vertical direction : compare with previous and next pixel
              ( val.thetaQ === 2 && ( val.mag <= valueAt(grd,x,y-1,W).mag || val.mag <= valueAt(grd,x,y+1,W).mag ) ) || 
              //NW-SE direction : compare with previous and next pixel
              ( val.thetaQ === 3 && ( val.mag <= valueAt(grd,x-1,y-1,W).mag || val.mag <= valueAt(grd,x+1,y+1,W).mag ) )  
            ) ? valnull : val.mag);
        // Double Threshold
        let edge = (maxValue > high) ? {value: 255,edge: 2} : ( (maxValue > low) ? {value: 0,edge: 1} : {value: 0,edge: 0});
        output[i] = edge;
        return output;
    },new Array(W * H));
  };

  const hysteresis = (width, array) => {
    return array.reduce( (output,edge,i) => {
      output.push(edge.value);
      return output;
    },[]);
  };

  /////// M A I N ///////
	let output = T.Raster.from(raster, false);
	output.type = 'uint8';
  output.pixelData = new Uint8ClampedArray(raster.length);
  
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

	if (raster.type === 'uint16') {
		low_thr*=256;
		high_thr*=256;
	}
	if (raster.type === 'float32') {
		low_thr=low_thr/128-1.0;
		high_thr=high_thr/128-1.0;
  }
  
  // Step #1 - Gaussian Blur Filter
  /*
	let data = fltr._convolve(
    new Float32Array(raster.pixelData),
    raster.width,raster.height,
    gaussianKernel(kernelSize,sigma),
    border,
    fltr.linearFunc
  );
  */
  console.log('Canny...');
  let data = raster.pixelData;

  // Step #2 - Gradient computation, theta and 4 directions : 0, 45, 90, 135
  let gradient = gradConvolve(data,raster.width,raster.height,border);

  // Step #3 - Non-maximum suppression + double threshold
  // 2: Strong Edge
  // 1: Weak Edge
  // 0: No Edge
  const edges = nonmaxAndThreshold(raster.width, raster.height, gradient, raster.type,low_thr, high_thr);

  // Step #4 - Edge tracing with hysteresis : weak pixels near strong pixels
	output.pixelData = hysteresis(raster.width, edges);
  console.log(output.pixelData);

  return output;
}







/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return KERNEL_RECTANGLE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return KERNEL_CROSS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return KERNEL_DIAMOND; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return KERNEL_CIRCLE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return KERNEL_SQUARE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return BORDER_CLAMP_TO_EDGE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return BORDER_CLAMP_TO_BORDER; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return BORDER_REPEAT; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return BORDER_MIRROR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "k", function() { return convolve; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "j", function() { return convolutionKernel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "l", function() { return mean; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "m", function() { return meanKernel; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__filters_common_js__ = __webpack_require__(1);
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */





/**
 * @module filters
 */
 
const CPU_HARDWARE = 0;

const GPU_HARDWARE = 1;

const KERNEL_RECTANGLE = 0;

const KERNEL_CROSS = 1;

const KERNEL_DIAMOND = 2;

const KERNEL_CIRCLE = 4;

const KERNEL_SQUARE = 8;

const BORDER_CLAMP_TO_EDGE = 0;

const BORDER_CLAMP_TO_BORDER = 1;

const BORDER_REPEAT = 2;

const BORDER_MIRROR = 4;

/*
 * Pre-calculate convolution kernel offsets 
 *
 * @author Jean-Christophe Taveau
 */
const getKernelOffsets = (type, w, h, weights, stepX = 1, stepY = 1) => {
  const getOffsetX = (i,w,h) => (cpu.getX(i,w) - Math.floor(w/2.0) ) * stepX; 
  const getOffsetY = (i,w,h) => (cpu.getY(i,w) - Math.floor(h/2.0) ) * stepY;

  let offsets;

  if (type === KERNEL_RECTANGLE || type === KERNEL_SQUARE) {
    offsets = Array.from(
      {length: w * h}, 
      (v, i) => ({offsetX: getOffsetX(i,w,h), offsetY: getOffsetY(i,w,h), weight: weights[i]}) 
    );
  }
  else if (type === KERNEL_CIRCLE) {
    let radius = h;
    let series = Array.from({length: w * w}); 
    offsets = series.reduce( (accu, v, i) => {
      let x = getOffsetX(i,w,w);
      let y = getOffsetY(i,w,w);
      // Distance?
      if (x * x + y * y <= radius * radius) {
        accu.push({offsetX: x,offsetY: y,weight: weights[i]});
      }
      return accu;
    },[]);

  }
  return offsets;
}

/*
 * Kernel for convolution
 *
 * @param {number} type
 * @param {number} size  - size or radius if circular kernel
 * @param {Array[number]} weight - 1D Array containing the various weights. For circular kernel, the weights must be given as an array of length (size * size).
 * @param {boolean} normalize
 * 
 * @author Jean-Christophe Taveau
 */
const convolutionKernel = (type, width, height_or_radius, weights, normalize = true) => {
  // Precalculate weights and offsets
  // Array of objects [{offsetX, offsetY, weight},{offsetX, offsetY, weight}, ..]

  let kernel = getKernelOffsets(type, width, height_or_radius,weights);

  // Compute the sum of kernel weight for normalization
  let sum = kernel.reduce ( (sum,v) => sum + v.weight, 0);
  
  return (normalize) ? kernel.map ( (v) => {v.weight /= sum; return v}) : kernel;
}

/*
 * Kernel for mean filter
 *
 * @author Jean-Christophe Taveau
 */
const meanKernel = (type, width, height_or_radius, normalize = true) => {
  // Precalculate weights and offsets
  let kernel = getKernelOffsets(hardware, type, width, height_or_radius, weights);
  // Compute the sum of kernel weight for normalization
  let sum = kernel.reduce ( (sum,v) => sum + v, 0);
  
  return (normalize) ? kernel.map ( (v) => v.weight /= sum) : kernel;
}

const gaussBlurKernel = (type, size, normalize = true) => {
  // Precalculate weights and offsets
  let kernel = getKernelOffsets(hardware, type, size, size, radius);
  // Compute the sum of kernel weight for normalization
  let sum = kernel.reduce ( (sum,v) => sum + v, 0);
  
  return (normalize) ? kernel.map ( (v) => v.weight /= sum) : kernel;
}


/**
 * Convolve operation
 *
 * @param {[number]} kernel - Convolution mask
 * @param {Raster} raster - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {Raster} - Filtered Image
 *
 * @author Jean-Christophe Taveau
 */
const convolve = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy=true) => {

  // Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
  const linearFunc = (index,pixels,width,height,kernel,borderFunc) => {
    return kernel.reduce( (sum,v) => {
      sum += borderFunc(
        pixels,
        cpu.getX(index,width) + v.offsetX, 
        cpu.getY(index,width) + v.offsetY,
        width,height
      ) * v.weight;
      return sum;
    },0.0);  
  };

  // Main 
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));
  console.log(border.name);

  let output =  T.Raster.from(raster,false);

  output.pixelData = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](raster.pixelData,raster.width,raster.height,kernel,border,linearFunc);

  return output;
}


/**
 * Convolve operation using separable kernels
 *
 * @param {array[number]} kernel1 - Convolution mask for first pass
 * @param {array[number]} kernel2 - Convolution mask for second pass
 * @param {number} wrap - Wrap mode for managing the raster border
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Filtered Image
 *
 * @author Jean-Christophe Taveau
 */
const convolveSeparable = (kernel1, kernel2, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy=true) => {
  let output =  TRaster.from(img,copy);
  // TODO
  // First pass
  // Second pass
  
  return output;
}

/**
 * Gaussian Blur Filter
 *
 * @param {TRaster} kernel - Convolution mask
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Filtered Image
 *
 * @author TODO
 */
const gaussBlur = (kernel) => (raster,copy=true) => {
  // TODO
  return convolve(kernel)(raster,copy);
}

/**
 * Gaussian Mean Filter
 *
 * @param {TRaster} kernel - Convolution mask
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Filtered Image
 *
 * @author TODO
 */
const mean = (kernel) => (raster,copy=true) => {
  return convolve(kernel)(raster,copy);
}






/***/ }),
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export findMaxima */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return houghLines; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return houghCircles; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

/**
 * @module hough
 */
 
/**
 * Linear Hough Transform
 * Ported from http://rosettacode.org/wiki/Hough_transform#Java
 * 
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Image corresponding to the accumulator
 *
 * @author Théo Falgarone
 * @author Jean-Christophe Taveau
 */
const houghLines = (theta_hough_width, rho_height, keep_source = false) => (raster,copy=true) => {
  let output =  T.Raster.from(raster,false);
  let w = raster.width;
  let h = raster.height;

  // Hough height must be even
  let rho_hough_height = Math.trunc(rho_height / 2.0) * 2;
  let cy = rho_hough_height / 2.0;

  let maxRadius = Math.ceil(Math.hypot(w,h));
  let half_rho_hough_height = rho_hough_height / 2.0;

  console.log(`${theta_hough_width} x ${rho_hough_height} = ${theta_hough_width * rho_hough_height} ${maxRadius}`);
  // Update width
  output.width = theta_hough_width;
  output.height = rho_hough_height;
  output.type = 'float32';

  // Precompute theta, cos(theta), sin(theta)
  let thetas = Array.from({length : theta_hough_width }, (v,i) => {
    let th = i * Math.PI / theta_hough_width;
    return {theta: th, cos: Math.cos(th),sin:Math.sin(th)};
   } );

  // Computation
  output.pixelData = raster.pixelData.reduce( (hspace, px, index) => {
    let x = index % w;
    let y = Math.floor(index/w);

    if (px === 0) {
      thetas.forEach( (th,k) => {
        let rho = th.cos * x + th.sin * y;
        let rScaled = cy + Math.trunc(Math.round(rho * half_rho_hough_height / maxRadius));
        hspace[k + rScaled * theta_hough_width] += 1.0;
      });
    }
    return hspace;

  },new Float32Array(theta_hough_width * rho_hough_height).fill(0) );

  return output;
}

/**
 * Calculate and fill the hough space using Parallel Coordinates
 * Markéta Dubská, Jiří Havel, Adam Herout (2011) Real-time detection of lines using parallel coordinates and OpenGL
 * Proceeding SCCG '11 Proceedings of the 27th Spring Conference on Computer Graphics
 * doi:10.1145/2461217.2461245
 *
 * @param {raster} raster - image raster
 * @param {image float32} accu - hough space accumulator
 * @return {image float32} accu - calculate hough space accumulator
 *
 * @author Tristan Maunier
 * @author Jean-Christophe Taveau - Functional Programming
 */

const houghPClines = (hough_width, hough_height) => (raster,copy_mode = true) => {

  // Bresenham Algorithm (Wikipedia)
  const drawLine = (x1,  y1,  x2,  y2, pixels, w) => {
  let dx, dy ;
  let e ; // Error value
  e  = x2 - x1 ;        // -e(0,1)
  dx = e * 2 ;          // -e(0,1)
  dy = (y2 - y1) * 2 ;  // e(1,0)
  let x = x1, y = y1;
  while (x <= x2) {
    pixels[x + w * y]++;
    x++ ;  // colonne du pixel suivant
    if ( (e = e - dy) <= 0) {  // erreur pour le pixel suivant de même rangée
      y++;  // choisir plutôt le pixel suivant dans la rangée supérieure
      e += dx ;  // ajuste l’erreur commise dans cette nouvelle rangée
    }
  }  
  // Le pixel final (x2, y2) n’est pas tracé.
  pixels[x + w * y]++;
  };

  let output = T.Raster.from(raster,false);
  output.type = 'float32';
  output.width = hough_width;
  output.height = hough_height;

  let D = hough_width / 2;
  let V = hough_height / 2;
  output.pixelData = raster.pixelData.reduce ( (hspace,px) => {
    // raster must be `binary` containing pixel values core.PIXEL_TRUE and core.PIXEL_FALSE
    if (px  === 0) {
      drawLine(0, -y+V, D,x+V,hspace,hough_width);
      drawLine(D,x+V,2*D,y+V,hspace,hough_width);
    }
    return hspace;
  }, new Float32Array(hough_width * hough_height).fill(0));

  return output;
}


/**
 * Circular Hough Transform
 *
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Image corresponding to the accumulator
 *
 * @author TODO
 */
const houghCircle = (params) => (raster,copy=true) => {
  let ouput =  TRaster.from(raster,copy);
  // TODO
  return output;
};

/**
 * Find Local Maxima in raster
 * 
 * @param {type} params - Parameters
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Image corresponding to the accumulator
 *
 * @author TODO
 */
const findMaxima = (kernel,height) => (raster,copy=true) => {
  // TODO
  // return an array of maxima containing the XY-coordinates and peak height.
  return [];
};

/**
 * Draw Lines from local maxima extracted from hough space
 * 
 * @param {array} peaks - Array of objects containing (theta, rho, px)
 * @return {array} - Array of XY-coordinates defining the various lines
 *
 * @author Théo Falgarone
 */
const getHoughLines = (peaks) => {

  for (let x=0 ; x<rast.length ; x++){
    for (let i=0 ; i<peaks.length ; i++){
      let y = Math.round((peaks[i].rho - x * Math.cos(lines[i].theta)) / Math.sin(peaks[i].theta),0);
      (y >= 0 && y < rast.width) ? rast.setPixel(x,y,125) : 0 ;
    }
  }

  // TODO
  // return an array of lines as a 4-component (vec4) containing XY-coordinates (x1,y1,x2,y2) from (0.0,0.0) to (1.0, 1.0).
  return rast;
}




/***/ }),
/* 18 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return black; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return calc; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return chessboard; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return fill; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return fillColor; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return math; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "g", function() { return ramp; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "h", function() { return spiral; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "i", function() { return white; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

/**
 * @module math
 */
 

/**
  * Fill with the pixel gray or color value depending of the raster type
  * @param {number} value - A gray or color value
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const fillColor = (value) => (raster,copy_mode=true) => {
  raster.pixelData.fill(value);
  return raster;
}

/**
  * Pattern `chessboard`. Must be used with T.fill(..)
  *
  * @example
  * let output = T.fill(T.chessboard)(raster)
  *
  * @author Jean-Christophe Taveau
  */
const chessboard = (px,i,x,y) => ( (Math.floor(x/16) + Math.floor(y/16)) % 2 === 0) ? 255 : 0;

/**
  * Pattern `ramp`. Must be used with T.fill(..)
  *
  * @example
  * let output = T.fill(T.ramp)(raster)
  *
  * @author Jean-Christophe Taveau
  */
const ramp = (px,i,x,y,z,w,h) => x / w * 255;

/**
  * Pattern `spiral`. Must be used with T.fill(..)
  *
  * @example
  * let output = T.fill(T.spiral)(raster)
  *
  * @author Jean-Christophe Taveau
  */
const spiral = (px,i,x,y,z,w,h,a,d) => 128 * (Math.sin(d / 10 + cpu.radians(a))+1);

/**
  * Pattern `black`. Must be used with T.fill(..)
  *
  * @example
  * let output = T.fill(T.black)(raster)
  *
  * @author Jean-Christophe Taveau
  */
const black = (px) => 0;

/**
  * Pattern `white`. Must be used with T.fill(..)
  *
  * @example
  * let output = T.fill(T.white)(raster)
  *
  * @author Jean-Christophe Taveau
  */
const white = (px) => 255;

  
/**
  * Fill with values calculated from a function
  *
  * @param {function} func - A function
  * <p>The function may take a maximum of nine arguments:</p>
  * <ul>
  * <li>pix - Pixel value</li>
  * <li>index - Index corresponding to pix. A raster is a 1D pixels array</li>
  * <li>x - X-coordinate of pix</li>
  * <li>y - Y-coordinate of pix</li>
  * <li>z - Z-coordinate of pix if raster is in 3D</li>
  * <li>w - Width of raster</li>
  * <li>h - Height of raster</li>
  * <li>a - Angle calculated as atan2(y/x)</li>
  * <li>d - Distance to the center</li>
  * </ul>
  * @example <caption>Fill with a spiral</caption>
  * const DEG = Math.PI / 180;
  * const spiral = (pix,i,x,y,z,w,h,a,d) => 128 * (Math.sin(d / 10+ a * DEG)+1);
  * let raster = T.fill(spiral)(img.getRaster() );
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const fill = (func) => (raster,copy_mode=true) => {
  let w = raster.width;
  let h = raster.height;
  let nz = raster.depth || raster.nslices || 0;
  let cx = w / 2.0;
  let cy = h / 2.0;
  let cz = nz / 2.0;
  
  raster.pixelData.forEach ( (px,i,arr) => {
    let x = i % w;
    let y = Math.floor(i / w);
    let z = Math.floor( i / w / h);
    let d = Math.sqrt ((x - cx)**2 + (y - cy)**2 + (z - cz)**2);
    let a = Math.atan2(y,x);
    arr[i] = func(px,i,x,y,z,w,h,a,d);
  });
  return raster;
};
  

/**
  * Fill with values calculated from a function
  *
  * @param {function} func - A function
  * <p>The function may take a maximum of nine arguments:</p>
  * <ul>
  * <li>pix - Pixel value</li>
  * <li>index - Index corresponding to pix. A raster is a 1D pixels array</li>
  * <li>x - X-coordinate of pix</li>
  * <li>y - Y-coordinate of pix</li>
  * <li>z - Z-coordinate of pix if raster is in 3D</li>
  * <li>w - Width of raster</li>
  * <li>h - Height of raster</li>
  * <li>a - Angle calculated as atan2(y/x)</li>
  * <li>d - Distance to the center</li>
  * </ul>
  * @example <caption>Fill with a spiral</caption>
  * const DEG = Math.PI / 180;
  * const spiral = (pix,i,x,y,z,w,h,a,d) => 128 * (Math.sin(d / 10+ a * DEG)+1);
  * let raster = T.fill(spiral)(img.getRaster() );
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const math = (func) => (raster,copy_mode=true) => cpu.fill(func)(T.Raster.from(raster,copy_mode),copy_mode);

/**
 * Image Calculator. Combine two images by operation
 *
 * @param {Raster} raster - Input Raster
 * @param {function} func - Function for computation
 * @param {Raster} raster - Input Raster
 * @param {boolean} copy_mode - Copy mode to manage memory usage.
 * @example <caption>Addition of two uint8 rasters with clamping</caption>
 * let raster3 = T.calc(raster1, (px1,px2) => T.clampUint8(px1 + px2) )(raster2)
 *
 * @author Jean-Christophe Taveau
 */
const calc = (other,func) => (raster,copy_mode=true) => {
  // TODO Assume two raster have same dimension
  let output = T.Raster.from(raster, copy_mode);
  output.pixelData.forEach( (px2,i,arr) => {
    let w = raster.width;
    let x = i % w;
    let y = Math.floor(i / w);
    let px1 = other.pixelData[i];
    output.pixelData[i] = func(px1,px2,i,x,y);
  });
  return output;
};

// Export




/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return noise; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return saltAndPepper; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
/**
 * Add Salt and Pepper Noise
 *
 * @param {number} percent - percentage of noise added to the image
 * @param {Raster} raster - Input image
 * @param {boolean} copy_mode - Used to control the copy (or not) of the image pixels
 * @usage saltAndPepper(0.05)(my_image)
 *
 * @author Jean-Christophe Taveau
 */
const saltAndPepper = (percent=0.05) => (raster,copy_mode = true) => {
  let output = T.Raster.from(raster,copy_mode);
  let pixels = output.pixelData;
  Array.from({length: Math.floor(raster.length * percent)}, x => Math.floor(Math.random() * raster.length) )
    .forEach( (x,i) => pixels[x] = (i%2==0) ? 255 : 0 );
  return output;
};


/** 
 * Adds pseudorandom, Gaussian ("normally") distributed values, with
 * mean 0.0 and the specified standard deviation, to this image or ROI. 
 * Adapted from ImageJ code (Wayne Rasband)
 */
const noise = (standardDeviation = 25.0) => (raster,copy_mode = true) => {
  // Private functions
  const inRange = (x,a_min,a_max) => (x >= a_min && x <= a_max);
  
  // Standard Normal variate using Box-Muller transform.
  const rand_bm = (variance) => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) * variance) * Math.cos( 2.0 * Math.PI * v );
  };

  let dummy = T.statistics(raster);
  let output = T.Raster.from(raster,copy_mode);
  let pixels = output.pixelData;
  let variance = standardDeviation**2;
  raster.pixelData.forEach( (px,i) => {
    do {
      pixels[i] = Math.floor(px + rand_bm(variance));
    } while (!inRange(pixels[i],0,255))
  } );
  return output;
};



    



/***/ }),
/* 20 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return medianFilter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return maximumFilter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return minimumFilter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return varianceFilter; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__filters_common_js__ = __webpack_require__(1);
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */





/**
 * @module rankFilters
 */
 
 
// Helper Function

// Compute Integral Image ?
const integral = (data,func) => {
  // Adapted from 
  // 
  let integral = new Float32Array(raster.length);
  let dummy = raster.pixelData.reduce( (rowSum, px, i) => {
    let x = i % w; // Get X-coord
    rowSum[x] += func(px);
    integral[i] = rowSum[x] + ((x === 0) ? 0.0 : integral[ i - 1]);
    return rowSum;
    }, 
    new Float32Array(w).fill(0.0)
  );  
}

/**
 * Minimum filter
 *
 * @param {TRaster} kernel - Convolution mask
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Filtered Image
 *
 * @author TODO
 */
const minimum = (kernel) => (img,copy=true) => {
  let ouput =  TRaster.from(img,copy);
  // TODO
  return output;
}


/**
 * Variance filter
 * Principle: It will first compute the summed area table of 
 * all the pixels wihtin the first img and after compute the summed squared area 
 * table of all the pixels within the img2.
 * After this process the two img are then padded with 0 according to
 * the dimension of the convolution mask. 
 * Finally an algorithm based on Integral Image is applied to compute 
 * the variance.
 *
 * @param {TRaster} kernel - Convolution mask represented here by a default value = 2
   with this algorithm the kernel doesn't have to be squared.
 * @param {TRaster} img - Input image to process 
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Filtered Image
 *
 * @author Franck Soubès
 * @author Jean-Christophe Taveau - Bug Fix
 */
const varianceFast = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (img,copy_mode = true) => {

  let output = T.Raster.from(img,copy_mode);
  let w= img.width;
  let h = img.height;
  let wk = kernel.width;
  let img2 = new T.Image(img.type,w,h);
  let squared = img.pixelData.map((x) => x * x );
  img2.setPixels(squared);
  let imgsqr= T.Raster.from(img2.raster,copy_mode);

  // cf: Grzegorz Sarwas & Sławomir Skoneczny, Object Localization and Detection Using Variance Filter.
  // Compute integral image of sum
  // Compute integral image of squared sum
  // Extract boxes and subtract.

  let sum = integral(raster.pixelData,(x) => x);
  let sumSquared = integral(raster.pixelData,(x) => x * x);
  img2.raster.pixelData.reduce((sum1,px,i) => {
    let x = i%w;
    sum1[x] += px;
    img2.raster.pixelData[i] = sum1[x] + ((x == 0 ) ? 0.0 : img2.raster.pixelData[i-1])
    return sum1;
  },new Float32Array(w).fill(0.0));
    

    /*
    // another method not totally functionnal but way more faster with the use of forEach however it dsnt seem faster than the reduce
    let sum = 0;
     let arr= Array.from(Array(w), () => NaN);
    let width = arr.map((i,x) => x);
    let arr1 = Array.from(Array(h), () => NaN);
    let height = arr1.map((j,y)=>y);
    
    let firstintegral = width.forEach(x =>{
	sum = 0;
	height.forEach(y =>{
	    sum += pixels[x + y*w];
	    (x==0) ? img.pixelData[x+y*w] = sum:img.pixelData[x+y*w] = img.pixelData[(x-1)+y*w] + sum;
	});
    });

    let firstintegral2 = width.forEach(x =>{
	sum = 0;
	height.forEach(y =>{
	    sum += pixels[x + y*w];
	    (x==0) ? img2.raster.pixelData[x+y*w] = sum:img2.raster.pixelData[x+y*w] = img2.raster.pixelData[(x-1)+y*w] + sum;
	});
    });
   */
    
    getvar(padding(output,wk,w,h,false,true),padding(img2,wk,w,h,true,true),img.type,w,h,wk, true); 
 
    return output;
}

/**
 * Padding : Fill with 0 an image in function of the kernel radius.
 *
 * @param {TRaster} img - Input image to process.
 * @param {TRaster} k - Convolution mask represented by a single value (width*height).
 * @param {TRaster} w - width of the image.
 * @param {TRaster} h - height of the image.
 * @param {boolean} flag - if true it will take the raster from the img and the pixelData from the raster
 * if it is false just the pixelData from the raster.
 * @param {boolean} copy - Copy mode to manage memory usage
 * @return {TRaster} - Padded image with 0 and with computed coordinates.
 * 
 * @author Franck Soubès
 */
const padding = function(img,k,w,h,flag,copy_mode = true) {
    
    let ima ;
    if (flag){
	
	ima = img.getRaster();
	ima = ima.pixelData;
    }
    else{
	ima = img.pixelData;
    }

    let new_img = [];
    while(ima.length) new_img.push(ima.splice(0,w));
    let ker = ((k-1)/2) *2;
    let extremity = new Array(ker).fill(0);
    let leftrightpad = new_img => (extremity).concat(new_img).concat(extremity);
    let lenpad = new_img => Array.from(Array(new_img.length), () => 0);
    let updownpad = new_img => [lenpad(new_img[0])].concat(new_img).concat([lenpad(new_img[0])]);
    let balancedpad = new_img  => new_img.map(new_img => leftrightpad(new_img));
    let imagepadded = new_img => balancedpad(updownpad(new_img));
    let returned_image = imagepadded(new_img);
    
    for (let i =0 ; i<ker;i++ ){
	returned_image.push(returned_image[0]);
	returned_image.unshift(returned_image[0]);
    }
      
    img.pixelData = Getcoord(returned_image,w,h,k);
    return img;
}

/**
 * Getcoord : Compute the four coordinates of the main algorithm and treat the edges.
 *
 * @param {Array} img -  Convolution mask represented by a single value
 * width*height of the kernel.
 * @param {hight} w - height of the image.
 * @param {width} h - width of the image.
 * @param {kernel} k - Convolution mask represented by a single value.
 * @return {Array} - return an array of pixel wih computed pixels.
 *
 * @author Franck Soubès
 */
const Getcoord = function (img ,w,h,k,copy_mode=false){
  let img_returned =[];
    
for (let x = k-1  ;  x <= h + (k-2) ; x++){
    for(  let y = k-1  ; y <= w+(k-2) ; y++){
        
        // push black pixel for abberant coordinnates that'll falsify the results
        img[x-1][y-1] == 0 && img[x+k-1][y-1] == 0 ||// left
        img[x+k-1][y+k-1] == 0 && img[x+k-1][y-1]== 0 && img[x+k-1][y+k-1] == 0 || // down
        img[x-1][y-1] == 0 && img[x-1][y+k-1] == 0 ||// up
        img[x+k-1][y+k-1] == 0 && img[x-1][y+k-1] == 0 // right
        ? img_returned.push(0): img_returned.push(img[x-1][y-1]-img[x+k-1][y-1]-img[x-1][y+k-1]+img[x+k-1][y+k-1]);

    }
}
return img_returned; // 1d
}

/**
 * Variance filter : simply apply the variance formula. 
 *
 * @param {TRaster} img1 - Input image to process.
 * @param {TRaster} img2 - Input image to process.
 * @param {TRaster} w - width of the image.
 * @param {TRaster} h - height of the image.
 * @param {TRaster} type - Return the type of the raster (uint8, uint16, float32  or argb).
 * @param {TRaster} kernel -  Convolution mask represented by a single value
 * width*height of the kernel.
 * @return {TRaster} - return an array with computed variance.
 *
 * @author Franck Soubès
 * @author Jean-Christophe Taveau -Bug Fix
 */
const varianceFilter = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy_mode = true) => {

  // Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
  const varianceFunc = (index,pixels,width,height,kernel,borderFunc) => {
    let [sum, sum2] =  kernel.reduce( (sum,v) => {
      // Get pixel value in kernel depending of border management
      let pix = borderFunc(
        pixels,
        cpu.getX(index,width) + v.offsetX, 
        cpu.getY(index,width) + v.offsetY,
        width,height);
      // Sum
      sum[0] += pix;
      sum[1] += pix * pix;
      // Square Sum
      return sum;
    },[0.0,0.0]);
    return (sum2 - (sum * sum)/kernel.length)/(kernel.length - 1);
  };

  // Main
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

  let output =  T.Raster.from(raster,false);

  output.pixelData = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](raster.pixelData,raster.width,raster.height,kernel,border,varianceFunc);
  
  // Normalize image?
  cpu.statistics(output);
  console.log(output.statistics);
  return output;
}

/*
 * Generic rank filter : simply apply the variance formula. 
 *
 * @author Jean-Christophe Taveau -Bug Fix
 */
const rankFilter = (kernel, wrap,raster,copy_mode,rankFunc) => {
  // Calc pixel value at position `index`in array `pixels` of size `width`x`height` with `kernel`
  const kernelFunc = (index,pixels,width,height,kernel,borderFunc) => {
    let values = kernel.reduce( (accu,v) => {
      // Get pixel value in kernel depending of border management
      let pix = borderFunc(
        pixels,
        cpu.getX(index,width) + v.offsetX, 
        cpu.getY(index,width) + v.offsetY,
        width,height);
      accu.push(pix);
      return accu;
    },[]);
    // Minimum, Maximum or Median
    return rankFunc(...values);
  };

  // Main
  let border = (wrap === cpu.BORDER_CLAMP_TO_EDGE) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["c" /* clampEdge */] : ( (wrap === cpu.BORDER_REPEAT) ? __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["e" /* repeat */] : ( (wrap === cpu.BORDER_MIRROR) ? mirror : __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["b" /* clampBorder */]));

  let output =  T.Raster.from(raster,false);

  output.pixelData = __WEBPACK_IMPORTED_MODULE_0__filters_common_js__["a" /* _convolve */](raster.pixelData,raster.width,raster.height,kernel,border,kernelFunc);
  
  // Normalize image?
  cpu.statistics(output);
  console.log(output.statistics);
  return output;
}
/**
 * Minimum filter
 *
 * @param {TRaster} img1 - Input image to process.
 * @param {TRaster} img2 - Input image to process.
 * @param {TRaster} w - width of the image.
 * @param {TRaster} h - height of the image.
 * @param {TRaster} type - Return the type of the raster (uint8, uint16, float32  or argb).
 * @param {TRaster} kernel -  Convolution mask represented by a single value
 * width*height of the kernel.
 * @return {TRaster} - return an array with computed variance.
 *
 * @author ???
 * @author Jean-Christophe Taveau
 */
const minimumFilter = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy_mode = true) => {
  return rankFilter(kernel,wrap,raster,copy_mode,Math.min);
}

/**
 * Maximum filter 
 *
 * @param {TRaster} img1 - Input image to process.
 * @param {TRaster} img2 - Input image to process.
 * @param {TRaster} w - width of the image.
 * @param {TRaster} h - height of the image.
 * @param {TRaster} type - Return the type of the raster (uint8, uint16, float32  or argb).
 * @param {TRaster} kernel -  Convolution mask represented by a single value
 * width*height of the kernel.
 * @return {TRaster} - return an array with computed variance.
 *
 * @author ???
 * @author Jean-Christophe Taveau
 */
const maximumFilter = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy_mode = true) => {
  return rankFilter(kernel,wrap,raster,copy_mode,Math.max);
}

/**
 * Median filter 
 *
 * @param {TRaster} img1 - Input image to process.
 * @param {TRaster} img2 - Input image to process.
 * @param {TRaster} w - width of the image.
 * @param {TRaster} h - height of the image.
 * @param {TRaster} type - Return the type of the raster (uint8, uint16, float32  or argb).
 * @param {TRaster} kernel -  Convolution mask represented by a single value
 * width*height of the kernel.
 * @return {TRaster} - return an array with computed variance.
 *
 * @author ???
 * @author Jean-Christophe Taveau
 */
const medianFilter = (kernel, wrap = cpu.BORDER_CLAMP_TO_BORDER) => (raster,copy_mode = true) => {
  const median = (...values) => {
    values.sort( (a,b) => a - b);
    let half = Math.floor(values.length / 2);
    return (values.length % 2) ? values[half] : (values[half-1] + values[half]) / 2.0;
  };

  return rankFilter(kernel,wrap,raster,copy_mode,median);
}









/***/ }),
/* 21 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return histogram; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return statistics; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */




/**
 * @module statistics
 */
 
/**
 * Computes basic stats: min, max, mean/average and standard deviation of the image.
 * Algorithm for variance found in <a href="https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Two-pass_algorithm">Wikipedia</a>
 * 
 * @param {Raster} raster - Input raster
 * @param {boolean} copy_mode - Useless here, only for compatibility with the other processing functions
 * @return {object} - Returns an object containing min, max, mean, variance
 *
 * @author Jean-Christophe Taveau
 */
const statistics = (raster, copy_mode = true) => {
  let tmp = raster.pixelData.reduce ( (accu,px,i) => {
    accu.min = Math.min(accu.min,px);
    accu.max = Math.max(accu.max,px);
    accu.mean += px;
    accu.n++;
    let delta = px - accu.mean2;
    accu.mean2 += delta/accu.n;
    accu.variance += delta * delta;
    return accu;
  },
  {min: Number.MAX_SAFE_INTEGER, max: 0, mean: 0.0, mean2 : 0.0, n: 0, variance: 0.0}
  );

  // Update stats in this Raster
  raster.statistics = {
    min: tmp.min,
    max: tmp.max,
    count : raster.pixelData.length,
    mean : tmp.mean / raster.pixelData.length,
    stddev : Math.sqrt(tmp.variance / raster.pixelData.length)
  };
  return raster;
};

/**
 * Computes raster histogram.
 * 
 * @param {Raster} raster - Input raster
 * @param {boolean} copy_mode - Useless here, only for compatibility with the other processing functions
 * @return {object} - Returns an object containing the histogram in statistics property
 *
 * @author Jean-Christophe Taveau
 */
const histogram = (binNumber) => (raster, copy_mode = true) => {
  // Update statistics
  let stats = statistics(raster);
  let delta = (raster.statistics.max - raster.statistics.min);
  raster.statistics.binSize = binNumber / delta;
  raster.statistics.histogram = raster.pixelData.reduce ((bins,px,i) => {
    // let index = cpu.clamp(0,binNumber)( Math.floor( (binNumber - 1) * (px - raster.statistics.min)/ delta));
    let index = px;
    bins[index]++;
    return bins;
    },
    new Array(binNumber).fill(0)
  );
  return raster;
};

// Exports





/***/ }),
/* 22 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return otsu; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return threshold; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



// Helper Functions

// Determine the first non-zero bin
const getFirstBin = (histogram) => histogram.findIndex( x => x > 0);

// Determine the last non-zero bin
// const getLastBin = (histogram) => histogram.length - 1 - histogram.slice().reverse().findIndex(x => x>0);
const getLastBin = (histogram) => histogram.reduceRight( (last,bin,index) => (bin > 0 && last === -1) ? index : last,-1);

// Cumulative Histogram
const cumulativeHistogram = (histogram) => {
  // TODO return histogram.map ( bin => bin + );
};


/**
 * Manual thresholding
 *
 * @param {number} value - Threshold value
 * @param {TRaster}   raster - Input gray-level image
 * @param {boolean} copy_mode - Boolean used to control the deep copy or not of the pixels data
 * @return {TRaster} - Binary output image with True = 0 (black) and False = 255 (white) pixels
 *
 * @author Jean-Christophe Taveau
 */
const threshold = (value) => (raster,copy_mode = true) => {
  let output = T.Raster.from(raster,copy_mode);
  raster.pixelData.forEach( (px,i) => output.pixelData[i] = (px > value) ? 0 : 255);
  // Update statistics + histogram
  cpu.histogram(256)(output,copy_mode);
  return output;
};


/**
 * Otsu thresholding
 * Adapted from http://www.labbookpages.co.uk/software/  rasterProc/otsuThreshold.html
 *
 * @param {Raster}   raster - Input gray-level image
 * @param {boolean} copy_mode - Boolean used to control the deep copy or not of the pixels data
 * @return {Raster} - Binary output image with True = 0 (black) and False = 255 (white) pixels
 *
 * @author Jordan Bevik <Jordan.Bevic@qtiworld.com> - Original C++ code 
 * @author G.Landini ported to ImageJ plugin
 * @author Mercia Ngoma Komb - JS port
 * @author Jean-Christophe Taveau - Bug Fix
 */

const otsu =  function(raster,copy_mode=true) {
    
  const otsuIJ = (histogram) => {
  
    // Init values
    let [S,N] = histogram.reduce((accu,bin,index,arr) => {
      accu[0] += index * bin; // Total histogram intensity
      accu[1] += bin;   // Total number of data points
      return accu;
    },[0,0]);

    // Look at each possible threshold value,
    // calculate the between-class variance, and decide if it's a max
    let finalThreshold = histogram.reduce( (accu,bin,k,arr) => {
      // k = the current threshold;
      accu.Sk += k * arr[k];
      accu.N1 += arr[k];
      
      // The float casting here is to avoid compiler warning about loss of precision and
      // will prevent overflow in the case of large saturated images
      let denom = ( accu.N1) * (N - accu.N1); // Maximum value of denom is (N^2)/4 =  approx. 3E10

      if (denom !== 0 ){
        let num = ( accu.N1 / N ) * S - accu.Sk;   // Maximum value of num =  255 * N = approx 8E7
        accu.BCV = (num * num) / denom;
      }
      else {
        accu.BCV = 0.0;
      }

      if (accu.BCV >= accu.BCVmax) { // Assign the best threshold found so far
        accu.BCVmax = accu.BCV;
        accu.kStar = k;
      }
      return accu;
      
    },{
      BCV: 0,    // The current Between Class Variance 
      BCVmax: 0, // Maximum BCV
      kStar:0,   // kStar = optimal threshold
      Sk: 0,     // The total intensity for all histogram points <=k
      N1: 0      // N1 = # points with intensity <=k
    });
    
   return finalThreshold.kStar;
  }
  

  // Get Histogram
  let binNumber = (raster.type === 'uint8' || raster.type === 'float32') ? 256 : 65536;
  raster = cpu.histogram(binNumber)(raster);
  // Compute threshold
  let the_threshold = otsuIJ(raster.statistics.histogram);
  console.log(`Otsu Threshold: ${the_threshold}`);
  // Apply threshold
  return threshold(the_threshold)(raster,copy_mode);;
}

/**
 * Max-entropy thresholding
 * Implements Kapur-Sahoo-Wong (Maximum Entropy) thresholding method
 * Kapur J.N., Sahoo P.K., and Wong A.K.C. (1985) "A New Method for
 * Gray-Level Picture Thresholding Using the Entropy of the Histogram"
 * Graphical Models and Image Processing, 29(3): 273-285
 *
 * @param {TImage}   raster - Input gray-level image
 * @param {boolean} copy_mode - Boolean used to control the deep copy or not of the pixels data
 * @return {TImage} - Binary output image with True = 0 (black) and False = 255 (white) pixels
 *
 * @author M. Emre Celebi 06.15.2007 - Original Code
 * @author G.Landini - Ported to ImageJ plugin from E Celebi's fourier_0.8 routines
 * @author Alexis Hubert - Ported to TIMES
 *
 */

const maxEntropy = function (raster,copy=true) {
  let pixel = raster.pixelData;
  let data = toHistogram(raster);
  let thresh=-1;
  let ih, it;
  let tot_ent;
  let ent_back;
  let ent_obj;

  // Determine the normalized histogram
  let total = data.reduce((a, b)=> a+b,0); // Number of pixels? raster.pixelData.length
  let norm_histo = data.map(x => x / total);

  //Calculate cumulative normalized histogram
  let P1 = [...norm_histo];
  P1.reduce((a,b,c,d) => d[c] = a+b, 0);
  let P2 = [...P1];
  P2.reduce((a,b,c,d) => d[c] = 1-b, 0);

  // Determine the first non-zero bin
  let first_bin = data.findIndex(x => x>0);

  // Determine the last non-zero bin
  let last_bin = data.length - 1 - data.slice().reverse().findIndex(x => x>0);

  // Calculate the total entropy each gray-level and find the threshold that maximizes it
  let max_ent = Number.MIN_VALUE;
  let list = data.map((x,y)=> y);
  let list3 = [];
  let list4= [];

  for (it = first_bin; it <= last_bin; it++ ) {

    // Calculate entropy of background
    ent_back = 0.0;
    list3 = list.filter(x=> x<=it);
    let back = list3.map((a,b)=> data[a] != 0 && (ent_back -= ( norm_histo[a] / P1[it] ) * Math.log ( norm_histo[a] / P1[it] )));

    // Calculate entropy of object
    ent_obj = 0.0;
    list4 = list.filter(x=> x>=(it+1));
    let obj = list4.map((a,b)=> data[a] != 0 && (ent_obj -= ( norm_histo[a] / P2[it] ) * Math.log ( norm_histo[a] / P2[it] )));

    tot_ent = ent_back + ent_obj;

    max_ent < tot_ent && (
      max_ent = tot_ent,
      thresh = it
    );
  }
  
  console.log(`Max Entropy ${thresh}`);
  
  return threshold(thresh)(raster);
};

/**
* <Description>
*
* @param {number} value - Threshold value
* @param {number} kernelsize - Convolution filer size
* @param {boolean} copy_mode - Boolean used to control the deep copy or not of the pixels data
* @return {TRaster} - Binary output image with True = 0 (black) and False = 255 (white) pixels

* @author Rémy Viannais
*/
const adaptiveThreshold = (Threshold,kernelsize) => (raster,copy_mode=true) => {
  // TODO
};


/**
 * K-means thresholding
 *
 * @param {number} k - Number of clusters wanted
 * @param {TImage}   raster - Input gray-level image
 * @param {boolean} copy_mode - Boolean used to control the deep copy or not of the pixels data
 * @return {TImage} - Processed Image
 *
 * @author: Julien Benetti
 */

const kmeans = (k) => (raster,copy_mode = true) => {
  let output = T.Raster.from(raster,true);
  let data = T.Raster.from(raster,true).pixelData;
  
  // Force histogram computation
  let binNumber = (raster.type === 'uint8' || raster.type === 'float32') ? 256 : 65536;
  raster = cpu.histogram(binNumber)(raster);
  let histo = raster.statistics.histogram;

  // Initialize k number of random "centroids"
  let min = histo.findIndex(x => x > 0);
  let max = histo.length - histo.slice().reverse().findIndex(x => x > 0);
  let shisto = histo.slice(min,max);
  let centroidArray = shisto.map((x, idx) => idx+min).sort(() => 0.5-Math.random()).slice(0, k).sort((x, idx) => x-idx);

  // Find for each pixel the index of its closest centroid
  let labelArray = shisto.map((x, idx) => closestValueidx(idx+min, centroidArray));

  // Beginning of the kmeans loop
  let condition = true;
  while(condition) {
    // Initialize empty arrays of k lengths
    let newCentroidArray = Array(k).fill(0);
    let centroidNumber = [...newCentroidArray];

    // Add each pixel value of each cluster together
    labelArray.map((x, idx) => {
      newCentroidArray[x] += shisto[idx]*(idx+min);
      centroidNumber[x] += shisto[idx];});

    // Calculate new centroids and for each pixel the index of its closest one
    centroidArray = newCentroidArray.map((x, idx) => (x / centroidNumber[idx]) |0);
    let newLabelArray = shisto.map((x, idx) => closestValueidx(idx+min, centroidArray));

    // If none of them switch cluster : end of loop
    condition = !(labelArray.every((x, idx) => x === newLabelArray[idx]));
    (condition) && (labelArray = newLabelArray);
    cpt++;
  }

  let minArray = Array(min).fill(0);
  let maxArray = Array(max-shisto.length-min).fill(k-1);
  flabelArray = [...minArray, ...labelArray, ...maxArray];

  // If binary thresholding : black and white. If multilevel : Value of the centroids.
  output.pixelData = (k==2) ? data.map(x => flabelArray[x]*255) : data.map(x => centroidArray[flabelArray[x]]);
  console.log(output);
  console.log('K-means');
  return output;
}

// Find in an array the index of its closest value to x
const closestValueidx = (x, arr) =>
        arr.map(y => x-y > 0 ? x-y : -(x-y))    // distance absolute value
           .reduce((bestidx, dist, idx, array) => dist < array[bestidx] ? idx : bestidx, 0);







/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return fromABGRtoUint8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return toUint8; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */


/**
 * @module type
 */
 
/**
 * Convert a ABGR to a uint8 image
 *
 * @example <caption>Conversion of a color image to a luminance gray image.</caption>
 * let gray8_img = T.fromRGBAtoUint8(T.luminance)(img);
 *
 * @param {function} func - A converter function
 * @param {TRaster} img - Input image to process
 * @param {boolean} copy - Copy mode to manage memory usage
 * @returns {TRaster} - Uint8 Image (aka 8-bit image)
 *
 * @author TODO
 */
const fromABGRtoUint8 = (func) => (raster,copy=true) => {
  let output =  T.Raster.from(raster,false);
  output.pixelData = new Uint8ClampedArray(raster.length);
  output.type = 'uint8';
  raster.pixelData.forEach ( (px,i) => output.pixelData[i] = func(px));
  return output;
};


/**
 * Split a raster into a 'uint8' raster
 *
 * @param {function} func - A function among:
 * <ul>
 * <li> red(px), green(px),blue(px),alpha(px),</li>
 * <li> hue(px),saturation(px),value(px),</li>
 * <li> cyan(px),magenta(px),yellow(px),</li>
 * <li> luminance(px), chrominance(px)</li>
 * </ul>
 * @param {Raster} color_img - A color raster
 * @param {boolean} copy - Useless here, only for compatibility with the other process functions
 * @return {Raster} Return a stack containing the channels of given colorspace channel
 * @see color.js
 */
const toUint8 = (func) => (raster,copy = true) => {
  if (raster.type === 'uint8') {
    // Do nothing
    return raster;
  }
  else {
    // Copy header only
    let output = T.Raster.from(raster,false);
    output.type = 'uint8';

    if (raster.type === 'uint16') {
      // Only rescale between 0 and 255
      // new_pix = pix / 65535 * 255 = pix / 257
      output.pixelData = raster.pixelData.reduce( (data,px,i) =>  {
          data[i] = (px + 1 + (px >> 8)) >> 8;
          return data;
        },
        new Uint8ClampedArray(output.width * output.height) 
      );      
    }
    else if (raster.type === 'float32') {
      // Only rescale between 0 and 255
      let dummy = cpu.statistics(raster);
      let min = raster.statistics.min;
      let max = raster.statistics.max;
      let delta = 255.0 / (max - min);
      output.pixelData = raster.pixelData.reduce( (data,px,i) =>  {
        data[i] = (px - min) * delta;
        return data;
      },
      new Uint8ClampedArray(output.width * output.height) 
    );      
  }
    else if (raster.type === 'rgba') {
      output.pixelData = raster.pixelData.map( (px) =>  func(px) );
    }
    return output;
  }
};
// Export





/***/ }),
/* 24 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return montage; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return view; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

'use script';

/**
 * @module view
 */
 
/**
 * Rectangular view of a single image 
 *
 * @param {number} x - X-coord of the top-left corner of the rectangle
 * @param {number} y - Y-coord of the top-left corner of the rectangle
 * @param {number} w - Width of the rectangle. A value of -1 corresponds to the input width.
 * @param {number} h - Height rectangle.  A value of -1 corresponds to the input height.
 * @param {TRaster} img - Input Image
 * @param {boolean} copy - Copy mode to manage memory usage. Useless, here just for compatibility. 
 * @returns {TView} Returns a view for rendering
 *
 * @author Jean-Christophe Taveau 
 */
const view = (raster,copy_mode=true) => {
  // Update raster in parent (Image, Stack or Volume?))
  raster.parent.setRaster(raster);
  raster.parent.width = raster.width;
  raster.parent.height = raster.height;
  raster.parent.type = raster.type;
  // HACK let img = new T.Image('view',raster.type,raster.width, raster.height);
  let a_view = new T.View('view',raster.type,raster.width, raster.height);
  a_view.appendLayer({type: 'image', data: raster.parent});
  return a_view;
};

/**
 * Montage - Convert a stack in a view for rendering
 *
 * @param {number} row - Row number
 * @param {number} column - Column number
 * @param {number} scale - Scaling of the resulting image
 * @param {number} border - Border
 * @param {TStack} stack - Input Stack
 * @param {boolean} copy - Copy mode to manage memory usage. Useless, here just for compatibility. 
 * @returns {TView} Returns a view for rendering
 *
 * @author Jean-Christophe Taveau
 */
const montage = (row,column,scale=1.0,border=0) => (stack,copy_mode=true) => {
  let view = new T.View('montage',stack.type,stack.width * column, stack.height * row);
  // Create Image
  let output = new T.Image(stack.type,stack.width * column, stack.height * row);
  stack.slices.forEach( (sli,index) => output.raster.pad( (index % column) * stack.width, Math.floor(index/ column) * stack.height,sli) );
  view.appendLayer({type: 'image',data: output});
  // Create Labels
  let labels = [{type: 'text',x:0,y:0,content: 'Test'}];
  view.appendLayer({type: 'graphics',data: labels});
  return view;
};


// Exports



/***/ }),
/* 25 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "f", function() { return renderUint8; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return renderUint16; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return renderFloat32; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return renderABGR; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return renderRGBA; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return render2D; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__process_utils__ = __webpack_require__(0);
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */





/**
 * Functions used to render image in a HTML5 web page
 * @module render2D
 */
 
/**
 * Display uint8 image
 *
 * @param {TWindow} win - Window used to display the image in the HTML5 page
 * @param {TImage} uint8 - Image containing uint8 pixels data
 * @param {boolean} copy - Useless. Just here for compatibility with other process/render functions.
 *
 * @author Jean-Christophe Taveau
 */
const renderUint8 = (win) => (img8bit,copy=true) => {
  // Tutorial: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  let imgdata = win.ctx.createImageData(img8bit.width, img8bit.height);

  // New RGBA image buffer
  let buf = new ArrayBuffer(img8bit.width * img8bit.height * 4);
  let buf32 = new Uint32Array(buf);
  let buf8 = new Uint8Array(buf);
  // Fill with ABGR color values
  buf32.forEach( (px,i,arr) => arr[i] = cpu.toRGBA(img8bit.pixelData[i],img8bit.pixelData[i],img8bit.pixelData[i],255) );

  imgdata.data.set(buf8);
  win.ctx.putImageData(imgdata, 0, 0);
};


/**
 * Display uint16 image
 *
 * @param {TWindow} win - Window used to display the image in the HTML5 page
 * @param {TImage} uint8 - Image containing uint8 pixels data
 * @param {boolean} copy - Useless. Just here for compatibility with other process/render functions.
 *
 * @author Jean-Christophe Taveau
 */
const renderUint16 = (win) => (img16bit,copy=true) => {
  console.log('renderUint16');
  // Tutorial: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  let imgdata = win.ctx.createImageData(img16bit.width, img16bit.height);

  // New RGBA image buffer
  let buf = new ArrayBuffer(img16bit.width * img16bit.height * 4);
  let buf32 = new Uint32Array(buf);
  let buf8 = new Uint8Array(buf);
  // Fill with ABGR color values
  buf32.forEach( (px,i,arr) => arr[i] = cpu.toRGBA(img16bit.pixelData[i] >> 8,img16bit.pixelData[i] >> 8,img16bit.pixelData[i] >> 8,255) );

  imgdata.data.set(buf8);
  win.ctx.putImageData(imgdata, 0, 0);
};


/**
 * Display float32 image
 *
 * @param {TWindow} win - Window used to display the image in the HTML5 page
 * @param {TImage} uint8 - Image containing uint8 pixels data
 * @param {boolean} copy - Useless. Just here for compatibility with other process/render functions.
 *
 * @author Jean-Christophe Taveau
 */
const renderFloat32 = (win) => (imgf32,copy=true) => {
  // Tutorial: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  let imgdata = win.ctx.createImageData(imgf32.width, imgf32.height);
  
  // Update statistics
  let dummy = cpu.statistics(imgf32); 
  
  // New RGBA image buffer
  let buf = new ArrayBuffer(imgf32.width * imgf32.height * 4);
  let buf32 = new Uint32Array(buf);
  let buf8 = new Uint8Array(buf);
  // Fill with ABGR color values
  let delta = 255.0 / (imgf32.statistics.max - imgf32.statistics.min) ;
  buf32.forEach( (px,i,arr) => {
    let pix = Math.floor((imgf32.pixelData[i] - imgf32.statistics.min) * delta );
    arr[i] = cpu.toRGBA(pix,pix,pix,255);
  });

  imgdata.data.set(buf8);
  win.ctx.putImageData(imgdata, 0, 0);
};


/**
 * Display RGBA image
 *
 * @param {TWindow} win - Window used to display the image in the HTML5 page
 * @param {TImage} img - Image containing RGBA pixels data
 * @param {boolean} copy - Useless. Just here for compatibility with other process/render functions.
 *
 * @author Jean-Christophe Taveau
 */
const renderRGBA = (win) => (raster,copy=true) => {
  // Tutorial: https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
  let imgdata = win.ctx.createImageData(raster.width, raster.height);

  // New RGBA image buffer
  // let buf = new ArrayBuffer(img.width * img.height * 4);
  // let buf32 = new Uint32Array(buf);
  let buf8 = new Uint8Array(raster.pixelData.buffer);
  // Fill with ABGR color values
  // buf32.forEach( (px,i,arr) => arr[i] = img.pixelData[i]);
  // T.toRGBA(T.red(img.pixelData[i]),T.green(img.pixelData[i]),T.blue(img.pixelData[i]),T.alpha(img.pixelData[i]) ) );

  imgdata.data.set(buf8);
  win.ctx.putImageData(imgdata, 0, 0);
};


const render2D = (win) => (img,copy=true) => {
  console.log(win);
  switch (img.raster.type) {
  case 'uint8':
    renderUint8(win)(img.raster);
    break;
  case 'uint16':
    renderUint16(win)(img.raster);
    break;
  case 'float32':
    renderFloat32(win)(img.raster);
    break;
  case 'rgba':
  case 'abgr':
    renderRGBA(win)(img.raster);
    // (isLittleEndian()) ? T.renderABGR(win)(img.raster) : T.renderRGBA(win)(img.raster);
    break;
  }
};

// Exports
 



/***/ }),
/* 26 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return renderVector; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */

'use script';

/**
 * Functions used to render vectorial data in a HTML5 web page
 * @module renderVector
 */
 
/**
 * Display Vectorial Data
 *
 * @param {TWindow} win - Window used to display the image in the HTML5 page
 * @param {TImage} uint8 - Image containing uint8 pixels data
 * @param {boolean} copy - Useless. Just here for compatibility with other process/render functions.
 *
 * @author Jean-Christophe Taveau
 */
const renderVector = (win) => (obj,copy=true) => {
  console.log('renderVector');
};

// Exports
 



/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "viewport", function() { return viewport; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__gpu_constants__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__gpu_utils__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__Processor__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__gpu_color__ = __webpack_require__(31);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__gpu_math__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__gpu_preprocess__ = __webpack_require__(33);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__gpu_statistics__ = __webpack_require__(34);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "POINTS", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["z"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "LINES", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["k"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "LINE_LOOP", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["l"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "LINE_STRIP", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["m"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "TRIANGLES", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["E"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "TRIANGLE_STRIP", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["G"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "TRIANGLE_FAN", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["F"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "NEAREST", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["r"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "LINEAR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["j"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "REPEAT", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["A"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CLAMP_TO_EDGE", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "MIRRORED_REPEAT", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["q"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CLAMP", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "MIRROR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["p"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FUNC_ADD", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["g"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FUNC_SUBSTRACT", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["i"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "FUNC_REVERSE_SUBTRACT", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["h"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "MIN", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["o"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "MAX", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["n"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ZERO", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["H"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["s"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "SRC_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["D"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_SRC_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["y"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "SRC_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["B"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_SRC_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["x"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "DST_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["e"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_DST_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["v"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "DST_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["f"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_DST_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["w"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "SRC_ALPHA_SATURATE", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["C"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CONSTANT_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_CONSTANT_COLOR", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["u"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "CONSTANT_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "ONE_MINUS_CONSTANT_ALPHA", function() { return __WEBPACK_IMPORTED_MODULE_0__gpu_constants__["t"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createGPU", function() { return __WEBPACK_IMPORTED_MODULE_1__gpu_utils__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "createProgram", function() { return __WEBPACK_IMPORTED_MODULE_1__gpu_utils__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "getGraphicsContext", function() { return __WEBPACK_IMPORTED_MODULE_1__gpu_utils__["c"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "rectangle", function() { return __WEBPACK_IMPORTED_MODULE_1__gpu_utils__["d"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "Processor", function() { return __WEBPACK_IMPORTED_MODULE_2__Processor__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "invert", function() { return __WEBPACK_IMPORTED_MODULE_3__gpu_color__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "fill", function() { return __WEBPACK_IMPORTED_MODULE_4__gpu_math__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "blend", function() { return __WEBPACK_IMPORTED_MODULE_5__gpu_preprocess__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "histogram", function() { return __WEBPACK_IMPORTED_MODULE_6__gpu_statistics__["a"]; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 

/* gpu/gpu_constants */


/* gpu/gpu_utils */


/* gpu/Processor*/


/* gpu/color*/


/* gpu/math*/


/* gpu/preprocess*/


/* gpu/statistics*/








/***/ }),
/* 28 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



// From MDN
// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Constants

/**
 * Passed to drawElements or drawArrays to draw single points.
 */
const POINTS  = 0x0000;
/* harmony export (immutable) */ __webpack_exports__["z"] = POINTS;
 
 
/**
 * Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it.
 */
const LINES  = 0x0001;
/* harmony export (immutable) */ __webpack_exports__["k"] = LINES;


/**
 * Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment.
 */
const LINE_LOOP = 0x0002;
/* harmony export (immutable) */ __webpack_exports__["l"] = LINE_LOOP;


/**
 * Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last.
 */
const LINE_STRIP = 0x0003;
/* harmony export (immutable) */ __webpack_exports__["m"] = LINE_STRIP;
 

/**
 * Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle.
 */
const TRIANGLES = 0x0004;
/* harmony export (immutable) */ __webpack_exports__["E"] = TRIANGLES;


/**
 * Passed to drawElements or drawArrays to draw a connected group of triangles.
 */
const TRIANGLE_STRIP = 0x0005;
/* harmony export (immutable) */ __webpack_exports__["G"] = TRIANGLE_STRIP;


/**
 * 	Passed to drawElements or drawArrays to draw a connected group of triangles. 
 * Each vertex connects to the previous and the first vertex in the fan.
 */
const TRIANGLE_FAN  = 0x0006;
/* harmony export (immutable) */ __webpack_exports__["F"] = TRIANGLE_FAN;


/**
 * Texture constant
 */
const NEAREST = 0x2600;
/* harmony export (immutable) */ __webpack_exports__["r"] = NEAREST;


/**
 * Texture constant
 */
const LINEAR = 0x2601;
/* harmony export (immutable) */ __webpack_exports__["j"] = LINEAR;


/**
 * Texture constant
 */
const REPEAT = 0x2901;
/* harmony export (immutable) */ __webpack_exports__["A"] = REPEAT;


/**
 * Texture constant
 */
const CLAMP_TO_EDGE = 0x812F;
/* harmony export (immutable) */ __webpack_exports__["b"] = CLAMP_TO_EDGE;


/**
 * Texture constant
 */
const MIRRORED_REPEAT = 0x8370;
/* harmony export (immutable) */ __webpack_exports__["q"] = MIRRORED_REPEAT;


/**
 * Shorter non official texture constant
 */
const CLAMP = CLAMP_TO_EDGE;
/* harmony export (immutable) */ __webpack_exports__["a"] = CLAMP;


/**
 * Shorter non official texture constant
 */
const MIRROR = MIRRORED_REPEAT;
/* harmony export (immutable) */ __webpack_exports__["p"] = MIRROR;


/**
 * Passed to blendEquation or blendEquationSeparate to set an addition blend function. 
 * Op = source + destination,
 */
const FUNC_ADD = 0x8006;
/* harmony export (immutable) */ __webpack_exports__["g"] = FUNC_ADD;


/**
 * Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function
 * Op = (source - destination).
 */
const FUNC_SUBSTRACT = 0x800A;
/* harmony export (immutable) */ __webpack_exports__["i"] = FUNC_SUBSTRACT;


/**
 * Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function 
 * Op =(destination - source).
 */
const FUNC_REVERSE_SUBTRACT = 0x800B;
/* harmony export (immutable) */ __webpack_exports__["h"] = FUNC_REVERSE_SUBTRACT;


/**
 * Produces the minimum color components of the source and destination colors.
 */
const MIN = 0x8007;
/* harmony export (immutable) */ __webpack_exports__["o"] = MIN;


/**
 * Produces the maximum color components of the source and destination colors.
 */
const MAX = 0x8008;
/* harmony export (immutable) */ __webpack_exports__["n"] = MAX;


/**
 * Passed to blendFunc or blendFuncSeparate to turn off a component.
 */
const ZERO = 0;
/* harmony export (immutable) */ __webpack_exports__["H"] = ZERO;


/**
 * Passed to blendFunc or blendFuncSeparate to turn on a component.
 */
const ONE = 1;
/* harmony export (immutable) */ __webpack_exports__["s"] = ONE;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color.
 */
const SRC_COLOR = 0x0300;
/* harmony export (immutable) */ __webpack_exports__["D"] = SRC_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color.
 */
const ONE_MINUS_SRC_COLOR = 0x0301;
/* harmony export (immutable) */ __webpack_exports__["y"] = ONE_MINUS_SRC_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha.
 */
const SRC_ALPHA = 0x0302;
/* harmony export (immutable) */ __webpack_exports__["B"] = SRC_ALPHA;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha.
 */
const ONE_MINUS_SRC_ALPHA = 0x0303;
/* harmony export (immutable) */ __webpack_exports__["x"] = ONE_MINUS_SRC_ALPHA;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha.
 */
const DST_ALPHA = 0x0304;
/* harmony export (immutable) */ __webpack_exports__["e"] = DST_ALPHA;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha.
 */
const ONE_MINUS_DST_ALPHA = 0x0305;
/* harmony export (immutable) */ __webpack_exports__["v"] = ONE_MINUS_DST_ALPHA;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color.
 */
const DST_COLOR = 0x0306;
/* harmony export (immutable) */ __webpack_exports__["f"] = DST_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color.
 */
const ONE_MINUS_DST_COLOR = 0x0307;
/* harmony export (immutable) */ __webpack_exports__["w"] = ONE_MINUS_DST_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha.
 */
const SRC_ALPHA_SATURATE = 0x0308
/* harmony export (immutable) */ __webpack_exports__["C"] = SRC_ALPHA_SATURATE;


/**
 * Passed to blendFunc or blendFuncSeparate to specify a constant color blend function.
 */
const CONSTANT_COLOR = 0x8001;
/* harmony export (immutable) */ __webpack_exports__["d"] = CONSTANT_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function.
 */
const ONE_MINUS_CONSTANT_COLOR = 0x8002;
/* harmony export (immutable) */ __webpack_exports__["u"] = ONE_MINUS_CONSTANT_COLOR;


/**
 * Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function.
 */
const CONSTANT_ALPHA = 0x8003;
/* harmony export (immutable) */ __webpack_exports__["c"] = CONSTANT_ALPHA;


/**
 * Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function.
 */
const ONE_MINUS_CONSTANT_ALPHA = 0x8004;
/* harmony export (immutable) */ __webpack_exports__["t"] = ONE_MINUS_CONSTANT_ALPHA;





/***/ }),
/* 29 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return createGPU; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return getGraphicsContext; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return createProgram; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return rectangle; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 


/**
 * Toolbox for GPU
 *
 */

/**
 * Create a GPU Processor
 *
 * @author Jean-Christophe Taveau
 */
const createGPU = (graphics,width=-1,height=-1) => new gpu.Processor(graphics.context,graphics.canvas,width,height);
  

/**
 *
 * Init WebGL2
 *
 */
const getGraphicsContext = (elementID='preview') => {
  // http://webglreport.com/
  let _canvas = document.getElementById(elementID);
  let gl2;
  let _params = {};
  
  try {
    gl2 = _canvas.getContext("webgl2");
    // Need extension(s)
    const ext = gl2.getExtension("EXT_color_buffer_float");
    if (!ext) {
      alert("need EXT_color_buffer_float");
    }
    // Various useful configuration parameters
    _params.maxTextures  = gl2.getParameter(gl2.MAX_TEXTURE_IMAGE_UNITS);
    _params.maxTextureSize  = gl2.getParameter(gl2.MAX_TEXTURE_SIZE);
    
  } catch (e) {
  }
  if (!gl2) {
      alert("Could not initialise WebGL2, sorry :-(");
  }
  return {canvas: _canvas, context: gl2, parameters: _params};
};


/**
 *
 * Create Shader Program
 *
 */
const createProgram = (gpuEnv,src_vs,src_fs) => {

  // Compile shader
  const compileShader = (gl, source,type) => {
    let str = source;

    let shader;
    if (type == "fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(` ${type}: ${gl.getShaderInfoLog(shader)}`);
      return null;
    }

    return shader;
  };

  /**** MAIN ****/
  
  let shader = {
    program: null,
    attributes: {},
    uniforms: {}
  };

  let gl = gpuEnv.context;
  
  //1- Check in source(s) where are the attributes (keyword`in `)
  let re = /in\s*(\w+)\s(\w+)/gm;
  let result;
  while ((result = re.exec(src_vs)) !== null) {
    // console.log(re.exec(src_vs));
    shader.attributes[result[2]] = {type: result[1],name: result[2],location: null};
  }
  // Check in source(s) where are the uniforms (keyword: `uniform`)
  re = /uniform\s*(\w+)\s+(\w+)\s*(\[)*/gm;
  while ((result = re.exec(src_vs)) !== null) {
    // console.log(re.exec(src_vs));
    shader.uniforms[result[2]] = {type: result[1]+(result[3]?'[]':''),name: result[2],location: null};
  }
  while ((result = re.exec(src_fs)) !== null) {
    // console.log(re.exec(src_vs));
    shader.uniforms[result[2]] = {type: result[1]+(result[3]?'[]':''),name: result[2],location: null};
  }
  console.log(shader);

  // 2- Create Shader Program with link step.
  shader.program = gl.createProgram();
  
  gl.attachShader(shader.program, compileShader(gl,src_vs,'vertex'));
  gl.attachShader(shader.program, compileShader(gl,src_fs,'fragment'));
  gl.linkProgram(shader.program);

  if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }
  
  // 3- Get Attribute and Uniform locations
  Object.values(shader.attributes).forEach( (attr) => attr.location =  gl.getAttribLocation(shader.program, attr.name) );
  Object.values(shader.uniforms).forEach( (uniform) => uniform.location =  gl.getUniformLocation(shader.program, uniform.name) );
  return shader;
}

/**
 * Create a rectangle for gpu.Processor.geometry(..) function
 *
 * @author Jean-Christophe Taveau
 */

const rectangle = (w,h) => ({
    type: gpu.TRIANGLE_STRIP, 
    num: 4,
    vertices: new Float32Array(
      [
        0.0,0.0,0.0,0.0,
        0.0,h  ,0.0,1.0,
        w  ,0.0,1.0,0.0,
        w  ,h  ,1.0,1.0
      ]
    )
  });

// Export





/***/ }),
/* 30 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 



class Processor {
  constructor(context,canvas,width=-1,height=-1) {
    this.context = context; 
    this.canvas = canvas;
    this.canvas.width = width;
    this.canvas.height = height;
    this.width = width;
    this.height = height;
    this.geometries = {};
    this.textures = [];
    this.attributes= {};
    this.uniforms = {};
    this.framebuffers = {};
  }

  attribute(a_name,a_num,a_type,a_stride,a_offset) {
    this.attributes[a_name] = {
      name: a_name,
      num : a_num,
      type: a_type, 
      stride: a_stride,
      offset: a_offset,
      location: null
    };
    return this;
  }

  clearCanvas(color = [0.1,0.1,0.1,1.0]) {
    let gl = this.context;
    
    // clear color
    gl.clearColor(color[0],color[1],color[2],color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    return this;
  }
  
  /**
   *
   * primitives:
   * - type: TRIANGLE_STRIP, POINTS, TRIANGLES, LINES
   * - vertices: Float32Array([])
   */
  geometry(obj) {
    let gl = this.context;
    
    // Create vertices for rectangle
    this.geometries.type = obj.type;
    this.geometries.glType = obj.type;
    this.geometries.buffer = gl.createBuffer();
    this.geometries.numVertices = obj.num;
    gl.bindBuffer(gl.ARRAY_BUFFER,this.geometries.buffer);
    gl.bufferData(gl.ARRAY_BUFFER,obj.vertices,gl.STATIC_DRAW);

    // Unbind buffer(s)
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    
    return this;
  }
  
  /**
   *
   */
   packWith(shaderProgram) {
      let gl = this.context;
      
      this.shader = shaderProgram;
      
      // 1- Get Attribute and Uniform locations
      Object.values(this.attributes).forEach( (attr) => {
        attr.location =  shaderProgram.attributes[attr.name].location;
        attr.component =  shaderProgram.attributes[attr.name].type;
      });
      
      console.log(this.attributes);
      
      // 2- Create a VAO
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      // 3- Bind the position buffer containing the vertices
      gl.bindBuffer(gl.ARRAY_BUFFER, this.geometries.buffer);
      // 4- Attributes
      Object.values(this.attributes).forEach( (a) => {
        console.log(a);
        gl.enableVertexAttribArray(this.attributes[a.name].location);
        gl.vertexAttribPointer(
          this.attributes[a.name].location, 
          this.attributes[a.name].num, 
          gl.FLOAT, 
          false, 
          this.attributes[a.name].stride, 
          this.attributes[a.name].offset
        );
        }
      );
      // Unbind buffers
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);
      return this;
   }
   
  /**
   * Render in a Frame Buffer
   */
  redirectTo(fbo_name,type='uint8',attachment=0) {
    let gl = this.context;
    
    // Be sure no active framebuffer somewhere
    // gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
    
    if (this.framebuffers[fbo_name] === undefined) {
      console.log('CREATE FBO');
      let fbo = gl.createFramebuffer();
      
      let [internalFormat, srcType, data] = (type == 'uint16' || type === 'float32') ? 
        [gl.RGBA32F,gl.FLOAT, new Float32Array(this.width * this.height * 4)] : 
        [gl.RGBA,gl.UNSIGNED_BYTE, new Uint8ClampedArray(this.width * this.height * 4)];


      let texture = this._createTexture(
        gl,
        data,
        this.width,
        this.height,
        internalFormat,
        gl.RGBA,
        srcType,
        gl.CLAMP_TO_EDGE,
        gl.NEAREST,
        gl.NEAREST
      );
        
      gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0 + attachment,
        gl.TEXTURE_2D,
        texture,
        0
      );
      
      this.framebuffers[fbo_name] = {
        id: 'framebuffer',
        name: fbo_name,
        buffer: fbo,
        texture: texture,
        format: internalFormat,
        srcType: srcType
      };
    }
    else {
      gl.bindFramebuffer(gl.FRAMEBUFFER,this.framebuffers[fbo_name].buffer);
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.framebuffers[fbo_name].texture);

    
    return this;
  }
  
  /**
   * Update canvas size
   */
  size(w,h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;
    return this;
  }
  
  /*
   * Pseudo-private - for Internal use, only
   */
  _createTexture (context,data,w,h,iformat,format,type, wrap,mini, mag) {
    let gl = context;
    
    // Define a PBO for texture data?
    // https://stackoverflow.com/questions/43530082/how-can-i-upload-a-texture-in-webgl2-using-a-pixel-buffer-objecthttps://www.khronos.org/webgl/public-mailing-list/public_webgl/1701/msg00036.php
    // https://www.khronos.org/webgl/public-mailing-list/public_webgl/1701/msg00036.php

    // const tex = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, tex);
    // take data from PBO
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 300, 150, 0, gl.RGBA, gl.UNSIGNED_BYTE, 0);
    
    // Create a Pixel Buffer Object (PBO) for fast access to pixel data
    const pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, pbo);
    gl.bufferData(gl.PIXEL_UNPACK_BUFFER, data, gl.STATIC_DRAW);
    // data is now in PBO
    
    // Create a texture
    let texture = gl.createTexture();

    // Bind it to texture unit 0' 2D bind point
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we don't need mips and so we're not filtering
    // and we don't repeat
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mini);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag);
    // Upload the image into the texture.
    let mipLevel = 0;              // the largest mip
    let internalFormat = iformat;   // format we want in the texture
    let srcFormat = format;        // format of data we are supplying
    let srcType = type;            // type of data we are supplying
    
    gl.texImage2D(
      gl.TEXTURE_2D,
      mipLevel,
      internalFormat,
      w,
      h,
      0, // Border
      srcFormat,
      srcType,
      0 // data already in PBO
    );

    // Job finished: Unbind texture
    gl.bindTexture(gl.TEXTURE_2D, null);
    
    return texture;
  };

  /**
   * Create and set up several textures
   *
   * @param {[Object]} array - Array of texture object. The pixel data must be stored as a Raster
   */
  textures(array) {
    // TODO
    array.forEach( (tex) => this.texture(tex.raster,tex.unit,tex.wrap,tex.mini,tex.mag));
    return this;
  }
  
  /**
   * Create and set up a texture
   *
   */
  texture(raster,unit=0, wrap=gpu.CLAMP,mini=gpu.NEAREST, mag= gpu.NEAREST) {
  
    if (raster.id !== undefined && raster.id === 'framebuffer') {
      console.log('This is a FBO...');
      this.textures[0] = {texture: raster.texture, unit: unit};
      return this;
    }
    
    let gl = this.context;
    
    const glConstants = {
      'clamp' : gl.CLAMP_TO_EDGE,
      'repeat' : gl.REPEAT,
      'mirror' : gl.MIRRORED_REPEAT,
      'nearest' : gl.NEAREST,
      'uint8': gl.UNSIGNED_BYTE,
      'uint16': gl.UNSIGNED_SHORT,
      'float32': gl.FLOAT,
      'rgba' : gl.UNSIGNED_BYTE,
      'gray' : gl.LUMINANCE,
      'color': gl.RGBA
    }
  
     
    this.width = raster.width;
    this.height = raster.height;
    console.log(raster.type,gl.R16UI,gl.RED_INTEGER);

    let texture = this._createTexture(
      gl,
      raster.pixelData,
      raster.width,
      raster.height,
      (raster.type === 'uint8') ? gl.LUMINANCE : ( (raster.type === 'uint16') ? gl.R16UI : ( (raster.type === 'float32') ? gl.R32F : gl.RGBA) ),
      (raster.type === 'uint8') ? gl.LUMINANCE : ( (raster.type === 'uint16') ? gl.RED_INTEGER : ( (raster.type === 'float32') ? gl.RED : gl.RGBA) ),
      glConstants[raster.type],
      wrap,
      mini,
      mag
    );
    

    this.textures.push({texture: texture, unit: unit});
    
    return this;
  }

  /** 
   * Configure the rendering/computing engine before run(..)
   *
   * @author Jean-Christophe Taveau
   */
  preprocess(settings=[]) {
    let gl = this.context;
    
    // console.log(settings);
    // Add Default viewport
    if (settings.find( (elt) => (elt.name === 'viewport')) === undefined) {
      settings.push({name:'viewport', params: [0.0,0.0, this.width, this.height]});
    } 

    // Add various rendering parameters
    
    // Blending operations 
    // gl.enable(gl.BLEND);
    // viewport operations 
    // TODO

    settings.forEach( (s) => {
      switch (s.name) {
      case 'blend': 
        gl.blendEquation(s.params[0]);
        gl.blendFunc(s.params[1], s.params[2]);
        gl.enable(gl.BLEND);
        break;
      case 'viewport': 
        gl.viewport(s.params[0],s.params[1],s.params[2],s.params[3]);
        break;
      }
    });
    

    // Activate shader program
    gl.useProgram(this.shader.program);
    
    return this;
  }
  
/**
 *
 */
postprocess() {
  // Clean ?
  // gl.disable(settings)?
  return this;
}
  
/**
 * 
 */
 readPixels(fbo_name) {
  let gl = this.context;
  
  // http://roxlu.com/2014/048/fast-pixel-transfers-with-pixel-buffer-objects
  // https://github.com/KhronosGroup/WebGL/blob/master/sdk/tests/conformance2/reading/read-pixels-from-rgb8-into-pbo-bug.html
  let fbo = this.framebuffers[fbo_name];
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo.buffer);
  gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

  // console.log(this.width, this.height);
  let data = new Float32Array(this.width * this.height * 4); // RGBA
  gl.readPixels(0, 0, this.width, this.height, gl.RGBA, fbo.srcType, data);
  
  return data;
  
 }
 
 
  /**
   *
   */
  run() {
    let gl = this.context;
    
    // Bind the position buffer containing the vertices (ie rectangle)
    gl.bindVertexArray(this.vao);

    this.textures.forEach( (tex) => {
      gl.activeTexture(gl.TEXTURE0 + tex.unit);
      gl.bindTexture(gl.TEXTURE_2D, tex.texture);
    });

    gl.drawArrays(this.geometries.glType,0,this.geometries.numVertices);
    
    // Clean up
    // TODO
    gl.bindTexture(gl.TEXTURE_2D,null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
    
    return this;
  }

 
  /**
   *
   */
  uniform(u_name,u_value) {
    let gl = this.context;
    
    let u = this.shader.uniforms[u_name];

    switch (u.type) {
      case 'float': gl.uniform1f(u.location, u_value);break;
      case 'int': gl.uniform1i(u.location, u_value);break;
      case 'uint': gl.uniform1ui(u.location, u_value);break;
      case 'int[]': gl.uniform1iv(u.location, u_value);break;
      case 'float[]': gl.uniform1fv(u.location, u_value);break;
      case 'mat2': gl.uniformMatrix2fv(u.location, u_value);break;
      case 'mat3': gl.uniformMatrix3fv(u.location, u_value);break;
      case 'mat4': gl.uniformMatrix4fv(u.location, u_value);break;
      case 'sampler2D': gl.uniform1i(u.location, u_value);break;
      case 'vec2': gl.uniform2fv(u.location, u_value);break;
      case 'vec3': gl.uniform3fv(u.location, u_value);break;
      case 'vec4': gl.uniform4fv(u.location, u_value);break;
    };
    return this;
   }
   
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Processor;






/***/ }),
/* 31 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return invert; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */
 
'use script';

/**
 * Invert colors
 *
 * @author Jean-Christophe Taveau
 */
 
const invert = (raster,graphContext, copy_mode = true) => {

  let id='invert';
  
  let src_vs = `#version 300 es

  in vec2 a_vertex;
  in vec2 a_texCoord;
  
  uniform vec2 u_resolution;
  
  out vec2 v_texCoord;
  
  void main() {
    v_texCoord = a_texCoord;
    vec2 clipSpace = a_vertex * u_resolution * 2.0 - 1.0;
    gl_Position = vec4( clipSpace * vec2(1,-1), 0.0, 1.0);
  }`;

  const getFragmentSource = (samplerType,outVec) => {
    return `#version 300 es
    #pragma debug(on)

    precision mediump usampler2D;
    precision mediump float;
    
    in vec2 v_texCoord;
    const float maxUint16 = 65535.0;
    uniform ${samplerType} u_image;
    out vec4 outColor;
    
    void main() {
      outColor = vec4(${outVec}, 1.0); 
    }`;
  }
  

  // Step #1: Create - compile + link - shader program
  // Set up fragment shader source depending of raster type (uint8, uint16, float32,rgba)
  let samplerType = (raster.type === 'uint16') ? 'usampler2D' : 'sampler2D';
  let outColor;
  switch (raster.type) {
    case 'uint8': 
    case 'rgba' : outColor = `1.0 - texture(u_image, v_texCoord).rgb`; break; 
    case 'uint16': outColor = `vec3(1.0 - float(texture(u_image, v_texCoord).r) / maxUint16 )`; break; 
    case 'float32': outColor = `vec3(1.0 - texture(u_image, v_texCoord).r)`; break; 
  }

  let the_shader = gpu.createProgram(graphContext,src_vs,getFragmentSource(samplerType,outColor));

  console.log('programs done...');
    
  // Step #2: Create a gpu.Processor, and define geometry, attributes, texture, VAO, .., and run
  let gproc = gpu.createGPU(graphContext)
    .size(raster.width,raster.height)
    .geometry(gpu.rectangle(raster.width,raster.height))
    .attribute('a_vertex',2,'float', 16,0)      // X, Y
    .attribute('a_texCoord',2, 'float', 16, 8)  // S, T
    .texture(raster,0)
    .packWith(the_shader) // VAO
    .clearCanvas([0.0,1.0,1.0,1.0])
    .preprocess()
    .uniform('u_resolution',new Float32Array([1.0/raster.width,1.0/raster.height]))
    .uniform('u_image',0)
    .run();

  return raster;
}







/***/ }),
/* 32 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return fill; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,Image
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */




/**
 * @module math
 */
 

  
/**
  * Fill with values calculated from a function
  *
  * @param {function} func - A function
  * <p>The function may take a maximum of nine arguments:</p>
  * <ul>
  * <li>pix - Pixel value</li>
  * <li>index - Index corresponding to pix. A raster is a 1D pixels array</li>
  * <li>x - X-coordinate of pix</li>
  * <li>y - Y-coordinate of pix</li>
  * <li>z - Z-coordinate of pix if raster is in 3D</li>
  * <li>w - Width of raster</li>
  * <li>h - Height of raster</li>
  * <li>a - Angle calculated as atan2(y/x)</li>
  * <li>d - Distance to the center</li>
  * </ul>
  * @example <caption>Fill with a spiral</caption>
  * const DEG = Math.PI / 180;
  * const spiral = (pix,i,x,y,z,w,h,a,d) => 128 * (Math.sin(d / 10+ a * DEG)+1);
  * let raster = T.fill(spiral)(img.getRaster() );
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const fill = (func) => (raster,copy_mode=true) => {
  let src_vs = `#version 300 es

  in vec2 a_vertex;
  
  void main() {
    gl_Position = vec4(a_vertex * 2.0 - 1.0, 0.0, 1.0);
  }`;

  /*
    Private function
   */
  function parse(src) {
    
    // Parse
    // 1- Search the arguments between parentheses `(..)`
    let re = /\(([^)]+)\)/g;
    let args = re.exec(src)[1].split(',');
    if (args.length !== 9) {
      const default_args = ['pix','index','x','y','z','rasterWidth','rasterHeight','angle','distance'];
      args = [...args,...default_args.slice(args.length,default_args.length) ];
    }
    // 2- Search the core between curly brackets {..}` or between arrow `=>` and semi-column `;` or EOL
    //=> { }
    let func_body = '';
    if (/\{(.*)\}/g.exec(src) === undefined) {
      func_body = /\{(.*)\}/g.exec(src)[1];
    }
    else {
      func_body = /=>(.*)$/g.exec(src)[1];
    }
    // 2- Clean code like removing `Math.`, changed variable names, etc.
    // Python replace(/(?<![\d.])[0-9]+(?![\d.])/,'$1.0');
    func_body = func_body.replace(/Math\./g,'').replace(/cpu\./g,'').replace(/([\d.]+)/g,'$1.0').replace(/(\.\d+).0/g,'$1');
    
    // Build the code
    let func_code = `vec4 fill(float ${args[0]}) {
        float ${args[2]} = gl_FragCoord.x; 
        float ${args[3]} = gl_FragCoord.y;
        // float ${args[4]} = gl_FragCoord.z;
        float ${args[5]} = u_rasterSize.x;
        float ${args[6]} = u_rasterSize.y;
        int ${args[1]} = int(${args[2]} + ${args[5]} * ${args[3]});
        float halfw = ${args[5]} / 2.0;
        float halfh = ${args[6]} / 2.0;
        vec2 point = vec2((${args[2]} - halfw), (${args[3]} - halfh));
        float ${args[8]} = sqrt( dot(point,point) );
        float ${args[7]} = atan(${args[3]}/${args[2]});
        float value = ${func_body};
        return vec4(vec3(value / 255.0),1.0);
      }`; 
    // 2- if pixel used, define a sampler...

    let template = `#version 300 es
      precision highp float;
      
      // we need to declare an output for the fragment shader
      out vec4 outColor;
      uniform vec2 u_rasterSize;

      ${func_code}
      
      void main() {
        outColor = vec4(fill(0.0)); 
      }`;
    
    // DEBUG - 
    console.log(template);
    
    return template;
  } 
  
  // Step #2: Parse `func` to create fragment source
  let src_fs = parse(func.toString());

  // Step #2: Create - compile + link - shader program
  let the_shader = gpu.createProgram(gpuEnv,src_vs,src_fs);
  
  // Step #3: Create the rectangle WITHOUT texture 
  let gproc = gpu.createGPU(gpuEnv,raster.width,raster.height)
    .geometry({
      type: gpu.TRIANGLE_STRIP,
      num: 4,
      vertices: new Float32Array([
        0.0,0.0,
        0.0,1.0,
        1.0,0.0,
        1.0,1.0,
        ])
    })
    .attribute('a_vertex',2,'float', 2 * 4,0)
    .packWith(the_shader) 
    .clearCanvas([0.0,1.0,1.0,1.0])
    .preprocess()
    .uniform('u_rasterSize',new Float32Array([raster.width,raster.height]) )
    .run();
    
  return raster;
};
  

/**
  * Fill with values calculated from a function
  *
  * @param {function} func - A function
  * <p>The function may take a maximum of nine arguments:</p>
  * <ul>
  * <li>pix - Pixel value</li>
  * <li>index - Index corresponding to pix. A raster is a 1D pixels array</li>
  * <li>x - X-coordinate of pix</li>
  * <li>y - Y-coordinate of pix</li>
  * <li>z - Z-coordinate of pix if raster is in 3D</li>
  * <li>w - Width of raster</li>
  * <li>h - Height of raster</li>
  * <li>a - Angle calculated as atan2(y/x)</li>
  * <li>d - Distance to the center</li>
  * </ul>
  * @example <caption>Fill with a spiral</caption>
  * const DEG = Math.PI / 180;
  * const spiral = (pix,i,x,y,z,w,h,a,d) => 128 * (Math.sin(d / 10+ a * DEG)+1);
  * let raster = T.fill(spiral)(img.getRaster() );
  * @param {Raster} raster - Input Raster
  * @param {boolean} copy_mode - Useless, here. Only for compatibility with other process functions
  *
  * @author Jean-Christophe Taveau
  */
const math = (func) => (raster,copy_mode=true) => {
  // TODO
  // cpu.fill(func)(T.Raster.from(raster,copy_mode),copy_mode);
};

/**
 * Image Calculator. Combine two images by operation
 *
 * @param {Raster} raster - Input Raster
 * @param {function} func - Function for computation
 * @param {Raster} raster - Input Raster
 * @param {boolean} copy_mode - Copy mode to manage memory usage.
 * @example <caption>Addition of two uint8 rasters with clamping</caption>
 * let raster3 = T.calc(raster1, (px1,px2) => T.clampUint8(px1 + px2) )(raster2)
 *
 * @author Jean-Christophe Taveau
 */
const calc = (other,func) => (raster,copy_mode=true) => {
  // TODO Assume two raster have same dimension

  return output;
};

// Export




/***/ }),
/* 33 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return blend; });
/* unused harmony export viewport */
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



/**
 * https://www.khronos.org/opengl/wiki/Blending
 *
 * @example
 *
 * 
 * @author Jean-Christophe Taveau
 */
const blend = (funcRGBA) => {
  // TODO
  const parse = (txt) => {
    // Get Arguments
    // parse body
    // equations: add(s+d), subtract(s-d) reverse_subtract(d-s) ,min(s,d) max(s,d)
    //factors: constants (0 and 1), alpha, src, dst, constant_color via blendColor?, constant_alpha?
    // get Blend values
  };
  
  // func(src,dst) => src + dst - blendEquation(FUNC_ADD); blendFunc(ONE,ONE))
  // func(src,dst) => src - dst - blendEquation(FUNC_SUBTRACT); blendFunc(ONE,ONE))
  // func(src,dst) => dst - src - blendEquation(FUNC_REVERSE_SUBTRACT); blendFunc(ONE,ONE))
  // func(src,dst) => src * dst [+ 0 * dst]  - blendEquation(FUNC_ADD); blendFunc(DST_COLOR,ZERO))
  // func(src,dst) => src * src.a + (1 - src.a) * dst]  - blendEquation(FUNC_ADD); blendFunc(SRC_ALPHA,ONE_MINUS_SRC_ALPHA))

  // Parse one-liner function
  parse(funcRGBA.toString());
  
  return {
    name: 'blend',
    params: [gpu.FUNC_ADD,gpu.ONE,gpu.ONE]
  }
}

/**
 *
 * @author Jean-Christophe Taveau
 */
const viewport = (x,y,w,h) => ({name: 'viewport', params: [x,y,w,h]});







/***/ }),
/* 34 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return histogram; });
/*
 *  TIMES: Tiny Image ECMAScript Application
 *  Copyright (C) 2017  Jean-Christophe Taveau.
 *
 *  This file is part of TIMES
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with TIMES.  If not, see <http://www.gnu.org/licenses/>.
 *
 *
 * Authors:
 * Jean-Christophe Taveau
 */



/**
 * @module statistics
 */
 
/**
 * Computes basic stats: min, max, mean/average and standard deviation of the image.
 * Algorithm for variance found in <a href="https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Two-pass_algorithm">Wikipedia</a>
 * 
 * @param {Raster} img - Input raster
 * @param {boolean} copy_mode - Useless here, only for compatibility with the other processing functions
 * @return {object} - Returns an object containing min, max, mean, variance
 *
 * @author Jean-Christophe Taveau
 */
const statistics = (img, copy_mode = true) => {
  // TODO

  return img;
};

const histogram = (binNumber) => (raster, copy_mode = true) => {
  // https://stackoverflow.com/questions/10316708/ios-glsl-is-there-a-way-to-create-an-image-histogram-using-a-glsl-shader
  // https://www.opengl.org/discussion_boards/showthread.php/151073-copying-from-texture-to-vertex-buffer
  // texture to vertex buffer ? see http://nullprogram.com/blog/2014/06/29/
  
  let src_vs_texture = `#version 300 es
  
    in int a_index;

    uniform int maxbin;
    
    // Vertex Texture
    uniform sampler2D u_raster;
    
    out float bin;
    
    void main() {
      ivec2 u_size = textureSize(u_raster,0);
      int x = (a_index % u_size.x);
      int y = int(a_index / u_size.x);
      vec2 coords = vec2(x / u_size.x, y / u_size.y);
      // bin = texture(u_raster, coords) ;

      gl_Position = vec4(coords * 2.0 - 1.0, 0.0, 1.0);
    }
  `;
  // Vertex Shader
  let src_vs = `#version 300 es
  
    in float a_pixel;

    uniform float u_maxbin;
    
    out float bin;
    
    void main() {
      bin = (a_pixel + 0.5) / u_maxbin;
      gl_Position = vec4(bin * 2.0 - 1.0, 0.0, 0.0, 1.0);
    }
  `;
  // Fragment Shader
  let src_fs = `#version 300 es
    precision mediump float;
    
    const vec3 step = vec3(1.0,0.0,0.0);
    
    in float bin;
    out vec4 outColor;
    
    void main(){
      outColor = vec4(step, 1.0) ;
    }`;
  
  // Step #2: Create - compile + link - shader program
  let the_shader = gpu.createProgram(gpuEnv,src_vs,src_fs);
  
  // Step #3: Create the rectangle WITHOUT texture
  let maxBin = binNumber; 
  
  let gproc = gpu.createGPU(gpuEnv,maxBin,1)
    .geometry({
      type: gpu.POINTS,
      num: raster.width * raster.height,
      vertices: new Float32Array(raster.pixelData)
    } )
    .attribute('a_pixel',1,'float', 4,0)
    .packWith(the_shader) 
    .clearCanvas([0.0,0.0,0.0,1.0])
    .redirectTo('fbo','float32')
    .preprocess([
      gpu.blend((src,dst) => src + dst)
    ])
    .uniform('u_maxbin',maxBin)
    .run();
    
  let histogramFloat = gproc.readPixels('fbo').filter( (v,i) => ( (i % 4) === 0)  );
    
  if (raster.statistics === undefined) {
    raster.statistics = {
      min: -1,
      max: -1,
      count : raster.pixelData.length,
      mean : -1,
      stddev : -1,
      histogram: histogramFloat
    };
  }
  else {
    raster.statistics.histogram = histogramFloat;
  }

  return raster;
};

// Exports





/***/ })
/******/ ]);
});