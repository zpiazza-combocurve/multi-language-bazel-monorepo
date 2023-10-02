// Tree Graph Layout View.
// =======================

// An user interface for the tree layout manipulation.
import $ from 'jquery';
import { V, util, dia, mvc, connectors } from 'jointjs/src/core.mjs';

export const TreeLayoutView = mvc.View.extend({

    MINIMAL_PREVIEW_SIZE: 10,
    className: 'tree-layout',

    documentEvents: {
        'mousemove': 'onPointermove',
        'touchmove': 'onPointermove',
        'mouseup': 'onPointerup',
        'touchend': 'onPointerup'
    },

    options: {

        // SVG attributes for the child and parent preview SVG elements.
        previewAttrs: {
            parent: { rx: 2, ry: 2 }
        },

        // Compute the bounding boxes for elements either from the DOM or based
        // on the model size.
        useModelGeometry: false,

        // clone method used when an element preview is created.
        clone: function(cell) {
            return cell.clone();
        },

        // Specify what elements can be interacted with.
        // e.g function(element) { return !element.get('disabled'); }
        canInteract: function() {
            return true;
        },

        // Specify which elements can be connected to the element being dragged.
        // e.g function(element, candidate, treeLayoutView) { return candidate.get('canHaveChildren') }
        validateConnection: null,

        // Specify if an element can be positioned (disconnected/translated) at a given point.
        // e.g function(element, x, y, treeLayoutView) { return false; }
        validatePosition: null,

        paperConstructor: dia.Paper,

        paperOptions: null,

        // A custom function for reconnecting elements
        // function(elements, parentElement, siblingRank, direction, treeLayoutView) {}
        reconnectElements: null,

        // A custom function for translating elements
        // function(elements, x, y, treeLayoutView) {}
        translateElements: null,

        // A custom function for elements layout
        // function(treeLayoutView) {}
        layoutFunction: null
    },

    init: function() {

        this.toggleDefaultInteraction(false);
        this.startListening();
        this.render();
        this.onSetTheme(null, this.theme);
    },

    /**
     * @deprecated in favor of `enable()`
     */
    startListening: function() {
        this.enable();
    },

    _isEnabled: false,
    _onPointerdown: null,

    enable: function() {
        const { paper } = this.options;
        this.disable();
        const _onPointerdown = this.canInteract(this.onPointerdown);
        this._isEnabled = true;
        this.listenTo(paper, 'element:pointerdown', _onPointerdown);
        this._onPointerdown = _onPointerdown;
    },

    disable: function() {
        const { _onPointerdown, options } = this;
        const { paper } = options;
        this._isEnabled = false;
        if (!_onPointerdown) return;
        this.stopListening(paper, 'element:pointerdown', _onPointerdown);
        this._onPointerdown = null;
    },

    isDisabled: function() {
        return !this._isEnabled;
    },

    // @public
    // Enable/Disable the default paper interactions.
    toggleDefaultInteraction: function(interactive) {

        this.options.paper.setInteractivity(interactive);
    },

    render: function() {

        var paper = this.options.paper;

        this.$activeBox = $('<div>')
            .addClass('tree-layout-box active hidden')
            .appendTo(this.el);

        const paperOptions = this.options.paperOptions || {};
        const graph = paperOptions.model || new dia.Graph({}, { cellNamespace: paper.model.get('cells').cellNamespace });

        const paperConstructorOptions = util.assign(
            {
                cellViewNamespace: paper.options.cellViewNamespace
            },
            paperOptions,
            {
                interactive: false,
                width: '100%',
                height: '100%',
                model: graph
            }
        );

        this.draggingPaper = new (this.options.paperConstructor)(paperConstructorOptions);
        this.draggingPaper.undelegateEvents();

        this.$translateBox = $('<div>')
            .addClass('tree-layout-box translate hidden')
            .append(this.draggingPaper.render().el)
            .appendTo(this.el);

        this.$mask = $('<div>').addClass('tree-layout-mask');

        this.svgViewport = V(paper.cells);
        this.svgPreviewChild = V(this.renderChildPreview())
            .attr(this.options.previewAttrs.child || {})
            .addClass('tree-layout-preview child');
        this.svgPreviewConnection = V(this.renderConnectionPreview())
            .attr(this.options.previewAttrs.link || {})
            .addClass('tree-layout-preview link');
        this.svgPreviewParent = V(this.renderParentPreview())
            .attr(this.options.previewAttrs.parent || {})
            .addClass('tree-layout-preview parent');
        this.svgPreview = V('g').addClass('tree-layout-preview-group').append([
            this.svgPreviewConnection,
            this.svgPreviewParent,
            this.svgPreviewChild
        ]);

        this.$el.appendTo(paper.el);

        return this;
    },

    renderChildPreview: function() {
        return V('circle');
    },

    renderParentPreview: function() {
        return V('rect');
    },

    renderConnectionPreview: function() {
        return V('path');
    },

    onSetTheme: function(oldTheme, newTheme) {

        var $elsWithThemeClass = [
            this.svgPreview,
            this.$mask
        ];

        $elsWithThemeClass.forEach(function($elWithThemeClass) {

            if ($elWithThemeClass) {

                if (oldTheme) {
                    $elWithThemeClass.removeClass(this.themeClassNamePrefix + oldTheme);
                }

                $elWithThemeClass.addClass(this.themeClassNamePrefix + newTheme);
            }
        }, this);
    },

    onRemove: function() {

        this.svgPreview.remove();
        this.$mask.remove();
    },

    toggleDropping: function(state) {

        // allows setting various cursor on the paper
        this.$mask.toggleClass('dropping-not-allowed', !state);
        // allows coloring of the translate box based on the state
        this.$translateBox.toggleClass('no-drop', !state);
    },

    canDrop: function() {

        return this.isActive() && !this.$translateBox.hasClass('no-drop');
    },

    isActive: function() {

        return !this.$translateBox.hasClass('hidden');
    },

    updateBox: function($box, bbox) {

        $box.css({
            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y
        });
    },

    positionTranslateBox: function(position) {

        var transformedPosition = V.transformPoint(position, this.ctm);

        this.$translateBox.css({
            left: transformedPosition.x,
            top: transformedPosition.y
        });
    },

    prepareDraggingPaper: function(draggedElement) {

        var clone = this.options.clone(draggedElement).position(0, 0);

        // Zoom the dragging paper the same way as the main paper.
        this.draggingPaper.scale(this.ctm.a, this.ctm.d);
        this.draggingPaper.model.resetCells([clone]);
    },

    dragstart: function(elements, x, y) {

        const { $translateBox, $activeBox, options } = this;
        const { paper, useModelGeometry } = options;

        this.toggleDropping(false);

        this.ctm = paper.matrix();

        const [element] = elements;
        const elementView = element.findView(paper);
        if (elementView) {
            const bbox = elementView.getBBox({ useModelGeometry });
            // showing box around active element
            this.updateBox($translateBox, util.defaults({ x: x, y: y }, bbox));
            this.updateBox($activeBox, bbox);
            $activeBox.removeClass('external');
        } else {
            const bbox = V.transformRect(element.getBBox(), this.ctm);
            this.updateBox($translateBox, util.defaults({ x: x, y: y }, bbox));
            // The element is not part of the graph
            $activeBox.addClass('external');
        }

        this.positionTranslateBox({ x, y });
        this.show();
        this.prepareDraggingPaper(element);
    },

    drag: function(elements, x, y) {

        var layout = this.model;
        var coordinates = { x: x, y: y };
        var rootLayoutArea;
        var layoutArea;

        if (this.candidate) {
            this.candidate = null;
            this.hidePreview();
        }

        this.positionTranslateBox(coordinates);

        rootLayoutArea = layout.getMinimalRootAreaByPoint(coordinates);
        if (rootLayoutArea) {
            layoutArea = rootLayoutArea.findMinimalAreaByPoint(coordinates, {
                expandBy: Math.min(layout.get('siblingGap'), layout.get('gap')) / 2
            });
        }

        if (layoutArea) {

            var direction = this.findDirection(layoutArea, coordinates);
            var siblings = layoutArea.getLayoutSiblings(direction);
            var siblingRank = siblings.getSiblingRankByPoint(coordinates);

            const isConnectionValid = util.toArray(elements).every(function(item) {
                return this.isConnectionValid(item, siblings, siblingRank);
            }, this);
            if (isConnectionValid) {

                this.candidate = {
                    id: layoutArea.root.id,
                    direction: direction,
                    siblingRank: siblingRank
                };

                this.updatePreview(siblings, siblingRank);
                this.showPreview();

                this.toggleDropping(true);

            } else {
                this.toggleDropping(false);
            }

        } else {

            let isPositionValid = true;
            const validationFn = this.options.validatePosition;
            if (typeof validationFn === 'function') {
                isPositionValid = util.toArray(elements).every((element) => {
                    return validationFn.call(this, element, x, y, this);
                });
            }
            this.toggleDropping(isPositionValid);
        }
    },

    dragend: function(elements, x, y) {

        var candidate = this.candidate;
        var options = this.options;
        if (this.canDrop()) {
            if (candidate) {
                // Connect Elements
                var reconnectElementsFn = options.reconnectElements;
                if (typeof reconnectElementsFn === 'function') {
                    reconnectElementsFn.apply(this, [
                        elements,
                        options.paper.getModelById(candidate.id),
                        candidate.siblingRank,
                        candidate.direction,
                        this
                    ]);
                } else {
                    this.reconnectElements(elements, candidate);
                }
                this.candidate = null;
            } else {
                // Disconnect or Translate Elements
                var translateElementsFn = options.translateElements;
                if (typeof translateElementsFn === 'function') {
                    translateElementsFn.call(this, elements, x, y, this);
                } else {
                    this.translateElements(elements, x, y);
                }
            }
        }

        this.hide();
    },

    show: function() {
        const { $mask, $activeBox, $translateBox, options } = this;
        const $paper = options.paper.$el;
        if (!$paper.is($mask.parent())) {
            $mask.appendTo($paper);
        }
        $activeBox.toggleClass('hidden', $activeBox.hasClass('external'));
        $translateBox.removeClass('hidden');
    },

    hide: function() {
        this.$mask.remove().removeClass('dropping-not-allowed');
        this.$activeBox.addClass('hidden');
        this.$translateBox.addClass('hidden');
        this.hidePreview();
    },

    cancelDrag: function() {
        this.candidate = null;
        this.undelegateDocumentEvents()
        this.hide();
    },

    reconnectElement: function(element, candidate) {

        const { model, options } = this;
        const { graph } = model;

        if (!graph.getCell(element)) {
            graph.addCell(element);
            model.layoutTree(element);
        }

        var siblingRank = candidate.siblingRank + 0.5;
        var opt = {
            direction: candidate.direction,
            siblingRank: siblingRank,
            ui: true,
            treeLayoutView: this.cid
        };

        var canReconnect = model.reconnectElement(element, candidate.id, opt);
        if (!canReconnect) {

            var paper = options.paper;
            var link = paper.getDefaultLink(element.findView(paper));

            link.set({ source: { id: candidate.id }, target: { id: element.id }});
            link.addTo(paper.model, opt);

            model.changeSiblingRank(element, siblingRank, opt);
            model.changeDirection(element, candidate.direction, opt);

            var prevDirection = model.getAttribute(element, 'direction');

            model.updateDirections(element, [prevDirection, candidate.direction], opt);
        }
    },

    reconnectElements: function(elements, candidate) {

        elements.forEach(function(element) {
            this.reconnectElement(element, candidate);
        }, this);
        this.layout();
    },

    translateElement: function(element, x, y) {

        const { model: layout } = this;
        const { graph } = layout;

        var inboundLinks = graph.getConnectedLinks(element, { inbound: true });

        util.invoke(inboundLinks, 'remove');

        var elementSize = element.get('size');

        element.set('position', {
            x: x - elementSize.width / 2,
            y: y - elementSize.height / 2
        }, { ui: true, treeLayoutView: this.cid });

        if (!graph.getCell(element)) {
            // We are adding an element, which was not in the graph.
            // e.g. Dragging elements from the stencil
            graph.addCell(element, {
                ui: true,
                treeLayoutView: this.cid
            });
        }
    },

    translateElements: function(elements, x, y) {

        elements.forEach(function(element) {
            this.translateElement(element, x, y);
        }, this);
        this.layout();
    },

    layout: function() {
        if (util.isFunction(this.options.layoutFunction)) {
            this.options.layoutFunction.call(this, this);
        } else {
            this.model.layout({ ui: true, treeLayoutView: this.cid });
        }
    },

    updatePreview: function(siblings, siblingRank) {

        var parent = siblings.parentArea.root;
        var childWidth = Math.max(this.model.get('siblingGap') / 2, this.MINIMAL_PREVIEW_SIZE);
        var childSize = { width: childWidth, height: childWidth };
        var childPosition = siblings.getNeighborPointFromRank(siblingRank);
        var points = siblings.getConnectionPoints(childPosition, { ignoreSiblings: true });
        var parentPoint = siblings.getParentConnectionPoint();
        var childPoint = siblings.getChildConnectionPoint(childPosition, childSize);

        this.updateParentPreview(parent.position(), parent.size(), parent);
        this.updateChildPreview(childPosition, childSize);
        this.updateConnectionPreview(parentPoint, childPoint, points);
    },

    showPreview: function() {

        this.svgViewport.append(this.svgPreview);
    },

    hidePreview: function() {

        this.svgPreview.remove();
    },

    updateParentPreview: function(position, size) {

        this.svgPreviewParent.attr({
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height
        });
    },

    updateChildPreview: function(position, size) {

        this.svgPreviewChild.attr({
            cx: position.x,
            cy: position.y,
            r:  size.width / 2
        });
    },

    updateConnectionPreview: function(source, target, vertices) {

        this.svgPreviewConnection.attr({
            d: connectors.rounded(source, target, vertices, {})
        });
    },

    findDirection: function(layoutArea, point) {

        var directions;
        var type = layoutArea.root.get('layout') || layoutArea.getType();
        switch (type) {
            case 'BL-BR':
            case 'TL-TR':
            case 'L-R':
                directions = type.split('-');
                return (point.x > layoutArea.rootCX) ? directions[1] : directions[0];
            case 'BL-TL':
            case 'BR-TR':
            case 'B-T':
                directions = type.split('-');
                return (point.y > layoutArea.rootCY) ? directions[0] : directions[1];
            case 'L':
            case 'R':
            case 'T':
            case 'B':
            case 'TR':
            case 'TL':
            case 'BR':
            case 'BL':
                return type;
            default:
                return layoutArea.direction;
        }
    },

    // @private
    isConnectionValid: function(element, siblings, siblingRank) {

        var parent = siblings.parentArea.root;

        // Banning a loop connection
        if (element.id == parent.id) return false;

        // If the element is ancestor of parent, there would be a loop after connection.
        if (this.model.graph.isSuccessor(element, siblings.parentArea.root)) return false;

        // If we have same parent, same rank direction an we changing only the siblingRank
        // we allow only changes that actually changes the order of siblings.
        var elementArea = this.model.getLayoutArea(element);
        if (elementArea && elementArea.parentArea && elementArea.parentArea == siblings.parentArea && elementArea.direction == siblings.direction) {
            var rankChange = elementArea.siblingRank - siblingRank;
            if (rankChange === 0 || rankChange === 1) return false;
        }

        // Custom validation
        var validationFn = this.options.validateConnection;
        if (typeof validationFn === 'function') {
            return validationFn.call(this, element, parent, this, {
                siblingRank,
                direction: siblings.direction,
                level: siblings.parentArea.level + 1,
                siblings: siblings.layoutAreas.map(la => la.root)
            });
        }

        return true;
    },

    // Interaction
    canInteract: function(handler) {

        return function(cellView) {
            if (this.options.canInteract(cellView)) {
                handler.apply(this, arguments);
            }
        }.bind(this);
    },

    startDragging: function(elements) {

        var draggedElements = Array.isArray(elements) ? elements : [elements];
        if (!util.isEmpty(draggedElements)) {
            this.delegateDocumentEvents(null, {
                moveCounter: 0,
                draggedElements: draggedElements
            });
        }
    },

    onPointerdown: function(elementView) {

        this.startDragging(elementView.model);
    },

    onPointermove: function(evt) {

        const normalizedEvt = util.normalizeEvent(evt);
        var data = normalizedEvt.data;
        var paper = this.options.paper;
        var localPoint = paper.clientToLocalPoint({
            x: normalizedEvt.clientX,
            y: normalizedEvt.clientY
        });

        if (data.moveCounter === paper.options.clickThreshold) {

            this.dragstart(data.draggedElements, localPoint.x, localPoint.y);

        } else if (data.moveCounter > paper.options.clickThreshold) {

            this.drag(data.draggedElements, localPoint.x, localPoint.y);
        }

        data.moveCounter++;
    },

    onPointerup: function(evt) {

        const normalizedEvt = util.normalizeEvent(evt);
        var data = normalizedEvt.data;
        var paper = this.options.paper;

        if (data.moveCounter >= paper.options.clickThreshold) {
            var localPoint = paper.clientToLocalPoint({
                x: normalizedEvt.clientX,
                y: normalizedEvt.clientY,
            });

            this.dragend(data.draggedElements, localPoint.x, localPoint.y);
        }

        this.undelegateDocumentEvents();
    }

});
