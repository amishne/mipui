class Chunk {
  constructor(cellInfo) {
    this.cellInfo_ = cellInfo;
    this.worker_ = new Worker('chunk_worker.js');
    this.worker_.postMessage({
      message: 'initialize',
      cells: this.cellInfo_.cellList,
      width: this.cellInfo_.width,
      height: this.cellInfo_.height,
    });
  }

  async has(cell) {
    return new Promise((resolve, reject) => {
      this.worker_.onmessage = e => {
        if (e.data.message == 'has') resolve(e.data.result);
      };
      this.worker_.postMessage({message: 'has', cell});
    });
  }

  addSeed(seed) {
    this.worker_.postMessage({message: 'addSeed', seed});
  }

  async draw(mat, color) {
    return new Promise((resolve, reject) => {
      this.worker_.onmessage = e => {
        const {message, chunkCells} = e.data;
        if (message != 'done') return;
        for (const cell of chunkCells) {
          cv.rectangle(mat,
              new cv.Point(cell.x, cell.y),
              new cv.Point(cell.x + cell.width, cell.y + cell.height),
              color, cv.FILLED);
        }
        resolve();
      };
      this.worker_.postMessage({message: 'done'});
    });
  }
}
