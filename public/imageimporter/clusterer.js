class Clusterer {
  constructor(image, cellInfo) {
    this.image_ = image;
    this.cellInfo_ = cellInfo;
    this.idsToClusters_ = new Map();
    this.topPrimaryClusters_ = [];
    this.topDividerClusters_ = [];
  }
}
