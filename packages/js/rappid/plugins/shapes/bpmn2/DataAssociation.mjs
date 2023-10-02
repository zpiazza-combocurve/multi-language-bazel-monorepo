import { dia } from 'jointjs/src/core.mjs';
import { defaultLabel } from './labels.mjs';

export const DataAssociation = dia.Link.define('bpmn2.DataAssociation', {
    attrs: {
        line: {
            connection: true,
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            strokeDasharray: '2,5',
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -7 0 0 10 7',
                'stroke-width': 2,
                'fill': 'none'
            }
        },
        wrapper: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        }
    }
}, {
    defaultLabel,
    markup: [{
        tagName: 'path',
        selector: 'wrapper',
        attributes: {
            'fill': 'none',
            'cursor': 'pointer',
            'stroke': 'transparent',
            'stroke-linecap': 'round'
        }
    }, {
        tagName: 'path',
        selector: 'line',
        attributes: {
            'fill': 'none',
            'pointer-events': 'none'
        }
    }]
});
