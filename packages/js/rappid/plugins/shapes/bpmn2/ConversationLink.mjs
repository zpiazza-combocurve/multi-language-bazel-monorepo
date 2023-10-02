import { dia } from 'jointjs/src/core.mjs';
import { defaultLabel } from './labels.mjs';

export const ConversationLink = dia.Link.define('bpmn2.ConversationLink', {
    attrs: {
        line: {
            connection: true,
            stroke: '#FFFFFF',
            strokeWidth: 2,
            strokeLinejoin: 'round'
        },
        outline: {
            connection: true,
            stroke: '#333333',
            strokeWidth: 6,
            strokeLinejoin: 'round'
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
        selector: 'outline',
        attributes: {
            'fill': 'none',
            'pointer-events': 'none'
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
