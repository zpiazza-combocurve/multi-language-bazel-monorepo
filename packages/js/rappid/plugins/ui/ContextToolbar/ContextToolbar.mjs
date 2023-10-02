// A context toolbar.
// Context toolbar contains tools (usually buttons) that should be displayed below a certain target element.
// Only one context toolbar can be opened at a time. This simplifies the process and makes sure you don't have to
// keep track of opened context toolbars.
import $ from 'jquery';
import { util, mvc, g, V } from 'jointjs/src/core.mjs';

export const ContextToolbar = mvc.View.extend({

    className: 'context-toolbar',

    eventNamespace: 'context-toolbar',

    events: {
        'click .tool': 'onToolPointerdown',
        'touchstart .tool': 'onToolPointerdown'
    },

    options: {
        padding: 20,
        autoClose: true,
        vertical: false,
        anchor: 'top',
        position: 'bottom',
        scale: 1
    },

    documentEvents: {
        'mousedown': 'onDocumentPointerdown',
        'touchstart': 'onDocumentPointerdown'
    },

    init: function() {

        util.bindAll(this, 'onDocumentPointerdown');
    },

    render: function() {

        const options = this.options;
        const constructor = this.constructor;

        if (constructor.opened) {
            // Only one context toolbar can be opened at a time.
            constructor.close();
        }

        if (options.autoClose) {
            // Internet Explorer handle same event immediately and triggers close action
            // postponing autoclose to next tick will work as all other browsers
            setTimeout(this.delegateAutoCloseEvents.bind(this), 0);
        }

        if (options.type) {
            this.$el.attr('data-type', options.type);
        }

        this.beforeMount();

        this.getRoot().append(this.$el);

        this.renderContent();

        this.position();

        this.scale();

        constructor.opened = this;

        return this;
    },

    delegateAutoCloseEvents: function() {

        // It is important to have the toolbar opened on `mousedown` event instead
        // of `click`. This is because we want to handle the earliest event possible.
        // Imagine you want to show the context toolbar when the user clicks an element.
        // We render the toolbar. If we were to register a handler for click,
        // the user would at some point release its mouse, this toolbar would
        // catch the click event outside of both the target and the toolbar
        // itself and would remove itself immediately.

        this.delegateDocumentEvents();

        // add the native event listener for the `useCapture`
        // context toolbar is closed even mousedown is stopped somewhere else
        document.addEventListener('mousedown', this.onDocumentPointerdown, true);
        document.addEventListener('touchstart', this.onDocumentPointerdown, true);
    },

    undelegateAutoCloseEvents: function() {

        this.undelegateDocumentEvents();

        document.removeEventListener('mousedown', this.onDocumentPointerdown, true);
        document.removeEventListener('touchstart', this.onDocumentPointerdown, true);
    },

    beforeMount: function() {
        this.$el.toggleClass('joint-vertical', !!this.options.vertical);
    },

    renderContent: function() {

        const $tools = $('<div/>', { 'class': 'tools' });

        if (this.options.tools) {

            util.toArray(this.options.tools).forEach(function(tool) {

                var $html;
                if (tool.icon) {
                    $html = $('<img/>', { src: tool.icon });
                } else {
                    $html = tool.content;
                }

                var $tool = $('<button/>', {
                    'class': 'tool',
                    html: $html,
                    'data-action': tool.action
                });

                if (tool.attrs) {
                    $tool.attr(tool.attrs);
                }

                $tools.append($tool);
            });
        }

        this.$el.append($tools);
    },

    getRoot: function() {

        return $(this.options.root || document.documentElement);
    },

    position: function() {
        const { target, padding, position: targetPositionName, anchor } = this.options;
        const { $el } = this;
        const position = {
            x: 0,
            y: 0
        };
        if (V.toNode(target) !== undefined) {
            const bbox = util.getElementBBox(target);
            const targetPosition = util.getRectPoint(bbox, targetPositionName);
            position.x = targetPosition.x;
            position.y = targetPosition.y;
            const paddingOffset = util.getRectPoint((new g.Rect()).inflate(padding), targetPositionName);
            position.x += paddingOffset.x;
            position.y += paddingOffset.y;
        } else {
            const targetPoint = new g.Point(target);
            position.x = targetPoint.x;
            position.y = targetPoint.y;
        }

        const width = $el.outerWidth();
        const height = $el.outerHeight();

        // anchor adjustment
        const positionOffset = util.getRectPoint(new g.Rect(0, 0, width, height), anchor);
        position.x -= positionOffset.x;
        position.y -= positionOffset.y;

        // root adjustment
        const rootBbox = util.getElementBBox(this.getRoot());
        position.x -= rootBbox.x;
        position.y -= rootBbox.y;

        $el.css({ left: position.x, top: position.y });
    },

    scale() {
        const { scale, anchor } = this.options;
        if (scale) {
            this.el.style.transform = `scale(${scale}, ${scale})`;

            // legacy position names compatibility
            const anchorComponents = util.toKebabCase(anchor).split('-');
            if (anchorComponents[0] === 'corner') {
                anchorComponents[0] = 'bottom';
                anchorComponents[1] = 'right';
            }
            if (anchorComponents[0] === 'origin') {
                anchorComponents[0] = 'top';
                anchorComponents[1] = 'left';
            }
            if (anchorComponents[1] === 'middle') {
                anchorComponents[1] = null;
            }

            this.el.style.transformOrigin = `${anchorComponents[0]} ${anchorComponents[1] ? anchorComponents[1] : ''}`;
        }
    },

    onRemove: function() {

        this.undelegateAutoCloseEvents();

        this.constructor.opened = undefined;
    },

    onToolPointerdown: function(evt) {

        const action = $(evt.currentTarget).attr('data-action');
        if (action) {
            this.trigger('action:' + action, evt);
        }
    },

    onDocumentPointerdown: function(evt) {

        const { el, options } = this;
        const { target } = options;

        const pointerTarget = evt.target;
        if (V.toNode(target) !== undefined) {
            const [toolbarTarget] = $(target);
            if (
                // click on the toolbar target element
                !toolbarTarget ||
                toolbarTarget === pointerTarget ||
                toolbarTarget.contains(pointerTarget)
            ) {
                return;
            }
        }
        // Check if the user clicked outside the context toolbar.
        if (
            // click inside the toolbar
            el.contains(pointerTarget) ||
            el === pointerTarget
        ) {
            return;
        }
        // And hide it if yes.
        this.constructor.close();
    }

}, {

    opened: undefined, // The currently opened context toolbar.

    close: function() {

        if (this.opened) {
            this.opened.trigger('close');
            this.opened.remove();

            this.opened = undefined;
        }
    },

    // Call whenever the `options.target` changes its position.
    update: function() {

        if (this.opened) {
            this.opened.position();
        }
    }

});
