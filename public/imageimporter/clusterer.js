class Clusterer {
  constructor(image, cells) {
    this.image_ = image;
    this.cellInfo_ = cells;
    this.idsToClusters_ = new Map();
    this.topPrimaryClusters_ = [];
    this.topDividerClusters_ = [];
    this.idCounter_ = 0;
    this.clusterById_ = {};
  }

  assign() {
    this.cellInfo_.cellList.forEach(cell => {
      //cell.data = [...cell.meanColor, ...cell.centerColor, cell.row, cell.col];
      cell.data = [...cell.meanColor, ...cell.centerColor];
    });
    const clustersByRole = this.cluster_();
    const clusterGroups = this.mergeClusters_(clustersByRole);
  }

  cluster_() {
    const cellsByRole = {
      corner: [],
      primary: [],
      divider: [],
    };
    this.cellInfo_.cellList.forEach(cell => {
      let key = cell.role;
      if (key == 'horizontal' || key == 'vertical') key = 'divider';
      cellsByRole[key].push(cell);
    });
    const clustersByRole = {};
    const clusterPreview =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    Object.keys(cellsByRole).forEach(key => {
      const clusters = new Cluster(cellsByRole[key], null, (cluster, parent) =>
        this.assignId_(cluster, parent)).getTopClusters(3);
      clustersByRole[key] = clusters;
      console.log('Drawing clusters for role ' + key);
      this.drawClusters_(clusterPreview, clusters);
    });
    this.assignClustersToCells_(clustersByRole);
    this.image_.appendMatCanvas(clusterPreview);
    clusterPreview.delete();
    return clustersByRole;
  }

  assignClustersToCells_(clustersByRole) {
    // Assign a cluster to each cell.
    Object.keys(clustersByRole).forEach(key => {
      const clusters = clustersByRole[key];
      clusters.forEach(cluster => {
        cluster.cells.forEach(cell => { cell.cluster = cluster; });
      });
    });
    // Assign neighbors.
    const getCluster = (col, row) => {
      const other = this.cellInfo_.getCell(col, row);
      return other ? other.cluster : null;
    };
    this.cellInfo_.cellList.forEach(cell => {
      cell.neighbors = {
        t: getCluster(cell.col, cell.row - 0.5),
        r: getCluster(cell.col + 0.5, cell.row),
        b: getCluster(cell.col, cell.row + 0.5),
        l: getCluster(cell.col - 0.5, cell.row),
      };
    });
//    const getCell = (col, row) => this.cellInfo_.getCell(col, row);
//    this.cellInfo_.cellList.forEach(cell => {
//      const col = cell.col;
//      const row = cell.row;
//      cell.neighbors = {
////        full: {
////          t: getCell(col, row - 1),
////          r: getCell(col + 1, row),
////          b: getCell(col, row + 1),
////          l: getCell(col - 1, row),
////          tr: getCell(col + 1, row - 1),
////          br: getCell(col + 1, row + 1),
////          bl: getCell(col - 1, row + 1),
////          tl: getCell(col - 1, row - 1),
////        },
//        half: {
//          t: getCell(col, row - 0.5),
//          r: getCell(col + 0.5, row),
//          b: getCell(col, row + 0.5),
//          l: getCell(col - 0.5, row),
////          tr: getCell(col + 0.5, row - 0.5),
////          br: getCell(col + 0.5, row + 0.5),
////          bl: getCell(col - 0.5, row + 0.5),
////          tl: getCell(col - 1, row - 0.5),
//        },
//      };
//    });
  }

  assignId_(cluster, parentCluster) {
    let initial = '';
    switch (cluster.cells[0].role) {
      case 'primary':
        initial = 'P';
        break;
      case 'horizontal':
      case 'vertical':
        initial = 'D';
        break;
      case 'corner':
        initial = 'C';
        break;
    }
    const id = parentCluster ? `${parentCluster.id}:${this.idCounter_++}` :
      `${initial}${this.idCounter_++}`;
    this.clusterById_[id] = cluster;
    return id;
  }

  drawClusters_(mat, clusters) {
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
    clusters.forEach((cluster, index) => {
      const color = colors[index < colors.length ? index : colors.length - 1];
      console.log(`Drawing ${cluster.id} with the color ${color}.`);
      this.drawCluster_(mat, cluster, color);
    });
  }

  drawCluster_(mat, cluster, color) {
    for (const cell of cluster.cells) {
      cv.rectangle(mat,
          new cv.Point(cell.x, cell.y),
          new cv.Point(cell.x + cell.width, cell.y + cell.height),
          color, cv.FILLED);
    }
  }

  mergeClusters_(clustersByRole) {
    const similarityMatrix = new Map();
    const changeSimilarity = (cluster1, cluster2, by) => {
      const keys = [cluster1.id, cluster2.id].sort();
      const key = keys.join(',');
      if (similarityMatrix.has(key)) {
        similarityMatrix.set(key, similarityMatrix.get(key) + by);
      } else {
        similarityMatrix.set(key, by);
      }
    };

    this.cellInfo_.cellList.forEach(cell => {
      if (!cell.neighbors.t || !cell.neighbors.r ||
          !cell.neighbors.b || !cell.neighbors.l) {
        // Ignore cells on the edge.
        return;
      }
      const centerCluster = cell.cluster;

      // A corner or primary entirely surrounded by the same cluster is likely
      // to also belong to that cluster.
      const cornerOrPrimarySameAsImmediateNeighbors =
          (cell.role == 'corner' || cell.role == 'primary') &&
          centerCluster != cell.neighbors.t &&
          cell.neighbors.t == cell.neighbors.r &&
          cell.neighbors.r == cell.neighbors.b &&
          cell.neighbors.b == cell.neighbors.l;
      if (cornerOrPrimarySameAsImmediateNeighbors) {
        changeSimilarity(centerCluster, cell.neighbors.t, 1);
      }

      // A divider between different clusters likely belongs to one of them.
      const dividerBetweenDifferentClustersWeight = 0.1;
      const horizontalDividerBetweenDifferentClusters =
          cell.role == 'horizontal' &&
          cell.neighbors.t != cell.neighbors.b;
      if (horizontalDividerBetweenDifferentClusters) {
        changeSimilarity(centerCluster, cell.neighbors.t,
            dividerBetweenDifferentClustersWeight);
        changeSimilarity(centerCluster, cell.neighbors.b,
            dividerBetweenDifferentClustersWeight);
      }
      const verticalDividerBetweenDifferentClusters =
          cell.role == 'vertical' &&
          cell.neighbors.l != cell.neighbors.r;
      if (verticalDividerBetweenDifferentClusters) {
        changeSimilarity(centerCluster, cell.neighbors.l,
            dividerBetweenDifferentClustersWeight);
        changeSimilarity(centerCluster, cell.neighbors.r,
            dividerBetweenDifferentClustersWeight);
      }

      const sameClusterInOneDirectionButNotTheOtherWeight = 0.2;
      const hasSameClusterTopAndBottomButNotLeftAndRight =
          cell.neighbors.t == cell.neighbors.b &&
          cell.neighbors.l != cell.neighbors.r;
      if (hasSameClusterTopAndBottomButNotLeftAndRight) {
        changeSimilarity(centerCluster, cell.neighbors.t,
            sameClusterInOneDirectionButNotTheOtherWeight);
        changeSimilarity(centerCluster, cell.neighbors.b,
            sameClusterInOneDirectionButNotTheOtherWeight);
      }
      const hasSameClusterLeftAndRightButNotTopAndBottom =
          cell.neighbors.t != cell.neighbors.b &&
          cell.neighbors.l == cell.neighbors.r;
      if (hasSameClusterLeftAndRightButNotTopAndBottom) {
        changeSimilarity(centerCluster, cell.neighbors.l,
            sameClusterInOneDirectionButNotTheOtherWeight);
        changeSimilarity(centerCluster, cell.neighbors.r,
            sameClusterInOneDirectionButNotTheOtherWeight);
      }
    });

    const clusterGroups = [];

    console.log(similarityMatrix);
    for (const [key, count] of similarityMatrix.entries()) {
      const [cluster1, cluster2] =
          key.split(',').map(id => this.clusterById_[id]);
      const threshold = 0.25;
      if (count / cluster1.size > threshold ||
          count / cluster2.size > threshold) {
        // Merge!
        const existingGroup1 = clusterGroups.find(
            clusterGroup => clusterGroup.clusters.has(cluster1));
        const existingGroup2 = clusterGroups.find(
            clusterGroup => clusterGroup.clusters.has(cluster2));
        if (!existingGroup1 && !existingGroup2) {
          clusterGroups.push(new ClusterGroup(cluster1, cluster2));
        } else if (existingGroup1 && !existingGroup2) {
          existingGroup1.addCluster(cluster2);
        } else if (!existingGroup1 && existingGroup2) {
          existingGroup2.addCluster(cluster1);
        } else if (existingGroup1 != existingGroup2) {
          // Both groups already exist and are different; merge them!
          clusterGroups.slice(clusterGroups.indexOf(existingGroup1), 1);
          clusterGroups.slice(clusterGroups.indexOf(existingGroup2), 1);
          const newGroup = new ClusterGroup(cluster1, cluster2);
          existingGroup1.clusters.forEach(c => newGroup.addCluster(c));
          existingGroup2.clusters.forEach(c => newGroup.addCluster(c));
          clusterGroups.push(newGroup);
        }
      }
    }

    const mergedClusters = [
      ...clustersByRole.primary,
      ...clustersByRole.divider,
      ...clustersByRole.corner,
    ].filter(c => !clusterGroups.some(cg => cg.clusters.has(c)))
        .concat(clusterGroups);
    mergedClusters.sort((c1, c2) => c2.size - c1.size);

    for (const cluster of mergedClusters) {
      for (const cell of cluster.cells) {
        cell.cluster = cluster;
      }
    }

    console.log(mergedClusters);
    const clusterPreview =
        cv.Mat.zeros(this.image_.mat.rows, this.image_.mat.cols, cv.CV_8UC3);
    this.drawClusters_(clusterPreview, mergedClusters);
    this.image_.appendMatCanvas(clusterPreview);
    clusterPreview.delete();
  }
}

/*

function assignClusters(image, mat, cellInfo, clusters) {
  applyHueristics(cellInfo, clusters);
  assignByHueristics(image, mat, cellInfo, clusters);
}

function applyHueristics(cellInfo, clusters) {
  // Search for statistically-significant behaviors and vote accordingly.

  // Cells are in general ^2 more likely to touch similar cells than dissimilar
  // cells.
  rule(cellInfo, data => ({
    satisfied: true,
    info: {
      center: data.target,
      neighbors: new Set([
        data.half.t, data.half.tr, data.half.r, data.half.br,
        data.half.b, data.half.bl, data.half.l, data.half.tl]),
    },
  }), ({center, neighbors}) => {
    if (!center.sameAs) center.sameAs = [];
    for (const neighbor of neighbors) {
      if (center !== neighbor) center.sameAs.push({cluster: neighbor});
    }
  });

  // When a primary cell is surrounded by 4 borders of a single cluster, it's
  // likely that the primary cell is the same assignment as the borders.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.half.t &&
        data.half.t === data.half.r &&
        data.half.r === data.half.b &&
        data.half.b === data.half.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    if (!center.sameAs) center.sameAs = [];
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
  });

  // When a primary cell is surrounded by 4 primaries of a single cluster but
  // that are different from it, it's unlikely to be floor.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.full.t && data.full.t !== data.target &&
        data.full.t === data.full.r &&
        data.full.r === data.full.b &&
        data.full.b === data.full.l;
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isFloor = (center.isFloor || 0) - 10;
  });

  // When a primary cell is surrounded by 4 primaries of the same cluster as
  // itself, they are likely to be floor.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'primary' && data.full.t &&
        data.full.t === data.full.r &&
        data.full.r === data.full.b &&
        data.full.b === data.full.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    if (!center.sameAs) center.sameAs = [];
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
    center.sameAs.push({cluster: surroundedBy});
  });

  // When a corner is surrounded by the same cluster for all dividers, they are
  // unlikely to be walls.
  rule(cellInfo, data => {
    const satisfied =
        data.role == 'corner' &&
        data.half.t && data.half.t === data.half.r &&
        data.half.t && data.half.r === data.half.b &&
        data.half.t && data.half.b === data.half.l;
    return {satisfied, info: {center: data.target, surroundedBy: data.half.t}};
  }, ({center, surroundedBy}) => {
    surroundedBy.isFloor = (surroundedBy.isFloor || 0) + 1;
  });

  // When a primary is cornered between two different clusters, it's likely to
  // be angular walls.
  rule(cellInfo, data => {
    if (data.role != 'primary') return {satisfied: false};
    const satisfied =
        data.full.t !== data.full.b && data.full.r !== data.full.l &&
        ((data.full.t === data.full.r && data.full.b === data.full.l) ||
        (data.full.t === data.full.l && data.full.b === data.full.r));
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isAngular = (center.isAngular || 0) + 1;
  });

  // A divider that doesn't share its cluster with its corners is unlikely to be
  // a wall.
  rule(cellInfo, data => {
    const satisfied =
        (data.role == 'horizontal' &&
        (data.target !== data.half.l || data.target !== data.half.r)) ||
        (data.role == 'vertical' &&
        (data.target !== data.half.t || data.target !== data.half.b));
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isWall = (center.isWall || 0) - 1;
  });

  // A divider that separates two different clusters is likely to be a wall.
  rule(cellInfo, data => {
    const satisfied =
        (data.role == 'horizontal' && data.half.t !== data.half.b) ||
        (data.role == 'vertical' && data.half.l !== data.half.r);
    return {satisfied, info: {center: data.target}};
  }, ({center}) => {
    center.isWall = (center.isWall || 0) + 1;
  });

  aggregateSameAs(clusters.primaryClusters);
  aggregateSameAs(clusters.dividerClusters);

  console.log(clusters);
}

function rule(cellInfo, condition, conclusion) {
  for (let y = -0.5; y < cellInfo.height; y += 0.5) {
    for (let x = -0.5; x < cellInfo.width; x += 0.5) {
      const targetCell = getCell(cellInfo, x, y);
      if (!targetCell || !targetCell.topCluster) continue;
      const data = {
        role: targetCell.role,
        target: targetCell.topCluster,
        full: {
          t: getCellCluster(cellInfo, x, y - 1),
          r: getCellCluster(cellInfo, x + 1, y),
          b: getCellCluster(cellInfo, x, y + 1),
          l: getCellCluster(cellInfo, x - 1, y),
          tr: getCellCluster(cellInfo, x + 1, y - 1),
          br: getCellCluster(cellInfo, x + 1, y + 1),
          bl: getCellCluster(cellInfo, x - 1, y + 1),
          tl: getCellCluster(cellInfo, x - 1, y - 1),
        },
        half: {
          t: getCellCluster(cellInfo, x, y - 0.5),
          r: getCellCluster(cellInfo, x + 0.5, y),
          b: getCellCluster(cellInfo, x, y + 0.5),
          l: getCellCluster(cellInfo, x - 0.5, y),
          tr: getCellCluster(cellInfo, x + 0.5, y - 0.5),
          br: getCellCluster(cellInfo, x + 0.5, y + 0.5),
          bl: getCellCluster(cellInfo, x - 0.5, y + 0.5),
          tl: getCellCluster(cellInfo, x - 1, y - 0.5),
        },
      };
      const {satisfied, info} = condition(data);
      if (satisfied) {
        conclusion(info);
      }
    }
  }
}

function getCell(cellInfo, x, y) {
  return cellInfo.cells.find(cell => cell.row == y && cell.col == x);
}

function getCellCluster(cellInfo, x, y) {
  const cell = getCell(cellInfo, x, y);
  if (!cell) return null;
  return cell.topCluster;
}

function aggregateSameAs(clusters) {
  const idsToClusters = new Map();
  clusters.forEach(cluster => {
    const counts = new Map();
    cluster.sameAs = cluster.sameAs || [];
    cluster.sameAs.forEach(sameAsCluster => {
      if (!idsToClusters.has(sameAsCluster.id)) {
        idsToClusters.set(sameAsCluster.id, sameAsCluster);
      }
      counts.set(sameAsCluster.id, (counts.get(sameAsCluster.id) || 0) + 1);
    });
    const aggregatedSameAs = [];
    for (const [key, value] of counts.entries()) {
      aggregatedSameAs.push({cluster: idsToClusters.get(key), count: value});
    }
    aggregatedSameAs.sort((x, y) => x.count - y.count);
    cluster.aggregatedSameAs = aggregatedSameAs;
  });
}

function assignByHueristics(image, mat, cellInfo, clusters) {
  clusters.dividerClusters.forEach(cluster => {
    cluster.isWallRatio = (cluster.isWall || 0) / cluster.size;
    cluster.isFloorRatio = (cluster.isFloor || 0) / cluster.size;
  });
  const dividerClusterWithHighestIsWallRatio =
      clusters.dividerClusters.reduce((c, m) =>
        c.isWallRatio > m.isWallRatio ? c : m, clusters.dividerClusters[0]);
  const dividerClusterWithHighestIsFloorRatio =
      clusters.dividerClusters.reduce((c, m) =>
        c.isFloorRatio > m.isFloorRatio ? c : m, clusters.dividerClusters[0]);

  const primaryWallClusters = [];
  const primaryFloorClusters = [];
  clusters.primaryClusters.forEach(cluster => {
    if (cluster.aggregatedSameAs.length > 0 &&
        cluster.aggregatedSameAs[0].cluster ===
        dividerClusterWithHighestIsWallRatio) {
      primaryWallClusters.push(cluster);
    }
    if (cluster.aggregatedSameAs.length > 0 &&
        cluster.aggregatedSameAs[0].cluster ===
        dividerClusterWithHighestIsFloorRatio) {
      primaryFloorClusters.push(cluster);
    }
  });
  clusters.primaryClusters.forEach(cluster => {
    if (cluster.aggregatedSameAs.length > 0 &&
        primaryWallClusters.length > 0 &&
        cluster !== primaryWallClusters[0] &&
        cluster.aggregatedSameAs[0].cluster === primaryWallClusters[0]) {
      primaryWallClusters.push(cluster);
    }
    if (cluster.aggregatedSameAs.length > 0 &&
        primaryFloorClusters.length > 0 &&
        cluster !== primaryFloorClusters[0] &&
        cluster.aggregatedSameAs[0].cluster === primaryFloorClusters[0]) {
      primaryFloorClusters.push(cluster);
    }
  });

  const segmented = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
  drawCluster(
      segmented, dividerClusterWithHighestIsWallRatio, [200, 0, 0, 255]);
  drawCluster(
      segmented, dividerClusterWithHighestIsFloorRatio, [0, 0, 200, 255]);
  primaryWallClusters.forEach(c => {
    drawCluster(segmented, c, [100, 0, 0, 255]);
  });
  primaryFloorClusters.forEach(c => {
    drawCluster(segmented, c, [0, 0, 100, 255]);
  });
  cv.imshow(createStackCanvas(image), segmented);
  segmented.delete();
}
*/
