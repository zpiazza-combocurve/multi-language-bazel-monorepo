import $ from 'jquery';
import { util, mvc } from 'jointjs/src/core.mjs';

const TooltipPosition = {
    Left: 'left',
    Top: 'top',
    Bottom: 'bottom',
    Right: 'right'
};

const TooltipArrowPosition = {
    Left: 'left',
    Top: 'top',
    Bottom: 'bottom',
    Right: 'right',
    Auto: 'auto',
    Off: 'off'
}

export const Tooltip = mvc.View.extend({

    className: 'tooltip',

    options: {
        // `left` allows you to set a selector (or DOM element) that
        // will be used as the left edge of the tooltip. This is useful when configuring a tooltip
        // that should be shown "after" some other element. Other sides are analogous.
        /** @deprecated use position: 'left' instead. This value is used when 'position' is not defined. Ignored if defined on element.  */
        left: undefined,
        /** @deprecated use position: 'right' instead. This value is used when 'position' is not defined. Ignored if defined on element.  */
        right: undefined,
        /** @deprecated use position: 'top' instead. This value is used when 'position' is not defined. Ignored if defined on element. */
        top: undefined,
        /** @deprecated use position: 'bottom' instead. This value is used when 'position' is not defined. Ignored if defined on element. */
        bottom: undefined,

        /** @type {string|function(element)} */
        position: undefined,

        /** @type {string|function(element)} */
        positionSelector: undefined,

        /** @type {string|function(element)} Tooltip arrow direction, could be 'left', 'right', 'top', 'bottom' and 'auto'.
         * 'auto' sets the arrow accordingly 'position' property.
         * Arrows are disabled if 'direction' is 'undefined', 'null' or 'off'.
         * */
        direction: 'auto',

        /**
         * Minimal width of the tooltip. Tooltip width can be resized down to the `minResizedWidth`. If available space is smaller
         * than `minResizedWidth`, direction of the tooltip is changed to its opposite direction (left tooltip is swapped to right,
         * top to bottom and vice versa). `minResizedWidth:0` means no resizing, no direction swapping.
         * @type {number}
         */
        minResizedWidth: 100,

        /** @type {number|function(element)} */
        padding: 0,

        /** @type {String} */
        rootTarget: null,

        /** @type {String} */
        target: null,


        container: null,

        /** @type {string} */
        trigger: 'hover',

        /** @type {{selector: String, padding: number}} */
        viewport: {
            selector: null,
            padding: 0
        },

        /** @type {string} */
        dataAttributePrefix: 'tooltip',

        /** @type {string} */
        template: '<div class="tooltip-arrow"></div><div class="tooltip-arrow-mask"></div><div class="tooltip-content"></div>',

        animation: false
    },

    init: function() {

        this.eventNamespace = ('.' + this.className + this.cid).replace(/ /g, '_');

        /**
         * Specific for each tooltip - merged global options with tooltip's options from html attrs.
         * @type {object}
         */
        this.settings = {};

        const { trigger, rootTarget, target, animation = false, container } = this.options;

        let containerNode;
        if (container) containerNode = $(container)[0];
        if (!container) containerNode = document.body;
        this.container = containerNode;

        var triggers = trigger.split(' ');

        util.bindAll(this, 'render', 'hide', 'show', 'toggle', 'isVisible', 'position');


        if (rootTarget) {

            this.$rootTarget = $(rootTarget);

            triggers.forEach(function(trigger) {

                switch (trigger) {

                    case 'click':
                        this.$rootTarget.on('click' + this.eventNamespace, this.options.target, this.toggle);
                        break;

                    case 'hover':
                        this.$rootTarget.on('mouseover' + this.eventNamespace, this.options.target, this.render);
                        break;

                    case 'focus':
                        this.$rootTarget.on('focusin' + this.eventNamespace, this.options.target, this.render);
                        break;
                }

            }, this);

        } else {

            this.$target = $(target);

            triggers.forEach(function(trigger) {

                switch (trigger) {

                    case 'click':
                        this.$target.on('click' + this.eventNamespace, this.toggle);
                        break;

                    case 'hover':
                        this.$target.on('mouseover' + this.eventNamespace, this.render);
                        break;

                    case 'focus':
                        this.$target.on('focusin' + this.eventNamespace, this.render);
                        break;

                }
            }, this);
        }

        if (animation) this.animate(animation);

        this.$el.append(this.options.template);
    },

    animate: function({ duration = '500ms', delay = '400ms', timingFunction = 'ease' } = {}) {
        this.$el.addClass('animated').css({
            animationDelay: delay,
            animationDuration: duration,
            animationTimingFunction: timingFunction
        });
    },

    /**
     * @private
     */
    onRemove: function() {

        // Detach events listeners
        if (this.options.rootTarget) {
            this.$rootTarget.off(this.eventNamespace);
        } else {
            this.$target.off(this.eventNamespace);
        }
    },

    /**
     * @public
     */
    hide: function() {

        var settings = this.settings;

        if (!settings) {
            return;
        }

        if (settings.currentTarget) {
            this.unbindHideActions(settings.currentTarget);
        }

        this.$el.removeClass(settings.className);
        this.$el.remove();
        this.trigger('close');
    },

    /**
     * @public
     */
    show: function(options) {

        this.render(options || { target: this.options.target });
    },

    /**
     * @public
     */
    toggle: function(options) {

        if (this.isVisible()) {
            this.hide();
        } else {
            this.show(options);
        }
    },

    /**
     * @public
     */
    isVisible: function() {

        // Check if tooltip is in the DOM
        return document.body.contains(this.el);
    },

    /**
     * @protected
     * @param {{target: string|Element}|{x:number, y:number}} options
     */
    render: function(options) {

        let point = null;
        if (options.x !== undefined && options.y !== undefined) {
            point = {
                x: options.x,
                y: options.y
            }
        }

        let element = null;
        if (options.target) {
            element = $(options.target).closest(this.options.target)[0];
        }

        const settings = this.settings = this.getTooltipSettings(element);

        this.$('.tooltip-content').html(settings.calculatedContent);

        if (element) {
            settings.currentTarget = element;
            this.bindHideActions(element);
        } else {
            settings.currentTarget = null;
        }

        let targetBBox;
        if (point) {
            targetBBox = { x: point.x, y: point.y, width: 1, height: 1 };
        } else {
            targetBBox = util.getElementBBox(element);
        }

        // Hide the element first so that we don't get a jumping effect during the image loading.
        this.$el.hide();
        this.$el.removeClass('left right top bottom');
        this.$el.addClass(settings.className);

        if (settings.shouldRender) {
            $(this.container).append(this.$el);
        }

        // If there is an image in the `content`, wait till it's loaded as only after that
        // we know the dimension of the tooltip.
        let $images = this.$('img');
        if ($images.length) {

            $images.on('load', function() {
                this.position(targetBBox);
                this.$el.addClass('rendered');
            }.bind(this));

        } else {
            this.position(targetBBox);
            this.$el.addClass('rendered');
        }
    },

    /**
     * @private
     * @param {Element} element
     */
    unbindHideActions: function(element) {

        var hideActionsNamespace = this.eventNamespace + '.remove';

        $(element).off(hideActionsNamespace);
        clearInterval(this.interval);
    },

    /**
     * @private
     * Checks if tooltip's target element is still in dom. Hides tooltip when target element is removed.
     * @param {Element} element
     */
    bindHideOnRemoveTarget: function(element) {

        clearInterval(this.interval);
        this.interval = setInterval(function() {

            if (!$.contains(document, element)) {
                clearInterval(this.interval);
                this.hide();
            }
        }.bind(this), 500);
    },

    /**
     * @private
     * @param {Element} element
     */
    bindHideActions: function(element) {

        var settings = this.settings;

        var $element = $(element);
        var hideActionsNamespace = this.eventNamespace + '.remove';

        this.bindHideOnRemoveTarget(element);

        this.options.trigger.split(' ').forEach(function(trigger) {

            var hideEvents = {
                'hover': ['mouseout', 'mousedown'],
                'focus': ['focusout']
            };

            var events = hideEvents[trigger] || [];
            if (settings.hideTrigger) {
                events = settings.hideTrigger.split(' ') || [];
            }

            events.forEach(function(eventName) {
                $element.on(eventName + hideActionsNamespace, this.hide);
            }, this);

        }, this);
    },

    /**
     * @param el {Element}
     * @returns {Object}
     */
    getTooltipSettings: function(el) {
        const elementDefinition = this.loadDefinitionFromElementData(el);
        return this.evaluateOptions(el, elementDefinition);
    },

    /**
     * @private
     * get options from element data, normalize deprecated definition (moved to render function, for tests only).
     * @param {Element} element
     * @param {Object} elementDefinition
     * @returns {Object}
     */
    evaluateOptions: function(element, elementDefinition = {}) {
        const settings = this.settings = util.assign({}, elementDefinition, this.options);
        let shouldRender = true;
        let calculatedContent = settings.dataAttributeContent;

        util.forIn(settings, (value, key) => {
            if (key === 'content') {
                if (util.isFunction(value)) {
                    const result = settings.content.call(this, element, this);
                    if (result == null) {
                        return;
                    }
                    if (result === false) {
                        shouldRender = false;
                        return;
                    }
                    calculatedContent = result;
                } else {
                    calculatedContent = value;
                }
            } else {
                const evaluated = util.isFunction(value) ? value(element) : value;
                settings[key] = evaluated === undefined || evaluated === null ? elementDefinition[key] : evaluated;
            }
        });

        settings.shouldRender = shouldRender;
        settings.calculatedContent = calculatedContent;
        this.normalizePosition(settings);

        return settings;
    },

    /**
     * @private
     * @param {Element} element
     * @returns {Object}
     */
    loadDefinitionFromElementData: function(element) {

        if (!element) {
            return {};
        }

        var isIgnored = function(key) {

            return key === 'left' || key === 'bottom' || key === 'top' || key === 'right';
        };

        var data = this.getAllAttrs(element, 'data-' + this.options.dataAttributePrefix);
        var options = {};

        util.forIn(data, function(value, key) {

            if (key === '') {
                key = 'dataAttributeContent';
            }

            if (!isIgnored(key)) {
                options[key] = value;
            }
        });

        return options;
    },

    /**
     * @private
     * @param {Element} element
     * @param {string} namePrefix
     * @returns {{string:*}}
     */
    getAllAttrs: function(element, namePrefix) {

        var prefix = namePrefix || '';
        var attrs = element.attributes;
        var dataAttrs = {};


        for (var i = 0, n = attrs.length; i < n; i++) {
            var attr = attrs[i];

            if (attr && attr.name.startsWith(prefix)) {
                var name = util.camelCase(attr.name.slice(prefix.length));
                dataAttrs[name] = attr.value;
            }
        }
        return dataAttrs;
    },

    /**
     * @private
     * modifies the options, use deprecated properties if needed.
     * @param {Object} options
     */
    normalizePosition: function(options) {

        var deprecatedDefinition = options.left || options.right || options.top || options.bottom;

        if (!options.position && deprecatedDefinition) {
            if (options.left) {
                options.position = 'left';
            }
            if (options.right) {
                options.position = 'right';
            }
            if (options.top) {
                options.position = 'top';
            }
            if (options.bottom) {
                options.position = 'bottom';
            }
        }

        if (!options.positionSelector && deprecatedDefinition) {
            options.positionSelector = deprecatedDefinition;
        }
    },

    /**
     * @private
     * @param {g.Rect} targetBBox
     */
    position: function(targetBBox) {

        var settings = this.settings;

        // Show the tooltip. Do this before we ask for its dimension, otherwise they won't be defined yet.
        this.$el.show();
        this.$el.css('width', 'auto');
        var containerBBox = util.getElementBBox(this.container);

        var tooltipBBox = this.getTooltipBBox(targetBBox, containerBBox);

        // Move the tooltip to the right position
        this.$el.css({
            left: tooltipBBox.x,
            top: tooltipBBox.y,
            width: tooltipBBox.width || 'auto'
        });

        // TOOLTIP ARROW
        var arrowPosition = {};

        //Arrow to the middle (vertical/horizontal) of the targetElement
        if (settings.position === 'left' || settings.position === 'right') {
            arrowPosition.top = targetBBox.y + targetBBox.height / 2 - tooltipBBox.y;
        } else if (settings.position === 'top' || settings.position === 'bottom') {
            arrowPosition.left = targetBBox.x + targetBBox.width / 2 - tooltipBBox.x;
        } else {
            //As if `options.left` was set to the target element.
            arrowPosition.top = targetBBox.y + targetBBox.height / 2 - tooltipBBox.y;
        }

        arrowPosition.top -= containerBBox.y;
        arrowPosition.left -= containerBBox.x;

        this.$('.tooltip-arrow, .tooltip-arrow-mask')
            .removeAttr('style') // Reset style of previous tooltip
            .css(arrowPosition); // Move the arrow

        if (settings.direction && settings.direction !== 'off') {
            this.$el.addClass(settings.direction === 'auto' ? (settings.position || 'left') : settings.direction);
        }
    },

    /**
     * if the options.viewport is not defined, us the html bbox instead
     * @return {{x: number, y: number, height: number, width: number}}
     */
    getViewportViewBBox: function() {

        var settings = this.settings;

        var el = settings.viewport.selector ? $(settings.currentTarget).closest(settings.viewport.selector) : 'html';

        var viewportBBox = util.getElementBBox(el);

        // No Selector => Get browser window size.
        // note: 'html' doesn't return a full window height.
        // but returns 0 if body elements have position: absolute.
        if (!settings.viewport.selector) {
            var $window = $(window);
            viewportBBox.width = $window.width() + $window.scrollLeft();
            viewportBBox.height = $window.height() + $window.scrollTop();
        }

        var viewportPadding = settings.viewport.padding || 0;
        viewportBBox.x += viewportPadding;
        viewportBBox.y += viewportPadding;
        viewportBBox.width -= 2 * viewportPadding;
        viewportBBox.height -= 2 * viewportPadding;

        return viewportBBox;
    },

    basePositions: {

        left: function(manipulable, opt) {

            var position = {
                x: opt.positionedBBox.x + opt.positionedBBox.width + opt.padding,
                y: opt.targetBBox.y + opt.targetBBox.height / 2 - opt.tooltipBBox.height / 2
            };

            if (manipulable) {

                var availableSize = opt.viewport.x + opt.viewport.width - (position.x);

                if (availableSize > opt.minWidth && availableSize < opt.tooltipBBox.width + opt.padding) {
                    position.width = availableSize;
                }

                if (availableSize < opt.minWidth) {
                    this.settings.position = 'right';
                    return this.basePositions.right(false, opt);
                }
            }

            return position;
        },

        right: function(manipulable, opt) {

            var position = {
                x: opt.positionedBBox.x - opt.tooltipBBox.width - opt.padding,
                y: opt.targetBBox.y + opt.targetBBox.height / 2 - opt.tooltipBBox.height / 2
            };

            if (manipulable) {

                var availableSize = opt.positionedBBox.x - opt.padding - opt.viewport.x;

                if (availableSize > opt.minWidth && availableSize < opt.tooltipBBox.width + opt.padding) {
                    position.width = availableSize;
                    position.x = opt.viewport.x;
                }

                if (availableSize < opt.minWidth) {
                    this.settings.position = 'left';
                    return this.basePositions.left(false, opt);
                }
            }

            return position;
        },

        top: function(manipulable, opt) {

            var position = {
                x: opt.targetBBox.x + opt.targetBBox.width / 2 - opt.tooltipBBox.width / 2,
                y: opt.positionedBBox.y + opt.positionedBBox.height + opt.padding
            };

            if (manipulable) {

                var availableSize = (opt.viewport.y + opt.viewport.height) - (opt.positionedBBox.y + opt.positionedBBox.height + opt.padding);

                if (availableSize < opt.tooltipBBox.height) {
                    this.settings.position = 'bottom';
                    return this.basePositions.bottom(false, opt);
                }
            }

            return position;
        },

        bottom: function(manipulable, opt) {

            var position = {
                x: opt.targetBBox.x + opt.targetBBox.width / 2 - opt.tooltipBBox.width / 2,
                y: opt.positionedBBox.y - opt.tooltipBBox.height - opt.padding
            };
            if (manipulable) {

                var availableSize = (opt.positionedBBox.y - opt.padding) - opt.viewport.y;

                if (availableSize < opt.tooltipBBox.height) {
                    this.settings.position = 'top';
                    return this.basePositions.top(false, opt);
                }
            }

            return position;
        }
    },

    /**
     * @private
     * @param {g.Rect} targetBBox
     * @returns {{width: number, height: number}}
     */
    getTooltipBBox: function(targetBBox, containerBBox) {

        var settings = this.settings;
        var $element = $(settings.positionSelector);

        var positionedBBox = $element[0] ? util.getElementBBox($element[0]) : targetBBox;
        var tooltipBBox = this.measureTooltipElement();
        var viewport = this.getViewportViewBBox();

        var type = settings.position || 'left';
        var padding = settings.padding;
        var minWidth = Math.min(settings.minResizedWidth, tooltipBBox.width + padding);

        var opt = {
            padding: padding,
            targetBBox: targetBBox,
            positionedBBox: positionedBBox,
            tooltipBBox: tooltipBBox,
            viewport: viewport,
            minWidth: minWidth
        };

        var pos = this.basePositions[type].call(this, minWidth > 0, opt);

        // compensate the container offset
        pos.x -= containerBBox.x;
        pos.y -= containerBBox.y;

        //If the tooltip overflows the viewport on top and bottom sides (the top side wins).
        if (pos.y < viewport.y) {
            pos.y = viewport.y;
        } else if (pos.y + tooltipBBox.height > viewport.y + viewport.height) {
            pos.y = viewport.y + viewport.height - tooltipBBox.height;
        }

        // If the tooltip overflows the viewport on the left and right sides (the left side wins).
        if (pos.x < viewport.x) {
            pos.x = viewport.x;
        } else if (pos.x + tooltipBBox.width > viewport.x + viewport.width) {
            pos.x = viewport.x + viewport.width - tooltipBBox.width;
        }

        return pos;
    },

    /**
     * @private
     * @returns {{width: number, height: number}}
     */
    measureTooltipElement: function() {

        var $measure = this.$el.clone().appendTo($('body')).css({ 'left': -1000, top: -500 });

        var dimensions = {
            width: $measure.outerWidth(),
            height: $measure.outerHeight()
        };
        $measure.remove();

        return dimensions;
    }
}, {
    TooltipPosition: TooltipPosition,

    TooltipArrowPosition: TooltipArrowPosition
});
