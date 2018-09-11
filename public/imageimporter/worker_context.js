let id = null;
let imageMat = null;

function initializeContext(data) {
  id = data.id;
  imageMat = data.imageMat;
}

function draw(callback) {
  const mat = cv.Mat.zeros(imageMat.rows, imageMat.cols, cv.CV_8UC3);
  callback(mat);
  postMessage({mat, id});
  mat.delete();
}
