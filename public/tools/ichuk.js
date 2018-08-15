class Ichuk {
  constructor(objects, dataField) {
    this.objects = objects;
    this.dataField_ = dataField;
  }

  get size() {
    return this.objects.length;
  }

  getTopClusters(k) {
    const clusters = this.split(k).sort((c1, c2) => c2.size - c1.size);
    // Split the first as long as it's guaranteed to contain a sub-cluster
    // larger than the last.
    while (clusters[0].size > 1 && clusters[0].size / k > clusters[1].size) {
      const top = clusters.shift();
      this.insertSorted_(clusters, top.split(k));
    }
    return clusters;
  }

  insertSorted_(into, from) {
    from.forEach(fromElem => {
      let index = into.findIndex(intoElem => intoElem.size < fromElem.size);
      if (index == -1) index = into.length;
      into.splice(index, 0, fromElem);
    });
  }

  split(k) {
    return this.kmeans_(k, Ichuk.distances_.euclidean)
        .map(objects => new Ichuk(objects, this.dataField_));
  }

  // k-means implementation adapted from https://gist.github.com/tarunc/3141694
  static get distances_() {
    return {
      euclidean: (v1, v2) => {
        let total = 0;
        for (let i = 0; i < v1.length; i++) {
          total += Math.pow(v2[i] - v1[i], 2);
        }
        return Math.sqrt(total);
      },
      manhattan: (v1, v2) => {
        let total = 0;
        for (let i = 0; i < v1.length ; i++) {
          total += Math.abs(v2[i] - v1[i]);
        }
        return total;
      },
      max: (v1, v2) => {
        let max = 0;
        for (let i = 0; i < v1.length; i++) {
          max = Math.max(max, Math.abs(v2[i] - v1[i]));
        }
        return max;
      },
    };
  }

  randomCentroids_(points, k) {
    const centroids = points.slice(0); // copy
    centroids.sort(() => Math.round(Math.random()) - 0.5);
    return centroids.slice(0, k);
  }

  closestCentroid_(point, centroids, distance) {
    let min = Infinity;
    let index = 0;
    for (let i = 0; i < centroids.length; i++) {
      const dist = distance(point, centroids[i]);
      if (dist < min) {
        min = dist;
        index = i;
      }
    }
    return index;
  }

  kmeans_(k, distance) {
    const points = this.objects.map(obj => obj[this.dataField_]);
    const centroids = this.randomCentroids_(points, k);
    const assignment = new Array(points.length);
    const clusters = new Array(k);

    let movement = true;
    while (movement) {
      // update point-to-centroid assignments
      for (let i = 0; i < points.length; i++) {
        assignment[i] = this.closestCentroid_(points[i], centroids, distance);
      }

      // update location of each centroid
      movement = false;
      for (let j = 0; j < k; j++) {
        const assigned = [];
        for (let i = 0; i < assignment.length; i++) {
          if (assignment[i] == j) {
            assigned.push(this.objects[i]);
          }
        }

        if (!assigned.length) {
          continue;
        }
        const centroid = centroids[j];
        const newCentroid = new Array(centroid.length);

        for (let g = 0; g < centroid.length; g++) {
          let sum = 0;
          for (let i = 0; i < assigned.length; i++) {
            sum += assigned[i][this.dataField_][g];
          }
          newCentroid[g] = sum / assigned.length;

          if (newCentroid[g] != centroid[g]) {
            movement = true;
          }
        }
        centroids[j] = newCentroid;
        clusters[j] = assigned;
      }
    }
    return clusters;
  }
}
