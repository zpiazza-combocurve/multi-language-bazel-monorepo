import $ from 'jquery';
import { V, g, util, mvc } from 'jointjs/src/core.mjs';

export const PathEditor = mvc.View.extend({

    tagName: 'g',

    svgElement: true,

    className: 'path-editor',

    events: {
        'mousedown .anchor-point': 'onAnchorPointPointerDown',
        'mousedown .control-point': 'onControlPointPointerDown',
        'mousedown .segment-path': 'onSegmentPathPointerDown',
        //'mousemove': 'onPointerMove', // only bound (while mousedown), see `documentEvents`
        //'mouseup': 'onPointerUp', // only bound (ends mousedown), see `documentEvents`
        'touchstart .anchor-point': 'onAnchorPointPointerDown',
        'touchstart .control-point': 'onControlPointPointerDown',
        'touchstart .segment-path': 'onSegmentPathPointerDown',
        //'touchmove': 'onPointerMove', // only bound (while touch), see `documentEvents`
        //'touchup': 'onPointerUp', // only bound (ends touch), see `documentEvents`
        //'touchcancel': 'onPointerUp', // only bound (ends touch), see `documentEvents`
        'dblclick .anchor-point': 'onAnchorPointDoubleClick',
        'dblclick .control-point': 'onControlPointDoubleClick',
        'dblclick .segment-path': 'onSegmentPathDoubleClick'
    },

    documentEvents: {
        'mousemove': 'onPointerMove',
        'touchmove': 'onPointerMove',
        'mouseup': 'onPointerUp',
        'touchend': 'onPointerUp',
        'touchcancel': 'onPointerUp',
    },

    options: {
        anchorPointMarkup: '<circle r="2.5"/>',
        controlPointMarkup: '<circle r="2.5"/>'
    },

    init: function() {

        const pathNode = this.pathNode = V(this.options.pathElement).normalizePath().node;

        this.path = g.Path.parse(this.options.pathElement.getAttribute('d'));

        //this.segList = pathNode.pathSegList;
        this.svgRoot = V(pathNode.ownerSVGElement);
        this.$document = $(pathNode.ownerDocument);

        this.render();
    },

    onRemove: function() {

        this.undelegateDocumentEvents();
        this.clear();
    },

    clear: function() {

        const { vel } = this;

        vel.empty();

        this.directionPaths = [];
        this.segmentPaths = [];
        this.segmentPathElements = [];
        this.controlPoints = [];
        this.anchorPoints = [];

        // first subPath always starts at index '0'
        this._subPathIndices = [0];

        this.trigger('clear', this.pathNode);
    },

    _transformPoint: function(x, y, matrix) {

        return V.transformPoint(new g.Point(x, y), matrix);
    },

    _getPathCTM: function() {

        return this.pathNode.getCTM();
    },

    render: function() {

        this.clear();

        const {
            path,
            vel,
            anchorPoints,
            controlPoints,
            directionPaths,
            segmentPaths,
            segmentPathElements
        } = this;

        const ctm = this._getPathCTM();

        const anchorTpl = V(this.options.anchorPointMarkup).addClass('anchor-point');
        const controlTpl = V(this.options.controlPointMarkup).addClass('control-point');
        const directionPathTpl = V('<path class="direction-path"/>');
        const segPathTpl = V('<path class="segment-path"/>');

        const _subPathIndices = this._subPathIndices;

        for (let index = 0, prevX = 0, prevY = 0; index < path.segments.length; index++) {

            const seg = path.getSegment(index);

            // convert to transformed coordinates to match how path is rendered on screen
            const segCoords = this._transformPoint(seg.end.x, seg.end.y, ctm);
            let x = segCoords.x;
            let y = segCoords.y;

            if (seg.type !== 'Z') {
                anchorPoints[index] = anchorTpl.clone().attr({
                    index: index,
                    cx: x,
                    cy: y
                });
            }

            if (seg.type !== 'M') {
                const segPath = new g.Path();
                segPath.appendSegment(new g.Path.createSegment('M', prevX, prevY));

                switch (seg.type) {
                    case 'Z':
                    {
                        const subPathStartSeg = path.getSegment(_subPathIndices[0]);

                        const subPathStartSegPoint = this._transformPoint(subPathStartSeg.end.x, subPathStartSeg.end.y, ctm);
                        x = subPathStartSegPoint.x;
                        y = subPathStartSegPoint.y;

                        segPath.appendSegment(new g.Path.createSegment('L', x, y));
                        _subPathIndices.unshift(index + 1);
                        break;
                    }

                    case 'L':
                    {
                        segPath.appendSegment(new g.Path.createSegment('L', x, y));
                        break;
                    }

                    case 'C':
                    {
                        const controlSegCoords1 = this._transformPoint(seg.controlPoint1.x, seg.controlPoint1.y, ctm);
                        const controlPoint1 = controlTpl.clone().attr({
                            index: index,
                            'attribute-index': 1,
                            cx: controlSegCoords1.x,
                            cy: controlSegCoords1.y
                        });

                        const controlSegCoords2 = this._transformPoint(seg.controlPoint2.x, seg.controlPoint2.y, ctm);
                        const controlPoint2 = controlTpl.clone().attr({
                            index: index,
                            'attribute-index': 2,
                            cx: controlSegCoords2.x,
                            cy: controlSegCoords2.y
                        });

                        controlPoints[index] = [controlPoint1, controlPoint2];

                        segPath.appendSegment(new g.Path.createSegment('C', controlSegCoords1.x, controlSegCoords1.y, controlSegCoords2.x, controlSegCoords2.y, x, y));

                        directionPaths[index] = [
                            directionPathTpl.clone().attr('d', ['M', prevX, prevY, 'L', controlSegCoords1.x, controlSegCoords1.y].join(' ')),
                            directionPathTpl.clone().attr('d', ['M', x, y, 'L', controlSegCoords2.x, controlSegCoords2.y].join(' '))
                        ];
                        break;
                    }
                }

                segmentPaths[index] = segPath;
                const segPathElement = segPathTpl.clone().attr('index', index).node;
                segPathElement.setAttribute('d', segPath.toString());
                segmentPathElements[index] = segPathElement;
            }

            prevX = x;
            prevY = y;
        }

        const elements = [];
        segmentPathElements.forEach(function(segment) {
            if (segment) elements.push(segment);
        });
        directionPaths.forEach(function(direction) {
            if (direction) Array.prototype.push.apply(elements, direction);
        })
        anchorPoints.forEach(function(anchor) {
            if (anchor) elements.push(anchor)
        });
        controlPoints.forEach(function(control) {
            if (control) Array.prototype.push.apply(elements, control);
        });

        vel.append(elements);

        this.svgRoot.append(vel);
    },

    startMoving: function(e) {

        const evt = util.normalizeEvent(e);

        const $point = this.$point = $(evt.target);

        this.prevClientX = evt.clientX;
        this.prevClientY = evt.clientY;

        const index = parseInt(this.$point.attr('index'), 10);

        // TODO major release: args should be = this.pathNode, evt
        this.trigger('path:interact');
        if ($point.hasClass('anchor-point')) {
            // TODO major release (breaking change): args should be = this.pathNode, evt, { index, segPoint }
            this.trigger('path:anchor-point:select', index);
            // first clickable anchor point is 0
        } else if ($point.hasClass('control-point')) {
            const controlPointIndex = parseInt(this.$point.attr('attribute-index'), 10);
            // TODO major release (breaking change): args should be = this.pathNode, evt, { index, controlPointIndex, segPoint }
            this.trigger('path:control-point:select', index, controlPointIndex);
            // the index refers to the index of the curveto segment this control point belongs to
            // curveto segment's control point 1 has index 1, control point 2 has index 2
            // first clickable control point is at 1, 1 (even though the point has a direction path connected to anchor point 0)
        } else {
            // TODO major release (breaking change): args should be = this.pathNode, evt, { index }
            this.trigger('path:segment:select', index);
            // first clickable segment is segment 1
            // segment 0 is the first M segment (which has no path)
        }

        evt.stopPropagation();
        evt.preventDefault();

        // clear values of movement variables
        this.index = undefined;
        this.controlPointIndex = undefined;
        this.segPoint = undefined;

        this.pathEditedEventType = undefined;
    },

    move: function(e) {

        const { $point } = this;

        if (!$point) return;

        // move anchor and control points
        const evt = util.normalizeEvent(e);
        const dx = evt.clientX - this.prevClientX;
        const dy = evt.clientY - this.prevClientY;

        const index = parseInt($point.attr('index'), 10);

        if ($point.hasClass('anchor-point')) {
            // move anchor point
            this.adjustAnchorPoint(index, dx, dy, evt);

        } else if ($point.hasClass('control-point')) {
            // move control point
            const controlPointIndex = parseInt($point.attr('attribute-index'), 10);
            this.adjustControlPoint(index, controlPointIndex, dx, dy, evt);

        } else {
            // move segment
            this.adjustSegment(index, dx, dy, evt);
        }

        // move the direction paths
        this.prevClientX = evt.clientX;
        this.prevClientY = evt.clientY;
    },

    // note that `evt` is normalized event
    adjustSegment: function(index, dx, dy, evt, { dry = undefined } = {}) {

        this.adjustAnchorPoint(index - 1, dx, dy, { dry: true });
        this.adjustAnchorPoint(index, dx, dy, { dry: true });

        if (!dry) {
            // preserve values of movement variables
            this.pathEditedEventType = 'path:segment:adjust';
            this.index = index;

            // trigger movement events
            this.trigger('path:editing', this.pathNode, evt);
            this.trigger('path:segment:adjusting', this.pathNode, evt, { index });
        }
    },

    // note that `evt` is normalized event
    adjustControlPoint: function(index, controlPointIndex, dx, dy, evt, { dry = undefined } = {}) {

        // get the path transformation matrix
        const ctm = this._getPathCTM();

        const { path, controlPoints } = this;

        // the raw path data is not transformed
        const seg = path.getSegment(index);

        // the client movement data is transformed because it comes from interaction events in a transformed viewport
        // convert to untransformed coordinates to match the path's underlying representation (untransformed)
        const inverseCTM = ctm.inverse();
        // translations are ignored since we are interested in differences in position
        inverseCTM.e = 0;
        inverseCTM.f = 0;
        const moveCoords = this._transformPoint(dx, dy, inverseCTM);
        const cp = 'controlPoint' + controlPointIndex;
        // apply untransformed client movement data to untransformed path data
        seg[cp].x += moveCoords.x;
        seg[cp].y += moveCoords.y;

        // convert to transformed coordinates to match how path is rendered on screen
        const controlSegCoords = this._transformPoint(seg[cp].x, seg[cp].y, ctm);
        const segPoint = new g.Point(controlSegCoords); // save a copy for later
        const controlPoint = controlPoints[index][controlPointIndex - 1].attr({
            cx: controlSegCoords.x,
            cy: controlSegCoords.y
        });

        if (controlPoint.hasClass('locked')) {
            // this control point is locked with another control point
            // we also need to modify the bound control point
            const boundIndex = this.getBoundIndex(index, controlPointIndex);
            const boundControlPointIndex = ((controlPointIndex === 1) ? 2 : 1);
            const bindSeg = path.getSegment(boundIndex);

            // recalculate bound point with untransformed coordinates
            const cpB = 'controlPoint' + boundControlPointIndex;
            const center = new g.Point(((controlPointIndex === 1) ? bindSeg.end.x : seg.end.x), ((controlPointIndex === 1) ? bindSeg.end.y : seg.end.y));
            const controlPos = new g.Point(seg[cp].x, seg[cp].y);
            const distance = center.distance(new g.Point(bindSeg[cpB].x, bindSeg[cpB].y));
            const bindControlPos = center.move(controlPos, distance);
            bindSeg[cpB].x = bindControlPos.x;
            bindSeg[cpB].y = bindControlPos.y;

            // convert to transformed coordinates
            const bindControlSegCoords = this._transformPoint(bindSeg[cpB].x, bindSeg[cpB].y, ctm);
            controlPoints[boundIndex][boundControlPointIndex - 1].attr({
                cx: bindControlSegCoords.x,
                cy: bindControlSegCoords.y
            });

            // update paths involving bound control point
            this.updateDirectionPaths(boundIndex);
            this.updateSegmentPath(boundIndex);
        }

        // update paths involving control point
        this.updateDirectionPaths(index);
        this.updateSegmentPath(index);

        if (!dry) {
            // preserve values of movement variables
            this.pathEditedEventType = 'path:control-point:adjust';
            this.index = index;
            this.controlPointIndex = controlPointIndex;
            this.segPoint = segPoint;

            // trigger movement events
            this.trigger('path:editing', this.pathNode, evt);
            this.trigger('path:control-point:adjusting', this.pathNode, evt, { index, controlPointIndex, segPoint });
        }
    },

    findSubpathIndex: function(index) {

        const indices = this._subPathIndices;
        for (let i = 0, n = indices.length; i < n; i++) {
            if (indices[i] < index) return indices[i];
        }
        return undefined;
    },

    findReversedSubpathIndex: function(index) {

        const indices = this._subPathIndices;
        for (let i = indices.length - 1; i >= 0; i--) {
            if (indices[i] > index) return indices[i];
        }
        return undefined;
    },

    // note that `evt` is normalized event
    adjustAnchorPoint: function(index, dx, dy, evt, { dry = undefined } = {}) {

        // get the path transformation matrix
        const ctm = this._getPathCTM();

        const { path, anchorPoints, controlPoints } = this;

        // the raw path data is not transformed
        let seg = path.getSegment(index);
        if (seg.type === 'Z') {
            index = this.findSubpathIndex(index);
            seg = path.getSegment(index);
        }

        // if we move either endpoint, control points across start anchor point must be unlocked
        const lastIndex = anchorPoints.length - 1;
        if ((index === 0 || index === lastIndex) && controlPoints[1] && controlPoints[lastIndex]) {
            const controlPoint1 = controlPoints[1][0];
            const controlPoint2 = controlPoints[lastIndex][1];

            if (controlPoint1 && controlPoint1.hasClass('locked')) controlPoint1.removeClass('locked');
            if (controlPoint2 && controlPoint2.hasClass('locked')) controlPoint2.removeClass('locked');
        }

        // the client movement data is transformed because it comes from interaction events in a transformed viewport
        // convert to untransformed coordinates to match the path's underlying representation (untransformed)
        const inverseCTM = ctm.inverse();
        // translations are ignored since we are interested in differences in position
        inverseCTM.e = 0;
        inverseCTM.f = 0;
        const moveCoords = this._transformPoint(dx, dy, inverseCTM);

        // apply untransformed client movement data to untransformed path data
        seg.end.x += moveCoords.x;
        seg.end.y += moveCoords.y;

        // convert to transformed coordinates to match how path is rendered on screen
        const segCoords = this._transformPoint(seg.end.x, seg.end.y, ctm);
        const segPoint = new g.Point(segCoords); // save a copy for later
        anchorPoints[index].attr({
            cx: segCoords.x,
            cy: segCoords.y
        });

        if (seg.type === 'C') {
            seg.controlPoint2.x += moveCoords.x;
            seg.controlPoint2.y += moveCoords.y;

            // convert to transformed coordinates
            const controlSegCoords = this._transformPoint(seg.controlPoint2.x, seg.controlPoint2.y, ctm);
            controlPoints[index][1].attr({
                cx: controlSegCoords.x,
                cy: controlSegCoords.y
            });
        }

        const nextSeg = ((index + 1) < path.segments.length) ? path.getSegment(index + 1) : 0;

        if (nextSeg) {
            if (nextSeg.type === 'C') {
                // apply untransformed client movement data to untransformed path data
                nextSeg.controlPoint1.x += moveCoords.x;
                nextSeg.controlPoint1.y += moveCoords.y;

                // convert to transformed coordinates
                const nextControlSegCoords = this._transformPoint(nextSeg.controlPoint1.x, nextSeg.controlPoint1.y, ctm);
                controlPoints[index + 1][0].attr({
                    cx: nextControlSegCoords.x,
                    cy: nextControlSegCoords.y
                });

                // update control paths involving next anchor point
                this.updateDirectionPaths(index + 1);
            }

            // update segment path involving next anchor point
            this.updateSegmentPath(index + 1);
        }

        // update paths involving this anchor point
        this.updateDirectionPaths(index);
        this.updateSegmentPath(index);

        if (!dry) {
            // preserve values of movement variables
            this.pathEditedEventType = 'path:anchor-point:adjust';
            this.index = index;
            this.segPoint = segPoint;

            // trigger movement events
            this.trigger('path:editing', this.pathNode, evt);
            this.trigger('path:anchor-point:adjusting', this.pathNode, evt, { index, segPoint });
        }
    },

    // updates paths from a given segment to control points
    updateDirectionPaths: function(index) {

        // get the path transformation matrix
        const ctm = this._getPathCTM();

        const { path } = this;

        // raw path data is unconverted
        // convert to transformed coordinates to match how path is rendered on screen
        const seg = path.getSegment(index);
        const segCoords = this._transformPoint(seg.end.x, seg.end.y, ctm);

        // make sure that previous segment exists
        const prevSeg = (index > 0) ? path.getSegment(index - 1) : null;
        const prevSegCoords = prevSeg ? this._transformPoint(prevSeg.end.x, prevSeg.end.y, ctm) : null;

        // for each direction path from this anchor point
        const directionPaths = this.directionPaths[index];
        if (!Array.isArray(directionPaths)) return;
        directionPaths.forEach(function(directionPath, i) {

            i++;

            const controlSegCoords = this._transformPoint(seg['controlPoint' + i].x, seg['controlPoint' + i].y, ctm);

            // update the path with transformed coordinates
            directionPath.attr('d', [
                'M',
                (i > 1 || !prevSeg) ? segCoords.x : prevSegCoords.x,
                (i > 1 || !prevSeg) ? segCoords.y : prevSegCoords.y,
                controlSegCoords.x,
                controlSegCoords.y
            ].join(' '));

        }, this);
    },

    // updates given path
    updateSegmentPath: function(index) {

        const { path, _subPathIndices } = this;

        if (_subPathIndices.includes(index)) {
            let segMaxIndex = this.findReversedSubpathIndex(index) || this.path.segments.length;

            segMaxIndex--;

            if (path.getSegment(segMaxIndex).type !== 'Z') return;

            index = segMaxIndex;
        }

        // first segment (index = 0) is always 'M' and such it has no segmentPath
        let segPath = this.segmentPaths[index];
        if (!segPath) return;

        // get the path transformation matrix
        const ctm = this._getPathCTM();

        // there is always a previous segment because we are skipping over the first segment
        // raw path data is untransformed
        // convert to transformed coordinates to match how path is rendered on screen
        const prevSeg = path.getSegment(index - 1);
        const prevSegCoords = this._transformPoint(prevSeg.end.x, prevSeg.end.y, ctm);
        // create the updated path
        segPath = new g.Path();
        let item = g.Path.createSegment('M', prevSegCoords.x, prevSegCoords.y);
        segPath.appendSegment(item);

        // transform path data to match path rendering
        const seg = path.getSegment(index);
        const segCoords = this._transformPoint(seg.end.x, seg.end.y, ctm);

        switch (seg.type) {
            case 'Z':
            {
                // transform path data to match path rendering
                const nextSeg = path.getSegment(this.findSubpathIndex(index));
                const nextSegCoords = this._transformPoint(nextSeg.end.x, nextSeg.end.y, ctm);
                item = g.Path.createSegment('L', nextSegCoords.x, nextSegCoords.y);
                break;
            }
            case 'L':
            {
                item = g.Path.createSegment('L', segCoords.x, segCoords.y);
                break;
            }
            case 'C':
            {
                // transform control point data to match path rendering
                const controlSegCoords1 = this._transformPoint(seg.controlPoint1.x, seg.controlPoint1.y, ctm);
                const controlSegCoords2 = this._transformPoint(seg.controlPoint2.x, seg.controlPoint2.y, ctm);
                item = g.Path.createSegment('C', controlSegCoords1.x, controlSegCoords1.y, controlSegCoords2.x, controlSegCoords2.y, segCoords.x, segCoords.y);
                break;
            }
        }

        segPath.appendSegment(item);

        this.segmentPaths[index] = segPath;
        const segPathElement = this.segmentPathElements[index];
        if (segPathElement) {
            segPathElement.setAttribute('d', segPath.toString());
        }
        this.pathNode.setAttribute('d', path.toString());
    },

    stopMoving: function(e) {

        const evt = util.normalizeEvent(e);

        this.$point = undefined;

        // trigger 'path:edit' events only if:
        // - an `adjust` method has been called at least once, and
        // - the `adjust` method has not been called as `dry`
        if (this.pathEditedEventType) {

            const { pathNode, index, controlPointIndex, segPoint } = this;

            this.trigger('path:edit', pathNode, evt);
            this.trigger(this.pathEditedEventType, pathNode, evt, { index, controlPointIndex, segPoint });
        }

        // clear values of movement variables
        this.index = undefined;
        this.controlPointIndex = undefined;
        this.segPoint = undefined;

        this.pathEditedEventType = undefined;
    },

    createAnchorPoint: function(e) {

        const evt = util.normalizeEvent(e);
        const index = V(evt.target).attr('index');

        const { pathNode, path } = this;

        const coords = V(pathNode).toLocalPoint(evt.pageX, evt.pageY);
        const seg = path.getSegment(index);

        switch (seg.type) {
            // we assume that it is not possible to trigger this function at moveto segment
            case 'Z':
            {
                const line = new g.Line(seg.start, seg.end);
                // divide `seg` into two lines at point closest to `coords` of user click
                const closestPoint = line.closestPoint(coords);
                // insert new line into `segList` with closestPoint's coordinates
                // the original closepath `seg` adjusts to come after this new segment
                path.insertSegment(index, g.Path.createSegment('L', closestPoint.x, closestPoint.y));
                break;
            }

            case 'L':
            {
                // option 2: we are dividing a lineto segment
                // create a g.Line from `seg`
                const line = new g.Line(seg.start, seg.end);
                // divide `seg` into two lines at point closest to `coords` of user click
                const closestPoint = line.closestPoint(coords);
                // insert new line into `segList` with closestPoint's coordinates
                // the original `seg` adjusts to come after this new segment
                path.insertSegment(index, g.Path.createSegment('L', closestPoint.x, closestPoint.y));
                break;
            }

            case 'C':
            {
                const curve = new g.Curve(seg.start, seg.controlPoint1, seg.controlPoint2, seg.end);
                const t = curve.closestPointT(coords);
                const segments = seg.divideAtT(t);
                // insert new curve into `segList` that looks like the first curve from division
                // - start = prevSeg's end (unchanged)
                // - controlPoint1 = first curve's controlPoint1
                // - controlPoint2 = first curve's controlPoint2
                // - end = first curve's end
                // (inserting before `seg`)
                path.insertSegment(index, segments[0]);
                // change the original `seg` to look like the second curve from division
                // - start = first curve's end (see above)
                // - controlPoint1 = second curve's controlPoint1
                // - controlPoint2 = second curve's controlPoint2
                // - end = seg's (unchanged)
                seg.controlPoint1.x = segments[1].controlPoint1.x;
                seg.controlPoint1.y = segments[1].controlPoint1.y;
                seg.controlPoint2.x = segments[1].controlPoint2.x;
                seg.controlPoint2.y = segments[1].controlPoint2.y;
                break;
            }
        }

        this.render();
        this.pathNode.setAttribute('d', path.toString());

        this.trigger('path:edit', pathNode, evt);
        this.trigger('path:anchor-point:create', pathNode, evt);
    },

    removeAnchorPoint: function(e) {

        const evt = util.normalizeEvent(e);
        const index = parseInt($(evt.target).attr('index'), 10);

        const { pathNode, path } = this;

        const seg = path.getSegment(index);

        let nextSeg;
        let replacingSeg;

        switch (seg.type) {
            case 'M':
                // replace following segment with a moveto segment
                // then delete this segment
                nextSeg = path.getSegment(index + 1);
                replacingSeg = g.Path.createSegment('M', nextSeg.end.x, nextSeg.end.y);
                path.replaceSegment(index + 1, replacingSeg);
                path.removeSegment(index);
                break;

            case 'L':
                // just remove this segment
                path.removeSegment(index);
                break;

            case 'C':
                // replace following curve's control point 1 with this curve's control point 1
                // if not followed by a curve, then discard the curve information
                // then delete this curveto segment
                if ((index + 1) <= (path.segments.length - 1)) {
                    nextSeg = path.getSegment(index + 1);
                    if (nextSeg.type === 'C') {
                        nextSeg.controlPoint1.x = seg.controlPoint1.x;
                        nextSeg.controlPoint1.y = seg.controlPoint1.y;
                    }
                }
                path.removeSegment(index);
                break;
        }

        this.render();
        this.pathNode.setAttribute('d', path.toString());

        this.trigger('path:edit', pathNode, evt);
        this.trigger('path:anchor-point:remove', pathNode, evt);

        let numAnchorPoints = path.segments.length;
        if (path.getSegment(path.segments.length - 1).type === 'Z') {
            numAnchorPoints -= 1;
        }

        if (numAnchorPoints < 2) {
            // the path has too few points to be seen
            this.trigger('path:invalid', pathNode, evt);
        }
    },

    lockControlPoint: function(e) {

        const evt = util.normalizeEvent(e);
        const evtTarget = $(evt.target);

        const index = parseInt(evtTarget.attr('index'));
        const controlPointIndex = parseInt(evtTarget.attr('attribute-index'), 10);

        const boundIndex = this.getBoundIndex(index, controlPointIndex);
        const boundControlPointIndex = ((controlPointIndex === 1) ? 2 : 1);
        const boundControlPoint = this.controlPoints[boundIndex];

        if (boundControlPoint) {
            const isLocked = evtTarget.hasClass('locked');

            evtTarget.toggleClass('locked');
            boundControlPoint[boundControlPointIndex - 1].toggleClass('locked');

            // TODO major release: args should be = this.pathNode, evt
            this.trigger('path:interact');
            if (!isLocked) {
                // TODO major release (breaking change): args should be = this.pathNode, evt, { index, controlPointIndex, segPoint }
                this.trigger('path:control-point:lock', index, controlPointIndex);
                // automatically adjust bound control point according to the clicked control point:
                this.adjustControlPoint(index, controlPointIndex, 0, 0, { dry: true });
                // TODO: the path changes because of the above action:
                // - question 1: should this trigger edit/editing events too?
                // - question 2: should the 'path:control-point:lock' opt object contain information about the changed control point?
                // - OR: should we trigger an extra 'path:control-point:locked' event with information about the changed control point?
            } else {
                // TODO major release (breaking change): args should be = this.pathNode, evt, { index, controlPointIndex, segPoint }
                this.trigger('path:control-point:unlock', index, controlPointIndex);
            }
        }
    },

    getBoundIndex: function(index, controlPointIndex) {

        let boundIndex;

        const { path, anchorPoints } = this;

        let lastSegIndex;
        let lastSegType;
        let closepathPresent;

        let lastIndex = anchorPoints.length - 1;
        let endpointsIdenticalX;
        let endpointsIdenticalY;

        if (controlPointIndex === 1) {
            boundIndex = index - 1;

            if (boundIndex === 0) {
                // if we are trying to wrap past the start element:
                lastSegIndex = path.segments.length - 1;
                lastSegType = path.getSegment(lastSegIndex).type;
                closepathPresent = (lastSegType === 'Z');

                endpointsIdenticalX = anchorPoints[0].attr('cx') === anchorPoints[lastIndex].attr('cx');
                endpointsIdenticalY = anchorPoints[0].attr('cy') === anchorPoints[lastIndex].attr('cy');

                if (closepathPresent && endpointsIdenticalX && endpointsIdenticalY) {
                    // there is a closepath segment between the start element and the last element AND
                    // the start element and the last element have the same coordinates
                    // (that is, the two curves look like any other curve join in the path)
                    boundIndex = lastIndex; // wrap to the last element
                }
                // else: leave the index at 0 (no control points correspond to the index)
            }

        } else {
            boundIndex = index + 1;

            if (boundIndex === (lastIndex + 1)) {
                // if we are trying to wrap past the last element:
                lastSegIndex = path.segments.length - 1;
                lastSegType = path.getSegment(lastSegIndex).type;
                closepathPresent = (lastSegType === 'Z');

                endpointsIdenticalX = anchorPoints[0].attr('cx') === anchorPoints[lastIndex].attr('cx');
                endpointsIdenticalY = anchorPoints[0].attr('cy') === anchorPoints[lastIndex].attr('cy');

                if (closepathPresent && endpointsIdenticalX && endpointsIdenticalY) {
                    // there is a closepath segment between the last element and the start element AND
                    // the start element and the last element have the same coordinates
                    // (that is, the two curves look like any other curve join in the path)
                    boundIndex = 1; // wrap to the first element
                }
                // else: leave the index at (lastIndex + 1) (no control points correspond to the index)
            }
        }

        return boundIndex;
    },

    getControlPointLockedStates: function() {

        const { controlPoints } = this;

        const lockedStates = [];
        for (let index = 0; index < controlPoints.length; index++) {

            if (!controlPoints[index]) continue;

            lockedStates[index] = [];
            for (let j = 0; j <= 1; j++) {

                if (!controlPoints[index][j]) continue;

                const controlPointIndex = j + 1;

                if (controlPoints[index][j].hasClass('locked')) {
                    lockedStates[index][controlPointIndex] = true;

                } else {
                    lockedStates[index][controlPointIndex] = false;
                }
            }
        }

        return lockedStates;
    },

    setControlPointLockedStates: function(lockedStates) {

        const { controlPoints } = this;

        for (let index = 0; index < controlPoints.length; index++) {

            if (!lockedStates[index]) continue;
            if (!controlPoints[index]) continue;

            for (let controlPointIndex = 1; controlPointIndex <= 2; controlPointIndex++) {

                if (!lockedStates[index][controlPointIndex]) continue;
                if (!controlPoints[index][controlPointIndex - 1]) continue;

                if (lockedStates[index][controlPointIndex] === true) {
                    controlPoints[index][controlPointIndex - 1].addClass('locked');
                } else {
                    controlPoints[index][controlPointIndex - 1].removeClass('locked');
                }
            }
        }
    },

    convertSegmentPath: function(e) {

        const evt = util.normalizeEvent(e);
        const index = V(evt.target).attr('index');

        const { pathNode, path } = this;

        const seg = path.getSegment(index);

        switch (seg.type) {
            case 'Z':
                path.insertSegment(index, g.Path.createSegment('C', seg.start.x, seg.start.y, seg.end.x, seg.end.y, seg.end.x, seg.end.y));
                break;
            case 'L':
                path.replaceSegment(index, g.Path.createSegment('C', seg.start.x, seg.start.y, seg.end.x, seg.end.y, seg.end.x, seg.end.y));
                break;
            case 'C':
                path.replaceSegment(index, g.Path.createSegment('L', seg.end.x, seg.end.y));
                break;
        }

        this.render();
        this.pathNode.setAttribute('d', path.toString());

        this.trigger('path:edit', pathNode, evt);
        this.trigger('path:segment:convert', pathNode, evt);
    },

    addClosePathSegment: function(e) {

        const evt = util.normalizeEvent(e);
        const index = parseInt($(evt.target).attr('index'), 10);

        const { path, pathNode } = this;

        if (index === 0 || index === path.segments.length - 1) {
            // if the first or last anchor was selected:
            const seg = path.getSegment(path.segments.length - 1);
            if (seg.type !== 'Z') {

                // if the last segment of path is not closepath:
                // add closepath at the end of path
                path.appendSegment(g.Path.createSegment('Z'));

                this.render();
                this.pathNode.setAttribute('d', path.toString());

                this.trigger('path:edit', pathNode, evt);
                this.trigger('path:closepath-segment:add', pathNode, evt);
            }
        }
    },

    removeClosePathSegment: function(e) {

        const evt = util.normalizeEvent(e);
        const index = V(evt.target).attr('index');

        const { path, pathNode } = this;

        const seg = path.getSegment(index);

        if (seg.type === 'Z') {
            path.removeSegment(index);

            this.render();
            this.pathNode.setAttribute('d', path.toString());

            this.trigger('path:edit', pathNode, evt);
            this.trigger('path:closepath-segment:remove', pathNode, evt);
        }
    },

    // if needed, `isMoreThanSecondClick()` is extremely easy to derive from this code
    // create another `clickCounter` and `timeout` variables
    // and then change `this.clickCounter >= 2` to `3`
    isMoreThanFirstClick: function() {

        const DOUBLE_CLICK_THRESHOLD = 400;

        // create or increment counter
        this.clickCounter = this.clickCounter || 0;
        this.clickCounter += 1;

        // renew timeout
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(function() {
            // if second click does not come within time threshold,
            // reset click counter back to `0`
            this.clickCounter = 0;
        }, DOUBLE_CLICK_THRESHOLD);

        // evaluate click counter
        if (this.clickCounter >= 2) {
            // this is a second click (or more)
            // stop timer and return `true`
            this.clickCounter = 0;
            clearTimeout(this.timeout);
            return true;
        } else {
            // this is a first click
            // keep timer running and return `false`
            return false;
        }
    },

    //////////////
    // Handlers //
    //////////////

    onAnchorPointPointerDown: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only
        if (evt.which !== 1) return;

        // first click only (if this was part of a double click)
        if (this.isMoreThanFirstClick()) return;

        this.startMoving(evt);

        this.delegateDocumentEvents();
    },

    onControlPointPointerDown: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only
        if (evt.which !== 1) return;

        // first click only (if this was part of a double click)
        if (this.isMoreThanFirstClick()) return;

        this.startMoving(evt);

        this.delegateDocumentEvents();
    },

    onSegmentPathPointerDown: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only
        if (evt.which !== 1) return;

        // first click only (if this was part of a double click)
        if (this.isMoreThanFirstClick()) return;

        this.startMoving(evt);

        this.delegateDocumentEvents();
    },

    onPointerMove: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        this.move(evt);
    },

    onPointerUp: function(e) {

        this.undelegateDocumentEvents();

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        this.stopMoving(evt);
    },

    onAnchorPointDoubleClick: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();
        evt.preventDefault();

        // left button only
        if (evt.which !== 1) return;

        this.removeAnchorPoint(evt); // default user interaction method

        // alternative method that could be called by this interaction:
        //this.addClosePathSegment(evt);
    },

    onControlPointDoubleClick: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();
        evt.preventDefault();

        // left button only
        if (evt.which !== 1) return;

        this.lockControlPoint(evt);
    },

    onSegmentPathDoubleClick: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();
        evt.preventDefault();

        // left button only
        if (evt.which !== 1) return;

        this.createAnchorPoint(evt); // default user interaction method

        // alternative methods that could be called by this interaction:
        //this.convertSegmentPath(evt);
        //this.removeClosePathSegment(evt);
    }
});
