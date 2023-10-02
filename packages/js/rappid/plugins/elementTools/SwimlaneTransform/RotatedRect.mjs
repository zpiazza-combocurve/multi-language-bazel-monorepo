import { g } from 'jointjs/src/core.mjs';

export const RotatedRect = function(bbox, centerOriginPoint, angle) {

    this.top = bbox.topLine().rotate(centerOriginPoint, -angle);
    this.left = bbox.leftLine().rotate(centerOriginPoint, -angle);
    this.right = bbox.rightLine().rotate(centerOriginPoint, -angle);
    this.bottom = bbox.bottomLine().rotate(centerOriginPoint, -angle);
};

RotatedRect.inflatedOnSide = function(bbox, centerOriginPoint, angle, inflateValue, inflateSide) {

    const rotatedRect = new RotatedRect(bbox, centerOriginPoint, angle);
    const line = rotatedRect.getLine(inflateSide);

    switch (inflateSide) {
        case 'top':
        case 'right':
            rotatedRect[inflateSide] = line.parallel(-inflateValue);
            break;
        case 'bottom':
        case 'left':
            rotatedRect[inflateSide] = line.parallel(inflateValue);
            break;
    }

    return rotatedRect;
}

RotatedRect.prototype = {

    getLine: function(lineSide) {
        switch (lineSide) {
            case 'top':
                return this.top;
            case 'right':
                return this.right;
            case 'bottom':
                return this.bottom;
            case 'left':
                return this.left;
        }
    },

    isPointOnLine: function(point, lineSide) {
        const pointDistanceFromLine = Math.round(this.getLine(lineSide).closestPoint(point).distance(point));
        return pointDistanceFromLine === 0;
    },

    isPointToTheLeftOfLine: function(point, lineSide) {
        const pointDistanceFromLine = Math.round(this.getLine(lineSide).pointOffset(point));

        switch (lineSide) {
            case 'top':
            case 'right':
                return pointDistanceFromLine > 0;
            case 'bottom':
            case 'left':
                return pointDistanceFromLine < 0;
        }
    },

    isPointToTheRightOfLine: function(point, lineSide) {
        const pointDistanceFromLine = Math.round(this.getLine(lineSide).pointOffset(point));

        switch (lineSide) {
            case 'top':
            case 'right':
                return pointDistanceFromLine < 0;
            case 'bottom':
            case 'left':
                return pointDistanceFromLine > 0;
        }
    },

    isPointInside: function(point) {
        let isBellowTopLine = this.isPointToTheLeftOfLine(point, 'top');
        let isToTheLeftOfRightLine = this.isPointToTheLeftOfLine(point, 'right');
        let isAboveBottomLine = this.isPointToTheLeftOfLine(point, 'bottom');
        let isToTheRightOfLeftLine = this.isPointToTheLeftOfLine(point, 'left');

        return isToTheRightOfLeftLine && isBellowTopLine && isToTheLeftOfRightLine && isAboveBottomLine;
    },

    isPointInsideOrOnLine: function(point) {
        const isInsideRect = this.isPointInside(point);

        const isOnTopLine = this.isPointOnLine(point, 'top');
        const isOnRightLine = this.isPointOnLine(point, 'right');
        const isOnBottomLine = this.isPointOnLine(point, 'bottom');
        const isOnLeftLine = this.isPointOnLine(point, 'left');

        return isInsideRect || isOnTopLine || isOnRightLine || isOnBottomLine || isOnLeftLine;
    },

    findClosestPointToLine: function(points, lineSide) {
        const closestPoint = new g.Point();
        let tempDistance = Infinity;

        points.forEach(p => {
            const distance = this.getDistanceFromLineToPoint(p, lineSide);

            if (distance < tempDistance) {
                closestPoint.update(p.x, p.y);
                tempDistance = distance;
            }
        });
        return closestPoint;
    },

    findFurthestPointFromLine: function(points, lineSide) {
        const furthestPoint = new g.Point();
        let tempDistance = -Infinity;

        points.forEach(p => {
            const distance = this.getDistanceFromLineToPoint(p, lineSide);

            if (distance > tempDistance) {
                furthestPoint.update(p.x, p.y);
                tempDistance = distance;
            }
        });
        return furthestPoint;
    },

    getDistanceFromLineToPoint: function(point, lineSide) {
        const line = this.getLine(lineSide);
        const sign = this.isPointToTheRightOfLine(point, lineSide) ? 1 : -1;
        const offset = Math.abs(line.pointOffset(point)) * sign;
        return Math.round(offset);
    }
}
