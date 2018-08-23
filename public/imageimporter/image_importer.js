const imageSrcs = [
  'dungeon-map.jpg',
  'blue_map.png',
  'brown_map.png',
  'bw_map.jpg',
  'donjon_map.png',
  'dyson_map1.png',
  'embossed_map.jpg',
  'hand_drawn_map.jpg',
  'dyson2-map.jpg',
  'gridless-map.jpg',
];

function start() {
  const parent = document.getElementById('stackContainer');
  imageSrcs.forEach(async(src, index) => {
    //if (index != 0) return;
    const image = new Image(src);
    await image.initialize(parent);
    console.log(`${index}) ${src}`);
    processImage(image);
  });
}

function processImage(image) {
  const lineInfo = new Griddler(image).calculateLineInfo();
  const cells = new Cells(image, lineInfo);
  cells.initialize();
  //new Clusterer(image, cellInfo).assign();
}

/*
function assign(image, mat, lineInfo) {
  const cellInfo = createCells(mat, lineInfo);
  calcCellStats(image, mat, cellInfo);
  const clusters = clusterColors(image, mat, cellInfo);
  assignClusters(image, mat, cellInfo, clusters);
}
*/

window.onload = () => {
  start();
};
