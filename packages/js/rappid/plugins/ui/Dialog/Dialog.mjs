import $ from 'jquery';
import { util, mvc } from 'jointjs/src/core.mjs';

export const Dialog = mvc.View.extend({

    className: 'dialog',

    events: {
        'click .bg': 'action',
        'click .btn-close': 'action',
        'click .controls button': 'action',
        'mousedown .titlebar': 'onDragStart',
        'touchstart .titlebar': 'onDragStart'
    },

    options: {
        draggable: false,
        closeButtonContent: '&times;',
        closeButton: true,
        inlined: false,
        modal: true,
        width: 0,
        title: '',
        buttons: null,
        type: '',
        content: null
    },

    init: function() {

        util.bindAll(this, 'onDrag', 'onDragEnd');

        this.buttons = this.options.buttons;
    },

    render: function() {

        var $bg = $('<div/>', { 'class': 'bg', 'data-action': 'close' });
        var $fg = $('<div/>', { 'class': 'fg' });
        var $titlebar = $('<div/>', { 'class': 'titlebar' });
        var $body = $('<div/>', { 'class': 'body' });
        var $btnClose = $('<button/>', { 'class': 'btn-close', 'data-action': 'close', html: this.options.closeButtonContent });
        var $controls = $('<div/>', { 'class': 'controls' });

        this.$el.toggleClass('draggable', !!this.options.draggable);

        if (this.options.type) {
            this.$el.attr('data-type', this.options.type);
        }

        if (this.options.inlined) {
            this.$el.addClass('inlined');
        }

        if (this.options.modal) {
            this.$el.addClass('modal');
        }

        if (this.options.width) {
            $fg.width(this.options.width);
        }

        if (this.options.title) {
            $titlebar.append(this.options.title);
        } else {
            $titlebar.addClass('empty');
        }

        if (this.options.content) {
            $body.append(this.options.content);
        }

        if (this.buttons) {

            var rightButtons = [];
            var centerButtons = [];
            var leftButtons = [];

            this.buttons.forEach(function(button) {

                var $button = $('<button/>', {
                    'class': 'control-button',
                    html: button.content,
                    'data-action': button.action
                });

                // currently, 'left' and 'center' positions are supported
                // float right by default

                if (!button.position) {
                    rightButtons.push($button);

                } else if (button.position === 'left') {
                    $button.addClass(button.position);
                    leftButtons.push($button);

                } else if (button.position === 'center') {
                    $button.addClass(button.position);
                    centerButtons.push($button);

                } else {
                    $button.addClass(button.position);
                    rightButtons.push($button);
                }
            });

            // need to be first, to make rightmost button CSS selector work
            // right buttons, in reverse order
            // on screen, this places the first provided button leftmost
            rightButtons.reverse().forEach(function($button) {
                $controls.append($button);
            });

            // left buttons, in order
            // on screen, this places the first provided button leftmost
            leftButtons.forEach(function($button) {
                $controls.append($button);
            });

            // center buttons, in order
            // on screen, this places the first provided button leftmost
            centerButtons.forEach(function($button) {
                $controls.append($button);
            });
        }

        $fg.append($titlebar, $body, $controls);

        if (this.options.closeButton) {
            $fg.append($btnClose);
        }

        this.$el.empty().append($bg, $fg);

        return this;
    },

    open: function(el) {

        // Events might have been undelegated by a previous `close()` call.
        this.delegateEvents();

        this.on('action:close', this.close, this);

        $(el || document.body).append(this.render().el);

        this.$el.addClass('rendered');
        return this;
    },

    close: function() {

        this.remove();
        this.trigger('close');
        return this;
    },

    action: function(evt) {

        var $button = $(evt.target).closest('[data-action]');
        var action = $button.attr('data-action');
        if (action) {

            this.trigger('action:' + action);
        }
    },

    onDragStart: function(evt) {

        if (this.options.draggable) {
            // This is to ensure that we don't drag the scrollable container along with the dialog on touch devices.
            evt.preventDefault();

            evt = util.normalizeEvent(evt);

            const offset = this.$el.find('.fg').offset();

            this.delegateDocumentEvents({
                'mousemove': this.onDrag,
                'touchmove': this.onDrag,
                'mouseup': this.onDragEnd,
                'touchend': this.onDragEnd,
            }, {
                dx: evt.clientX - offset.left,
                dy: evt.clientY - offset.top,
            });
        }
    },

    onDrag: function(evt) {
        evt = util.normalizeEvent(evt);

        const { data } = evt;

        const $fg = this.$('.fg');
        $fg.offset({
            top: evt.clientY - data.dy,
            left: evt.clientX - data.dx
        });
    },

    onDragEnd: function() {
        this.undelegateDocumentEvents();
    }

});
