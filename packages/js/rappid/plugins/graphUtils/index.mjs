import { dia } from 'jointjs/src/core.mjs';
import constructTree from './constructTree.mjs';
import shortestPath from './shortestPath.mjs';
import toAdjacencyList from './toAdjacencyList.mjs';

export { constructTree, shortestPath, toAdjacencyList };

/* Side effects */

dia.Graph.prototype.shortestPath = function(source, target, opt) {
    return shortestPath(this, source, target, opt);
};

dia.Graph.prototype.constructTree = function(parent, opt) {
    return constructTree(parent, opt, null, []);
};
