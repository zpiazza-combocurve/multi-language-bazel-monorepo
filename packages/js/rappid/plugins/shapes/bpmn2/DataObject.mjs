import { dia } from 'jointjs/src/core.mjs';
import { eventIcons } from './icons.mjs';
import { iconSetAttributeWrapper } from './attributes.mjs';

export const DataObject = dia.Element.define('bpmn2.DataObject', {
    size: { width: 48, height: 65 },
    attrs: {
        root: {
            magnetSelector: 'body',
            highlighterSelector: 'body'
        },
        body: {
            objectD: 10,
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 2
        },
        label: {
            refY: '100%',
            refY2: 10,
            refX: '50%',
            textVerticalAnchor: 'top',
            textAnchor: 'middle',
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            textWrap: {
                width: '200%'
            }
        },
        dataTypeIcon: {
            iconColor: '#333333',
            iconType: 'none',
            x: 0,
            y: 0,
            width: 25,
            height: 25,
        },
        collectionIcon: {
            iconColor: '#333333',
            collection: false,
            refX: '50%',
            refY: '100%',
            y: -16 - 2,
            x: -16 / 2 + 2,
            width: 16,
            height: 16,
        }
    },
}, {
    markup: [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'text',
        selector: 'label'
    }, {
        tagName: 'image',
        selector: 'dataTypeIcon'
    }, {
        tagName: 'image',
        selector: 'collectionIcon'
    }]
}, {
    attributes: {
        objectD: {
            set: function(value, refBBox) {
                const fold = value;
                const topLeft = refBBox.topLeft();
                const bottomLeft = refBBox.bottomLeft();
                const bottomRight = refBBox.bottomRight();
                const topRight = refBBox.topRight();
                const centerFold = topRight.clone().offset(-fold, fold);
                const bottomFold = topRight.clone().offset(0, fold);
                const leftFold = topRight.clone().offset(-fold, 0);
                const objectD = `M ${topLeft.serialize()} ${bottomLeft.serialize()} ${bottomRight.serialize()} ${bottomFold.serialize()} ${leftFold.serialize()} Z`;
                const foldD = `M ${leftFold.serialize()} ${centerFold.serialize()} ${bottomFold.serialize()}`;
                return { 'd': `${objectD} ${foldD}` };
            }
        },
        iconType: {
            set: iconSetAttributeWrapper('DATA_OBJECT_TYPE_ICONS')
        },
        collection: {
            set: iconSetAttributeWrapper('DATA_OBJECT_COLLECTION_ICONS')
        }
    },

    DATA_OBJECT_TYPE_ICONS: {
        'none': null,
        'input':  eventIcons['link1'],
        'output':  eventIcons['link2'],
    },

    DATA_OBJECT_COLLECTION_ICONS: {
        'false': null,
        'true': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-3 -3 16 16"><path fill="none" stroke="${color}" stroke-width="2" d="M0 0v10M3 0v10M6 0v10"/></svg>'
    }
});
