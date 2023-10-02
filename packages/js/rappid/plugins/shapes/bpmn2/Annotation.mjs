import { dia } from 'jointjs/src/core.mjs';

export const Annotation = dia.Element.define('bpmn2.Annotation', {
    size: { width: 80, height: 40 },
    attrs: {
        root: {
            magnetSelector: 'body',
            highlighterSelector: 'body'
        },
        body: {
            refWidth: '100%',
            refHeight: '100%',
            fill: 'transparent',
        },
        border: {
            annotationD: {
                size: 10
            },
            fill: 'none',
            stroke: '#333333',
            strokeWidth: 2
        },
        label: {
            refY: 6,
            refX: 4,
            fontSize: 12,
            fontFamily: 'sans-serif',
            textWrap: {
                width: -12,
                height: -12,
                ellipsis: true,
            }
        }
    }
}, {
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }, {
        tagName: 'path',
        selector: 'border'
    },{
        tagName: 'text',
        selector: 'label'
    }]
}, {
    attributes: {
        annotationD: {
            set: function(attrs, refBBox) {
                const hook = attrs.size || 0;
                const side = attrs.side;

                const topLeft = refBBox.topLeft();
                const bottomLeft = refBBox.bottomLeft();
                const topRight = refBBox.topRight();
                const bottomRight = refBBox.bottomRight();

                switch (side) {
                    case 'top': {
                        const topLeftHook = topLeft.clone().offset(0, hook);
                        const topRightHook = topRight.clone().offset(0, hook);
                        const annotationD = `M ${topLeftHook.serialize()} ${topLeft.serialize()} ${topRight.serialize()} ${topRightHook.serialize()}`;
                        return { 'd': `${annotationD}` };
                    }

                    case 'right': {
                        const topRightHook = topRight.clone().offset(-hook, 0);
                        const bottomRightHook = bottomRight.clone().offset(-hook, 0);
                        const annotationD = `M ${topRightHook.serialize()} ${topRight.serialize()} ${bottomRight.serialize()} ${bottomRightHook.serialize()}`;
                        return { 'd': `${annotationD}` };
                    }

                    case 'bottom': {
                        const bottomLeftHook = bottomLeft.clone().offset(0, -hook);
                        const bottomRightHook = bottomRight.clone().offset(0, -hook);
                        const annotationD = `M ${bottomLeftHook.serialize()} ${bottomLeft.serialize()} ${bottomRight.serialize()} ${bottomRightHook.serialize()}`;
                        return { 'd': `${annotationD}` };
                    }

                    case 'left':
                    default: {
                        const topLeftHook = topLeft.clone().offset(hook, 0);
                        const bottomLeftHook = bottomLeft.clone().offset(hook, 0);
                        const annotationD = `M ${topLeftHook.serialize()} ${topLeft.serialize()} ${bottomLeft.serialize()} ${bottomLeftHook.serialize()}`;
                        return { 'd': `${annotationD}` };
                    }
                }
            }
        }
    }
});
