import { mvc } from 'jointjs/src/core.mjs';

export const RadioGroup = mvc.View.extend({

    className: 'radio-group',

    events: {
        'click input': 'onOptionClick',
    },

    options: {
        options: [],    // Example: `{ content: '<b>foo</b><br/><small>bar</small>', value: 'foo' }`
        name: undefined // sets the name attribute of the radio button input element. It is set to cid by default
    },

    currentValue: undefined,
    groupOptions: undefined,
    name: undefined,
    inputOptions: {},

    init: function() {
        this.groupOptions = this.options.options || [];
        this.name = this.options.name || this.cid;
    },

    render: function() {
        this.renderOptions();
        return this;
    },

    renderOptions: function() {
        // New API, may be too early to use
        // Don't work with standalone tests currently
        //this.el.replaceChildren();
        this.el.innerHTML = '';
        this.inputOptions = {};

        this.groupOptions.forEach((option, i) => {
            this.renderOption(option, i);
        });
    },

    renderOption: function(option, index) {
        const optionElement = document.createElement('label');
        optionElement.setAttribute('tabindex', 0);

        const input = document.createElement('input');
        input.type = 'radio';
        input.value = option.value;
        input.name = this.name;
        optionElement.appendChild(input);
        this.inputOptions[option.value] = {
            input,
            index
        };

        const content = document.createElement('span');
        content.innerHTML = option.content;
        optionElement.appendChild(content);

        this.el.appendChild(optionElement);
    },

    getSelectionIndex: function() {
        return this.inputOptions[this.currentValue].index;
    },

    getCurrentValue: function() {
        return this.currentValue;
    },

    select: function(index) {
        const value = this.groupOptions[index].value;
        if (value) {
            this.selectByValue(value);
        }
    },

    selectByValue: function(value) {
        const inputOption = this.inputOptions[value];
        if (inputOption) {
            const input = inputOption.input;
            if (input && input.value !== this.currentValue) {
                input.checked = true;
                this.currentValue = input.value;
                this.trigger('option:select', this.currentValue, this);
            }
        }
    },

    onOptionClick: function(evt) {
        const option = evt.target;
        if (option.value !== this.currentValue) {
            this.selectByValue(option.value);
        }
    },

    setOptions: function(options) {
        this.groupOptions = options;
        this.renderOptions();

        const inputOption = this.inputOptions[this.currentValue];
        if (inputOption && inputOption.input) {
            inputOption.input.checked = true;
        } else {
            this.currentValue = null;
            this.trigger('option:select', this.currentValue, this);
        }
    }
});
