import $ from 'jquery';
import { V, g, util, mvc } from 'jointjs/src/core.mjs';

export const PathDrawer = mvc.View.extend({

    tagName: 'g',

    svgElement: true,

    className: 'path-drawer',

    events: {
        'mousedown .start-point': 'onStartPointPointerDown',
        'mousedown': 'onPointerDown',
        //'mousemove': 'onPointerMove',
        //'mouseup': 'onPointerUp',
        'touchstart .start-point': 'onStartPointPointerDown',
        'touchstart': 'onPointerDown',
        //'touchmove': 'onPointerMove',
        //'touchend': 'onPointerUp',
        'dblclick': 'onDoubleClick',
        'contextmenu': 'onContextMenu'
    },

    documentEvents: {
        'mousemove': 'onPointerMove',
        'touchmove': 'onPointerMove',
        'mouseup': 'onPointerUp',
        'touchend': 'onPointerUp',
        'touchcancel': 'onPointerUp',
    },

    options: {
        pathAttributes: {
            'class': null,
            'fill': '#ffffff',
            'stroke': '#000000',
            'stroke-width': 1,
            'pointer-events': 'none'
        },
        startPointMarkup: '<circle r="5"/>',
        snapRadius: 0,
        enableCurves: true,
    },

    init: function() {

        const svgTarget = this.svgTarget = V(this.options.target);

        this.path = new g.Path();

        this.$document = $(svgTarget.node.ownerDocument);

        this.action = 'awaiting-input';

        this.render();
    },

    onRemove: function() {

        const { pathNode } = this;

        if (pathNode) {
            V(pathNode).remove();
        }

        this.clear();
    },

    clear: function() {

        const { path, pathNode } = this;

        if (pathNode && path && path.segments.length <= 1) {
            V(pathNode).remove();
        }

        this.svgStart.remove();
        this.svgControl.remove();

        this.pathNode = null;
        this.path = new g.Path();

        this.undelegateDocumentEvents();
        this.action = 'awaiting-input';

        this.trigger('clear');
    },

    render: function() {

        const { options } = this;

        this.svgPathTemplate = V('path').attr(options.pathAttributes);

        this.svgStart = V(options.startPointMarkup).addClass('start-point');
        this.svgControl = V('path').addClass('control-path');

        this.vel.append(V('rect', { x: 0, y: 0, width: '100%', height: '100%', fill: 'transparent', stroke: 'none' }));

        this.svgTarget.append(this.el)

        return this;
    },

    createPath: function(x, y) {

        const path = this.svgPathTemplate.clone();
        const pathNode = this.pathNode = path.node;
        const start = this.svgStart.translate(x, y, { absolute: true });

        this.trigger('path:create', pathNode);

        this.addMoveSegment(x, y);

        this.vel.before(path);
        this.vel.append(start);
    },

    closePath: function() {

        const { path, pathNode } = this;

        const first = path.getSegment(0);
        const last = path.getSegment(path.segments.length - 1);

        if (last.type === 'L') {

            // if last segment is lineto
            // replace with closepath
            path.replaceSegment(path.segments.length - 1, g.Path.createSegment('Z'));

        } else {

            // if last segment is curveto
            // make sure that last segment ends exactly at beginning of path
            last.end.x = first.end.x;
            last.end.y = first.end.y;

            // add closepath behind it
            path.appendSegment(g.Path.createSegment('Z'));

        }

        pathNode.setAttribute('d', path.toString());
        this.finishPath('path:close');
    },

    finishPath: function(pathFinishedEventType) {

        const { path, pathNode } = this;

        if (path && this.numberOfVisibleSegments() > 0) {

            // the new path is not just a single point; users can see it
            this.trigger('path:finish', pathNode);
            this.trigger(pathFinishedEventType, pathNode);

        } else {

            // the path is just a single point; users cannot see it
            // different event is triggered
            this.trigger('path:abort', pathNode);

        }

        this.clear();
    },

    numberOfVisibleSegments: function() {

        const { path } = this;

        let numberOfVisibleSegments = path.segments.length;

        numberOfVisibleSegments -= 1; // the initial moveto segment
        if (path.getSegment(path.segments.length - 1).type === 'Z') {
            numberOfVisibleSegments -= 1; // if path is invisible, adding Z does not make it visible
        }

        return numberOfVisibleSegments;
    },

    addMoveSegment: function(x, y) {

        const { path, pathNode } = this;

        const move = g.Path.createSegment('M', x, y);

        path.appendSegment(move);
        pathNode.setAttribute('d', path.toString());

        this.trigger('path:segment:add', pathNode);
        this.trigger('path:move-segment:add', pathNode);
    },

    addLineSegment: function(x, y) {

        const { path, pathNode } = this;

        const line = g.Path.createSegment('L', x, y);

        path.appendSegment(line);
        pathNode.setAttribute('d', path.toString());

        this.trigger('path:segment:add', pathNode);
        this.trigger('path:line-segment:add', pathNode);
    },

    addCurveSegment: function(x, y, x1, y1, x2, y2) {

        const { path, pathNode } = this;

        const curve = g.Path.createSegment('C', x1, y1, x2 || x, y2 || y, x, y);

        path.appendSegment(curve);
        pathNode.setAttribute('d', path.toString());

        this.trigger('path:segment:add', pathNode);
        this.trigger('path:curve-segment:add', pathNode);
    },

    adjustLastSegment: function(x, y, x1, y1, x2, y2) {

        const { path, pathNode } = this;

        const snapRadius = this.options.snapRadius;
        if (snapRadius) {
            const snappedCoords = this.snapLastSegmentCoordinates(x, y, snapRadius);
            x = snappedCoords.x;
            y = snappedCoords.y;
        }

        const segment = path.getSegment(path.segments.length - 1);

        if (x != null) segment.end.x = x;
        if (y != null) segment.end.y = y;
        if (x1 != null) segment.controlPoint1.x = x1;
        if (y1 != null) segment.controlPoint1.y = y1;
        if (x2 != null) segment.controlPoint2.x = x2;
        if (y2 != null) segment.controlPoint2.y = y2;

        pathNode.setAttribute('d', path.toString());
        this.trigger('path:edit', pathNode);
        this.trigger('path:last-segment:adjust', pathNode);
    },

    snapLastSegmentCoordinates: function(x, y, radius) {

        const { path } = this;

        let snappedX = false;
        let snappedY = false;
        let snapX = x;
        let snapY = y;
        for (let i = path.segments.length - 2; i >= 0; i--) {
            if (snappedX && snappedY) break;
            const segment = path.getSegment(i);
            const segmentX = segment.end.x;
            const segmentY = segment.end.y;
            if (!snappedX && Math.abs(segmentX - x) < radius) {
                snapX = segmentX;
                snappedX = true;
            }
            if (!snappedY && Math.abs(segmentY - y) < radius) {
                snapY = segmentY;
                snappedY = true;
            }
        }

        return new g.Point(snapX, snapY);
    },

    removeLastSegment: function() {

        const { path, pathNode } = this;

        path.removeSegment(path.segments.length - 1);
        pathNode.setAttribute('d', path.toString());

        this.trigger('path:edit', pathNode);
        this.trigger('path:last-segment:remove', pathNode);
    },

    findControlPoint: function(x, y) {

        const { path } = this;

        const last = path.getSegment(path.segments.length - 1);

        return new g.Point(x, y).reflection({ x: last.end.x, y: last.end.y });
    },

    replaceLastSegmentWithCurve: function() {

        const { path, pathNode } = this;

        const last = path.getSegment(path.segments.length - 1);
        const prev = path.getSegment(path.segments.length - 2);

        const curve = g.Path.createSegment('C', prev.end.x, prev.end.y, last.end.x, last.end.y, last.end.x, last.end.y);

        path.replaceSegment(path.segments.length - 1, curve);
        pathNode.setAttribute('d', path.toString());

        this.trigger('path:edit', pathNode);
        this.trigger('path:last-segment:replace-with-curve', pathNode);
    },

    adjustControlPath: function(x1, y1, x2, y2) {

        const { pathNode } = this;

        const control = this.svgControl.node;

        const controlPath = new g.Path([
            g.Path.createSegment('M', x1, y1),
            g.Path.createSegment('L', x2, y2)
        ]);

        control.setAttribute('d', controlPath.toString());
        this.vel.append(control);

        this.trigger('path:interact', pathNode);
        this.trigger('path:control:adjust', pathNode);
    },

    removeControlPath: function() {

        const { pathNode } = this;

        const control = this.svgControl.node;

        control.removeAttribute('d');

        this.vel.append(control);

        this.trigger('path:interact', pathNode);
        this.trigger('path:control:remove', pathNode);
    },

    //////////////
    // Handlers //
    //////////////

    onPointerDown: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only (or touch)
        if (evt.which > 1) return;

        // first click only (if this was part of a double click)
        if (evt.originalEvent.detail > 1) return;

        // check if we are in the DOM (after remove)
        if (!this.el.parentNode) return;

        const coordinates = this.vel.toLocalPoint(evt.clientX, evt.clientY);

        switch (this.action) {

            case 'awaiting-input':
                this.createPath(coordinates.x, coordinates.y);
                if (this.options.enableCurves) {
                    this.action = 'path-created';
                } else {
                    this.addLineSegment(coordinates.x, coordinates.y);
                    this.action = 'adjusting-line-end';
                }
                this.delegateDocumentEvents();
                break;

            case 'adjusting-line-end':
                if (this.options.enableCurves) {
                    this.action = 'awaiting-line-end';
                } else {
                    this.addLineSegment(coordinates.x, coordinates.y);
                }
                break;

            case 'adjusting-curve-end':
                this.action = 'awaiting-curve-control-2';
                break;
        }

        this._timeStamp = evt.timeStamp;
    },

    MOVEMENT_DETECTION_THRESHOLD: 150,

    onPointerMove: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        if (this.action == 'awaiting-input') return;

        let start;
        let control;

        const end = this.vel.toLocalPoint(evt.clientX, evt.clientY);

        const timeStamp = this._timeStamp;

        if (!timeStamp) {
            // mouse button is not pressed

            switch (this.action) {

                case 'adjusting-line-end':
                    this.adjustLastSegment(end.x, end.y);
                    break;

                case 'adjusting-curve-end':
                    this.adjustLastSegment(end.x, end.y, null, null, end.x, end.y);
                    break;
            }

        } else if (timeStamp && ((evt.timeStamp - timeStamp) < this.MOVEMENT_DETECTION_THRESHOLD)) {
            // mouse button is pressed but threshold for detecting movement has not been reached yet
            // keep following user pointer to prevent jumpy interface effects

            switch (this.action) {

                case 'path-created':
                    if (this.options.enableCurves) {
                        start = this.svgStart.translate();
                        this.adjustControlPath(start.tx, start.ty, end.x, end.y);
                    }
                    break;

                case 'adjusting-line-end':
                case 'awaiting-line-end':
                case 'adjusting-curve-control-1':
                    this.adjustLastSegment(end.x, end.y);
                    break;

                case 'awaiting-curve-control-2':
                    this.adjustLastSegment(end.x, end.y, null, null, end.x, end.y);
                    break;
            }

        } else {
            // mouse button is pressed and movement is being detected

            switch (this.action) {

                case 'path-created':
                    if (this.options.enableCurves) {
                        this.action = 'adjusting-curve-control-1';
                    }
                    break;

                case 'awaiting-line-end':
                    if (this.options.enableCurves) {
                        this.replaceLastSegmentWithCurve();
                        this.action = 'adjusting-curve-control-2';
                    }
                    break;

                case 'adjusting-line-end':
                    if (!this.options.enableCurves) {
                        this.adjustLastSegment(end.x, end.y);
                    }
                    break;

                case 'awaiting-curve-control-2':
                    this.action = 'adjusting-curve-control-2';
                    break;

                case 'adjusting-curve-control-1':
                    start = this.svgStart.translate();
                    this.adjustControlPath(start.tx, start.ty, end.x, end.y);
                    break;

                case 'adjusting-curve-control-2':
                    control = this.findControlPoint(end.x, end.y);
                    this.adjustLastSegment(null, null, null, null, control.x, control.y);
                    this.adjustControlPath(control.x, control.y, end.x, end.y);
                    break;
            }
        }
    },

    onPointerUp: function(e) {

        this._timeStamp = null;

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only (or touch)
        if (evt.which > 1) return;

        // first click only (if this was part of a double click)
        if (evt.originalEvent.detail > 1) return;

        const end = this.vel.toLocalPoint(evt.clientX, evt.clientY);

        switch (this.action) {

            case 'path-created':
            case 'awaiting-line-end':
                this.addLineSegment(end.x, end.y);
                this.action = 'adjusting-line-end';
                break;

            case 'awaiting-curve-control-2':
                this.removeControlPath();
                this.addLineSegment(end.x, end.y);
                this.action = 'adjusting-line-end';
                break;

            case 'adjusting-curve-control-1':
            case 'adjusting-curve-control-2':
                this.addCurveSegment(end.x, end.y, end.x, end.y);
                this.action = 'adjusting-curve-end';
                break;
        }
    },

    onStartPointPointerDown: function(e) {

        const evt = util.normalizeEvent(e);

        evt.stopPropagation();

        // left button only (or touch)
        if (evt.which > 1) return;

        // first click only (if this was part of a double click)
        if (evt.originalEvent.detail > 1) return;

        this.closePath();
    },

    onDoubleClick: function(e) {

        const evt = util.normalizeEvent(e);

        evt.preventDefault();
        evt.stopPropagation();

        // left button only (or touch)
        if (evt.which > 1) return;

        if (this.pathNode && this.numberOfVisibleSegments() > 0) {

            // remove the path element created by first click's mousedown
            this.removeLastSegment();

            this.finishPath('path:stop');
        }
    },

    onContextMenu: function(e) {

        const evt = util.normalizeEvent(e);

        evt.preventDefault();
        evt.stopPropagation();

        // first click only (if this was part of a double click)
        if (evt.originalEvent.detail > 1) return;

        if (this.pathNode && this.numberOfVisibleSegments() > 0) {

            // remove currently edited path segment
            this.removeLastSegment();

            this.finishPath('path:stop');
        }
    }
});
