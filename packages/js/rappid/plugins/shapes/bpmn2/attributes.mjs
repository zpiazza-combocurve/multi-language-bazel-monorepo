import { g, V, util } from 'jointjs/src/core.mjs';
import $ from 'jquery';

export function borderSetAttributeWrapper(convertFn) {
    return function(type, refBBox, _node, attrs) {
        const gap = 3;
        switch (type) {
            case 'double': {
                const innerRefBBox = refBBox.clone().inflate(-gap);
                const { fill = 'none' } = attrs;
                return {
                    'd': `${convertFn(refBBox, attrs, 0)} ${convertFn(innerRefBBox, attrs, gap)}`,
                    'fill': fill,
                };
            }
            case 'thick': {
                const innerRefBBox = refBBox.clone().inflate(-gap);
                const { stroke = 'black' } = attrs;
                return {
                    'd': `${convertFn(refBBox, attrs, 0)} ${convertFn(innerRefBBox, attrs, gap)}`,
                    'fill': stroke
                };
            }
            default:
            case 'single': {
                return {
                    'd': convertFn(refBBox, attrs, 0),
                    'fill': 'none'
                };
            }
        }
    };
}

export function borderStyleSetAttribute(style, refBBox, _node, attrs) {
    let dasharray;
    switch (style) {
        case 'dashed': {
            const { width, height } = refBBox;
            const dash = Math.floor(Math.min(width, height) / 20);
            dasharray = `${dash * 4},${dash}`;
            break;
        }
        case 'dotted': {
            const strokeWidth = attrs['strokeWidth'] || attrs['stroke-width'];
            dasharray = `${strokeWidth},${strokeWidth * 2}`;
            break;
        }
        default:
        case 'solid': {
            dasharray = 'none';
            break;
        }
    }
    return { 'stroke-dasharray': dasharray };
}

// Single Icon

export function getIconAttributes(type, attrs, iconsSet = {}) {
    let xlinkHref;
    const icon = iconsSet[type];
    if (typeof icon === 'string') {
        const { iconColor = 'black' } = attrs;
        const svgString = icon.replace(/\${color}/g, iconColor);
        xlinkHref =  `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    } else {
        xlinkHref = null;
    }
    return {
        'xlink:href': xlinkHref,
        'data-icon-type': type
    }
}

export function iconSetAttributeWrapper(iconSetName) {
    return function iconSetAttribute(type, _refBBox, _node, attrs) {
        return getIconAttributes(type, attrs, this.model.constructor[iconSetName]);
    };
}

// Set Of Icons

export const IconsFlows = {
    row: 'row',
    column: 'column'
};

export const IconsOrigins = {
    topLeft: 'left-top',
    bottomLeft: 'left-bottom',
    topRight: 'right-top',
    bottomRight: 'right-bottom',
    topMiddle: 'top',
    bottomMiddle: 'bottom',
    rightMiddle: 'right',
    leftMiddle: 'left',
    center: 'center'
};

const IconsOriginsFunctions = Object.keys(IconsOrigins).reduce((names, fn) => {
    names[IconsOrigins[fn]] = fn;
    return names;
}, {});

export function iconsSetAttributeWrapper(iconSetName) {
    return function(icons, _refBBox, node, attrs) {
        const $node = $(node);
        const cacheName = 'joint-icons';
        const cache = $node.data(cacheName.toString());
        const {
            iconColor = '#333333',
            iconSize = 30,
            iconsFlow = IconsFlows.row
        } = attrs;
        const iconsHash = `${icons.toString()} ${iconColor} ${iconSize} ${iconsFlow}`;
        if (cache !== iconsHash) {
            const group = V(node);
            group.empty();
            const isColumnFlow = iconsFlow === IconsFlows.column;
            if (!Array.isArray(icons)) return;
            const images = icons.map((name, index) => {
                const icon = V('image');
                icon.attr(getIconAttributes(name, attrs, this.model.constructor[iconSetName]));
                let x, y;
                if (isColumnFlow) {
                    x = 0;
                    y = index * iconSize;
                } else {
                    x = index * iconSize;
                    y = 0;
                }
                icon.attr({
                    'x': x,
                    'y': y,
                    'width': iconSize,
                    'height': iconSize
                });
                return icon;
            })
            group.append(images);
        }
        $node.data(cacheName, iconsHash);
    }
}

export function iconsPositionAttribute(icons, _refBBox, _node, attrs) {
    const {
        iconSize = 30,
        iconsFlow = IconsFlows.row,
        iconsOrigin = IconsOrigins.topLeft
    } = attrs;
    let width, height;
    const iconsCount = Array.isArray(icons) ? icons.length : 0;
    if (iconsFlow === IconsFlows.column) {
        width = iconSize;
        height = iconsCount * iconSize;
    } else {
        width = iconsCount * iconSize;
        height = iconSize;
    }
    const iconsBBox = new g.Rect(0, 0, -width, -height);
    if (iconsOrigin in IconsOriginsFunctions) {
        return iconsBBox[IconsOriginsFunctions[iconsOrigin]]()
    }
    return iconsBBox.center();
}

// Pool label alignments

export function labelTextWrap(elementView, opt, node, attrs, width, height, text) {
    const attrsCopy = util.clone(attrs);
    const { left, right, top, bottom } = util.normalizeSides(attrs.labelMargin);
    const alignment = LabelAlignmentAnchors[attrs.labelAlignment];

    const bbox = new g.Rect(left, top, width - left - right, height - top - bottom);

    if (alignment) {
        attrsCopy.textAnchor = alignment['text-anchor'];
        attrsCopy.textVerticalAnchor = alignment['text-vertical-anchor'];
    }

    let textAttribute;
    let textValue;

    if (opt.textWrap) {
        textAttribute = 'textWrap';
        textValue = {
            text: text,
            ellipsis: opt.ellipsis,
        }
    } else {
        textAttribute = 'text';
        textValue = text;
    }

    elementView.getAttributeDefinition(textAttribute).set.call(elementView, textValue, bbox, node, attrsCopy);

    return alignment;
}

export const LabelAlignments = util.clone(IconsOrigins);

const LabelAlignmentAnchors = {
    'left-top': { 'text-anchor': 'start', 'text-vertical-anchor': 'top' },
    'left-bottom': { 'text-anchor': 'start', 'text-vertical-anchor': 'bottom' },
    'right-top': { 'text-anchor': 'end', 'text-vertical-anchor': 'top' },
    'right-bottom': { 'text-anchor': 'end', 'text-vertical-anchor': 'bottom' },
    'top': { 'text-anchor': 'middle', 'text-vertical-anchor': 'top' },
    'bottom': { 'text-anchor': 'middle', 'text-vertical-anchor': 'bottom' },
    'right': { 'text-anchor': 'end', 'text-vertical-anchor': 'middle' },
    'left': { 'text-anchor': 'start', 'text-vertical-anchor': 'middle' },
    'center': { 'text-anchor': 'middle', 'text-vertical-anchor': 'middle' }
}
