import Backbone from 'backbone';
import { util, dia } from 'jointjs/src/core.mjs';

// Implements Clipboard for copy-pasting elements.
// Note that the clipboard is also able to copy elements and their associated links from one graph
// and paste them to another.

// Usage:

//       var selection = new Backbone.Collection;
//       var graph = new dia.Graph;
//       // ... now something that adds elements to the selection ...
//       var clipboard = new joint.ui.Clipboard;
//       KeyboardJS.on('ctrl + c', function() { clipboard.copyElements(selection, graph); });
//       KeyboardJS.on('ctrl + v', function() { clipboard.pasteCells(graph); });
export const Clipboard = Backbone.Collection.extend({
    LOCAL_STORAGE_KEY: 'joint.ui.Clipboard.cells',
    defaults: {
        useLocalStorage: true,
        deep: false,
        origin: 'center',
        translate: {
            dx: 20,
            dy: 20
        }
    },

    constructor: function(options) {
        // No models can be passed to the constructor
        Backbone.Collection.prototype.constructor.call(this, [], options);
        this.defaults = util.assign({}, this.defaults, options);
        this.cid = util.guid();
    },

    /**
     * @public
     * This function returns the elements and links from the original graph that were copied. This is useful for implements
     * the Cut operation where the original cells should be removed from the graph. `selection` contains
     * elements that should be copied to the clipboard. Note that with these elements, also all the associated
     * links are copied. That's why we also need the `graph` parameter, to find these links.
     *
     * @param {Backbone.Collection | Array<dia.Cell>} selection
     * @param {dia.Graph} graph
     * @param {Object=} opt Used as a default for settings passed through the `pasteCells` method.
     * @returns {Array.<dia.Cell>}
     */
    copyElements: function(selection, graph, opt) {
        opt = util.assign({}, this.defaults, opt);

        const selectionArray = Array.isArray(selection) ? selection : selection.toArray();

        let originalCells;
        if (opt.deep) {
            originalCells = [];
            selectionArray.forEach(cell => {
                originalCells.push(cell, ...cell.getEmbeddedCells({ deep: true }));
            });
        } else {
            originalCells = selectionArray;
        }

        const cells = util.sortBy(Object.values(graph.cloneSubgraph(originalCells, opt)), cell => cell.attributes.z || 0);

        this.reset(cells);

        if (opt.useLocalStorage && window.localStorage) {
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(this.toJSON()));
        }

        return originalCells;
    },

    /**
     * @public
     * Same logic as per `copyElements`, but elements are removed from the graph
     * @param {Backbone.Collection | Array<dia.Cell>} selection
     * @param {dia.Graph} graph
     * @param {Object=} opt Used as a default for settings passed through the `pasteCells` method.
     * @returns {Array.<dia.Cell>} elements removed from graph
     */
    cutElements: function(selection, graph, opt) {
        opt = util.assign({}, this.defaults, opt);

        var elementsToRemove = this.copyElements(selection, graph, opt);

        const removeCellOptions = opt.removeCellOptions || {};
        removeCellOptions.clipboard = this.cid;

        graph.startBatch('cut');
        util.invoke(elementsToRemove, 'remove', removeCellOptions);
        graph.stopBatch('cut');
        return elementsToRemove;
    },

    /**
     * @public
     * @param {dia.Graph} graph Where paste to.
     * @param {Object.<{ translate: {dx: number, dy: number}, useLocalStorage: boolean, link: Object, addCellOptions: Object}>=} opt
     * If `translate` object with `dx` and `dy` properties is passed, the copied elements will be
     * translated by the specified amount. This is useful for e.g. the 'cut' operation where we'd like to have
     * the pasted elements moved by an offset to see they were pasted to the paper.
     *
     * If `useLocalStorage` is `true`, the copied elements will be saved to the localStorage (if present)
     * making it possible to copy-paste elements between browser tabs or sessions.
     *
     * `link` is attributes that will be set all links before they are added to the `graph`.
     * This is useful for e.g. setting `z: -1` for links in order to always put them to the bottom of the paper.
     *
     * `addCellOptions` options for the `graph.addCells` call.
     * @returns {Array.<dia.Cell>}
     */
    pasteCells: function(graph, opt) {
        opt = util.assign({}, this.defaults, opt);

        if (opt.useLocalStorage) {
            this.updateFromStorage(graph);
        }

        let currentZIndex = graph.maxZIndex();
        //process modification on current data
        const modifiedCells = this.map(cell => {
            currentZIndex += 1;
            return this.modifyCell(cell, opt, currentZIndex);
        });

        const addCellOptions = opt.addCellOptions || {};
        addCellOptions.clipboard = this.cid;

        const pastedCells = util.sortBy(modifiedCells, cell => cell.isLink() ? 2 : 1);
        graph.startBatch('paste');
        graph.addCells(pastedCells, addCellOptions);
        graph.stopBatch('paste');

        this.copyElements(this, graph, opt);

        return pastedCells;
    },

    /**
     * @public
     * @param {dia.Graph} graph Where paste to.
     * @param {Object.<{ x: number, y: number }>=} point
     * @param {Object.<{ origin: string, useLocalStorage: boolean, link: Object, addCellOptions: Object}>=} opt
     * `origin` option shows which point of the cells bbox will be used for pasting at the point.
     *
     * If `useLocalStorage` is `true`, the copied elements will be saved to the localStorage (if present)
     * making it possible to copy-paste elements between browser tabs or sessions.
     *
     * `link` is attributes that will be set all links before they are added to the `graph`.
     * This is useful for e.g. setting `z: -1` for links in order to always put them to the bottom of the paper.
     *
     * `addCellOptions` options for the `graph.addCells` call.
     * @returns {Array.<dia.Cell>}
     */
    pasteCellsAtPoint: function(graph, point, opt) {
        opt = util.assign({}, this.defaults, opt);

        if (opt.useLocalStorage) {
            this.updateFromStorage(graph);
        }

        //save original positions
        const clones = util.sortBy(Object.values(graph.cloneSubgraph(this.toArray(), opt)), cell => cell.attributes.z || 0);

        // Creating temporary graph to properly calculate bbox of links
        // Using clones to not mess up graph references
        const cellNamespace = graph.get('cells').cellNamespace;
        const tmpGraph = new dia.Graph([], { cellNamespace });
        tmpGraph.resetCells(clones, { sort: false });

        const originPoint = this.getOriginPoint(clones, tmpGraph, opt.origin);
        if (!originPoint)
            return [];

        const pointOffset = {
            dx: point.x - originPoint.x,
            dy: point.y - originPoint.y
        };

        // assign specific translate value
        opt.translate = pointOffset;

        let currentZIndex = graph.maxZIndex();
        //process modification on current data
        const modifiedCells = this.map(cell => {
            currentZIndex += 1;
            return this.modifyCell(cell, opt, currentZIndex);
        });

        const addCellOptions = opt.addCellOptions || {};
        addCellOptions.clipboard = this.cid;

        const pastedCells = util.sortBy(modifiedCells, cell => cell.isLink() ? 2 : 1);
        graph.startBatch('paste');
        graph.addCells(pastedCells, addCellOptions);
        graph.stopBatch('paste');

        // copy saved elements
        this.copyElements(clones, tmpGraph, opt);

        return pastedCells;
    },

    /**
     * @public
     * @param {Object} opt
     * @returns {boolean}
     * Checks local storage if `useLocalStorage` is true
     */
    isEmpty: function(opt) {
        opt = util.assign({}, this.defaults, opt);

        if (this.length > 0) return false;
        if (opt.useLocalStorage) {
            const cells = this.getJSONFromStorage();
            if (cells && cells.length) return false;
        }

        return true;
    },

    /**
     * @public
     * @param {Object} opt
     * Clears local storage if `useLocalStorage` is true
     */
    clear: function(opt) {
        opt = util.assign({}, this.defaults, opt);

        this.reset([]);

        if (opt.useLocalStorage && window.localStorage) {
            localStorage.removeItem(this.LOCAL_STORAGE_KEY);
        }
    },

    /**
     * @protected
     * @param {dia.Cell} cell
     * @param {Object} opt
     * @returns {dia.Cell}
     */
    modifyCell: function(cell, opt, z) {

        cell.set('z', z);
        if (cell.isLink() && opt.link) {
            cell.set(opt.link);
        }

        if (opt.translate) {
            const { dx, dy } = opt.translate;
            cell.translate(isFinite(dx) ? dx : 0, isFinite(dy) ? dy : 0);
        }

        // It's necessary to unset the collection reference here. Backbone.Collection adds collection
        // attribute to every new model, except if the model already has one. The pasted elements needs to have
        // collection attribute set to the Graph collection (not the Selection collection).
        cell.collection = null;

        return cell;
    },

    /**
     * @protected
     * @param {dia.Graph} graph
     */
    updateFromStorage: function(graph) {
        const cells = this.getJSONFromStorage();
        if (!cells) return;

        const graphJSON = { cells };
        // Note there is a `{ sort: false }` option passed to make sure
        // the temporary graph does not change the order of cells.
        // i.e. elements must stay before links
        const cellNamespace = graph.get('cells').cellNamespace;
        const tmpGraph = new dia.Graph([], { cellNamespace }).fromJSON(graphJSON, { sort: false, dry: true });
        this.reset(tmpGraph.getCells());
    },

    /**
     * @protected
     * @returns {Array<dia.Cell.JSON> | null}
     */
    getJSONFromStorage: function() {
        if (!window.localStorage) return null;
        return JSON.parse(localStorage.getItem(this.LOCAL_STORAGE_KEY)) || null;
    },

    /**
     * @protected
     * @param {Array<dia.Cell>} cells
     * @param {dia.Graph} graph
     * @param {string} origin
     * @returns {dia.Point | null}
     */
    getOriginPoint: function(cells, graph, origin) {
        const cellsBBox = graph.getCellsBBox(cells);
        if (cellsBBox) {
            return util.getRectPoint(cellsBBox, origin);
        } else {
            return null;
        }
    }
});
