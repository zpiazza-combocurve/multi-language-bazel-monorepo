import { util, mvc } from 'jointjs/src/core.mjs';
import { Widget, widgets } from '../Widget/index.mjs';

const Align = {
    Left: 'left',
    Right: 'right'
}

/**
 * @typedef {{items: Array.<Object>, group: Object}} GroupedItems
 */
export const Toolbar = mvc.View.extend({

    options: {
        /*
         tools: [
            {group: 'groupName'}
         ],
         groups: {
            'name': {
                index: number,
                align: 'left' | 'right'
            }

         }
         references: {}
         */
        autoToggle: false,
        widgetNamespace: null
    },
    align: ['left', 'right'],
    className: 'toolbar',
    defaultGroup: 'default',
    widgets: [],
    groupViews: [],

    init: function() {

        this.tools = util.toArray(this.options.tools);
        this.groups = this.options.groups || {};
    },

    /**
     * @public
     * @param {string} name
     * @returns {Array.<ui.Widget>}
     */
    getWidgetByName: function(name) {

        return this.widgets.find(function(item) {
            return item.options.name === name;
        });
    },

    /**
     * @public
     * @returns {Array.<ui.Widget>}
     */
    getWidgets: function() {

        return this.widgets;
    },

    /**
     * @private
     * @typedef {{items: Array.<Object>, group: Object}} GroupedItems
     * @returns {Array.<[string, GroupedItems]>}
     */
    groupsWithItemsPairs: function() {

        var groupedItems = {};

        this.tools.forEach(function(item) {

            var group = item.group || this.defaultGroup;
            groupedItems[group] = groupedItems[group] || { items: [], group: {}};
            groupedItems[group].items.push(item);
            groupedItems[group].group = this.groups[group] || {};

        }, this);

        var keys = Object.keys(groupedItems);

        var pairs = [];
        for (var i = 0, n = keys.length; i < n; i++) {
            var key = keys[i];
            pairs.push([key, groupedItems[key]]);
        }

        var byIndex = util.sortBy(pairs, function(pair) {
            return pair[1].group.index;
        });

        return util.sortBy(byIndex, function(pair) {
            return pair[1].group.align || 'left';
        });
    },

    /**
     * @public
     * @returns {ui.Toolbar}
     */
    render: function() {

        var sortedGroups = this.groupsWithItemsPairs();
        var firstAlignRight = false;

        sortedGroups.forEach(function(groupArray) {

            var name = groupArray[0];
            var grouped = groupArray[1];
            var $group = this.renderGroup(name, grouped);

            if (!firstAlignRight && grouped.group.align && grouped.group.align === 'right') {
                firstAlignRight = true;
                $group.addClass('group-first');
            }

            $group.appendTo(this.el);

        }, this);

        return this;
    },

    /**
     * @private
     * @param {string} name
     * @param {GroupedItems} grouped
     * @returns {jQuery}
     */
    renderGroup: function(name, grouped) {

        const { references, autoToggle, widgetNamespace } = this.options;

        var groupView = new ToolbarGroupView({
            name: name,
            align: grouped.group.align,
            items: grouped.items,
            references,
            autoToggle,
            widgetNamespace
        });

        this.groupViews.push(groupView);

        groupView.on('all', function() {
            this.trigger.apply(this, arguments);
        }.bind(this));

        groupView.render();

        this.widgets = this.widgets.concat(groupView.widgets);

        return groupView.$el;
    },

    onRemove: function() {

        util.invoke(this.groupViews, 'off');
        util.invoke(this.groupViews, 'remove');
    }
}, {
    Align: Align,
});

var ToolbarGroupView = mvc.View.extend({

    className: 'toolbar-group',

    init: function() {

        this.widgets = [];
    },

    onRender: function() {

        this.$el.attr('data-group', this.options.name);
        this.$el.addClass(this.options.align);
        this.renderItems();
    },

    renderItems: function() {

        util.toArray(this.options.items).forEach(function(item) {
            var widget = this.createWidget(item);
            this.$el.append(widget.$el);
        }, this);
    },

    createWidget: function(item) {

        const { references, autoToggle, widgetNamespace } = this.options;
        const widgetOpt = util.isString(item)
            ? { autoToggle, type: item }
            : util.assign({ autoToggle }, item);

        var widget = Widget.create(widgetOpt, references, widgetNamespace || widgets);
        if (item.name !== undefined) {
            widget.on('all', function(eventName) {
                var data = Array.prototype.slice.call(arguments, 1);
                this.trigger.apply(this, [item.name + ':' + eventName].concat(data));
            }.bind(this));
        }
        this.widgets.push(widget);
        return widget;
    },

    onRemove: function() {

        util.invoke(this.widgets, 'off');
        util.invoke(this.widgets, 'remove');
    }
});

