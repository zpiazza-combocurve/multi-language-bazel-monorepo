import { CellRange, CellRangeParams, RowNode } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import _ from 'lodash';

import { assert } from '@/helpers/utilities';

// TODO Improve check
const isTopLevelNode = (node: RowNode) => node?.parent?.rowIndex === null;

// childrenAfterSort doesn't include the parent like allLeafChildren does so we are adding +1 to include the parent
const findNodePositionInParent = (node: RowNode) =>
	isTopLevelNode(node) ? 0 : (node.parent?.childrenAfterSort ?? []).findIndex((child) => child === node) + 1;

export const countTotalChildrenForParentsInRange = (grid: AgGridReact | null, start, end) => {
	if (!grid) return 0;
	const { api } = grid;

	return _.range(start, end).reduce((acc, index) => {
		const row = api.getDisplayedRowAtIndex(index);

		// only count parents
		if (row?.uiLevel === 0) {
			return acc + (row.allChildrenCount ?? 0) + 1;
		}

		return acc;
	}, 0);
};

export const findRealIndexInRowData = (grid: AgGridReact | null, node: RowNode) => {
	if (!grid) return -1;

	const totalRowsUntilNotIncludingCurrent = countTotalChildrenForParentsInRange(
		grid,
		0,
		node?.parent?.rowIndex ?? node?.rowIndex ?? 0
	);

	const positionInParent = findNodePositionInParent(node);

	return totalRowsUntilNotIncludingCurrent + positionInParent;
};

export interface SelectedRange {
	startIndex: number;
	endIndex: number;
	startRow: RowNode;
	endRow: RowNode;
	rowDataStartIndex: number;
	startColId: string;
	rowDataEndIndex: number;
	cellRange: CellRange;
	selectedCount: number;
}

/**
 * @param grid AgGridReact
 * @param insertInLastRow If true, will return the last row and column if no range is selected
 * @returns SelectedRange | null
 */
export const getSelectedRange = (grid: AgGridReact | null, insertInLastRow?: boolean): SelectedRange | null => {
	assert(grid, 'Expected to have AgGrid');
	const { api, columnApi } = grid;
	const ranges = api.getCellRanges();
	const columns = columnApi.getAllGridColumns();

	let cellRange = ranges?.[0];
	if (!columns || !columns.length || !ranges || !cellRange) {
		if (!insertInLastRow) {
			return null;
		}
		const lastRowIndex = api.getLastDisplayedRow();
		const lastRowColumn = columns[columns.length - 1];
		cellRange = {
			columns: [lastRowColumn],
			startColumn: lastRowColumn,
			startRow: { rowIndex: lastRowIndex, rowPinned: null },
			endRow: { rowIndex: lastRowIndex, rowPinned: null },
		};
	}
	const { startRow: startRowPosition, endRow: endRowPosition } = cellRange;
	assert(startRowPosition && endRowPosition, 'Expected startRow and endRow');

	const startRowIndex = startRowPosition.rowIndex;
	const endRowIndex = endRowPosition.rowIndex;

	if (startRowIndex === -1 || endRowIndex === -1) {
		return null; // weird edge case on an empty table
	}

	const startIndex = Math.min(startRowIndex, endRowIndex);
	const endIndex = Math.max(startRowIndex, endRowIndex);

	const startRow = api.getDisplayedRowAtIndex(startIndex);
	const endRow = api.getDisplayedRowAtIndex(endIndex);

	// Edge case for Embedded lookup table
	if (!startRow || !endRow) {
		return null;
	}

	assert(startRow);
	assert(endRow);

	const startColId = cellRange.startColumn.getColId();

	return {
		startColId,
		startIndex,
		endIndex,
		startRow,
		endRow,
		rowDataStartIndex: findRealIndexInRowData(grid, startRow),
		rowDataEndIndex: findRealIndexInRowData(grid, endRow),
		cellRange,
		selectedCount: endIndex - startIndex + 1,
	};
};

export const getRowsInRange = (grid: AgGridReact | null, startIndex: number, endIndex: number) => {
	if (!grid) return [];
	const { api } = grid;

	const start = Math.min(startIndex, endIndex);
	const end = Math.max(startIndex, endIndex);

	const nodes: RowNode[] = [];

	api.forEachNode((rowNode, index) => {
		if (start <= index && index <= end) {
			nodes.push(rowNode);
		}
	});

	return nodes;
};

export const getParentsOfDisplayedRowsInRange = (grid: AgGridReact | null, startIndex, endIndex): RowNode[] => {
	assert(grid);

	const { api } = grid;

	const start = Math.min(startIndex, endIndex);
	const end = Math.max(startIndex, endIndex);

	return _.uniqBy(
		_.range(start, end + 1)
			.map((rowIndex) => {
				const row = api.getDisplayedRowAtIndex(rowIndex);
				if (row?.uiLevel === 0) {
					return row;
				}
				return row?.parent;
			})
			.filter(Boolean),
		'id'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) as any; // TODO fix types
};

export const handleSelectRowGroups = (grid: AgGridReact | null) => {
	assert(grid);
	const { api, columnApi } = grid;

	const ranges = api.getCellRanges();

	if (!ranges?.length) return;

	const range = ranges[0];

	assert(range.startRow && range.endRow);

	const parents = getParentsOfDisplayedRowsInRange(grid, range.startRow.rowIndex, range.endRow.rowIndex);

	if (!parents.length) return;

	let childrenCount = 0;

	parents.forEach((parent) => {
		if (parent.expanded) childrenCount += (parent?.allChildrenCount ?? 0) + 1;
		else childrenCount += 1;
	});

	api.clearRangeSelection();

	const columns = columnApi.getAllGridColumns();

	const newRange: CellRangeParams = {
		columns,
		rowStartIndex: parents[0].rowIndex ?? 0,
		rowEndIndex: (parents[0].rowIndex ?? 0) + childrenCount - 1,
	};

	api.addCellRange(newRange);

	api.setFocusedCell(parents[0]?.rowIndex ?? 0, columns[0]);
};

export function forceFocusOnTheTable(grid: AgGridReact | null) {
	// example from https://www.ag-grid.com/react-data-grid/keyboard-navigation/#example-tabbing-into-grid

	assert(grid);

	const { api, columnApi } = grid;

	const focus = api.getFocusedCell();

	if (focus && focus.rowIndex !== -1) {
		api.setFocusedCell(focus.rowIndex, focus.column);
	} else {
		api.ensureIndexVisible(0);

		const firstCol = columnApi.getAllDisplayedColumns()[0];

		api.ensureColumnVisible(firstCol);
		api.setFocusedCell(0, firstCol);

		api.clearRangeSelection();
		api.addCellRange({
			columnStart: firstCol,
			columnEnd: firstCol,
			rowStartIndex: 0,
			rowEndIndex: 0,
		});
	}
}

/** Make sure the focused cell is in bounds */
export function keepFocusInRange(grid: AgGridReact | null) {
	// similar to `forceFocusOnTheTable` but won't focus on a cell if table doesn't have a focus cell
	// example from https://www.ag-grid.com/react-data-grid/keyboard-navigation/#example-tabbing-into-grid

	assert(grid);

	const { api } = grid;

	const focus = api.getFocusedCell();

	if (!focus) return;

	const model = api.getModel();
	const totalRows = model.getRowCount();

	const newRowIndex = _.clamp(focus.rowIndex, 0, totalRows - 1);

	api.setFocusedCell(newRowIndex, focus.column);

	if (newRowIndex === focus.rowIndex) return;

	api.clearRangeSelection();
	api.addCellRange({
		columnStart: focus.column,
		columnEnd: focus.column,
		rowStartIndex: newRowIndex,
		rowEndIndex: newRowIndex,
	});
}

export function getSelectedParents(grid: AgGridReact | null): RowNode[] | undefined {
	assert(grid);

	const { api } = grid;

	const ranges = api.getCellRanges();

	if (!ranges?.length) return;

	const range = ranges[0];

	assert(range.startRow && range.endRow);

	const startRow = Math.min(range.startRow.rowIndex, range.endRow.rowIndex);
	const endRow = Math.max(range.startRow.rowIndex, range.endRow.rowIndex);

	const parents = getParentsOfDisplayedRowsInRange(grid, startRow, endRow);

	if (parents.length === 0) return undefined;

	return parents;
}

export function selectRowsAndChildren(grid: AgGridReact | null, rows: RowNode[]) {
	assert(grid, 'Expected api');

	const { api, columnApi } = grid;

	if (rows.length === 0) return;

	let childrenCount = 0;

	rows.forEach((row) => {
		childrenCount += 1 + (row.expanded ? row?.allChildrenCount ?? 0 : 0);
	});

	const ranges = api.getCellRanges();

	const columns = ranges?.[0]?.columns ?? columnApi.getAllGridColumns();

	api.clearRangeSelection();

	const newRange: CellRangeParams = {
		columns,
		rowStartIndex: rows[0].rowIndex ?? 0,
		rowEndIndex: (rows[0].rowIndex ?? 0) + childrenCount - 1,
	};

	api.addCellRange(newRange);

	api.setFocusedCell(rows[0]?.rowIndex ?? 0, columns[0]);
}

export const handleToggleRows = (grid: AgGridReact | null) => {
	assert(grid);

	const { api } = grid;

	const ranges = api.getCellRanges();

	if (!ranges?.length) return;

	const range = ranges[0];

	assert(range.startRow && range.endRow);

	const parents = getParentsOfDisplayedRowsInRange(grid, range.startRow.rowIndex, range.endRow.rowIndex);

	if (!parents.length) return;

	// always expand/collapse based on the first parent status
	const expanded = parents[0].expanded;

	let childrenCount = 0;

	parents.forEach((parent) => {
		api.setRowNodeExpanded(parent, !expanded);
		if (parent.expanded) childrenCount += (parent?.allChildrenCount ?? 0) + 1;
		else childrenCount += 1;
	});

	api.redrawRows({ rowNodes: parents });

	api.clearRangeSelection();

	const newRange: CellRangeParams = {
		columns: range.columns,
		rowStartIndex: parents[0].rowIndex ?? 0,
		rowEndIndex: (parents[0].rowIndex ?? 0) + childrenCount - 1,
	};

	api.addCellRange(newRange);

	api.setFocusedCell(parents[0]?.rowIndex ?? 0, range.columns[0]);
};
