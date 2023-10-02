import Backbone from 'backbone';
import { util } from 'jointjs/src/core.mjs';

/**
 * @constructor
 */
export const Keyboard = function(options = {}) {

    util.bindAll(this, 'handleKey');
    this.options = util.assign({}, options);
    this.parser = new KeyboardParser();
    this.enable();
};

util.assign(Keyboard.prototype, Backbone.Events);

/**
 * Bind a callback function to an object. Same logic as [Backbone.Events.on](http://backbonejs.org/#Events-on)
 * @public
 * @param {string|object} evt shortcut definition
 *  * string:  [type:]value,
 *
 * where event is defined as [type:]value
 * * type: keypress, keydown, keyup
 * * value: modifier+char
 *
 * supported modifiers definition:
 * '⇧', 'shift', '⌥', 'alt', 'option', '⌃', 'ctrl', 'control', '⌘', 'command', 'meta'
 *
 * for special characters use this definitions:
 * **backspace, tab, clear, enter, return, esc, escape, space, left, up, right, down, del, delete, home, end, pageup, pagedown, plus**
 * ```javascript
 *  //simple shortcut
 *  keyboardInstance.on('backspace', handleDelete, this);
 *  // more multiple shortcut definition
 *  keyboardInstance.on('ctr+c command+c', copy);
 *  //event as object
 *  keyboardInstance.on({
 *      'keyup:a': handlerA
 *      'b': handlerB
 *  }, copy);
 * ```
 * @param {function} callback Ignored when event is defined as an object
 * @param {Object=} context
 * @returns {Keyboard}
 */
Keyboard.prototype.on = function(evt, callback, context) {

    Backbone.Events.on.call(this, this.normalizeEvent(evt), callback, context);
    return this;
};

/**
 * Remove a previously-bound callback function from an object. Same logic as [Backbone.Events.off](http://backbonejs.org/#Events-off)
 * @public
 * @param {string|Object} evt
 * @param {function} callback
 * @param {Object=} context
 * @returns {Keyboard}
 */
Keyboard.prototype.off = function(evt, callback, context) {

    var remove = evt ? this.normalizeEvent(evt) : null;
    Backbone.Events.off.call(this, remove, callback, context);
    return this;
};

/**
 * @private
 * @param {string|Object} evt
 * @returns {*}
 */
Keyboard.prototype.normalizeEvent = function(evt) {

    if (typeof evt === 'object') {

        var keys = Object.keys(evt);
        var res = {};
        for (var i = 0, n = keys.length; i < n; i++) {
            var key = keys[i];
            res[this.normalizeEvent(key)] = evt[key]
        }

        return res;
    }

    return this.normalizeShortcut(evt);
};

/**
 * Normalize shortcut definition:
 * split multiple shortcut definition into parts  'ctrl+c alt+a' => 'ctrl+c', 'alt+a'
 * normalize parts: ctr +c, ctrl + c, c+ctrl => ctrl+c
 * hash parts
 * @private
 * @param {string} shortcut
 * @returns {string}
 */
Keyboard.prototype.normalizeShortcut = function(shortcut) {

    var lcShortcut = shortcut.toLowerCase();
    if (lcShortcut in eventNamesMap) {
        return eventNamesMap[lcShortcut];
    }

    var eventsToBind = this.parser.toEventObjectList(shortcut);
    var result = [];

    for (var i = 0; i < eventsToBind.length; i++) {
        result.push(this.hash(eventsToBind[i]));
    }

    return result.join(' ');
};

/**
 * Starts tracking keyboard events.
 * @public
 */
Keyboard.prototype.enable = function() {

    if (window.addEventListener) {
        document.addEventListener('keydown', this.handleKey, false);
        document.addEventListener('keypress', this.handleKey, false);
        document.addEventListener('keyup', this.handleKey, false);
    } else if (window.attachEvent) {
        document.attachEvent('keydown', this.handleKey, false);
        document.attachEvent('keypress', this.handleKey, false);
        document.attachEvent('keyup', this.handleKey, false);
    }
};

/**
 * Stops tracking keyboard events.
 * @public
 */
Keyboard.prototype.disable = function() {

    if (window.removeEventListener) {
        document.removeEventListener('keydown', this.handleKey, false);
        document.removeEventListener('keypress', this.handleKey, false);
        document.removeEventListener('keyup', this.handleKey, false);
    } else if (window.detachEvent) {
        document.detachEvent('keydown', this.handleKey, false);
        document.detachEvent('keypress', this.handleKey, false);
        document.detachEvent('keyup', this.handleKey, false);
    }
};

/**
 * Checks if key 'name' is actually pressed.
 * Limitation: available for modifiers only - 'alt', 'ctrl', 'shift', 'command'
 * @public
 * @param {string} name
 * @param {KeyboardEvent} evt
 * @returns {boolean}
 */
Keyboard.prototype.isActive = function(name, evt) {
    return this.isModifierActive(name, evt);
};

/**
 * @private
 * @param {string} key
 * @param {KeyboardEvent} evt
 * @returns {boolean}
 */
Keyboard.prototype.isModifierActive = function(key, evt) {

    var events = this.parser.toEventObjectList(key);

    for (var i = 0; i < events.length; i++) {
        if (events[i].modifiersCompare(evt)) {
            return true;
        }
    }

    return false;
};

/**
 * Checks if the event key is a printable character.
 * @public
 * @param {KeyboardEvent} evt
 * @returns {boolean}
 */
Keyboard.prototype.isKeyPrintable = function(evt) {
    if (!evt) return false;
    const { key } = evt;
    return key ? (key.length === 1 || key === 'Unidentified') : false;
};

/**
 * @private
 * @param {KeyboardEvent} evt
 * @returns {string}
 */
Keyboard.prototype.hash = function(evt) {

    var toInt = function(value) {
        return value ? 1 : 0;
    };

    var parts = [
        evt.type, ':',
        evt.which,
        toInt(evt.shiftKey),
        toInt(evt.ctrlKey),
        toInt(evt.altKey),
        toInt(evt.metaKey)
    ];

    return parts.join('');
};

/**
 * @private
 * @param {KeyboardEvent} evt
 */
Keyboard.prototype.handleKey = function(evt) {

    const filterFn = this.options.filter;
    if (typeof filterFn === 'function') {
        if (!filterFn.call(this, evt, this)) {
            return;
        }
    } else if (this.isConsumerElement(evt)) {
        return;
    }

    var ev = KeyboardEvent.fromNative(evt);
    Backbone.Events.trigger.call(this, this.hash(ev), evt);

    // Printable Event
    // Accept only values with length of 1 for evt.key. See the comment below.
    // From: https://caniuse.com/keyboardevent-key
    // 'Some key events, or their values, might be suppressed by the IME in use'. On mobile (virtual keyboard), for
    // every key Blink and WebKit based browsers report 'Unidentified', Gecko reports 'Process'.
    if (this.isKeyPrintable(evt)) {
        Backbone.Events.trigger.call(this, `${evt.type}:printable`, evt);
    }
};

/**
 * @private
 * @param {KeyboardEvent} evt
 * @returns {boolean}
 */
Keyboard.prototype.isConsumerElement = function(evt) {

    const element = evt.target || evt.srcElement;
    if (element) {
        const tagName = element.tagName.toUpperCase();
        return tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA' || element.isContentEditable;
    }

    return false;
};

/**
 * @constructor
 * @private
 */
var KeyboardParser = function() {

};

KeyboardParser.prototype = {

    constructor: KeyboardParser,


    /**
     * @public
     * @param {string} str
     * @returns {Object}
     */
    parseEventString: function(str) {

        str = str || '';
        var parts = str.split('+');
        var strPart;
        var event = new KeyboardEvent(0);
        var i;

        for (i = 0; i < parts.length; i++) {
            strPart = parts[i];
            var modifierName = this.getModifierPropertyName(strPart);

            if (modifierName) {
                event[modifierName] = true;
            }

            if (parts.length === 1 || modifierName === undefined) {
                event.which = KeyboardParser.getCode(strPart);
            }
        }
        return event;
    },

    /**
     * @public
     * @param {string} str
     */
    toEventObjectList: function(str) {

        //remove white space(s) surrounding '+'
        // ctrl +   c => ctrl+c
        var rawEventsParts = str.replace(/\s*\+\s*/gi, '+').split(' ');

        return rawEventsParts.map(this.composeEventObject, this);
    },

    /**
     * @private
     * @param {string} rawEvent
     * @returns {Object}
     */
    composeEventObject: function(rawEvent) {

        var parts = rawEvent.split(':');
        var type = Types.KEYDOWN;
        var shortcutValue = parts[0];

        if (parts.length > 1) {
            shortcutValue = parts[1];
            type = parts[0];
        }

        if (AvailableEventTypes.indexOf(type) === -1) {
            throw rawEvent + ': invalid shortcut definition';
        }

        var ev = this.parseEventString(shortcutValue);

        // to treat modifier also as a regular keystroke we need to switch of the modifier activity flag for the keyup event.
        if (type === Types.KEYUP && modifierMap[ev.which]) {
            ev[modifierMap[ev.which]] = false;
        }

        return ev.setType(type);
    },

    /**
     * @private
     * @param {string} key
     * @returns {*}
     */
    getModifierPropertyName: function(key) {

        var code = modifiers[key];
        return modifierMap[code];
    }
};

/**
 * @static
 * @param {string} char
 * @returns {number}
 */
KeyboardParser.getCode = function(char) {
    return keyMap[char] || char.toUpperCase().charCodeAt(0);
};

var modifiers = {
    '⇧': 16, shift: 16,
    '⌥': 18, alt: 18, option: 18,
    '⌃': 17, ctrl: 17, control: 17,
    '⌘': 91, command: 91, meta: 91
};

var modifierMap = {
    16: 'shiftKey',
    18: 'altKey',
    17: 'ctrlKey',
    91: 'metaKey'
};

var charCodeAlternatives = {

    226: '\\',

    // Opera
    57392: 'ctrl',
    63289: 'num',
    // Firefox
    59: ';',
    61: '=',
    173: '-'
};

var keyMap = {
    backspace: 8,
    tab: 9,

    shift: 16,
    ctrl: 17,
    alt: 18,
    meta: 91,

    clear: 12,
    enter: 13,
    'return': 13,
    esc: 27,
    escape: 27,
    capslock: 20,
    space: 32,
    left: 37,
    up: 38,
    right: 39, down: 40,
    del: 46,
    'delete': 46,
    home: 36,
    end: 35,
    insert: 45,
    ins: 45,
    pageup: 33, pagedown: 34,
    plus: 187,
    minus: 189,

    '-': 189,
    ',': 188, '.': 190, '/': 191,
    '`': 192, '=': 187,
    ';': 186, '\'': 222,
    '[': 219, ']': 221, '\\': 220,

    'F1': 112,
    'F2': 113,
    'F3': 114,
    'F4': 115,
    'F5': 116,
    'F6': 117,
    'F7': 118,
    'F8': 119,
    'F9': 120,
    'F10': 121,
    'F11': 122,
    'F12': 123
};

var eventNamesMap = {
    'all': 'all',
    'printable': 'keypress:printable',
    'keypress:printable': 'keypress:printable',
    'keydown:printable': 'keydown:printable',
    'keyup:printable': 'keyup:printable'
};

util.assign(Keyboard, { keyMap, modifierMap, modifiers, charCodeAlternatives, eventNamesMap });

/**
 * @enum {string}
 */
var Types = {
    KEYPRESS: 'keypress',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup'
};

/**
 * @Array<Types>
 */
var AvailableEventTypes = [
    Types.KEYPRESS,
    Types.KEYDOWN,
    Types.KEYUP
];

/**
 * @param {number} charCode
 * @param {boolean=} isShift
 * @param {boolean=} isCtrl
 * @param {boolean=} isAlt
 * @param {boolean=} isMeta
 * @param {Types} type
 * @constructor
 * @private
 */
var KeyboardEvent = function(charCode, isShift, isCtrl, isAlt, isMeta, type) {
    this.which = charCode;
    this.shiftKey = isShift || false;
    this.ctrlKey = isCtrl || false;
    this.altKey = isAlt || false;
    this.metaKey = isMeta || false;
    this.type = type || Types.KEYDOWN;
};

/**
 * @public
 * @param {KeyboardEvent} e
 * @returns {KeyboardEvent}
 */
KeyboardEvent.fromNative = function(e) {

    var normalizedCharCode = e.which;

    if (e.type === Types.KEYPRESS) {
        normalizedCharCode = String.fromCharCode(e.which).toUpperCase().charCodeAt(0);
    }

    if (charCodeAlternatives[normalizedCharCode]) {
        normalizedCharCode = KeyboardParser.getCode(charCodeAlternatives[normalizedCharCode]);
    }

    var event = new KeyboardEvent(normalizedCharCode, e.shiftKey, e.ctrlKey, e.altKey, e.metaKey, e.type);

    // to treat modifier as a regular keystroke we need to switch of the modifier activity flag for the keyup event.
    if (e.type === Types.KEYUP && modifierMap[normalizedCharCode]) {
        event[modifierMap[normalizedCharCode]] = false;
    }

    return event
};

/**
 * @public
 * @param {KeyboardEvent} eventToCompare
 */
KeyboardEvent.prototype.modifiersCompare = function(eventToCompare) {

    return (this.shiftKey ? this.shiftKey === eventToCompare.shiftKey : true) &&
        (this.ctrlKey ? this.ctrlKey === eventToCompare.ctrlKey : true) &&
        (this.altKey ? this.altKey === eventToCompare.altKey : true) &&
        (this.metaKey ? this.metaKey === eventToCompare.metaKey : true);
};

/**
 *
 * @param {Types} type
 */
KeyboardEvent.prototype.setType = function(type) {
    this.type = type;
    return this;
};

