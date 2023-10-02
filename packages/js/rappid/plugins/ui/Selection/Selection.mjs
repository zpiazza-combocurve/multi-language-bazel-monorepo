// Selection
// =============

// `Selection` implements selecting group of elements and moving the selected elements in one go.
// Typically, the selection will be bound to the `Shift` key
// and selecting/deselecting individual elements to the `Ctrl` key.

// Example usage:

// var graph = new dia.Graph;
// var paper = new dia.Paper({ model: graph });
// var selectionItems = new Backbone.Collection;
// var selection = new ui.Selection({ paper: paper, graph: graph, model: selectionItems });

// // Bulk selecting group of elements by creating a rectangular selection area.
// paper.on('blank:pointerdown', selection.startSelecting);

// // Selecting individual elements with click and the `Ctrl`/`Command` key.
// paper.on('cell:pointerup', function(cellView, evt) {
//      if ((evt.ctrlKey || evt.metaKey) && !(cellView.model instanceof dia.Link)) {
//              selectionItems.add(cellView.model);
//      }
// });

// // Deselecting previously selected elements with click and the `Ctrl`/`Command` key.
// selection.on('selection-box:pointerdown', function(evt) {
//      if (evt.ctrlKey || evt.metaKey) {
//              var cell = selectionItems.get($(evt.target).data('model'));
//              selectionItems.reset(selectionItems.without(cell));
//              selection.destroySelectionBox(paper.findViewByModel(cell));
//      }
// });

import $ from 'jquery';
import Backbone from 'backbone';
import { g, util, dia, mvc } from 'jointjs/src/core.mjs';
import { PaperScroller } from '../PaperScroller/PaperScroller.mjs';

const HandlePosition = {
    N: 'n', NW: 'nw',
    W: 'w', SW: 'sw',
    S: 's', SE: 'se',
    E: 'e', NE: 'ne'
}

const ConnectedLinksTranslation = {
    NONE: 'none',
    SUBGRAPH: 'subgraph',
    ALL: 'all'
}

export const Selection = mvc.View.extend({

    options: {
        paperScroller: undefined,
        paper: undefined,
        graph: undefined,
        boxContent: function(boxElement) {
            return util.template('<%= length %> elements selected.')({
                length: this.model.length
            });
        },
        handles: [{
            name: 'remove',
            position: 'nw',
            events: {
                pointerdown: 'removeElements'
            }
        }, {
            name: 'rotate',
            position: 'sw',
            events: {
                pointerdown: 'startRotating',
                pointermove: 'doRotate',
                pointerup: 'stopBatch'
            }
        }, {
            name: 'resize',
            position: 'se',
            events: {
                pointerdown: 'startResizing',
                pointermove: 'doResize',
                pointerup: 'stopBatch'
            }
        }],
        useModelGeometry: false,
        strictSelection: false,
        rotateAngleGrid: 15,
        allowTranslate: true,
        translateConnectedLinks: ConnectedLinksTranslation.ALL,
        allowCellInteraction: false
    },

    className: 'selection',

    events: {
        'mousedown .selection-box': 'onSelectionBoxPointerDown',
        'touchstart .selection-box': 'onSelectionBoxPointerDown',
        'mousedown .handle': 'onHandlePointerDown',
        'touchstart .handle': 'onHandlePointerDown'
    },

    documentEvents: {
        'mousemove': 'adjustSelection',
        'touchmove': 'adjustSelection',
        'mouseup': 'pointerup',
        'touchend': 'pointerup',
        'touchcancel': 'pointerup'
    },

    _action: null,

    /**
     * @private
     */
    init: function() {

        // For backwards compatibility:
        if (this.options.model) {
            this.options.collection = this.options.model;
        }

        var collection = this.collection = this.options.collection || this.collection || new Backbone.Collection;

        if (!collection.comparator) {
            // Make sure the elements are always sorted from the parents to their children.
            // That is necessary for translating selected elements.
            collection.comparator = this.constructor.depthComparator;
            collection.sort();
        }

        // For backwards compatibility:
        this.model = collection;

        const paper = this.options.paper;

        if (paper instanceof dia.Paper) {
            // Allow selection to be initialized with a paper only.
            util.defaults(this.options, { graph: paper.model });

        } else if ((typeof PaperScroller === 'function') && (paper instanceof PaperScroller)) {
            // Paper is a PaperScroller
            this.options.paperScroller = paper;
            this.options.paper = paper.options.paper;
            this.options.graph = paper.options.paper.model;

        } else {
            throw new Error('Selection: paper required');
        }

        util.bindAll(this, 'startSelecting', 'stopSelecting', 'adjustSelection', 'pointerup');

        this.options.paper.$el.append(this.$el);

        // A counter of existing boxes. We don't want to update selection boxes on
        // each graph change when no selection boxes exist.
        this._boxCount = 0;

        this.$selectionWrapper = this.createSelectionWrapper();

        // Add handles.
        this.handles = [];
        util.toArray(this.options.handles).forEach(this.addHandle, this);

        this.startListening();
    },

    startListening: function() {

        var paper = this.options.paper;
        this.listenTo(paper, 'scale translate', this.onPaperTransformation);

        if (this.options.allowCellInteraction) {
            this.listenTo(paper, 'cell:pointerdown', (cellView, evt) => {
                // do nothing when there are no elements in the selection
                if (this.collection.length === 0) {
                    return;
                }
                // allow snaplines and other interactions for the single element in the selection
                if (this.collection.length > 1) {
                    cellView.preventDefaultInteraction(evt);
                }
                evt = util.normalizeEvent(evt);

                this.startSelectionInteraction(evt, cellView);
            });
        }

        var graph = this.options.graph;
        this.listenTo(graph, 'reset', this.cancelSelection);
        this.listenTo(graph, 'change remove', this.onGraphChange);

        var collection = this.collection;
        this.listenTo(collection, 'remove', this.onRemoveElement);
        this.listenTo(collection, 'reset', this.onResetElements);
        this.listenTo(collection, 'add', this.onAddElement);
    },

    onPaperTransformation: function() {
        this.updateSelectionBoxes({ async: false });
    },

    onGraphChange: function(_, opt) {
        // Do not react on changes that happened inside the selection.
        if (opt.selection === this.cid) return;
        this.updateSelectionBoxes();
    },

    cancelSelection: function() {

        this.model.reset([], { ui: true });
    },

    /**
     * @public
     * @param {object} opt
     * @returns {Selection}
     */
    addHandle: function(opt) {

        this.handles.push(opt);

        var $handle = $('<div/>', {
            'class': 'handle ' + (opt.position || '') + ' ' + (opt.name || ''),
            'data-action': opt.name
        });
        if (opt.icon) {
            $handle.css('background-image', 'url(' + opt.icon + ')');
        }

        $handle.html(opt.content || '');

        // `opt.attrs` allows for setting arbitrary attributes on the generated HTML.
        // This object is of the form: `<selector> : { <attributeName> : <attributeValue>, ... }`
        util.setAttributesBySelector($handle, opt.attrs);

        this.$selectionWrapper.append($handle);

        util.forIn(opt.events, function(method, event) {

            if (util.isString(method)) {
                this.on('action:' + opt.name + ':' + event, this[method], this);
            } else {
                // Otherwise, it must be a function.
                this.on('action:' + opt.name + ':' + event, method);
            }

        }.bind(this));

        return this;
    },

    /**
     * @public
     * @param {jQuery.Event} evt
     */
    stopSelecting: function(evt) {

        var localPoint;
        var paper = this.options.paper;

        var data = this.eventData(evt);
        var action = data.action;

        switch (action) {

            case 'selecting': {

                var offset = this.$el.offset();
                var width = this.$el.width();
                var height = this.$el.height();

                // Convert offset coordinates to the local point of the <svg> root element viewport.
                localPoint = paper.pageToLocalPoint(offset.left, offset.top);

                // Convert width and height to take current viewport scale into account
                var paperScale = paper.scale();
                width /= paperScale.sx;
                height /= paperScale.sy;

                var selectedArea = g.rect(localPoint.x, localPoint.y, width, height);
                var elementViews = this.getElementsInSelectedArea(selectedArea);

                var filter = this.options.filter;
                if (Array.isArray(filter)) {

                    elementViews = elementViews.filter(function(view) {
                        return !filter.includes(view.model) && !filter.includes(view.model.get('type'));
                    });

                } else if (util.isFunction(filter)) {

                    elementViews = elementViews.filter(function(view) {
                        return !filter(view.model);
                    });
                }

                var models = elementViews.map(function(view) {
                    return view.model;
                });
                this.model.reset(models, { ui: true });

                break;
            }

            case 'translating': {

                this.options.graph.stopBatch('selection-translate');
                localPoint = paper.snapToGrid(evt.clientX, evt.clientY);
                this.notify('selection-box:pointerup', evt, localPoint.x, localPoint.y);
                // Everything else is done during the translation.
                break;
            }

            default: {
                if (!action) {
                    // Hide selection if the user clicked somewhere else in the document.
                    this.cancelSelection();
                }
                break;
            }
        }

        this._action = null;
    },

    /**
     * @public
     * @param {string} name
     * @returns {Selection}
     */
    removeHandle: function(name) {

        var handleIdx = util.toArray(this.handles).findIndex(function(item) {
            return item.name === name;
        });

        var handle = this.handles[handleIdx];
        if (handle) {

            util.forIn(handle.events, function(method, event) {
                this.off('action:' + name + ':' + event);
            }.bind(this));

            this.$('.handle.' + name).remove();

            this.handles.splice(handleIdx, 1);
        }

        return this;
    },

    /**
     * @public
     * @param {jQuery.Event} evt
     */
    startSelecting: function(evt) {

        evt = util.normalizeEvent(evt);

        this.cancelSelection();

        const { paperScroller, paper } = this.options;

        const origin = paper.localToPaperPoint(paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY }));

        this.$el.css({ width: 0, height: 0, left: origin.x, top: origin.y });
        this.showLasso();

        const scrollWhileDragging = (paperScroller && paperScroller.options.scrollWhileDragging);

        this.eventData(evt, {
            action: 'selecting',
            clientX: evt.clientX,
            clientY: evt.clientY,
            origin: origin,
            scrollWhileDragging

        });
        this.delegateDocumentEvents(null, evt.data);

        this._action = 'selecting';
    },

    /**
     * @param {string} name
     * @param {Object} opt
     * @returns {Selection}
     */
    changeHandle: function(name, opt) {

        var handle = util.toArray(this.handles).find(function(item) {
            return item && item.name === name;
        });

        if (handle) {

            this.removeHandle(name);
            this.addHandle(util.merge({ name: name }, handle, opt));
        }

        return this;
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    onSelectionBoxPointerDown: function(evt) {
        evt.stopPropagation();
        evt = util.normalizeEvent(evt);

        const cellView = this.getCellView(evt.target);

        this.startSelectionInteraction(evt, cellView);
    },

    startSelectionInteraction: function(evt, cellView) {
        const { paper, allowTranslate } = this.options;

        const activeElementView = cellView;

        // Start translating selected elements.
        if (allowTranslate && (!activeElementView || activeElementView.can('elementMove'))) {
            this.startTranslatingSelection(evt);
        }

        this.eventData(evt, { activeElementView });
        const localPoint = paper.snapToGrid(evt.clientX, evt.clientY);
        this.notify('selection-box:pointerdown', evt, localPoint.x, localPoint.y);
        this.delegateDocumentEvents(null, evt.data);
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    startTranslatingSelection: function(evt) {

        const { paperScroller, paper, graph } = this.options;

        graph.startBatch('selection-translate');

        const snappedClientCoords = paper.snapToGrid(evt.clientX, evt.clientY);
        const scrollWhileDragging = (paperScroller && paperScroller.options.scrollWhileDragging);
        this.eventData(evt, {
            action: 'translating',
            snappedClientX: snappedClientCoords.x,
            snappedClientY: snappedClientCoords.y,
            scrollWhileDragging
        });

        this._action = 'translating';
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    adjustSelection: function(evt) {

        evt = util.normalizeEvent(evt);

        let dx;
        let dy;

        const { paperScroller, paper, graph } = this.options;
        const localPoint = paper.clientToLocalPoint({ x: evt.clientX, y: evt.clientY });

        const data = this.eventData(evt);
        const { action, scrollWhileDragging } = data;

        switch (action) {

            case 'selecting': {
                const current = paper.localToPaperPoint(localPoint);

                dx = current.x - data.origin.x;
                dy = current.y - data.origin.y;

                const width = Math.abs(dx);
                const height = Math.abs(dy);

                const borderWidth = parseFloat(window.getComputedStyle(this.el).getPropertyValue('border-width'));

                this.$el.css({
                    left: dx < 0 ? current.x : data.origin.x,
                    top: dy < 0 ? current.y : data.origin.y,
                    width: width - borderWidth * 2,
                    height: height - borderWidth * 2
                });
                break;
            }

            case 'translating': {
                var snappedClientCoords = paper.snapToGrid(evt.clientX, evt.clientY);
                var snappedClientX = snappedClientCoords.x;
                var snappedClientY = snappedClientCoords.y;

                dx = snappedClientX - data.snappedClientX;
                dy = snappedClientY - data.snappedClientY;

                // restrict to area
                var restrictedArea = paper.getRestrictedArea();
                if (restrictedArea) {

                    var elements = this.model.toArray();
                    var selectionBBox = graph.getCellsBBox(elements);

                    // restrict movement to ensure that all elements within selection stay inside restricted area
                    var minDx = restrictedArea.x - selectionBBox.x;
                    var minDy = restrictedArea.y - selectionBBox.y;
                    var maxDx = (restrictedArea.x + restrictedArea.width) - (selectionBBox.x + selectionBBox.width);
                    var maxDy = (restrictedArea.y + restrictedArea.height) - (selectionBBox.y + selectionBBox.height);

                    if (dx < minDx) dx = minDx;
                    if (dy < minDy) dy = minDy;

                    if (dx > maxDx) dx = maxDx;
                    if (dy > maxDy) dy = maxDy;
                }

                if (dx || dy) {

                    this.translateSelectedElements(dx, dy);

                    if (!this.boxesUpdated) {

                        var paperScale = paper.scale();

                        // Translate each of the `selection-box` and `selection-wrapper`.
                        this.$el.children('.selection-box').add(this.$selectionWrapper)
                            .css({
                                left: '+=' + (dx * paperScale.sx),
                                top: '+=' + (dy * paperScale.sy)
                            });

                    // correctly update selection box when there is one element with allowCellInteraction
                    } else if (this.model.length > 1 || this.options.allowCellInteraction) {

                        // If there is more than one cell in the selection, we need to update
                        // the selection boxes again. e.g when the first element went over the
                        // edge of the paper, a translate event was triggered, which updated the selection
                        // boxes. After that all remaining elements were translated but the selection
                        // boxes stayed unchanged.
                        this.updateSelectionBoxes();
                    }

                    data.snappedClientX = snappedClientX;
                    data.snappedClientY = snappedClientY;
                }

                this.notify('selection-box:pointermove', evt, snappedClientX, snappedClientY);
                break;
            }

            default: {
                // for example, resizing
                if (action) {
                    this.pointermove(evt);
                }
                break;
            }
        }

        this.boxesUpdated = false;

        if (scrollWhileDragging) {
            paperScroller.scrollWhileDragging(evt, localPoint.x, localPoint.y, scrollWhileDragging);
        }
    },

    translateSelectedElements: function(dx, dy) {

        // This hash of flags makes sure we're not adjusting vertices of one link twice.
        // This could happen as one link can be an inbound link of one element in the selection
        // and outbound link of another at the same time.
        var processedCells = {};
        const { collection } = this;
        const { graph, translateConnectedLinks } = this.options;

        collection.each((cell) => {

            // TODO: snap to grid.
            if (processedCells[cell.id]) return;

            // Make sure that selection won't update itself when not necessary
            const opt = { selection: this.cid };

            // Translate the cell itself.
            cell.translate(dx, dy, opt);
            processedCells[cell.id] = true;

            cell.getEmbeddedCells({ deep: true }).forEach(function(embed) {
                processedCells[embed.id] = true;
            });

            if (translateConnectedLinks !== ConnectedLinksTranslation.NONE) {
                // Translate link vertices as well.
                const connectedLinks = graph.getConnectedLinks(cell);
                connectedLinks.forEach(function(link) {
                    if (processedCells[link.id]) return;
                    if (translateConnectedLinks === ConnectedLinksTranslation.SUBGRAPH) {
                        const sourceCell = link.getSourceCell();
                        if (sourceCell && !collection.get(sourceCell)) {
                            return;
                        }
                        const targetCell = link.getTargetCell();
                        if (targetCell && !collection.get(targetCell)) {
                            return;
                        }
                        if (!sourceCell || !targetCell) {
                            return;
                        }
                    }
                    link.translate(dx, dy, opt);
                    processedCells[link.id] = true;
                });
            }
        });
    },

    /**
     * @private
     * @param {string} eventName
     * @param {jQuery.Event} event
     */
    notify: function(eventName, evt) {

        var data = this.eventData(evt);
        var args = Array.prototype.slice.call(arguments, 1);

        this.trigger.apply(this, [eventName, data.activeElementView].concat(args));
    },

    /**
     * @private
     * @param {g.rect} selectedArea
     * @returns {Object.<string, dia.Element>}
     */
    getElementsInSelectedArea: function(selectedArea) {

        var paper = this.options.paper;

        var filterOpt = {
            strict: this.options.strictSelection
        };

        if (this.options.useModelGeometry) {
            var models = paper.model.findModelsInArea(selectedArea, filterOpt);
            return models.map(paper.findViewByModel, paper).filter(function(item) {
                return !!item;
            });
        }

        return paper.findViewsInArea(selectedArea, filterOpt);
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    pointerup: function(evt) {

        const data = this.eventData(evt);
        const { action, scrollWhileDragging } = data;
        if (!action) return;

        evt = util.normalizeEvent(evt);
        const { paper, paperScroller } = this.options;
        const { x, y } = paper.snapToGrid({ x: evt.clientX, y: evt.clientY });

        this.triggerAction(action, 'pointerup', evt, x, y);

        if (scrollWhileDragging) {
            paperScroller.stopScrollWhileDragging(evt);
        }
        this.stopSelecting(evt);
        this.undelegateDocumentEvents();

        this._action = null;
    },

    /**
     * @private
     * @param {dia.Element} element
     */
    destroySelectionBox: function(element) {

        this.$('[data-model="' + element.get('id') + '"]').remove();

        if (this.$el.children('.selection-box').length === 0) {
            this.hide();
        }

        this._boxCount = Math.max(0, this._boxCount - 1);
    },

    /**
     * @private
     */
    hide: function() {
        this.$el.removeClass('lasso selected');
    },

    /**
     * @private
     */
    showSelected: function() {
        this.$el.addClass('selected');
    },

    /**
     * @private
     */
    showLasso: function() {
        this.$el.addClass('lasso');
    },

    /**
     * @private
     */
    destroyAllSelectionBoxes: function() {

        this.hide();
        this.$el.children('.selection-box').remove();
        this._boxCount = 0;
    },

    /**
     * @private
     * @param {dia.Element} element
     */
    createSelectionBox: function(element) {

        const elementView = element.findView(this.options.paper);
        if (elementView) {
            const viewBBox = elementView.getBBox({ useModelGeometry: this.options.useModelGeometry });
            const $selectionBox = $('<div/>')
                .addClass('selection-box')
                .attr('data-model', element.get('id'))
                .css({ left: viewBBox.x, top: viewBBox.y, width: viewBBox.width, height: viewBBox.height })
                .appendTo(this.el);
            if (this.options.allowCellInteraction) {
                $selectionBox.addClass('selection-box-no-events');
            }
            this.showSelected();
            this._boxCount++;
        }
    },

    /**
     * @private
     * @returns {jQuery}
     */
    createSelectionWrapper: function() {

        var $selectionWrapper = $('<div/>', { 'class': 'selection-wrapper' });
        var $box = $('<div/>', { 'class': 'box' });
        $selectionWrapper.append($box);
        $selectionWrapper.attr('data-selection-length', this.model.length);
        this.$el.prepend($selectionWrapper);
        return $selectionWrapper;
    },

    /**
     * @private
     */
    updateSelectionWrapper: function() {

        // Find the position and dimension of the rectangle wrapping
        // all the element views.
        var origin = { x: Infinity, y: Infinity };
        var corner = { x: 0, y: 0 };

        this.model.each(function(cell) {

            var view = this.options.paper.findViewByModel(cell);
            if (view) {
                var bbox = view.getBBox({ useModelGeometry: this.options.useModelGeometry });
                origin.x = Math.min(origin.x, bbox.x);
                origin.y = Math.min(origin.y, bbox.y);
                corner.x = Math.max(corner.x, bbox.x + bbox.width);
                corner.y = Math.max(corner.y, bbox.y + bbox.height);
            }
        }.bind(this));

        this.$selectionWrapper.css({
            left: origin.x,
            top: origin.y,
            width: (corner.x - origin.x),
            height: (corner.y - origin.y)
        }).attr('data-selection-length', this.model.length);

        if (util.isFunction(this.options.boxContent)) {

            var $box = this.$('.box');
            var content = this.options.boxContent.call(this, $box[0]);

            // don't append empty content. (the content might had been created inside boxContent()
            if (content) {
                $box.html(content);
            }
        }
    },

    updateSelectionBoxes: function(opt) {
        if (this.collection.length === 0) return;
        // When an user drags selection boxes over the edge of the paper and the paper gets resized,
        // we update the selection boxes here (giving them exact position) and we do not want
        // the selection boxes to be shifted again based on the mousemove.
        // See adjustSelection() method.
        this.boxesUpdated = true;
        this.options.paper.requestViewUpdate(this, 1, this.UPDATE_PRIORITY, opt);
    },

    confirmUpdate: function() {
        this._updateSelectionBoxes();
    },

    /**
     * @private
     */
    _updateSelectionBoxes: function() {

        if (!this._boxCount) return;

        this.hide();

        var children = this.$el.children('.selection-box');
        for (var i = 0, n = children.length; i < n; i++) {
            var element = children[i];

            var removedId = $(element).remove().attr('data-model');

            // try to find an element with the same id in the selection collection and
            // find the view for this model.
            var removedModel = this.model.get(removedId);

            if (removedModel) {
                // The view doesn't need to exist on the paper anymore as we use this method
                // as a handler for element removal.
                this.createSelectionBox(removedModel);
            }
        }
        this.updateSelectionWrapper();
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    onHandlePointerDown: function(evt) {

        var action = evt.currentTarget.dataset.action;
        if (!action) return;

        const { paperScroller, paper } = this.options;

        evt.preventDefault();
        evt.stopPropagation();
        evt = util.normalizeEvent(evt);
        const { x, y } = paper.snapToGrid({ x: evt.clientX, y: evt.clientY });

        if (evt.type === 'mousedown' && evt.button === 2) {
            this.triggerAction(action, 'contextmenu', evt, x, y);

        } else {
            this.triggerAction(action, 'pointerdown', evt, x, y);
            const scrollWhileDragging = (paperScroller && paperScroller.options.scrollWhileDragging);
            this.eventData(evt, {
                action: action,
                clientX: evt.clientX,
                clientY: evt.clientY,
                startClientX: evt.clientX,
                startClientY: evt.clientY,
                scrollWhileDragging
            });
            this.delegateDocumentEvents(null, evt.data);
        }

        this._action = action;
    },

    /**
     * @private
     * @param {HTMLElement} element
     * @returns {dia.Element}
     */
    getCellView: function(element) {

        var cell = this.model.get(element.getAttribute('data-model'));
        return cell && cell.findView(this.options.paper);
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    pointermove: function(evt) {

        const data = this.eventData(evt);
        const { action } = data;
        if (!action) return;

        const { clientX, clientY } = evt;
        const { paper } = this.options;
        const { x, y } = paper.snapToGrid(clientX, clientY);
        const { x: prevX, y: prevY } = paper.snapToGrid(data.clientX, data.clientY);
        const dx = x - prevX;
        const dy = y - prevY;

        this.triggerAction(action, 'pointermove', evt, x, y, dx, dy);

        data.clientX = clientX;
        data.clientY = clientY;
    },

    /**
     * Trigger an action on the Selection object. `evt` is a DOM event
     * @private
     * @param {string} action
     * @param {string} eventName abstracted JointJS event name (pointerdown, pointermove, pointerup).
     * @param {jQuery.Event} evt
     */
    triggerAction: function(action, eventName, evt) {

        var args = Array.prototype.slice.call(arguments, 2);
        args.unshift('action:' + action + ':' + eventName);
        this.trigger.apply(this, args);
    },

    // Handle actions.

    /**
     * @private
     * @param {dia.Element} element
     */
    onRemoveElement: function(element) {

        this.destroySelectionBox(element);
        this.updateSelectionWrapper();
    },

    /**
     * @private
     * @param {Backbone.Collection.<dia.Cell>} elements
     */
    onResetElements: function(elements) {

        this.destroyAllSelectionBoxes();

        elements.each(this.createSelectionBox.bind(this));

        this.updateSelectionWrapper();
    },

    /**
     * @private
     * @param {dia.Element} element
     */
    onAddElement: function(element) {

        this.createSelectionBox(element);
        this.updateSelectionWrapper();
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    removeElements: function(evt) {

        // Store cells before `cancelSelection()` resets the selection collection.
        var cells = this.collection.toArray();
        this.cancelSelection();
        this.options.graph.removeCells(cells, { selection: this.cid });
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    startRotating: function(evt) {

        const { paper, graph } = this.options;

        graph.trigger('batch:start');

        const cells = this.collection.toArray();
        const center = graph.getCellsBBox(this.model.models).center();
        const clientCoords = paper.snapToGrid(evt.clientX, evt.clientY);
        const initialAngles = cells.reduce(function(res, cell) {
            res[cell.id] = cell.angle();
            return res;
        }, {});

        const initialPoints = cells.reduce(function(res, cell) {
            if (!cell.isLink()) return res;
            res[cell.id] = {
                source: cell.getSourceCell() ? null : cell.get('source'),
                target: cell.getTargetCell() ? null : cell.get('target'),
                vertices: cell.vertices()
            };
            return res;
        }, {});

        this.eventData(evt, {
            center,
            clientAngle: clientCoords.theta(center),
            initialAngles,
            initialPoints
        });
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    startResizing: function(evt) {

        const { options, collection } = this;
        const { paperScroller, paper, graph } = options;
        const { gridSize } = paper.options;
        const elements = collection.toArray();
        const { width, height } = graph.getCellsBBox(elements);
        const { x, y } = paper.snapToGrid(evt.clientX, evt.clientY);

        const elementsRecords = elements.map(el => {
            const angle = el.angle();
            const unrotatedBBox = el.getBBox();
            const bbox = unrotatedBBox.bbox(angle);
            // SCALING
            // scaling factor is a result of interpolating between sx and sy values
            // based on the given element angle vs Y axis. Element has the same scaling
            // factor regardless if it's rotated by 10, 170, 190 or 350 degrees, as all
            // of these are within 10 degrees from the Y axis.
            let factor;
            if (angle <= 90) {
                factor = angle / 90;
            } else if (angle <= 270) {
                factor = Math.abs(180 - angle) / 90;
            } else {
                factor = Math.abs(angle - 360) / 90;
            }
            return {
                angle,
                unrotatedBBox,
                bbox,
                factor,
                center: bbox.center()
            }
        });

        const minElWidth = elementsRecords.reduce((min, record) => {
            const bbox = record.unrotatedBBox;
            return bbox.width < min ? bbox.width : min
        }, Infinity);

        const minElHeight = elementsRecords.reduce((min, record) => {
            const bbox = record.unrotatedBBox;
            return bbox.height < min ? bbox.height : min
        }, Infinity);

        const cells = graph.getSubgraph(elements);
        const links = cells.filter(el => el.isLink());
        const linksRecords = links.map(link => {
            return {
                source: link.getSourceCell() ? null : link.get('source'),
                target: link.getTargetCell() ? null : link.get('target'),
                vertices: link.vertices()
            }
        });

        const cellsBBox = graph.getCellsBBox(cells);

        const scrollWhileDragging = (paperScroller && paperScroller.options.scrollWhileDragging);

        this.eventData(evt, {
            size: { width, height },
            rotatedBBox: graph.getCellsBBox(elements),
            minWidth: gridSize * width / minElWidth,
            minHeight: gridSize * height / minElHeight,
            x0: x,
            y0: y,
            pointerX: x,
            pointerY: y,
            elements,
            elementsRecords,
            links,
            linksRecords,
            cellsBBox,
            scrollWhileDragging
        });

        graph.trigger('batch:start');
    },

    /**
     * @param {jQuery.Event} evt
     * @param {number} dx
     * @param {number} dy
     */
    doResize: function(evt) {

        const data = this.eventData(evt);
        const {
            size,
            rotatedBBox,
            minWidth,
            minHeight,
            x0,
            y0,
            pointerX,
            pointerY,
            elements,
            elementsRecords,
            links,
            linksRecords,
            cellsBBox
        } = data;

        const { x, y } = this.options.paper.snapToGrid(evt.clientX, evt.clientY);
        if (x === pointerX && y === pointerY) {
            // delta x,y is lesser than the grid size
            return;
        }

        data.lastX = x;
        data.lastY = y;

        const { width: prevWidth, height: prevHeight } = size;
        let newWidth = Math.max(prevWidth + x - x0, minWidth);
        let newHeight = Math.max(prevHeight + y - y0, minHeight);

        if (this.options.preserveAspectRatio) {
            const candidateWidth = prevWidth * newHeight / prevHeight;
            const candidateHeight = prevHeight * newWidth /prevWidth;
            if (candidateWidth > newWidth) {
                newHeight = candidateHeight;
            } else {
                newWidth = candidateWidth;
            }
        }

        // scaling factor based on mouse movement uses selection bbox from data
        const sx = Math.max(newWidth / prevWidth, 0);
        const sy = Math.max(newHeight / prevHeight, 0);

        // transformations are done for elements only
        for (let i = 0, n = elements.length; i < n; i++) {

            const cell = elements[i];
            const { bbox: prevRotatedElBBox, unrotatedBBox: prevElBBox, factor, center, angle } = elementsRecords[i];

            // scaling is done around bbox central point and later transformed based
            // on the resulting new bbox size
            const trueScale = (new g.Point(sx, sy)).lerp(new g.Point(sy, sx), factor);
            const newElBBox = prevElBBox.clone().scale(trueScale.x, trueScale.y, center);
            const newRotatedElBBox = newElBBox.bbox(angle);

            // size deltas
            let dw = newRotatedElBBox.width - prevRotatedElBBox.width;
            let dh = newRotatedElBBox.height - prevRotatedElBBox.height;

            // fix floating-point error
            if (Math.abs(dw) < 1e-3) dw = 0;
            if (Math.abs(dh) < 1e-3) dh = 0;

            // origin deltas
            const dx = new g.Point(rotatedBBox.x, 0).distance(new g.Point(prevRotatedElBBox.x, 0));
            const dy = new g.Point(0, rotatedBBox.y).distance(new g.Point(0, prevRotatedElBBox.y));

            // because element was scaled around its center point, the transformation
            // is adjusted by half of the width and height deltas to compensate for scaling
            // in the first place. The transformation is then adjusted by additional factor
            // based on origin change delta and un-rotated scaling factor.
            let tx = (dw / 2) + (dx * sx) - dx;
            let ty = (dh / 2) + (dy * sy) - dy;

            // fix floating-point error
            if (Math.abs(tx) < 1e-3) tx = 0;
            if (Math.abs(ty) < 1e-3) ty = 0;

            newElBBox.translate(tx, ty);

            if (i === 0 && cell.getBBox().equals(newElBBox)) {
                // If a single element does not change, none of the elements would change
                // Exit without selection UI update.
                return;
            }

            cell.set({
                position: { x: newElBBox.x, y: newElBBox.y },
                size: { width: newElBBox.width, height: newElBBox.height }
            }, {
                selection: this.cid
            });
        }

        for (let j = 0, m = links.length; j < m; j++) {
            const link = links[j];
            const { source, target, vertices } = linksRecords[j];
            const attrs = {};
            if (vertices.length > 0) {
                attrs.vertices = vertices.map(vertex => {
                    const point = new g.Point(vertex);
                    point.scale(sx, sy, cellsBBox.origin());
                    return point.toJSON();
                });
            }
            if (source) {
                const point = new g.Point(source);
                point.scale(sx, sy, cellsBBox.origin());
                attrs.source = point.toJSON();
            }
            if (target) {
                const point = new g.Point(target);
                point.scale(sx, sy, cellsBBox.origin());
                attrs.target = point.toJSON();
            }

            link.set(attrs, { selection: this.cid });
        }

        this.updateSelectionBoxes();
    },

    /**
     * @private
     * @param {jQuery.Event} evt
     */
    doRotate: function(evt) {

        var data = this.eventData(evt);

        // Calculate an angle between the line starting at mouse coordinates, ending at the centre
        // of rotation and y-axis and deduct the angle from the start of rotation.
        var angleGrid = this.options.rotateAngleGrid;
        var clientCoords = this.options.paper.snapToGrid(evt.clientX, evt.clientY);
        var theta = data.clientAngle - g.point(clientCoords).theta(data.center);

        if (Math.abs(theta) > 1e-3) {

            this.collection.each((cell) => {
                const newAngle = g.snapToGrid(data.initialAngles[cell.id] + theta, angleGrid);
                if (cell.isLink()) {
                    const { source, target, vertices } = data.initialPoints[cell.id];
                    const fn = (point) => {
                        return g.Point(point).rotate(data.center, -newAngle);
                    };
                    const attrs = {};
                    if (source) {
                        attrs.source = fn(source);
                    }
                    if (target) {
                        attrs.target = fn(target);
                    }
                    if (vertices.length > 0) {
                        attrs.vertices = vertices.map(fn);
                    }
                    return cell.set(attrs, { selection: this.cid });
                } else {
                    cell.rotate(newAngle, true, data.center, { selection: this.cid });
                }
            });

            this.updateSelectionBoxes();
        }
    },

    /**
     * @private
     */
    stopBatch: function() {

        this.options.graph.trigger('batch:stop');
    },

    /**
     * @private
     * Return the current action of the Selection.
     * This can be one of:
     * 'translating' | 'selecting' or any custom action.
     * This is especially useful if you want to prevent from something happening
     * while the selection is taking place (e.g. in the 'selecting' state and you are
     * handling the mouseover event).
     * @returns {string}
     */
    getAction: function() {

        return this._action;
    }
}, {

    depthComparator: function(element) {
        // Where depth is a number of ancestors.
        return element.getAncestors().length;
    },

    HandlePosition: HandlePosition,

    ConnectedLinksTranslation: ConnectedLinksTranslation,
});

// An alias for backwards compatibility
export const SelectionView = Selection;
