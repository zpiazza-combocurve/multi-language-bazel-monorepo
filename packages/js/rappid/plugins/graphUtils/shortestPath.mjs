import { Dijkstra } from '../alg/Dijkstra.mjs';

// Returns an array of IDs of nodes on the shortest path between `source` and `target`.
// `source` and `target` can either be elements or IDs of elements.
// `opt.weight` is an optional function returning a distance between two nodes.
// If `opt.directed` is `true`, the algorithm will take link direction into account.
export default function shortestPath(graph, source, target, opt = {}) {

    const adjacencyList = {};
    graph.getLinks().forEach(function(link) {
        const sourceId = link.get('source').id;
        if (!adjacencyList[sourceId]) {
            adjacencyList[sourceId] = [];
        }
        const targetId = link.get('target').id;
        if (!adjacencyList[targetId]) {
            adjacencyList[targetId] = [];
        }
        adjacencyList[sourceId].push(targetId);
        if (!opt.directed) {
            adjacencyList[targetId].push(sourceId);
        }
    });

    const previous = Dijkstra(adjacencyList, source.id || source, opt.weight);
    const path = [];
    let u = target.id || target;
    if (previous[u]) path.push(u);
    while ((u = previous[u])) {
        path.unshift(u);
    }
    return path;
}
