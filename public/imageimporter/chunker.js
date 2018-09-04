class Chunker {
  constructor(image, cellInfo) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.chunks = [];
  }

  assign() {
    for (const cell of this.cellInfo_.cellList) {
      if (this.chunks.some(existingChunk => existingChunk.has(cell))) continue;
      const chunk = new Chunk(this.cellInfo_);
      chunk.addSeed(cell);
      this.chunks.push(chunk);
    }
  }

  drawChunks() {
    const chunkDisplay =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    const colors = [
      [255, 255, 255, 255],
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
      [255, 255, 0, 255],
      [255, 0, 255, 255],
      [0, 255, 255, 255],
      [150, 0, 0, 255],
      [0, 150, 0, 255],
      [0, 0, 150, 255],
      [150, 150, 0, 255],
      [150, 0, 150, 255],
      [0, 150, 150, 255],
      [150, 150, 150, 255],
      [0, 0, 0, 255],
    ];
    this.chunks.forEach((chunk, index) => {
      const color = colors[index < colors.length ? index : colors.length - 1];
      chunk.draw(chunkDisplay, color);
    });
    this.image_.appendMatCanvas(chunkDisplay);
    chunkDisplay.delete();
  }
}
