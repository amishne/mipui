class Joiner {
  constructor(image, cellInfo, chunker) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.chunker_ = chunker;
    this.chunkById_ = new Map();
    this.chunker_.chunks.forEach(chunk => {
      this.chunkById_.set(chunk.id, chunk);
    });
  }

  join() {
    const similarityMatrix = new Map();
    const changeSimilarity = (chunk1, chunk2, by) => {
      const keys = [chunk1.id, chunk2.id].sort();
      const key = keys.join(',');
      if (similarityMatrix.has(key)) {
        similarityMatrix.set(key, similarityMatrix.get(key) + by);
      } else {
        similarityMatrix.set(key, by);
      }
    };
    const getChunk = (col, row) => {
      const other = this.cellInfo_.getCell(col, row);
      return other ? other.chunk : null;
    };
    this.cellInfo_.cellList.forEach(cell => {
      cell.neighbors = {
        t: getChunk(cell.col, cell.row - 0.5),
        r: getChunk(cell.col + 0.5, cell.row),
        b: getChunk(cell.col, cell.row + 0.5),
        l: getChunk(cell.col - 0.5, cell.row),
      };
    });
    this.cellInfo_.cellList.forEach(cell => {
      if (!cell.neighbors.t || !cell.neighbors.r ||
          !cell.neighbors.b || !cell.neighbors.l) {
        // Ignore cells on the edge.
        return;
      }
      const center = cell.chunk;

      // A corner or primary entirely surrounded by the same cluster is likely
      // to also belong to that cluster.
      const cornerOrPrimarySameAsImmediateNeighbors =
          (cell.role == 'corner' || cell.role == 'primary') &&
          center != cell.neighbors.t &&
          cell.neighbors.t == cell.neighbors.r &&
          cell.neighbors.r == cell.neighbors.b &&
          cell.neighbors.b == cell.neighbors.l;
      if (cornerOrPrimarySameAsImmediateNeighbors) {
        changeSimilarity(center, cell.neighbors.t, 1);
      }

      // A divider between different clusters likely belongs to one of them.
      const dividerBetweenDifferentClustersWeight = 0.1;
      const horizontalDividerBetweenDifferentClusters =
          cell.role == 'horizontal' &&
          cell.neighbors.t != cell.neighbors.b;
      if (horizontalDividerBetweenDifferentClusters) {
        changeSimilarity(center, cell.neighbors.t,
            dividerBetweenDifferentClustersWeight);
        changeSimilarity(center, cell.neighbors.b,
            dividerBetweenDifferentClustersWeight);
      }
      const verticalDividerBetweenDifferentClusters =
          cell.role == 'vertical' &&
          cell.neighbors.l != cell.neighbors.r;
      if (verticalDividerBetweenDifferentClusters) {
        changeSimilarity(center, cell.neighbors.l,
            dividerBetweenDifferentClustersWeight);
        changeSimilarity(center, cell.neighbors.r,
            dividerBetweenDifferentClustersWeight);
      }

      const sameClusterInOneDirectionButNotTheOtherWeight = 0.2;
      const hasSameClusterTopAndBottomButNotLeftAndRight =
          cell.neighbors.t == cell.neighbors.b &&
          cell.neighbors.l != cell.neighbors.r;
      if (hasSameClusterTopAndBottomButNotLeftAndRight) {
        changeSimilarity(center, cell.neighbors.t,
            sameClusterInOneDirectionButNotTheOtherWeight);
        changeSimilarity(center, cell.neighbors.b,
            sameClusterInOneDirectionButNotTheOtherWeight);
      }
      const hasSameClusterLeftAndRightButNotTopAndBottom =
          cell.neighbors.t != cell.neighbors.b &&
          cell.neighbors.l == cell.neighbors.r;
      if (hasSameClusterLeftAndRightButNotTopAndBottom) {
        changeSimilarity(center, cell.neighbors.l,
            sameClusterInOneDirectionButNotTheOtherWeight);
        changeSimilarity(center, cell.neighbors.r,
            sameClusterInOneDirectionButNotTheOtherWeight);
      }
    });

    const groups = [];

    console.log(similarityMatrix);
    for (const [key, count] of similarityMatrix.entries()) {
      const [chunk1, chunk2] =
          key.split(',').map(id => this.chunkById_.get(id));
      const threshold = 0.25;
      console.log(`${count / chunk1.size} ${count / chunk2.size}`);
      if (count / chunk1.size > threshold || count / chunk2.size > threshold) {
        // Merge!
        const existingGroup1 = groups.find(group => group.has(chunk1));
        const existingGroup2 = groups.find(group => group.has(chunk2));
        if (!existingGroup1 && !existingGroup2) {
          groups.push(new Set([chunk1, chunk2]));
        } else if (existingGroup1 && !existingGroup2) {
          existingGroup1.add(chunk2);
        } else if (!existingGroup1 && existingGroup2) {
          existingGroup2.add(chunk1);
        } else if (existingGroup1 != existingGroup2) {
          // Both groups already exist and are different; merge them!
          groups.slice(groups.indexOf(existingGroup1), 1);
          groups.slice(groups.indexOf(existingGroup2), 1);
          const newGroup = new Set();
          existingGroup1.forEach(c => newGroup.add(c));
          existingGroup2.forEach(c => newGroup.add(c));
          groups.push(newGroup);
        }
      }
    }
    this.chunker_.chunks.forEach(chunk => {
      if (!groups.some(group => group.has(chunk))) {
        groups.push(new Set([chunk]));
      }
    });
    console.log(groups);
    this.drawGroups_(groups);
  }

  drawGroups_(groups) {
    const groupDisplay =
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
    for (let i = 0; i < groups.length; i++) {
      const color = colors[i % colors.length];
      groups[i].forEach(chunk => chunk.draw(groupDisplay, color));
    }
    this.image_.appendMatCanvas(groupDisplay);
    groupDisplay.delete();
  }
}
