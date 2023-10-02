// Navigator
// =========

// 'Navigator' creates a new paper (usually smaller) that helps select what part
// of the diagram is shown (especially for a larger diagram) and provides
// a different way how to zoom.

// Example usage:
//
// var nav = new Navigator({
//     paperScroller: paperScroller,
//     width: 200,
//     height: 200,
// });
//
// nav.$el.appendTo('#navigator');
// nav.render();
import $ from 'jquery';
import { util, dia, mvc } from 'jointjs/src/core.mjs';

export const Navigator = mvc.View.extend({

    className: 'navigator',

    events: {
        'mousedown': 'startAction',
        'touchstart': 'startAction',
        'mousedown .joint-paper': 'scrollTo',
        'touchstart .joint-paper': 'scrollTo'
    },

    documentEvents: {
        'mousemove': 'doAction',
        'touchmove': 'doAction',
        'mouseup': 'stopAction',
        'touchend': 'stopAction'
    },

    options: {
        paperConstructor: dia.Paper,
        paperOptions: {},
        /**
         * @deprecated use zoom instead
         */
        zoomOptions: null,
        zoom: { min: 0.5, max: 2 },
        width: 300,
        height: 200,
        padding: 10
    },

    init: function() {

        if (this.options.zoomOptions) {
            // backward compatibility
            this.options.zoom = util.assign({}, this.options.zoom, this.options.zoomOptions);
        } else if (this.options.zoom) {
            this.options.zoom = util.defaults({}, this.options.zoom, this.constructor.prototype.options.zoom);
        }

        util.bindAll(this, 'updateCurrentView', 'doAction', 'stopAction', 'scrollTo');

        // The updateCurrentView is called everytime paperScroller's scrollbars change
        // or the paper is resized. Resize of the paper is normally also acompanied
        // by a scrollbar change (but doesn't have to be). An event is triggered for
        // the vertical and horizontal scrollbar change. That leads to the updateCurrentView
        // to be called upto 4 times per one paperScroller action. Debouncing the method solves
        // this issue but there is definitely room for improvement.
        // + it solves an issue with wrong target paper position while zooming out a paper with
        // negative x-origin
        this.updateCurrentView = util.debounce(this.updateCurrentView, 0);

        var paperScroller = this.options.paperScroller;
        paperScroller.$el.on(`scroll${this.getEventNamespace()}`, this.updateCurrentView);

        var sourcePaper = this.sourcePaper = paperScroller.options.paper;

        this.toggleUseContentBBox(this.options.useContentBBox);

        this.targetPaper = new this.options.paperConstructor(util.merge({
            model: sourcePaper.model,
            interactive: false,
            frozen: true
        }, this.options.paperOptions));
    },

    startListening: function() {

        const { options, sourcePaper } = this;
        if (options.useContentBBox) {
            this.listenTo(sourcePaper, 'render:done', () => this.updatePaper());
        } else {
            this.listenTo(sourcePaper, 'resize', () => this.updatePaper());
        }
    },

    render: function() {

        this.targetPaper.$el.appendTo(this.el);
        this.targetPaper.unfreeze();

        this.$currentView = $('<div>').addClass('current-view');

        if (this.options.zoom) {
            var $currentViewControl = $('<div>').addClass('current-view-control');
            this.$currentView.append($currentViewControl);
        }

        this.$el.append(this.$currentView).css({
            width: this.options.width,
            height: this.options.height,
            padding: this.options.padding
        });

        // setting right target paper dimension for the first time.
        this.updatePaper();

        return this;
    },

    freeze(opt) {
        this.targetPaper.freeze(opt);
    },

    unfreeze(opt) {
        this.targetPaper.unfreeze(opt);
    },

    CONTENT_BBOX_CLASS_NAME: 'navigator-use-content-bbox',
    NO_CONTENT_CLASS_NAME: 'navigator-no-content',

    toggleUseContentBBox: function(useContentBBox = false) {

        const { CONTENT_BBOX_CLASS_NAME, $el, targetPaper } = this;
        this.options.useContentBBox = useContentBBox;
        this.stopListening();
        this.startListening();
        $el.toggleClass(CONTENT_BBOX_CLASS_NAME, Boolean(useContentBBox));
        if (targetPaper) this.updatePaper();
    },

    // Updates the navigator's paper size and transformations
    updatePaper: function() {

        const { sourcePaper, targetPaper, options, $el, NO_CONTENT_CLASS_NAME } = this;
        const { useContentBBox } = options;
        const bbox = (useContentBBox)
            ? sourcePaper.getContentBBox(useContentBBox)
            : sourcePaper.getComputedSize();

        const hadNoContent = $el.hasClass(NO_CONTENT_CLASS_NAME);
        if (bbox.width > 0 && bbox.height > 0) {
            if (hadNoContent) {
                $el.removeClass(NO_CONTENT_CLASS_NAME)
                targetPaper.unfreeze({ key: 'navigator' });
            }
            this.updatePaperWithBBox(bbox);
            this.updateCurrentView();
        } else {
            if (hadNoContent) return;
            $el.addClass(NO_CONTENT_CLASS_NAME);
            targetPaper.freeze({ key: 'navigator' });
        }
    },

    updatePaperWithBBox: function(bbox) {

        let { width, height, x = 0, y = 0 } = bbox;
        if (!width || !height) return;

        const { sourcePaper, targetPaper, options } = this;
        const { a: sx, d: sy, e: tx, f: ty } = sourcePaper.matrix();
        const { padding } = options;
        const navigatorWidth = options.width - 2 * padding;
        const navigatorHeight = options.height - 2 * padding;
        width /= sx;
        height /= sy;
        const ratio = this.ratio = Math.min(navigatorWidth / width, navigatorHeight / height);
        width *= ratio;
        height *= ratio;
        const ox = (tx - x) * ratio / sx;
        const oy = (ty - y) * ratio / sy;

        targetPaper.setDimensions(width, height);
        targetPaper.setOrigin(ox, oy);
        targetPaper.scale(ratio, ratio);
    },

    // Updates the position and size of the navigator's current view rectangle.
    updateCurrentView: function() {

        var ratio = this.ratio;
        var sourceScale = this.sourcePaper.scale();
        var paperScroller = this.options.paperScroller;
        var topLeftCoordinates = paperScroller.clientToLocalPoint(0, 0);
        var paperPosition = this.targetPaper.$el.position();
        var paperOrigin = this.targetPaper.translate();

        // IE returns translate.ty = NaN when ty = 0. It sets transform attribute to 'translate(tx)'.
        // TODO: handle this in the vectorizer
        paperOrigin.ty = paperOrigin.ty || 0;

        this.currentViewGeometry = {
            top: paperPosition.top + topLeftCoordinates.y * ratio + paperOrigin.ty,
            left: paperPosition.left + topLeftCoordinates.x * ratio + paperOrigin.tx,
            width: paperScroller.$el.innerWidth() * ratio / sourceScale.sx,
            height: paperScroller.$el.innerHeight() * ratio / sourceScale.sy
        };

        this.$currentView.css(this.currentViewGeometry);
    },

    startAction: function(evt) {

        evt = util.normalizeEvent(evt);
        const { clientX, clientY } = evt;

        // click on current-view control starts zooming
        // otherwise paper panning is initiated.
        const action = $(evt.target).hasClass('current-view-control') ? 'zooming' : 'panning';
        const { options, currentViewGeometry, sourcePaper } = this;
        const { paperScroller } = options;

        this.delegateDocumentEvents(null, {
            action,
            startClientX: clientX,
            startClientY: clientY,
            startScrollLeft: paperScroller.el.scrollLeft,
            startScrollTop: paperScroller.el.scrollTop,
            startZoom: paperScroller.zoom(),
            startGeometry: currentViewGeometry,
            startScale: sourcePaper.scale()
        });

        switch (action) {
            case 'panning': {
                this.trigger('pan:start', evt);
                break;
            }
            case 'zooming': {
                this.trigger('zoom:start', evt);
                break;
            }
        }
    },

    doAction: function(evt) {

        evt = util.normalizeEvent(evt);

        const { clientX, clientY, data } = evt;
        const { sourcePaper, options, ratio } = this;
        const { action, startClientX, startClientY, startScrollLeft, startScrollTop, startZoom, startGeometry, startScale, frameId } = data;
        const { paperScroller, zoom } = options;

        switch (action) {

            case 'panning': {
                const { sx, sy } = sourcePaper.scale();
                const x = (clientX - startClientX) * sx;
                const y = (clientY - startClientY) * sy;
                paperScroller.el.scrollLeft = startScrollLeft + x / ratio;
                paperScroller.el.scrollTop = startScrollTop + y / ratio;
                break;
            }

            case 'zooming': {
                // x / width is the ratio of the original width and the requested width
                const { width } = startGeometry;
                const zoomRatio = 1 + (startClientX - clientX) / width / startScale.sx;
                util.cancelFrame(frameId);
                data.frameId = util.nextFrame(() => {
                    paperScroller.zoom(zoomRatio * startZoom, util.defaults({ absolute: true }, zoom));
                });
                break;
            }
        }
    },

    stopAction: function(evt) {

        this.undelegateDocumentEvents();

        switch (evt.data.action) {
            case 'panning': {
                this.trigger('pan:stop', evt);
                break;
            }
            case 'zooming': {
                this.trigger('zoom:stop', evt);
                break;
            }
        }
    },

    // Scrolls the view to the position determined by the event.
    scrollTo: function(evt) {

        evt = util.normalizeEvent(evt);

        var paperOrigin = this.targetPaper.translate();
        // TODO: see updateCurrentView method
        paperOrigin.ty = paperOrigin.ty || 0;

        var offsetX, offsetY;
        // There is no offsetX/offsetY property in the Firefox event
        if (evt.offsetX === undefined) {
            var targetPaperOffset = this.targetPaper.$el.offset();
            offsetX = evt.pageX - targetPaperOffset.left;
            offsetY = evt.pageY - targetPaperOffset.top;
        } else {
            offsetX = evt.offsetX;
            offsetY = evt.offsetY;
        }

        var cx = (offsetX - paperOrigin.tx) / this.ratio;
        var cy = (offsetY - paperOrigin.ty) / this.ratio;

        this.options.paperScroller.center(cx, cy);
    },

    onRemove: function() {

        this.targetPaper.remove();
        this.options.paperScroller.$el.off(this.getEventNamespace());
    }
});
