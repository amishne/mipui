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
  'hand-drawn-griddy-map.png',
  'underground_river_dysonified.jpg',
];

function start() {
  const parent = document.getElementById('stackContainer');
  imageSrcs.forEach(async(src, index) => {
    if (index > 0) return;
    const image = new Image('training/' + src);
    await image.initialize(parent);
    console.log(`${index}) ${src}`);
    processImage(image);
  });
}

async function processImage(image) {
  const lineInfo = new Griddler(image).calculateLineInfo();
  const cellInfo = new CellInfo(image, lineInfo);
  cellInfo.initialize();
  const chunker = new Chunker(image, cellInfo);
  await chunker.assign();
  chunker.drawChunks();
  new Joiner(image, cellInfo, chunker).join();
}

window.onload = () => {
  start();
};
