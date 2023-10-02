import { V, linkTools } from 'jointjs/src/core.mjs';

export const TransformHandle = linkTools.Segments.SegmentHandle.extend({
    className: 'swimlane-transform-handle',
    children: [{
        tagName: 'rect',
        selector: 'handle',
        attributes: {
            'width': 20,
            'height': 8,
            'x': -10,
            'y': -4,
            'rx': 4,
            'ry': 4,
            'fill': '#3498db',
            'stroke': '#FFFFFF',
            'stroke-width': 2
        }
    }],

    position: function(x, y, angle) {
        const handle = this.childNodes.handle;
        const matrix = V.createSVGMatrix().translate(x, y).rotate(angle);
        handle.setAttribute('transform', V.matrixToTransformString(matrix));
        handle.setAttribute('cursor', (angle % 180 === 0) ? 'row-resize' : 'col-resize');
    }
});
