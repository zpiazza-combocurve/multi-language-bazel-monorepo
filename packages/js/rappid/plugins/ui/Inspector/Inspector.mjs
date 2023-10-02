// Inspector plugin.
// -----------------

// This plugin creates a two-way data-binding between the cell model and a generated
// HTML form with input fields of a type declaratively specified in an options object passed
// into the element inspector.

/*
USAGE:

(FOR SIMPLE TESTING, CHANGE `window.InspectorDefs.devs.Atomic` in `./defs.js`)

var inspector = new Inspector({
    cellView: cellView,
    inputs: {
        attrs: {
            text: {
                'font-size': { type: 'number', min: 5, max: 80, group: 'text', index: 2 },
                'text': { type: 'textarea', group: 'text', index: 1 }
            }
        },
        position: {
            x: { type: 'number', group: 'geometry', index: 1 },
            y: { type: 'number', group: 'geometry', index: 2 }
        },
        size: {
            width: { type: 'number', min: 1, max: 500, group: 'geometry', index: 3 },
            height: { type: 'number', min: 1, max: 500, group: 'geometry', index: 4 }
        },
        mydata: {
            foo: { type: 'textarea', group: 'data' }
        }
   },
   groups: {
       text: { label: 'Text', index: 1 },
       geometry: { label: 'Geometry', index: 2, closed: true },
       data: { label: 'data', index: 3 }
   }
});

$('.inspector-container').append(inspector.render().el);
*/
import $ from 'jquery';
import { util, dia, mvc } from 'jointjs/src/core.mjs';
import { SelectBox } from '../SelectBox/SelectBox.mjs';
import { SelectButtonGroup } from '../SelectButtonGroup/SelectButtonGroup.mjs';
import { ColorPalette } from '../ColorPalette/ColorPalette.mjs';
import { RadioGroup } from '../RadioGroup/RadioGroup.mjs';
import { DependencyService } from './DependencyService.mjs';
import { SourceService } from './SourceService.mjs';

export const Inspector = mvc.View.extend({

    className: 'inspector',

    options: {
        cellView: undefined, // One can pass either a cell view ...
        cell: undefined, // ... or the cell itself.
        live: true, // By default, we enabled live changes from the inspector inputs.
        validateInput: function(element, path, type, inspector) {
            return element.validity ? element.validity.valid : true;
        },
        renderFieldContent: undefined, // function(options, path, value, inspector) { return html }
        renderLabel: undefined, // function(options, path, inspector) { return html }
        focusField: undefined, // function(options, path, element, inspector) { return void }
        // Custom operators can be defined here as `function(cell, value, argument*) { return boolean; }`
        // e.g. { longerThan: function (cell, value, prop) { return value.length > cell.prop(prop); }}
        operators: {},
        multiOpenGroups: true, // `true` if the Inspector is supposed to allow multiple open groups at the same time. Set to `false` for classical accordion.
        container: null,

        /**
         * Used for logic of store/restore currently opened/stored groups.
         * @params {dia.Cell} model
         * @returns {string}
         * */
        stateKey: function(model) {
            return model.id;
        }
    },

    events: {
        // Custom fields need to call updateCell() explicitly
        'change [data-attribute]:not([data-custom-field])': 'onChangeInput',
        'click .group-label': 'onGroupLabelClick',
        'click .btn-list-add': 'addListItem',
        'click .btn-list-del': 'deleteListItem',
        'mousedown .field': 'pointerdown',
        'touchstart .field': 'pointerdown',
        'focusin .field': 'pointerfocusin',
        'focusout .field': 'pointerfocusout'
    },

    HTMLEntities: {
        'lt': '<',
        'gt': '>',
        'amp': '&',
        'nbsp': ' ',
        'quot': '"',
        'cent': '¢',
        'pound': '£',
        'euro': '€',
        'yen': '¥',
        'copy': '©',
        'reg': '®'
    },

    init: function() {

        var groups = this.options.groups = this.options.groups || {};

        util.bindAll(this, 'stopBatchCommand', 'pointerup', 'onContentEditableBlur', 'replaceHTMLEntity');

        this.DEFAULT_PATH_WILDCARD = '${index}';

        this.pathWildcard = this.options.pathWildcard;

        // List of built-in widgets (references to their views). This allows
        // us to clean up the views (call `remove()` method on them) whenever the
        // inspector need to re-render.
        this.widgets = {};

        // Dictionary of `$attribute` values, keyed by their absolute paths.
        this._byPath = {};

        this._attributeKeysInUse = [];

        // Flatten the `inputs` object until the level where the options object is.
        // This produces an object with this structure: { <path>: <options> }, e.g. { 'attrs/rect/fill': { type: 'color' } }
        this.flatAttributes = this.flattenInputs(this.options.inputs);

        // expand attributes {'a/b/c': { type: 'number'} => {a: {b: {c: {type:'number'}}}
        this.expandAttributes = this.expandAttrs(this.options.inputs || {});

        // `_when` object maps path to a set of conditions (either `eq` or `regex`).
        // When an input under the path changes to
        // the value that equals all the `eq` values or matches all the `regex` regular expressions,
        // the inspector rerenders itself and this time includes all the
        // inputs that met the conditions.
        this._when = {};

        this.dependencyService = new DependencyService();
        this.sourceService = new SourceService(this, this.dependencyService, { wildcard: this.pathWildcard || this.DEFAULT_PATH_WILDCARD });

        // Add the attributes path the options object - we're converting the flat object to an array,
        // so we would lose the keys otherwise.
        var attributesArray = Object.keys(this.flatAttributes).map(function(path) {
            var options = this.flatAttributes[path];
            this._registerDependants.call(this, options, path);
            options.path = path;
            return options;
        }, this);

        // Add dependency paths from the groups `when` expressions. We are making sure here,
        // they are added as a key only (we're not adding them to array of inputs!)
        for (var groupName in groups) {
            var groupOptions = groups[groupName];
            if (groupOptions && groups.hasOwnProperty(groupName)) {
                this.extractExpressionPaths(groupOptions.when).forEach(function(condPath) {
                    if (!this._when[condPath]) this._when[condPath] = [];
                }, this);
            }
        }

        // Sort the flat attributes object by two criteria: group first, then index inside that group.
        // As underscore 'sortBy' is a stable sort algorithm we can sort by index first and then
        // by group again.
        var sortedByIndexAttributes = util.sortBy(attributesArray, 'index');
        this.groupedFlatAttributes = util.sortBy(sortedByIndexAttributes, function(options) {
            var groupOptions = this.options.groups[options.group];
            return (groupOptions && groupOptions.index) || Number.MAX_VALUE;
        }.bind(this));

        // Listen on events on the cell.
        this.listenTo(this.getModel(), 'all', this.onCellChange, this);
    },

    _registerDependants: function(options, path) {

        if (options.when) {
            const expr = options.when
            const dependant = { expression: expr, path: path };

            this.extractExpressionPaths(expr).forEach(function(condPath) {
                // If we encountered this dependency before, add the current path to it as a
                // dependant (indexed in `this._when` by the dependency path: `condPath`).
                // If we didn't encounter this dependency before, create an entry in
                // `this._when` and add the current path as a dependant.
                (this._when[condPath] || (this._when[condPath] = [])).push(dependant);
            }, this);
        }

        // If the option type is 'object' or 'list', it might contain nested dependants
        this._registerNestedDependants.call(this, options, path);
    },

    _registerNestedDependants: function(options, path) {

        // convert string path to array path notation
        const localPath = (Array.isArray(path) ? path : path.split('/'));

        // Objects have `properties`; each one may have a `when` clause and/or nested objects/lists.
        if ((options.type === 'object') && options.properties) {
            const properties = options.properties;
            Object.keys(properties).forEach(function(propertyPath) {
                const property = properties[propertyPath];
                const newPath = localPath.concat(propertyPath); // path array notation
                this._registerDependants(property, newPath);
            }, this);
        }

        // Lists define a generic `item`; it may have a `when` clause and/or nested objects/lists.
        else if ((options.type === 'list') && options.item) {
            const item = options.item;
            const newPath = localPath.concat(null); // `null` is a wildcard for "any list item" in path array notation
            this._registerDependants(item, newPath);
        }

        // Generic objects define properties immediately in `options`; each one may have a `when` clause and/or nested objects/lists.
        // If there is a `type` with a string value among `options`, do not go in (this is an input field definition).
        else if (typeof options.type !== 'string') {
            Object.keys(options).forEach(function(optionPath) {
                const option = options[optionPath];
                if (typeof option === 'object') {
                    const newPath = localPath.concat(optionPath); // path array notation
                    this._registerDependants(option, newPath);
                }
            }, this);
        }
    },

    // Cache all the attributes (inputs, lists and objects) with every change to the DOM tree.
    // Cache it by its path.
    cacheInputs: function() {

        var byPath = {};

        Array.from(this.$('[data-attribute]')).forEach(function(attribute) {
            var $attribute = $(attribute);
            var path = $attribute.attr('data-attribute');
            byPath[path] = $attribute;
        }, this);

        this._byPath = byPath;
        this._attributeKeysInUse = this.getAttributeKeysInUse();
    },

    updateGroupsVisibility: function() {

        var $groups = this.$groups;

        for (var i = 0, n = $groups.length; i < n; i++) {

            var $group = $($groups[i]);
            var groupName = $group.attr('data-name');
            var options = this.options.groups[groupName];

            // If a group fields are all hidden mark the group with 'empty' class name.
            var isGroupEmpty = ($group.find('> .field:not(.hidden)').length === 0);
            $group.toggleClass('empty', isGroupEmpty);

            var isGroupHidden = !!(options && options.when && !this.isExpressionValid(options.when));
            $group.toggleClass('hidden', isGroupHidden);
        }
    },

    expandAttrs: function(inputs) {

        var result = {};

        var keys = Object.keys(inputs);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];

            var value = inputs[key];
            var parts = key.split('/');

            util.setByPath(result, parts, util.isPlainObject(value) ? this.expandAttrs(value) : value);
        }

        return result;
    },

    flattenInputs: function(inputs) {
        return util.flattenObject(inputs, '/', function(obj) {
            // Stop flattening when we reach an object that contains the `type` string property . We assume
            // that this is our options object.
            return (typeof obj.type === 'string');
        });
    },

    getModel: function() {
        return this.options.cell || this.options.cellView.model;
    },

    onCellChange: function(eventName, cell, change, opt) {

        opt = opt || {};

        // Do not react on changes that happened inside this inspector. This would
        // cause a re-render of the same inspector triggered by an input change in this inspector.
        if (opt.inspector == this.cid) return;

        // Note that special care is taken for all the transformation attribute changes
        // (`position`, `size` and `angle`). See below for details.

        switch (eventName) {

            case 'remove':
                // Make sure the element inspector gets removed when the cell is removed from the graph.
                // Otherwise, a zombie cell could possibly be updated.
                if (this.constructor.instance) {
                    this.trigger('close');
                }
                this.remove();
                break;
            case 'change:position':
                // Make a special case for `position` as this one is performance critical.
                // There is no need to rerender the whole inspector but only update the position input.
                this.updateInputPosition();
                break;
            case 'change:size':
                // Make a special case also for the `size` attribute for the same reasons as for `position`.
                this.updateInputSize();
                break;
            case 'change:angle':
                // Make a special case also for the `angle` attribute for the same reasons as for `position`.
                this.updateInputAngle();
                break;
            case 'change:source':
            case 'change:target':
            case 'change:vertices':
                // Make a special case also for the 'source' and 'target' of a link for the same reasons
                // as for 'position'. We don't expect source or target to be configurable.
                // That's why we do nothing here.
                break;
            default:
                // Re-render only on specific attributes changes. These are all events that starts with `'change:'`.
                // Otherwise, the re-render would be called unnecessarily (consider generic `'change'` event, `'bach:start'`, ...).
                var changeAttributeEvent = 'change:';
                if (eventName.slice(0, changeAttributeEvent.length) === changeAttributeEvent) {
                    // re-render the inspector only if the changed attribute is displayed by the inspector
                    var attributeKey = eventName.slice(changeAttributeEvent.length);
                    if (this._attributeKeysInUse.includes(attributeKey)) {
                        this.render({ refresh: true });
                    } else {
                        this.dependencyService.changed(attributeKey);
                    }
                }
                break;
        }
    },

    render: function(opt) {

        var refresh = (opt && opt.refresh);
        if (refresh && this.options.storeGroupsState) {
            this.storeGroupsState();
        }

        this.sourceService.clear();
        this.dependencyService.clear();

        this.$el.empty();
        this.removeWidgets();

        var lastGroup;
        var groups = [];
        var $group;

        this.groupedFlatAttributes.forEach(function(options) {

            if (lastGroup !== options.group) {
                // A new group should be created.

                var groupOptions = this.options.groups[options.group];

                $group = this.renderGroup({
                    name: options.group,
                    label: groupOptions && groupOptions.label
                });

                if (!refresh) {
                    if (groupOptions && groupOptions.closed) {
                        this.closeGroup($group, { init: true });
                    } else {
                        this.openGroup($group, { init: true });
                    }
                }

                groups.push($group);
            }

            this.renderTemplate($group, options, options.path);

            lastGroup = options.group;

        }, this);

        // cache groups

        this.$document = $(this.el.ownerDocument);
        this.$groups = $(groups);

        this.$el.append(groups);

        if (refresh && this.options.restoreGroupsState) {
            this.restoreGroupsState();
        }

        this.afterRender();

        return this;
    },

    getAttributeKeysInUse: function() {

        // all attributes used explicitly in the `inputs` definition
        var inputsAttributeKeys = Object.keys(this._byPath).map(function(path) {
            return path.substring(0, path.indexOf('/')) || path;
        });

        // all attributes that are bound by the selection `options` reference
        var boundedAttributeKeys = util.toArray(this._bound);

        // all attributes that are part of the `when` expression
        var dependantAttributeKeys = Object.keys(this._when);

        return util.uniq([].concat(inputsAttributeKeys, boundedAttributeKeys, dependantAttributeKeys));
    },

    // Get the value of the attribute at `path`.
    // Take into account `options.defaultValue`.
    // Matches found value through `options.valueRegExp` (if any).
    // Beware - gives real value currently present at a specific path in cell.
    // That means, it cannot deal with a `path` with a placeholder!
    getCellAttributeValue: function(path, options) {

        var cell = this.getModel();
        var value = util.getByPath(cell.attributes, path, '/');

        options = options || this.flatAttributes[path];
        if (!options) return value;

        if (value === undefined && options.defaultValue !== undefined) {
            value = options.defaultValue;
        }

        if (options.valueRegExp) {

            if (value === undefined) {

                throw new Error('Inspector: defaultValue must be present when valueRegExp is used.');
            }

            var valueMatch = value.match(new RegExp(options.valueRegExp));
            value = valueMatch && valueMatch[2];
        }

        return value;
    },

    resolvableTypes: ['select', 'select-box', 'color-palette', 'select-button-group', 'radio-group'],

    resolveBindings: function(options) {

        if (this.resolvableTypes.indexOf(options.type) > -1) {

            // options['options'] are transformed here to options['items']
            var items = options.options || [];

            // resolve items if the options are defined indirectly as a reference to a model property
            if (util.isString(items)) {
                const path = items;
                items = {
                    dependencies: [path],
                    source: (data) => {
                        const { value } = data.dependencies[path];
                        if (Array.isArray(value)) {
                            return value.map(item => {
                                if (util.isString(item)) {
                                    return {
                                        value: item,
                                        content: item
                                    }
                                } else {
                                    return item;
                                }
                            })
                        }
                        return [];
                    }
                };
            }

            // Check if items array has incorrect format (i.e an array of strings).
            if (Array.isArray(items) && !util.isObject(items[0])) {
                // Transform each array item into the { value: [value], content: [content] } object.
                items = util.toArray(items).map(function(item) {
                    return { value: item, content: item };
                });
            }

            if (items.source) {
                options._optionsSource = items;
                options.items = [];
            } else {
                // export result as 'items'
                options.items = items;
            }
        }

    },

    renderFieldContent: function(options, path, value) {

        var fieldHtml;

        // Give the outside world a chance to render the field.
        // It is the responsibility of the programmer to call `updateCell()` whenever the custom field changes value.
        if (util.isFunction(this.options.renderFieldContent)) {

            fieldHtml = this.options.renderFieldContent(options, path, value, this);
            if (fieldHtml) {
                return $(fieldHtml).attr({
                    'data-attribute': path,
                    'data-type': options.type,
                    'data-custom-field': true
                });
            }
        }

        var widget;
        var selectedIndex;
        var originalSelection;
        var $label;

        // Note that widgets might also have special ways of reporting changed values.
        switch (options.type) {

            case 'select-box':
                selectedIndex = util.toArray(options.items).findIndex(function(option) {
                    var optionValue = option.value;
                    var modelValue = value;
                    if (optionValue === undefined && option.content === modelValue) return true;
                    var key = options.key;
                    if (key) {
                        modelValue = util.getByPath(modelValue, key, '/');
                        optionValue = util.getByPath(optionValue, key, '/');
                    }
                    return util.isEqual(optionValue, modelValue);
                });
                var selectBoxOptions = util.assign({
                    theme: this.options.theme,
                    target: this.options.container
                }, util.omit(options, 'type', 'group', 'index', 'selectBoxOptionsClass', 'options'), {
                    options: options.items,
                    selected: selectedIndex,
                    // add special class name on select-box options that originates from the inspector
                    selectBoxOptionsClass: [
                        util.addClassNamePrefix('inspector-select-box-options'),
                        options.selectBoxOptionsClass
                    ].filter(function(item) {
                        return !!item;
                    }).join(' ')
                });
                widget = new SelectBox(selectBoxOptions);
                widget.$el.attr({
                    'data-attribute': path,
                    'data-type': options.type,
                    'data-overwrite': options.overwrite
                });
                widget.render();
                $label = this.renderOwnLabel(options, path);
                fieldHtml = $('<div/>').append($label, widget.el);

                // In `previewMode`, cell gets updated when the user hovers
                // over the options in the select box. However, the final
                // value is reset only when the user selects an option.
                if (options.previewMode) {

                    originalSelection = widget.selection;

                    widget.on('options:mouseout close', function() {
                        widget.selection = originalSelection;
                        this.processInput(widget.$el, { previewCancel: true, dry: true });
                    }, this);

                    widget.on('option:hover', function(option, index) {
                        widget.selection = option;
                        // Update the cell in `dry` run. `dry` run gives hint to the
                        // outside application that even though the model updated,
                        // we don't have to e.g. store the change into DB.
                        this.processInput(widget.$el, { dry: true });
                    }, this);

                    widget.on('option:select', function(option, index) {
                        var originalValue = originalSelection === undefined ? undefined : widget.getSelectionValue(originalSelection);
                        var newValue = widget.getSelectionValue(option);
                        // If the original value equals the new value, run the update
                        // in `dry` mode as there is no need to tell the outside application
                        // that the model has changed (and possibly needs to be updated in e.g. a DB).
                        var dry = originalValue === newValue;
                        // `previewDone` is only used internally inside ui.Inspector
                        // to tell the `setProperty()` method that it should trigger
                        // a change event.
                        this.processInput(widget.$el, {
                            previewDone: true,
                            dry: dry,
                            originalValue: originalValue
                        });
                        originalSelection = option;
                    }, this);

                } else {

                    widget.on('option:select', function(option, index) {
                        this.processInput(widget.$el);
                    }, this);
                }

                if (options._optionsSource) {
                    this.sourceService.add(path, options._optionsSource, (itemsArray) => {
                        const currentValue = this.getModel().prop(path);
                        let selectedIndex = itemsArray.findIndex((option) => {
                            var optionValue = option.value;
                            var modelValue = currentValue;
                            if (optionValue === undefined && option.content === modelValue) return true;
                            var key = options.key;
                            if (key) {
                                modelValue = util.getByPath(modelValue, key, '/');
                                optionValue = util.getByPath(optionValue, key, '/');
                            }
                            return util.isEqual(optionValue, modelValue);
                        });
                        if (selectedIndex === -1) {
                            selectedIndex = undefined;
                        }

                        widget.setOptions(itemsArray, selectedIndex);
                    });
                }

                this.widgets[path] = widget;
                break;

            case 'color-palette':
                selectedIndex = util.toArray(options.items).findIndex(function(option) {
                    if (option.value === value) return true;
                    if (option.value === undefined && option.content === value) return true;
                    return false;
                });
                var colorPaletteOptions = util.assign({
                    theme: this.options.theme,
                    target: this.options.container
                }, util.omit(options, 'type', 'group', 'index', 'options'), {
                    options: options.items,
                    selected: selectedIndex
                });
                widget = new ColorPalette(colorPaletteOptions);
                widget.$el.attr({
                    'data-attribute': path,
                    'data-type': options.type
                });
                widget.render();
                $label = this.renderOwnLabel(options, path);
                fieldHtml = $('<div/>').append($label, widget.el);

                // In `previewMode`, cell gets updated when the user hovers
                // over the options in the color palette. However, the final
                // value is reset only when the user selects an option.
                if (options.previewMode) {

                    originalSelection = widget.selection;

                    widget.on('options:mouseout close', function() {
                        widget.selection = originalSelection;
                        this.processInput(widget.$el, { previewCancel: true, dry: true });
                    }, this);

                    widget.on('option:hover', function(option, index) {
                        widget.selection = option;
                        this.processInput(widget.$el, { dry: true });
                    }, this);

                    widget.on('option:select', function(option, index) {
                        var originalValue = originalSelection === undefined ? undefined : widget.getSelectionValue(originalSelection);
                        var newValue = widget.getSelectionValue(option);
                        // If the original value equals the new value, run the update
                        // in `dry` mode as there is no need to tell the outside application
                        // that the model has changed (and possibly needs to be updated in e.g. a DB).
                        var dry = (originalValue === newValue);
                        // `previewDone` is only used internally inside ui.Inspector
                        // to tell the `setProperty()` method that it should trigger
                        // a change event.
                        this.processInput(widget.$el, {
                            previewDone: true,
                            dry: dry,
                            originalValue: originalValue
                        });
                        originalSelection = option;
                    }, this);

                } else {

                    widget.on('option:select', function(option, index) {
                        this.processInput(widget.$el);
                    }, this);
                }

                if (options._optionsSource) {
                    this.sourceService.add(path, options._optionsSource, (itemsArray) => {
                        const currentValue = this.getModel().prop(path);
                        let selectedIndex = itemsArray.findIndex((option) => {
                            if (option.value === currentValue) return true;
                            if (option.value === undefined && option.content === currentValue) return true;
                            return false;
                        });
                        if (selectedIndex === -1) {
                            selectedIndex = undefined;
                        }

                        widget.setOptions(itemsArray, selectedIndex);
                    });
                }

                this.widgets[path] = widget;
                break;

            case 'select-button-group': {
                var getSelection = (optionsList, value) => {
                    var selectedIndex;
                    var selected;
                    var items = util.toArray(optionsList);

                    if (options.multi) {
                        // SelectButtonGroup expects empty array selection value if multi: true
                        // And there are no selected elements
                        selectedIndex = [];
                        selected = [];
                        items.forEach(function(option, idx) {
                            var val1 = option.value === undefined ? option.content : option.value;
                            var key = options.key;
                            if (key) val1 = util.getByPath(val1, key, '/');
                            var containsOption = util.toArray(value).find(function(val2) {
                                if (key) val2 = util.getByPath(val2, key, '/');
                                return util.isEqual(val1, val2);
                            });
                            if (containsOption) {
                                selected.push(option);
                                selectedIndex.push(idx);
                            }
                        });
                    } else {
                        // SelectButtonGroup expects undefined selection value if multi: false
                        // And there is no selected element
                        selected = undefined;
                        selectedIndex = items.findIndex(function(option) {
                            var optionValue = option.value;
                            var modelValue = value;
                            if (optionValue === undefined && option.content === modelValue) return true;
                            var key = options.key;
                            if (key) {
                                modelValue = util.getByPath(modelValue, key, '/');
                                optionValue = util.getByPath(optionValue, key, '/');
                            }
                            return util.isEqual(optionValue, modelValue);
                        });
                        if (selectedIndex > -1) {
                            selected = items[selectedIndex];
                        }
                    }

                    return {
                        selectedIndex,
                        selected
                    };
                }
                var selectButtonGroupOptions = util.assign({
                    theme: this.options.theme
                }, util.omit(options, 'type', 'group', 'index', 'options'), {
                    options: options.items,
                    // Get selection with the current options list
                    selected: getSelection(options.items, value).selectedIndex
                });
                widget = new SelectButtonGroup(selectButtonGroupOptions);
                widget.$el.attr({
                    'data-attribute': path,
                    'data-type': options.type,
                    'data-overwrite': options.overwrite
                });
                widget.render();
                $label = this.renderOwnLabel(options, path);
                fieldHtml = $('<div/>').append($label, widget.el);

                // In `previewMode`, cell gets updated when the user hovers
                // over the options in the color palette. However, the final
                // value is reset only when the user selects an option.
                if (options.previewMode) {

                    originalSelection = widget.selection;

                    widget.on('mouseout', function() {
                        widget.selection = originalSelection;
                        this.processInput(widget.$el, { previewCancel: true, dry: true });
                    }, this);

                    widget.on('option:hover', function(option, index) {
                        if (options.multi) {
                            widget.selection = util.uniq(widget.selection.concat([option]));
                        } else {
                            widget.selection = option;
                        }
                        this.processInput(widget.$el, { dry: true });
                    }, this);

                    widget.on('option:select', function(selection, index) {
                        var originalValue = originalSelection === undefined ? undefined : widget.getSelectionValue(originalSelection);
                        var newValue = widget.getSelectionValue(selection);
                        // If the original value equals the new value, run the update
                        // in `dry` mode as there is no need to tell the outside application
                        // that the model has changed (and possibly needs to be updated in e.g. a DB).

                        var dry = util.isEqual(originalValue, newValue);
                        // `previewDone` is only used internally inside ui.Inspector
                        // to tell the `setProperty()` method that it should trigger
                        // a change event.
                        this.processInput(widget.$el, {
                            previewDone: true,
                            dry: dry,
                            originalValue: originalValue
                        });
                        originalSelection = selection;
                    }, this);

                } else {

                    widget.on('option:select', function(option, index) {
                        this.processInput(widget.$el);
                    }, this);
                }

                if (options._optionsSource) {
                    this.sourceService.add(path, options._optionsSource, (itemsArray) => {
                        const currentValue = this.getModel().prop(path);
                        // Get selection with the new options list
                        var selection = getSelection(itemsArray, currentValue).selected;

                        widget.setOptions(itemsArray, selection);
                    });
                }

                this.widgets[path] = widget;
                break;
            }
            case 'radio-group': {
                const radioGroupOptions = util.assign({
                    theme: this.options.theme
                }, util.omit('type', 'group', 'index', 'options'), {
                    name: path
                });

                const radioGroup = new RadioGroup(radioGroupOptions);
                radioGroup.render();

                radioGroup.el.setAttribute('data-attribute', path);
                radioGroup.el.setAttribute('data-type', options.type);
                if (options.overwrite) {
                    radioGroup.el.setAttribute('data-overwrite', options.overwrite);
                }

                $label = this.renderOwnLabel(options, path);
                fieldHtml = $('<div/>').append($label, radioGroup.el);

                radioGroup.selectByValue(value);
                radioGroup.on('option:select', (value) => {
                    this.processInput(radioGroup.$el);
                });

                if (options._optionsSource) {
                    this.sourceService.add(path, options._optionsSource, (options) => {
                        radioGroup.setOptions(options);
                    });
                }
                this.widgets[path] = radioGroup;
                break;
            }

            default:
                fieldHtml = this.renderOwnFieldContent({
                    options: options,
                    type: options.type,
                    overwrite: options.overwrite,
                    label: options.label || path,
                    attribute: path,
                    value: value
                });
        }

        return fieldHtml;
    },

    renderGroup: function(opt) {

        opt = opt || {};

        var $group = $('<div/>')
            .addClass('group')
            .attr('data-name', opt.name);

        var $label = $('<h3/>')
            .addClass('group-label')
            .text(opt.label || opt.name);

        return $group.append($label);
    },

    renderOwnLabel: function(options, path) {

        var label;
        var customRenderFn = this.options.renderLabel;
        if (typeof customRenderFn === 'function') {
            label = customRenderFn(options, path, this);
        }
        if (label !== undefined) {
            return $(label);
        }

        // Default label
        // the different behavior below is kept for backwards compatibility
        switch (options.type) {
            case 'select-box':
            case 'color-palette':
            case 'select-button-group':
                return $('<label/>').html(options.label || path);
            default:
                return $('<label/>').text(options.label || path);
        }
    },

    renderOwnFieldContent: function(opt) {

        var content, $input, $wrapper, $output, $units, $button, $nest, $label;

        $label = this.renderOwnLabel(opt.options, opt.attribute);

        switch (opt.type) {

            case 'number':

                $input = $('<input/>', {
                    type: 'number',
                    min: opt.options.min,
                    max: opt.options.max,
                    step: opt.options.step
                }).val(opt.value);

                content = [$label, $('<div/>').addClass('input-wrapper').append($input)];
                break;

            case 'range':

                $label.addClass('with-output');
                $output = $('<output/>').text(opt.value);
                $units = $('<span/>').addClass('units').text(opt.options.unit);
                $input = $('<input/>', {
                    type: 'range',
                    name: opt.type,
                    min: opt.options.min,
                    max: opt.options.max,
                    step: opt.options.step
                }).val(opt.value);

                $input.on('change input', function() {
                    $output.text($input.val());
                });

                content = [$label, $output, $units, $input];
                break;

            case 'textarea':

                $input = $('<textarea/>').text(opt.value);

                content = [$label, $('<div/>').addClass('input-wrapper').append($input)];
                break;

            case 'content-editable': {

                const { value, options = {}} = opt;
                const {
                    html = true,
                    readonly = false
                } = options;

                let editableContent;
                if (util.isString(value)) {
                    const safeValue = (html)
                        ? util.sanitizeHTML(value)
                        : this.encodeHTMLEntities(value)
                    // replace the newline characters with the line-break tags
                    editableContent = safeValue.replace(/\n/g, '<br>');
                } else {
                    editableContent = '';
                }

                $input = $('<div/>')
                    .prop('contenteditable', !readonly)
                    .toggleClass('content-editable-readonly', Boolean(readonly))
                    .css('display', 'inline-block') // Chrome would use <div> instead of <p> for the new line otherwise.
                    .html(editableContent)
                    .on('blur', this.onContentEditableBlur);

                content = [$label, $('<div/>').addClass('input-wrapper').append($input)];
                break;
            }

            case 'select':

                var items = opt.options.items;
                $input = $('<select/>');

                if (opt.options.multiple) {
                    // multiple select allows specify via `size` number of items
                    // to be displayed in the scrollable list.
                    $input.prop({
                        size: opt.options.size || items.length,
                        multiple: true
                    });
                }

                var selected = function(itemValue) {

                    if (opt.options.multiple) {
                        return util.toArray(opt.value).find(function(val) {
                            return util.isEqual(itemValue, val);
                        });
                    }
                    return util.isEqual(itemValue, opt.value);

                };

                util.toArray(items).forEach(function(item) {

                    var $option = $('<option/>', { value: item.value }).text(item.content);

                    if (selected(item.value)) {
                        $option.attr('selected', 'selected');
                    }

                    $input.append($option);
                });

                if (opt.options._optionsSource) {
                    this.sourceService.add(opt.attribute, opt.options._optionsSource, (itemsArray) => {
                        $input.empty();

                        const currentValue = this.getModel().prop(opt.attribute);
                        const isSelected = (value) => {
                            if (opt.options.multiple) {
                                return util.toArray(currentValue).find(function(val) {
                                    return util.isEqual(value, val);
                                });
                            }
                            return util.isEqual(value, currentValue);
                        }

                        itemsArray.forEach((item) => {
                            var $option = $('<option/>', { value: item.value }).text(item.content);

                            if (isSelected(item.value)) {
                                $option.attr('selected', 'selected');
                            }

                            $input.append($option);
                        });
                    });
                }

                content = [$label, $input];
                break;

            case 'toggle':

                $button = $('<span><i/></span>');
                $input = $('<input/>', { type: 'checkbox' }).prop('checked', !!opt.value);
                $wrapper = $('<div/>').addClass(opt.type);

                content = [$label, $wrapper.append($input, $button)];
                break;

            case 'color':

                $input = $('<input/>', { type: 'color' }).val(opt.value);

                content = [$label, $input];
                break;

            case 'text':

                $input = $('<input/>', { type: 'text' }).val(opt.value);

                content = [$label, $('<div/>').addClass('input-wrapper').append($input)];
                break;

            case 'object':

                $input = $('<div/>');
                $nest = $('<div/>').addClass('object-properties');

                content = [$label, $input.append($nest)];
                break;

            case 'list':

                $button = $('<button/>').addClass('btn-list-add').text(opt.options.addButtonLabel || '+');
                $nest = $('<div/>').addClass('list-items');
                $input = $('<div/>');

                content = [$label, $input.append($button, $nest)];
                break;
        }

        if ($input) {
            $input.addClass(opt.type).attr({
                'data-type': opt.type,
                'data-attribute': opt.attribute,
                'data-overwrite': opt.overwrite
            });
        }

        // A little trick how to convert an array of jQuery elements
        // to a jQuery object.
        return $.fn.append.apply($('<div>'), content).children();
    },

    onContentEditableBlur: function(evt) {

        // Workaround for Webkit content editable focus bug
        // https://gist.github.com/shimondoodkin/1081133

        var $editableFix = $('<input/>', {
            disabled: true,
            tabIndex: -1,
            style: {
                width: '1px',
                height: '1px',
                border: 'none',
                margin: 0,
                padding: 0
            }
        }).appendTo(this.$el);

        $editableFix.focus();
        $editableFix[0].setSelectionRange(0, 0);
        $editableFix.blur().remove();

        $(evt.target).trigger('change');
    },

    replaceHTMLEntity: function(entity, code) {

        return this.HTMLEntities[code] || '';
    },

    encodeHTMLEntities: function(str) {
        return str.replace(/[\u00A0-\u9999<>&]/g, function(i) {
            return `&#${i.charCodeAt(0)};`;
        });
    },

    renderObjectProperty: function(opt) {

        opt = opt || {};

        var $objectProperty = $('<div/>', {
            'data-property': opt.property,
            'class': 'object-property'
        });

        return $objectProperty;
    },

    renderListItem: function(opt) {

        opt = opt || {};

        var $button = $('<button/>').addClass('btn-list-del').text(opt.options.removeButtonLabel || '-');
        var $listItem = $('<div/>', {
            'data-index': opt.index,
            'class': 'list-item'
        });

        return $listItem.append($button);
    },

    renderFieldContainer: function(opt) {

        opt = opt || {};

        var $field = $('<div/>', {
            'data-field': opt.path,
            'class': 'field ' + opt.type + '-field'
        });

        return $field;
    },

    renderTemplate: function($el, options, path, opt) {

        $el = $el || this.$el;
        opt = opt || {};

        // Prepare rendering of `'select'` elements that refer to cell for their options.
        this.resolveBindings(options);

        // If this field is a generic object, treat is as a non-generic object where `options` are properties.
        if (typeof options.type !== 'string') {
            // Normally, generic objects are flattened when encountered inside a non-generic object, so we do not get here.
            // However, there are two situations in which that does not happen:
            // - There is a generic object directly in the Inspector's `inputs` definition.
            // - There is a generic object directly in a list's `item` definition.
            options = { type: 'object', properties: options };
        }

        // Wrap the input field into a `.field` classed div.
        // This will allow us to hide and show entire blocks in `this.updateFieldsVisibility()`.
        // (Which needs us to save all fields into `this._byPath` in `this.cacheInputs()`.)
        const $field = this.renderFieldContainer({ path: path, type: options.type });
        if (opt.hidden) {
            $field.addClass('hidden');
        }
        // This must never get a `path` with a placeholder!
        const value = this.getCellAttributeValue(path, options);
        const $input = this.renderFieldContent(options, path, value);
        $field.append($input);

        // The `attrs` option allows us to set arbitrary attributes on the generated HTML.
        // This object is of the form: `<selector> : { <attributeName> : <attributeValue>, ... }`
        util.setAttributesBySelector($field, options.attrs);

        // If this field is a list or an object, we need recursion.
        if ((options.type === 'list') && options.item) {
            // Create all nested fields.
            util.toArray(value).forEach(function(itemValue, index) {
                const $listItem = this.renderListItem({ index, options });
                // Recursion: Call `renderTemplate` for list item.
                this.renderTemplate($listItem, options.item, path + '/' + index);
                $input.children('.list-items').append($listItem);
            }, this);

            // Toggle the list's "add" and "delete" buttons.
            const numItems = (value && value.length);
            const min = (options && options.min);
            const max = (options && options.max);
            this.fixListButtons($input, numItems, min, max);

        } else if ((options.type === 'object') && options.properties ) {
            // Condense generic objects on the path into a '/' separated path.
            // End flattening at anything that has a `type` (object, list, input field).
            const flatAttributes = this.flattenInputs(options.properties);

            // Assign current `path` to every attribute so that we can access it later.
            let attributesArray = Object.keys(flatAttributes).map(function(attributePath) {
                const attributeOptions = flatAttributes[attributePath];
                attributeOptions.path = attributePath;
                return attributeOptions;
            });

            // Sort attributes by `index`.
            attributesArray = util.sortBy(attributesArray, function(options) {
                return options.index;
            });

            // Create all nested fields.
            attributesArray.forEach(function(attribute) {
                const $objectProperty = this.renderObjectProperty({ property: attribute.path });
                // Recursion: Call `renderTemplate` for every object property.
                this.renderTemplate($objectProperty, attribute, path + '/' + attribute.path);
                $input.children('.object-properties').append($objectProperty);
            }, this);
        }

        if (opt.replace) {
            // We are trying to re-render the field.
            // Find the existing field on `$el` and replace with the one we just made.
            $el.find('[data-field="' + path + '"]').replaceWith($field);
        } else {
            // Add the new field to `$el`.
            $el.append($field);
        }
    },

    updateInputPosition: function() {

        var $inputX = this._byPath['position/x'];
        var $inputY = this._byPath['position/y'];

        var position = this.getModel().get('position');

        if ($inputX) {
            $inputX.val(position.x);
        }
        if ($inputY) {
            $inputY.val(position.y);
        }
    },

    updateInputSize: function() {

        var $inputWidth = this._byPath['size/width'];
        var $inputHeight = this._byPath['size/height'];

        var size = this.getModel().get('size');

        if ($inputWidth) {
            $inputWidth.val(size.width);
        }
        if ($inputHeight) {
            $inputHeight.val(size.height);
        }
    },

    updateInputAngle: function() {

        var $inputAngle = this._byPath['angle'];

        var angle = this.getModel().get('angle');

        if ($inputAngle) {
            $inputAngle.val(angle);
        }
    },

    validateInput: function(type, input, path) {

        // It is assumed custom widgets have their own validation setup.
        switch (type) {

            case 'select-box':
            case 'color-palette':
                var widget = this.widgets[path];
                if (!widget) return false;
                // Does not allow to write an null/default value to the cell
                return widget.getSelectionIndex() !== -1;
            case 'select-button-group':
                return !!this.widgets[path];
            default:
                return this.options.validateInput(input, path, type, this);
        }
    },

    refreshSources: function() {
        this.sourceService.refreshAll();
    },

    refreshSource: function(path) {
        this.sourceService.refresh(path);
    },

    focusField: function(path) {
        const options = this.getOptionsFromPath(path);
        const element = this._byPath[path];

        if (element) {
            this._focusFieldInternal(options, path, element[0]);
        } else {
            throw 'path not found';
        }
    },

    _focusListField(options, path, element) {
        const listElement = element.querySelector('[data-attribute]:not(.hidden)');
        if (listElement) {
            this._focusFieldInternal(options.item, listElement.getAttribute('data-attribute'), listElement);
        }
    },

    _focusObjectField(options, path, element) {
        const firstField = element.querySelector('[data-attribute]:not(.hidden)');
        if (firstField) {
            const fieldPath = firstField.getAttribute('data-attribute');
            const fieldOptions = this.getOptionsFromPath(fieldPath);
            this._focusFieldInternal(fieldOptions, fieldPath, firstField);
        }
    },

    _focusFieldInternal(options, path, element) {
        switch (options.type) {
            case 'number':
            case 'text':
            case 'range':
            case 'color':
            case 'toggle':
            case 'select':
            case 'textarea':
            case 'content-editable':
                element.focus();
                break;
            case 'object':
                this._focusObjectField(options, path, element);
                break;
            case 'list':
                this._focusListField(options, path, element);
                break;
            default:
                if (this.options.focusField) {
                    this.options.focusField(options, path, element, this);
                }
                break;
        }
    },

    onChangeInput: function(evt) {

        if (evt.target === evt.currentTarget) {
            this.processInput($(evt.target));
        }
    },

    processInput: function($input, opt) {

        var path = $input.attr('data-attribute');
        var type = $input.attr('data-type');

        if (!this.validateInput(type, $input[0], path)) {
            // The input value is not valid. Do nothing.
            return;
        }

        if (this.options.live) {
            this.updateCell($input, path, opt);
        }

        var rawValue = this.getFieldValue($input[0], type);
        var value = this.parse(type, rawValue, $input[0]);

        if (!opt || !opt.dry) {
            this.dependencyService.changed(path);
        }

        // Notify the outside world that an input has changed.
        this.trigger('change:' + path, value, $input[0], opt);
    },

    // update visibility of all rendered fields
    // update all bindings and all dependants
    // assumes that `this._attributeKeysInUse` exists = that `render()` and `cacheInputs()` have been run
    updateFieldsVisibility: function() {
        this._attributeKeysInUse.forEach(path => {
            this.updateDependants(path);
        });
    },

    // update everything that depends on attribute at `path`
    // assumes that `this._byPath` exists = that `render()` and `cacheInputs()` have been run
    updateDependants: function(path) {

        // expressions that may use the attribute
        const dependantPathDict = this._when;
        const dependantPaths = Object.keys(dependantPathDict);

        // fields that may be affected by the attribute
        const attributePathDict = this._byPath;
        const attributePaths = Object.keys(attributePathDict);

        const flatAttributes = this.flatAttributes;

        // Go through all the inputs that are dependent on the value of the changed input.
        // Show them if the 'when' expression is evaluated to 'true'. Hide them otherwise.

        // account for paths with wildcard chunks in `this._when` (path)
        // (introduced by expressions with a relative path pointing into a list)
        const filteredDependantPaths = filterDependantPaths.call(this, dependantPaths, path);
        filteredDependantPaths.forEach((filteredDependantPathData) => {
            const filteredDependantPath = filteredDependantPathData.path;
            //const pathWildcardValues = filteredDependantPathData.pathWildcardValues;

            const dependants = util.toArray(dependantPathDict[filteredDependantPath]);
            dependants.forEach((dependant) => {
                const dependantPath = dependant.path;

                const dependantExpression = dependant.expression;
                const bareExpression = this._getBareExpression(dependantExpression);
                const expressionExtras = this._getExpressionExtras(dependantExpression);

                // account for paths with `null` chunks in `dependantPath` (comparison path)
                // (introduced by expressions with an absolute path within a list)
                const filteredPaths = filterPaths(attributePaths, dependantPath);
                filteredPaths.forEach((filteredPathData) => {
                    const filteredPath = filteredPathData.path;
                    const comparisonWildcardValues = filteredPathData.comparisonWildcardValues;

                    const $attribute = attributePathDict[filteredPath];
                    const $field = $attribute.closest('.field');
                    const previouslyHidden = $field.hasClass('hidden');

                    // fix the bare expression to refer to actual `path`
                    const fixedExpression = fixDependantExpression.call(this, bareExpression, comparisonWildcardValues);
                    const valid = this.isExpressionValid(fixedExpression);

                    $field.toggleClass('hidden', !valid);

                    // unset option - works only with 'live' inspector
                    const otherwise = expressionExtras.otherwise;
                    if (otherwise && otherwise.unset && this.options.live) {
                        if (!valid) {
                            // The attribute just switched from visible to hidden.
                            // Unset its value on the model.
                            this.unsetProperty(filteredPath);

                            // Re-render the field.
                            // The attribute at dependant path may be inside a nested object or list.
                            const attribute = getAttribute(flatAttributes, filteredPath);
                            if (attribute) {
                                this.renderTemplate(null, attribute, filteredPath, { replace: true, hidden: true });
                            }
                            this.afterPartialRender([filteredPath]);

                        } else if (previouslyHidden) {
                            // The attribute just switched from hidden to visible.
                            // We set its value according to model.
                            // (In case it has been unset earlier.)
                            this.updateCell($attribute, filteredPath);
                        }
                    }
                }, this)
            }, this);
        }, this);

        function fixDependantExpression(bareExpression, wildcardValues) {
            // for example, `bareExpression = { eq: { 'foo': true }}` (primitive)
            // or `bareExpression = { not: { eq: { 'foo': true }}}` (unary operation)
            // or `bareExpression = { and: [{ eq: { 'foo': true }}, { eq: { 'bar': true }}]}` (multiary operation)
            const fixedExpression = {};
            // there should be only one key in `bareExpression` but we don't know its name
            // `for...in` loop is the easiest way to access it (= `exprKey`)
            for (const exprKey in bareExpression) {
                const exprVal = bareExpression[exprKey];
                if (Array.isArray(exprVal)) {
                    // `exprKey` is a multiary operator
                    const operator = exprKey;
                    const operands = exprVal;
                    // for example, `operator = 'and'`
                    // and `operands = [{ eq: { 'foo': true }}, { eq: { 'bar': true }}]`
                    fixedExpression[operator] = [];
                    const numOperands = operands.length;
                    for (let i = 0; i < numOperands; i++) {
                        const operand = operands[i];
                        // for example, `operand = { eq: { 'foo': true }}`
                        // recursion: `operand` may be a primitive or a composite expression
                        const fixedOperand = fixDependantExpression.call(this, operand, wildcardValues);
                        // push the fixed operand into fixed expression array at `operator`:
                        fixedExpression[operator].push(fixedOperand);
                    }
                } else if (this._isComposite(bareExpression)) {
                    // `exprKey` is a unary operator (= 'not' operator)
                    const operator = exprKey;
                    const operand = exprVal;
                    // for example, `operator = 'not'`
                    // and `operand = { eq: { 'foo': true }}`
                    // recursion: `operand` may be a primitive or a composite expression
                    const fixedOperand = fixDependantExpression.call(this, operand, wildcardValues);
                    fixedExpression[operator] = fixedOperand;
                } else {
                    // `bareExpression` is a primitive expression
                    const primitiveKey = exprKey;
                    const primitiveVal = exprVal;
                    // modify `fixedExpression`:
                    fixPrimitive.call(this, primitiveKey, primitiveVal, wildcardValues, fixedExpression);
                }
            }
            return fixedExpression;

            function fixPrimitive(primitiveKey, primitiveVal, wildcardValues, output) {
                // for example, `primitiveKey = 'eq'`
                // and `primitiveVal = { 'foo': true }`
                output[primitiveKey] = {};
                // there should be only one key in `primitiveVal` but we don't know its name
                // `for...in` loop is the easiest way to access it (= `condPath`)
                for (const condPath in primitiveVal) {
                    const condVal = primitiveVal[condPath];
                    // for example, `condPath = 'foo'`
                    // and `condVal = true`
                    // fix `condPath` by substituting provided `wildcardValues` at appropriate places
                    const newCondPath = substituteWildcardValues.call(this, condPath, wildcardValues);
                    output[primitiveKey][newCondPath] = condVal;
                }
                // no return, modifications were done directly into provided `output` reference

                function substituteWildcardValues(genericPath, wildcardValues) {
                    const pathWildcard = this.pathWildcard || this.DEFAULT_PATH_WILDCARD;
                    const fixedChunks = [];
                    let wildcardIndex = 0;
                    const pathChunks = genericPath.split('/');
                    const numPathChunks = pathChunks.length;
                    for (let i = 0; i < numPathChunks; i++) {
                        let currentChunk = pathChunks[i];
                        if (currentChunk === pathWildcard) {
                            currentChunk = wildcardValues[wildcardIndex] || pathWildcard;
                            wildcardIndex += 1;
                        }
                        fixedChunks.push(currentChunk);
                    }
                    return fixedChunks.join('/');
                }
            }
        }

        function filterDependantPaths(dependantPaths, comparisonPath) {
            // `comparisonPath` is a string
            // return an array of objects:
            // - path: `dependantPaths` which conform to `comparisonPath`
            // - pathWildcardValues: list indices which were substituted for wildcard chunks

            const comparisonChunks = comparisonPath.split('/');
            // `pathWildcard` is a wildcard for path chunks (every comparison chunk is equal to it)
            const pathWildcard = this.pathWildcard || this.DEFAULT_PATH_WILDCARD
            return compareChunks(dependantPaths, comparisonChunks, { pathWildcard });
        }

        function filterPaths(paths, comparisonPath) {
            // `comparisonPath` is a string or Array<string|null>
            // return an array of objects
            // - path: `paths` which conform to `comparisonPath`
            // - comparisonWildcardValues: list indices which were substituted for wildcard chunks

            // if `comparisonPath` is a string:
            if (!Array.isArray(comparisonPath)) {
                return [{
                    path: comparisonPath,
                    pathWildcardValues: [],
                    comparisonWildcardValues: []
                }];
            }
            // else: `comparisonPath` is actually an array
            const comparisonChunks = comparisonPath;
            // if `comparisonChunks` do not contain any `null` chunk (= wildcard):
            // array notation is not needed, convert to string notation
            if (comparisonChunks.indexOf(null) === -1) {
                return [{
                    path: comparisonChunks.join('/'),
                    pathWildcardValues: [],
                    comparisonWildcardValues: []
                }];
            }
            // else: `comparisonChunks` contain a `null` chunk
            // compare each path in `pathDict` to `comparisonChunks`
            // `null` is a wildcard for comparison chunks (every path chunk is equal to it)
            return compareChunks(paths, comparisonChunks, { comparisonWildcard: null });
        }

        function compareChunks(paths, comparisonChunks, opt) {
            const { pathWildcard, comparisonWildcard } = opt;
            const filteredPaths = []; // result array = paths that conform to `comparisonPath`
            const numComparisonChunks = comparisonChunks.length;
            const numPaths = paths.length;
            for (let i = 0; i < numPaths; i++) {
                const currentPath = paths[i];
                const pathChunks = getPathChunks(currentPath);
                const numPathChunks = pathChunks.length;
                // if the number of path chunks doesn't match, skip to next path
                if (numPathChunks !== numComparisonChunks) continue;
                // else: the number of path chunks matches
                // compare path chunks one by one
                let isEqual = true;
                const pathWildcardValues = [];
                const comparisonWildcardValues = [];
                for (let j = 0; j < numPathChunks; j++) {
                    const currentChunk = pathChunks[j];
                    const comparisonChunk = comparisonChunks[j];
                    const isPathWildcard = (currentChunk === pathWildcard);
                    const isComparisonWildcard = (comparisonChunk === comparisonWildcard);
                    // does `currentChunk` equal `comparisonChunk`?
                    // if any chunk doesn't equal, skip out of comparison
                    if ((currentChunk !== comparisonChunk) && !isPathWildcard && !isComparisonWildcard) {
                        isEqual = false;
                        break;
                    }
                    // if we encountered a wildcard chunk, save the value of the other chunk
                    if (isPathWildcard) {
                        pathWildcardValues.push(comparisonChunk);
                    } else if (isComparisonWildcard) {
                        comparisonWildcardValues.push(currentChunk);
                    }
                }
                // if all chunks are equal, add `currentPath` to result array
                if (isEqual) {
                    filteredPaths.push({
                        path: currentPath,
                        pathWildcardValues,
                        comparisonWildcardValues
                    });
                }
            }
            return filteredPaths;

            function getPathChunks(pathToSplit) {
                // split string paths to an array, keep array paths untouched
                if (!Array.isArray(pathToSplit)) return pathToSplit.split('/');
                return pathToSplit;
            }
        }

        function getAttribute(attributes, path) {
            // if the path is flat, and leads to an attribute, return it (shortcut)
            let attribute = attributes[path];
            if (attribute != null) return attribute;
            // else: path is not flat
            // that must mean that the path points into an object, a list, or a generic object
            // find the definition that corresponds to our path
            const pathChunks = path.split('/');
            const numPathChunks = pathChunks.length;
            // start with the flat attribute
            let currentCompositePath = pathChunks[0];
            attribute = attributes[currentCompositePath];
            let previouslyFoundAttribute = attribute;
            // continue with the second chunk of the path:
            for (let i = 1; i < numPathChunks; i++) {
                const pathChunk = pathChunks[i];
                if (attribute === undefined) {
                    // we failed to find an attribute at `currentCompositePath` in the previous iteration
                    // - this happens when `currentCompositePath` points into a flattened path
                    // - move one level deeper in the flattened path by appending current `pathChunk`
                    currentCompositePath += '/' + pathChunk;
                    if (previouslyFoundAttribute === undefined) {
                        // the flattened path segment occurs at the very beginning of the path
                        // find attribute within initial `attributes`
                        attribute = attributes[currentCompositePath];
                    } else {
                        // the flattened path segment occurs elsewhere
                        // find attribute within `previouslyFoundAttribute`
                        attribute = previouslyFoundAttribute[currentCompositePath];
                    }
                    continue;
                }
                // else: we have found an attribute in the previous iteration
                previouslyFoundAttribute = attribute;
                // was the previous attribute an object, a list, or a generic object?
                if ((attribute.type === 'object') && attribute.properties) {
                    // the previous attribute was an object
                    // objects have `properties` - go inside
                    // return the property named like the current `pathChunk`
                    attribute = attribute.properties[pathChunk];
                } else if ((attribute.type === 'list') && attribute.item) {
                    // the previous attribute was a list
                    // lists have `item` - the current `pathChunk` must be index
                    // the definition is shared by all indices, so return `item`
                    attribute = attribute.item;
                } else if (typeof attribute.type !== 'string') {
                    // the previous attribute was a generic object
                    // properties are defined immediately in `attribute`
                    // return the property named like the current `pathChunk`
                    attribute = attribute[pathChunk];
                } else {
                    // there is a `type` with a string value among `attribute` properties
                    // = `attribute` is an input field definition
                    // = return `attribute` immediately
                    break;
                }
                // we found an attribute at `currentCompositePath`
                // - reset `currentCompositePath` with current `pathChunk`
                currentCompositePath = pathChunk;
            }
            return attribute;
        }
    },

    // unset a model property
    unsetProperty: function(path, opt) {

        const cell = this.getModel();
        const pathArray = path.split('/');
        const attribute = pathArray[0];
        const followingPath = pathArray.slice(1).join('/');

        opt = opt || {};
        opt.inspector = this.cid;
        opt['inspector_' + this.cid] = true; // kept for backwards compatibility

        if (path === 'attrs') {
            // Unsetting an attrs property requires to re-render the view.
            // The cell.removeAttr() does it for us.
            cell.removeAttr(followingPath, opt);
        } else if (path === attribute) {
            // Unsetting a primitive object. Shortcut.
            cell.unset(attribute, opt);
        } else {
            // Unsetting a nested property.
            var oldValue = cell.get(attribute);
            // if `oldValue === undefined`, then `util.unsetByPath()` may fail
            // - so in that case, short-circuit to `newValue = undefined`
            var newValue = ((oldValue !== undefined) ? util.unsetByPath(oldValue, followingPath, '/') : undefined);
            cell.set(attribute, newValue, opt);
        }
    },

    getOptions: function($attribute) {

        if ($attribute.length === 0) return undefined;
        var path = $attribute.attr('data-attribute');
        return this.getOptionsFromPath(path);
    },

    markForRemoval: function(path, storage) {

        var listPath = this.findParentListByPath(path);

        if (listPath) {
            var itemPath = path.substr(listPath.length + 1);
            var index = parseInt(itemPath, 10);

            if (Number.isFinite(index)) {

                storage['remove'][listPath] = storage['remove'][listPath] || [];
                if (!storage['remove'][listPath].includes(index)) {
                    storage['remove'][listPath].push(index);
                }
            }
        }
    },

    markForUpdate: function(path, storage, value, listPath) {

        var itemPath = path.substr(listPath.length + 1);
        if (storage.update[listPath]) {
            util.setByPath(storage.update[listPath].value, itemPath, value, '/');
        }
    },

    updateCell: function(attrNode, attrPath, opt) {

        var cell = this.getModel();

        var byPath = {};

        if (attrNode) {
            // We are updating only one specific attribute
            byPath[attrPath] = $(attrNode);
        } else {
            // No parameters given. We are updating all attributes
            byPath = this._byPath;
        }

        this.startBatchCommand();

        var valuesByPath = {};

        var listChanges = {
            update: {},
            remove: {}
        };

        util.forIn(byPath, function($attribute, path) {

            if ($attribute.closest('.field').hasClass('hidden')) return;

            var type = $attribute.attr('data-type');
            var overwriteAttr = $attribute.attr('data-overwrite');
            var overwrite = overwriteAttr !== 'false' && overwriteAttr !== undefined;
            var isAdeptForRemoval = $attribute.hasClass('remove');

            switch (type) {

                case 'list':

                    // Do not empty the list (and trigger change event) if we have at
                    // least one item in the list. It is not only desirable but necessary.
                    // An example is when an element has ports. If we emptied the list
                    // and then reconstructed it again, all the links connected to the ports
                    // will get lost as the element with ports will think the ports disappeared
                    // first.
                    if (isAdeptForRemoval) {
                        this.markForRemoval(path, listChanges);
                    }
                    break;

                case 'object':
                    // For objects, all is handled in the actual inputs.
                    if (isAdeptForRemoval) {
                        this.markForRemoval(path, listChanges);
                    }
                    break;

                default:

                    if (!this.validateInput(type, $attribute[0], path)) return;

                    var rawValue = this.getFieldValue($attribute[0], type);
                    var value = this.parse(type, rawValue, $attribute[0]);
                    var options = this.getOptionsFromPath(path);

                    if (options.valueRegExp) {
                        var oldValue = util.getByPath(cell.attributes, path, '/') || options.defaultValue;
                        value = oldValue.replace(new RegExp(options.valueRegExp), '$1' + value + '$3');
                    }

                    if (isAdeptForRemoval) {
                        this.markForRemoval(path, listChanges)
                    } else {
                        var parent = options.parent;
                        if (parent && parent.type === 'object' && parent.overwrite !== undefined && parent.overwrite !== false) {

                            var objectValue = {};
                            var pathArr = path.split('/');
                            var key = pathArr[pathArr.length - 1];
                            objectValue[key] = value;

                            listChanges.update[parent.path] = {
                                value: objectValue,
                                overwrite: true
                            };

                        } else {
                            valuesByPath[path] = { value: value, overwrite: overwrite };
                        }
                    }
                    break;
            }

        }.bind(this));


        // Set all the values on the model.
        util.forIn(valuesByPath, function(val, path) {
            this.setProperty(path, val.value, util.assign({ overwrite: val.overwrite }, opt));
        }.bind(this));

        // list of paths for remove - "deepest" first
        var pathsToRemove = util.sortBy(Object.keys(listChanges.remove), function(item) {
            return item.split('/').length;
        }).reverse();

        // Set all the arrays with all its items on the model now.
        pathsToRemove.forEach(function(path) {
            var indexes = listChanges.remove[path];
            this.removeProperty(path, indexes, util.assign({ rewrite: true }, opt));
        }.bind(this));

        util.forIn(listChanges.update, function(items, list) {
            this.setProperty(list, this.compactDeep(items.value), util.assign({
                rewrite: true,
                overwrite: items.overwrite
            }, opt));
        }.bind(this));

        // Refresh inspector
        this.updateFieldsVisibility();
        this.updateGroupsVisibility();

        this.stopBatchCommand();
    },

    compactDeep: function(items) {

        if (Array.isArray(items)) {
            return items.reduce(function(res, item) {
                if (item) {
                    res.push(this.compactDeep(item))
                }
                return res;
            }.bind(this), [])
        }

        return items;
    },

    // Find the first list on the given path (exclude the list determined by the path itself).
    // @return path
    findParentListByPath: function(path) {

        var pathArray = path.split('/');

        pathArray.pop();

        var inputsPathArray = pathArray;

        while (inputsPathArray.length) {

            var inputOptions = this.getOptionsFromPath(inputsPathArray.join('/'));

            if (inputOptions && inputOptions.type === 'list') {
                return pathArray.slice(0, inputsPathArray.length).join('/');
            }

            inputsPathArray.pop();
        }

        return null;
    },

    getOptionsFromPath: function(path) {

        var pathArray = path.split('/');

        var options = this.expandAttributes;
        var parent;
        var parentPath = [];

        while (pathArray.length) {

            var part;
            var partPrev = part;

            if (options && options.type === 'object') {
                part = 'properties';
            } else {
                part = pathArray.shift();
                if (pathArray.length || options.type === 'list') {
                    parent = options;
                    parentPath.push(part);
                }
            }

            var isNumeric = !Number.isNaN(parseInt(part));
            part = isNumeric && options.type === 'list' ? 'item' : part;

            if (Object(options) === options && (part in options || options[path])) {
                options = options[part] || options[path];
            } else {
                return {};
            }
        }

        options = util.assign({}, options);
        parent = util.assign({}, parent);

        parent.path = parentPath.join('/');
        if (partPrev && partPrev === 'properties') {
            parent.type = 'object';
        }

        options.parent = parent;
        return options;
    },

    getFieldValue: function(attribute, type) {

        if (util.isFunction(this.options.getFieldValue)) {

            var fieldValue = this.options.getFieldValue(attribute, type, this);
            if (fieldValue) {
                return fieldValue.value;
            }
        }

        var $attribute = $(attribute);

        switch (type) {
            case 'select-box':
            case 'color-palette':
            case 'select-button-group':
                var path = $attribute.attr('data-attribute');
                return this.widgets[path].getSelectionValue();
            case 'radio-group': {
                return this.widgets[$attribute.attr('data-attribute')].currentValue;
            }
            case 'content-editable':
                return $attribute.html()
                    // replace newlines for end-of-line tags:
                    // - Chrome, Safari: <br> => \n
                    // - IE: </p> => \n
                    // - IE10 empty line: <p>&nbsp;</p> => <p>\n
                    // - IE11 empty line: <p><br></p> => <p>\n
                    // - Firefox: </div> => \n
                    // - Firefox empty line: <div><br></div> => <div>\n
                    .replace(/((<br\s*\/*>)?<\/div>)|(((&nbsp;)|(<br\s*\/*>))?<\/p>)|(<br\s*\/*>)/ig, '\n')
                    // remove any remaining tags:
                    // - IE: remove all <p> (line beginning)
                    // - Firefox: remove all <div> (line beginning)
                    .replace(/(<([^>]+)>)/ig, '')
                    // replace html entities with plain text:
                    // - mostly convert all various &nbsp; sequences to actual spaces
                    .replace(/&(\w+);/ig, this.replaceHTMLEntity)
                    // remove last newline:
                    .replace(/\n$/, '')
            default:
                return $attribute.val();
        }
    },

    removeProperty: function(path, indexes, opt) {
        var model = this.getModel();
        var prop = dia.Cell.prototype.prop;

        var current = prop.call(model, path);
        if (!current) {
            // this is usual when live == false
            return;
        }

        var updated = current.reduce(function(res, item, i) {
            if (!indexes.includes(i)) {
                res.push(item);
            }
            return res;
        }, []);

        var isTopLevelAttr = this.flatAttributes[path];
        if (Array.isArray(updated) && updated.length === 0 && !isTopLevelAttr) {
            updated = null;
        }

        prop.call(model, path, updated, opt);
    },

    setProperty: function(path, value, opt) {

        opt = opt || {};
        opt.inspector = this.cid;

        // The model doesn't have to be a JointJS cell necessarily. It could be
        // an ordinary Backbone.Model and such would have no method 'prop'.
        var prop = dia.Cell.prototype.prop;
        var model = this.getModel();
        var overwrite = opt.overwrite || false;

        if (opt.previewDone) {
            // If we're finished with the preview mode, first set silently the model property to the value
            // before the preview mode has started. This is because we want the outside application
            // to be able to handle the end of the preview (useful when you don't want to
            // store value changes caused by preview to a DB but only want to store the
            // final value after the preview mode has finished).
            prop.call(model, path, opt.originalValue, { rewrite: true, silent: true });
        }

        if (value === undefined) {

            // Method prop can't handle undefined values in right way.
            // The model attributes would stay untouched if try to
            // set a nested property to undefined.
            dia.Cell.prototype.removeProp.call(model, path, opt);

        } else {

            var updated;

            if (util.isObject(value) && !overwrite) {
                var current = prop.call(model, path);
                var targetType = Array.isArray(value) ? [] : {};
                updated = util.merge(targetType, current, value);
            } else {
                updated = util.clone(value);
            }

            if (overwrite) opt.rewrite = true;
            prop.call(model, path, updated, opt);
        }
    },

    // Parse the input `value` based on the input `type`.
    // Override this method if you need your own specific parsing.
    parse: function(type, value, targetElement) {

        switch (type) {
            case 'number':
            case 'range':
                value = parseFloat(value);
                break;
            case 'toggle':
                value = targetElement.checked;
                break;
        }

        return value;
    },

    startBatchCommand: function() {

        if (!this.inBatch) {
            this.inBatch = true;
            var model = this.getModel();
            if (model instanceof dia.Cell) {
                model.startBatch('inspector', { cid: this.cid });
            }
        }
    },

    stopBatchCommand: function() {

        if (this.inBatch) {
            var model = this.getModel();
            if (model instanceof dia.Cell) {
                model.stopBatch('inspector', { cid: this.cid });
            }
            this.inBatch = false;
        }
    },

    afterRender: function() {
        this.cacheInputs();
        this.updateFieldsVisibility();
        this.updateGroupsVisibility();
        this.sourceService.initSources();
        this.trigger('render');
    },

    afterPartialRender: function(paths) {
        this.cacheInputs();
        this.updateGroupsVisibility();
        this.sourceService.initSources();
        if (paths) {
            paths.forEach(path => {
                this.dependencyService.changed(path);
            })
        }
        this.trigger('render');
    },

    addListItem: function(evt) {

        var $addButton = $(evt.target);
        var $attribute = $addButton.parent('[data-attribute]'); // parent element of $collection
        var options = this.getOptions($attribute);

        // New index = index of last list item +1.
        var $collection = $attribute.children('.list-items');
        var $items = $collection.children('.list-item');
        var $lastItem = $items.last();
        var lastIndex = ($lastItem.length === 0) ? -1 : parseInt($lastItem.attr('data-index'), 10);
        var index = lastIndex + 1;

        // Append the new item to collection.
        var $addedItem = this.renderListItem({ index: index, options: options });
        var path = $attribute.attr('data-attribute') + '/' + index;
        this.renderTemplate($addedItem, options.item, path);
        $collection.append($addedItem);

        // Show or hide the add and delete buttons
        $items = $collection.children('.list-item'); // refresh to include the added item.
        var $validItems = $items.not('.remove');
        var numItems = $validItems.length;
        this.fixListButtons($attribute, numItems, options.min, options.max);

        this.afterPartialRender([path]);

        let focusField = $addedItem[0];
        if (options.item.type !== 'object' &&
            options.item.type !== 'list') {
            focusField = focusField.querySelector('[data-attribute]');
        }

        if (this.options.live) {
            this.updateCell();
        }

        this._focusFieldInternal(options.item, path, focusField);
    },

    deleteListItem: function(evt) {

        var $deleteButton = $(evt.target);
        var $attribute = $deleteButton.closest('[data-attribute]'); // parent element of $collection
        var options = this.getOptions($attribute);

        // Hide and 'remove' the item.
        var $deletedItem = $deleteButton.closest('.list-item');
        $deletedItem.hide();
        $deletedItem.addClass('remove');

        // Find all nested inputs and hide and 'remove' them as well.
        $deletedItem.find('[data-field]').each(function() {
            $(this).hide().addClass('remove');
        });
        $deletedItem.find('[data-attribute]').each(function() {
            $(this).hide().addClass('remove');
        });

        // Show or hide the add and delete buttons
        var $collection = $attribute.children('.list-items')
        var $items = $collection.children('.list-item');
        var $validItems = $items.not('.remove');
        var numItems = $validItems.length;
        this.fixListButtons($attribute, numItems, options.min, options.max);

        const path = $attribute.attr('data-attribute')
        this.afterPartialRender([path]);

        if (this.options.live) {
            this.updateCell();
        }
    },

    fixListButtons: function($attribute, current, min, max) {

        var showAdd = function(current, max) {

            // If max is undefined or invalid, show the add button.
            if (typeof max !== 'number') return true;

            // If current value is undefined or invalid, show the add button.
            if (typeof current !== 'number') return true;

            // If current value is less than max, show the add button.
            // If current value equals or exceeds max, hide the add button.
            return (current < max);
        };

        var showDelete = function(current, min) {

            // If min is undefined or invalid, show the delete button.
            if ((typeof min !== 'number') || (min <= 0)) return true;

            // If current value is undefined or invalid, hide the delete button.
            if ((typeof current !== 'number') || (current <= 0)) return false;

            // If current value is more than min, show the delete button.
            // If current value is equal to or lower than min, hide the delete button.
            return (current > min);
        };

        // Check whether our list is maxed out after adding/removing an item.
        var $addButton = $attribute.children('.btn-list-add');
        var showAddButton = showAdd(current, max);
        if (showAddButton) $addButton.removeClass('hidden'); // we are under the limit, show button
        else $addButton.addClass('hidden'); // we are over the limit, hide button

        // Check whether our list has at least the minimum number of items after adding/removing an item.
        var $deleteButtons = $attribute.children('.list-items').children('.list-item').children('.btn-list-del');
        var showDeleteButtons = showDelete(current, min);
        if (showDeleteButtons) $deleteButtons.removeClass('hidden'); // we are over the limit, show buttons
        else $deleteButtons.addClass('hidden'); // we are under the limit, hide buttons
    },

    bindDocumentEvents: function() {
        var ns = this.getEventNamespace();
        this.$document.on('mouseup' + ns + ' touchend' + ns, this.pointerup);
    },

    unbindDocumentEvents: function() {
        this.$document.off(this.getEventNamespace());
    },

    pointerdown: function(evt) {
        evt.stopPropagation();
        this.bindDocumentEvents();
        this.startBatchCommand();
        this._$activeField = $(evt.currentTarget).addClass('is-in-action');
    },

    pointerup: function() {
        this.unbindDocumentEvents();
        // Start a batch command on `mousedown` over the inspector and stop it when the mouse is
        // released anywhere in the document. This prevents setting attributes in tiny steps
        // when e.g. a value is being adjusted through a slider. This gives other parts
        // of the application a chance to treat several little changes as one change.
        // Consider e.g. the CommandManager plugin.
        this.stopBatchCommand();

        if (this._$activeField) {
            this._$activeField.removeClass('is-in-action');
            this._$activeField = null;
        }
    },

    pointerfocusin: function(evt) {
        evt.stopPropagation();
        $(evt.currentTarget).addClass('is-focused');
    },

    pointerfocusout: function(evt) {
        evt.stopPropagation();
        $(evt.currentTarget).removeClass('is-focused');
    },

    onRemove: function() {

        this.unbindDocumentEvents();
        this.removeWidgets();
        if (this === this.constructor.instance) {
            this.constructor.instance = null;
        }
    },

    removeWidgets: function() {

        var widgets = this.widgets;
        for (var path in widgets) {
            widgets[path].remove();
        }

        this.widgets = {};
    },

    onGroupLabelClick: function(evt) {

        // Prevent default action for iPad not to handle this event twice.
        evt.preventDefault();

        if (!this.options.multiOpenGroups) {
            this.closeGroups();
        }

        var $group = $(evt.target).closest('.group');
        this.toggleGroup($group);
    },

    toggleGroup: function(name) {

        var $group = util.isString(name) ? this.$('.group[data-name="' + name + '"]') : $(name);

        if ($group.hasClass('closed')) {
            this.openGroup($group);
        } else {
            this.closeGroup($group);
        }
    },

    closeGroup: function(name, opt) {

        opt = opt || {};
        var $group = util.isString(name) ? this.$('.group[data-name="' + name + '"]') : $(name);

        if (opt.init || !$group.hasClass('closed')) {
            $group.addClass('closed');
            this.trigger('group:close', $group.data('name'), opt);
        }
    },

    openGroup: function(name, opt) {

        opt = opt || {};
        var $group = util.isString(name) ? this.$('.group[data-name="' + name + '"]') : $(name);

        if (opt.init || $group.hasClass('closed')) {
            $group.removeClass('closed');
            this.trigger('group:open', $group.data('name'), opt);
        }
    },

    closeGroups: function() {

        for (var i = 0, n = this.$groups.length; i < n; i++) {
            this.closeGroup(this.$groups[i]);
        }
    },

    openGroups: function() {

        for (var i = 0, n = this.$groups.length; i < n; i++) {
            this.openGroup(this.$groups[i]);
        }
    },

    // Expressions

    COMPOSITE_OPERATORS: ['not', 'and', 'or', 'nor'],
    PRIMITIVE_OPERATORS: ['eq', 'ne', 'regex', 'text', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'equal'],

    _isComposite: function(expr) {

        return util.intersection(this.COMPOSITE_OPERATORS, Object.keys(expr)).length > 0;
    },

    _isPrimitive: function(expr) {

        var operators = Object.keys(this.options.operators).concat(this.PRIMITIVE_OPERATORS);
        return util.intersection(operators, Object.keys(expr)).length > 0;
    },

    _evalCustomPrimitive: function(name, value, args, path) {

        // Operator signature --> function(cell, value, argument*) {}
        return !!this.options.operators[name].apply(this, [this.getModel(), value].concat(args).concat([path]));
    },

    _evalPrimitive: function(expr) {

        return Object.keys(expr).reduce(function(res, operator) {
            var condition = expr[operator];

            return Object.keys(condition).reduce(function(res, condPath) {
                var condValue = condition[condPath];
                // This must never get a `condPath` with a placeholder!
                var val = this.getCellAttributeValue(condPath);

                // Let's check if this is a custom operator.
                if (util.isFunction(this.options.operators[operator])) {
                    // Note that custom operators can replace the existing primitives.
                    return this._evalCustomPrimitive(operator, val, condValue, condPath);
                }

                switch (operator) {
                    case 'eq':
                        return condValue == val;
                    case 'ne':
                        return condValue != val;
                    case 'regex':
                        return (new RegExp(condValue)).test(val);
                    case 'text':
                        return !condValue || (util.isString(val) && val.toLowerCase().indexOf(condValue) > -1);
                    case 'lt':
                        return val < condValue;
                    case 'lte':
                        return val <= condValue;
                    case 'gt':
                        return val > condValue;
                    case 'gte':
                        return val >= condValue;
                    case 'in':
                        return Array.isArray(condValue) && condValue.includes(val);
                    case 'nin':
                        return Array.isArray(condValue) && !condValue.includes(val);
                    case 'equal':
                        return util.isEqual(condValue, val);
                    default:
                        return res;
                }

            }.bind(this), false);
        }.bind(this), false);
    },

    _evalExpression: function(expr) {

        if (this._isPrimitive(expr)) {
            return this._evalPrimitive(expr);
        }

        return Object.keys(expr).reduce(function(res, operator) {

            var childExpr = expr[operator];

            if (operator == 'not') return !this._evalExpression(childExpr);

            var childExprRes = util.toArray(childExpr).map(this._evalExpression, this);

            switch (operator) {
                case 'and':
                    return childExprRes.every(function(e) {
                        return !!e;
                    });
                case 'or':
                    return childExprRes.some(function(e) {
                        return !!e;
                    });
                case 'nor':
                    return !childExprRes.some(function(e) {
                        return !!e;
                    });
                default:
                    return res;
            }

        }.bind(this), false);
    },

    _getBareExpression: function(expr) {
        return util.omit(expr, 'otherwise', 'dependencies');
    },

    _getExpressionExtras: function(expr) {
        return {
            otherwise: util.clone(expr.otherwise),
            dependencies: util.clone(expr.dependencies)
        };
    },

    _extractVariables: function(expr) {

        if (Array.isArray(expr) || this._isComposite(expr)) {

            return util.toArray(expr).reduce(function(res, childExpr) {
                return res.concat(this._extractVariables(childExpr));
            }.bind(this), []);
        }

        return util.toArray(expr).reduce(function(res, primitive) {
            return Object.keys(primitive);
        }, []);
    },

    isExpressionValid: function(expr) {
        const bareExpression = this._getBareExpression(expr);
        return this._evalExpression(bareExpression);
    },

    extractExpressionPaths: function(expr) {
        // Additional dependencies can be defined. Useful when we using custom operators and
        // we want the input to be displayed/showed also if this dependency changes.
        var dependencies = (expr && expr.dependencies) || [];

        // All other dependencies are mentioned inside the expression definition.
        const bareExpression = this._getBareExpression(expr);
        return util.uniq(this._extractVariables(bareExpression).concat(dependencies));
    },

    /**
     * @private
     * @returns {string}
     */
    getGroupsStateKey: function() {

        if (util.isFunction(this.options.stateKey)) {
            return this.options.stateKey(this.getModel());
        }

        throw new Error('Inspector: Option stateKey must be a function');
    },

    /**
     * @public
     * store the current state of groups.
     */
    storeGroupsState: function() {

        var key = this.getGroupsStateKey();
        var closedGroups = util.toArray(this.$('.group.closed'));

        Inspector.groupStates[key] = closedGroups.map(function(g) {
            return $(g).attr('data-name');
        });
    },

    /**
     * @public
     * get groups which are actually stored as closed in state. This could differ from currently rendered state.
     * @returns {Array.<string>}
     */
    getGroupsState: function() {

        return Inspector.groupStates[this.getGroupsStateKey()];
    },

    /**
     * @public
     * Opens/closes groups regards to the stored state.
     */
    restoreGroupsState: function() {

        var processGroups = function(isClosed, context) {
            util.forIn(context.options.groups, function(group, groupName) {
                isClosed(group, groupName) ? this.closeGroup(groupName) : this.openGroup(groupName);
            }.bind(context));
        };

        var key = this.getGroupsStateKey();

        if (Inspector.groupStates[key]) {
            processGroups(function(group, groupName) {
                return Inspector.groupStates[key].includes(groupName);
            }, this);
        } else {
            processGroups(function(group) {
                return group.closed;
            }, this);
        }
    }

}, {

    /** @type {Object.<string, Array.<string>>} */
    groupStates: {},

    /** @type Inspector */
    instance: null,

    /**
     * @param {Element|string} container Element or selector
     * @param {Object} opt Inspector options
     * @returns {Inspector}
     */
    create: function(container, opt) {

        opt = opt || {};
        util.defaults(opt, {
            updateCellOnClose: true,
            restoreGroupsState: true,
            storeGroupsState: true
        });

        var cell = opt.cell || opt.cellView.model;
        var inspector = this.instance;

        // No need to re-render inspector if the cellView didn't change.
        if (!inspector || inspector.getModel() !== cell) {

            // Is there an inspector that has not been removed yet.
            // Note that an inspector can be also removed when the underlying cell is removed.
            if (inspector && inspector.el.parentNode) {

                if (opt.storeGroupsState) {
                    inspector.storeGroupsState();
                }

                // Clean up the old inspector.
                if (opt.updateCellOnClose) {
                    inspector.updateCell();
                }
                inspector.trigger('close');
                inspector.remove();
            }

            inspector = new this(opt).render();
            this.instance = inspector;
            $(container).html(inspector.el);

            if (opt.restoreGroupsState) {
                inspector.restoreGroupsState();
            }
        }

        return inspector;
    },

    close: function() {

        var inspector = this.instance;
        if (inspector) {
            const { activeElement } = document;
            if ($.contains(inspector.el, activeElement)) activeElement.blur();
            inspector.trigger('close');
            inspector.remove();
        }
    }
});
