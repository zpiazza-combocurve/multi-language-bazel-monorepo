import { util, mvc } from 'jointjs/src/core.mjs';

export const Widget = mvc.View.extend({

    className: 'widget',
    /** @type {Array.<string>} List of mandatory references, widget cannot be created if any of the reference from list
     * is not defined in options */
    references: [],

    constructor: function(options, refs) {

        this.availableReferences = refs || {};
        mvc.View.prototype.constructor.call(this, options);
    },
    /**
     * @private
     * Apply attributes data onto widget elements.
     * @param {Object.<string, Object>} attrs
     * @returns {jQuery}
     */
    updateAttrs: function(attrs) {

        util.setAttributesBySelector(this.$el, attrs);
    },

    /**
     * @protected
     * Override in specific widget.
     */
    bindEvents: function() {

    },

    /**
     * @private
     */
    validateReferences: function() {
        var refs = this.references || [];
        var ret = [];

        refs.forEach(function(ref) {

            if (this.availableReferences[ref] === undefined) {
                ret.push(ref);
            }

        }, this);

        return ret;
    },

    /**
     * @protected
     * @param {string} name
     * @returns {*}
     */
    getReference: function(name) {
        return this.availableReferences[name];
    },

    /**
     * @protected
     * @returns {Array.<*>}
     */
    getReferences: function() {
        return this.availableReferences;
    },

    enable: function() {

    },

    disable: function() {

    },

    isDisabled: function() {
        return false;
    }

}, {

    create: function(opt, refs, widgets = {}) {

        var type = util.camelCase(util.isString(opt) ? opt : opt.type);

        if (!util.isFunction(widgets[type])) {
            throw new Error('Widget: unable to find widget: "' + type + '"');
        }

        var widget = new widgets[type](opt, refs);

        var invalidRefs = widget.validateReferences(refs);
        if (invalidRefs.length > 0) {
            throw new Error('Widget: "' + type + '" missing dependency: ' + invalidRefs.join(', '));
        }

        widget.render();
        widget.updateAttrs(opt.attrs);
        widget.bindEvents();
        widget.$el.attr('data-type', type);

        if (opt.name) {
            widget.$el.attr('data-name', opt.name);
        }

        return widget;
    }

});

