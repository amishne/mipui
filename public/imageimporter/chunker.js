class Chunker {
  constructor(image, cellInfo) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.chunks = [];
  }

  async assign() {
    for (const cell of this.cellInfo_.cellList) {
      const chunk =
//          this.chunks.find(existingChunk => existingChunk.has(cell)) ||
          new Chunk(this.cellInfo_);
      chunk.addSeed(cell);
      this.chunks.push(chunk);
    }
  }

  async drawChunks() {
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
    // colors.push([0, 0, 0, 255]);
    for (let i = 0; i < this.chunks.length; i++) {
      const color = colors[i % colors.length];
      await this.chunks[i].draw(chunkDisplay, color);
    }
    this.image_.appendMatCanvas(chunkDisplay);
    chunkDisplay.delete();
  }
}
