importScripts('opencv.js');
importScripts('griddler.js');
importScripts('celler.js');
importScripts('chunker.js');

onmessage = e => {
  initializeContext(e.data);
  const lineInfo = new Griddler().calculateLineInfo();
  const cellInfo = new CellInfo(lineInfo);
  cellInfo.initialize();
  const chunker = new Chunker(cellInfo);
  chunker.assign();
  chunker.drawChunks();
};

function draw(callback) {
  const mat = cv.Mat.zeros(imageMat.rows, imageMat.cols, cv.CV_8UC3);
  callback(mat);
  postMessage({mat, id});
  mat.delete();
}
