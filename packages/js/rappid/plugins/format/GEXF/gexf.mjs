export const toCellsArray = function(xmlString, makeElement, makeLink) {

    // Parse the `xmlString` into a DOM tree.
    const parser = new DOMParser();
    const dom = parser.parseFromString(xmlString, 'text/xml');
    if (dom.documentElement.nodeName == 'parsererror') {
        throw new Error('Error while parsing GEXF file.');
    }

    // Get all nodes and edges.
    const nodes = Array.from(dom.documentElement.querySelectorAll('node'));
    const edges = Array.from(dom.documentElement.querySelectorAll('edge'));

    // Return value.
    const cells = [];

    nodes.forEach(function(node) {

        const data = {
            id: node.getAttribute('id'),
            label: node.getAttribute('label')
        };

        // <viz:size value="2.0375757"/>
        const sizeNode = node.querySelector('size');
        if (sizeNode) {
            const size = parseFloat(sizeNode.getAttribute('value'));
            data.width = size;
            data.height = size;
        }

        // <viz:position x="15.783598" y="40.109245" z="0.0"/>
        const positionNode = node.querySelector('position');
        if (positionNode) {
            const x = parseFloat(positionNode.getAttribute('x'));
            const y = parseFloat(positionNode.getAttribute('y'));
            const z = parseFloat(positionNode.getAttribute('z'));
            data.x = x;
            data.y = y;
            data.z = z;
        }

        // <viz:shape value="disc"/>
        const shapeNode = node.querySelector('shape');
        if (shapeNode) {
            const shape = shapeNode.getAttribute('value');
            data.shape = shape;
        }

        // <viz:color r="239" g="173" b="66" a="0.6"/>
        const colorNode = node.querySelector('color');
        if (colorNode) {
            const r = colorNode.getAttribute('r');
            const g = colorNode.getAttribute('g');
            const b = colorNode.getAttribute('b');
            const a = colorNode.getAttribute('a');
            if (a) {
                data.color = `rgba(${r},${g},${b},${a})`;
            } else {
                data.color = `rgb(${r},${g},${b})`;
            }
        }

        const element = makeElement(data, node);
        cells.push(element);
    });

    edges.forEach(function(edge) {

        const data = {
            source: edge.getAttribute('source'),
            target: edge.getAttribute('target')
        };

        const link = makeLink(data, edge);
        cells.unshift(link);
    });

    return cells;
};
