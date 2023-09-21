import { ColDef, GridApi } from 'ag-grid-community';
import { FunctionComponent, memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
	AgGridProps,
	CHECKBOX_COLUMN_DEF,
	Editors,
	NEW_DESIGN_REWRITES,
	getAgGridValueHandler,
} from '@/components/AgGrid';
import { AgGridSSRM, AgGridSSRMRef, CheckboxCellRenderer, HeaderCheckboxSelection } from '@/components/AgGrid.ssrm';
import { useHotkey } from '@/components/hooks';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import PreviewForecast from '@/forecasts/preview-forecast/PreviewForecast';
import { withLoadingBar } from '@/helpers/alerts';
import { useDialog } from '@/helpers/dialog';
import { ColumnsContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/AssumptionHeaderComponent';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';
import { ISortContext, SortContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/useSorting';
import { CHOOSE_MODEL, REMOVE_ASSIGNMENT, getModelData } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/shared';
import { api as ScenarioApi } from '@/scenarios/Scenario/ScenarioPage/index';
import { EMPTY, LOADING } from '@/tables/Table/useAsyncRows';

import TextFilter from '../../components/AgGrid/TextFilter';
import { WellHeaderComponent } from '../../components/AgGrid/WellHeaderComponent/WellHeaderComponent';
import { useSchedule } from '../../hooks/useSchedule';
import { NpvRenderer } from '../components/AgGrid/Renderers/NpvRenderer';
import { SkeletonRenderer } from '../components/AgGrid/Renderers/SkeletonRenderer';
import { getIndexesFromCellRanges } from '../components/AgGrid/StyledAgGrid';
import { useScheduleQualifiers } from '../hooks/useScheduleQualifiers';
import { SCOPES } from '../shared/hotkeys';
import { useScheduleAssumptions } from './Assumptions/useScheduleAssumptions';
import { SchedulingStatusHeaderComponent } from './HeaderComponents/SchedulingStatusHeaderComponent/SchedulingStatusHeaderComponent';
import {
	SCHEDULING_STATUS_LABELS,
	SCHEDULING_STATUS_OPTIONS,
} from './HeaderComponents/SchedulingStatusHeaderComponent/types';
import { AssignmentsApi } from './api/AssignmentsApi';
import {
	CACHE_BLOCK_SIZE,
	DEFAULT_COLUMN_STATES,
	EDITABLE_COLUMNS,
	NPV_COLUMN,
	NULLABLE_VALUES,
	PRIORITY_COLUMN,
	SCHEDULING_STATUS_COLUMN,
} from './consts';
import { useWellTableSelection } from './hooks/useWellTableSelection';
import { PriorityValidation, StatusValidation } from './validations';

const CHECKBOX_COLUMN = {
	...CHECKBOX_COLUMN_DEF,
	pinned: 'left',
	lockPinned: true,
	colId: 'selection',
	headerName: 'Selection',
	headerCheckboxSelection: false,
	checkboxSelection: false,
	cellRenderer: CheckboxCellRenderer,
	headerComponent: HeaderCheckboxSelection,
};

const defaultValueFormatter = (params) =>
	params.value && !DEFAULT_COLUMN_STATES.includes(params.value) ? params.value : 'N/A';

const defaultCellRerender = (props) => {
	const { value, valueFormatted } = props;

	if (value === LOADING || value === undefined) return <SkeletonRenderer />;
	else if (value === EMPTY) return 'N/A';

	return valueFormatted ? valueFormatted : value;
};

type WellTableGridProps = AgGridProps & {
	agGridRef: React.RefObject<AgGridSSRMRef>;
	updateAssignments: (wellIds?: string[], headers?: string[]) => void;
	reloadSchedule: () => void;
	projectId: Inpt.ObjectId;
	scheduleId: Inpt.ObjectId;
	columns: { key: string; title: string; width: number; frozen?: boolean; cellRenderer?: React.ReactElement }[];
	assumptions: string[];
	canUpdateSchedule: boolean;
	filters: Record<string, string>;
	setHeaderFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	wellIds: string[];
	currentSort: { field: string; direction: 'asc' | 'desc' };
	setCurrentSort: React.Dispatch<React.SetStateAction<{ field: string; direction: 'asc' | 'desc' }>>;
};

const getFieldDbName = (fieldName: string) => {
	const fieldNameDbMap = {
		scheduling_status: 'status',
	};
	return fieldNameDbMap[fieldName] || fieldName;
};

const getTableFieldName = (fieldName: string) => {
	const tableFieldMap = {
		status: 'scheduling_status',
	};
	return tableFieldMap[fieldName] || fieldName;
};

const WellTableGrid = ({
	agGridRef,
	updateAssignments,
	reloadSchedule,
	projectId,
	scheduleId,
	columns,
	wellIds,
	assumptions,
	canUpdateSchedule,
	filters,
	setHeaderFilters,
	currentSort,
	setCurrentSort,
	...props
}: WellTableGridProps) => {
	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);
	const { schedule } = useSchedule(scheduleId);

	const selection = useWellTableSelection();

	const { selectAll } = selection;

	useEffect(() => {
		selectAll();
	}, [selectAll]);

	const { isSchedulingNPVEnabled } = useLDFeatureFlags();

	const { lookupTables } = ScenarioApi.useLookupTables(projectId);
	const { lookupTables: tcLookupTables } = ScenarioApi.useTCLookupTables(projectId);

	const npvColumn = useMemo(() => {
		if (isSchedulingNPVEnabled)
			return [
				{
					key: 'npv',
					title: 'NPV',
					width: 200,
					frozen: false,
				},
			];

		return [];
	}, [isSchedulingNPVEnabled]);

	const {
		assumptionsDialogs,
		assumptionsColumns,
		columnsContextValue,
		getAssumptionMenuItems,
		getQualifiersMenuItems,
		chooseModel,
		chooseLookupTable,
		chooseTCLookupTable,
		removeAssignment,
		scrollCallbacksRef,
		updateModel,
	} = useScheduleAssumptions({
		agGridRef,
		projectId,
		scheduleId,
		assignmentIds: wellIds,
		selection,
		assumptions,
		canUpdateSchedule,
		lookupTables,
		tcLookupTables,
	});

	const sortContext: ISortContext = useMemo(
		() => ({
			[`${currentSort.field}`]: { sortDirection: currentSort.direction },
		}),
		[currentSort]
	);

	const filterContextValue = useMemo(
		() => ({
			filters,
			setFilters: setHeaderFilters,
		}),
		[filters, setHeaderFilters]
	);

	const fetch = useCallback(
		async (wellIds) => {
			const data = await assignmentsApi.get({ wellIds });
			return data.map((assignment) => ({
				...assignment,
				...assignment.well,
				well: assignment.well._id,
			}));
		},
		[assignmentsApi]
	);

	const { qualifiers, createQualifier, updateQualifier } = useScheduleQualifiers({
		projectId,
		scheduleId,
		updateAssignments,
		reloadSchedule,
	});
	const activeQualifiers: { inputField: string; qualifier: string; qualifierName: string }[] = useMemo(
		() => schedule?.qualifiers,
		[schedule?.qualifiers]
	);
	const activeStatusQualifier = activeQualifiers.find((qualifier) => qualifier.inputField === 'status');

	const handleChangeMultiValues = useCallback(
		({ column, values }) => {
			const columnName = getTableFieldName(column);
			agGridRef.current?.updateRows(values.map(({ well, value }) => ({ _id: well, [columnName]: value })));

			withLoadingBar(assignmentsApi.updateMany({ column, values }));
		},
		[agGridRef, assignmentsApi]
	);

	const handleChangeMultiCell = useCallback(
		(wellIds, column, value) => {
			const columnName = getTableFieldName(column);
			agGridRef.current?.updateRows(wellIds.map((well: string) => ({ _id: well, [columnName]: value })));

			return withLoadingBar(
				assignmentsApi.update({
					wellIds,
					column,
					value,
				})
			);
		},
		[agGridRef, assignmentsApi]
	);

	const columnDefs = useMemo(() => {
		return [
			CHECKBOX_COLUMN,
			...[...columns, ...npvColumn].map((column) => {
				const columnDef = {
					field: column.key,
					headerName: column.title,
					minWidth: column.width,
					lockPosition: column.frozen,
					editable: EDITABLE_COLUMNS.includes(column.key),
					cellRenderer: defaultCellRerender,
				} as ColDef;

				switch (column.key) {
					case PRIORITY_COLUMN:
						return {
							...columnDef,
							width: 130,
							pinned: 'left',
							valueFormatter: (params) => {
								const { priority } = params.data;
								const formattedPriority =
									!NULLABLE_VALUES.includes(priority) && !DEFAULT_COLUMN_STATES.includes(priority)
										? priority
										: 'N/A';
								return formattedPriority;
							},
							valueGetter: (params) => {
								const { priority } = params.data;
								return DEFAULT_COLUMN_STATES.includes(priority) ? null : priority;
							},
							valueSetter: (params) => {
								const { data, colDef, newValue, oldValue } = params;
								const emptyFieldWithNoChanges =
									NULLABLE_VALUES.includes(newValue) && NULLABLE_VALUES.includes(oldValue);
								if (emptyFieldWithNoChanges) return false;

								const formattedValue = NULLABLE_VALUES.includes(newValue) ? null : newValue;
								if (!colDef.field || !PriorityValidation.isValidSync(formattedValue)) return false;
								data[colDef.field] = formattedValue;
								return true;
							},
						};
					case SCHEDULING_STATUS_COLUMN:
						return {
							...columnDef,
							headerComponent: (params) =>
								// eslint-disable-next-line new-cap -- TODO eslint fix later
								SchedulingStatusHeaderComponent({
									...params,
									umbrellas: qualifiers,
									selectedUmbrellaId: activeStatusQualifier?.qualifier,
									canUpdateSchedule,
								}),
							type: 'combobox',
							cellEditorParams: { options: SCHEDULING_STATUS_OPTIONS },
							refData: SCHEDULING_STATUS_LABELS,
							pinned: 'right',
							...getAgGridValueHandler(SCHEDULING_STATUS_LABELS),
							valueSetter: (params) => {
								const { data, colDef, newValue } = params;
								if (!colDef.field || !StatusValidation.isValidSync(newValue)) return false;

								data[colDef.field] = newValue;
								return true;
							},
						};
					case NPV_COLUMN: {
						return {
							...columnDef,
							cellRenderer: NpvRenderer,
						};
					}
					default:
						return {
							...columnDef,
							filter: TextFilter,
							filterParams: { showIcon: true, colId: column.key },
							headerComponent: WellHeaderComponent,
						};
				}
			}),
			isSchedulingNPVEnabled && assumptionsColumns,
		].filter(Boolean) as ColDef[];
	}, [
		assumptionsColumns,
		columns,
		npvColumn,
		qualifiers,
		activeStatusQualifier,
		canUpdateSchedule,
		isSchedulingNPVEnabled,
	]);

	const visibleHeaders = [
		...[...columns, ...npvColumn].map(({ key }) => key),
		...assumptionsColumns.children.map(({ field }) => field),
	];

	const [gridApi, setGridApi] = useState<GridApi>();

	useHotkey('space', SCOPES.wellTable, (e) => {
		e.preventDefault();
		if (!gridApi) return;

		const focusedCell = gridApi.getFocusedCell();
		if (!focusedCell) return;

		const node = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
		if (!node || !node.id) return;

		selection.setSelectedSet(
			selection.selectedSet.has(node.id)
				? [...selection.selectedSet, node?.id].filter((id) => id !== node.id)
				: [...selection.selectedSet, node?.id]
		);
	});

	useHotkey('shift+space', SCOPES.wellTable, (e) => {
		e.preventDefault();
		if (!gridApi) return;

		const indexes = getIndexesFromCellRanges(gridApi);
		if (!indexes) return;

		const selectedIds: string[] = [];
		const removeIds: string[] = [];

		indexes.forEach((index) => {
			const node = gridApi.getDisplayedRowAtIndex(index);
			if (!node || !node.id) return;
			if (selection.selectedSet.has(node.id)) {
				removeIds.push(node.id);
			} else {
				selectedIds.push(node.id);
			}
		});

		selection.setSelectedSet([...selection.selectedSet, ...selectedIds].filter((id) => !removeIds.includes(id)));
	});

	const [previewForecastDialog, showPreviewForecastDialog] = useDialog(PreviewForecast as FunctionComponent);

	const openForecastPreview = useCallback(
		({
			_id: assignmentId,
			forecast: {
				model: { _id: forecastId },
			},
		}) => {
			const assignment = wellIds.find((well) => well === assignmentId);
			showPreviewForecastDialog(({ onHide }) => ({
				scheduleId,
				fId: forecastId,
				source: 'schedule',
				initWell: assignment,
				wells: wellIds,
				close: onHide,
				sorting: [],
			}));
		},
		[wellIds, showPreviewForecastDialog, scheduleId]
	);

	return (
		<SortContext.Provider value={sortContext}>
			<FilterContext.Provider value={filterContextValue}>
				<ColumnsContext.Provider value={columnsContextValue}>
					{assumptionsDialogs}
					{previewForecastDialog}

					<AgGridSSRM
						css={`
							.ag-header-cell-resize::after {
								height: 100% !important;
								top: 0 !important;
							}
							${NEW_DESIGN_REWRITES}
						`}
						ref={agGridRef}
						columnDefs={columnDefs}
						defaultColDef={useMemo(
							() => ({
								sortable: true,
								filter: true,
								resizable: true,
								minWidth: 130,
								valueFormatter: defaultValueFormatter,
							}),
							[]
						)}
						columnTypes={{
							combobox: { cellEditor: Editors.ComboboxEditor },
						}}
						onBodyScroll={() => {
							Object.values(scrollCallbacksRef.current).forEach((cb) => cb());
						}}
						context={{
							onCreateQualifier: createQualifier,
							onChangeQualifier: updateQualifier,
							handleChangeMultiCell,
							activeQualifiers: activeStatusQualifier?.qualifier,
							getAssumptionMenuItems,
							getQualifiersMenuItems,
							canUpdateScenario: canUpdateSchedule,
							chooseLookupTable,
							chooseModel,
							chooseTCLookupTable,
							columns,
							lookupTables,
							removeAssignment,
							tcLookupTables,
							scrollCallbacks: scrollCallbacksRef.current,
							openForecastPreview,
						}}
						groupHeaderHeight={0}
						groupDisplayType='groupRows'
						selection={selection}
						enableRangeSelection
						suppressRowClickSelection
						suppressRowDeselection
						immutableData={false}
						rowSelection='multiple'
						suppressMultiRangeSelection
						onGridReady={(event) => setGridApi(event.api)}
						onCellValueChanged={(event) => {
							if (event.source === 'paste') return;

							const { newValue, node, column, oldValue } = event;
							const colId = column.getColId();

							if (assumptions.includes(colId)) {
								const resetValue = () => {
									node.setData({ ...node.data, [colId]: oldValue });
								};

								if (newValue === REMOVE_ASSIGNMENT) {
									removeAssignment({ assumptionKey: colId, assignment: node.data });
									return;
								}
								if (newValue === CHOOSE_MODEL) {
									resetValue();
									chooseModel({ assumptionKey: colId, assignment: node.data });
									return;
								}
								if (['model', 'lookup', 'tcLookup'].includes(Object.keys(newValue)[0])) {
									updateModel({
										assumptionKey: colId,
										assignmentId: node.id,
										value: newValue,
									});
									return;
								}
								resetValue();
							}

							const field = getFieldDbName(event.colDef.field || '');
							handleChangeMultiCell([event.data._id], field, event.newValue);
						}}
						headerHeight={80}
						fetch={fetch}
						ids={wellIds}
						visibleHeaders={visibleHeaders}
						rowModelType='serverSide'
						serverSideStoreType='partial'
						suppressExcelExport
						suppressCsvExport
						cacheBlockSize={CACHE_BLOCK_SIZE}
						suppressLastEmptyLineOnPaste
						onSortChanged={async (event) => {
							const sortedColumns = event.columnApi.getColumnState().filter(({ sort }) => sort);
							if (sortedColumns.length) {
								const { colId, sort } = sortedColumns[0];
								setCurrentSort({ field: colId, direction: sort || 'asc' });
							} else {
								setCurrentSort({
									field: PRIORITY_COLUMN,
									direction: 'asc',
								});
							}
						}}
						undoRedoCellEditing
						processCellForClipboard={(params) => {
							const value = params.value;

							if (NULLABLE_VALUES.includes(value)) return EMPTY;
							if (['string', 'number'].includes(typeof value)) return value;

							const key = params.column.getColId();
							const [, name] = getModelData({ assumption: value, assumptionKey: key });
							return NULLABLE_VALUES.includes(name) ? EMPTY : name;
						}}
						processCellFromClipboard={(params) => {
							const key = params.column.getColId();
							if (assumptions.includes(key)) return;

							if ([EMPTY, ...NULLABLE_VALUES].includes(params.value)) return null;
							return params.value;
						}}
						processDataFromClipboard={(event) => {
							const { data, api } = event;

							let pasteIndexes = getIndexesFromCellRanges(api);
							if (!pasteIndexes || !pasteIndexes.length) return data;

							const pasteDataLength = data.length;

							if (pasteDataLength > pasteIndexes?.length) {
								pasteIndexes = Array.from(
									{ length: pasteDataLength },
									// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
									(_, i) => i + pasteIndexes![0]
								);
							}

							const focusedCell = api.getFocusedCell();
							if (!focusedCell) return data;

							const { column } = focusedCell;
							const colId = column.getColId();

							if (EDITABLE_COLUMNS.includes(colId)) {
								const values = [] as { well: string; value: number | string | null }[];

								pasteIndexes.forEach((rowIndex, arrayIndex) => {
									const indexRow = api.getDisplayedRowAtIndex(rowIndex);
									const newValue = !data[arrayIndex] ? data[0][0] : data[arrayIndex][0];

									switch (colId) {
										case SCHEDULING_STATUS_COLUMN:
											if (StatusValidation.isValidSync(newValue))
												values.push({ well: indexRow?.data._id, value: newValue });
											break;
										case PRIORITY_COLUMN: {
											const formattedValue = [EMPTY, ...NULLABLE_VALUES].includes(newValue)
												? null
												: Number(newValue);

											if (PriorityValidation.isValidSync(formattedValue))
												values.push({ well: indexRow?.data._id, value: formattedValue });
											break;
										}
									}
								});

								const hasChanges = values.length > 0;
								if (hasChanges) handleChangeMultiValues({ column: getFieldDbName(colId), values });
							}
							return data;
						}}
						{...props}
					/>
				</ColumnsContext.Provider>
			</FilterContext.Provider>
		</SortContext.Provider>
	);
};

export const MemoizedWellTableGrid = memo(WellTableGrid);
