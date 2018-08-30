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
];

function start() {
  const parent = document.getElementById('stackContainer');
  imageSrcs.forEach(async(src, index) => {
    if (index != 10) return;
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
  new Clusterer(image, cells).assign();
}

window.onload = () => {
  start();
};
