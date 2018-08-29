class ClusterGroup extends Cluster {
  constructor(cluster1, cluster2) {
    super(
        [...cluster1.cells, cluster2.cells],
        null,
        () => `${cluster1.id}+${cluster2.id}`);
    this.clusters = new Set([cluster1, cluster2]);
  }

  addCluster(cluster) {
    this.clusters.add(cluster);
    cluster.cells.forEach(cell => { this.cells.push(cell); });
  }
}
