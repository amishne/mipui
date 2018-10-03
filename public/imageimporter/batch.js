const imageSrcs = [
  'B1ClassicLook.png',
  'blue_map.png',
  'blue-megadungeon001b.jpg',
  'brown_map.png',
  'bw_map.jpg',
  'charcoal-map.jpg',
  'donjon_map.png',
  'dungeon-map.jpg',
  'dungeon1map_keyed.png',
  'dungeons-and-dragons-dungeon-maps_179156.jpg',
  'dyson_map1.png',
  'dyson2-map.jpg',
  'embossed_map.jpg',
  'gridless-map.jpg',
  'hand_drawn_map.jpg',
  'hand-drawn-griddy-map.png',
  'head.jpg',
  'level1.jpg',
  'max.jpg',
  'Mega-Level-1.png',
  'random_map_005_inkscape.png',
  'szGzO2AbPWASkqxbKW4oUBoYpbYXlZdmoi2KeSzgt3s.png',
  'Turbos_Secret_Keep.jpg',
  'underground_river_dysonified.jpg',
  'ympj4qtv5aj11.jpg',
];

function start() {
  const parent = document.getElementById('stackContainer');
  imageSrcs.forEach(async(src, index) => {
    //if (index != 7) return;
    const image = new Image('training/' + src, index);
    await image.initialize(parent);
    console.log(`${index}) ${src}`);
    processImage(image);
  });
}

async function processImage(image) {
  const lineInfo = new Griddler(image).calculateLineInfo();
  const cellInfo = new CellInfo(image, lineInfo);
  cellInfo.initialize();
  new Clusterer(image, cellInfo).assign();

  //const chunker = new Chunker(image, cellInfo);
  //await chunker.assign();
  //chunker.drawChunks();
  //new Joiner(image, cellInfo, chunker).join();
}

window.onload = () => {
  start();
};
