import { dia } from 'jointjs/src/core.mjs';

export const Group = dia.Element.define('bpmn2.Group', {
    size: { width: 120, height: 100 },
    attrs: {
        root: {
            magnetSelector: 'body',
            highlighterSelector: 'body'
        },
        body: {
            refWidth: '100%',
            refHeight: '100%',
            fill: 'transparent',
            rx: 10,
            ry: 10,
            stroke: '#333333',
            borderStyle: 'dashed',
            strokeWidth: 2,
            strokeLinecap: 'square',
            pointerEvents: 'none'
        },
        wrapper: {
            refX: 5,
            refY: 5,
            refWidth: -10,
            refHeight: -10,
            pointerEvents: 'stroke',
            strokeWidth: 10,
            stroke: 'transparent',
            fill: 'none'
        },
        label: {
            refY: 6,
            refX: '50%',
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            textWrap: {
                width: -12,
                height: -12,
                ellipsis: true
            }
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'rect',
        selector: 'wrapper'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
}, {
    attributes: {

        borderStyle: {
            set: function(lineStyle, refBBox, node, attrs) {
                var m = 2;
                var n = attrs['strokeWidth'] || attrs['stroke-width'] || 1;
                var dasharray = (m * n) + ',' + (m * n) + ',' + n / m;
                return { 'stroke-dasharray': dasharray };
            }
        }
    }
});

