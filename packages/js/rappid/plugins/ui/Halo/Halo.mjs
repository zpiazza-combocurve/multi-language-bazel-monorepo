import $ from 'jquery';
import { V, g, util, dia, mvc } from 'jointjs/src/core.mjs';

const HandlePosition = {
    N: 'n', NW: 'nw',
    W: 'w', SW: 'sw',
    S: 's', SE: 'se',
    E: 'e', NE: 'ne'
}

/**
 * @constructor
 */
var LinkHalo = function() {
    this.options = {
        handles: [
            {
                name: 'remove',
                position: 'nw',
                events: { pointerdown: 'removeElement' },
                icon: null
            },
            {
                name: 'direction',
                position: 'se',
                events: { pointerdown: 'directionSwap' },
                icon: null
            }
        ],
        bbox: function(cellView) {
            const { paper } = cellView;
            return paper.localToPaperPoint(cellView.getPointAtRatio(0.5));
        },
        typeCssName: 'type-link',
        tinyThreshold: -1,
        smallThreshold: -1,
        boxContent: false
    };
};

/**
 * @private
 * Swap direction of the link.
 */
LinkHalo.prototype.directionSwap = function() {
    var model = this.options.cellView.model;
    model.set({ source: model.get('target'), target: model.get('source') }, { halo: this.cid });
};

/**
 * @constructor
 */
var ElementHalo = function() {
    this.options = {
        handles: [
            {
                name: 'remove',
                position: 'nw',
                events: { pointerdown: 'removeElement' },
                icon: null
            },
            {
                name: 'resize',
                position: 'se',
                events: { pointerdown: 'startResizing', pointermove: 'doResize', pointerup: 'stopBatch' },
                icon: null
            },
            {
                name: 'clone',
                position: 'n',
                events: { pointerdown: 'startCloning', pointermove: 'doClone', pointerup: 'stopCloning' },
                icon: null
            },
            {
                name: 'link',
                position: 'e',
                events: { pointerdown: 'startLinking', pointermove: 'doLink', pointerup: 'stopLinking' },
                icon: null
            },
            {
                name: 'fork',
                position: 'ne',
                events: { pointerdown: 'startForking', pointermove: 'doFork', pointerup: 'stopForking' },
                icon: null
            },
            {
                name: 'unlink',
                position: 'w',
                events: { pointerdown: 'unlinkElement' },
                icon: null
            },
            {
                name: 'rotate',
                position: 'sw',
                events: { pointerdown: 'startRotating', pointermove: 'doRotate', pointerup: 'stopBatch' },
                icon: null
            }
        ],

        /**
         * @param {dia.CellView} cellView
         * @param {Halo} halo
         * @returns {g.rect}
         */
        bbox: function(cellView, halo) {
            return cellView.getBBox({ useModelGeometry: halo.options.useModelGeometry });
        },
        typeCssName: 'type-element',
        tinyThreshold: 40,
        smallThreshold: 80,

        // a function returning a html string, which will be used as the halo box content
        boxContent: function(elementView, boxElement) {
            var tmpl = util.template('x: <%= x %>, y: <%= y %>, width: <%= width %>, height: <%= height %>, angle: <%= angle %>');
            var element = elementView.model;
            var bbox = element.getBBox();

            return tmpl({
                x: Math.floor(bbox.x),
                y: Math.floor(bbox.y),
                width: Math.floor(bbox.width),
                height: Math.floor(bbox.height),
                angle: Math.floor(element.get('angle') || 0)
            });
        },

        magnet: function(elementView) {
            // elementView root element by default
            return elementView.el;
        },

        loopLinkPreferredSide: 'top',
        loopLinkWidth: 40,
        rotateAngleGrid: 15,
        rotateEmbeds: false,

        // Rest of options are deprecated (better use dia.Paper.options.linkModel)
        linkAttributes: {},
        smoothLinks: undefined
    };
};

ElementHalo.prototype.startLinking = function(evt, x, y) {

    this.startBatch();

    var options = this.options;
    var paper = options.paper;
    var graph = options.graph;

    var link = this.createLinkConnectedToSource(evt);

    // add link to graph but don't validate
    link.set({
        target: { x: x, y: y }
    }).addTo(graph, {
        validation: false,
        halo: this.cid,
        async: false
    });

    paper.undelegateEvents();
    var linkView = this._linkView = link.findView(paper);
    linkView.startArrowheadMove('target', { whenNotAllowed: 'remove' });
};

ElementHalo.prototype.startForking = function(evt, x, y) {

    var options = this.options;
    var paper = options.paper;
    var graph = options.graph;

    this.startBatch();

    const [clone, ...embeds] = this.cloneCell({ fork: true });
    const cells = [clone, ...util.sortBy(embeds, cell => cell.isLink())];

    graph.addCells(cells, { halo: this.cid, async: false });
    this.centerElementAtCursor(clone, x, y);

    var link = this.createLinkConnectedToSource(evt);
    var cloneView = clone.findView(paper);
    var targetMagnet = this.getElementMagnet(cloneView, 'target', evt);
    var linkTarget = this.getLinkEnd(cloneView, targetMagnet, evt);

    link.set('target', linkTarget).addTo(graph, {
        halo: this.cid,
        async: false
    });

    cloneView.pointerdown(evt, x, y);
    this.eventData(evt, { cloneView: cloneView });
};

ElementHalo.prototype.getElementMagnet = function(elementView, endAttribute, evt) {
    var fn = this.options.magnet;
    if (util.isFunction(fn)) {
        var magnet = fn.call(this, elementView, endAttribute, evt);
        if (magnet instanceof SVGElement) {
            return magnet;
        }
    }
    throw new Error('ui.Halo: magnet() has to return an SVGElement.');
},

ElementHalo.prototype.getLinkEnd = function(elementView, magnet, _evt) {
    var end = { id: elementView.model.id };
    if (magnet !== elementView.el) {
        var port = elementView.findAttribute('port', magnet);
        if (port) {
            end.port = port;
        } else {
            end.selector = elementView.getSelector(magnet);
        }
    }
    return end;
},

ElementHalo.prototype.createLinkConnectedToSource = function(evt) {

    var options = this.options;
    var paper = options.paper;
    var elementView = options.cellView;
    var sourceMagnet = this.getElementMagnet(elementView, 'source', evt);
    var linkSource = this.getLinkEnd(elementView, sourceMagnet, evt);
    var link = paper.getDefaultLink(elementView, sourceMagnet).set('source', linkSource);

    // Backwards compatibility
    link.attr(options.linkAttributes);
    if (util.isBoolean(options.smoothLinks)) {
        link.set('smooth', options.smoothLinks);
    }

    return link;
},

ElementHalo.prototype.startResizing = function(evt) {

    this.startBatch();

    // determine whether to flip x,y mouse coordinates while resizing or not
    this._flip = [1, 0, 0, 1, 1, 0, 0, 1][Math.floor(g.normalizeAngle(this.options.cellView.model.get('angle')) / 45)];
};

ElementHalo.prototype.startRotating = function(evt, x, y) {

    this.startBatch();

    var element = this.options.cellView.model;
    var center = element.getBBox().center();
    var elements = [element];

    if (this.options.rotateEmbeds) {
        element.getEmbeddedCells({ deep: true }).reduce(function(acc, cell) {
            if (cell.isElement()) acc.push(cell);
            return acc;
        }, elements);
    }

    this.eventData(evt, {
        center: center,
        elements: elements,
        rotationStartAngles: elements.map(function(el) {
            return el.angle();
        }),
        clientStartAngle: (new g.Point(x, y)).theta(center)
    });
};

ElementHalo.prototype.doResize = function(evt, x, y, dx, dy) {

    var size = this.options.cellView.model.get('size');

    var width = Math.max(size.width + ((this._flip ? dx : dy)), 1);
    var height = Math.max(size.height + ((this._flip ? dy : dx)), 1);

    this.options.cellView.model.resize(width, height, { absolute: true, halo: this.cid });
};

ElementHalo.prototype.doRotate = function(evt, x, y) {

    var data = this.eventData(evt);
    // Calculate an angle between the line starting at mouse coordinates, ending at the centre
    // of rotation and y-axis and deduct the angle from the start of rotation.
    var theta = data.clientStartAngle - (new g.Point(x, y)).theta(data.center);

    data.elements.forEach(function(element, index) {
        var rotationStartAngle = data.rotationStartAngles[index];
        var newAngle = g.snapToGrid(rotationStartAngle + theta, this.options.rotateAngleGrid);
        element.rotate(newAngle, true, data.center, { halo: this.cid });
    }, this);
};

ElementHalo.prototype.doClone = function(evt, x, y) {

    var data = this.eventData(evt);
    var cloneView = data.cloneView;
    if (cloneView) {
        cloneView.pointermove(evt, x, y);
    }
};

ElementHalo.prototype.startCloning = function(evt, x, y) {

    const { options } = this;
    const { paper } = options;
    const { model: graph } = paper;

    this.startBatch();

    const [clone, ...embeds] = this.cloneCell({ clone: true });
    const cells = [clone, ...util.sortBy(embeds, cell => cell.isLink())];

    graph.addCells(cells, { halo: this.cid, async: false });
    this.centerElementAtCursor(clone, x, y);

    const cloneView = clone.findView(paper);
    cloneView.pointerdown(evt, x, y);
    this.eventData(evt, { cloneView: cloneView });
};

ElementHalo.prototype.centerElementAtCursor = function(element, x, y) {

    var center = element.getBBox().center();
    var tx = x - center.x;
    var ty = y - center.y;

    element.translate(tx, ty, { deep: true, halo: this.cid });
};

ElementHalo.prototype.doFork = function(evt, x, y) {

    var data = this.eventData(evt);
    var cloneView = data.cloneView;
    if (cloneView) {
        cloneView.pointermove(evt, x, y);
    }
};

ElementHalo.prototype.doLink = function(evt, x, y) {

    if (this._linkView) {
        this._linkView.pointermove(evt, x, y);
    }
};

ElementHalo.prototype.stopLinking = function(evt, x, y) {

    var linkView = this._linkView;
    if (linkView) {

        linkView.pointerup(evt, x, y);

        var link = linkView.model;
        if (link.hasLoop()) {
            this.makeLoopLink(link);
        }

        this.stopBatch();
        this.triggerAction('link', 'add', link);
        this._linkView = null;
    }

    this.options.paper.delegateEvents();
};

ElementHalo.prototype.stopForking = function(evt, x, y) {

    var data = this.eventData(evt);
    var cloneView = data.cloneView;
    if (cloneView) {
        cloneView.pointerup(evt, x, y);
    }
    this.stopBatch();
};

ElementHalo.prototype.stopCloning = function(evt, x, y) {

    var data = this.eventData(evt);
    var cloneView = data.cloneView;
    if (cloneView) {
        cloneView.pointerup(evt, x, y);
    }
    this.stopBatch();
};

ElementHalo.prototype.unlinkElement = function(evt) {

    this.startBatch();
    this.options.graph.removeLinks(this.options.cellView.model);
    this.stopBatch();
};

ElementHalo.prototype.makeLoopLink = function(link) {
    var linkWidth = this.options.loopLinkWidth;
    var paperOpt = this.options.paper.options;
    var paperRect = g.rect({ x: 0, y: 0, width: paperOpt.width, height: paperOpt.height });
    var bbox = this.options.paper.paperToLocalRect(this.options.cellView.getBBox());
    var p1, p2;

    var sides = util.uniq([this.options.loopLinkPreferredSide, 'top', 'bottom', 'left', 'right']);
    var sideFound = sides.find(function(side) {

        var centre;
        var dx = 0;
        var dy = 0;

        switch (side) {

            case 'top':
                centre = g.point(bbox.x + bbox.width / 2, bbox.y - linkWidth);
                dx = linkWidth / 2;
                break;

            case 'bottom':
                centre = g.point(bbox.x + bbox.width / 2, bbox.y + bbox.height + linkWidth);
                dx = linkWidth / 2;
                break;

            case 'left':
                centre = g.point(bbox.x - linkWidth, bbox.y + bbox.height / 2);
                dy = linkWidth / 2;
                break;

            case 'right':
                centre = g.point(bbox.x + bbox.width + linkWidth, bbox.y + bbox.height / 2);
                dy = linkWidth / 2;
                break;
        }

        p1 = g.point(centre).offset(-dx, -dy);
        p2 = g.point(centre).offset(dx, dy);

        return paperRect.containsPoint(p1) && paperRect.containsPoint(p2);

    }, this);

    if (sideFound) link.set('vertices', [p1, p2], { halo: this.cid });

};

export const Halo = mvc.View.extend({

    PIE_INNER_RADIUS: 20,
    PIE_OUTER_RADIUS: 50,

    className: 'halo',

    events: {
        'mousedown .handle': 'onHandlePointerDown',
        'touchstart .handle': 'onHandlePointerDown',
        'mousedown .pie-toggle': 'onPieTogglePointerDown',
        'touchstart .pie-toggle': 'onPieTogglePointerDown'
    },
    documentEvents: {
        mousemove: 'pointermove',
        touchmove: 'pointermove',
        mouseup: 'pointerup',
        touchend: 'pointerup'
    },
    options: {
        clearAll: true,
        clearOnBlankPointerdown: true,
        // This option allows you to compute bbox from the model. The view bbox can sometimes return
        // an unwanted result e.g when an element uses SVG filters or clipPaths. Note that downside
        // of computing a bbox is that it takes no relative subelements into account (e.g ports).
        useModelGeometry: false,
        // A function returning a copy of given cell used in cloning and forking.
        // Useful e.g. when you wish to translate the clone after it's created.
        // Note that clone is not in the graph when the function is invoked.
        clone: function(cell, opt) {
            return cell.clone().unset('z');
        },
        // Type of the halo. Determines the look of the halo (esp. positioning of handles).
        type: 'surrounding',
        // Various options for a specific types.
        pieSliceAngle: 45,
        pieStartAngleOffset: 0,
        pieIconSize: 14,
        // Pie toggle buttons. Usually, there is only one but in general, there can be
        // many. Each button can have a position (e ... east, w ... west, s ... south, n ... north)
        // and name. This name is then used when triggering events when the pie toggle button
        // is clicked (pie:open:default / pie:close:default).
        pieToggles: [{ name: 'default', position: 'e' }]
    },

    /**
     * @protected
     */
    init: function() {

        var options = this.options;
        var cellView = options.cellView;
        var cell = cellView.model;
        var cellViewAbstract = cell.isLink() ? new LinkHalo() : new ElementHalo();

        util.assign(this, util.omit(cellViewAbstract, 'options'));

        var paper = cellView.paper;
        var graph = paper.model;

        util.defaults(options, cellViewAbstract.options, {
            paper: paper,
            graph: graph
        });

        util.bindAll(this, 'render', 'update');

        if (options.clearAll) {
            // Clear a previous halo if there was one for the paper.
            this.constructor.clear(paper);
        }

        // Update halo when the graph changed.
        this.listenTo(graph, 'reset', this.close);
        this.listenTo(cell, 'remove', this.close);
        this.listenTo(paper, 'halo:create', this.close);
        if (options.clearOnBlankPointerdown) {
            // Hide Halo when the user clicks anywhere in the paper
            this.listenTo(paper, 'blank:pointerdown', this.close);
        }

        this.listenTo(graph, 'all', this.update);
        this.listenTo(paper, 'scale translate', this.update);

        // Add all default handles first.
        this.handles = [];

        util.toArray(options.handles).forEach(this.addHandle, this);
    },

    /**
     * @public
     * @returns {Halo}
     */
    render: function() {

        var options = this.options;

        this.$el.empty();
        this.$handles = $('<div/>').addClass('handles').appendTo(this.el);
        this.$box = $('<label/>').addClass('box').appendTo(this.el);
        // A cache for pie toggle buttons in the form [toggleName] -> [$pieToggle].
        this.$pieToggles = {};

        // Add halo type for css styling purposes.
        this.$el.addClass(options.type);
        this.$el.addClass(this.cellTypeCssClass());

        // Add the `data-type` attribute with the `type` of the cell to the root element.
        // This makes it possible to style the halo (including hiding/showing actions) based
        // on the type of the cell.
        this.$el.attr('data-type', options.cellView.model.get('type'));

        // Render handles.
        this.$handles.append(util.toArray(this.handles).map(this.renderHandle, this));

        switch (options.type) {

            case 'toolbar':
            case 'surrounding':

                // If the cell can not connect itself with the clone of
                // itself due to the validate connection method, don't
                // display fork handle at all.
                if (this.hasHandle('fork')) {
                    this.toggleFork();
                }

                break;

            case 'pie':

                // Pie halo has a button to toggle visibility of the
                // menu, that is not a handle (can't be added or removed).
                util.toArray(this.options.pieToggles).forEach(function(opt) {
                    var $pieToggle = $('<div/>');
                    $pieToggle.addClass('pie-toggle ' + (opt.position || 'e'));
                    $pieToggle.attr('data-name', opt.name);
                    util.setAttributesBySelector($pieToggle, opt.attrs);
                    $pieToggle.appendTo(this.el);
                    this.$pieToggles[opt.name] = $pieToggle;
                }, this);

                break;

            default:
                throw new Error('ui.Halo: unknown type');
        }

        this.update();
        this.$el.addClass('animate').appendTo(options.paper.el);
        this.setPieIcons();

        return this;
    },

    // For pie halos we must set the "xlink:href" attribute of the <image> SVG element.
    // Because we cannot set it via CSS.
    setPieIcons: function() {

        if (this.options.type !== 'pie') return;

        this.$el.find('.handle').each(function(index, handleEl) {

            var $sliceIcon;
            var $handle = $(handleEl);
            var name = $handle.attr('data-action');
            var handle = this.getHandle(name);

            // Don't override the image icon.
            if (handle && handle.icon) return;

            var content = window.getComputedStyle(handleEl, ':before').getPropertyValue('content');

            if (content && content !== 'none') {

                $sliceIcon = $handle.find('.slice-text-icon');
                if ($sliceIcon.length > 0) {
                    V($sliceIcon[0]).text(content.replace(/['"]/g, ''));
                }
            }

            var bgImage = $handle.css('background-image');

            if (bgImage) {

                var match = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);

                if (match) {

                    var imageUrl = match[1];
                    $sliceIcon = $handle.find('.slice-img-icon');

                    if ($sliceIcon.length > 0) {
                        V($sliceIcon[0]).attr('xlink:href', imageUrl);
                    }
                }
            }

        }.bind(this));
    },

    /**
     * @protected
     */
    update: function() {

        if (!this.isRendered()) {
            return;
        }

        this.updateBoxContent();

        var bbox = this.getBBox();

        this.$el.toggleClass('tiny', bbox.width < this.options.tinyThreshold && bbox.height < this.options.tinyThreshold);
        this.$el.toggleClass('small', !this.$el.hasClass('tiny') && (bbox.width < this.options.smallThreshold && bbox.height < this.options.smallThreshold));

        this.$el.css({
            width: bbox.width,
            height: bbox.height,
            left: bbox.x,
            top: bbox.y
        });

        if (this.hasHandle('unlink')) {
            this.toggleUnlink();
        }
    },

    /**
     * @private
     * @returns {g.rect}
     */
    getBBox: function() {

        var cellView = this.options.cellView;
        var bbox = this.options.bbox;
        var rect = (util.isFunction(bbox)) ? bbox(cellView, this) : bbox;

        rect = util.defaults({}, rect, { x: 0, y: 0, width: 1, height: 1 });

        return g.rect(rect);
    },

    /**
     * @private
     * Add halo type for css styling purposes.
     * @returns {string}
     */
    cellTypeCssClass: function() {
        return this.options.typeCssName;
    },

    /**
     * Updates the box content.
     * @private
     */
    updateBoxContent: function() {

        var boxContent = this.options.boxContent;
        var cellView = this.options.cellView;

        if (util.isFunction(boxContent)) {

            var content = boxContent.call(this, cellView, this.$box[0]);

            // don't append empty content. (the content might had been created inside boxContent()
            if (content) {
                this.$box.html(content);
            }

        } else if (boxContent) {

            this.$box.html(boxContent);

        } else {

            this.$box.remove();
        }
    },

    /**
     * @public
     * @param {Object} handleTooltips
     */
    extendHandles: function(handleTooltips) {

        util.forIn(handleTooltips, function(item) {

            var handle = this.getHandle(item.name);
            if (handle) {
                util.assign(handle, item);
            }
        }.bind(this));
    },

    /**
     * Add multiple handles in one go. This is just a syntactic sugar
     * to looping over `handles` and calling `addHandle()`.
     * @public
     * @param {Array.<Object>}handles
     * @returns {Halo}
     */
    addHandles: function(handles) {

        util.toArray(handles).forEach(this.addHandle, this);
        return this;
    },

    /**
     * @public
     * @param {Object} opt
     * @returns {Halo}
     */
    addHandle: function(opt) {

        var handle = this.getHandle(opt.name);

        /// Add new handle only if this does not exist yet.
        if (!handle) {

            this.handles.push(opt);

            util.forIn(opt.events, function(method, event) {

                if (util.isString(method)) {

                    this.on('action:' + opt.name + ':' + event, this[method], this);

                } else {

                    // Otherwise, it must be a function.
                    this.on('action:' + opt.name + ':' + event, method);
                }

            }.bind(this));

            if (this.$handles) {
                // Render the new handle only if the entire halo has been rendered.
                // Otherwise `render()` takes care about it.
                this.renderHandle(opt).appendTo(this.$handles);
            }
        }

        return this;
    },

    /**
     * @private
     * @param {Object} opt
     * @returns {jQuery}
     */
    renderHandle: function(opt) {

        // basic handle element
        var handleIdx = this.getHandleIdx(opt.name);
        var $handle = $('<div/>')
            .addClass('handle')
            .addClass(opt.name)
            .attr('data-action', opt.name)
            .prop('draggable', false);

        switch (this.options.type) {

            case 'toolbar':
            case 'surrounding':

                // add direction to the handle, so the handle
                // can be positioned via css
                $handle.addClass(opt.position);

                if (opt.content) {
                    $handle.html(opt.content);
                }

                break;

            case 'pie':

                var outerRadius = this.PIE_OUTER_RADIUS;
                var innerRadius = this.PIE_INNER_RADIUS;
                var iconRadius = (outerRadius + innerRadius) / 2;
                var center = g.point(outerRadius, outerRadius);
                var sliceRadian = g.toRad(this.options.pieSliceAngle);
                var startRadian = handleIdx * sliceRadian + g.toRad(this.options.pieStartAngleOffset);
                var stopRadian = startRadian + sliceRadian;
                var slicePathData = V.createSlicePathData(innerRadius, outerRadius, startRadian, stopRadian);

                // Create SVG elements for the slice.
                var svgRoot = V('svg').addClass('slice-svg');
                // Note that css transformation on svg elements do not work in IE.
                var svgSlice = V('path').attr('d', slicePathData).translate(outerRadius, outerRadius).addClass('slice');

                // Position the icon in the center of the slice.
                var iconPosition = g.point.fromPolar(iconRadius, -startRadian - sliceRadian / 2, center);
                var iconSize = this.options.pieIconSize;
                var svgIcon = V('image').attr(iconPosition).addClass('slice-img-icon');
                iconPosition.y = iconPosition.y + iconSize - 2;
                var svgTextIcon = V('text', { 'font-size': iconSize }).attr(iconPosition).addClass('slice-text-icon');

                // Setting the size of an SVG image via css is possible only in chrome.
                svgIcon.attr({
                    width: iconSize,
                    height: iconSize
                });

                // Setting a `transform` css rule on an element with a value as
                // a percentage is not possible in firefox.
                svgIcon.translate(-iconSize / 2, -iconSize / 2);
                svgTextIcon.translate(-iconSize / 2, -iconSize / 2);

                svgRoot.append([svgSlice, svgIcon, svgTextIcon]);
                $handle.append(svgRoot.node);
                break;
        }

        if (opt.icon) {
            this.setHandleIcon($handle, opt.icon);
        }

        // `opt.attrs` allows for setting arbitrary attributes on the generated HTML.
        // This object is of the form: `<selector> : { <attributeName> : <attributeValue>, ... }`
        util.setAttributesBySelector($handle, opt.attrs);

        return $handle;
    },

    /**
     * @private
     */
    setHandleIcon: function($handle, icon) {

        switch (this.options.type) {

            case 'pie':
                var $icon = $handle.find('.slice-img-icon');
                V($icon[0]).attr('xlink:href', icon);
                break;

            case 'toolbar':
            case 'surrounding':
                $handle.css('background-image', 'url(' + icon + ')');
                break;
        }
    },

    /**
     * Remove all the handles from the Halo.
     * @public
     * @returns {Halo}
     */
    removeHandles: function() {

        // Note that we cannot use `_.each()` here because `removeHandle()`
        // changes the length of the `handles` array.
        while (this.handles.length) {
            this.removeHandle(this.handles[0].name);
        }

        return this;
    },

    /**
     * @public
     * @param {string} name
     * @returns {Halo}
     */
    removeHandle: function(name) {

        var handleIdx = this.getHandleIdx(name);
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
     * @param {string} name
     * @param {Object} opt
     * @returns {Halo}
     */
    changeHandle: function(name, opt) {

        var handle = this.getHandle(name);
        if (handle) {

            this.removeHandle(name);
            this.addHandle(util.merge({ name: name }, handle, opt));
        }

        return this;
    },

    /**
     * @public
     * @param {string} name
     * @returns {boolean}
     */
    hasHandle: function(name) {

        return this.getHandleIdx(name) !== -1;
    },

    /**
     * @public
     * @param {string} name
     * @returns {string}
     */
    getHandleIdx: function(name) {

        return util.toArray(this.handles).findIndex(function(item) {
            return item.name === name;
        });
    },

    /**
     * @public
     * @param {string} name
     * @returns {Object}
     */
    getHandle: function(name) {

        return util.toArray(this.handles).find(function(item) {
            return item.name === name;
        });
    },

    /**
     * Handle selection
     * ----------------
     * Adds 'selected' class on certain handle.
     * Replace the icon based on the selected state.
     * change the selected state of a handle.
     * selected / unselected
     * @public
     * @param {string} name
     * @param {boolean} selected
     * @returns {Halo}
     */
    toggleHandle: function(name, selected) {

        var handle = this.getHandle(name);

        if (handle) {

            var $handle = this.$('.handle.' + name);

            if (selected === undefined) {
                // If no selected state is requested
                // change the current state to the opposite one.
                selected = !$handle.hasClass('selected');
            }

            $handle.toggleClass('selected', selected);

            var icon = selected ? handle.iconSelected : handle.icon;

            if (icon) {
                this.setHandleIcon($handle, icon);
            }
        }

        return this;
    },

    /**
     * a helper to select handle
     * @public
     * @param {string} name
     */
    selectHandle: function(name) {

        return this.toggleHandle(name, true);
    },

    /**
     * a helper to unselect handle
     * @public
     * @param {string} name
     */
    deselectHandle: function(name) {

        return this.toggleHandle(name, false);
    },

    /**
     * a helper to deselect all selected handles
     * @public
     */
    deselectAllHandles: function() {

        util.toArray(this.handles).forEach(function(handle) {
            this.deselectHandle(handle.name);
        }, this);

        return this;
    },

    /**
     * @private
     */
    onHandlePointerDown: function(evt) {

        var action = this._action = evt.currentTarget.dataset.action;
        if (!action) return;

        evt.preventDefault();
        evt.stopPropagation();
        evt = util.normalizeEvent(evt);

        const { x, y } = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        this._localX = x;
        this._localY = y;
        this._evt = evt;

        if (evt.type === 'mousedown' && evt.button === 2) {
            this.triggerAction(action, 'contextmenu', evt, x, y);
        } else {
            this.triggerAction(action, 'pointerdown', evt, x, y);
            this.delegateDocumentEvents(null, evt.data);
        }
    },

    /**
     * @private
     */
    onPieTogglePointerDown: function(evt) {

        evt.stopPropagation();
        var $pieToggle = $(evt.target).closest('.pie-toggle');
        var toggleName = $pieToggle.attr('data-name');
        if (this.isOpen(toggleName)) {
            // The pie menu was opened with the same toggle button, toggle the state
            // for the same button which effectively closes the pie menu.
            this.toggleState(toggleName);
        } else if (this.isOpen()) {
            // If the pie menu was open by a different toggle button, close it first,
            // then open it for a different toggle button.
            this.toggleState();
            this.toggleState(toggleName);
        } else {
            // Otherwise, just open the pie menu for with that toggle button.
            this.toggleState(toggleName);
        }
    },

    /**
     * Trigger an action on the Halo object.
     * @private
     * @param {string} action
     * @param {string} eventName Abstracted JointJS event name (pointerdown, pointermove, pointerup
     * @param {object} evt DOM event
     */
    triggerAction: function(action, eventName, evt) {

        var args = Array.prototype.slice.call(arguments, 2);
        args.unshift('action:' + action + ':' + eventName);
        this.trigger.apply(this, args);
    },

    /**
     * @private
     */
    stopBatch: function() {
        const { graph } = this.options;
        if (!graph.hasActiveBatch('halo')) return;
        graph.stopBatch('halo', { halo: this.cid });
    },

    /**
     * @private
     */
    startBatch: function() {
        this.options.graph.startBatch('halo', { halo: this.cid });
    },

    /**
     * @private
     */
    pointermove: function(evt) {

        if (!this._action) return;

        evt.preventDefault();
        evt.stopPropagation();
        evt = util.normalizeEvent(evt);

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        var dx = clientCoords.x - this._localX;
        var dy = clientCoords.y - this._localY;
        this._localX = clientCoords.x;
        this._localY = clientCoords.y;
        this._evt = evt;

        this.triggerAction(this._action, 'pointermove', evt, clientCoords.x, clientCoords.y, dx, dy);
    },

    /**
     * @private
     */
    pointerup: function(evt) {

        var action = this._action;
        if (!action) return;

        this._action = null;
        this._evt = null;

        var clientCoords = this.options.paper.snapToGrid({ x: evt.clientX, y: evt.clientY });
        this.triggerAction(action, 'pointerup', evt, clientCoords.x, clientCoords.y);
        this.undelegateDocumentEvents();
    },

    /**
     * @private
     */
    onRemove: function() {

        if (this._action && this._evt) {
            // Finish the action if there an ongoing one exists.
            this.pointerup(this._evt);
        }

        this.stopBatch();
    },

    /**
     * @private
     */
    close: function() {

        // prevents multiple onRemove triggering
        if (!this.closed) {
            this.closed = true;
            this.remove();
            this.trigger('close');
        }

        return this;
    },

    onSetTheme: function() {

        this.setPieIcons();
    },

    /**
     * @private
     */
    removeElement: function() {

        this.options.cellView.model.remove();
    },

    /**
     * @private
     */
    toggleUnlink: function() {

        var canUnlink = this.options.graph.getConnectedLinks(this.options.cellView.model).length > 0;

        this.$handles.children('.unlink').toggleClass('hidden', !canUnlink);
    },

    /**
     * @private
     */
    toggleFork: function() {
        // if a connection after forking would not be valid, hide the fork icon
        const canFork = this.canFork();
        this.$handles.children('.fork').toggleClass('hidden', !canFork);
    },

    canFork: function() {

        const { cellView, paper } = this.options;
        const { validateConnection } = paper.options;
        if (typeof validateConnection !== 'function') {
            // no validation = can fork
            return true;
        }

        const [cloneModel] = this.cloneCell({ fork: true, validation: true });
        const cloneView = paper.createViewForModel(cloneModel);

        // if a connection after forking would not be valid, hide the fork icon
        const forkingAllowed = validateConnection.call(paper, cellView, null, cloneView, null, 'target');

        cloneView.remove();

        return forkingAllowed;
    },

    cloneCell: function(opt = {}) {
        const { cellView, clone } = this.options;
        const cloneModels = clone(cellView.model, opt);
        if (cloneModels instanceof dia.Cell) {
            return [cloneModels];
        }
        if (
            Array.isArray(cloneModels) &&
            cloneModels.length > 0 &&
            cloneModels.every(model => model instanceof dia.Cell)
        ) {
            return cloneModels;
        }
        throw new Error('ui.Halo: option "clone" has to return a cell.');
    },

    /**
     * Toggles open/closed state of the halo.
     * `toggleName` is the name of the pie toggle button as defined in `options.pieToggles`.
     * @public
     * @param {string} toggleName
     */
    toggleState: function(toggleName) {

        if (!this.isRendered()) {
            return;
        }

        var $el = this.$el;

        util.forIn(this.$pieToggles, function($pieToggle) {
            $pieToggle.removeClass('open');
        });

        if (this.isOpen()) {
            this.trigger('state:close', toggleName);
            $el.removeClass('open');

        } else {
            // Note that we trigger the `state:open` event BEFORE we add
            // the `'open'` class name to the halo. The reason
            // is to give the programmer a chance to add/remove/change handles
            // in the handler for the state:open event before the handles
            // are actually made visible in the DOM.
            this.trigger('state:open', toggleName);
            if (toggleName) {

                var pieToggle = util.toArray(this.options.pieToggles).find(function(toggle) {
                    return toggle.name === toggleName;
                });
                if (pieToggle) {
                    // Add the pie toggle position
                    // to the halo container so that we can position the handles
                    // based on the position of the toggle that opened it.
                    // Add also the pie toggle name so that handles can be styled
                    // differently based on the pie toggle that was used to open them.
                    $el.attr({
                        'data-pie-toggle-position': pieToggle.position,
                        'data-pie-toggle-name': pieToggle.name
                    });
                }
                this.$pieToggles[toggleName].addClass('open');
            }
            $el.addClass('open');
        }
    },

    /**
     * Return true if the Halo is open. This makes sense (similar to toggleState())
     * only for the 'pie' type of Halo.
     * If `toggleName` is passed, return true only if the halo was opened by that specific toggle button.
     * @public
     * @param {string} toggleName
     * @returns {boolean}
     */
    isOpen: function(toggleName) {

        if (!this.isRendered()) {
            return false;
        }

        return toggleName ? this.$pieToggles[toggleName].hasClass('open') : this.$el.hasClass('open');
    },

    /**
     * @public
     * @returns {boolean}
     */
    isRendered: function() {
        return this.$box !== undefined;
    }

}, {

    // removes a halo from a paper
    clear: function(paper) {

        paper.trigger('halo:create');
    },

    HandlePosition: HandlePosition

});
