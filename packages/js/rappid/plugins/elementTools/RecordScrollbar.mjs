import { dia, util, g } from 'jointjs/src/core.mjs';

export const RecordScrollbar = dia.ToolView.extend({
    name: 'scroll-bar',
    tagName: 'rect',
    options: {
        margin: 2,
        width: 8,
        rightAlign: false
    },
    attributes: {
        'fill': '#333',
        'rx': 4,
        'ry': 4,
        'fill-opacity': 0.4,
        'cursor': 'grab'
    },
    events: {
        mousedown: 'onPointerDown',
        touchstart: 'onPointerDown'
    },
    documentEvents: {
        mousemove: 'onPointerMove',
        touchmove: 'onPointerMove',
        mouseup: 'onPointerUp',
        touchend: 'onPointerUp',
        touchcancel: 'onPointerUp'
    },
    onRender: function() {
        this.update();
    },
    update: function() {
        const bbox = this.getBBox();
        if (!bbox) {
            this.disable();
        } else {
            this.enable();
            this.vel.attr(bbox.toJSON());
        }
        return this;
    },
    getTrackHeight() {
        const { relatedView: view, options } = this;
        const record = view.model;
        const { metrics } = record;
        const { padding } =  metrics;
        const margin = options.margin;
        const paddingHeight = padding.top + padding.bottom + 2 * Math.abs(margin);
        const { height } = record.attributes.size;
        return height - paddingHeight;
    },
    getScale() {
        const { relatedView: view } = this;
        const record = view.model;
        const { metrics, attributes } = record;
        const { minHeight } = metrics;
        const { height } = attributes.size;
        const trackHeight = this.getTrackHeight();
        const scale = trackHeight / (minHeight - (height - trackHeight));
        return scale;
    },
    getBBox: function() {
        const { relatedView: view, options } = this;
        const record = view.model;
        if (record.isEveryItemInView()) {
            return null;
        }
        const { metrics, attributes } = record;
        const { width } = attributes.size;
        const { padding, overflow } =  metrics;
        const scrollTrackHeight = this.getTrackHeight();
        if (scrollTrackHeight <= 0) {
            return null;
        }
        const { margin, width: scrollThumbWidth } = options;
        const scale = this.getScale();
        const scrollThumbHeight = scrollTrackHeight * scale;
        const { x, y } = attributes.position;
        const y1 = y + Math.abs(margin) + padding.top;
        let x1 = x;
        if (options.rightAlign) {
            x1 += width - margin;
            if (margin >= 0) x1 -= scrollThumbWidth;
            if (!overflow) x1 -= padding.right;
        } else {
            x1 += margin;
            if (margin < 0) x1 -= scrollThumbWidth;
            if (!overflow) x1 += padding.left;
        }
        return new g.Rect({
            x: x1,
            y: y1 + (scale * record.getScrollTop()),
            width: scrollThumbWidth,
            height: scrollThumbHeight
        });
    },
    disable: function() {
        this.vel.attr('display', 'none');
    },
    enable: function() {
        this.vel.attr('display', '');
    },
    onPointerDown: function(evt) {
        if (this.guard(evt)) return;
        evt.stopPropagation();
        evt.preventDefault();
        const { relatedView: view } = this;
        const record = view.model;
        record.startBatch('scroll-record', { ui: true, tool: this.cid });
        this.focus();
        this.delegateDocumentEvents(null, {
            y: evt.clientY,
            scrollTop: record.getScrollTop()
        });
        view.paper.undelegateEvents();
    },
    onPointerMove: function(evt) {
        const normalizedEvent = util.normalizeEvent(evt);
        const { y, scrollTop, lastScrollTop } = normalizedEvent.data;
        const { relatedView: view } = this;
        const record = view.model;
        const scale = this.getScale();
        const newScrollTop = scrollTop + (normalizedEvent.clientY - y) / scale;
        if (lastScrollTop !== newScrollTop) {
            normalizedEvent.data.lastScrollTop = newScrollTop;
            record.setScrollTop(newScrollTop);
        }
    },
    onPointerUp: function() {
        this.undelegateDocumentEvents();
        this.paper.delegateEvents();
        this.blur();
        this.el.style.pointerEvents = '';
        this.relatedView.model.stopBatch('scroll-record', { ui: true, tool: this.cid });
    }
});
