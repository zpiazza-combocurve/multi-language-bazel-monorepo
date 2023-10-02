import { dia } from 'jointjs/src/core.mjs';
import { gatewayIcons } from './icons.mjs';
import { iconSetAttributeWrapper } from './attributes.mjs';

export const Gateway = dia.Element.define('bpmn2.Gateway', {
    size: { width: 58, height: 58 },
    attrs: {
        root: {
            magnetSelector: 'body',
            highlighterSelector: 'body'
        },
        body: {
            refPoints: '1,0,2,1,1,2,0,1',
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 2
        },
        icon: {
            iconColor: '#333333',
            refX: '19%',
            refY: '19%',
            refWidth: '62%',
            refHeight: '62%'
        },
        label: {
            refDy: 10,
            refX: '50%',
            textVerticalAnchor: 'top',
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold'
        }
    }
}, {
    markup: [{
        tagName: 'polygon',
        selector: 'body'
    }, {
        tagName: 'image',
        selector: 'icon'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
}, {

    attributes: {
        iconType: {
            set: iconSetAttributeWrapper('GATEWAY_ICONS')
        }
    },

    GATEWAY_ICONS: gatewayIcons
});
