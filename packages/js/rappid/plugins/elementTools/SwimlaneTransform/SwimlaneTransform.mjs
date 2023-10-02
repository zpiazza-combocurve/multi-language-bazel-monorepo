import { g, util } from 'jointjs/src/core.mjs';
import { RotatedRect } from './RotatedRect.mjs';
import { TransformHandle } from './TransformHandle.mjs';
import { ToolView } from 'jointjs/src/dia/ToolView.mjs';

const HandleSides = {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left'
};

const HandleAxes = {
    X: 'x',
    Y: 'y'
}

export const SwimlaneTransform = ToolView.extend({
    name: 'swimlane-transform',
    options: {
        laneId: undefined,
        minSize: 30,
        padding: 10,
        stopPropagation: true,
        constraintsPadding: 10,
        handleClass: TransformHandle,
        minSizeConstraints: undefined,
        maxSizeConstraints: undefined
    },
    handles: null,
    minConstraintPoints: null,
    maxConstraintPoints: null,

    initialize: function() {
        const options = this.options;

        if (options.minSizeConstraints === undefined) {
            options.minSizeConstraints = (poolModel, laneId, handleSide) => this.getMinConstraintsToEmbeds(poolModel, laneId, handleSide);
        }
        if (options.maxSizeConstraints === undefined) {
            options.maxSizeConstraints = (poolModel, laneId, handleSide) => this.getMaxConstraintsToEmbeds(poolModel, laneId, handleSide);
        }
    },

    update: function() {
        this.render();
        return this;
    },

    onRender: function() {
        this.removeHandles();
        if (this.doesLaneExist()) {
            this.renderHandles();
        }
        return this;
    },

    onRemove: function() {
        this.removeHandles();
    },

    doesLaneExist: function() {
        return this.relatedView.model.getLaneBBox(this.options.laneId) !== null;
    },

    removeHandles: function() {
        const temp = this.handles;
        this.handles = [];
        this.stopListening();

        if (!Array.isArray(temp)) return;

        for (let i = 0; i < temp.length; i++) {
            temp[i].remove();
        }
    },

    renderHandles: function() {
        const handlesPositionInfo = this.getHandlesPositionInfo();

        handlesPositionInfo.forEach(handleInfo => {
            const handle = this.renderHandle(handleInfo);
            this.simulateRelatedView(handle.el);
            this.handles.push(handle);
        })
    },

    getHandlesPositionInfo: function() {
        const { options, relatedView } = this;
        const laneId = options.laneId;
        const model = relatedView.model;
        const shapeAngle = model.angle();
        const shapeBBoxCenter = model.getBBox().center();
        const laneBBox = this.getHandlesBoundaryBBox(model, laneId, options.padding);

        return [
            { position: laneBBox.topMiddle().rotate(shapeBBoxCenter, -shapeAngle), axis: HandleAxes.Y, side: HandleSides.Top },
            { position: laneBBox.leftMiddle().rotate(shapeBBoxCenter, -shapeAngle), axis: HandleAxes.X, side: HandleSides.Left },
            { position: laneBBox.rightMiddle().rotate(shapeBBoxCenter, -shapeAngle), axis: HandleAxes.X, side: HandleSides.Right },
            { position: laneBBox.bottomMiddle().rotate(shapeBBoxCenter, -shapeAngle), axis: HandleAxes.Y, side: HandleSides.Bottom }
        ];
    },

    getHandlesBoundaryBBox: function(model, laneId, padding) {
        const { left, top, right, bottom } = util.normalizeSides(padding);
        const bbox = model.getLaneBBox(laneId).moveAndExpand({
            x: -left,
            y: -top,
            width: left + right,
            height: top + bottom
        });

        if (bbox.width < 0) bbox.width = 0;
        if (bbox.height < 0) bbox.height = 0;

        return bbox;
    },

    renderHandle: function(handleOptions) {
        const handle = new this.options.handleClass({
            paper: this.paper,
            axis: handleOptions.axis,
            side: handleOptions.side,
            guard: evt => this.guard(evt)
        });

        handle.render();
        handle.vel.appendTo(this.el);

        this.updateHandlePosition(handle, handleOptions.position);
        this.startHandleListening(handle);

        return handle;
    },

    updateHandlePosition: function(handle, handlePosition) {
        let angle = this.relatedView.model.angle();
        if (handle.options.axis === HandleAxes.X) {
            angle += 90;
        }
        handle.position(handlePosition.x, handlePosition.y, angle);
    },

    startHandleListening: function(handle) {
        this.listenTo(handle, 'change:start', this.onHandleChangeStart);
        this.listenTo(handle, 'changing', this.onHandleChanging);
        this.listenTo(handle, 'change:end', this.onHandleChangeEnd);
    },

    onHandleChangeStart: function(selectedHandle, evt) {
        const selectedHandleSide = selectedHandle.options.side;
        const { options, handles, relatedView } = this;
        const { model, paper } = relatedView;

        if (!Array.isArray(handles)) {
            return;
        }
        this.hideNonSelectedHandles(handles, selectedHandle);
        this.updateConstraintPoints(selectedHandleSide);
        this.focus();

        model.startBatch('lane-resize', { ui: true, tool: this.cid });

        if (!options.stopPropagation) {
            relatedView.notifyPointerdown(...paper.getPointerArgs(evt));
        }
    },

    hideNonSelectedHandles: function(allHandles, selectedHandle) {
        allHandles.forEach(handle => (handle === selectedHandle) ? handle.show() : handle.hide());
    },

    updateConstraintPoints: function(selectedHandleSide) {
        const { relatedView, options } = this;
        const laneId = options.laneId;
        const poolModel = relatedView.model;
        const minSizeConstraintsFn = options.minSizeConstraints;
        const maxSizeConstraintsFn = options.maxSizeConstraints;

        let minConstraints;
        let maxConstraints;

        if (util.isFunction(minSizeConstraintsFn)) {
            minConstraints = minSizeConstraintsFn(poolModel, laneId, selectedHandleSide);
        }
        if (util.isFunction(maxSizeConstraintsFn)) {
            maxConstraints = maxSizeConstraintsFn(poolModel, laneId, selectedHandleSide);
        }

        this.minConstraintPoints = Array.isArray(minConstraints) ? minConstraints.map(p => new g.Point(p)) : [];
        this.maxConstraintPoints = Array.isArray(maxConstraints) ? maxConstraints.map(p => new g.Point(p)) : [];
    },

    onHandleChanging: function(selectedHandle, evt) {
        const { options, relatedView } = this;
        const { model, paper } = relatedView;
        const { laneId, stopPropagation } = options;

        const shapeBBox = model.getBBox();
        const shapeAngle = model.angle();
        const shapeBBoxCenter = shapeBBox.center();

        const handleOptions = selectedHandle.options;
        const handleAxis = handleOptions.axis;
        const handleSide = handleOptions.side;
        const newHandlePosition = this.getHandlesPositionInfo().find(position => position.side === handleSide).position;

        const normalizedEvent = util.normalizeEvent(evt);
        const cursorPosition = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
        const cursorPositionUnrotated = cursorPosition.clone().rotate(shapeBBoxCenter, shapeAngle).round();
        const newHandlePositionUnrotated = newHandlePosition.clone().rotate(shapeBBoxCenter, shapeAngle).round();

        const diff = cursorPositionUnrotated.difference(newHandlePositionUnrotated);
        const isVerticalDiffNotZero = diff.y !== 0;
        const isHorizontalDiffNotZero = diff.x !== 0;

        if (handleAxis === HandleAxes.Y && isVerticalDiffNotZero) {
            const correctedDiff = (handleSide === HandleSides.Top) ? -diff.y : diff.y;
            this.updateLaneHeight(laneId, correctedDiff, handleSide, shapeBBox, shapeAngle);
        } else if (handleAxis === HandleAxes.X && isHorizontalDiffNotZero) {
            const correctedDiff = (handleSide === HandleSides.Left) ? -diff.x : diff.x;
            this.updateLaneWidth(laneId, correctedDiff, model, handleSide, shapeBBox, shapeAngle);
        }

        this.updateHandlePosition(selectedHandle, newHandlePosition);

        if (!stopPropagation) {
            relatedView.notifyPointermove(normalizedEvent, cursorPosition.x, cursorPosition.y);
        }
    },

    onHandleChangeEnd: function(_, evt) {
        const { options, relatedView } = this;
        const { paper, model } = relatedView;
        const normalizedEvent = util.normalizeEvent(evt);
        const { x: cursorXPos, y: cursorYPos } = paper.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);

        this.render();
        this.blur();

        model.stopBatch('lane-resize', { ui: true, tool: this.cid });

        if (!options.stopPropagation) {
            relatedView.notifyPointerup(normalizedEvent, cursorXPos, cursorYPos);
        }
        relatedView.checkMouseleave(normalizedEvent);
    },

    updateLaneHeight: function(laneId, diff, handleSide, shapeBBox, shapeAngle) {
        const model = this.relatedView.model;
        const metrics = model.metrics.lanes;
        const lanesCopy = util.cloneDeep(model.prop('lanes'));

        const neighbours = this.getNeighbourLanesIds(metrics, laneId, handleSide);
        const currentLane = this.getSublanesAndMostEmbeddedLaneId(metrics, laneId, handleSide);

        const isLaneFirstOrLastInShape = neighbours.foundNeighbourLaneId === undefined;
        const resizedNegativelyLaneIds = [neighbours.foundNeighbourLaneId, ...neighbours.sublaneIds];
        const resizedLaneIds = [laneId, ...currentLane.sublaneIds, ...neighbours.laneIdsPathToNeighbour];

        diff = this.getDiffWithinConstraints(laneId, diff, handleSide, shapeBBox.center(), shapeAngle);
        diff = this.getDiffWithinLaneSizeLimits(model, diff, currentLane.mostEmbeddedLaneId, neighbours.mostEmbeddedLaneId);

        resizedLaneIds.forEach(id => this.addSizeToLane(model, lanesCopy, id, diff));

        if (isLaneFirstOrLastInShape) {
            this.resizeShape(model, shapeBBox.width, shapeBBox.height + diff, handleSide);
        } else {
            resizedNegativelyLaneIds.forEach(id => this.addSizeToLane(model, lanesCopy, id, -diff));
        }
        model.prop('lanes', lanesCopy, { ui: true, tool: this.cid, autoResize: false });
    },

    getSublanesAndMostEmbeddedLaneId: function(metrics, laneId, handleSide) {
        const sublaneIds = this.getIdsOfClosestSublanesToTheSide(metrics, laneId, handleSide);
        const mostEmbeddedLaneId = sublaneIds[0] || laneId;
        return { sublaneIds, mostEmbeddedLaneId };
    },

    getOppositeHandleSide: function(handleSide) {
        switch (handleSide) {
            case HandleSides.Top:
                return HandleSides.Bottom
            case HandleSides.Right:
                return HandleSides.Left;
            case HandleSides.Bottom:
                return HandleSides.Top;
            case HandleSides.Left:
                return HandleSides.Right;
        }
    },

    getNeighbourLanesIds: function(metrics, originLaneId, handleSide) {
        const oppositeHandleSide = this.getOppositeHandleSide(handleSide);
        const { foundNeighbourLaneId, laneIdsPathToNeighbour } = this.findNeighbourLane(metrics, originLaneId, handleSide);
        const sublaneIds = this.getIdsOfClosestSublanesToTheSide(metrics, foundNeighbourLaneId, oppositeHandleSide);
        const mostEmbeddedLaneId = sublaneIds[0] || foundNeighbourLaneId;

        return { foundNeighbourLaneId, laneIdsPathToNeighbour, sublaneIds, mostEmbeddedLaneId };
    },

    addSizeToLane: function(model, lanesCopy, laneId, diff) {
        const laneSize = this.getLaneBBoxHeight(model, laneId);
        const newLaneSize = laneSize + diff;
        const path = model.getLanePath(laneId);
        path.push('size');
        util.setByPath({ lanes: lanesCopy }, path, newLaneSize);
    },

    updateLaneWidth: function(laneId, diff, model, handleSide, shapeBBox, shapeAngle) {
        diff = this.getDiffWithinConstraints(laneId, diff, handleSide, shapeBBox.center(), shapeAngle);
        const minimalPoolWidth = model.getMinimalSize().width;
        const newWidth = Math.max(shapeBBox.width + diff, minimalPoolWidth);
        this.resizeShape(model, newWidth, shapeBBox.height, handleSide);
    },

    resizeShape: function(model, newWidth, newHeight, direction) {
        model.resize(newWidth, newHeight, { ui: true, tool: this.cid, direction });
    },

    getLaneBBoxHeight: function(model, laneId) {
        return model.getLaneBBox(laneId).height;
    },

    getDiffWithinLaneSizeLimits: function(model, diff, embedLaneId, neighbourEmbedLaneId) {
        const resizeDirectionSign = Math.sign(diff);
        const hasNeighbour = neighbourEmbedLaneId !== undefined;
        const currentLaneSize = this.getLaneBBoxHeight(model, embedLaneId);
        const neighbourLaneSize = hasNeighbour ? this.getLaneBBoxHeight(model, neighbourEmbedLaneId) : Infinity;

        const laneNewSize = currentLaneSize + diff;
        const neighbourLaneNewSize = neighbourLaneSize - diff;

        const minSize = this.getMinSize();

        if (laneNewSize < minSize) {
            diff = (currentLaneSize - minSize) * resizeDirectionSign;
        } else if (neighbourLaneNewSize < minSize) {
            diff = (neighbourLaneSize - minSize) * resizeDirectionSign;
        }
        return Math.round(diff);
    },

    getMinSize: function() {
        let minSize = this.options.minSize;
        const constraintVerticalPadding = this.options.constraintsPadding * 2;

        if (constraintVerticalPadding > minSize) {
            minSize = constraintVerticalPadding;
        }
        return minSize;
    },

    getDiffWithinConstraints: function(laneId, diff, handleSide, shapeBBoxCenter, shapeAngle) {
        const model = this.relatedView.model;
        const laneBBox = model.getLaneBBox(laneId);
        const constraintPadding = this.getConstraintPaddingRelativeToHandleSide(diff);
        const poolLane = RotatedRect.inflatedOnSide(laneBBox, shapeBBoxCenter, shapeAngle, constraintPadding, handleSide);
        const poolLaneResized = RotatedRect.inflatedOnSide(laneBBox, shapeBBoxCenter, shapeAngle, diff + constraintPadding, handleSide);

        const maxPointsInsideLane = this.getMaxConstraintPointsInsideLane(poolLaneResized);
        const minPointsOutsideLane = this.getMinConstraintPointsOutsideLane(poolLaneResized, handleSide);

        if (maxPointsInsideLane.length > 0) {
            const closestPoint = poolLane.findClosestPointToLine(maxPointsInsideLane, handleSide);
            diff = poolLane.getDistanceFromLineToPoint(closestPoint, handleSide);
        } else if (minPointsOutsideLane.length > 0) {
            const furthestPoint = poolLane.findFurthestPointFromLine(minPointsOutsideLane, handleSide);
            diff = poolLane.getDistanceFromLineToPoint(furthestPoint, handleSide);
        }

        return diff;
    },

    getConstraintPaddingRelativeToHandleSide: function(diff) {
        const sign = diff < 0 ? -1 : 1;
        return this.options.constraintsPadding * sign;
    },

    getMaxConstraintPointsInsideLane: function(poolLane) {
        return this.maxConstraintPoints.filter(p => poolLane.isPointInside(p));
    },

    getMinConstraintPointsOutsideLane: function(poolLane, lineSide) {
        return this.minConstraintPoints.filter(p => {
            const isPointOutsideLine = poolLane.isPointToTheRightOfLine(p, lineSide);
            const isPointOnLine = poolLane.isPointOnLine(p, lineSide);
            return isPointOutsideLine || isPointOnLine;
        });
    },

    findNeighbourLane: function(metrics, originLaneId, side) {
        const idsPathToNeighbourLane = [];
        const findTopNeighbour = side === HandleSides.Top;

        let foundNeighbourLaneId = undefined;
        let tempLaneId = originLaneId;

        while (tempLaneId) {
            const laneMetrics = metrics[tempLaneId];
            const laneParentId = laneMetrics.parentId;
            const laneIndex = laneMetrics.laneIndexWithinGroup;
            const isNeighbourOutsideCurrentParent = findTopNeighbour ? (laneIndex === 0) : (laneIndex === laneMetrics.parentSublanesCount - 1);

            if (isNeighbourOutsideCurrentParent) {
                if (laneParentId) {
                    idsPathToNeighbourLane.unshift(laneParentId);
                }
                tempLaneId = laneParentId;
            } else {
                const neighbourIndex = findTopNeighbour ? (laneIndex - 1) : (laneIndex + 1);
                foundNeighbourLaneId = this.getSublaneIdOfParent(metrics, laneParentId, neighbourIndex);
                break;
            }
        }

        return {
            foundNeighbourLaneId: foundNeighbourLaneId,
            laneIdsPathToNeighbour: idsPathToNeighbourLane
        };
    },

    getSublaneIdOfParent: function(metrics, parentLaneId, sublaneIndex) {
        const allLaneIds = Object.keys(metrics);

        return allLaneIds.find(laneId => {
            const laneMetrics = metrics[laneId];
            const parentMatch = laneMetrics.parentId === parentLaneId;
            const indexMatch = laneMetrics.laneIndexWithinGroup === sublaneIndex;
            return parentMatch && indexMatch;
        });
    },

    getIdsOfClosestSublanesToTheSide: function(metrics, parentLaneId, side) {
        const pathToSublane = [];
        let tempSublaneId = parentLaneId;

        while (tempSublaneId) {
            const sublaneMetrics = metrics[tempSublaneId];
            const parentSublanesCount = sublaneMetrics.sublanesCount;
            const sublaneSearchIndex = (side === HandleSides.Top) ? 0 : (parentSublanesCount - 1);
            const sublaneId = `${tempSublaneId}_${sublaneSearchIndex}`;

            const sublaneExists = metrics[sublaneId] !== undefined;

            if (sublaneExists) {
                pathToSublane.unshift(sublaneId);
                tempSublaneId = sublaneId;
            } else {
                tempSublaneId = undefined;
            }
        }
        return pathToSublane;
    },


    /*
     * Default constraints functions
     */

    getMinConstraintsToEmbeds: function(model, laneId, handleSide) {
        const laneEmbedsPoints = [];
        const shapeBBox = model.getBBox();
        const shapeBBoxCenter = shapeBBox.center();
        const angle = model.angle();
        const laneBBox = model.getLaneBBox(laneId);
        const poolLane = new RotatedRect(laneBBox, shapeBBoxCenter, angle);
        const allEmbedCells = model.getEmbeddedCells({ deep: true });
        const isHandleSideHorizontal = (handleSide === HandleSides.Left) || (handleSide === HandleSides.Right);

        const embedPoints = this.getEmbedPointsInsideLane(poolLane, allEmbedCells, handleSide);
        embedPoints.forEach(p => laneEmbedsPoints.push(p));

        if (isHandleSideHorizontal && allEmbedCells.length > 0) {
            const { leftMostPoint, rightMostPoint } = this.findLeftMostAndRightMostEmbedPoints(model, poolLane, allEmbedCells);
            laneEmbedsPoints.push(leftMostPoint);
            laneEmbedsPoints.push(rightMostPoint);
        }

        return laneEmbedsPoints;
    },

    getMaxConstraintsToEmbeds: function(model, laneId, handleSide) {
        const laneEmbedsPoints = [];
        const angle = model.angle();
        const metrics = model.metrics.lanes;
        const shapeBBoxCenter = model.getBBox().center();
        const allEmbedCells = model.getEmbeddedCells({ deep: true });

        const topNeighbourLaneId = this.findNeighbourLane(metrics, laneId, HandleSides.Top).foundNeighbourLaneId;
        const bottomNeighbourLaneId = this.findNeighbourLane(metrics, laneId, HandleSides.Bottom).foundNeighbourLaneId;

        if (topNeighbourLaneId !== undefined) {
            const topNeighbourBBox = model.getLaneBBox(topNeighbourLaneId);
            const poolLane = new RotatedRect(topNeighbourBBox, shapeBBoxCenter, angle);
            const embedPoints = this.getEmbedPointsInsideLane(poolLane, allEmbedCells, handleSide, { addOverflowingEmbedsOnlyOnHandleSide: true });
            embedPoints.forEach(p => laneEmbedsPoints.push(p));
        }

        if (bottomNeighbourLaneId !== undefined) {
            const bottomNeighbourBBox = model.getLaneBBox(bottomNeighbourLaneId);
            const poolLane = new RotatedRect(bottomNeighbourBBox, shapeBBoxCenter, angle);
            const embedPoints = this.getEmbedPointsInsideLane(poolLane, allEmbedCells, handleSide, { addOverflowingEmbedsOnlyOnHandleSide: true });
            embedPoints.forEach(p => laneEmbedsPoints.push(p));
        }

        return laneEmbedsPoints;
    },

    getEmbedPointsInsideLane: function(poolLane, embedBBoxes, handleSide, opt) {
        const result = [];

        embedBBoxes.forEach(cell => {
            const angle = cell.angle();
            const cellBBox = cell.getBBox();
            const bboxCenter = cellBBox.center();

            if (!cell.isLink()) {
                const cellCorners = this.getBBoxCornerPoints(cellBBox, bboxCenter, angle);
                const isShapeInsideLane = this.isElementInsideLane(poolLane, cellCorners, bboxCenter, handleSide, opt);
                if (isShapeInsideLane) {
                    cellCorners.forEach(point => result.push(point));
                }
            }
        });

        return result;
    },

    isElementInsideLane: function(poolLane, cellCorners, bboxCenter, handleSide, opt = {}) {
        const addOverflowsOnHandleSide = opt.addOverflowingEmbedsOnlyOnHandleSide;
        const isCenterInsideLane = poolLane.isPointInsideOrOnLine(bboxCenter);

        if (addOverflowsOnHandleSide) {
            const oppositeLineSide = this.getOppositeHandleSide(handleSide);
            const areAllCornersInside = cellCorners.every(p => poolLane.isPointInsideOrOnLine(p));
            let isOverflowOnHandleSide;

            const areSomePointsInside = cellCorners.some(corner => {
                const isInsideLine = poolLane.isPointToTheLeftOfLine(corner, oppositeLineSide);
                const isOnLine = poolLane.isPointOnLine(corner, oppositeLineSide);
                return isInsideLine || isOnLine;
            });
            const areSomePointsOutside = cellCorners.some(corner => poolLane.isPointToTheRightOfLine(corner, oppositeLineSide));

            isOverflowOnHandleSide = areSomePointsInside && areSomePointsOutside;
            return isCenterInsideLane && (areAllCornersInside || isOverflowOnHandleSide);
        }

        return isCenterInsideLane;
    },

    getBBoxCornerPoints: function(bbox, center, angle) {
        const topLeft = bbox.topLeft().rotate(center, -angle).round();
        const topRight = bbox.topRight().rotate(center, -angle).round();
        const bottomLeft = bbox.bottomLeft().rotate(center, -angle).round();
        const bottomRight = bbox.bottomRight().rotate(center, -angle).round();

        return [topLeft, topRight, bottomLeft, bottomRight];
    },

    findLeftMostAndRightMostEmbedPoints: function(model, poolLane, allEmbedCells) {
        const angle = model.angle();
        const shapeBBox = model.getBBox();
        const shapeBBoxCenter = shapeBBox.center();
        const shapeRotatedRect = new RotatedRect(shapeBBox, shapeBBoxCenter, angle);
        const allPoints = [];

        allEmbedCells.forEach(cell => {
            if (!cell.isLink()) {
                const cellBBox = cell.getBBox();
                const bboxCenter = cellBBox.center();
                const cellAngle = cell.angle();
                this.getBBoxCornerPoints(cellBBox, bboxCenter, cellAngle).forEach(p => allPoints.push(p));
            }
        });
        const leftPoint = shapeRotatedRect.findFurthestPointFromLine(allPoints, HandleSides.Left);
        const leftMostPoint = this.getLeftMostPointCorrectedToPoolHeaders(model, leftPoint, shapeRotatedRect.left, poolLane.left);
        const rightMostPoint = shapeRotatedRect.findFurthestPointFromLine(allPoints, HandleSides.Right);

        return { leftMostPoint, rightMostPoint };
    },

    getLeftMostPointCorrectedToPoolHeaders: function(model, leftPoint, shapeLeftLine, laneLeftLine) {
        const labelsWidth = this.getTotalLaneHeadersWidth(model);
        const shapeLeftPadding = model.metrics.padding.left;

        const laneOffsetFromLeft = laneLeftLine.pointOffset(shapeLeftLine.start) - shapeLeftPadding - labelsWidth;
        const closestPointInShapeLine = shapeLeftLine.closestPoint(leftPoint);
        const perpendicularLineToPoint = new g.Line(closestPointInShapeLine, leftPoint);
        const offsettedLineLength = perpendicularLineToPoint.length() + laneOffsetFromLeft;

        perpendicularLineToPoint.setLength(offsettedLineLength);

        return perpendicularLineToPoint.end;
    },

    getTotalLaneHeadersWidth: function(model) {
        const allLaneMetrics = model.metrics.lanes;
        let laneHeadersWidth = 0;

        Object.keys(allLaneMetrics).forEach(laneId => {
            let tempLaneId = laneId;
            let tempHeadersWidth = 0;

            while (tempLaneId) {
                const laneMetrics = model.metrics.lanes[tempLaneId];
                tempHeadersWidth += laneMetrics.headerSize || 0;
                tempLaneId = laneMetrics.parentId;
            }
            laneHeadersWidth = tempHeadersWidth > laneHeadersWidth ? tempHeadersWidth : laneHeadersWidth;
        });

        return laneHeadersWidth;
    }
}, {
    TransformHandle: TransformHandle
});
