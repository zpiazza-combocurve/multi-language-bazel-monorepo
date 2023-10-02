import { dia, V } from 'jointjs/src/core.mjs';
import { eventIcons } from './icons.mjs';
import { iconSetAttributeWrapper, borderSetAttributeWrapper, borderStyleSetAttribute } from './attributes.mjs';

export const Event = dia.Element.define('bpmn2.Event', {
    size: { width: 40, height: 40 },
    attrs: {
        root: {
            magnetSelector: 'background',
            highlighterSelector: 'background'
        },
        background: {
            refCx: '50%',
            refCy: '50%',
            refRx: '50%',
            refRy: '50%',
            fill: '#FFFFFF'
        },
        border: {
            stroke: '#333333',
            fillRule: 'evenodd',
            borderType: 'single',
            borderStyle: 'solid',
            strokeWidth: 2
        },
        icon: {
            iconColor: '#333333',
            iconType: 'none',
            refX: '15%',
            refY: '15%',
            refWidth: '70%',
            refHeight: '70%',
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
        tagName: 'ellipse',
        selector: 'background'
    }, {
        tagName: 'image',
        selector: 'icon'
    }, {
        tagName: 'path',
        selector: 'border'
    }, {
        tagName: 'text',
        selector: 'label'
    }]
}, {
    attributes: {
        borderType: {
            set: borderSetAttributeWrapper(rect => toEllipsePathData(rect))
            // TODO: rect => g.Ellipse.fromRect(rect).serialize()
        },
        borderStyle: {
            set: borderStyleSetAttribute
        },
        iconType: {
            set: iconSetAttributeWrapper('EVENT_ICONS')
        }
    },

    EVENT_ICONS: eventIcons
});

function toEllipsePathData(bbox) {
    const center = bbox.center();
    const ellipseVEl = V('ellipse', {
        'cx': center.x,
        'cy': center.y,
        'rx': bbox.width / 2,
        'ry': bbox.height / 2
    });
    return V.convertEllipseToPathData(ellipseVEl);
}
