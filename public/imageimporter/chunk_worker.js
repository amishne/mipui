let allCells = [];
const chunkCells = new Set();
const boundaryCells = new Set();

onmessage = e => {
  switch (e.data.message) {
    case 'initialize':
      allCells = e.data.cells;
      width = e.data.width;
      height = e.data.height;
      break;
    case 'addSeed':
      addSeed(e.data.seed);
      break;
    case 'has':
      postMessage({message: 'has', result: chunkCells.has(e.data.cell)});
      break;
    case 'done':
      postMessage({message: 'done', chunkCells, boundaryCells});
      break;
  }
};

function addSeed(seed) {
  if (chunkCells.size > 0 && !chunkCells.has(seed)) return;
  chunkCells.add(seed);
  // Compose a front from all cells of identical stats.
  let front =
      new Set(allCells.filter(cell => areCellsIdentical(seed, cell)));
  while (front.size > 0) {
    const newFront = new Set();
    for (const frontCell of front) {
      for (const neighbor of getImmediateNeighbors(frontCell)) {
        if (chunkCells.has(neighbor) ||
            boundaryCells.has(neighbor) ||
            newFront.has(neighbor)) {
          continue;
        }
        if (areCellsSimilar(frontCell, neighbor)) {
          chunkCells.add(neighbor);
          newFront.add(neighbor);
        } else {
          boundaryCells.add(neighbor);
        }
      }
    }
    front = newFront;
  }
}

function getImmediateNeighbors(cell) {
  const neighbors = [];
  for (let colDiff = -0.5; colDiff <= 0.5; colDiff += 0.5) {
    for (let rowDiff = -0.5; rowDiff <= 0.5; rowDiff += 0.5) {
      if (colDiff == 0 && rowDiff == 0) continue;
      const neighbor = getCell(cell.col + colDiff, cell.row + rowDiff);
      if (neighbor) neighbors.push(neighbor);
    }
  }
  return neighbors;
}

function areCellsSimilar(cell1, cell2) {
  return areCellsSimilarToEpsilon(cell1, cell2, 100, 100);
}

function areCellsIdentical(cell1, cell2) {
  return areCellsSimilarToEpsilon(cell1, cell2, 50, 100);
}

function areCellsSimilarToEpsilon(cell1, cell2, colorEpsilon, varianceEpsilon) {
  const colorEpsilonSquared = Math.pow(colorEpsilon, 2);
  for (let i = 0; i < cell1.meanColor.length; i++) {
    if (distanceSquared(cell1.meanColor, cell2.meanColor) >
        colorEpsilonSquared) {
      return false;
    }
  }
  const varianceEpsilonQuad = Math.pow(varianceEpsilon, 4);
  for (let i = 0; i < cell1.variance.length; i++) {
    if (distanceSquared(cell1.variance, cell2.variance) >
        varianceEpsilonQuad) {
      return false;
    }
  }
  return true;
}

function distanceSquared(arr1, arr2) {
  let result = 0;
  for (let i = 0; i < arr1.length; i++) {
    result += Math.pow(arr1[i] - arr2[i], 2);
  }
  return result;
}

function getCell(col, row) {
  if (col < -0.5 || col > width || row < -0.5 || col > height) {
    return null;
  }
  const x = (col + 0.5) * 2;
  const y = (row + 0.5) * 2;
  const elementsPerRow = (width + 1) * 2;
  return allCells[x + y * elementsPerRow];
}
