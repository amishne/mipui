class Chunker {
  constructor(image, cellInfo) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.chunks = [];
  }

  async assign() {
    let id = 0;
    for (const cell of this.cellInfo_.cellList) {
      if (this.chunks.some(existingChunk => existingChunk.has(cell))) continue;
      const newChunk = new Chunk(this.cellInfo_, `c${id++}`);
      newChunk.addSeed(cell);
      this.chunks.push(newChunk);
    }
  }

  drawChunks() {
    console.log(this.chunks);
    const chunkDisplay =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    const stops = [0, 50, 100, 150, 200, 250];
    const colors = [];
    for (const r of stops) {
      for (const g of stops) {
        for (const b of stops) {
          if (r == 0 && g == 0 && b == 0) continue;
          colors.push([r, g, b, 255]);
        }
      }
    }
    for (let i = 0; i < this.chunks.length; i++) {
      const color = colors[i % colors.length];
      this.chunks[i].draw(chunkDisplay, color);
    }
    this.image_.appendMatCanvas(chunkDisplay);
    chunkDisplay.delete();
  }
}
