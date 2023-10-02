import { g, dia } from 'jointjs/src/core.mjs';

const { Link: BaseLink, attributes } = dia;

const zeroVector = new g.Point(1, 0);

export const Distance = BaseLink.define('measurement.Distance', {
    attrs: {
        line: {
            connection : true,
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'stroke-width': 2,
                'd': 'M 0 10 0 -10 M 10 10 0 0 10 -10',
                'fill': 'none'
            },
            sourceMarker: {
                'type': 'path',
                'stroke-width': 2,
                'd': 'M 0 10 0 -10 M 10 10 0 0 10 -10',
                'fill': 'none'
            }
        },
        wrapper: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        },
        anchorLines: {
            stroke: '#333333',
            strokeWidth: 1,
            strokeDasharray: '1,2'
        },
        sourceAnchorLine: {
            dAnchor: 'source'
        },
        targetAnchorLine: {
            dAnchor: 'target'
        },
        distanceLabel: {
            distanceText: {
                unit: 'px',
                fixed: 0
            },
            fontFamily: 'sans-serif',
            fontWeight: 'lighter',
            fontSize: 14,
            labelPosition: {
                ratio: 0.5,
                offset: 12
            },
            textAnchor: 'middle',
            textVerticalAnchor: 'middle'
        }
    }
}, {
    markup: [{
        tagName: 'path',
        selector: 'sourceAnchorLine',
        groupSelector: 'anchorLines'
    }, {
        tagName: 'path',
        selector: 'targetAnchorLine',
        groupSelector: 'anchorLines'
    }, {
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
    }, {
        tagName: 'text',
        selector: 'distanceLabel'
    }],

    getDistanceText: function(view, opt = {}) {
        const { fixed = 0, unit = '' } = opt;
        const length = view.getConnectionLength().toFixed(fixed);
        if (!unit) return `${length}`;
        return `${length} ${unit}`;
    }
}, {
    attributes: {
        distanceText: {
            set: function(opt, ...args) {
                attributes.text.set.call(this, this.model.getDistanceText(this, opt), ...args);
            }
        },
        dAnchor: {
            set: function(end) {
                const line = new g.Line(
                    this.getEndAnchor(end),
                    this.getEndConnectionPoint(end)
                );
                return { d: `M ${line.serialize()}` };
            }
        },
        labelPosition: {
            set: function(value) {
                const { ratio = 0.5, offset = 0 } = value;
                let p, angle;
                const tangent = this.getTangentAtRatio(ratio);
                if (tangent) {
                    angle = tangent.vector().vectorAngle(zeroVector);
                    p = tangent.start;
                } else {
                    p = this.path.start;
                    angle = 0;
                }
                let transform;
                let y = offset;
                if (angle === 0) {
                    transform = `translate(${p.x},${p.y})`;
                } else {
                    const legibleAngle = g.normalizeAngle(((angle + 90) % 180) - 90);
                    if (angle !== legibleAngle) y = -offset;
                    transform = `translate(${p.x},${p.y}) rotate(${legibleAngle})`;
                }
                return { transform, y };
            }
        }
    }
});

const AngleStarts = {
    self: 'self',
    source: 'source',
    target: 'target'
};

const AngleDirections = {
    clockwise: 'clockwise',
    anticlockwise: 'anticlockwise',
    small: 'small',
    large: 'large'
};


export const Angle = BaseLink.define('measurement.Angle', {
    attrs: {
        // Connection
        line: {
            connection : true,
            stroke: '#333333',
            strokeWidth: 2,
            strokeLinejoin: 'round',
        },
        wrapper: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        },
        // Angles
        angles: {
            stroke: '#333333',
            fill: 'none',
            strokeWidth: 1,
            angleRadius: 40,
        },
        sourceAngle: {
            angleD: 'source'
        },
        targetAngle: {
            angleD: 'target'
        },
        // Angle Labels
        angleLabels: {
            textAnchor: 'middle',
            textVerticalAnchor: 'middle',
            fill: '#333333',
            fontSize: 11,
            fontFamily: 'sans-serif',
            angleTextDecimalPoints: 0,
            angleTextDistance: 23
        },
        sourceAngleLabel: {
            angleText: 'source',
            angleTextPosition: 'source',
        },
        targetAngleLabel: {
            angleText: 'target',
            angleTextPosition: 'target'
        }
    }
}, {
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
    }, {
        tagName: 'path',
        selector: 'sourceAngle',
        groupSelector: 'angles',
        attributes: {
            'cursor': 'pointer'
        }
    }, {
        tagName: 'path',
        selector: 'targetAngle',
        groupSelector: 'angles',
        attributes: {
            'cursor': 'pointer'
        }
    }, {
        tagName: 'text',
        selector: 'sourceAngleLabel',
        groupSelector: 'angleLabels'
    }, {
        tagName: 'text',
        selector: 'targetAngleLabel',
        groupSelector: 'angleLabels'
    }],

    getAngleText: function(opt = {}) {
        const { angle = 0, decimalPoints = 2 } = opt;
        return `${angle.toFixed(decimalPoints)}°`;
    }

}, {
    AngleStarts,
    AngleDirections,
    attributes: {
        angleD: {
            set: function(end, _refBBox, _node, attrs) {
                const {
                    angleRadius = 40,
                    angleStart = AngleStarts.self,
                    anglePie = false,
                    angleDirection = AngleDirections.small,
                    angle
                } = attrs;
                const data = getAngleData(this, end, { angle, angleRadius, angleStart, angleDirection });
                if (!data) return { d: 'M 0 0 0 0' };
                const { connectionPoint, linkArcPoint, otherArcPoint, arcAngle, largeArcFlag, sweepFlag } = data;
                const d = [
                    `M ${linkArcPoint.serialize()}`,
                    `A ${angleRadius} ${angleRadius} ${arcAngle} ${largeArcFlag} ${sweepFlag} ${otherArcPoint.serialize()}`
                ];
                if (anglePie) {
                    d.push(`L ${connectionPoint.serialize()} Z`);
                }
                return { d: d.join(' ') };
            }
        },
        angleText: {
            set: function(end, refBBox, node, attrs) {
                let text = '';
                // TODO: should not pass here constant radius
                // it should be the same radius as for angleD
                const data = getAngleData(this, end, { angleRadius: 40 });
                if (data) {
                    text = this.model.getAngleText({
                        angle: data.angleBetween,
                        decimalPoints: attrs.angleTextDecimalPoints
                    });
                }
                attributes.text.set.call(this, text, refBBox, node, attrs);
            }
        },
        angleTextPosition: {
            set: function(end, _refBBox, _node, attrs) {
                const { angleTextDistance: r = 60 } = attrs;
                const data = getAngleData(this, end, { angleRadius: r });
                if (!data) return {}; // TODO
                const {
                    connectionPoint,
                    otherArcPoint,
                    linkArcPoint,
                    angleBetween,
                    largeArcFlag
                } = data;
                let refLine;
                if (Math.abs(angleBetween - 180) < 1e-6) {
                    const refPoint = linkArcPoint.clone().rotate(connectionPoint, largeArcFlag ? 90 : -90);
                    refLine = new g.Line(connectionPoint, refPoint).setLength(r);
                } else {
                    const refPoint = (new g.Line(linkArcPoint, otherArcPoint)).midpoint();
                    refLine = new g.Line(connectionPoint, refPoint).setLength(r);
                    if (largeArcFlag) refLine.scale(-1, -1, refLine.start);
                }
                const position = refLine.end;
                // Ensure Legibility
                const angle = g.normalizeAngle(((refLine.angle() + 90) % 180) - 90);
                return { transform: `translate(${position.serialize()}) rotate(${angle})` }
            }
        },
        // Options - prevent them to be set as attributes on the node
        angle: {},
        angleRadius: {},
        angleTextDistance: {},
        angleTextDecimalPoints: {},
        anglePie: {},
        angleStart: {},
        angleDirection: {}
    }
});


function getAngleData(linkView, end, opt) {
    let data;
    const CACHE_KEY = 'angleData';
    const cache = linkView.nodeCache(linkView.el);
    if (CACHE_KEY in cache) {
        if (end in cache[CACHE_KEY]) return cache[CACHE_KEY][end];
    } else {
        cache[CACHE_KEY] = {};
    }
    const constantAngle = (typeof opt.angle === 'number');
    const endView = linkView.getEndView(end);
    // Assert: link is connected to a cell and it's not const angle
    if (!endView && !constantAngle) return null;
    const isAtTarget = (end === 'target');
    const tangent = linkView.getTangentAtRatio(isAtTarget ? 1 : 0);
    // Assert: link is differentiable
    if (!tangent) return null;
    if (isAtTarget) tangent.scale(-1, -1, tangent.start);
    if (constantAngle) {
        data = getManualAngleData(tangent, opt);
    } else if (endView.model.isLink()) {
        data = getLinkAngleData(tangent, endView, opt)
    } else {
        const endMagnet = linkView.getEndMagnet(end);
        data = getElementAngleData(tangent, endView, endMagnet, opt)
    }
    cache.angleData[end] = data;
    return data;
}

function getManualAngleData(tangent, { angle, angleRadius }) {
    const otherTangent = tangent.clone().rotate(tangent.start, -angle);
    return getTangentsAngleData(tangent, otherTangent, {
        angleRadius,
        angleStart: AngleStarts.target,
        angleDirection: angle < 0 ? AngleDirections.clockwise : AngleDirections.anticlockwise
    });
}

function getLinkAngleData(tangent, linkView, opt) {
    const length = linkView.getClosestPointLength(tangent.start);
    const otherTangent = linkView.getTangentAtLength(length);
    return getTangentsAngleData(tangent, otherTangent, opt);
}

function getTangentsAngleData(tangent, otherTangent, { angleRadius: r, angleStart, angleDirection }) {
    const { start: connectionPoint, end: linkArcPoint } = tangent.setLength(r);
    const arcAngle = tangent.angle();
    let { end: otherArcPoint } = otherTangent.setLength(r);
    let angleBetween = connectionPoint.angleBetween(linkArcPoint, otherArcPoint);
    let sweepFlag = 1;
    let largeArcFlag = 0;
    let swapArcPoint = false;
    let swapAngle = false;
    let limitAngle = true;
    const quadrant = Math.floor(angleBetween / 90);
    switch (angleStart) {
        // Angle starts at a point on the other link towards the target
        case AngleStarts.target: {
            if (angleDirection === AngleDirections.small) {
                angleDirection = angleBetween < 180 ? AngleDirections.clockwise : AngleDirections.anticlockwise;
            } else if (angleDirection === AngleDirections.large) {
                angleDirection = angleBetween > 180 ? AngleDirections.clockwise : AngleDirections.anticlockwise;
            }
            switch (angleDirection) {
                case AngleDirections.anticlockwise: {
                    if (angleBetween > 0 && angleBetween < 180) largeArcFlag ^= 1;
                    swapAngle = true;
                    break;
                }
                default:
                case AngleDirections.clockwise: {
                    if (angleBetween >= 180) largeArcFlag ^= 1;
                    sweepFlag ^= 1;
                    break;
                }
            }
            limitAngle = false;
            break;
        }
        // Angle starts at a point on the other link towards the source
        case AngleStarts.source: {
            if (angleDirection === AngleDirections.small) {
                angleDirection = angleBetween > 180 ? AngleDirections.clockwise : AngleDirections.anticlockwise;
            } else if (angleDirection === AngleDirections.large) {
                angleDirection = angleBetween < 180 ? AngleDirections.clockwise : AngleDirections.anticlockwise;
            }
            switch (angleDirection) {
                case AngleDirections.anticlockwise: {
                    if (angleBetween > 180) largeArcFlag ^= 1;
                    sweepFlag = 1;
                    swapAngle = true;
                    break;
                }
                default:
                case AngleDirections.clockwise: {
                    if (angleBetween < 180) largeArcFlag ^= 1;
                    sweepFlag = 0;
                    break;
                }
            }
            limitAngle = false;
            swapArcPoint = true;
            angleBetween = g.normalizeAngle(angleBetween + 180);
            break;
        }
        // Angle starts at a point on this link
        default:
        case AngleStarts.self: {
            switch (angleDirection) {
                case AngleDirections.anticlockwise: {
                    swapArcPoint = (quadrant === 0 || quadrant === 1);
                    sweepFlag = 1;
                    swapAngle = true;
                    break;
                }
                case AngleDirections.clockwise: {
                    swapArcPoint = (quadrant === 2 || quadrant === 3);
                    sweepFlag = 0;
                    swapAngle = false;
                    break;
                }
                case AngleDirections.small: {
                    swapArcPoint = (quadrant === 1 || quadrant === 2);
                    sweepFlag = (quadrant === 0 || quadrant === 2) ? 0 : 1;
                    swapAngle = (quadrant === 1 || quadrant === 3);
                    break;
                }
                case AngleDirections.large: {
                    swapArcPoint = (quadrant === 0 || quadrant === 3);
                    sweepFlag = (quadrant === 1 || quadrant === 3) ? 0 : 1;
                    swapAngle = (quadrant === 0 || quadrant === 2);
                    break;
                }
            }
            break;
        }
    }
    if (swapArcPoint) {
        otherArcPoint = otherArcPoint.reflection(connectionPoint);
    }
    if (limitAngle && angleBetween >= 180) {
        angleBetween = g.normalizeAngle(angleBetween - 180);
    }
    if (swapAngle) {
        angleBetween = g.normalizeAngle((limitAngle ? 180 : 360) - angleBetween);
    }
    // debug(linkView.paper, { point: otherArcPoint });
    return {
        angleBetween,
        connectionPoint,
        linkArcPoint,
        otherArcPoint,
        largeArcFlag,
        sweepFlag,
        arcAngle
    };
}

function getElementAngleData(tangent, elementView, magnet, { angleRadius: r, angleDirection }) {

    const { model } = elementView;
    const modelBBox = model.getBBox();
    const modelAngle = model.angle();
    const modelCenter = modelBBox.center();
    const localMagnetBBox = elementView.getNodeUnrotatedBBox(magnet);
    const { end: linkRefPoint } = tangent.clone().setLength(1);
    const localLinkRefPoint = linkRefPoint.rotate(modelCenter, modelAngle);
    // debug(elementView.paper, { rect: localMagnetBBox, point: localLinkRefPoint });
    // Assert: the angle does not go through the element
    if (localMagnetBBox.containsPoint(localLinkRefPoint)) return null;
    let offsetX = 0;
    let offsetY = 0;
    let arcAngle = tangent.angle() - modelAngle;
    if ((localLinkRefPoint.y > (localMagnetBBox.y + localMagnetBBox.height)) || (localLinkRefPoint.y < localMagnetBBox.y)) {
        arcAngle += 90;
        offsetX = r;
    } else {
        offsetY = r;
    }
    arcAngle = g.normalizeAngle(arcAngle);
    let sweepFlag;
    const quadrant = Math.floor(arcAngle / 90);
    switch (quadrant) {
        case 0: {
            sweepFlag = 1;
            break;
        }
        case 1: {
            sweepFlag = 0;
            break;
        }
        case 2: {
            offsetX *= -1;
            offsetY *= -1;
            sweepFlag = 1;
            break;
        }
        case 3: {
            offsetX *= -1;
            offsetY *= -1;
            sweepFlag = 0;
            break;
        }
    }
    let swapSide = false;
    switch (angleDirection) {
        case AngleDirections.large: swapSide = true; break;
        case AngleDirections.anticlockwise: swapSide = (quadrant === 0 || quadrant === 2); break;
        case AngleDirections.clockwise: swapSide = (quadrant === 1 || quadrant === 3); break;
        // case 'AngleDirections.small'
    }
    if (swapSide) {
        offsetX *= -1;
        offsetY *= -1;
        sweepFlag ^= 1;
    }
    const largeArcFlag = 0;
    const { start: connectionPoint, end: linkArcPoint } = tangent.setLength(r);
    const otherArcPoint = connectionPoint.clone().offset(offsetX, offsetY).rotate(connectionPoint, -modelAngle);
    let angleBetween = connectionPoint.angleBetween(linkArcPoint, otherArcPoint);
    if (angleBetween > 180) {
        angleBetween = 360 - angleBetween;
    }
    return {
        arcAngle,
        angleBetween,
        sweepFlag,
        largeArcFlag,
        otherArcPoint,
        linkArcPoint,
        connectionPoint
    }
}

/* DEBUG */

// const pointVel = V('circle', { 'fill': 'blue', 'r': 4 });
// const rectVel = V('rect', { 'stroke': 'green', 'fill': 'none', 'pointer-events': 'none' });

// function debug(paper, { rect, point }) {
//     const vel = V(paper.viewport);
//     if (rect) vel.append(rectVel.attr(rect.toJSON()));
//     if (point) vel.append(pointVel.attr({ cx: point.x, cy: point.y }));
// }
