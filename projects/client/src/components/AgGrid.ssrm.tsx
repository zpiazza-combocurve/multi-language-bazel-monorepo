import { IServerSideGetRowsRequest, RefreshStoreParams } from 'ag-grid-community';
import { difference, groupBy as groupByFromLodash, uniq } from 'lodash';
import {
	RefObject,
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';

import { Checkbox } from '@/components/v2';
import { assert } from '@/helpers/utilities';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';
import { DASHED_CELLS_CLASS_NAME } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/constants';
import { LOADING, useAsyncRows } from '@/tables/Table/useAsyncRows';

import AgGrid, { AgGridRef, CHECKBOX_COLUMN_DEF, getCountColumnDef } from './AgGrid';
import { useCallbackRef, useDerivedState, useSelection } from './hooks';
import { Selection } from './hooks/useSelection';

const COUNT_COL_ID = 'count';

type AgGridProps = Parameters<typeof AgGrid>[0];

const CHECKBOX_COL_ID = 'selection';

const AGGridCheckbox = (props) => {
	return (
		<Checkbox
			css={`
				overflow: hidden;
				margin-left: -9px; // HACK: magic;
			`}
			{...props}
		/>
	);
};

const ROW_ID_KEY = 'ROW_ID_KEY';

const SelectionContext = createContext<Selection | null>(null);

export const HeaderCheckboxSelection = () => {
	const selection = useContext(SelectionContext);
	assert(selection);
	const { deselectAll, selectAll, allSelected } = selection;

	const handleOnChange = (event) => {
		if (event.target.checked) {
			selectAll();
		} else {
			deselectAll();
		}
	};

	return (
		<div>
			<AGGridCheckbox onChange={handleOnChange} checked={allSelected ?? false} />
		</div>
	);
};

export function CheckboxCellRenderer(params) {
	const {
		context: { [ROW_ID_KEY]: rowIdKey },
		node: {
			id,
			group,
			data: { children },
		},
	} = params;

	const selection = useContext(SelectionContext);
	assert(selection);
	const { toggle, isSelected, select, deselect } = selection;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const childrenIds = (children as any[])?.map(({ [rowIdKey as string]: id }) => id);
	const checked = group ? childrenIds.every(isSelected) : isSelected(id);
	const onChange = group
		? () => {
				if (checked) deselect(childrenIds);
				else select(childrenIds);
		  }
		: () => toggle(id);

	return (
		<div
			css={`
				overflow: hidden;
			`}
		>
			<AGGridCheckbox id={id} onChange={onChange} checked={checked ?? false} />
		</div>
	);
}

const EMPTY_ARRAY = [];

const CHECKBOX_COLUMN = {
	...CHECKBOX_COLUMN_DEF,
	pinned: 'left',
	lockPinned: true,
	colId: CHECKBOX_COL_ID,
	headerName: 'Selection',
	headerCheckboxSelection: false,
	checkboxSelection: false,
	cellRenderer: CheckboxCellRenderer,
	headerComponent: HeaderCheckboxSelection,
};

function useAGGridSelection(ids: string[], agGridRef: RefObject<AgGridRef>, _selection) {
	const defaultSelection = useSelection(ids ?? EMPTY_ARRAY);
	const selection = _selection ?? defaultSelection;
	const selectionRef = useRef(selection);
	selectionRef.current = selection;
	const { selectedSet } = selection;

	useEffect(() => {
		agGridRef?.current?.api?.forEachNode((node) => {
			const nodeId = node.id ?? '';
			const group = node.group;
			if (!node.data) return;
			const selected = group
				? node.data.children.every(({ _id: id }) => selectedSet.has(id))
				: selectedSet.has(nodeId);
			if (node.isSelected() !== selected || node.isSelected() !== node.data?.[CHECKBOX_COL_ID]) {
				node.setData({ ...node.data, [CHECKBOX_COL_ID]: selected });
				// node.setSelected(selected);
			}
		});
	}, [selectedSet, agGridRef]);

	return {
		selectionRef,
		selection,
	};
}

interface SSRMRequest {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	resolve(value: any): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	reject?: any;
	request: IServerSideGetRowsRequest;
}

const defaultGroupBy = (value, _key) => value;

export function useServerSideDatasource(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rows: any[],
	selectionRef: RefObject<Selection>,
	ids,
	onGetKeys,
	headers,
	getGroupId = defaultGroupBy
) {
	const requests = useRef<SSRMRequest[]>([]);

	const update = useCallback(async () => {
		const newRequests: SSRMRequest[] = [];
		if (ids == null) return;
		if (!requests.current.length) return;
		Promise.all(
			requests.current.map(async (req) => {
				const {
					resolve,
					request: { rowGroupCols, startRow, endRow, groupKeys },
				} = req;
				const groupedFields = rowGroupCols.map(({ field }) => {
					assert(field);
					return field;
				});

				if (
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					!rows.every((row) => groupedFields.every((header) => ![undefined, LOADING].includes(row[header!])))
				) {
					newRequests.push(req);
					return;
				}

				const idsSet = new Set(ids);

				(function getValue(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					allData: any[],
					fields: string[],
					path: (string | { _id: string; model: undefined } | { _id: undefined; model: { _id: string } })[],
					firstRow: number,
					groupIdPath = ''
				) {
					if (fields?.length === 0) {
						const rowData = allData.slice(startRow, endRow).reduce((acc, data, index) => {
							const amountOfGroupCases = acc.filter(({ isGroupCase }) => isGroupCase).length;
							return [
								...acc,
								{
									...data,
									CHECKBOX_COL_ID: selectionRef.current?.isSelected(data?._id),
									[COUNT_COL_ID]: data.isGroupCase
										? ''
										: firstRow + (startRow ?? 0) + index + 1 - amountOfGroupCases,
								},
							];
						}, []);

						const idsToFetch = rowData.map(({ _id }) => _id); // TODO: change id;
						if (
							!rowData.every((row) =>
								[...fields, ...headers].every((header) => ![undefined, LOADING].includes(row[header]))
							)
						) {
							onGetKeys(idsToFetch);
							newRequests.push(req);
							return;
						}

						resolve({
							rowCount: allData.length,
							rowData,
						});

						return;
					}

					const groupedField = fields[0];
					const groupKey = getGroupId(path[0], groupedField);

					const groupedRows = groupByFromLodash(allData, (row) => {
						return getGroupId(row[groupedField], groupedField);
					});
					const groups = Object.entries(groupedRows);

					if (path.length === 0) {
						const currentGroupIdPath = `${groupIdPath}__${groupedField}`;
						resolve({
							rowCount: groups.length,
							rowData: groups.slice(startRow, endRow).map(([key, children]) => ({
								_id: `${currentGroupIdPath}-${key}`,
								[groupedField]: children[0][groupedField],
								key: `${currentGroupIdPath}-${key}`,
								children,
								CHECKBOX_COL_ID: children.every(({ _id }) => selectionRef.current?.isSelected(_id)),
							})),
						});

						return;
					}

					let rowsUntilGroup = 0;
					for (const [key, rows] of groups) {
						if (key === groupKey) break;
						rowsUntilGroup += rows.length;
					}
					const currentGroupIdPath = `${groupIdPath}__${groupedField}__${groupKey}`;

					// groupedRows can be an empty object if it is triggered at the same
					// time the rest of the data is loaded such as when a grouped row
					// is re-expanding itself after a whole table re-render takes place
					const groupedRowData = groupedRows[groupKey] || [];

					return getValue(
						groupedRowData,
						fields.slice(1),
						path.slice(1),
						rowsUntilGroup + firstRow,
						currentGroupIdPath
					);
				})(
					rows.filter(({ _id }) => idsSet.has(_id)), // TODO: use correct `_id` key
					groupedFields,
					groupKeys,
					0
				);
			})
		);
		requests.current = newRequests;
	}, [ids, onGetKeys, rows, headers, selectionRef, getGroupId]);

	useEffect(() => {
		update();
	}, [update]);

	const getRows = useCallbackRef(async ({ success, request }) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const promise = new Promise<any>((resolve, reject) => {
			requests.current.push({ resolve, reject, request });
		});
		update();
		const { rowData, rowCount } = await promise;
		success({ rowData, rowCount });
	});

	return useMemo(
		() => ({
			getRows,
		}),
		[getRows]
	);
}

const COUNT_COLUMN = {
	...getCountColumnDef(),
	field: COUNT_COL_ID,
	pinned: 'left',
	lockPinned: true,
	suppressMovable: true,
	lockPosition: true,
	valueGetter: (params) => {
		return params?.node?.data?.[COUNT_COL_ID];
	},
};

export interface AgGridSSRMRef {
	invalidateRows(rowIds?: string[], headers?: string[]): void;
	updateRows(rows: { _id: string; [key: string]: string | null }[]): void;
	getFocusedNode();
	setColumnVisible(key: string, visible: boolean): void;
	clearFilterModel(): void;
	exportDataAsExcel(): void;
}

export type IAgGridSSRMProps = AgGridProps & {
	showSelection?: boolean;
	ids?: string[];
	showCount?: boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	fetch(key: string[], headers?: string[]): Promise<any>;
	rowId?: string;
	visibleHeaders: string[];
	onVisibleHeadersChange?(newHeaders: string[]): void;
	selection?;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	groupBy?(value: any, key: string): string;
};

export const AgGridSSRM = forwardRef<AgGridSSRMRef, IAgGridSSRMProps>(
	(
		{
			ids,
			showSelection,
			showCount,
			context,
			columnDefs: _columnDefs,
			fetch,
			rowId: _rowId,
			visibleHeaders: _visibleHeaders,
			onVisibleHeadersChange,
			selection: _selection,
			onColumnRowGroupChanged,
			groupBy,
			onGridReady: _onGridReady,
			...props
		}: IAgGridSSRMProps,
		ref
	) => {
		const [headers, setVisibleHeaders] = useDerivedState(_visibleHeaders);
		const rowId = _rowId ?? '_id';

		const { filters } = useContext(FilterContext);

		const columnDefs = useMemo(
			() => [
				...(showSelection ? [CHECKBOX_COLUMN] : []),
				...(showCount ? [COUNT_COLUMN] : []),
				...(_columnDefs ?? []),
			],
			[showSelection, _columnDefs, showCount]
		);

		const agGridRef = useRef<AgGridRef>(null);

		const updateColumnsLayout = useCallback(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			const columnsToolPanel = agGridRef?.current?.api?.getToolPanelInstance?.('columns') as any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			columnsToolPanel?.setColumnLayout?.(_columnDefs?.filter((colDef) => !(colDef as any)?.hideToolPanel)); // TODO: properly ignore ts error
		}, [_columnDefs]);

		useEffect(() => {
			updateColumnsLayout();
		}, [updateColumnsLayout]);

		const { selectionRef, selection } = useAGGridSelection(ids ?? EMPTY_ARRAY, agGridRef, _selection);

		const updateVisibleColumns = useCallback(() => {
			const getColumns = (columns) =>
				columns.reduce(
					([visibleColumns, hiddenColumns], { children, colId, hide, field }) => {
						if (children) {
							const [vis, notVis] = getColumns(children);
							visibleColumns.push(...vis);
							hiddenColumns.push(...notVis);
						} else {
							const columnId = field ?? colId;
							if (hide) hiddenColumns.push(columnId);
							else visibleColumns.push(columnId);
						}
						return [visibleColumns, hiddenColumns];
					},
					[[], []]
				);
			const [visibleColumns, hiddenColumns] = getColumns(columnDefs);
			agGridRef.current?.columnApi?.setColumnsVisible(hiddenColumns, false);
			agGridRef.current?.columnApi?.setColumnsVisible(visibleColumns, true);
		}, [columnDefs]);

		useEffect(() => {
			updateVisibleColumns();
		}, [updateVisibleColumns]);

		const { rows, onGetKeys, fetchData, invalidateKeys, setRowData } = useAsyncRows({
			fetch,
			ids: ids ?? EMPTY_ARRAY,
			rowKey: rowId,
			headers,
		});

		const [groupedFields, setGroupedFields] = useState<string[]>([]);

		useEffect(() => {
			if (groupedFields?.length) {
				fetchData(ids, groupedFields);
			}
		}, [ids, groupedFields, fetchData]);

		const rowsRef = useRef(rows);
		rowsRef.current = rows;

		const serverSideDatasource = useServerSideDatasource(rows, selectionRef, ids, onGetKeys, headers, groupBy);

		const [shouldRefreshServerSideStore, setShouldRefreshServerSideStore] = useState<boolean | RefreshStoreParams>(
			false
		);

		const refreshServerSideStore = useCallback((params: true | RefreshStoreParams = true) => {
			setShouldRefreshServerSideStore((prevState) => (typeof prevState === 'boolean' ? params : prevState));
		}, []);

		useEffect(() => {
			if (shouldRefreshServerSideStore) {
				window.requestAnimationFrame(() => {
					const params =
						typeof shouldRefreshServerSideStore === 'boolean' ? undefined : shouldRefreshServerSideStore;
					agGridRef?.current?.api?.refreshServerSideStore(params);
					setShouldRefreshServerSideStore(false);
				});
			}
		}, [shouldRefreshServerSideStore]);

		const invalidateRows = useCallback(
			(ids, headers) => {
				invalidateKeys(ids, headers);
				const groupedFieldsInvalidated = headers?.filter((header) => groupedFields.includes(header)) ?? [];
				if (groupedFieldsInvalidated?.length) {
					fetchData(ids, groupedFieldsInvalidated);
				}
				refreshServerSideStore({ purge: groupedFieldsInvalidated?.length });
			},
			[refreshServerSideStore, invalidateKeys, groupedFields, fetchData]
		);

		const previousIds = useRef<string[] | undefined>();

		useEffect(() => {
			const shouldPurge = previousIds.current !== ids;
			/**
			 * https://www.ag-grid.com/javascript-data-grid/server-side-model-refresh/#maintaining-open-groups purge is
			 * not working properly somehow, as long as `getRowId` is provided and purge == false open groups should
			 * remain open
			 *
			 * HACK: update rows directly instead of relaying on serverside store refresh
			 * https://combocurve.atlassian.net/browse/CC-17141
			 */
			if (shouldPurge) {
				refreshServerSideStore({ purge: shouldPurge }); // `shouldPurge` will always be true for when called from this useEffect until we find out how to fix above
			} else {
				const rowsMap = groupByFromLodash(rows, rowId);
				agGridRef?.current?.api?.forEachNode((rowNode) => {
					if (!rowNode.group && rowNode.data != null) {
						const row = rowsMap[rowNode.data[rowId]]?.[0];
						rowNode.updateData({
							...rowNode.data,
							...row,
						});
					}
				});
			}
			previousIds.current = ids;
		}, [ids, rows, refreshServerSideStore, rowId]);

		const updateRows = useCallback(
			(newRows) => {
				const newRowsMap = groupByFromLodash(newRows, rowId);
				setRowData((prevRowData) =>
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					Object.entries(prevRowData).reduce((acc, [id, prevRow]: [string, any]) => {
						const newRow = newRowsMap[id]?.[0] ?? {};
						acc[id] = { ...prevRow, ...newRow };
						return acc;
					}, {})
				);
			},
			[rowId, setRowData]
		);

		const getFocusedNode = useCallback(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			let focusedNode: any = null;
			const cell = agGridRef.current?.api.getFocusedCell();
			agGridRef.current?.api.forEachNode((node, index) => {
				if (index === cell?.rowIndex) {
					focusedNode = node;
				}
			});
			return focusedNode;
		}, []);

		const setColumnVisible = useCallback((key: string, visible: boolean) => {
			agGridRef?.current?.columnApi?.setColumnVisible(key, visible);
		}, []);

		const clearFilterModel = useCallback(() => {
			agGridRef?.current?.api.setFilterModel(null);
		}, []);

		const exportDataAsExcel = useCallback(() => {
			agGridRef?.current?.api.exportDataAsExcel();
		}, []);

		const syncFilterModel = useCallback(() => {
			const filterModelNonEmptyEntries = Object.entries(filters).filter(([, value]) => value !== '');
			const filterModel = Object.fromEntries(filterModelNonEmptyEntries);
			agGridRef?.current?.api?.setFilterModel(filterModel);
		}, [filters]);

		// Synchronize filters and filterModel
		useEffect(() => {
			syncFilterModel();
		}, [filters, syncFilterModel]);

		useImperativeHandle(ref, () => ({
			updateRows,
			invalidateRows,
			getFocusedNode,
			setColumnVisible,
			clearFilterModel,
			exportDataAsExcel,
		}));

		const onGridReady = (event) => {
			if (_onGridReady) {
				_onGridReady(event);
			}
			updateColumnsLayout();
			syncFilterModel();
		};

		return (
			<SelectionContext.Provider value={selection}>
				<AgGrid
					css={`
						width: 100%;
						height: 100%;
						.ag-row-selected {
							background-color: var(--ag-background-color, var(--background)) !important;
							&.ag-row-odd {
								background-color: var(
									--ag-odd-row-background-color,
									var(--background-opaque)
								) !important;
							}
						}
						&&& {
							.${DASHED_CELLS_CLASS_NAME} {
								// https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/repeating-linear-gradient()
								color: var(--text-color-secondary);
								background-color: gray;
								background: var(--dash-cell-background);
								// HACK with the border the dashed pattern looks odd
								&.ag-cell:not(.ag-cell-range-selected) {
									border: 0;
								}
							}
						}
					`}
					ref={agGridRef}
					serverSideStoreType='partial'
					rowModelType='serverSide'
					suppressRowClickSelection
					serverSideDatasource={serverSideDatasource}
					columnDefs={columnDefs}
					immutableData={false}
					suppressRowDeselection
					rowSelection='multiple'
					getRowId={useCallback((params) => params.data[rowId], [rowId])}
					context={{
						[ROW_ID_KEY]: rowId,
						...(context ?? {}),
					}}
					onGridReady={onGridReady}
					onColumnVisible={({ columns }) => {
						const [visibleColumnSet, hiddenColumnSet] = (columns ?? []).reduce(
							([visibleSet, hiddenSet], column) => {
								const id = column.getColId();
								const visible = column.isVisible();
								if (id === 'index') return [visibleSet, hiddenSet];
								if (visible) visibleSet.add(id);
								else hiddenSet.add(id);
								return [visibleSet, hiddenSet];
							},
							[new Set<string>(), new Set<string>()]
						);
						setVisibleHeaders((prevHeaders) => {
							const headersAdded = difference([...visibleColumnSet], prevHeaders);
							if (headersAdded?.length) {
								invalidateKeys(undefined, headersAdded);
								refreshServerSideStore();
							}
							const newVisibleHeaders = uniq([
								...visibleColumnSet,
								...prevHeaders.filter((key) => !hiddenColumnSet.has(key)),
							]);
							onVisibleHeadersChange?.(newVisibleHeaders);
							return newVisibleHeaders;
						});
					}}
					getChildCount={({ children }) => children?.length}
					onColumnRowGroupChanged={(event) => {
						const columns = event.columnApi.getRowGroupColumns();
						const colIds = columns.map((column) => column.getColId());
						setGroupedFields(colIds);
						onColumnRowGroupChanged?.(event);
					}}
					{...props}
				/>
			</SelectionContext.Provider>
		);
	}
);
