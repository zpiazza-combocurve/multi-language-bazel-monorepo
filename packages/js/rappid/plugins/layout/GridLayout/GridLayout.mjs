import { g, util, dia } from 'jointjs/src/core.mjs';

function setPositionAndSize(element, attributes, opt) {
    const { size, position } = attributes;
    if (size) {
        const { width, height } = size;
        element.resize(width, height, opt);
    }
    if (position) {
        const { x, y } = position;
        element.position(x, y, opt)
    }
}

export const GridLayout = {

    layout: function(graphOrCells, opt) {

        var graph;

        if (graphOrCells instanceof dia.Graph) {
            graph = graphOrCells;
        } else {
            // `dry: true` for not overriding original graph reference
            // `sort: false` to prevent elements to change their order based on the z-index
            graph = (new dia.Graph()).resetCells(graphOrCells, { dry: true, sort: false });
        }

        // This is not needed anymore.
        graphOrCells = null;

        opt = opt || {};

        var elements = graph.getElements();

        // number of columns
        var columns = opt.columns || 1;
        var rows = Math.ceil(elements.length / columns);


        // `dx`, `dy` and `centre` are deprecated
        // shift the element horizontally by a given amount
        var dx = opt.dx || 0;
        // shift the element vertically by a given amount
        var dy = opt.dy || 0;
        var centre = opt.centre === undefined || opt.centre !== false;

        // position the elements in the centre of a grid cell
        var verticalAlign = centre ? 'middle' : opt.verticalAlign;
        var horizontalAlign = centre ? 'middle' : opt.horizontalAlign;

        // resize the elements to fit a grid cell & preserves ratio
        var resizeToFit = !!opt.resizeToFit;

        // coordinates of the most top-left element.
        var marginX = opt.marginX || 0;
        var marginY = opt.marginY || 0;

        var columnGap = opt.columnGap || 0;
        var rowGap = opt.rowGap || 0;

        var setAttributesFn = opt.setAttributes;
        if (typeof setAttributesFn !== 'function') setAttributesFn = setPositionAndSize;

        // width of a column
        var columnWidths = [];
        var columnWidth = opt.columnWidth;
        if (columnWidth === 'compact') {

            for (var cIndex = 0; cIndex < columns; cIndex++) {
                var elementsAtColumn = this._elementsAtColumn(elements, cIndex, columns);
                columnWidths.push(this._maxDim(elementsAtColumn, 'width') + dx);
            }
        } else {
            if (!columnWidth || util.isString(columnWidth)) {
                columnWidth = this._maxDim(elements, 'width') + dx;
            }
            for (var i = 0; i < columns; i++) {
                columnWidths.push(columnWidth);
            }
        }

        var columnsX = this._accumulate(columnWidths, marginX).map((x, index) => x + (index - .5) * columnGap);

        // height of a row
        var rowHeights = [];
        var rowHeight = opt.rowHeight;
        if (rowHeight === 'compact') {
            for (var rIndex = 0; rIndex < rows; rIndex++) {
                var elementsAtRow = this._elementsAtRow(elements, rIndex, columns);
                rowHeights.push(this._maxDim(elementsAtRow, 'height') + dy);
            }
        } else {
            if (!rowHeight || util.isString(rowHeight)) {
                rowHeight = this._maxDim(elements, 'height') + dy;
            }

            for (var j = 0; j < rows; j++) {
                rowHeights.push(rowHeight);
            }
        }

        var rowsY = this._accumulate(rowHeights, marginY).map((y, index) => y + (index - .5) * rowGap);

        // Wrap all graph changes into a batch.
        graph.startBatch('layout');

        // iterate the elements and position them accordingly
        elements.forEach(function(element, index) {

            var cIndex = index % columns;
            var rIndex = Math.floor(index / columns);
            var cWidth = columnWidths[cIndex];
            var rHeight = rowHeights[rIndex];

            var cx = 0;
            var cy = 0;
            var elementSize = element.get('size');

            var attributes = {};
            if (resizeToFit) {

                var elementWidth = cWidth - 2 * dx;
                var elementHeight = rHeight - 2 * dy;

                var calcElHeight = elementSize.height * (elementSize.width ? elementWidth / elementSize.width : 1);
                var calcElWidth = elementSize.width * (elementSize.height ? elementHeight / elementSize.height : 1);

                if (calcElHeight > rHeight) {
                    elementWidth = calcElWidth;
                } else {
                    elementHeight = calcElHeight;
                }

                elementSize = { width: elementWidth, height: elementHeight };
                attributes.size = elementSize;
            }

            switch (verticalAlign) {
                case 'top':
                    break;
                case 'bottom':
                    cy = rHeight - elementSize.height;
                    break;
                case 'middle':
                    cy = (rHeight - elementSize.height) / 2;
                    break;
            }

            switch (horizontalAlign) {
                case 'left':
                    break;
                case 'right':
                    cx = cWidth - elementSize.width;
                    break;
                case 'middle':
                    cx = (cWidth - elementSize.width) / 2;
                    break;
            }

            attributes.position = {
                x: columnsX[cIndex] + dx + cx + columnGap / 2,
                y: rowsY[rIndex] + dy + cy + rowGap / 2
            };
            setAttributesFn.call(graph, element, attributes, opt);
        });

        graph.stopBatch('layout');

        if (columns > 0) {
            columnsX[0] += columnGap / 2;
            columnsX[columns] -= columnGap / 2;
        }

        if (rows > 0) {
            rowsY[0] += rowGap / 2;
            rowsY[rows] -= rowGap / 2;
        } else if (rowsY.length === 0) {
            // no elements
            rowsY = [marginY, marginY];
        }

        const bbox = new g.Rect(
            marginX,
            marginY,
            columnsX[columns] - columnsX[0],
            rowsY[rows] - rowsY[0]
        );

        return {
            rowHeights,
            columnWidths,
            gridY: rowsY,
            gridX: columnsX,
            bbox
        }
    },

    // find maximal dimension (width/height) in an array of the elements
    _maxDim: function(elements, dimension) {
        return elements.reduce(function(max, el) {
            return Math.max(el.get('size')[dimension], max);
        }, 0);
    },

    _elementsAtRow: function(elements, rowIndex, numberOfColumns) {
        var elementsAtRow = [];
        var i = numberOfColumns * rowIndex;
        var n = Math.min(i + numberOfColumns, elements.length);
        for (; i < n; i++) {
            elementsAtRow.push(elements[i]);
        }
        return elementsAtRow;
    },

    _elementsAtColumn: function(elements, columnIndex, numberOfColumns) {
        var elementsAtColumn = [];
        var i = columnIndex;
        var n = elements.length;
        for (; i < n; i += numberOfColumns) {
            elementsAtColumn.push(elements[i]);
        }
        return elementsAtColumn;
    },

    _accumulate: function(array, baseVal) {
        if (array.length === 0) return [];
        return array.reduce(function(res, val, i) {
            res.push(res[i] + val);
            return res;
        }, [baseVal || 0]);
    }
};
