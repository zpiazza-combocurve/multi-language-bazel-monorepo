import { ColDef, SortModelItem } from 'ag-grid-community';
import _ from 'lodash';
import { useEffect, useMemo, useState } from 'react';

import { SUBJECTS } from '@/access-policies/Can';
import { usePermissionsBuilder } from '@/access-policies/usePermissions';
import AgGrid, {
	AgGridRef,
	DISABLED_CELL_CLASS_NAME,
	Editors,
	NEW_DESIGN_REWRITES,
	getAgGridValueHandler,
} from '@/components/AgGrid';
import { handleAgGridDeleteRangeSelectedCells } from '@/helpers/ag-grid';
import { useAlfa } from '@/helpers/alfa';
import { useUnsavedWork } from '@/helpers/unsaved-work';
import { formatIdx } from '@/helpers/utilities';
import { convertDateToIdx } from '@/helpers/zing';
import { ConstructionSettings } from '@/inpt-shared/scheduling/shared';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';
import { ISortContext, SortContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/useSorting';
import ComboboxEditor from '@/scheduling/ScheduleLandingPage/components/AgGrid/Editors/ComboboxEditor';

import TextFilter from '../../components/AgGrid/TextFilter';
import { WellHeaderComponent } from '../../components/AgGrid/WellHeaderComponent/WellHeaderComponent';
import { WELL_HEADER_COLUMNS } from '../../shared/columns';
import { getWellOutputs } from '../api';
import { EditTableModifiedValues } from './EditTableModifiedValues';
import { OutputColumns } from './OutputColumns';

const CACHE_BLOCK_SIZE = 5000;
const NON_EDITABLE_COLUMNS = ['priority', ...WELL_HEADER_COLUMNS.map(({ key }) => key)];

type ColDefProps = ColDef & {
	originalField: string;
	stepIdx: number;
};

const ScheduleOutputTable = ({
	scheduleId,
	editing,
	agGridRef,
	modifiedRowsRef,
	filters,
	setHeaderFilters,
	wellIds,
	hasModifiedData,
	setHasModifiedData,
	scheduleSettings,
}: {
	scheduleId: Inpt.ObjectId<'schedule'>;
	editing: boolean;
	agGridRef: React.MutableRefObject<AgGridRef | null>;
	modifiedRowsRef: React.MutableRefObject<EditTableModifiedValues | null>;
	filters: Record<string, string>;
	setHeaderFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	wellIds: string[];
	hasModifiedData: boolean;
	setHasModifiedData: React.Dispatch<React.SetStateAction<boolean>>;
	scheduleSettings: ConstructionSettings;
}) => {
	const { project } = useAlfa();
	const schedule = { project: project?._id } as Inpt.Schedule;
	const canUpdateSchedule = usePermissionsBuilder(SUBJECTS.Schedules).canUpdate(schedule);

	useUnsavedWork(hasModifiedData);

	const colDefs = useMemo(
		() =>
			[
				{
					field: 'priority',
					headerName: '#',
					pinned: true,
					resizable: true,
					width: 90,
					lockPinned: true,
					suppressMenu: true,
					type: 'number',
					sortable: true,
				},
				...WELL_HEADER_COLUMNS.map(({ key, title, width, frozen }) => {
					let wellHeaderColDef = {
						field: key,
						pinned: frozen,
						headerName: title,
						resizable: true,
						width,
						type: 'string',
						sortable: true,
					} as ColDef;

					if (key !== 'scheduling_status') {
						wellHeaderColDef = {
							...wellHeaderColDef,
							filter: TextFilter,
							filterParams: { showIcon: true, colId: key },
							headerComponent: WellHeaderComponent,
						};
					}

					return wellHeaderColDef;
				}),
			] as ColDef[],
		[]
	);

	const [outputColumns, setOutputColumns] = useState<OutputColumns>(new OutputColumns());

	useEffect(() => {
		agGridRef.current?.api?.setColumnDefs([
			...colDefs,
			..._.orderBy(outputColumns.getDef(), 'stepIdx').map(
				({ field, title, type, readOnly, originalField, stepIdx, hide }) => {
					const availableResources =
						scheduleSettings?.resources
							.filter((resource) => resource.stepIdx.includes(stepIdx) && resource.active)
							.map((resource) => ({ name: resource.name, stepIdx: resource.stepIdx })) || [];

					const availableResourcesMap = _.keyBy(availableResources.map((resource) => resource.name));
					const editableField = editing && canUpdateSchedule && !readOnly;

					let colDef = {
						field,
						originalField,
						headerName: title,
						stepIdx,
						width: 200,
						type,
						editable: editableField,
						cellEditorParams: {
							asLocal: true,
							forceOpen: true,
						},
						sortable: true,
						hide,
					} as ColDefProps;

					if (type === 'combobox') {
						colDef = {
							...colDef,
							editable: editableField && availableResources.length > 1,
							cellEditorParams: {
								...colDef.cellEditorParams,
								options: availableResources.map(({ name }) => name),
							},
							refData: availableResourcesMap,
							...getAgGridValueHandler(availableResourcesMap),
							valueSetter: (params) => {
								if (!params.node?.id || !params.colDef.field) {
									return false;
								}

								if (params.newValue === params.oldValue) {
									return false;
								}

								const resourceIdx = scheduleSettings?.resources.findIndex(
									(resource) => resource.name === params.newValue
								);

								modifiedRowsRef.current?.setModifiedValue({
									id: params.node.id,
									wellName: params.data.well_name,
									field: params.colDef.field,
									value: params.newValue,
									originalField: colDef.originalField,
									stepIdx: colDef.stepIdx,
									resourceIdx,
									originalData: params.data,
								});

								setHasModifiedData(true);

								return true;
							},
						};
					}

					return colDef;
				}
			),
		]);
	}, [
		outputColumns,
		editing,
		canUpdateSchedule,
		colDefs,
		agGridRef,
		scheduleSettings?.resources,
		modifiedRowsRef,
		setHasModifiedData,
	]);

	const filterContextValue = useMemo(
		() => ({
			filters,
			setFilters: setHeaderFilters,
		}),
		[filters, setHeaderFilters]
	);

	const [currentSort, setCurrentSort] = useState<{ field: string; direction: 'desc' | 'asc' }>({
		field: 'priority',
		direction: 'asc',
	});

	const sortContext: ISortContext = useMemo(
		() => ({
			[`${currentSort.field}`]: { sortDirection: currentSort.direction },
		}),
		[currentSort]
	);

	return (
		<SortContext.Provider value={sortContext}>
			<FilterContext.Provider value={filterContextValue}>
				<AgGrid
					css={`
						height: 100%;
						width: 100%;
						.ag-header-cell-resize::after {
							height: 100% !important;
							top: 0 !important;
						}
						.ag-react-container {
							height: 80px;
							width: 100%;
						}
						${NEW_DESIGN_REWRITES}
					`}
					headerHeight={80}
					ref={agGridRef}
					suppressMultiSort
					suppressRowClickSelection
					suppressMultiRangeSelection
					suppressCsvExport
					suppressExcelExport
					suppressLastEmptyLineOnPaste
					enableRangeSelection
					getRowId={({ data }) => data._id}
					context={{ editing }}
					rowModelType='serverSide'
					serverSideStoreType='partial'
					cacheBlockSize={CACHE_BLOCK_SIZE}
					columnDefs={colDefs}
					columnTypes={{
						idx: { cellEditor: Editors.DateEditor },
						string: { cellEditor: Editors.TextEditor },
						combobox: { cellEditor: ComboboxEditor },
					}}
					gridOptions={{
						columnTypes: {
							idx: {},
							string: {},
							number: {},
							combobox: {},
						},
					}}
					defaultColDef={useMemo(
						() => ({
							resizable: true,
							suppressKeyboardEvent: (params) => {
								if (params.event.key === 'Delete' && params.context.editing) {
									const columns = params.columnApi.getAllColumns() || [];
									const nonEditableDynamicColumns = columns
										.filter((column) => {
											const colDef = column.getUserProvidedColDef();
											return colDef && !colDef.editable;
										})
										.map((column) => {
											const colDef = column.getUserProvidedColDef();
											return colDef && colDef.field ? colDef.field : false;
										})
										.filter(Boolean) as string[];

									const newData = handleAgGridDeleteRangeSelectedCells(params.api, {
										ignoreColumns: [...NON_EDITABLE_COLUMNS, ...nonEditableDynamicColumns],
									});

									if (newData === undefined) {
										return true;
									}

									Object.keys(newData).forEach((id) => {
										const fields = Object.keys(newData[id]);

										fields.forEach((field) => {
											const colDef = params.columnApi
												.getColumn(field)
												?.getColDef() as typeof params.colDef & {
												originalField: string;
												stepIdx: number;
											};

											const { originalField, stepIdx } = colDef;
											const value = newData[id][field];
											modifiedRowsRef.current?.setModifiedValue({
												id,
												wellName: params.data.well_name,
												field,
												value,
												originalField,
												stepIdx,
												originalData: params.data,
											});
										});
									});

									setHasModifiedData(true);
									agGridRef.current?.api.refreshCells();

									return true;
								}
								return false;
							},
							valueSetter: (params) => {
								if (!params.node?.id || !params.colDef.field) {
									return false;
								}

								const newValue = (() => {
									if (!params.newValue) {
										return null;
									}

									return convertDateToIdx(params.newValue);
								})();

								const oldValue = params.oldValue ? convertDateToIdx(params.oldValue) : null;

								if (newValue === oldValue) {
									return false;
								}

								const colDef = params.colDef as typeof params.colDef & {
									originalField: string;
									stepIdx: number;
								};

								modifiedRowsRef.current?.setModifiedValue({
									id: params.node.id,
									wellName: params.data.well_name,
									field: params.colDef.field,
									value: newValue,
									originalField: colDef.originalField,
									stepIdx: colDef.stepIdx,
									originalData: params.data,
								});

								setHasModifiedData(true);

								return true;
							},
							valueGetter: (params) => {
								if (!params.node?.id || !params.colDef.field) {
									return undefined;
								}

								const modifiedValue = modifiedRowsRef.current?.getModifiedValue({
									id: params.node.id,
									field: params.colDef.field,
								});

								if (params.colDef.type === 'idx' || modifiedValue !== undefined) {
									const newValue =
										modifiedValue !== undefined
											? modifiedValue.value
											: params.data[params.colDef.field];

									return params.colDef.type === 'idx' ? formatIdx(newValue) : newValue;
								}

								return params.data[params.colDef.field] ?? 'N/A';
							},
							editable: (params) => {
								return (
									params.context.editing &&
									canUpdateSchedule &&
									!NON_EDITABLE_COLUMNS.includes(params.column.getColId())
								);
							},
							cellClassRules: {
								[DISABLED_CELL_CLASS_NAME]: (params) =>
									params.context.editing &&
									(NON_EDITABLE_COLUMNS.includes(params.colDef.field as string) ||
										!params.colDef.editable),
							},
						}),
						[canUpdateSchedule, agGridRef, modifiedRowsRef, setHasModifiedData]
					)}
					serverSideDatasource={useMemo(
						() => ({
							getRows: async (params) => {
								const { request, success } = params;

								if (!wellIds?.length) {
									success({ rowCount: 0, rowData: [] });
									return;
								}

								if (request.sortModel.length) {
									const sortModel = request.sortModel[0];
									setCurrentSort({ field: sortModel.colId, direction: sortModel.sort });
									const currentColumnDefs = agGridRef.current?.api.getColumnDefs();

									const sortedColumn = currentColumnDefs?.find(
										(column) => (column as ColDefProps).field === sortModel?.colId
									) as ColDefProps;

									if (sortedColumn?.originalField) {
										request.sortModel = [
											{
												...sortModel,
												colId: sortedColumn.originalField,
												stepIdx: sortedColumn.stepIdx,
											} as SortModelItem & {
												stepIdx: number;
											},
										];
									}
								} else {
									setCurrentSort({
										field: 'priority',
										direction: 'asc',
									});
								}

								const rows = await getWellOutputs(scheduleId, wellIds, request);
								const outputColumns = new OutputColumns(rows);

								setOutputColumns(outputColumns);

								success({ rowCount: wellIds.length, rowData: outputColumns.getData() });
							},
						}),
						[scheduleId, agGridRef, wellIds]
					)}
				/>
			</FilterContext.Provider>
		</SortContext.Provider>
	);
};

export default ScheduleOutputTable;
