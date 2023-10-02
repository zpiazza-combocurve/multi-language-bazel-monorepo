import { util } from 'jointjs/src/core.mjs';

// Construct a tree from JSON structure of the form:
// `{ name: 'my label', children: [ { name: 'my label 2', children: [...] }, ...] }`
// `parent` is the tree object, i.e. the top level node.
// `opt.children` is the property specifying the children array. `'children'` is the default.
// If `opt.children` is a function, it will called with the current node as an argument and should return an array of its child nodes.
// `opt.makeElement` is a function that is passed the current tree node and returns a JointJS element for it.
// `opt.makeLink` is a function that is passed a parent and child nodes and returns a JointJS link for the edge.
export default function constructTree(parent, opt = {}, parentElement = null, collector = []) {

    const { children: childrenKey, makeElement, makeLink } = opt;

    const children = util.isFunction(childrenKey)
        ? childrenKey(parent)
        : parent[childrenKey || 'children'];

    if (!parentElement) {
        parentElement = makeElement(parent, null);
        collector.push(parentElement);
    }

    util.toArray(children).forEach(function(child) {

        const childElement = makeElement(child, parentElement);
        const link = makeLink(parentElement, childElement);
        collector.push(childElement, link);

        constructTree(child, opt, childElement, collector);
    });

    return collector;
}
