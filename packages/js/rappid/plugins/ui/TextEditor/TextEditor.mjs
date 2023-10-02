/* eslint no-console: 'off' */

// ui.TextEditor
// =============

// Inline SVG text editing that is nearly identical to the native text
// editing inside the HTML textarea element.

// Features:
// ---------

// - Rich text editing.
// - Selections.
// - Caret.
// - Caret positioning left or right based on the distance to
//   the left/right edge of the clicked character.
// - Handles newlines seamlessly.
// - Selections, both all-text and portions of text.
// - Word selection by double-click.
// - Whole text selection by triple-click.
// - Keyboard navigation native to the underlying OS.
// - API for programmatic access (selections, caret, word boundary, ...).
// - Selections and caret can be styled in CSS.
// - Supports editing of a rotated text.
// - Supports editing of a scaled text.

// Important note: The ui.TextEditor assumes the SVG `<text>` element
// contains a `<tspan>` element for each line. Lines are ordered as they
// appear in the DOM. If a line is empty, it is assumed the `<tspan>`
// element contains a space character.
// This is in line with how Vectorizer renders text.
import $ from 'jquery';
import Backbone from 'backbone';
import { V, util, mvc } from 'jointjs/src/core.mjs';
import {
    getCombinedAnnotationAttrsAtIndex,
    getCombinedAnnotationAttrsBetweenIndexes,
    normalizeAnnotations
} from './annotations.mjs';

export const TextEditor = mvc.View.extend({

    options: {
        text: undefined, // The SVG text element on which we want to enable inline text editing.
        newlineCharacterBBoxWidth: 10, // The width of the new line character. Used for selection of a newline.
        placeholder: undefined,  // The placeholder in case the text gets emptied.
        focus: true, // Determines if the textarea should gain focus. In some cases, this is not intentional - e.g. if we use the ui.TextEditor for displaying remote cursor.
        debug: false,
        selectAllThreshold: 20,
        useNativeSelection: true,
        annotateUrls: false,
        urlAnnotation: {
            attrs: {
                'class': 'url-annotation',
                fill: 'lightblue',
                'text-decoration': 'underline'
            }
        },
        textareaAttributes: {
            autocorrect: 'off',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            tabindex: '0'
        }
    },

    className: 'text-editor',

    events: {
        'keyup textarea': 'onKeyup',
        'input textarea': 'onInput',
        'copy textarea': 'onCopy',
        'cut textarea': 'onCut',
        'paste textarea': 'onPaste',
        'mousedown .char-selection-box': 'onMousedown',
        'dblclick .char-selection-box': 'onDoubleClick',
        'click .char-selection-box': 'onTripleClick'
    },

    selection: {
        start: null,
        end: null
    },

    selecting: false,

    _textCursor: null,

    // 10ms seems to work in all browsers (0ms does not work in Firefox)
    AFTER_KEYDOWN_DELAY: 10,

    DEFAULT_FONT_SIZE: 12,

    init: function() {

        util.bindAll(this, 'onMousedown', 'onMousemove', 'onMouseup', 'onDoubleClick', 'onTripleClick', 'onKeydown', 'onAfterPaste', 'onAfterKeydown', 'onDocumentPointerdown');

        const text = this.options.text;
        if (!text) throw new Error('ui.TextEditor: text option is mandatory');

        this.setTextElement(text);

        document.addEventListener('pointerdown', this.onDocumentPointerdown, { capture: true });

        $(document.body).on('mousemove', this.onMousemove);
        $(document.body).on('mouseup', this.onMouseup);
        $(document.body).on('keydown', this.onKeydown);

        // If $viewport is not set, Chrome prints a warning about "Discontiguous Selection" and selections are not rendered.
        this.$viewport = $(text);

        if (this.options.annotations) {
            this.setAnnotations(this.options.annotations);
        }
    },

    setTextElement: function(textElement) {
        this.options.text = textElement;
        this.bindTextElement(textElement);
    },

    bindTextElement: function(textElement) {
        this.unbindTextElement();
        if (!textElement) return;
        const $elText = $(textElement);
        $elText.on('mousedown', this.onMousedown);
        $elText.on('dblclick', this.onDoubleClick);
        $elText.on('click', this.onTripleClick);
        this.elText = textElement;
    },

    unbindTextElement: function() {
        const { elText } = this;
        if (!elText) return;
        const $elText = $(elText);
        $elText.off('mousedown', this.onMousedown);
        $elText.off('dblclick', this.onDoubleClick);
        $elText.off('click', this.onTripleClick);
        this.elText = null;
    },

    // @public
    render: function(root) {

        // The caret (cursor), displayed as a thin <div> styled in CSS.
        this.$caret = $('<div>', { 'class': 'caret' });

        // The container for selection boxes.
        this.$selection = $('<div>');
        // One selection box covering one character.
        this.$selectionBox = $('<div>', { 'class': 'char-selection-box' });
        this.$el.append(this.$caret, this.$selection);

        this.$textareaContainer = $('<div>', { 'class': 'textarea-container' });

        this.$textarea = $('<textarea>', this.options.textareaAttributes);
        this.textarea = this.$textarea[0];
        this._textContent = this.textarea.value = this.getTextContent();

        this._textareaValueBeforeInput = this.textarea.value;
        this.$textareaContainer.append(this.textarea);

        if (this.options.focus) {
            this.$el.append(this.$textareaContainer);
        }

        // First add the container element to the `<body>`, otherwise
        // the `focus()` called afterwards would not work.
        $(root || document.body).append(this.$el);

        const vText = V(this.options.text);
        const bbox = vText.bbox();

        this.$textareaContainer.css({
            left: bbox.x,
            top: bbox.y
        });

        this.focus();

        // TODO: This should be optional?
        this._textCursor = vText.attr('cursor');
        vText.attr('cursor', 'text');

        this.selectAll();

        return this;
    },

    annotateURLBeforeCaret: function(selectionStart) {

        if (selectionStart === 0) return false;
        // If whitespace character was added, check if there is not a URL
        // before the inserted text. If yes, annotate it.
        const index = Math.max(selectionStart - 1, 0);
        const urlBoundary = this.getURLBoundary(index);
        const annotations = this.getAnnotations() || [];
        if (urlBoundary) {
            this.annotateURL(annotations, urlBoundary[0], urlBoundary[1]);
            return true;
        }
        const annotationsAtIndex  = V.findAnnotationsAtIndex(annotations, index);
        if (annotationsAtIndex.some(a8n => a8n.url)) {
            return true;
        }

        return false;
    },

    hasSelection: function() {

        return util.isNumber(this.selection.start) &&
                util.isNumber(this.selection.end) &&
                this.selection.start !== this.selection.end;
    },

    textContentHasChanged: function() {

        return this._textContent !== this.textarea.value;
    },

    restoreTextAreaSelectionDirection: function() {

        if (this._selectionDirection) {
            this.textarea.selectionDirection = this._selectionDirection;
        }
    },

    storeSelectionDirection: function() {

        this._selectionDirection = this.textarea.selectionDirection;
    },

    updateSelectionFromTextarea: function() {
        const { selectionStart, selectionEnd } = this.textarea;
        if (selectionStart === selectionEnd) {
            this.setCaret(selectionStart);
        } else {
            this.select(selectionStart, selectionEnd);
        }
    },

    textSelectionHasChanged: function() {
        const { selection, textarea } = this;
        if (!selection || !textarea) return false;
        return (selection.start !== textarea.selectionStart || selection.end !== textarea.selectionEnd);
    },

    isModifierKey: function(evt) {
        var modifiers = [
            16, // 'shiftKey',
            18, // 'altKey',
            17, // 'ctrlKey',
            91  // 'metaKey'
        ];
        return modifiers.some(modifier => evt.which === modifier);
    },

    isArrowKey: function(evt) {
        return (evt.which >= 37 && evt.which <= 40)
    },


    copyToClipboard: function() {

        var copySupported = document.queryCommandSupported && document.queryCommandSupported('copy');

        if (copySupported) {
            this._copied = true;
            document.execCommand('copy');
        }
    },

    // @public
    // Find all the annotations in the `annotations` array that the
    // cursor at `selectionStart` position falls into.
    findAnnotationsUnderCursor: function(annotations, selectionStart) {

        return V.findAnnotationsAtIndex(annotations, selectionStart);
    },

    // @public
    // Find all the annotations that fall into the selection range specified by `selectionStart` and `selectionEnd`.
    // This method assumes the selection range is normalized.
    findAnnotationsInSelection: function(annotations, selectionStart, selectionEnd) {

        return V.findAnnotationsBetweenIndexes(annotations, selectionStart, selectionEnd);
    },

    // @private
    // This function infers the type of a text operation based solely on the selection indices
    // before and after the text input changed.
    inferTextOperationType: function(selectionBeforeInput, selectionAfterInput, diffLength) {

        if (selectionBeforeInput.start === selectionBeforeInput.end && selectionAfterInput.start === selectionAfterInput.end && diffLength > 0) {

            return 'insert';

        } else if (selectionBeforeInput.start === selectionBeforeInput.end && selectionAfterInput.start === selectionAfterInput.end && diffLength <= 0) {

            return 'delete-single';

        } else if (selectionBeforeInput.start !== selectionBeforeInput.end && selectionAfterInput.start === selectionAfterInput.end && selectionAfterInput.start === selectionBeforeInput.start) {

            return 'delete';

        } else if (selectionBeforeInput.start !== selectionBeforeInput.end && selectionAfterInput.start !== selectionBeforeInput.start) {

            // Delete followed by insert. The user might have selected a range and then started typing or pasting.
            return 'delete-insert';
        }

        return undefined;
    },

    // @private
    // Modify `annotations` (indices of all the affected annotations)
    // based on the user action defined by `selectionBeforeInput`, `selectionAfterInput` and `diffLength`.
    // For example, when the user inserts a new character, we want the new character to inherit
    // styling attributes (annotation) from the previous character (extend the affected annotation end index) and shift
    // all the following annotations by one to the right.
    // Note that this function modifies the original `annotations` array and returns it.
    annotate: function(annotations, selectionBeforeInput, selectionAfterInput, diffLength) {

        var newAnnotations = [];

        var opType = this.inferTextOperationType(selectionBeforeInput, selectionAfterInput, diffLength);

        util.toArray(annotations).forEach(function(annotation) {

            var inAnnotation, removedInAnnotation;

            switch (opType) {

                case 'insert':
                    if (annotation.start < selectionBeforeInput.start && selectionBeforeInput.start <= annotation.end) {
                        annotation.end += diffLength;
                    } else if (annotation.start >= selectionBeforeInput.start) {
                        // We're writing before the annotated portion, move the
                        // all the following annotations to the right.
                        annotation.start += diffLength;
                        annotation.end += diffLength;
                    }
                    break;

                case 'delete-single':
                    // TODO: backspace and delete are two different operations.
                    // It depends on the selectionAfterInput which one was used.
                    if (annotation.start < selectionBeforeInput.start && selectionBeforeInput.start <= annotation.end && selectionBeforeInput.start !== selectionAfterInput.start) {
                        // Backspace.
                        annotation.end += diffLength;
                    } else if (annotation.start <= selectionBeforeInput.start && selectionBeforeInput.start < annotation.end && selectionBeforeInput.start === selectionAfterInput.start) {
                        // Delete.
                        annotation.end += diffLength;
                    } else if (annotation.start >= selectionBeforeInput.start) {
                        // We're deleting before the annotated portion, move
                        // all the following annotations by diff length.
                        annotation.start += diffLength;
                        annotation.end += diffLength;
                    }
                    break;

                case 'delete':
                    if (annotation.start <= selectionBeforeInput.start && selectionBeforeInput.start <= annotation.end) {
                        if (selectionBeforeInput.end <= annotation.end) {
                            annotation.end += diffLength;
                        } else {
                            annotation.end += selectionAfterInput.start - annotation.end;
                        }
                    } else if (annotation.start >= selectionBeforeInput.start && annotation.start < selectionBeforeInput.end) {

                        // Part of the annotation is deleted.
                        inAnnotation = annotation.end - annotation.start;
                        removedInAnnotation = selectionBeforeInput.end - annotation.start;
                        annotation.start = selectionBeforeInput.start;
                        annotation.end = annotation.start + inAnnotation - removedInAnnotation;

                    } else if (annotation.start >= selectionBeforeInput.end) {
                        // Shift all the following annotations by the diff length.
                        annotation.start += diffLength;
                        annotation.end += diffLength;
                    }
                    break;


                case 'delete-insert':
                    // Delete followed by insert. The user might have selected a range and then started typing or pasting.

                    if (annotation.start <= selectionBeforeInput.start && selectionBeforeInput.start <= annotation.end) {
                        // If we're deleting something AFTER the annotation, we do now
                        // want the inserting characters to inherit the annotated properties.
                        // aBC[d]e -> aBCe   (not aBCE)
                        if (selectionBeforeInput.start < annotation.end) {

                            if (selectionBeforeInput.end > annotation.end) {
                                annotation.end = selectionAfterInput.end;
                            } else {
                                annotation.end = selectionAfterInput.end + (annotation.end - selectionBeforeInput.end);
                            }
                        }
                    } else if (annotation.start >= selectionBeforeInput.start && annotation.start <= selectionBeforeInput.end) {

                        // Part of the annotation is affected.
                        var addedChars = selectionAfterInput.start - selectionBeforeInput.start;
                        removedInAnnotation = selectionBeforeInput.end - annotation.start;
                        inAnnotation = annotation.end - annotation.start;
                        annotation.start = selectionBeforeInput.start + addedChars;
                        annotation.end = annotation.start + inAnnotation - removedInAnnotation;

                    } else if (annotation.start >= selectionBeforeInput.start && annotation.end <= selectionBeforeInput.end) {

                        // This annotation will be removed.
                        annotation.start = annotation.end = 0;

                    } else if (annotation.start >= selectionBeforeInput.end) {
                        // Shift all the following annotations by the diff length.
                        annotation.start += diffLength;
                        annotation.end += diffLength;
                    }
                    break;

                default:
                    // Unknown operation. Should never happen!
                    if (this.options.debug) {
                        console.log('ui.TextEditor: Unknown text operation.');
                    }
                    break;
            }

            if (annotation.end > annotation.start) {
                newAnnotations.push(annotation);
            }

        }, this);

        return newAnnotations;
    },

    shiftAnnotations: function(annotations, selectionStart, offset) {

        return V.shiftAnnotations(annotations, selectionStart, offset);
    },

    // @public
    // This method stores annotation attributes that will be used for the very next insert operation.
    // This is useful, for example, when we have a toolbar and the user changes text to e.g. bold.
    // At this point, we can just call `setCurrentAnnotation({ 'font-weight': 'bold' })` and let the
    // text editor know that once the user starts typing, the text should be bold.
    // Note that the current annotation will be removed right after the first text operation to come.
    // This is because after that, the next inserted character will already inherit properties
    // from the previous character which is our 'bold' text.
    setCurrentAnnotation: function(attrs) {

        this._currentAnnotationAttributes = attrs;
    },

    // @public
    // Set annotations of the text inside the text editor.
    // These annotations will be modified during the course of using the text editor.
    setAnnotations: function(annotations) {

        this._annotations = annotations;
    },

    // @public
    getAnnotations: function() {

        return this._annotations;
    },

    // @public
    // Get the combined (merged) attributes for a character at the position `selectionStart`
    // taking into account all the `annotations` that apply.
    getCombinedAnnotationAttrsAtIndex: function(selectionStart, annotations) {
        return getCombinedAnnotationAttrsAtIndex(util.toArray(annotations), selectionStart);
    },

    // @public
    // Find a common annotation among all the `annotations` that fall into the
    // `range` (an object with `start` and `end` properties - *normalized*).
    // For characters that don't fall into any of the `annotations`, assume
    // `defaultAnnotation` (default annotation does not need `start` and `end` properties).
    // The common annotation denotes the attributes that all the characters in the `range` share.
    // If any of the attributes for any character inside `range` differ, `undefined` is returned.
    // This is useful e.g. when your toolbar needs to reflect the text attributes of a selection.
    getSelectionAttrs: function(range, annotations) {
        const { start, end = start } = range;
        if (start === end) {
            return getCombinedAnnotationAttrsAtIndex(annotations, start - 1);
        } else {
            return getCombinedAnnotationAttrsBetweenIndexes(annotations, start, end);
        }
    },

    // @public
    // Return the text content (including new line characters) inside the `<text>` SVG element.
    // We assume that each <tspan> represents a new line in the order in which
    // they were added to the DOM.
    getTextContent: function() {

        // Add a newline character for every <tspan> that is a line. Such
        // tspans must be marked with the `line` class.
        var elText = this.options.text;
        var tspans = V(elText).find('.v-line');
        return tspans.length === 0 ? elText.textContent : tspans.reduce(function(memo, tspan, i, tspans) {
            var line = tspan.node.textContent;
            // Empty lines are assumed to be marked with the `empty-line` class.
            if (tspan.hasClass('v-empty-line')) line = '';
            // Last line does not need a new line (\n) character at the end.
            return (i === tspans.length - 1) ? memo + line : memo + line + '\n';
        }, '');
    },

    startSelecting: function() {

        this.selecting = true;
    },

    stopSelecting: function() {

        this.selecting = false;
    },

    selectionInProgress: function() {

        return this.selecting === true;
    },

    // @public
    // Select the whole text.
    selectAll: function() {

        return this.select(0, this.getNumberOfChars());
    },

    // @public
    // Select a portion of the text starting at `startCharNum`
    // character position ending at `selectionEnd` character position.
    // This method automatically swaps `startCharNum` and `endCharNum`
    // if they are in the wrong order.
    select: function(startCharNum, endCharNum) {

        const { options, selection } = this;

        if (options.debug) {
            console.log('select(', startCharNum, endCharNum, ')');
        }

        const prevStart = selection.start;
        const prevEnd = selection.end;

        if (endCharNum === undefined) {
            endCharNum = startCharNum;
        }

        if (util.isNumber(startCharNum)) {
            selection.start = startCharNum;
        }

        if (util.isNumber(endCharNum)) {
            selection.end = endCharNum;
        }

        if (!util.isNumber(selection.end)) {
            selection.end = selection.start;
        }

        const { start, end } = selection;
        if (util.isNumber(start) && util.isNumber(end)) {

            const changed = prevStart !== start || prevEnd !== end;
            if (changed) {
                // Reset the current annotation if the selection is changed.
                this.setCurrentAnnotation(null);
            }

            if (start === end) {
                this.clearSelection();
                this.focus();
                this.setCaret(start);
            } else {
                this.hideCaret();
                this.setTextAreaSelection(start, end);
                const text = this.textarea.value;
                if ((start > end) && this.constructor.isLineEnding(text, end)) {
                    //  Fix R2L selection going over a new line (fixed by trial and error)
                    if (this.constructor.isLineStart(text, start) && end !== start - 1) {
                        this.renderSelection(end, start - 2)
                    } else {
                        this.renderSelection(end, start - 1);
                    }
                } else {
                    this.renderSelection(start, end);
                }
            }

            this.trigger('select:change', start, end);
        }

        return this;
    },

    setTextAreaSelection: function(start, end) {

        var selection = {
            start: start,
            end: end
        };

        selection = this.normalizeSelectionRange(selection);

        this.textarea.focus();
        this.textarea.selectionStart = selection.start;
        this.textarea.selectionEnd = selection.end;
    },

    renderSelection: function(start, end) {

        if (this.options.debug) {
            console.log('renderSelection()');
        }

        var selection = {
            start: start,
            end: end
        };

        selection = this.normalizeSelectionRange(selection);

        this.clearSelection();

        if (this.options.useNativeSelection) {

            // Use native selection.

            // Allow selection of elements in the paper.
            if (this.$viewport) {

                // Save this so that it can be reverted later.
                this._viewportUserSelectBefore = this.$viewport.css('user-select');

                this.$viewport.css({
                    '-webkit-user-select': 'all',
                    '-moz-user-select': 'all',
                    'user-select': 'all'
                });
            }

            var length = (selection.end - selection.start);

            this.selectTextInElement(this.options.text, selection.start, length);

        } else {

            // Fallback to the old method of rendering the selection box using a <div> for each character.

            this.renderSelectionBoxes(selection.start, selection.end);
        }
    },

    normalizeSelectionStartAndLength: function(text, start, length) {

        var textBefore = text.substr(0, start);
        var textSelected = text.substr(start, length);

        // Linebreaks aren't counted by the selectSubString() method.
        var numLineBreaksBefore = this.countLineBreaks(textBefore);
        var numLineBreaksInSelection = this.countLineBreaks(textSelected);

        start -= numLineBreaksBefore;
        length -= numLineBreaksInSelection;

        // "Empty lines" contain a hidden hyphen symbol, which are counted.
        var numEmptyLinesBefore = this.countEmptyLines(textBefore);
        var numEmptyLinesInSelection = this.countEmptyLines(textSelected);

        start += numEmptyLinesBefore;
        length += numEmptyLinesBefore;
        length -= numEmptyLinesBefore;
        length += numEmptyLinesInSelection;

        return {
            start: start,
            length: length
        };
    },

    selectTextInElement: function(element, start, length) {

        if (util.isFunction(element.selectSubString)) {

            // Try using selectSubString().
            this.selectTextInElementUsingSelectSubString(element, start, length);
        }

        // Is the expected selected content is different from the actual selected content?
        if (!this.actualSelectionMatchesExpectedSelection(start, length)) {

            // Fallback to using ranges.

            try {

                this.selectTextInElementUsingRanges(element, start, length);

            } catch (error) {

                if (this.options.debug) {
                    console.log(error);
                }

                if (util.isFunction(element.selectSubString)) {
                    // Try again using selectSubString().
                    this.selectTextInElementUsingSelectSubString(element, start, length);
                }
            }
        }
    },

    selectTextInElementUsingSelectSubString: function(element, start, length) {

        // Note:
        // When using this method, Firefox doesn't do well when the selection spans multiple <tspan> elements.
        // In that case only the first <tspan> is selected.

        var normalized = this.normalizeSelectionStartAndLength(this.getTextContent(), start, length);

        try {

            element.selectSubString(normalized.start, normalized.length);

        } catch (error) {

            if (this.options.debug) {
                console.log(error);
            }
        }
    },

    selectTextInElementUsingRanges: function(element, start, length) {

        // Some browsers (Chrome) don't allow "discontiguous" ranges.
        // A "discontiguous" range is a range that includes multiple elements.
        // This isn't a problem for Firefox.

        var selection = window.getSelection();

        selection.removeAllRanges();

        var normalized = this.normalizeSelectionStartAndLength(this.getTextContent(), start, length);

        start = 0 + normalized.start;
        length = 0 + normalized.length;

        var textNodes = this.getTextNodesFromDomElement(element);
        var textNode;
        var textNodeStart;
        var textNodeEnd;
        var setStart;
        var setEnd;
        var offset = 0;
        var end = start + length;

        var range = document.createRange();

        while (length > 0 && textNodes.length > 0) {

            textNode = textNodes.shift();
            textNodeStart = offset;
            textNodeEnd = offset + textNode.length;

            if (
                (textNodeStart >= start && textNodeStart < end) ||
                (textNodeEnd > start && textNodeEnd <= end) ||
                (start >= textNodeStart && start < textNodeEnd) ||
                (end > textNodeStart && end <= textNodeEnd)
            ) {

                setStart = Math.max(start - textNodeStart, 0);
                setEnd = Math.min(setStart + Math.min(length, textNode.length), textNodeEnd);
                if (range.collapsed) {
                    range.setStart(textNode, setStart);
                }
                range.setEnd(textNode, setEnd);
                length -= (setEnd - setStart);
            }

            offset += textNode.length;
        }

        if (!range.collapsed) {
            selection.addRange(range);
        }
    },

    actualSelectionMatchesExpectedSelection: function(start, length) {

        var selection = window.getSelection();
        var actualSelectedContent = selection.toString();
        var expectedSelectedContent = this.getExpectedSelectedContent(start, length);

        // Replace tab characters with space characters.
        actualSelectedContent = actualSelectedContent.replace(/\s/g, ' ');

        return expectedSelectedContent === actualSelectedContent;
    },

    getExpectedSelectedContent: function(start, length) {

        var textContent = this.getTextContent();
        var expectedSelectedContent = textContent.substr(start, length);

        // Replace empty lines with a hyphen character.

        if (expectedSelectedContent.search(/(\n\r|\r|\n)/) === 0) {
            // The new line character on the first position always creates an empty line
            expectedSelectedContent = '-' + expectedSelectedContent;
        }

        expectedSelectedContent = expectedSelectedContent.replace(/(\n\r|\r|\n){2,}/g, (match) => {
            return Array.from({ length: match.length - 1 }, () => '-').join('');
        });

        // Remove single line break characters.
        expectedSelectedContent = expectedSelectedContent.replace(/\n\r|\r|\n/g, '');

        // Replace tab characters with space characters.
        expectedSelectedContent = expectedSelectedContent.replace(/\s/g, ' ');

        return expectedSelectedContent;
    },

    getTextNodesFromDomElement: function(element) {

        var textNodes = [];

        for (var i = 0, n = element.childNodes.length; i < n; i++) {
            var childNode = element.childNodes[i];
            if (childNode.tagName !== undefined) {

                // Not a text node.

                textNodes = textNodes.concat(this.getTextNodesFromDomElement(childNode));

            } else {

                textNodes.push(childNode);
            }
        }

        return textNodes;
    },

    renderSelectionBoxes: function(start, end) {

        if (this.options.debug) {
            console.log('renderSelectionBoxes()');
        }

        this.$selection.empty();

        var fontSize = this.getFontSize();
        var t = this.getTextTransforms();
        var angle = t.rotation;

        // Cache of a previous selection box element.
        var $prevBox;
        // Cache for a bounding box of a previous character.
        var prevBbox;

        var bbox;
        for (var i = start; i < end; i++) {

            var $box = this.$selectionBox.clone();

            // `getCharBBox()` can throw an exception in situations where
            // the character position is outside the range where
            // the `getStartPositionOfChar()` and `getEndPositionOfChar()`
            // methods can operate. An example of this is a text along a path
            // that is shorter than that of the text. In this case,
            // we fail silently. This is safe because the result of this
            // is selection boxes not being rendered for characters
            // outside of the visible text area - which is actually desired.
            try {
                bbox = this.getCharBBox(i);
            } catch (e) {
                this.trigger('select:out-of-range', start, end);
                break;
            }

            // A small optimization for the number of char-selection-box div elements.
            // If one box is right after the other, there is no need to render them both.
            // Instead, simply adjust the width of the previous one.
            if (prevBbox && angle === 0 && Math.round(bbox.y) === Math.round(prevBbox.y) &&
                Math.round(bbox.height) === Math.round(prevBbox.height) &&
                Math.round(bbox.x) === Math.round(prevBbox.x + prevBbox.width)) {

                $prevBox.css({ width: '+=' + bbox.width });

            } else {

                // Using font size instead of bbox.height makes the bounding box
                // of the character more precise. Unfortunately, getting an accurate
                // bounding box of a character in SVG is not easy.
                $box.css({
                    left: bbox.x,
                    top: bbox.y - bbox.height,
                    width: bbox.width,
                    height: bbox.height,
                    '-webkit-transform': 'rotate(' + angle + 'deg)',
                    '-webkit-transform-origin': '0% 100%',
                    '-moz-transform': 'rotate(' + angle + 'deg)',
                    '-moz-transform-origin': '0% 100%'
                });
                this.$selection.append($box);
                $prevBox = $box;
            }
            prevBbox = bbox;
        }

        if (bbox) {

            this.$textareaContainer.css({
                left: bbox.x,
                top: bbox.y - fontSize * t.scaleY
            });
        }
    },

    clearSelection: function() {

        if (this.options.debug) {
            console.log('clearSelection()');
        }

        this.$selection.empty();

        if (this.options.text.selectSubString) {

            if (this.$viewport && this._viewportUserSelectBefore) {
                this.$viewport.css({
                    '-webkit-user-select': this._viewportUserSelectBefore,
                    '-moz-user-select': this._viewportUserSelectBefore,
                    'user-select': this._viewportUserSelectBefore
                });
            }

            window.getSelection().removeAllRanges();
        }

        return this;
    },

    // @public
    // Cancel selection of the text.
    deselect: function() {

        if (this.options.debug) {
            console.log('deselect()');
        }

        this.stopSelecting();
        this.clearSelection();
        this.setTextAreaSelection(this.selection.start, this.selection.end);

        return this;
    },

    // @public
    // Return the start character position of the current selection.
    getSelectionStart: function() {

        return this.selection.start;
    },

    // @public
    // Return the end character position of the current selection.
    getSelectionEnd: function() {

        return this.selection.end;
    },

    // @public
    // Return an object with `start` and `end` properties describing
    // the *normalized* selection range.
    getSelectionRange: function() {

        return this.normalizeSelectionRange(this.selection);
    },

    normalizeSelectionRange: function(selection) {

        selection = util.clone(selection);

        // Normalize.
        if (selection.start > selection.end) {
            selection.end = [selection.start, selection.start = selection.end][0];
        }

        return selection;
    },

    // @public
    // Return the length of the selection.
    getSelectionLength: function() {

        var range = this.getSelectionRange();
        return range.end - range.start;
    },

    // @public
    // Return the selected text.
    getSelection: function() {

        var range = this.getSelectionRange();
        return this.getTextContent().slice(range.start, range.end);
    },

    // @public
    // Return the start and end character positions for a word
    // under `charNum` character position.
    getWordBoundary: function(charNum) {

        var text = this.textarea.value;
        var re = /\W/;

        var start = charNum;
        while (start) {
            if (re.test(text[start])) {
                start += 1;
                break;
            }
            start -= 1;
        }

        var numberOfChars = this.getNumberOfChars();
        var end = charNum;
        while (end < numberOfChars) {
            if (re.test(text[end])) {
                break;
            }
            end += 1;
        }

        // Normalize before returning.
        return (start < end) ? [start, end] : [end, start];
    },

    getURLBoundary: function(charNum) {

        var text = this.textarea.value;

        var whitespaceRegEx = /\s/;
        var webUrlRegEx = /[-a-zA-Z0-9@:%_+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_+.~#?&//=]*)?/;
        var start = charNum;
        while (start > -1) {
            if (whitespaceRegEx.test(text[start])) {
                start += 1;
                break;
            }
            start -= 1;
        }
        start = Math.max(start, 0);
        var numberOfChars = this.getNumberOfChars();
        var end = Math.max(start, charNum);
        while (end <= numberOfChars) {
            if (whitespaceRegEx.test(text[end])) {
                break;
            }
            end += 1;
        }
        end = Math.min(end, numberOfChars);
        if (webUrlRegEx.test(text.substring(start, end))) {
            return [start, end];
        }
        return undefined;
    },

    annotateURL: function(annotations, start, end) {

        // Include the actual URL with the annotation object. This is very useful to
        // have for cases where the text does not reflect the URL but rather only the title of the URL.
        // In this case, we still want to know what was the original URL.
        const url = this.textarea.value.substring(start, end);

        // Do not add the annotation if there is the same one already.
        if (annotations.some(a8n => (a8n.url === url && a8n.start === start && a8n.end === end))) {
            return annotations;
        }

        let urlAnnotation;
        const { urlAnnotation: userUrlAnnotation } = this.options;
        if (typeof userUrlAnnotation === 'function') {
            urlAnnotation = userUrlAnnotation(url);
            if (!urlAnnotation) return annotations;
        } else {
            urlAnnotation = util.assign({}, userUrlAnnotation);
        }

        util.assign(urlAnnotation, { url, start, end });

        annotations.push(urlAnnotation);

        return annotations;
    },

    // Get the bounding box (in screen coordinates) of the character
    // under `charNum` position (the real one, not the SVG one).
    getCharBBox: function(charNum) {

        // For a newline character (line ending), return a bounding box
        // that is derived from the previous - non newline - character
        // and move it to the right of that character.
        if (this.isLineEnding(charNum)) {
            var bbox = this.getCharBBox(charNum - 1);
            //bbox.x = bbox.x + bbox.width + -7;
            bbox.x = bbox.x2;
            bbox.y = bbox.y2;
            bbox.width = this.options.newlineCharacterBBoxWidth || 10;
            return bbox;
        }

        this.ensureTextVisibility();

        var svgCharNum = this.realToSvgCharNum(charNum);
        var elText = this.options.text;
        var startPosition = elText.getStartPositionOfChar(svgCharNum);
        var endPosition = elText.getEndPositionOfChar(svgCharNum);
        var extent = elText.getExtentOfChar(svgCharNum);

        startPosition = this.localToScreenCoordinates(startPosition);
        endPosition = this.localToScreenCoordinates(endPosition);

        var t = this.getTextTransforms();
        var x = startPosition.x;
        var y = startPosition.y;
        var w = extent.width * t.scaleX;
        var h = extent.height * t.scaleY;

        return { x: x, y: y, width: w, height: h, x2: endPosition.x, y2: endPosition.y };
    },

    realToSvgCharNum: function(charNum) {
        // Calculate the position of the character in the SVG `<text>` element.
        // The reason why those two don't match (`charNum` and `svgCharNum`) is
        // because in the SVG `<text>` element, there are no newline characters.
        var lineEndings = 0;
        for (var i = 0; i <= charNum; i++) {
            if (this.isLineEnding(i)) {
                lineEndings += 1;
            }
        }

        return charNum - lineEndings;
    },

    selectionStartToSvgCharNum: function(selectionStart) {

        return selectionStart - this.nonEmptyLinesBefore(selectionStart);
    },

    svgToRealCharNum: function(svgCharNum) {

        var newLinesBefore = 0;
        for (var i = 0; i <= svgCharNum + newLinesBefore; i++) {
            if (this.isLineEnding(i)) {
                newLinesBefore += 1;
            }
        }
        return svgCharNum + newLinesBefore;
    },

    ensureTextVisibility: function() {

        // [IE fix] The text element must be visible, otherwise getCTM() doesn't work.
        // See:
        // http://stackoverflow.com/questions/10714779/svgs-node-getscreenctm-method-failing-in-ie-9/10731378#10731378
        $(this.options.text).show();
    },

    localToScreenCoordinates: function(p) {

        return V.transformPoint(p, this.options.text.getCTM());
    },

    // @public
    // Return the number of characters in the text.
    getNumberOfChars: function() {

        return this.getTextContent().length;
    },

    // @public
    // Return the character position (the real one) the user clicked on.
    // If there is no such a position found, return the last one.
    getCharNumFromEvent: function(evt) {

        const elText = this.options.text;
        const localPoint = V(elText).toLocalPoint(evt.clientX, evt.clientY);
        return this.getCharNumAtPosition(localPoint);
    },

    getCharNumAtPosition: function(localPoint) {

        this.ensureTextVisibility();

        var elText = this.options.text;
        var svgCharNum = elText.getCharNumAtPosition(localPoint);

        // The user clicked somewhere outside, always return the last or the first char num.
        if (svgCharNum < 0) {

            var localTextBBox = V(elText).getBBox();
            // Firefox would otherwise ignore the characters at the beginning and end of the text.
            localTextBBox.inflate(-1);
            var insideTextBBox = localTextBBox.containsPoint(localPoint);
            if (!insideTextBBox && this.hasSelection() && localTextBBox.clone().inflate(this.options.selectAllThreshold).containsPoint(localPoint)) {
                return this.selection.end;
            }

            var nearest = (insideTextBBox) ? localPoint : localTextBBox.pointNearestToPoint(localPoint);
            var p = V.createSVGPoint(nearest.x, nearest.y);
            var nearestCharNum = elText.getCharNumAtPosition(p);
            var right = (localPoint.x > localTextBBox.x);

            if (nearestCharNum === -1) {
                var start = localTextBBox.x;
                var end = localTextBBox.x + localTextBBox.width;
                var prevPivot;
                var pivot = (start + end) / 2;
                do {
                    p.x = pivot;
                    var currentNearestCharNum = elText.getCharNumAtPosition(p);
                    if (currentNearestCharNum > -1) nearestCharNum = currentNearestCharNum;
                    prevPivot = pivot;
                    if (right && currentNearestCharNum > -1 || !right && currentNearestCharNum === -1) {
                        pivot = (pivot + end) / 2;
                        start = prevPivot;
                    } else {
                        pivot = (start + pivot) / 2;
                        end = prevPivot;
                    }
                } while (Math.abs(prevPivot - pivot) > 1)
            }
            if (nearestCharNum > -1) {
                const realCharNum = this.svgToRealCharNum(nearestCharNum);
                if (!right || this.getTextContent()[realCharNum] === '\n') return realCharNum;
                return realCharNum + 1;
            }

            return (localPoint.x < localTextBBox.x && localPoint.y < (localTextBBox.y + localTextBBox.height)) ? 0 : this.getNumberOfChars();
        }

        var clientScreen = this.localToScreenCoordinates(localPoint);

        // If the user clicked on the "left" side of the character,
        // return the character position of the clicked character, otherwise
        // return the character position of the character after the clicked one.
        var bbox = this.getCharBBox(this.svgToRealCharNum(svgCharNum));
        if (Math.abs(bbox.x - clientScreen.x) < Math.abs(bbox.x + bbox.width - clientScreen.x)) {

            return this.svgToRealCharNum(svgCharNum);
        }

        return this.svgToRealCharNum(svgCharNum) + 1;
    },

    lineNumber: function(selectionStart) {

        var text = this.textarea.value.substr(0, selectionStart);

        return this.countLineBreaks(text);
    },

    emptyLinesBefore: function(selectionStart) {

        var lines = this.textarea.value.split(/\n\r|\r|\n/g);
        var lineNumber = this.lineNumber(selectionStart);
        var n = 0;
        for (var i = lineNumber - 1; i >= 0; i--) {
            if (!lines[i]) {
                n += 1;
            }
        }
        return n;
    },

    countLineBreaks: function(text) {

        return (text.match(/\n\r|\r|\n/g) || []).length;
    },

    countEmptyLines: function(text) {

        let count = (text.match(/(\n\r|\r|\n){2,}/g) || []).reduce((res, breaks) => {
            return res + (breaks.length - 1);
        }, 0);

        if (text.search(/(\n\r|\r|\n)/) === 0) {
            // The new line character on the first position always creates an empty line
            count++;
        }

        return count;
    },

    nonEmptyLinesBefore: function(selectionStart) {

        return this.lineNumber(selectionStart) - this.emptyLinesBefore(selectionStart);
    },

    isEmptyLine: function(lineNumber) {

        var lines = this.textarea.value.split(/\n\r|\r|\n/g);
        return !lines[lineNumber];
    },

    isEmptyLineUnderSelection: function(selectionStart) {

        var lineNumber = this.lineNumber(selectionStart);
        return this.isEmptyLine(lineNumber);
    },

    // Return `true` if the character at the position `charNum` is
    // a newline character but does not denote an empty line.
    // In other words, the newline character under `charNum` is
    // ending a non-empty line.
    isLineEnding: function(charNum) {
        return this.constructor.isLineEnding(this.textarea.value, charNum);
    },

    getTextTransforms: function() {

        var screenCTM = this.options.text.getCTM();
        return V.decomposeMatrix(screenCTM);
    },

    getFontSize: function() {
        const { DEFAULT_FONT_SIZE, options } = this;
        const fontSize = parseFloat(options.text.getAttribute('font-size'));
        return Number.isNaN(fontSize) ? DEFAULT_FONT_SIZE : fontSize;
    },

    getFontFill: function() {
        const { options } = this;
        const fontColor = options.text.getAttribute('fill');
        return fontColor || '';
    },

    getTextAnchor: function() {
        const { options } = this;
        const textAnchor = options.text.getAttribute('text-anchor');
        return textAnchor || '';
    },

    getCaretAttrs(index) {

        const annotations = this.getAnnotations() || [];
        const currentAnnotationAttrs = this._currentAnnotationAttributes;

        if (annotations.length === 0 && !currentAnnotationAttrs) {
            return {
                'font-size': this.getFontSize(),
                'fill': this.getFontFill()
            };
        }

        const currentAnnotations = [...annotations, { attrs: currentAnnotationAttrs }];
        const attrs = getCombinedAnnotationAttrsAtIndex(currentAnnotations, index - 1);
        const fontSize = parseFloat(attrs['font-size']);
        const fontFill = attrs['fill'];
        return {
            'font-size': Number.isNaN(fontSize) ? this.getFontSize() : fontSize,
            'fill': fontFill || this.getFontFill()
        }
    },

    // @public
    // Set the caret position based on the selectionStart of the textarea unless
    // `charNum` is provided in which case the caret will be set just before the
    // character at `charNum` position (starting from 0).
    setCaret: function(charNum, opt) {

        this.ensureTextVisibility();

        if (util.isObject(charNum)) {
            opt = charNum;
            charNum = undefined;
        }

        opt = opt || {};

        var numberOfChars = this.getNumberOfChars();
        var selectionStart = this.selection.start;

        if (typeof charNum !== 'undefined') {

            // Keep the character number within the valid range of characters.
            charNum = Math.min(Math.max(charNum, 0), numberOfChars);

            selectionStart = this.selection.start = this.selection.end = charNum;
        }

        if (!opt.silent) {
            this.trigger('caret:change', selectionStart);
        }

        if (this.options.debug) {
            console.log('setCaret(', charNum, opt, ')', 'selectionStart', selectionStart, 'isLineEnding', this.isLineEnding(selectionStart), 'isEmptyLineUnderSelection', this.isEmptyLineUnderSelection(selectionStart), 'svgCharNum', this.selectionStartToSvgCharNum(selectionStart), 'nonEmptyLinesBefore', this.nonEmptyLinesBefore(selectionStart));
        }

        this.updateCaret();

        this.setTextAreaSelection(selectionStart, selectionStart);

        // Always focus. If the caret was set as a reaction on
        // mouse click, the textarea looses focus in FF.
        this.focus();

        return this;
    },

    updateCaret: function() {

        const {
            $caret,
            $textareaContainer,
            selection,
            options,
            textarea
        } = this;

        const selectionStart = selection.start;
        const { text, placeholder } = options;
        const numberOfChars = this.getNumberOfChars();

        let caretPosition;
        // `getStartPositionOfChar()` or `getEndPositionOfChar()` can throw an exception
        // in situations where the character position is outside the range of
        // the visible text area. In this case, we just hide the caret altogether -
        // which is desired because the user is editing a text that is not visible.
        // An example of this is a text along a path that is shorter than that of the text.
        try {
            let charIndex;
            // - If we're on an empty line, always take the start position of the
            //   SVG space character on that line.
            // - If we're at the end of the line, take the end position of the SVG character before.
            // - If we're at the end of the text, also take the end position of the character before.
            // - For all other cases, take the start position of the SVG character before the selection.
            if (
                !this.isEmptyLineUnderSelection(selectionStart) &&
                (this.isLineEnding(selectionStart) || textarea.value.length === selectionStart)
            ) {
                charIndex = this.selectionStartToSvgCharNum(selectionStart) - 1;
                caretPosition = text.getEndPositionOfChar(charIndex);
            } else {
                charIndex = this.selectionStartToSvgCharNum(selectionStart);
                caretPosition = text.getStartPositionOfChar(charIndex);
            }
        } catch (e) {
            this.trigger('caret:out-of-range', selectionStart);
            caretPosition = {
                x: 0,
                y: 0
            };
        }

        // Convert the caret local position (in the coordinate system of the SVG `<text>`)
        // into screen coordinates.
        var { x, y } = this.localToScreenCoordinates(caretPosition);
        // Set the position of the caret. If the number of characters is zero, the caretPosition
        // is `{ x: 0, y: 0 }`, therefore it is not the the bottom right corner of the character but
        // the top left. Therefore, we do not want to shift the caret up using the `margin-top` property.
        const { rotation, scaleY } = this.getTextTransforms();
        const caretAttrs = this.getCaretAttrs(selectionStart);
        const caretSize = caretAttrs['font-size'] * scaleY;
        const caretColor = caretAttrs['fill'];

        if (placeholder) {
            const placeholderText = (typeof placeholder == 'string') ? placeholder : 'Enter text...';
            $caret.attr('data-placeholder-text', placeholderText);
            $caret.toggleClass('placeholder', numberOfChars === 0);
        }

        $caret.css({
            'left': x,
            'top': y - caretSize,
            'height': caretSize,
            'line-height': `${caretSize}px`,
            'font-size': `${caretSize}px`,
            '-webkit-transform': `rotate(${rotation}deg)`,
            '-webkit-transform-origin': '0% 100%',
            '-moz-transform': `rotate(${rotation}deg)`,
            '-moz-transform-origin': '0% 100%',
            'background-color': caretColor
        }).attr({
            // Important for styling the placeholder in CSS
            'text-anchor': this.getTextAnchor()
        }).show();

        $textareaContainer.css({
            left: x,
            top: y - caretSize
        });
    },

    focus: function() {

        if (this.options.debug) {
            console.log('focus()');
        }

        this.showCaret();

        return this;
    },

    blur: function() {

        if (this.options.debug) {
            console.log('blur()');
        }

        this.hideCaret();

        return this;
    },

    showCaret: function() {

        if (this.options.debug) {
            console.log('showCaret()');
        }

        this.$caret.show();

        return this;
    },

    // @public
    // Hide the caret (cursor).
    hideCaret: function() {

        if (this.options.debug) {
            console.log('hideCaret()');
        }

        this.$caret.hide();

        return this;
    },

    onRemove: function() {

        const { text, cellView = null } = this.options;

        this.deselect();
        this.unbindTextElement();

        document.removeEventListener('pointerdown', this.onDocumentPointerdown, { capture: true });

        $(document.body).off('mousemove', this.onMousemove);
        $(document.body).off('mouseup', this.onMouseup);
        $(document.body).off('keydown', this.onKeydown);

        // TODO: Optional?
        V(text).attr('cursor', this._textCursor);

        this.trigger('close', text, cellView);
    },

    /**
     * Event Callbacks
     */

    onDocumentPointerdown: function(evt) {
        const { text, onOutsidePointerdown } = this.options;
        const { target } = evt;
        if (text === target) return;
        if (text.contains(target)) return;
        if (typeof onOutsidePointerdown === 'function') {
            onOutsidePointerdown.call(this, evt, this);
        }
    },

    onKeydown: function(evt) {

        if (this.options.debug) {
            console.log('onKeydown(): ', evt.keyCode);
        }

        const onKeydownFn = this.options.onKeydown;
        if (typeof onKeydownFn === 'function') {
            onKeydownFn.call(this, evt, this);
            if (evt.isPropagationStopped()) return;
        }

        if (this.isModifierKey(evt)) return;

        if (this.hasSelection()) {
            this.deselect();
            // Restore the textarea.selectionDirection so that the textarea knows in what direction
            // it should select in case Shift+Arrow keys are used.
            this.restoreTextAreaSelectionDirection();
        }

        // The stream of events when typing something to the textarea is:
        // keydown -> keypress/paste -> letter typed in textarea -> keyup.
        // Therefore, in keydown, we can store the selectionStart
        // value of the textarea before it is adjusted based on the input.
        // Also note that we use keydown and not keypress because
        // e.g. BACKSPACE key is not handled in keypress.

        // We want the navigation keys to be reflected in the UI immediately on keydown.
        // However, at that time, the textarea's selectionStart/End does not yet
        // take into account this very keydown action. Hence we need to
        // defer the `setCaret()` to the next turn. Note that there is no other way
        // as keypress is not triggered for arrow keys and when keyup is triggered, it's too late.
        setTimeout(this.onAfterKeydown, this.AFTER_KEYDOWN_DELAY);

        this._copied = false;
        this._selectionStartBeforeInput = this.textarea.selectionStart;
        this._selectionEndBeforeInput = this.textarea.selectionEnd;
    },

    // Called after the textarea handled the keydown. Remember the order of events:
    // onKeydown -> textarea receives keydown -> onAfterKeydown
    onAfterKeydown: function() {

        if (this.textarea === document.activeElement) {
            // Remember the textarea.selectionDirection because select() wipes it out (by cleaning selections).
            // We will restore it just before the keydown is received by the textarea so that the
            // textarea selects in the right direction (using the Shift+Arrow keys).
            this.storeSelectionDirection();
            this.setCurrentAnnotation(null);
            this.updateSelectionFromTextarea();
        }
    },

    onKeyup: function(evt) {

        if (this.textContentHasChanged()) {
            this.onInput(evt);
        }
        if (this.textSelectionHasChanged() && !this.isArrowKey(evt)) {
            const { selectionEnd, selectionStart } = this.textarea;
            // On KeyUp is supposed to handle text selection (e.g. ctrl+a), not the cursor position change
            if (selectionEnd !== selectionStart) this.updateSelectionFromTextarea();
        }
    },

    onCopy: function(evt) {

        if (!this._copied) {
            this.copyToClipboard();
        }
    },

    onCut: function(evt) {

        if (!this._copied) {
            this.copyToClipboard();
        }
    },

    onInput: function(evt) {

        if (!this.textContentHasChanged()) return;

        var diffLength = this.textarea.value.length - this._textareaValueBeforeInput.length;

        var selectionBeforeInput = {
            start: this._selectionStartBeforeInput,
            end: this._selectionEndBeforeInput
        };

        var selectionAfterInput = {
            start: this.textarea.selectionStart,
            end: this.textarea.selectionEnd
        };


        this.selection.start = this.textarea.selectionStart;
        this.selection.end = this.textarea.selectionEnd;

        if (this.options.debug) {
            console.log('onInput()', evt, 'selectionBeforeInput', selectionBeforeInput, 'selectionAfterInput', selectionAfterInput, 'diffLength', diffLength);
        }

        var opType = this.inferTextOperationType(selectionBeforeInput, selectionAfterInput, diffLength);
        var annotated = false;

        var annotations = this.getAnnotations();

        // If URL annotation is enabled and the user inserts a whitespace character,
        // try to detect a URL before the whitespace character. If one was found,
        // annotate it using the `urlAnnotation` option.
        if (this.options.annotateUrls && opType === 'insert') {

            var insertedText = this.textarea.value.substr(selectionBeforeInput.start, diffLength);
            if (this.options.debug) {
                console.log('onInput()', 'inserted text', insertedText);
            }

            if (/\s/.test(insertedText)) {

                annotated = this.annotateURLBeforeCaret(selectionBeforeInput.start);
                if (annotated) {
                    // Now we have to shift all the annotations after the inserted whitespace by one to the right.
                    annotations = this.shiftAnnotations(annotations, selectionAfterInput.end, diffLength);
                }
            }
        }

        if (annotations) {

            // Annotate only if it wasn't already annotated. This can happen if
            // URL annotation is enabled and we did indeed detect a URL. In this case,
            // the annotation is handed over to `annotateURL()` and not to the
            // generic annotation mechanism - based on the previous character.
            if (!annotated) {

                annotations = this.annotate(annotations, selectionBeforeInput, selectionAfterInput, diffLength);
            }

            if (this.options.debug) {
                console.log('onInput()', 'modified annotations', annotations);
            }

            // Take into account annotation attributes set from outside the text editor.
            // For example, if the user changes text to bold in the toolbar, the programmer
            // should call `setCurrentAnnotation()`. Then when the user starts typing ('insert' operation),
            // we want to create a new annotation with the desired attributes.
            if (this._currentAnnotationAttributes) {

                if (opType === 'insert') {

                    var insertAnnotation = {
                        start: selectionBeforeInput.start,
                        end: selectionAfterInput.end,
                        attrs: this._currentAnnotationAttributes
                    };
                    annotations.push(insertAnnotation);

                    // Current annotations are removed right after the very next input which is now.
                    // This is because the annotation already become part of the `annotations` array
                    // and so if the user continues typing, the next characters will inherit
                    // attributes of the previous one (which has our `insertAnnotation` applied).
                    this.setCurrentAnnotation(null);

                    if (this.options.debug) {
                        console.log('onInput()', 'insert annotation', insertAnnotation, 'final annotations', annotations);
                    }
                }
            }
        }

        this._annotations = annotations;

        this.trigger('text:change', this.textarea.value, this._textareaValueBeforeInput, annotations, selectionBeforeInput, selectionAfterInput);

        // Store the previous textarea value.
        this._selectionBeforeInput = selectionAfterInput;
        this._textareaValueBeforeInput = this.textarea.value;
        this._textContent = this.textarea.value;
    },

    onPaste: function(evt) {

        if (this.options.debug) {
            console.log('onPaste()');
        }

        this._textareaValueBeforeInput = this.textarea.value;

        // Give chance to react on when the text was actually pasted to the textarea
        // and the textarea adjusted its selectionStart/End.
        setTimeout(this.onAfterPaste, 0);
    },

    // Called after the textarea handled the paste. Remember the order of events:
    // onPaste -> textarea receives paste -> onAfterPaste
    onAfterPaste: function() {

        this.setCaret(this.textarea.selectionStart);
    },

    onMousedown: function(evt) {

        // Do not deselect the text if it is a triple-click in order to prevent
        // the "blinking effect" (deselect all -> select all). See `onTripleClick()`.
        if (evt.originalEvent.detail === 3) return;

        if (this.options.debug) {
            console.log('onMousedown()');
        }

        var selectionStart = this.getCharNumFromEvent(evt);

        this.startSelecting();
        this.select(selectionStart);

        // Prevent default action that could set focus
        // on the text element and therefore the textarea
        // inside the editor would loose it.
        evt.preventDefault();
        // Stop propagation, the active text editor takes over mousedown.
        evt.stopPropagation();
    },

    onMousemove: function(evt) {

        if (this.selectionInProgress()) {

            if (this.options.debug) {
                console.log('onMousemove()');
            }

            let selectionEnd = this.getCharNumFromEvent(evt);

            // Remember the textarea.selectionDirection so that we can restore it later.
            // The reason is that select() internally clears the selection (removes all ranges)
            // which then wipes out the selectionDirection. To make sure that
            // Shift+Arrow keys select in the right direction, we have to remember it and
            // restore it later.
            this.storeSelectionDirection();

            // This will keep the start of the selection and change only the end.
            this.select(null, selectionEnd);

            // The active text editor takes over mousemove during selection.
            evt.preventDefault();
            evt.stopPropagation();
        }
    },

    onMouseup: function(evt) {

        if (this.selectionInProgress()) {

            if (this.options.debug) {
                console.log('onMouseup()');
            }

            this.stopSelecting();
            this.trigger('select:changed', this.selection.start, this.selection.end);
        }
    },

    onDoubleClick: function(evt) {

        if (this.options.debug) {
            console.log('onDoubleClick()');
        }

        var charNum = this.getCharNumFromEvent(evt);
        var wordBoundary = this.getWordBoundary(charNum);
        this.select(wordBoundary[0], wordBoundary[1]);

        evt.preventDefault();
        evt.stopPropagation();
    },

    onTripleClick: function(evt) {

        if (evt.originalEvent.detail !== 3) return;

        if (this.options.debug) {
            console.log('onTripleClick()');
        }

        this.hideCaret();
        this.selectAll();

        evt.preventDefault();
        evt.stopPropagation();
    },

}, util.assign({

    // A tiny helper that checks if `el` is an SVG `<text>` or `<tspan>` element
    // and returns it if yes, otherwise it returns `undefined`.
    // Especially useful when working with events, e.g.:
    // $(document.body).on('click', function(evt) {
    //     var t = TextEditor.getTextElement(evt.target);
    //     if (t) { ... } else { ... }
    // })
    getTextElement: function(el) {

        var tagName = el.tagName.toUpperCase();

        if (tagName === 'TEXT' || tagName === 'TSPAN' || tagName === 'TEXTPATH') {

            if (tagName === 'TEXT') return el;
            return this.getTextElement(el.parentNode);
        }

        return undefined;
    },

    // @public
    // Start inline editing an SVG text element. Therefore, `el` should always
    // be either an SVG `<text>` element directly or any of its descendants
    // `<tspan>` or `<textpath>` in which case the text editor automatically
    // finds the nearest `<text>` element climbing up the DOM tree.
    // If it can't find any `<text>` element, an error is printed to the console
    // and `undefined` is returned. Otherwise, the instance of the `ui.TextEditor`
    // is returned.
    // Options:
    // `opt.placeholder` ... Placeholder that will be passed to the `ui.TextEditor` instance.
    // `opt.annotations` ... Annotations that will be set on the `ui.TextEditor` instance.
    // `opt.cellView` ... For simplicity, we add direct support for JointJS cells.
    // `opt.annotationsProperty` ... If `opt.cellView` is used, annotations will be looked up and set from/to the cellView model by this property name.
    // `opt.textProperty` ... If `opt.cellView` is used, text will be set to the cellView model to this property name.
    edit: function(el, opt) {

        opt = opt || {};

        // By default, the text editor automatically updates either the cellView text string
        // and annotations (if `opt.cellView` is used) or the SVG text element via Vectorizer.
        // This behaviour can be suppressed by passing `update: false` in the options.
        // In that case, it is the responsibility of the programmer to update the text and annotations.
        var update = opt.update !== false;

        this.options = util.assign({}, opt, { update });

        var textElement = this.getTextElement(el);

        if (!textElement) {

            if (this.options.debug) {
                console.log('ui.TextEditor: cannot find a text element.');
            }

            return undefined;
        }

        // If there was another active text editor open, close it first.
        this.close();

        this.ed = new TextEditor(util.assign({ text: textElement }, opt));

        // Proxy all events triggered by the `ui.TextEditor` to all the listeners
        // on the `ui.TextEditor` class singleton.
        this.ed.on('all', this.trigger, this);

        const { cellView = null } = opt;

        this.trigger('open', textElement, cellView);

        // The target container to render the `ui.TextEditor` instance into.
        // If `opt.cellView` is used, the `paper.el` will be used, otherwise the parent node
        // of the SVG document which our `textElement` resides will be used.
        var target;

        // Add support for JointJS cells to make integration easier.
        if (cellView) {

            target = cellView.paper.el;

            this.cellViewUnderEdit = cellView;
            // Prevent dragging during inline editing.
            this.cellViewUnderEditInteractiveOption = this.cellViewUnderEdit.options.interactive;
            this.cellViewUnderEdit.options.interactive = false;

            // Set annotations by the property name. Look them up from the cellView model.
            if (opt.annotationsProperty && !this.ed.getAnnotations()) {

                var annotations = this.cellViewUnderEdit.model.prop(opt.annotationsProperty);
                if (annotations) {
                    // Note that we have to deep clone the annotations so that
                    // all the backbone `changed` mechanism works. This is because
                    // the text editor modifies the `annotations` array in-place.
                    this.ed.setAnnotations(cloneDeep(annotations));
                }
            }

        } else {

            var svg = V(textElement).svg();
            target = svg.parentNode;
        }

        if (update) {

            this.ed.on('text:change', (newText, _oldText, annotations) => {
                if (cellView) {
                    this.updateCellView(cellView, newText, annotations);
                } else {
                    this.updateSVGTextNode(textElement, newText, annotations)
                }
            });
        }

        this.ed.render(target);

        return this;
    },

    updateCellView: function(cellView, text, annotations) {

        const { textProperty, annotationsProperty } = this.options;
        const { cid } = this.ed;
        const { model } = cellView;

        // If `opt.cellView` is used, we automatically set the new text and
        // annotations to the property defined in our options.
        if (textProperty) {
            model.prop(textProperty, text, {
                textEditor: cid,
                async: false
            });
        }

        if (annotationsProperty) {
            // Note that we have to deep clone the annotations so that
            // all the backbone `changed` mechanism works. This is because
            // the text editor modifies the `annotations` array in-place.
            model.prop(annotationsProperty, cloneDeep(annotations), {
                rewrite: true,
                textEditor: cid,
                async: false
            });
        }

    },

    updateSVGTextNode: function(node, text, annotations) {
        V(node).text(text, { annotations });
    },

    close: function() {

        if (!this.ed) return;

        if (this.ed.options.annotateUrls) {
            // If there is a URL detected before we leave the text-editing,
            // annotate it. The only exception is if there was already a URL annotation
            // at the cursor. In this case, we don't create another one.
            var selectionStart = this.ed.getSelectionStart();
            var annotationsUnderCursor = this.findAnnotationsUnderCursor();
            var containsURLAnnotation = annotationsUnderCursor.find(function(annotation) {
                if (annotation.url) return annotation;
                return false;
            });
            if (!containsURLAnnotation) {
                var annotated = this.ed.annotateURLBeforeCaret(selectionStart);
                if (annotated) {
                    this.applyAnnotations(this.getAnnotations());
                }
            }
        }

        this.ed.remove();

        if (this.cellViewUnderEdit) {
            // Re-enable dragging after inline editing.
            this.cellViewUnderEdit.options.interactive = this.cellViewUnderEditInteractiveOption;
        }
        this.ed = this.cellViewUnderEdit = this.cellViewUnderEditInteractiveOption = undefined;
    },

    applyAnnotations: function(annotations) {

        var opt = this.options;
        var ed = this.ed;

        if (ed && opt.update) {

            if (opt.cellView && opt.annotationsProperty) {

                // Note that we have to deep clone the annotations so that
                // all the backbone `changed` mechanism works. This is because
                // the text editor modifies the `annotations` array in-place.
                opt.cellView.model.prop(opt.annotationsProperty, cloneDeep(annotations), { rewrite: true, textEditor: ed.cid });
                ed.setAnnotations(annotations);

            } else {

                V(ed.options.text).text(ed.getTextContent(), { annotations });
            }

            // Refresh the selection boxes or the caret position after
            // the annotations are applied.
            var range = this.getSelectionRange();
            var selectionLength = this.getSelectionLength();
            if (selectionLength > 0) {
                ed.select(range.start, range.end);
            } else {
                ed.setCaret();
            }
        }
    },

    proxy: function(method, args) {
        const { ed } = this;
        if (!ed) return;
        return ed[method].apply(ed, args);
    },

    isEmptyLine: function(text, index) {
        const prev = text[index - 1];
        const curr = text[index];
        // The empty line at the beginning of the text.
        if (index === 0 && curr === '\n') return true;
        // The empty line in the middle of the text.
        if (curr === '\n' && prev === '\n') return true;
        // The empty line at the end of the text.
        if (index === text.length && prev === '\n') return true;
        return false
    },

    // Return `true` if the character at the position `charNum` is
    // a newline character but does not denote an empty line.
    // In other words, the newline character under `charNum` is
    // ending a non-empty line.
    isLineEnding: function(text, index) {
        return text[index] === '\n' && index > 0 && text[index - 1] !== '\n';
    },

    isLineStart: function(text, index) {
        if (text[index] === '\n') return false;
        if (index === 0) return true;
        if (text[index - 1] === '\n') return true;
        return false;
    },

    getCombinedAnnotationAttrsAtIndex: getCombinedAnnotationAttrsAtIndex,
    getCombinedAnnotationAttrsBetweenIndexes: getCombinedAnnotationAttrsBetweenIndexes,
    normalizeAnnotations: normalizeAnnotations,

}, Backbone.Events));

// Proxy useful methods to the active `ui.TextEditor` instance.

TextEditor.findAnnotationsUnderCursor = function() {
    const { ed } = this;
    if (!ed) return null;
    return this.proxy('findAnnotationsUnderCursor', [ed.getAnnotations(), ed.getSelectionStart()]);
};

TextEditor.findAnnotationsInSelection = function() {
    const { ed } = this;
    if (!ed) return null;
    // Get the *normalized* selection range.
    const { start, end } = ed.getSelectionRange();
    return this.proxy('findAnnotationsInSelection', [ed.getAnnotations(), start, end]);
};

TextEditor.getSelectionAttrs = function(annotations) {
    const { ed } = this;
    if (!ed) return null;
    return this.proxy('getSelectionAttrs', [ed.getSelectionRange(), annotations]);
};

// other proxy methods with the same signature as the prototype counterpart
[
    'setCurrentAnnotation',
    'getAnnotations',
    'setCaret',
    'deselect',
    'selectAll',
    'select',
    'getNumberOfChars',
    'getCharNumFromEvent',
    'getWordBoundary',
    'getSelectionLength',
    'getSelectionRange'
].forEach(method => {
    TextEditor[method] = function() {
        return this.proxy(method, arguments);
    }
});

function cloneDeep(annotations) {
    // JSON.parse/stringify is still the fastest
    // way of deep cloning objects. See http://jsperf.com/lodash-deepclone-vs-jquery-extend-deep/5.
    try {
        return JSON.parse(JSON.stringify(annotations));
    } catch (e) {
        return undefined;
    }
}
