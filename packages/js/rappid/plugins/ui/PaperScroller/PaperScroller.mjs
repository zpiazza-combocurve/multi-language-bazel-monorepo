// PaperScroller
// =============


// `PaperScroller` wraps the paper root element and implements panning and centering of the paper.

// Example usage:

//      var paperScroller = new PaperScroller;
//      var paper = new Paper({ el: paperScroller.el });
//      paperScroller.options.paper = paper;
//      $appElement.append(paperScroller.render().el);

//      paperScroller.center();
//      paper.on('blank:pointerdown', paperScroller.startPanning);

import $ from 'jquery';
import { V, g, util, dia, mvc, env } from 'jointjs/src/core.mjs';
import { Inertia } from './Inertia.mjs';

export const PaperScroller = mvc.View.extend({

    className: 'paper-scroller',

    events: {
        'scroll': 'onScroll'
    },

    options: {
        paper: undefined,
        // Default padding makes sure the paper inside the paperScroller is always panable
        // all the way left, right, bottom and top.
        // It also makes sure that there is always at least a fragment of the paper visible.
        // Example usage:
        //   padding: 10
        //   padding: { left: 20, right: 20 }
        //   padding: function() { return 10; }
        padding: function() {

            var clientSize = this.getClientSize();
            var minVisibleSize = Math.max(this.options.minVisiblePaperSize, 1) || 1;
            var padding = {};

            padding.left = padding.right = Math.max(clientSize.width - minVisibleSize, 0);
            padding.top = padding.bottom = Math.max(clientSize.height - minVisibleSize, 0);

            return padding;
        },
        scrollWhileDragging: false,
        // Minimal size (px) of the paper that has to stay visible.
        // Used by the default padding method only.
        minVisiblePaperSize: 50,
        autoResizePaper: false,
        baseWidth: undefined,
        baseHeight: undefined,
        contentOptions: undefined,
        cursor: 'default',
        inertia: false,
        borderless: false
    },

    // Internal padding storage
    _padding: { left: 0, top: 0 },

    init: function() {

        util.bindAll(this, 'startPanning', 'stopPanning', 'pan', 'onBackgroundEvent');

        const { options, el } = this;
        const { paper, autoResizePaper, scrollWhileDragging, cursor, inertia } = options;

        // keep scale values for a quicker access
        var initScale = paper.scale();
        this._sx = initScale.sx;
        this._sy = initScale.sy;

        // if the base paper dimension is not specified use the paper size.
        options.baseWidth === undefined && (options.baseWidth = paper.options.width);
        options.baseHeight === undefined && (options.baseHeight = paper.options.height);

        this.$background = $('<div/>').addClass('paper-scroller-background')
            .css({ width: paper.options.width, height: paper.options.height })
            .append(paper.el)
            .appendTo(el);

        this.listenTo(paper, 'scale', this.onScale)
            .listenTo(paper, 'resize', this.onResize)
            .listenTo(paper, 'beforeprint beforeexport', this.storeScrollPosition)
            .listenTo(paper, 'afterprint afterexport', this.restoreScrollPosition);

        // automatically resize the paper
        if (autoResizePaper) {
            this.listenTo(paper, 'render:done', this.onPaperRenderDone);
        }

        if (scrollWhileDragging) {
            this.listenTo(paper, 'cell:pointermove', this.onCellPointermove);
            this.listenTo(paper, 'cell:pointerup', this.onCellPointerup);
        }

        this.debouncedStoreCenter = util.debounce(() => this.storeCenter());
        this.storeCenter(paper.options.width / 2, paper.options.height / 2);

        this.delegateBackgroundEvents();
        this.setCursor(cursor);

        if (inertia) {
            this.inertia = new Inertia((function(deltaX, deltaY) {
                const { el } = this;
                el.scrollTop -= deltaY;
                el.scrollLeft -= deltaX;
            }).bind(this), inertia);
        }
    },

    onCellPointermove: function(_, evt, x, y) {
        const { scrollWhileDragging } = this.options;
        if (!scrollWhileDragging) return;
        this.scrollWhileDragging(evt, x, y, scrollWhileDragging);
    },

    onCellPointerup: function(_, evt) {
        this.stopScrollWhileDragging(evt);
    },

    scrollWhileDragging: function(evt, x, y, opt = {}) {
        const { el } = this;
        const {
            interval = 25,
            padding = -20,
            scrollingFunction = (distance) => distance < 20 ? 5 : 20
        } = opt;

        let { scrollId } = this.eventData(evt);

        const coordinates = new g.Point(x, y);
        const { top, left, right, bottom } = util.normalizeSides(padding);
        const area = this.getVisibleArea().moveAndExpand({
            x: -left,
            y: -top,
            width: left + right,
            height: top + bottom
        });

        if (area.containsPoint(coordinates)) {
            clearInterval(scrollId);
            this.eventData(evt, { scrollId: null });
            return;
        }

        const areaPoint = area.pointNearestToPoint(coordinates);
        const distance = areaPoint.distance(coordinates);
        const scrollPerTick = scrollingFunction.call(this, distance, evt);

        // Find Scroll Direction
        const { x: areaX, y: areaY, width: areaWidth, height: areaHeight } = area;
        const scrollX = (x < areaX) ? -1 : (x > areaX + areaWidth) ? 1 : 0;
        const scrollY = (y < areaY) ? -1 : (y > areaY + areaHeight) ? 1 : 0;

        this.eventData(evt, { scrollX, scrollY, scrollPerTick, container: el });

        if (scrollId) return;

        const data = this.eventData(evt);
        // Start Scrolling
        scrollId = setInterval(({ scrollPerTick, scrollX, scrollY, container }) => {
            container.scrollLeft += scrollPerTick * scrollX;
            container.scrollTop += scrollPerTick * scrollY;
        }, interval, data);

        data.scrollId = scrollId;
    },

    stopScrollWhileDragging: function(evt) {
        const { scrollId } = this.eventData(evt);
        if (scrollId) clearInterval(scrollId);
    },

    onPaperRenderDone: function(stats) {
        // Adjust paper for cell updates only
        if (stats.priority < 2) this.adjustPaper();
    },

    lock: function() {
        this.$el.css('overflow', 'hidden');
        return this;
    },

    unlock: function() {
        this.$el.css('overflow', 'scroll');
        return this;
    },

    setCursor: function(cursor) {

        switch (cursor) {
            case 'grab':
                // Make a special case for the cursor above
                // due to bad support across browsers.
                // It's handled in `layout.css`.
                this.$el.css('cursor', '');
                break;
            default:
                this.$el.css('cursor', cursor);
                break;
        }

        this.$el.attr('data-cursor', cursor);
        this.options.cursor = cursor;

        return this;
    },

    // Set up listeners for passing events from outside the paper to the paper
    delegateBackgroundEvents: function(events) {

        events || (events = util.result(this.options.paper, 'events'));

        var normalizedEvents = this.paperEvents = Object.keys(events || {}).reduce(normalizeEvents.bind(this), {});

        Object.keys(normalizedEvents).forEach(delegateBackgroundEvent, this);

        function normalizeEvents(res, event) {
            var listener = events[event];
            // skip events with selectors
            if (event.indexOf(' ') === -1) {
                res[event] = util.isFunction(listener) ? listener : this.options.paper[listener];
            }
            return res;
        }

        function delegateBackgroundEvent(event) {
            // Sending event data with `guarded=false` to prevent events from
            // being guarded by the paper.
            this.delegate(event, { guarded: false }, this.onBackgroundEvent);
        }

        return this;
    },

    // Pass the event outside the paper to the paper.
    onBackgroundEvent: function(evt) {

        if (this.$background.is(evt.target)) {
            var listener = this.paperEvents[evt.type];
            if (util.isFunction(listener)) {
                listener.apply(this.options.paper, arguments);
            }
        }
    },

    onScroll: function(evt) {
        this.trigger('scroll', evt);
        this.debouncedStoreCenter();
    },

    onResize: function() {
        // Move scroller so the user sees the same area as before the resizing.
        this.restoreCenter();
    },

    onScale: function(sx, sy, ox, oy) {

        this.adjustScale(sx, sy);

        // update scale values for a quicker access
        this._sx = sx;
        this._sy = sy;

        // Move scroller to scale origin.
        if (ox || oy) this.center(ox, oy);

        const { contentOptions, borderless } = this.options;
        if (typeof contentOptions === 'function' || borderless) {
            this.adjustPaper();
        }
    },

    storeScrollPosition: function() {

        this._scrollLeftBeforePrint = this.el.scrollLeft;
        this._scrollTopBeforePrint = this.el.scrollTop;
    },

    restoreScrollPosition: function() {

        // Set the paper element to the scroll position before printing.
        this.el.scrollLeft = this._scrollLeftBeforePrint;
        this.el.scrollTop = this._scrollTopBeforePrint;

        // Clean-up.
        this._scrollLeftBeforePrint = null;
        this._scrollTopBeforePrint = null;
    },

    beforePaperManipulation: function() {

        if (env.test('msie') || env.test('msedge')) {
            // IE is trying to show every frame while we manipulate the paper.
            // That makes the viewport kind of jumping while zooming for example.
            // Make the paperScroller invisible fixes this.
            // MSEDGE seems to have a problem with text positions after the animation.
            this.$el.css('visibility', 'hidden');
        }
    },

    afterPaperManipulation: function() {

        if (env.test('msie') || env.test('msedge')) {
            this.$el.css('visibility', 'visible');
        }
    },

    clientToLocalPoint: function(x, y) {

        var ctm = this.options.paper.matrix();

        x += this.getLTRScrollLeft() - this._padding.left - ctm.e;
        x /= ctm.a;

        y += this.el.scrollTop - this._padding.top - ctm.f;
        y /= ctm.d;

        return new g.Point(x, y);
    },

    localToBackgroundPoint: function(x, y) {

        var localPoint = new g.Point(x, y);
        var ctm = this.options.paper.matrix();
        var padding = this._padding;
        return V.transformPoint(localPoint, ctm).offset(padding.left, padding.top);
    },

    getPadding: function() {

        var padding = this.options.padding;
        if (util.isFunction(padding)) {
            padding = padding.call(this, this);
        }

        return util.normalizeSides(padding);
    },

    computeRequiredPadding: function(rect) {
        // rect is in the paper's coordinate system
        const { sx, sy } = this.options.paper.scale();
        let { x, y } = this.getCenter();
        x *= sx;
        y *= sy;
        // the paper rectangle
        // x1,y1 ---------
        // |             |
        // ----------- x2,y2
        const x1 = rect.x;
        const y1 = rect.y;
        const x2 = x1 + rect.width;
        const y2 = y1 + rect.height;
        // the distance from a border to the center (where we want the `point` to be placed)
        const clientSize = this.getClientSize();
        const cx = clientSize.width / 2;
        const cy = clientSize.height / 2;
        // get user defined padding
        const { left, right, top, bottom } = this.getPadding();
        // calculate required paddings
        return {
            left: Math.max(cx - left - x + x1, 0) + left,
            right: Math.max(cx - right + x - x2, 0) + right,
            top: Math.max(cy - top - y + y1, 0) + top,
            bottom: Math.max(cy - bottom + y - y2, 0) + bottom
        };
    },

    // Position the paper inside the paper wrapper and resize the wrapper.
    addPadding: function() {

        const { borderless, paper } = this.options;

        let left, right, top, bottom;
        if (borderless) {
            left = right = top = bottom = 0;
        } else {
            const { sx, sy } = paper.scale();
            const area = paper.getArea();
            const padding = this.computeRequiredPadding(area.scale(sx, sy, { x: 0, y: 0 }));
            left = Math.round(padding.left);
            right = Math.round(padding.right);
            top = Math.round(padding.top);
            bottom = Math.round(padding.bottom);
        }

        this._padding = {
            left,
            top,
            bottom,
            right
        };

        const { width, height } = paper.getComputedSize();

        this.$background.css({
            width: left + width + right,
            height: top + height + bottom
        });

        paper.$el.css({ left, top });

        return this;
    },

    storeCenter: function(x, y) {
        // store the current mid point of visible paper area, so we can center the paper
        // to the same point after the resize
        const center = util.isNumber(x) ? new g.Point(x, y) : this.computeCenter();
        this._center = center;
    },

    restoreCenter: function() {
        const center = this._center;
        if (!center) return;
        this.center(center.x, center.y);
    },

    getCenter: function() {
        if (!this._center) this._center = this.options.paper.getArea().center();
        return this._center;
    },

    computeCenter: function() {
        const { width, height } = this.getClientSize();
        return this.clientToLocalPoint(width / 2, height / 2);
    },

    adjustPaper: function() {

        let { paper, borderless, contentOptions } = this.options;

        if (typeof contentOptions === 'function') {
            contentOptions = contentOptions.call(this, this);
        }

        var options = util.assign({
            gridWidth: this.options.baseWidth,
            gridHeight: this.options.baseHeight,
            allowNewOrigin: 'negative'
        }, contentOptions);

        if (borderless) {

            const bbox = paper.getFitToContentArea(this.transformContentOptions(options));
            const { sx, sy } = paper.scale();

            bbox.x *= sx;
            bbox.y *= sy;
            bbox.width *= sx;
            bbox.height *= sy;

            const { left, right, top, bottom } = this.computeRequiredPadding(bbox);

            bbox.moveAndExpand({
                x: -left,
                y: -top,
                width: left + right,
                height: top + bottom
            });

            paper.setOrigin(-bbox.x, -bbox.y);
            paper.setDimensions(bbox.width, bbox.height);

        } else {

            paper.fitToContent(this.transformContentOptions(options));
        }

        return this;
    },

    adjustScale: function(sx, sy) {

        const { paper } = this.options;
        const paperOptions = paper.options;
        const fx = sx / this._sx;
        const fy = sy / this._sy;

        paper.setOrigin(paperOptions.origin.x * fx, paperOptions.origin.y * fy);
        paper.setDimensions(paperOptions.width * fx, paperOptions.height * fy);
    },

    // Recalculates content options taking the current scale into account.
    transformContentOptions: function(opt) {

        var sx = this._sx;
        var sy = this._sy;

        if (opt.gridWidth) opt.gridWidth *= sx;
        if (opt.gridHeight) opt.gridHeight *= sy;
        if (opt.minWidth) opt.minWidth *= sx;
        if (opt.minHeight) opt.minHeight *= sy;

        if (util.isObject(opt.padding)) {
            opt.padding = {
                left: (opt.padding.left || 0) * sx,
                right: (opt.padding.right || 0) * sx,
                top: (opt.padding.top || 0) * sy,
                bottom: (opt.padding.bottom || 0) * sy
            };
        } else if (util.isNumber(opt.padding)) {
            opt.padding = opt.padding * sx;
        }

        return opt;
    },

    // Adjust the paper position so the point [x,y] (local units) is moved
    // to the center of paperScroller element.
    // If neither `x` nor `y` provided, center to paper center.
    // If `x` or `y` not provided, only center in the dimensions we know.
    // Difference from scroll() is that center() adds padding to paper to
    // make sure x, y will actually be centered.
    center: function(x, y, opt) {

        const { paper } = this.options;
        const { a, d, e, f } = paper.matrix();

        const xIsNumber = util.isNumber(x);
        const yIsNumber = util.isNumber(y);

        let localOpt;

        if (!xIsNumber && !yIsNumber) {
            // no coordinates provided
            // find center of the paper
            localOpt = x;
            const size = paper.getComputedSize();
            const x1 = -e;
            const y1 = -f;
            x = (x1 + size.width) / 2;
            y = (y1 + size.height) / 2;
        } else {
            localOpt = opt;
            // If one of the coords not provided, substitute with middle
            // of visible area in that dimension
            if (!xIsNumber) {
                x = this.getVisibleArea().center().x;
            }
            if (!yIsNumber) {
                y = this.getVisibleArea().center().y;
            }
            // convert to the paper's coordinates system;
            x *= a;
            y *= d;
        }

        this.storeCenter(x / a, y / d);
        this.addPadding();
        this.scroll(x, y, localOpt);

        return this;
    },

    // Position the paper so that the center of content (local units) is at
    // the center of client area.
    centerContent: function(opt) {

        return this.positionContent('center', opt);
    },

    // Position the paper so that the center of element (local units) is at
    // the center of client area.
    centerElement: function(element, opt) {

        this.checkElement(element, 'centerElement');

        return this.positionElement(element, 'center', opt);
    },

    // Position the paper so that the `positionName`-determined point of
    // content is at `positionName`-determined point of client area.
    positionContent: function(positionName, opt) {

        var contentArea = this.options.paper.getContentArea(opt); // local units
        return this.positionRect(contentArea, positionName, opt);
    },

    // Position the paper so that the `positionName`-determined point of
    // element area is at `positionName`-determined point of client area.
    positionElement: function(element, positionName, opt) {

        this.checkElement(element, 'positionElement');

        var elementArea = element.getBBox(); // local units
        return this.positionRect(elementArea, positionName, opt);
    },

    // Position the paper so that the `positionName`-determined point of
    // `rect` is at `positionName`-determined point of client area.
    // For example, to position the paper so that the top-left corner of
    // `rect` is in the top-left corner of client area and 10px away from
    // edges:
    // - `positionRect('top-left', { padding: 10 });`
    positionRect: function(rect, positionName, opt) {

        var point;
        switch (positionName) {
            case 'center':
                point = rect.center();
                return this.positionPoint(point, '50%', '50%', opt);

            case 'top':
                point = rect.topMiddle();
                return this.positionPoint(point, '50%', 0, opt);

            case 'top-right':
                point = rect.topRight();
                return this.positionPoint(point, '100%', 0, opt);

            case 'right':
                point = rect.rightMiddle();
                return this.positionPoint(point, '100%', '50%', opt);

            case 'bottom-right':
                point = rect.bottomRight();
                return this.positionPoint(point, '100%', '100%', opt);

            case 'bottom':
                point = rect.bottomMiddle();
                return this.positionPoint(point, '50%', '100%', opt);

            case 'bottom-left':
                point = rect.bottomLeft();
                return this.positionPoint(point, 0, '100%', opt);

            case 'left':
                point = rect.leftMiddle();
                return this.positionPoint(point, 0, '50%', opt);

            case 'top-left':
                point = rect.topLeft();
                return this.positionPoint(point, 0, 0, opt);

            default:
                throw new Error('Provided positionName (\'' + positionName + '\') was not recognized.')
        }
    },

    // Position the paper so that `point` is `x` and `y` away from the (left
    // and top) edges of the client area.
    // Optional padding from edges with `opt.padding`.
    // Optional animation with `opt.animation`.
    // Percentages are allowed; they are understood with reference to the area
    // of the client area that is inside padding.
    // Negative values/percentages mean start counting from the other edge of
    // the client area (right and/or bottom).
    positionPoint: function(point, x, y, opt) {

        opt = opt || {};
        var padding = util.normalizeSides(opt.padding); // client units

        var clientRect = new g.Rect(this.getClientSize());
        var restrictedClientRect = clientRect.clone().moveAndExpand({
            x: padding.left,
            y: padding.top,
            width: -padding.right - padding.left,
            height: -padding.top - padding.bottom
        });

        var xIsPercentage = util.isPercentage(x);
        x = parseFloat(x); // ignores the final %
        if (xIsPercentage) x = (x / 100) * Math.max(0, restrictedClientRect.width);
        if (x < 0) x = restrictedClientRect.width + x; // if negative, start counting from other edge

        var yIsPercentage = util.isPercentage(y);
        y = parseFloat(y); // ignores the final %
        if (yIsPercentage) y = (y / 100) * Math.max(0, restrictedClientRect.height);
        if (y < 0) y = restrictedClientRect.height + y; // if negative, start counting from other edge

        var target = restrictedClientRect.origin().offset(x, y); // client units
        var center = clientRect.center();
        var centerVector = center.difference(target);

        var scale = this.zoom();

        var localCenterVector = centerVector.scale(1 / scale, 1 / scale); // local units
        var localCenter = point.clone().offset(localCenterVector);
        return this.center(localCenter.x, localCenter.y, opt);
    },

    // Put the point at [x,y] in the paper (local units) to the center of
    // paperScroller window.
    // Less aggressive than center() as it only changes position of scrollbars
    // without adding paddings - it won't actually move view onto the position
    // if there isn't enough room for it!
    // If `x` or `y` is not provided, only scroll in the directions we know.
    // Optionally you can specify `animation` key in option argument
    // to make the scroll animated; object is passed into $.animate
    scroll: function(x, y, opt) {

        var ctm = this.options.paper.matrix();

        var clientSize = this.getClientSize();

        var change = {};

        if (util.isNumber(x)) {
            var cx = clientSize.width / 2;
            change['scrollLeft'] = this.getScrollLeftFromLTR(x - cx + ctm.e + (this._padding.left || 0));
        }

        if (util.isNumber(y)) {
            var cy = clientSize.height / 2;
            change['scrollTop'] = y - cy + ctm.f + (this._padding.top || 0);
        }

        if (opt && opt.animation) this.$el.animate(change, opt.animation);
        else this.$el.prop(change);
    },

    // Simple wrapper around scroll method that finds center of paper
    // content and scrolls to it.
    // Accepts same `opt` objects as the scroll() method (`opt.animation`).
    scrollToContent: function(opt) {

        var center = this.options.paper.getContentArea(opt).center();
        var sx = this._sx;
        var sy = this._sy;

        center.x *= sx;
        center.y *= sy;

        return this.scroll(center.x, center.y, opt);
    },

    // Simple wrapper around scroll method that finds center of specified
    // element and scrolls to it.
    // Accepts same `opt` objects as the scroll() method (`opt.animation`).
    scrollToElement: function(element, opt) {

        this.checkElement(element, 'scrollToElement');

        var center = element.getBBox().center();
        var sx = this._sx;
        var sy = this._sy;

        center.x *= sx;
        center.y *= sy;

        return this.scroll(center.x, center.y, opt);
    },

    zoom: function(value, opt = {}) {

        if (value === undefined) {
            return this._sx;
        }

        var center = this.computeCenter();
        var sx = value;
        var sy = value;
        var ox;
        var oy;

        if (!opt.absolute) {
            // Prevent decimal fraction representation errors
            // e.g. 0.1 + 0.2 = 0.30000000000000004
            const precision = 1e12;
            const add = (a, b) => (a * precision + b * precision) / precision;
            sx = add(this._sx, sx);
            sy = add(this._sy, sy);
        }

        if (opt.grid) {
            sx = Math.round(sx / opt.grid) * opt.grid;
            sy = Math.round(sy / opt.grid) * opt.grid;
        }

        // check if the new scale won't exceed the given boundaries
        if (opt.max) {
            sx = Math.min(opt.max, sx);
            sy = Math.min(opt.max, sy);
        }

        if (opt.min) {
            sx = Math.max(opt.min, sx);
            sy = Math.max(opt.min, sy);
        }

        if (opt.ox === undefined || opt.oy === undefined) {

            // if the origin is not specified find the center of the paper's visible area.
            ox = center.x;
            oy = center.y;

        } else {

            var fsx = sx / this._sx;
            var fsy = sy / this._sy;

            ox = opt.ox - ((opt.ox - center.x) / fsx);
            oy = opt.oy - ((opt.oy - center.y) / fsy);
        }

        this.beforePaperManipulation();

        this.options.paper.scale(sx, sy);
        this.center(ox, oy);

        this.afterPaperManipulation();

        return this;
    },

    zoomToRect: function(rect, opt = {}) {

        // rect accepts simple objects with `{ x, y, width, height }` (= `dia.BBox`)
        rect = new g.Rect(rect);

        const paper = this.options.paper;
        const paperOrigin = util.assign({}, paper.options.origin);

        // `opt.fittingBBox` is the exact size of this PaperScroller's viewport
        opt.fittingBBox = opt.fittingBBox || util.assign({}, new g.Point(paperOrigin), {
            width: this.$el.width(),
            height: this.$el.height()
        });

        // `opt.contentArea` is the area we want to zoom to = `rect`
        opt.contentArea = rect;

        this.beforePaperManipulation();

        // scale the paper so the fitting bbox fits `rect`
        // (if no `rect` was provided, then no `opt.contentArea` was set)
        // (and thus, `paper.scaleContentToFit()` scales to fit all graph content)
        paper.scaleContentToFit(opt);

        // center the paper at the center of `rect`
        const center = rect.center();
        this.adjustPaper();
        this.center(center.x, center.y);

        this.afterPaperManipulation();

        return this;
    },

    zoomToFit: function(opt = {}) {

        const paper = this.options.paper;
        const contentArea = paper.getContentArea(opt);

        this.zoomToRect(contentArea, opt);
        return this;
    },

    transitionClassName: 'transition-in-progress',
    transitionEventName: 'transitionend.paper-scroller-transition',

    transitionToPoint: function(x, y, opt) {

        // Allow both `transition(point, options)` and `transition(x, y, options)`
        if (util.isObject(x)) {
            opt = y;
            y = x.y;
            x = x.x;
        }

        opt || (opt = {});

        var oldScale = this._sx;
        var scale = Math.max(opt.scale || oldScale, 1e-6);

        var localPoint = new g.Point(x, y);
        var localCenter = this.computeCenter();
        var transform, transformOrigin;

        if (oldScale === scale) {
            // Translate only
            var translate = localCenter.difference(localPoint).scale(oldScale, oldScale).round();
            transform = 'translate(' + translate.x + 'px,' + translate.y + 'px)';

        } else {
            // Translate and scale concurrently
            var distance = scale / (oldScale - scale) * localPoint.distance(localCenter);
            var localOrigin = localCenter.clone().move(localPoint, distance);
            var origin = this.localToBackgroundPoint(localOrigin).round();
            transform = 'scale(' + (scale / oldScale) + ')';
            transformOrigin = origin.x + 'px ' + origin.y + 'px';
        }

        this.$el
            .addClass(this.transitionClassName);
        this.$background
            .off(this.transitionEventName)
            .on(this.transitionEventName, function(evt) {

                var paperScroller = this.paperScroller;
                paperScroller.syncTransition(this.scale, { x: this.x, y: this.y });
                // Trigger a callback
                var onTransitionEnd = this.onTransitionEnd;
                if (util.isFunction(onTransitionEnd)) {
                    onTransitionEnd.call(paperScroller, evt);
                }
            }.bind({
                // TransitionEnd handler context
                paperScroller: this,
                scale: scale,
                x: x,
                y: y,
                onTransitionEnd: opt.onTransitionEnd
            }))
            .css({
                transition: 'transform',
                transitionDuration: opt.duration || '1s',
                transitionDelay: opt.delay,
                transitionTimingFunction: opt.timingFunction,
                transformOrigin: transformOrigin,
                transform: transform
            });

        return this;
    },

    syncTransition: function(scale, center) {

        this.beforePaperManipulation();

        this.options.paper.scale(scale);

        this.removeTransition()
            .center(center.x, center.y);

        this.afterPaperManipulation();

        return this;
    },

    removeTransition: function() {

        this.$el
            .removeClass(this.transitionClassName);
        this.$background
            .off(this.transitionEventName)
            .css({
                transition: '',
                transitionDuration: '',
                transitionDelay: '',
                transitionTimingFunction: '',
                transform: '',
                transformOrigin: ''
            });

        return this;
    },

    transitionToRect: function(rect, opt = {}) {

        rect = new g.Rect(rect);
        const maxScale = opt.maxScale || Infinity;
        const minScale = opt.minScale || Number.MIN_VALUE;
        const scaleGrid = opt.scaleGrid || null;
        const visibility = opt.visibility || 1;
        const center = (opt.center) ? new g.Point(opt.center) : rect.center();

        const clientSize = this.getClientSize();

        const clientWidth = clientSize.width * visibility;
        const clientHeight = clientSize.height * visibility;
        const clientRect = new g.Rect({
            x: center.x - clientWidth / 2,
            y: center.y - clientHeight / 2,
            width: clientWidth,
            height: clientHeight
        });

        // scale the paper so all the corner points are in the viewport.
        let scale = clientRect.maxRectUniformScaleToFit(rect, center);
        scale = Math.min(scale, maxScale);
        if (scaleGrid) {
            scale = Math.floor(scale / scaleGrid) * scaleGrid;
        }
        scale = Math.max(minScale, scale);

        this.transitionToPoint(center, util.defaults({ scale: scale }, opt));
        return this;
    },

    startPanning: function(evt) {

        evt = util.normalizeEvent(evt);

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;

        this.trigger('pan:start', evt);
        this.delegatePanning();

        if (this.options.inertia) this.inertia.handleDragStart(evt);
    },

    pan: function(evt) {

        evt = util.normalizeEvent(evt);

        var dx = evt.clientX - this._clientX;
        var dy = evt.clientY - this._clientY;

        this.el.scrollTop -= dy;
        this.el.scrollLeft -= dx;

        this._clientX = evt.clientX;
        this._clientY = evt.clientY;

        if (this.options.inertia) this.inertia.handleDragMove(evt);
    },

    stopPanning: function(evt) {

        this.undelegatePanning();

        // The event does not have to exist (backwards compatibility)
        if (evt) evt = util.normalizeEvent(evt);
        this.trigger('pan:stop', evt);

        if (this.options.inertia) this.inertia.handleDragEnd(evt);
    },

    delegatePanning() {
        this.$el.addClass('is-panning');
        this.delegateDocumentEvents({
            'mousemove': 'pan',
            'touchmove': 'pan',
            'mouseup': 'stopPanning',
            'touchend': 'stopPanning',
            'touchcancel': 'stopPanning'
        });
    },

    undelegatePanning() {
        this.$el.removeClass('is-panning');
        this.undelegateDocumentEvents();
    },

    // Return the client dimensions in pixels as reported by browser.
    // "What is the size of the window through which the user can see the paper?"
    getClientSize: function() {
        const { clientWidth, clientHeight } = this.el;
        return { width: clientWidth, height: clientHeight };
    },

    // Return the dimensions of the visible area in local units.
    // "What part of the paper can be seen by the user, taking zooming and panning into account?"
    getVisibleArea: function() {

        var ctm = this.options.paper.matrix();
        var clientSize = this.getClientSize(); // client units

        var area = {
            x: this.getLTRScrollLeft(),
            y: this.el.scrollTop || 0,
            width: clientSize.width,
            height: clientSize.height
        }; // client units

        var transformedArea = V.transformRect(area, ctm.inverse()); // local units

        transformedArea.x -= (this._padding.left || 0) / this._sx;
        transformedArea.y -= (this._padding.top || 0) / this._sy;

        return new g.Rect(transformedArea);
    },

    isElementVisible: function(element, opt) {

        this.checkElement(element, 'isElementVisible');

        opt = opt || {};
        var method = opt.strict ? 'containsRect' : 'intersect';
        return !!this.getVisibleArea()[method](element.getBBox());
    },

    isPointVisible: function(point) {

        return this.getVisibleArea().containsPoint(point);
    },

    // some method require element only because link is missing some tools (eg. bbox)
    checkElement: function(element, methodName) {

        if (!(element && element instanceof dia.Element)) {
            throw new TypeError('ui.PaperScroller.' + methodName + '() accepts instance of dia.Element only');
        }
    },

    onRemove: function() {

        this.undelegatePanning();
    },

    isRTLDirection() {
        return getComputedStyle(this.el).direction === 'rtl';
    },

    getLTRScrollLeft() {
        const { el } = this;
        if (this.isRTLDirection()) {
            const { scrollLeft: scrollLeftRTL, scrollWidth, clientWidth } = el;
            return (scrollWidth - clientWidth) + scrollLeftRTL;
        }
        return el.scrollLeft;
    },

    getScrollLeftFromLTR(scrollLeftLTR) {
        if (this.isRTLDirection()) {
            // RTL starts with 0 at the right side of the scrollable area
            const { scrollWidth, clientWidth } = this.el;
            const scrollLeftRTL = scrollLeftLTR - (scrollWidth - clientWidth);
            return scrollLeftRTL;
        }
        return scrollLeftLTR;
    }

});

env.addTest('msie', function() {
    var userAgent = window.navigator.userAgent;
    return userAgent.indexOf('MSIE') !== -1 || userAgent.indexOf('Trident') !== -1;
});

env.addTest('msedge', function() {
    return /Edge\/\d+/.test(window.navigator.userAgent);
});
