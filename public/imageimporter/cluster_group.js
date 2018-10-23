class ClusterGroup extends Cluster {
  constructor(cluster1, cluster2) {
    super(
        [],
        null,
        () => `${cluster1.id}+${cluster2.id}`);
    this.clusters = new Set([cluster1, cluster2]);
  }

  addCluster(cluster) {
    this.id += '+' + cluster.id;
    this.clusters.add(cluster);
  }

  get cells() {
    return allCells_(this.clusters);
  }

  get size() {
    let sum = 0;
    for (const cluster of this.clusters.values()) {
      sum += cluster.size;
    }
    return sum;
  }

  split(k) {
    return Array.from(this.clusters);
  }
}

function * allCells_(clusters) {
  for (const cluster of clusters) {
    for (const cell of cluster.cells) {
      yield cell;
    }
  }
}
