class Clusterer {
  constructor(image, cellInfo) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.idsToClusters_ = new Map();
    this.topPrimaryClusters_ = [];
    this.topDividerClusters_ = [];
  }
}

/*
function clusterColors(image, mat, cellInfo) {
  // const unknownCells = cellInfo.cells.filter(cell => !cell.meanColor);
  const primaryCells =
      cellInfo.cells.filter(cell => cell.meanColor && cell.role == 'primary');
  const dividerCells =
      cellInfo.cells.filter(cell => cell.meanColor && cell.role != 'primary');
//  const verHorCells =
//      cellInfo.cells.filter(cell => cell.meanColor &&
//          (cell.role == 'vertical' || cell.role == 'horizontal'));
//  const cornerCells =
//      cellInfo.cells.filter(cell => cell.meanColor && cell.role == 'corner');
  const primaryClusters =
      new Ichuk(primaryCells, 'meanColor', 'primary_').getTopClusters(2);
  const dividerClusters =
      new Ichuk(dividerCells, 'meanColor', 'divider_').getTopClusters(3);
  primaryCells.forEach(cell => {
    cell.topCluster = primaryClusters.find(c => c.objects.includes(cell));
  });
  dividerCells.forEach(cell => {
    cell.topCluster = dividerClusters.find(c => c.objects.includes(cell));
  });
//  const verHorClusters =
//      new Ichuk(verHorCells, 'meanColor').getTopClusters(2);
//  const cornerClusters =
//      new Ichuk(cornerCells, 'meanColor').getTopClusters(2);
  const segmented = cv.Mat.zeros(mat.rows, mat.cols, cv.CV_8UC3);
  drawTopClusters(segmented, primaryClusters);
  drawTopClusters(segmented, dividerClusters);
//  drawTopClusters(segmented, verHorClusters);
//  drawTopClusters(segmented, cornerClusters);
  cv.imshow(createStackCanvas(image), segmented);
  segmented.delete();
  return {primaryClusters, dividerClusters};
}

function drawTopClusters(mat, clusters) {
  drawCluster(mat, clusters[0], [0, 0, 0, 255]);
  drawCluster(mat, clusters[1], [255, 255, 255, 255]);
  if (clusters.length > 2) {
    drawCluster(mat, clusters[2], [255, 0, 0, 255]);
  }
  if (clusters.length > 3) {
    drawCluster(mat, clusters[3], [0, 255, 0, 255]);
  }
  if (clusters.length > 4) {
    drawCluster(mat, clusters[4], [0, 0, 255, 255]);
  }
  if (clusters.length > 5) {
    drawCluster(mat, clusters[4], [0, 255, 255, 255]);
  }
}

function drawCluster(mat, cluster, color) {
  cluster.objects.forEach(cell => {
    cv.rectangle(mat,
        new cv.Point(cell.x, cell.y),
        new cv.Point(cell.x + cell.width, cell.y + cell.height),
        color, cv.FILLED);
  });
}

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
