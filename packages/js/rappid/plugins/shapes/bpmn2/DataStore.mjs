import { V, dia, util } from 'jointjs/src/core.mjs';

var CYLINDER_TILT = 10;

export const DataStore = dia.Element.define('bpmn2.DataStore', {
    size: { width: 63, height: 63 },
    attrs: {
        root: {
            magnetSelector: 'body',
            highlighterSelector: 'body'
        },
        body: {
            lateralArea: CYLINDER_TILT,
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 2
        },
        top: {
            refCx: '50%',
            cy: CYLINDER_TILT,
            refRx: '50%',
            ry: CYLINDER_TILT,
            fill: '#FFFFFF',
            stroke: '#333333',
            strokeWidth: 2
        },
        label: {
            textVerticalAnchor: 'top',
            textAnchor: 'middle',
            refX: '50%',
            refY: '100%',
            refY2: CYLINDER_TILT,
            fontSize: 12,
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            fill: '#333333',
            textWrap: {
                width: '200%'
            }
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'body'
    }, {
        tagName: 'ellipse',
        selector: 'top'
    }, {
        tagName: 'text',
        selector: 'label'
    }],

    topRy: function(t, opt) {
        // getter
        if (t === undefined) return this.attr('body/lateralArea');

        // setter
        var isPercentageSetter = util.isPercentage(t);

        var bodyAttrs = { lateralArea: t };
        var labelAttrs = { refY2: t };
        var topAttrs = isPercentageSetter
            ? { refCy: t, refRy: t, cy: null, ry: null }
            : { refCy: null, refRy: null, cy: t, ry: t };

        return this.attr({ body: bodyAttrs, top: topAttrs, label: labelAttrs }, opt);
    }

}, {
    attributes: {
        lateralArea: {
            set: function(t, refBBox) {
                var isPercentageSetter = util.isPercentage(t);
                if (isPercentageSetter) t = parseFloat(t) / 100;

                var x = refBBox.x;
                var y = refBBox.y;
                var w = refBBox.width;
                var h = refBBox.height;

                // curve control point variables
                var rx = w / 2;
                var ry = isPercentageSetter ? (h * t) : t;

                var kappa = V.KAPPA;
                var cx = kappa * rx;
                var cy = kappa * (isPercentageSetter ? (h * t) : t);

                // shape variables
                var xLeft = x;
                var xCenter = x + (w / 2);
                var xRight = x + w;

                var ySideTop = y + ry;
                var yCurveTop = ySideTop - ry;
                var ySideBottom = y + h - ry;
                var yCurveBottom = y + h;

                // return calculated shape
                var data = [
                    'M', xLeft, ySideTop,
                    'L', xLeft, ySideBottom,
                    'C', x, (ySideBottom + cy), (xCenter - cx), yCurveBottom, xCenter, yCurveBottom,
                    'C', (xCenter + cx), yCurveBottom, xRight, (ySideBottom + cy), xRight, ySideBottom,
                    'L', xRight, ySideTop,
                    'C', xRight, (ySideTop - cy), (xCenter + cx), yCurveTop, xCenter, yCurveTop,
                    'C', (xCenter - cx), yCurveTop, xLeft, (ySideTop - cy), xLeft, ySideTop,
                    'Z'
                ];

                const gap = 7;

                let ySide = ySideTop + gap;
                let yCurve = ySideTop + ry + gap;

                data.push(
                    'M', xRight, ySide,
                    'C', xRight, (ySide + cy), (xCenter + cx), yCurve, xCenter, yCurve,
                    'C', (xCenter - cx), yCurve, xLeft, (ySide + cy), xLeft, ySide
                );

                ySide += gap;
                yCurve += gap;

                data.push(
                    'L', xLeft, ySide,
                    'C', xLeft, (ySide + cy), (xCenter - cx), yCurve, xCenter, yCurve,
                    'C', (xCenter + cx), yCurve, xRight, (ySide + cy), xRight, ySide,
                    'Z'
                );

                return { d: data.join(' ') };
            }
        }
    }
});

