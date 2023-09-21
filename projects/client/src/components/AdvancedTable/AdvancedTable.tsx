import {
	CellRangeParams,
	ColDef,
	FillOperationParams,
	ICellEditorParams,
	MenuItemDef,
	ProcessCellForExportParams,
	RowClickedEvent,
} from 'ag-grid-community';
import { add, differenceInMonths, format } from 'date-fns';
import hotkeys from 'hotkeys-js';
import _, { isBoolean, isNil } from 'lodash';
import {
	ForwardedRef,
	ReactElement,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useQueryClient } from 'react-query';
import { v4 as uuidv4 } from 'uuid';

import AgGrid, {
	AgGridRef,
	DISABLED_CELL_CLASS_NAME,
	NUMBER_CELL_CLASS_NAME,
	handleToggleRows as _handleToggleRows,
	countTotalChildrenForParentsInRange,
	defaultGetContextMenuItems,
	findRealIndexInRowData,
	forceFocusOnTheTable,
	getRowsInRange,
	getSelectedParents,
	getSelectedRange,
	handleSelectRowGroups,
	keepFocusInRange,
	selectRowsAndChildren,
} from '@/components/AgGrid';
import { CTRL_OR_COMMAND_KEY } from '@/components/Hotkey';
import { tryCatchFalse, useHotkey, useUndo } from '@/components/hooks';
import {
	CAPEX_COLUMNS_WITH_DATES,
	CAPEX_DATE_FORMAT,
} from '@/cost-model/detail-components/capex/CapexAdvancedView/constants';
import { confirmationAlert, failureAlert } from '@/helpers/alerts';
import { useDebounce } from '@/helpers/debounce';
import { SetStateFunction, ValueOrFunction, assert, resolveValueOrFunction, stringToColor } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';
import { updateEmbeddedLookupTable } from '@/lookup-tables/embedded-lookup-tables/api';
import { EMBEDDED_LOOKUP_TABLES_BEGIN_QUERY_KEY } from '@/lookup-tables/embedded-lookup-tables/queries';
import { generateLookupByKey } from '@/lookup-tables/embedded-lookup-tables/shared';

import {
	AgGridTheme,
	CellRenderer,
	GenericCellEditor,
	WrappedValue,
	suppressKeyboardEventOnCtrlEnter,
	suppressKeyboardEventOnCtrlShift,
	suppressKeyboardEventOnDelete,
	suppressKeyboardEventOnEditingEnter,
	suppressKeyboardEventOnEditingTab,
	suppressKeyboardEventOnShiftEnter,
	unwrapValue,
	wrapValue,
} from './ag-grid-shared';
import {
	CONTEXT_MENU_ITEMS_NAMES,
	DASHED_CELL_CLASS_NAME,
	DATE_FORMAT,
	DEFAULT_COLUMN_TYPES,
	ECON_LIMIT,
	ERROR_KEY,
	FOOTER_ROW_CLASS_NAME,
	INVALID_ROW_CLASS_NAME,
	INVALID_VALUE,
	IS_NESTED_ROW_KEY,
	LOOKUP_BY_FIELDS_KEY,
	LT_CELL_STRING_VALUE,
	MODIFIED_CELL_CLASS_NAME,
	NESTED_ROW_CLASS_NAME,
	OTHERS_COL_GROUP_ID,
	PERIOD_DATA_KEY,
	ROW_ID_KEY,
	SCHEMA_DESCRIBE_KEY,
	TOOLTIP_MESSAGE_KEY,
	TREE_DATA_KEY,
} from './constants';
import { clipboardToRows, getSpecialCellStylesField, isRowInvalid, parseDateValue } from './shared';
import { AdvancedTableProps, AdvancedTableRef, AdvancedTableRow, EXPORTS } from './types';

/** Will debounce rapid cell changes and group them in a single update for optimization */
function useDebouncedCellChange<T extends AdvancedTableRow>(
	setRowData: SetStateFunction<T[]>,
	onRowClick: ((row: T) => void) | undefined
) {
	const lastBatchRef = useRef({});

	const queryClient = useQueryClient();

	const applyBatch = useDebounce(() => {
		setRowData((p) =>
			p.map((row) => {
				assert(row[ROW_ID_KEY], 'Expected row to have _id', () => ({ row }));

				if (lastBatchRef.current[row[ROW_ID_KEY]]) {
					const modified = { ...row, ...lastBatchRef.current[row[ROW_ID_KEY]] };

					onRowClick?.(modified);

					return modified;
				}

				return row;
			})
		);
		lastBatchRef.current = {};
	}, 50);

	const handleSingleCellChange = useCallback(
		(nodeId, columnId, oldValue, newValue, columnMeta) => {
			lastBatchRef.current[nodeId] ??= {};
			lastBatchRef.current[nodeId][columnId] ??= newValue;

			let wrappedApplyBatch = () => {
				applyBatch();
			};

			//HACK: add selected ELT id to the row data when it was chosen from the dropdown
			//TODO: try to do it in a better way
			//NOTE: ELT inline name changing is happening here
			if (newValue && columnId === 'eltName' && columnMeta?.template?.menuItems?.length > 0) {
				const foundELTId = columnMeta.template.menuItems.find(({ label }) => label === newValue)?.value;

				if (foundELTId) {
					lastBatchRef.current[nodeId].eltId = foundELTId;
				} else {
					const foundOldELTId = columnMeta.template.menuItems.find(({ label }) => label === oldValue)?.value;

					if (foundOldELTId) {
						//if we've entered here, it means user changed the name of the ELT

						wrappedApplyBatch = () => {
							updateEmbeddedLookupTable(foundOldELTId, { name: newValue })
								.then(() => {
									confirmationAlert('Embedded Lookup Table name updated');
									queryClient.invalidateQueries(EMBEDDED_LOOKUP_TABLES_BEGIN_QUERY_KEY);
								})
								.catch(() => {
									failureAlert('Unable to update Embedded Lookup Table Name');
								})
								.finally(() => {
									applyBatch();
								});
						};
					}
				}
			}

			wrappedApplyBatch();
		},
		[applyBatch, queryClient]
	);

	return handleSingleCellChange;
}

function fillOperation({ event, initialValues, currentIndex, column, direction }: FillOperationParams) {
	const { altKey } = event;
	const columnId = column.getColId();

	const singleCell = initialValues.length === 1;

	const initialValue = unwrapValue(initialValues[0]);
	const lastValue = unwrapValue(initialValues[initialValues.length - 1]);

	const adjustIfPeriod = (value: number) =>
		column.getColId() === 'period' ? Math.floor(value) : Number(value.toFixed(8));

	if (singleCell) {
		if (altKey) {
			if (Number.isFinite(Number(initialValue))) {
				return Number(initialValue) + currentIndex + 1;
			}

			const periodStartDate = parseDateValue(initialValue);

			if (periodStartDate !== INVALID_VALUE && periodStartDate !== ECON_LIMIT) {
				const multiplier = direction === 'up' ? -1 : 1;
				return format(add(periodStartDate, { months: (currentIndex + 1) * multiplier }), DATE_FORMAT);
			}
		}
		return initialValue;
	}
	if (!altKey) {
		if (initialValues.every((value) => Number.isFinite(Number(unwrapValue(value))))) {
			const media = (lastValue - initialValue) / (initialValues.length - 1);
			return adjustIfPeriod(Number(lastValue) + media * (currentIndex + 1));
		}

		const allValuesInRangeAreValidDates = initialValues.every((value) => {
			const periodStartDate = parseDateValue(unwrapValue(value));
			return periodStartDate !== INVALID_VALUE && periodStartDate !== ECON_LIMIT;
		});

		if (allValuesInRangeAreValidDates) {
			const initialPeriodStartDate = parseDateValue(initialValue) as Date;
			const lastPeriodStartDate = parseDateValue(lastValue) as Date;
			const monthsDiff = differenceInMonths(lastPeriodStartDate, initialPeriodStartDate);
			const media = adjustIfPeriod(monthsDiff / (initialValues.length - 1));
			if (CAPEX_COLUMNS_WITH_DATES.includes(columnId)) {
				const [capexDateFormat] = CAPEX_DATE_FORMAT;
				return format(add(lastPeriodStartDate, { months: media * (currentIndex + 1) }), capexDateFormat);
			}
			return format(add(lastPeriodStartDate, { months: media * (currentIndex + 1) }), DATE_FORMAT);
		}
	}
	return unwrapValue(initialValues[currentIndex % initialValues.length]);
}

const _AdvancedTable = <T extends AdvancedTableRow>(
	props: AdvancedTableProps<T>,
	ref: ForwardedRef<AdvancedTableRef<T>>
) => {
	const {
		editorActions,
		className = '',
		adjustRowData,
		onEditingChange,
		contextMenuItems = [],
		handleGetContextMenuItems,
		getColumnsDef,
		onDataChange,
		onUndoChange,
		onRowClick,
		onRowsSelected,
		nestedLineFieldsAllowedForLookupBy = [],
		allowNestedRows = false,
		isNestedRowOnPaste,
		hotkeysScope,
		groupIncludeTotalFooter,
		getGroupRowAgg,
	} = props;

	const [rowData_, setRowData_] = useState<T[]>([]);

	const showELTColumn = useMemo(() => !!rowData_.find(({ isELTRow }) => isELTRow), [rowData_]);
	const columnsDef = useMemo(() => getColumnsDef(showELTColumn), [getColumnsDef, showELTColumn]);

	const agGridRef = useRef<AgGridRef>(null);

	const onBeforeComparing = useCallback(
		(rows: T[]) => (rows ? rows.filter((row) => !row.isFromELTDataLines) : rows),
		[]
	);
	const undoActions = useUndo(rowData_, setRowData_, onBeforeComparing);
	const { prevState, nextState, canUndo, canRedo } = undoActions;

	useEffect(() => {
		onUndoChange?.({ canUndo, canRedo });
	}, [onUndoChange, canUndo, canRedo]);

	const setRowData = useCallback(
		(p: ValueOrFunction<T[], [T[]]>) =>
			setRowData_((state_) => {
				const state = resolveValueOrFunction(p, state_);
				const newRowData = adjustRowData(state);
				return newRowData;
			}),
		[adjustRowData]
	);

	useEffect(() => {
		onDataChange?.(rowData_);
	}, [rowData_, onDataChange]);

	const handleSingleCellChange = useDebouncedCellChange(setRowData, onRowClick);

	const handleInsertNestedRow = () => {
		if (agGridRef.current == null || !allowNestedRows) return;
		const { api } = agGridRef.current;
		const range = getSelectedRange(agGridRef.current);
		if (range == null) return;

		const { endRow, rowDataEndIndex } = range;

		const selectedParentNode = endRow?.parent?.data ? endRow.parent : endRow;
		const assumptionContextMenuItems = handleGetContextMenuItems?.(selectedParentNode) ?? contextMenuItems;
		// return if there is no insert nested row option in the context menu
		if (
			!assumptionContextMenuItems.find(
				(item) => (item as MenuItemDef)?.name === CONTEXT_MENU_ITEMS_NAMES.insertTimeSeriesItem
			)
		) {
			return;
		}

		if (endRow.data.isELTRow || endRow.data.isFromELTDataLines) return;

		api.setRowNodeExpanded(endRow, true);
		api.redrawRows({ rowNodes: [endRow] });

		const insertAt = rowDataEndIndex + 1;

		setRowData((currentRows) => {
			let parentRow: T | undefined;

			for (let i = rowDataEndIndex; i >= 0; --i) {
				if (!currentRows[i][IS_NESTED_ROW_KEY]) {
					parentRow = currentRows[i];
					break;
				}
			}

			if (!parentRow) {
				return currentRows;
			}

			return [
				...currentRows.slice(0, insertAt),
				{
					[ROW_ID_KEY]: uuidv4(),
					[IS_NESTED_ROW_KEY]: true,
					[LOOKUP_BY_FIELDS_KEY]: Object.keys(parentRow[LOOKUP_BY_FIELDS_KEY] ?? {})
						.filter((field) => nestedLineFieldsAllowedForLookupBy.includes(field))
						.reduce((acc, field) => {
							acc[field] = generateLookupByKey(field);
							return acc;
						}, {} as Record<string, string>),
				} as T,
				...currentRows.slice(insertAt),
			];
		});
	};

	const handleToggleRows = () => {
		assert(agGridRef.current, 'Expected ag grid ref');
		_handleToggleRows(agGridRef.current);
	};

	const handleDeleteSelectedRows = () => {
		const api = agGridRef.current?.api;
		const range = getSelectedRange(agGridRef.current);

		if (range) {
			const { rowDataStartIndex, rowDataEndIndex, cellRange } = range;
			const deletedIds = new Set<string>();
			const newRows: T[] = [];

			rowData_.forEach((row, i) => {
				if (rowDataStartIndex <= i && i <= rowDataEndIndex) {
					deletedIds.add(row[ROW_ID_KEY]);
				} else if (!row[TREE_DATA_KEY]?.find((ref) => deletedIds.has(ref))) {
					newRows.push(row);
				}
			});

			setRowData(newRows);

			if (api) {
				api.clearRangeSelection();
				const { rowIndex, column } = (() => {
					const focus = api.getFocusedCell();
					if (!focus) return { rowIndex: rowDataStartIndex - 1, column: cellRange.startColumn };
					const rowIndex = rowDataEndIndex + 1 >= rowData_.length ? rowDataStartIndex - 1 : focus.rowIndex;
					const column = focus.column;
					return { rowIndex, column };
				})();
				api.setFocusedCell(rowIndex, column);
				api.addCellRange({
					columnStart: column,
					columnEnd: column,
					rowStartIndex: rowIndex,
					rowEndIndex: rowIndex,
				});
			}
		}
	};

	const handleToggleOtherColumns = () => {
		const api = agGridRef.current?.api;
		const column = agGridRef.current?.columnApi;
		const otherColumns = columnsDef[1]?.children;

		if (!api || !column || !otherColumns) return;

		const columns = otherColumns.map((col) => (col as ColDef).field as string);
		const setVisibility = (visibility: boolean) => column.setColumnsVisible(columns, visibility);

		// will return null if none of its children are shown
		const colGroup = column.getColumnGroup(OTHERS_COL_GROUP_ID);
		setVisibility(!colGroup);
	};

	const handleCopyRows = () => {
		if (agGridRef.current == null) return;
		const { columnApi, api } = agGridRef.current;
		const range = getSelectedRange(agGridRef.current);
		assert(range, 'Expected to have a range');
		const { startIndex, endIndex, startRow, endRow } = range;

		const rowsToStart = countTotalChildrenForParentsInRange(
			agGridRef.current,
			0,
			startRow?.parent?.rowIndex ?? startIndex
		);

		const rowsToEnd = countTotalChildrenForParentsInRange(
			agGridRef.current,
			0,
			(endRow?.parent?.rowIndex ?? endIndex) + 1
		);

		const columns = columnApi.getAllDisplayedColumns();
		const data = rowData_.slice(rowsToStart, rowsToEnd);
		const textToCopy = data.map((row) => columns.map((column) => row[column.getColId()]).join('\t')).join('\n');
		navigator.clipboard.writeText(textToCopy);

		const rowNodesInRange = getRowsInRange(agGridRef.current, rowsToStart, rowsToEnd - 1);

		api.flashCells({
			rowNodes: rowNodesInRange,
			columns,
		});
	};

	const processCellCallback = (params: ProcessCellForExportParams) => unwrapValue(params?.value);

	const updateRowDataFromClipboard = (_data, startRowIndex, startColId, totalRows, totalColumns) => {
		const removeLookupFromData = _data.map((data) =>
			data.map((value) => (value === LT_CELL_STRING_VALUE ? undefined : value))
		);
		// suppress last empty row from excel;
		const data = (
			_data.length > 1 && _data[_data.length - 1][0] === '' && _data[0].length === 1
				? removeLookupFromData.slice(0, -1)
				: removeLookupFromData
		).map((row) => row.map((value) => (value === '' ? undefined : value)));

		assert(agGridRef.current, 'Expected to have a ref for AgGrid');
		const { columnApi, api } = agGridRef.current;
		const columns = columnApi.getAllDisplayedColumns();
		const startCol = columns.findIndex((column) => column.getColId() === startColId);
		let realStartIndex =
			startRowIndex === 0 || startRowIndex === rowData_.length
				? startRowIndex
				: // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				  findRealIndexInRowData(agGridRef.current, api.getDisplayedRowAtIndex(startRowIndex)!);

		setRowData((rowData) => {
			const newRowData: T[] = [];
			const eltRowsData: T[] = [];

			rowData.forEach((row) => {
				if (row.isELTRow || row.isFromELTDataLines) {
					eltRowsData.push(row);
				} else {
					newRowData.push(row);
				}
			});

			for (let i = 0; i < Math.max(totalRows, data.length); i++) {
				const clipboardRowIndex = i % data.length;

				const row = realStartIndex + i;

				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				newRowData[row] ??= { [ROW_ID_KEY]: uuidv4() } as any; //TODO: types
				for (let j = 0; j < Math.max(totalColumns, data[clipboardRowIndex].length); j++) {
					const clipboardColumnIndex = j % data[clipboardRowIndex].length;
					const columnIndex = startCol + j;
					if (columnIndex >= columns.length) break;
					const column = columns[columnIndex].getColId();
					newRowData[row][column] = data[clipboardRowIndex][clipboardColumnIndex];
				}
				newRowData[row][IS_NESTED_ROW_KEY] = isNestedRowOnPaste?.(newRowData[row] as T);

				const rowNode = api.getDisplayedRowAtIndex(startRowIndex + i);

				if (rowNode && !rowNode?.expanded && rowNode.allChildrenCount) {
					realStartIndex += rowNode.allChildrenCount;
				}
			}

			return [...newRowData, ...eltRowsData];
		});
	};

	const handleForceFocusOnTable = () => {
		assert(agGridRef.current, 'Expected ag grid ref');

		forceFocusOnTheTable(agGridRef.current);
	};

	const handleSelectRows = () => {
		const api = agGridRef.current?.api;
		const columnApi = agGridRef.current?.columnApi;

		assert(api && columnApi, 'Expected to have API and Column API');

		const selectedRanges = api.getCellRanges();

		assert(selectedRanges, 'Expected to have selected ranges');

		if (!selectedRanges.length) return;

		const range = selectedRanges[0];

		assert(range && range.startRow && range.endRow, 'Expected to have range with startRow and endRow');

		api.clearRangeSelection();

		const columns = columnApi.getAllDisplayedColumns();

		api.addCellRange({
			rowStartIndex: range.startRow.rowIndex,
			rowEndIndex: range.endRow.rowIndex,
			columns,
		});

		api.setFocusedCell(range.startRow.rowIndex, columns[0]);
	};

	const handleDeleteSelectedRowGroups = () => {
		const range = getSelectedRange(agGridRef.current);
		if (range == null) return;
		const { startIndex, endIndex, startRow, endRow } = range;

		const rowsToStart = countTotalChildrenForParentsInRange(
			agGridRef.current,
			0,
			startRow?.parent?.rowIndex ?? startIndex
		);
		const rowsToEnd = countTotalChildrenForParentsInRange(
			agGridRef.current,
			0,
			(endRow?.parent?.rowIndex ?? endIndex) + 1
		);

		setRowData((p) => [...p.slice(0, rowsToStart), ...p.slice(rowsToEnd)]);
	};

	const handleRowClick = (eventParams: RowClickedEvent) => {
		onRowClick?.(eventParams.data);
	};

	useEffect(() => {
		// HACK: using hotkeysScope check we are ensuring that we doing this on the correct component, e.g.
		// on the AdvancedModelView we have AdvancedTable 2 times when opening ELT inside
		if (agGridRef.current?.api && hotkeys.getScope() === hotkeysScope) keepFocusInRange(agGridRef.current);
	}, [rowData_, hotkeysScope]);

	useEffect(() => {
		// HACK: correct render of the chevron icon for the ELT column on the initial load
		if (agGridRef.current?.api && rowData_.find(({ isELTRow }) => isELTRow)) {
			agGridRef.current.api.refreshCells({ force: true, columns: ['eltName'] });
		}
	}, [rowData_]);

	useHotkey(`${CTRL_OR_COMMAND_KEY}+z`, hotkeysScope, tryCatchFalse(prevState));

	useHotkey(`${CTRL_OR_COMMAND_KEY}+y`, hotkeysScope, tryCatchFalse(nextState));

	useHotkey(`${CTRL_OR_COMMAND_KEY}+i`, hotkeysScope, tryCatchFalse(handleInsertNestedRow));

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+-,${CTRL_OR_COMMAND_KEY}+num_subtract`,
		hotkeysScope,
		tryCatchFalse(handleDeleteSelectedRows)
	);

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+shift+-,${CTRL_OR_COMMAND_KEY}+shift+num_subtract`,
		hotkeysScope,
		tryCatchFalse(handleDeleteSelectedRowGroups)
	);

	useHotkey(`${CTRL_OR_COMMAND_KEY}+9,${CTRL_OR_COMMAND_KEY}+num_9`, hotkeysScope, tryCatchFalse(handleToggleRows));

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+0,${CTRL_OR_COMMAND_KEY}+num_0`,
		hotkeysScope,
		tryCatchFalse(handleToggleOtherColumns)
	);

	useHotkey(`${CTRL_OR_COMMAND_KEY}+shift+c`, hotkeysScope, tryCatchFalse(handleCopyRows));

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+v`,
		hotkeysScope,
		tryCatchFalse(() => {
			if (window?.navigator?.clipboard) {
				window.navigator.clipboard.readText().then((text) => {
					const data = clipboardToRows(text);

					if (data) {
						const { api, columnApi } = agGridRef?.current ?? {};
						assert(api, 'Expected to have API');
						const cellRanges = api.getCellRanges()?.[0];

						if (cellRanges && rowData_.length > 0) {
							updateRowDataFromClipboard(
								data,
								Math.min(cellRanges?.startRow?.rowIndex ?? 0, cellRanges?.endRow?.rowIndex ?? 0),
								cellRanges?.columns[0]?.getColId(),
								(cellRanges.endRow?.rowIndex ?? 0) - (cellRanges.startRow?.rowIndex ?? 0) + 1,
								cellRanges.columns.length
							);
						} else {
							assert(columnApi, 'Expected to have Column API');
							const columns = columnApi.getAllDisplayedColumns();
							updateRowDataFromClipboard(
								data,
								rowData_.length,
								columns[0].getColId(),
								data.length,
								data[0]?.length
							);
						}
					}
				});
			}
		})
	);

	useHotkey('shift+f', hotkeysScope, tryCatchFalse(handleForceFocusOnTable));

	useHotkey('shift+space', hotkeysScope, tryCatchFalse(handleSelectRows));

	useHotkey(
		`${CTRL_OR_COMMAND_KEY}+shift+space`,
		hotkeysScope,
		tryCatchFalse(() => handleSelectRowGroups(agGridRef.current))
	);

	const handleCollapseAll = () => {
		const parents = getSelectedParents(agGridRef.current);
		agGridRef.current?.api?.collapseAll();
		if (parents) selectRowsAndChildren(agGridRef.current, parents);
	};

	const handleExpandAll = () => {
		const parents = getSelectedParents(agGridRef.current);
		agGridRef.current?.api?.expandAll();
		if (parents) selectRowsAndChildren(agGridRef.current, parents);
	};

	const handleResetColumns = () => {
		if (!agGridRef.current?.columnApi) return;
		agGridRef.current.columnApi.resetColumnState();
		agGridRef.current.columnApi.resetColumnGroupState();
		agGridRef.current.columnApi.autoSizeAllColumns(false);
	};

	const handleExport = (method: EXPORTS, sheetName: string) => {
		const { api } = agGridRef?.current ?? {};
		assert(api, 'Expected to have API, handleExport AdvancedTable');
		if (method === EXPORTS.CSV) return api.exportDataAsCsv();
		if (method === EXPORTS.Excel)
			return api.exportDataAsExcel({
				sheetName,
			});
	};

	const imperativeRefHandle = {
		collapseAll: handleCollapseAll,
		expandAll: handleExpandAll,
		resetColumns: handleResetColumns,
		exportData: handleExport,
		deleteSelectedRows: handleDeleteSelectedRows,
		// deleteSelectedRowGroups: handleDeleteSelectedRowGroups,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		undoActions: undoActions as any, // HACK: fix after TS upgrade
		rowData: rowData_,
		setRowData,

		handleDeleteSelectedRows,
		handleDeleteSelectedRowGroups,
		handleToggleRows,
		handleInsertNestedRow,
		handleToggleOtherColumns,
		handleCopyRows,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		agGrid: agGridRef.current!, // TODO: expose ag-grid api instead of ref
	};

	useImperativeHandle(ref, () => imperativeRefHandle);

	return (
		<AgGridTheme>
			<AgGrid
				ref={agGridRef}
				className={className}
				css={`
					&&& {
						.ag-cell {
							// needed for invalid cells otherwise the red color will also be padded and not include the whole cell
							padding: 0;
						}
						.ag-react-container {
							// needed for invalid empty cells to have some space to show the red background
							height: 100%;
							width: 100%;
						}
						--ag-background-color: var(--background);
						--ag-row-background-color: var(--background-opaque);
						--ag-odd-row-background-color: var(--background-opaque);
						--ag-header-background-color: var(--background);
						// show nested rows in different colors
						.${NESTED_ROW_CLASS_NAME} {
							--ag-row-background-color: var(--background);
							--ag-odd-row-background-color: var(--background);
						}
						// add a border color to the invalid rows
						.ag-row {
							// needed for invalid rows top border color
							border-top-style: solid;
						}
						.${INVALID_ROW_CLASS_NAME} {
							--ag-row-border-color: ${({ theme }) => theme.palette.error.main};
						}
						// show cells that should not be edited in a dashed pattern
						.${DASHED_CELL_CLASS_NAME} {
							// https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/repeating-linear-gradient()
							color: var(--text-color-secondary);
							background-color: gray;
							background: var(--dash-cell-background);
							// HACK with the border the dashed pattern looks odd
							&.ag-cell:not(.ag-cell-range-selected) {
								border: 0;
							}
						}
						.${MODIFIED_CELL_CLASS_NAME} {
							color: ${({ theme }) => theme.palette.secondary.main};
						}
						.${FOOTER_ROW_CLASS_NAME} {
							color: ${({ theme }) => theme.palette.secondary.main};
							font-weight: 600;
							background-color: var(--background);
						}
						.ag-fill-handle {
							right: 0;
						}
					}
				`}
				defaultExcelExportParams={{
					processCellCallback,
					sheetName: 'Expenses', // Hack for expenses
				}}
				defaultCsvExportParams={{ processCellCallback }}
				getRowId={useCallback((params) => params.data[ROW_ID_KEY], [])}
				enableRangeSelection
				suppressLastEmptyLineOnPaste
				enableFillHandle
				fillOperation={fillOperation}
				suppressMultiRangeSelection
				context={{
					// needed for range selection delete on "Delete" key
					onDataChange: (update) => {
						setRowData((p) =>
							p.map((v) =>
								v[ROW_ID_KEY] && update[v[ROW_ID_KEY]] ? { ...v, ...update[v[ROW_ID_KEY]] } : v
							)
						);
					},
				}}
				getRowStyle={(params) => {
					const styles = {};
					if ((params.data?.isFromELTDataLines || params.data?.isELTRow) && params.data?.eltId) {
						styles['borderLeft'] = `${stringToColor(params.data.eltId)} solid 3px`;
					}
					return styles;
				}}
				defaultColDef={useMemo(
					() => ({
						width: 150,
						cellRenderer: CellRenderer,
						cellEditor: GenericCellEditor,
						cellEditorParams: (params: ICellEditorParams) => ({
							description: (params.data as AdvancedTableRow)?.[SCHEMA_DESCRIBE_KEY]?.[
								params.column.getId()
							],
							actions: editorActions,
						}),
						cellRendererParams: (params) => ({
							error: (params.data as AdvancedTableRow)?.[ERROR_KEY]?.[params.column.getId()],
							description: (params.data as AdvancedTableRow)?.[SCHEMA_DESCRIBE_KEY]?.[
								params.column.getId()
							],
							tooltipMessage:
								(params.data as AdvancedTableRow)?.[TOOLTIP_MESSAGE_KEY]?.[params.column.getId()]?.[
									params.data.key
								] ?? params.colDef?.tooltipValueGetter?.(params),
							isCellEditable: isBoolean(params?.colDef?.editable)
								? params?.colDef?.editable
								: params?.colDef?.editable?.(params),
						}),
						editable: (params) => {
							// disables columns that are not eltName if the row is a lookup row
							if (params.data?.isELTRow && params.colDef?.field !== 'eltName') {
								return false;
							}
							// if is Embedded Lookup Table Line, disable editable
							return !params.data?.isFromELTDataLines;
						},
						resizable: true,
						// lockPosition: true,
						cellClassRules: {
							[NUMBER_CELL_CLASS_NAME]: (params) => {
								if (params.colDef?.type === DEFAULT_COLUMN_TYPES.numericColumn) return true;
								const fieldName = params.colDef.field;
								if (!fieldName) return false;
								if (params.data?.[SCHEMA_DESCRIBE_KEY]?.[fieldName]?.type === FieldType.number)
									return true;
								const val = params.value as WrappedValue;
								return val?.description?.meta?.template.fieldType === FieldType.number;
							},
							[DISABLED_CELL_CLASS_NAME]: (params) => {
								const columnIsReadOnly = isBoolean(params?.colDef?.editable)
									? !params?.colDef?.editable
									: // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
									  !params?.colDef?.editable?.(params as any);
								return columnIsReadOnly || params?.data?.isFromELTDataLines;
							},
							[MODIFIED_CELL_CLASS_NAME]: (params) => {
								// will add blue color to cells with values different than the default value specified in the display templates
								const column = params.colDef?.field as string;
								const defaultValue = (params.data as AdvancedTableRow)?.[SCHEMA_DESCRIBE_KEY]?.[column]
									?.meta?.default;
								if (defaultValue == null) return false;
								return unwrapValue(params.value) !== defaultValue;
							},
							[DASHED_CELL_CLASS_NAME]: (params) => {
								const data = params.data as AdvancedTableRow;
								const column = params.colDef?.field as string;
								const yupSchema = data?.[SCHEMA_DESCRIBE_KEY]?.[column];
								return !data?.isELTRow && !!yupSchema?.tests?.find(({ name }) => name === 'omitted');
							},
							[FOOTER_ROW_CLASS_NAME]: (params) => params.node.footer,
						},
						cellStyle: (params) => {
							const colId = params.colDef.field;

							return colId ? params.data?.[getSpecialCellStylesField(colId)] : undefined;
						},
						valueFormatter: (params) => unwrapValue(params.value),
						equals: _.isEqual,
						valueGetter: (params) =>
							params.data &&
							wrapValue((params.data as AdvancedTableRow)[params.column.getId()], {
								error: (params.data as AdvancedTableRow)[ERROR_KEY]?.[params.column.getId()],
								start: params.data?.[PERIOD_DATA_KEY]?.start,
								end: params.data?.[PERIOD_DATA_KEY]?.end,
								description: (params.data as AdvancedTableRow)[SCHEMA_DESCRIBE_KEY]?.[
									params.column.getId()
								],
							}),
						valueSetter: (params) => {
							assert(
								params.node && params.colDef?.field,
								'Expected node and colDef to exist when editing a cell'
							);

							const oldCellValue = unwrapValue(params.oldValue);
							let newCellValue = unwrapValue(params.newValue);

							if (newCellValue === '') {
								newCellValue = undefined;
							}

							const {
								api: advancedTableApi,
								data: updatingRow,
								node: { id: updatingRowId },
								colDef: { field: columnName },
							} = params;
							const columnMetaData = updatingRow?.[SCHEMA_DESCRIBE_KEY]?.[columnName]?.meta;
							const shouldUpdateRowsLinkedByColumn = columnMetaData?.linkedBy;

							const rowIdsToUpdate = [updatingRowId];

							// HACK: Needed for Stream Props Advanced View
							// Automatically update columns for all rows that are linked by another column
							// E.g.: For Stream Props, We use rate_type and rows_calculation_method at the parent level
							// for the Shrinkage, Loss/Flare and Yields categories.
							// So We can not let the user update those values for each row individually.
							if (shouldUpdateRowsLinkedByColumn) {
								const columnLinkedBy = columnMetaData.linkedBy;
								advancedTableApi.forEachNode(({ data: row }) => {
									if (row[ROW_ID_KEY] === updatingRowId) return undefined;

									// Do not update disabled cells
									const columnTests = row[SCHEMA_DESCRIBE_KEY]?.[columnName].tests;
									if (columnTests?.find(({ name }) => name === 'omitted')) {
										return undefined;
									}

									if (row[columnLinkedBy] === updatingRow[columnLinkedBy]) {
										rowIdsToUpdate.push(row[ROW_ID_KEY]);
									}
								});
							}

							rowIdsToUpdate.forEach((nodeId) =>
								handleSingleCellChange(nodeId, columnName, oldCellValue, newCellValue, columnMetaData)
							);

							return true;
						},
						suppressKeyboardEvent: (params) =>
							suppressKeyboardEventOnEditingTab(params) ||
							suppressKeyboardEventOnEditingEnter(params) ||
							suppressKeyboardEventOnDelete(params) ||
							suppressKeyboardEventOnCtrlEnter(params) ||
							suppressKeyboardEventOnCtrlShift(params) ||
							suppressKeyboardEventOnShiftEnter(params),
					}),
					[editorActions, handleSingleCellChange]
				)}
				onCellKeyDown={(params) => {
					const { api, columnApi } = params;

					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					const { shiftKey, ctrlKey, key } = params.event as any;

					const isMultiSelect =
						shiftKey && ctrlKey && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(key);

					if (isMultiSelect) {
						const columns = columnApi.getAllDisplayedColumns();
						const ranges = api.getCellRanges();

						const range = ranges?.[0];

						const focus = api.getFocusedCell();

						const model = api.getModel();

						if (!range) return;
						if (!focus) return;
						if (!columns) return;

						const newRange: CellRangeParams = {
							columnStart: range.columns[0].getColId(),
							columnEnd: range.columns[range.columns.length - 1].getColId(),
							rowStartIndex: range.startRow?.rowIndex ?? 0,
							rowEndIndex: range.endRow?.rowIndex ?? 0,
						};

						// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
						// @ts-expect-error
						switch (params?.event.key) {
							case 'ArrowLeft':
								newRange.columnStart = columns[0].getColId();
								newRange.columnEnd = focus.column.getColId();
								break;

							case 'ArrowRight':
								newRange.columnStart = focus.column.getColId();
								newRange.columnEnd = columns[columns.length - 1].getColId();
								break;

							case 'ArrowUp':
								// use rowStart for a different behavior
								newRange.rowEndIndex = 0;
								break;

							case 'ArrowDown':
								newRange.rowEndIndex = model.getRowCount();
								break;
						}

						api.clearRangeSelection();
						api.addCellRange(newRange);
					}
				}}
				tooltipShowDelay={100}
				rowClassRules={{
					[NESTED_ROW_CLASS_NAME]: (params) => !!params.node.uiLevel,
					[INVALID_ROW_CLASS_NAME]: (params) => isRowInvalid(params.data),
				}}
				columnDefs={columnsDef}
				rowData={rowData_}
				onRowClicked={handleRowClick}
				groupHeaderHeight={0} // TODO need to fix extra border
				onFirstDataRendered={(params) => params.columnApi.autoSizeAllColumns(false)}
				getContextMenuItems={(params) => {
					// No context menu for disabled (ommited) cells
					if (!params.value) {
						return [];
					}

					const assumptionContextMenuItems =
						params.node && handleGetContextMenuItems
							? handleGetContextMenuItems(params.node)
							: contextMenuItems;

					return [...defaultGetContextMenuItems(params), ...assumptionContextMenuItems];
				}}
				treeData
				sideBar={{
					toolPanels: [
						{
							id: 'columns',
							labelDefault: 'Columns',
							labelKey: 'columns',
							iconKey: 'columns',
							toolPanel: 'agColumnsToolPanel',
							toolPanelParams: {
								// suppressColumnMove: true,
								suppressRowGroups: true,
								suppressValues: true,
								suppressPivots: true,
								suppressPivotMode: true,
								// suppressColumnFilter: true,
								// suppressColumnSelectAll: true,
								// suppressColumnExpandAll: true,
							},
						},
					],
				}}
				getDataPath={_.iteratee(TREE_DATA_KEY)}
				groupDisplayType='custom'
				groupDefaultExpanded={-1}
				processCellForClipboard={(params) => {
					const valueFormatter = params.column.getColDef()?.valueFormatter;
					assert(typeof valueFormatter === 'function', 'valueFormatter should be a function');
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					return valueFormatter({ ...params, data: params.node?.data } as any); // TODO find out how to do this
				}}
				onCellEditingStarted={() => onEditingChange(true)}
				onCellEditingStopped={() => onEditingChange(false)}
				processDataFromClipboard={
					() => [] // We don't want ag grid to do anything on paste as we are handling it by ourselves
				}
				onRangeSelectionChanged={(params) => {
					if (!params.finished || params.started) {
						return;
					}

					const ranges = params.api.getCellRanges();
					if (
						!ranges ||
						!ranges[0] ||
						isNil(ranges[0].startRow?.rowIndex) ||
						isNil(ranges[0].endRow?.rowIndex)
					) {
						return;
					}

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					onRowsSelected?.(rowData_.slice(ranges[0].startRow!.rowIndex, ranges[0].endRow!.rowIndex + 1));
				}}
				groupIncludeTotalFooter={groupIncludeTotalFooter}
				getGroupRowAgg={getGroupRowAgg}
			/>
		</AgGridTheme>
	);
};

// https://stackoverflow.com/a/58473012
export const AdvancedTable = forwardRef(_AdvancedTable) as <T extends AdvancedTableRow>(
	props: AdvancedTableProps<T> & { ref: ForwardedRef<AdvancedTableRef<T>> }
) => ReactElement;

export default AdvancedTable;
