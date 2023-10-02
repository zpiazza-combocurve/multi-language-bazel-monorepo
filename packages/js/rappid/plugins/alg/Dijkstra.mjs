// Dijkstra's shortest path algorithm.
// ===================================

// Implemented using a priority queue.
// Time complexity: O(|E| + |V| log |V|)

// `adjacencyList` is an object where keys are nodes and values are
// lists of neighbours.
// `source` is the id of the source node from which shortest paths will be computed.
// `weight` is a function that returns a distance between two nodes.

import { PriorityQueue } from './PriorityQueue.mjs';

export const Dijkstra = function(adjacencyList, source, weight) {

    weight = weight || function(/* u, v */) { return 1; };

    var dist = {};
    dist[source] = 0;

    var previous = {};
    var Q = new PriorityQueue;

    for (var v in adjacencyList) {

        if (v !== source) {
            dist[v] = Infinity;
        }
        Q.insert(dist[v], v, v);
    }

    var u, neighbours, i, alt;
    var scanned = {};
    while (!Q.isEmpty()) {
        u = Q.remove();
        scanned[u] = true;
        neighbours = adjacencyList[u] || [];
        for (i = 0; i < neighbours.length; i++) {
            v = neighbours[i];
            if (!scanned[v]) {
                alt = dist[u] + weight(u, v);
                if (alt < dist[v]) {
                    dist[v] = alt;
                    previous[v] = u;
                    Q.updatePriority(v, alt);
                }
            }
        }
    }

    return previous;
};
