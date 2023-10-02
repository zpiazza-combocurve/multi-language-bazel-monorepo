import $ from 'jquery';
import { util, mvc } from 'jointjs/src/core.mjs';

export const SelectButtonGroup = mvc.View.extend({

    className: 'select-button-group',

    events: {
        'click .select-button-group-button': 'onSelect',
        'mouseover .select-button-group-button': 'onOptionHover',
        'mouseleave': 'onMouseOut',
        'mousedown .select-button-group-button': 'pointerdown',
        'touchstart .select-button-group-button': 'pointerdown',
        'mouseup .select-button-group-button': 'pointerup',
        'touchend .select-button-group-button': 'pointerup'
    },

    options: {
        options: [], // the actual buttons
        disabled: false, // Is the user allowed to interact with the options?
        multi: false, // Is multiple selection allowed?
        selected: undefined, // (multi === true): an array of indices of selected options; (multi === false): index of selected option; (selected === undefined): look at each option's `selected` property)
        singleDeselect: false, // Is it allowed to deselect in single-choice groups?
        noSelectionValue: undefined, // If there is no selection, what value should be reported by `getSelectionValue()`?
        width: undefined, // width of the whole SelectButtonGroup
        buttonWidth: undefined,
        buttonHeight: undefined,
        iconWidth: undefined,
        iconHeight: undefined
    },

    init: function() {

        util.bindAll(this, 'onSelect', 'pointerup');

        this.$el.data('view', this);

        var optionsItems = this.options.options;
        var multi = this.options.multi;

        var selected = this.options.selected;
        if (selected === undefined) {
            var selectedOptions = util.toArray(optionsItems).filter(function(item) {
                return (item && (item.selected === true));
            });
            if (multi) {
                this.selection = selectedOptions;
            } else {
                this.selection = selectedOptions[0]; // single-choice select button group may only have one selection
            }

        } else { // something was provided to `selected`
            if (multi) {
                this.selection = (!Array.isArray(selected) ? [optionsItems[selected]] : optionsItems.filter(function(option, idx) {
                    return (selected.includes(idx));
                }));
            } else {
                this.selection = optionsItems[selected];
            }
        }
    },

    render: function() {

        this.renderOptions(this.selection);

        if (this.options.width) {
            this.$el.css('width', this.options.width);
        }

        if (this.options.disabled) {
            this.disable();
        }

        this.$el.append(this.$options);

        return this;
    },

    renderOptions: function() {

        this.removeOptions();

        util.toArray(this.options.options).forEach(function(option, idx) {

            var isSelected = (this.options.multi ? this.selection.includes(option) : (this.selection === option));
            var $option = this.renderOption(option, idx, isSelected);
            this.$el.append($option);

            if (isSelected) {
                $option.addClass('selected');
            }
        }, this);
    },

    removeOptions: function() {

        this.$el.empty();
    },

    renderOption: function(option, idx, isSelected) {

        var $option = this.renderOptionContent(option, isSelected);
        $option.data('index', idx);
        var buttonWidth = option.buttonWidth || this.options.buttonWidth;
        if (buttonWidth) {
            $option.css('width', buttonWidth);
        }
        var buttonHeight = option.buttonHeight || this.options.buttonHeight;
        if (buttonHeight) {
            $option.css('height', buttonHeight);
        }
        return $option;
    },

    renderOptionContent: function(option, isSelected) {

        var $option = $('<div/>', { 'class': 'select-button-group-button', html: option.content });
        if (option.icon || (isSelected && option.iconSelected)) {
            var $icon = $('<img/>', {
                'class': 'select-button-group-button-icon',
                src: isSelected && option.iconSelected ? option.iconSelected : option.icon
            });
            var iconWidth = option.iconWidth || this.options.iconWidth;
            if (iconWidth) {
                $icon.css('width', iconWidth);
            }
            var iconHeight = option.iconHeight || this.options.iconHeight;
            if (iconHeight) {
                $icon.css('height', iconHeight);
            }
            $option.prepend($icon);
        }
        // `option.attrs` allows for setting arbitrary attributes on the generated HTML.
        // This object is of the form: `<selector> : { <attributeName> : <attributeValue>, ... }`
        util.setAttributesBySelector($option, option.attrs);

        return $option;
    },

    setOptions: function(options, selection) {
        this.options.options = options;

        this.selection = selection;

        this.render();

        this.trigger('option:select', this.selection);
    },

    getOptionIndex: function(el) {

        return $(el).closest('.select-button-group-button').data('index');
    },

    onSelect: function(evt) {

        if (this.isDisabled()) return;
        var idx = this.getOptionIndex(evt.target);
        this.select(idx, { ui: true });
    },

    onOptionHover: function(evt) {

        if (this.isDisabled()) return;
        var idx = this.getOptionIndex(evt.target);
        this.trigger('option:hover', this.options.options[idx], idx);
    },

    onMouseOut: function(evt) {

        if (this.isDisabled()) return;
        this.trigger('mouseout', evt);
    },

    getSelection: function() {

        return this.selection;
    },

    // returns the value(s) associated with selected option(s)
    // (multi === false): returns one value or `this.options.noSelectionValue` or `undefined`
    // (multi === true): returns an array of values or `this.options.noSelectionValue` or `[]`
    getSelectionValue: function(selection) {

        selection = selection || this.selection;

        var noSelectionValue = this.options.noSelectionValue;
        var multi = this.options.multi;

        if (multi) { // multiple-choice select button group
            var selectionArray = util.toArray(selection); // (`undefined` becomes `[]`)
            if (selectionArray.length === 0) {
                return ((noSelectionValue !== undefined) ? noSelectionValue : []);
            }

            return selectionArray.map(function(option) {
                var optionValue = option.value;
                return ((optionValue !== undefined) ? optionValue : option.content);
            });
        }

        // else: single-choice select button group
        if (!selection) {
            return ((noSelectionValue !== undefined) ? noSelectionValue : undefined);
        }
        var selectionValue = selection.value;
        return ((selectionValue !== undefined) ? selectionValue : selection.content);
    },

    // selects and deselects appropriate options based on the `index` of clicked option,
    // then triggers the `option:select` event
    // (information about what kind of selection this was and what options were selected/deselected is stored in `opt`)
    select: function(index, opt) {

        // the clicked option:
        var $option = $(this.$('.select-button-group-button')[index]);
        var option = this.options.options[index];

        // hoisting here because selecting/deselecting information is returned in `opt`:
        var deselectedIndex = null;
        var deselectedOption = null;
        var selectedIndex = null;
        var selectedOption = null;

        // hoisting here because variable is used in both conditional branches:
        var isSelected;

        if (this.options.multi) { // multiple-choice select button group
            // do not move these two lines out from the conditional branch!
            // (single-choice selectButtonGroups need to do extra logic before these lines)
            $option.toggleClass('selected');
            isSelected = $option.hasClass('selected');

            if (isSelected) { // the user clicked on an option that was not selected before
                selectedIndex = index;
                selectedOption = option;
                // add the option to `selection`
                if (this.selection.indexOf(option) === -1) {
                    this.selection.push(option);
                }
                if (option.iconSelected) { // if a special selected icon is defined for the option
                    // switch option to selected icon
                    $option.find('.select-button-group-button-icon').attr('src', option.iconSelected);
                }

            } else { // the user clicked on one of the previously-selected options
                deselectedIndex = index;
                deselectedOption = option;
                // remove the option from `selection`
                this.selection = util.without(this.selection, option);
                if (option.iconSelected) { // if a special selected icon is defined for the option (and therefore is in use now)
                    // switch option to normal icon
                    $option.find('.select-button-group-button-icon').attr('src', option.icon);
                }
            }

        } else { // single-choice select button group
            var $prevOption = this.$('.selected');
            var prevIndex = $prevOption.index();
            var prevOption = this.options.options[prevIndex];

            // do not move these two lines out from the conditional branch!
            // (we need to execute these lines AFTER determining `$prevOption` and `prevOption`)
            $option.toggleClass('selected');
            isSelected = $option.hasClass('selected');

            if (isSelected) { // the user clicked on an option that was not selected before
                if (prevOption) { // switching to another option
                    deselectedIndex = prevIndex;
                    deselectedOption = prevOption;
                    // deselect previously selected option
                    $prevOption.removeClass('selected');
                    if (prevOption.iconSelected) { // if a special selected icon is defined for the previously selected option
                        // switch the previously selected option to normal icon
                        $prevOption.find('.select-button-group-button-icon').attr('src', prevOption.icon);
                    }
                }

                selectedIndex = index;
                selectedOption = option;
                // select the clicked option
                this.selection = option;
                if (option.iconSelected) { // if a special selected icon is defined for the selected option
                    // switch the selected option to selected icon
                    $option.find('.select-button-group-button-icon').attr('src', option.iconSelected);
                }

            } else { // the user clicked on the previously selected option
                if (this.options.singleDeselect) { // it is allowed to deselect in this single-choice button group
                    deselectedIndex = index;
                    deselectedOption = option;
                    // deselect the option
                    this.selection = undefined;
                    if (option.iconSelected) { // if a special selected icon is defined for the option (and therefore in use now)
                        // switch option to normal icon
                        $option.find('.select-button-group-button-icon').attr('src', option.icon);
                    }

                } else { // it is not allowed to deselect in this single-choice button group
                    // keep current option selected
                    $option.addClass('selected');
                    //return; // TODO: (breaking change) we should not trigger `option:select` event in this case
                }
            }
        }

        // sneak extra information about selecting/deselecting into `opt`
        var localOpt = util.assign({}, opt);
        localOpt.deselectedIndex = deselectedIndex;
        localOpt.deselectedOption = deselectedOption;
        localOpt.selectedIndex = selectedIndex;
        localOpt.selectedOption = selectedOption;
        // note: it is possible that `deselectedOption` and/or `selectedOption` are `null`
        // (also `deselectedIndex` and/or `selectedIndex`)
        // this information is separate from `this.selection` (what options are currently selected)
        // to get the after-event status of `selection`, use the first argument of the callback function
        this.trigger('option:select', this.selection, index, localOpt);
    },

    selectByValue: function(value, opt) {

        if (!Array.isArray(value)) {
            value = [value];
        }

        var options = this.options.options || [];
        for (var i = 0; i < options.length; i++) {
            var option = options[i];
            if (option.value === undefined && value.includes(option.content)) {
                this.select(i, opt);
            } else if (option.value !== undefined) {
                var containsOption = value.find(function(val) {
                    return util.isEqual(val, option.value);
                });
                if (containsOption) {
                    this.select(i, opt);
                }
            }
        }
    },

    deselect: function() {

        this.$('.selected').removeClass('selected');
        if (this.options.multi) {
            this.selection = [];
        } else {
            this.selection = undefined;
        }
    },

    isDisabled: function() {

        return this.$el.hasClass('disabled');
    },

    enable: function() {

        this.$el.removeClass('disabled');
    },

    disable: function() {

        this.$el.addClass('disabled');
    },

    pointerdown: function(evt) {

        var index = this.getOptionIndex(evt.target);
        var $option = $(this.$('.select-button-group-button')[index]);
        $option.addClass('is-in-action');
        $(document).on('mouseup.select-button-group touchend.select-button-group', this.pointerup);
    },

    pointerup: function() {

        this.$('.is-in-action').removeClass('is-in-action');
        $(document).off('mouseup.select-button-group touchend.select-button-group');
    }
});
