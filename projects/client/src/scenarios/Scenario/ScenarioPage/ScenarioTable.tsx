import { faSackDollar, faSearch } from '@fortawesome/pro-regular-svg-icons';
import { faLayerGroup } from '@fortawesome/pro-solid-svg-icons';
import { InputAdornment, useTheme } from '@material-ui/core';
import { ColDef, ColGroupDef, ICellRendererParams, IDoesFilterPassParams, IFilterParams } from 'ag-grid-community';
import {
	createContext,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';

import { AgGridSSRM, AgGridSSRMRef, CheckboxCellRenderer } from '@/components/AgGrid.ssrm';
import { useAgGridCache, useCallbackRef, useHotkey, useHotkeyScope } from '@/components/hooks';
import { Icon, IconButton, TextField } from '@/components/v2';
import { hexToRgba } from '@/helpers/text';
import { assert } from '@/helpers/utilities';
import { ASSUMPTION_FOR_GROUPS, AssumptionKey } from '@/inpt-shared/constants';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import {
	NON_ECON_MODEL_KEYS,
	ORDERED_HEADERS_AND_ASSUMPTIONS_STORAGE_KEY,
	SCENARIO_GRID_GROUPS_STORAGE_KEY,
	getAssumptionLabel,
	getHeaderLabel,
} from '@/scenarios/shared';

import { AssumptionCellEditor } from './ScenarioTable/CellEditors/AssumptionCellEditor';
import { EconGroupCellEditor } from './ScenarioTable/CellEditors/EconGroupCellEditor';
import { AssumptionCellRenderer } from './ScenarioTable/CellRenderers/AssumptionCellRenderer';
import { EconGroupCellRenderer } from './ScenarioTable/CellRenderers/EconGroupCellRenderer';
import { HeaderCellRenderer } from './ScenarioTable/CellRenderers/HeaderCellRenderer';
import {
	AssumptionHeaderComponent,
	ColumnsContext,
	RequiredFieldsContext,
} from './ScenarioTable/HeaderComponents/AssumptionHeaderComponent';
import { FilterContext, WellHeaderComponent } from './ScenarioTable/HeaderComponents/WellHeaderComponent';
import { ISortContext, SortContext } from './ScenarioTable/HeaderComponents/useSorting';
import { AssumptionValueFormatter } from './ScenarioTable/ValueFormatters/AssumptionValueFormatter';
import { EconGroupValueFormatter } from './ScenarioTable/ValueFormatters/EconGroupValueFormatter';
import { HeaderValueFormatter } from './ScenarioTable/ValueFormatters/HeaderValueFormatter';
import { IncrementalFormatter } from './ScenarioTable/ValueFormatters/IncrementalValueFormatter';
import { CHOOSE_MODEL, REMOVE_ASSIGNMENT, getModelData } from './ScenarioTable/shared';
import { HEADERS_WITH_TYPE_STRING, stringHeaderTypes } from './constants';

interface IScenarioTableProps {
	assignments: Pick<Inpt.ScenarioWellAssignment, '_id' | 'well' | 'index'>[];
	assumptions: string[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	buildScenario(ids?: string[], headers?: string[]): Promise<any[]>;
	canUpdateScenario: boolean;
	chooseLookupTable;
	updateGroup;
	chooseModel;
	chooseTCLookupTable;
	columns: Inpt.Scenario['columns'];
	handleCreateEconGroup;
	handleUpdateEconGroup;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	econGroups: any[];
	filters: { [key: string]: string };
	getAssumptionMenuItems;
	getQualifiersMenuItems;
	headers: string[];
	lastRunId?: string;
	lookupTables;
	setFilters;
	onSortChange;
	onVisibleHeadersChange?(newHeaders: string[]): void;
	openForecastPreview;
	removeAssignment;
	requiredFields;
	runSingleWellAssignmentEconomics;
	selection?;
	showCount?: boolean;
	showInc?: boolean;
	showSelection?: boolean;
	showWellDialog;
	showGroupDialog;
	sorting: { field: string; direction: number }[];
	tcLookupTables;
	updateModel;
	updateEconGroupHeaders;
	visibleHeaders: string[];
	isModularScenario?: boolean;
}

export interface IScenarioTableRef {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	updateAssignments(assignmentIds: string[] | null | undefined, assumptionKey: string, value: any): void;
	invalidateAssignments(ids?: string[] | null, assumptionKeys?: string[] | null): void;
	clearFilterModel(): void;
}

const TextFilter = forwardRef(
	(
		props: IFilterParams & {
			showIcon?: boolean;
			center?: boolean;
			colId: string;
		},
		ref
	) => {
		const { colId } = props;

		const { filters, setFilters } = useContext(FilterContext);

		const value = filters?.[colId];

		const updateFilters = (value) => {
			const newFiltersModel = {
				...filters,
				[colId]: value,
			};
			const newFiltersModelValidEntries = Object.entries(newFiltersModel).filter(([, value]) => value);
			setFilters(Object.fromEntries(newFiltersModelValidEntries));
		};

		// expose AG Grid Filter Lifecycle callbacks
		useImperativeHandle(ref, () => {
			return {
				doesFilterPass(params: IDoesFilterPassParams) {
					return params.data[props.column.getColId()]?.match(value);
				},
				isFilterActive() {
					return !!value;
				},
				getModel() {
					return value ?? '';
				},

				// setModel should be empty to override default behavior
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				setModel() {},
			};
		});

		const onValueChange = (event) => {
			const newValue = event.target.value;
			updateFilters(newValue);
		};

		return (
			<TextField
				css={`
					padding: 0 0.5rem;
					width: 100%;
					& input {
						text-align: ${props.center ? 'center' : 'inherit'};
					}
				`}
				onChange={onValueChange}
				value={value || ''}
				InputProps={
					props.showIcon
						? {
								endAdornment: (
									<InputAdornment position='end'>
										<Icon>{faSearch}</Icon>
									</InputAdornment>
								),
						  }
						: {}
				}
			/>
		);
	}
);

// TODO: move constant to shared
const ENTER_KEY = 'Enter';

const LastRunIdContext = createContext<string | null | undefined>(null);

export function EconRunFormatter(params: ICellRendererParams) {
	const { runSingleWellAssignmentEconomics } = params.context;
	const lastRunId = useContext(LastRunIdContext);
	const {
		node: { id },
		data: { isGroupCase },
	} = params;

	const runEconomics = () => {
		runSingleWellAssignmentEconomics(params.node.data);
	};

	if (params.node.group) return null;

	return (
		<div
			css={`
				width: 100%;
				height: 100%;
				text-align: center;
				display: flex;
				align-items: center;
				justify-content: center;
			`}
		>
			{isGroupCase ? (
				<Icon color='primary'>{faLayerGroup}</Icon>
			) : (
				<IconButton color={lastRunId === id ? 'primary' : 'secondary'} size='small' onClick={runEconomics}>
					{faSackDollar}
				</IconButton>
			)}
		</div>
	);
}

function GroupRowRenderer(params) {
	const CellRenderer = params.node.rowGroupColumn.colDef.cellRenderer;
	const column = params.node.rowGroupColumn;
	const normalParams = {
		...params,
		valueFormatted: column.colDef.valueFormatter({ ...params, column }),
		column,
	};
	const padding = 1;

	return (
		<div
			css={`
				&:not(:hover) {
					background-color: var(--data-grid-group-${params.node.uiLevel + 1}); // TODO: get color from theme
				}
				width: 100%;
				display: flex;
				align-items: center;
				height: 100%;
				padding: 0 ${padding}rem;
			`}
		>
			<CheckboxCellRenderer {...normalParams} />

			<div
				css={`
					padding-left: ${params.node.uiLevel * padding}rem;
				`}
			>
				<CellRenderer {...normalParams} />
			</div>
		</div>
	);
}

export const ScenarioTable = forwardRef<IScenarioTableRef, IScenarioTableProps>(
	(
		{
			assignments,
			assumptions,
			buildScenario,
			canUpdateScenario,
			chooseLookupTable,
			updateGroup,
			chooseModel,
			chooseTCLookupTable,
			columns,
			handleCreateEconGroup,
			handleUpdateEconGroup,
			econGroups,
			filters,
			getAssumptionMenuItems,
			getQualifiersMenuItems,
			headers,
			lastRunId,
			lookupTables,
			setFilters,
			onSortChange,
			onVisibleHeadersChange,
			openForecastPreview,
			removeAssignment,
			requiredFields,
			runSingleWellAssignmentEconomics,
			selection,
			showCount: _showCount,
			showInc,
			showSelection: _showSelection,
			showWellDialog,
			showGroupDialog,
			sorting,
			tcLookupTables,
			updateModel,
			updateEconGroupHeaders,
			visibleHeaders,
			isModularScenario,
		}: IScenarioTableProps,
		ref
	) => {
		const showSelection = _showSelection ?? true;
		const showCount = _showCount ?? true;
		const assignmentIds = useMemo(() => assignments.map(({ _id }) => _id), [assignments]);

		const agGridRef = useRef<AgGridSSRMRef>(null);

		const econGroupEnabled = !!econGroups?.length;

		useEffect(() => {
			if (agGridRef.current) {
				const gridApi = agGridRef.current;
				assert(gridApi);
				gridApi.setColumnVisible('index', !!showInc);
			}
		}, [showInc]);

		useEffect(() => {
			if (agGridRef.current) {
				const gridApi = agGridRef.current;
				assert(gridApi);
				gridApi.setColumnVisible('econGroup', econGroupEnabled);
			}
		}, [econGroupEnabled]);

		const showEcon = !!runSingleWellAssignmentEconomics;

		const defaultSorting = useRef(sorting); // using useRef to get the value on the first render
		defaultSorting.current = sorting;

		const updateAssignments = useCallback(
			(ids, assumptionKey, value) => {
				const gridApi = agGridRef?.current;
				assert(gridApi);
				gridApi.updateRows((ids ?? assignmentIds).map((id) => ({ _id: id, [assumptionKey]: value })));
			},
			[assignmentIds]
		);

		const invalidateAssignments = useCallback((ids?, assumptionKeys?) => {
			const gridApi = agGridRef?.current;
			assert(gridApi);
			gridApi.invalidateRows(ids, assumptionKeys);
		}, []);

		const clearFilterModel = useCallback(() => {
			const gridApi = agGridRef?.current;
			assert(gridApi);
			gridApi.clearFilterModel();
		}, []);

		useImperativeHandle(ref, () => ({
			updateAssignments,
			invalidateAssignments,
			clearFilterModel,
		}));

		const initialVisible = useRef(visibleHeaders);
		const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => {
			const visibleSet = new Set(initialVisible.current);

			return [
				{
					filter: null,
					width: 60,
					editable: false,
					minWidth: 72,
					suppressMenu: true,
					sortable: false,
					suppressMovable: true,
					lockVisible: true,
					lockPosition: true,
					headerName: 'Econ',
					field: 'econ-run',
					cellRenderer: EconRunFormatter,
					pinned: 'left',
					lockPinned: true,
					hideToolPanel: true,
					skipHeaderOnAutoSize: true,
					hide: !showEcon || isModularScenario,
				},
				{
					headerName: 'Econ Group',
					field: 'econGroup',
					valueFormatter: EconGroupValueFormatter,
					cellRenderer: EconGroupCellRenderer,
					cellRendererParams: {
						canUpdateScenario,
					},
					editable: canUpdateScenario && ((params) => !params.node.data.isGroupCase),
					cellEditor: EconGroupCellEditor,
					hide: !econGroupEnabled,
					enableRowGroup: true,
					sortable: false,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				} as any as ColDef,
				{
					headerName: 'Headers',
					children: [
						{
							cellRenderer: IncrementalFormatter,
							editable: false,
							field: 'index',
							filter: TextFilter,
							filterParams: { center: true, colId: 'index' },
							headerComponent: WellHeaderComponent,
							headerName: 'Inc',
							hideToolPanel: true,
							lockPinned: true,
							lockPosition: true,
							lockVisible: true,
							minWidth: 60,
							pinned: 'left',
							skipHeaderOnAutoSize: true,
							sortable: false,
							suppressMenu: true,
							suppressMovable: true,
							width: 60,
							hide: true,
						},
						...headers.map((key) => ({
							field: key,
							headerName: getHeaderLabel(key),
							filter: stringHeaderTypes.includes(WELL_HEADER_TYPES[key].type) ? TextFilter : null,
							hide: !visibleSet.has(key),
							suppressAndOrCondition: true,
							enableRowGroup: true,
							editable: (params) => {
								if (params.node.data.isGroupCase) {
									return HEADERS_WITH_TYPE_STRING.includes(key);
								}
								return false;
							},
							valueFormatter: HeaderValueFormatter,
							cellRenderer: HeaderCellRenderer,
							headerComponent: WellHeaderComponent,
							filterParams: {
								showIcon: true,
								colId: key,
							},
							...(() => {
								const index = defaultSorting.current?.findIndex(({ field }) => key === field);
								if (index === -1 || index == null) return {};
								return {
									sort: defaultSorting.current[index].direction === 1 ? 'asc' : 'desc',
									sortIndex: index,
								};
							})(),
						})),
					],
				},
				{
					headerName: 'Assumptions',
					children: assumptions.map((key) => {
						return {
							headerName: getAssumptionLabel(key),
							field: key,
							filter: null,
							valueFormatter: AssumptionValueFormatter,
							cellRenderer: AssumptionCellRenderer,
							editable:
								canUpdateScenario &&
								((params) => {
									if (params.node.data.isGroupCase) {
										return ASSUMPTION_FOR_GROUPS.includes(key as AssumptionKey);
									}
									return true;
								}),
							cellEditor: AssumptionCellEditor,
							headerComponent: AssumptionHeaderComponent,
							hide: !visibleSet.has(key),
							enableRowGroup: !NON_ECON_MODEL_KEYS.includes(key),
							sortable: !NON_ECON_MODEL_KEYS.includes(key),
						};
					}),
				},
			];

			// eslint-disable-next-line
		}, [headers, assumptions, showEcon, canUpdateScenario]);

		const fetch = useCallback(
			async (idsToFetch, headers) => {
				const result = await buildScenario(idsToFetch, headers);

				return result.map(({ _id, well, ...assumptions }) => ({
					...well,
					...assumptions,
					well: well?._id,
					_id,
				}));
			},
			[buildScenario]
		);

		const onCellValueChanged = useCallback(
			({ newValue, node, column, oldValue }) => {
				const colId = column.getColId();
				const resetValue = () => {
					node.setData({ ...node.data, [colId]: oldValue });
				};
				if (assumptions.includes(colId)) {
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
						const isGroupCase = node.data.isGroupCase;
						updateModel({
							assumptionKey: colId,
							assignmentId: node.id,
							value: isGroupCase ? newValue.model._id : newValue,
							isGroupCase,
						});
						return;
					}
					resetValue();
				}
				if (colId === 'econGroup') {
					if (newValue === REMOVE_ASSIGNMENT) {
						updateGroup({ assignment: node.data, value: null });
						return;
					}
					if (newValue) {
						updateGroup({ assignment: node.data, value: newValue });
						return;
					}
					resetValue();
				}
				if (node.data.isGroupCase && headers.includes(colId)) {
					updateEconGroupHeaders(node.data, colId, newValue);
				}
			},
			[assumptions, headers, removeAssignment, chooseModel, updateModel, updateGroup, updateEconGroupHeaders]
		);

		const sortContext: ISortContext = useMemo(
			() =>
				sorting.reduce((acc: ISortContext, { field, direction }, index) => {
					const sortDirection = (() => {
						if (direction === 1) return 'asc';
						if (direction === -1) return 'desc';
						return null;
					})();
					acc[field] = { sortDirection, sortIndex: index };
					return acc;
				}, {}),
			[sorting]
		);

		const runSingleEconomics = useCallback(() => {
			const node = agGridRef.current?.getFocusedNode();
			runSingleWellAssignmentEconomics(node.data);
		}, [runSingleWellAssignmentEconomics]);
		useHotkeyScope('scenario');
		useHotkey('shift+enter', 'scenario', () => {
			runSingleEconomics();
			return false;
		});

		const scrollCallbacksRef = useRef<Record<string, () => void>>({});

		const onBodyScroll = useCallback(() => {
			Object.values(scrollCallbacksRef.current).forEach((cb) => cb());
		}, []);

		const { onColumnMoved, onColumnRowGroupChanged, onGridReady } = useAgGridCache(
			ORDERED_HEADERS_AND_ASSUMPTIONS_STORAGE_KEY,
			SCENARIO_GRID_GROUPS_STORAGE_KEY
		);

		const theme = useTheme();

		const openEconGroupsRef = useRef<Record<string, boolean>>({});

		return (
			<LastRunIdContext.Provider value={lastRunId}>
				<SortContext.Provider value={sortContext}>
					<RequiredFieldsContext.Provider value={requiredFields}>
						<FilterContext.Provider
							// eslint-disable-next-line react/jsx-no-constructed-context-values -- TODO eslint fix later
							value={{
								filters,
								setFilters,
							}}
						>
							<ColumnsContext.Provider value={columns}>
								<AgGridSSRM
									ref={agGridRef}
									css={`
										.ag-header-cell-resize::after {
											height: 100% !important; // HACK: need more specificity
											top: 0 !important;
										}
									`}
									selection={selection}
									showSelection={showSelection}
									showCount={showCount}
									fetch={fetch}
									ids={assignmentIds}
									suppressRowDeselection
									immutableData={false}
									enableRangeSelection
									suppressClipboardPaste
									processCellForClipboard={(params) => {
										const key = params.column.getColId();
										const value = params.value;
										if (typeof value === 'string') return value;
										const [, name] = getModelData({ assumption: value, assumptionKey: key });
										return name;
									}}
									suppressContextMenu
									groupHeaderHeight={0}
									groupDisplayType='groupRows'
									groupRowRenderer={GroupRowRenderer}
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
													// suppressRowGroups: true,
													suppressValues: true,
													suppressPivots: true,
													suppressPivotMode: true,
													// suppressColumnFilter: true,
													// suppressColumnSelectAll: true,
													// suppressColumnExpandAll: true,
												},
											},
											{
												id: 'filters',
												labelDefault: 'Filters',
												labelKey: 'filters',
												iconKey: 'filter',
												toolPanel: 'agFiltersToolPanel',
											},
										],
									}}
									headerHeight={80}
									defaultColDef={useMemo(
										() => ({ sortable: true, filter: true, resizable: true, width: 200 }),
										[]
									)}
									visibleHeaders={visibleHeaders}
									columnDefs={columnDefs}
									rowModelType='serverSide'
									serverSideStoreType='partial'
									suppressRowClickSelection
									rowSelection='multiple'
									onCellValueChanged={onCellValueChanged}
									onBodyScroll={onBodyScroll}
									context={{
										canUpdateScenario,
										chooseLookupTable,
										chooseModel,
										chooseTCLookupTable,
										columns,
										handleCreateEconGroup,
										handleUpdateEconGroup,
										econGroups,
										getAssumptionMenuItems,
										getQualifiersMenuItems,
										lookupTables,
										openForecastPreview,
										removeAssignment,
										runSingleWellAssignmentEconomics,
										scrollCallbacks: scrollCallbacksRef.current,
										showWellDialog,
										showGroupDialog,
										tcLookupTables,
										openEconGroups: openEconGroupsRef.current,
									}}
									onVisibleHeadersChange={onVisibleHeadersChange}
									groupBy={useCallbackRef((value, key) => {
										if (assumptions.includes(key)) {
											const modelData = getModelData({ assumption: value, assumptionKey: key });
											return modelData[0];
										}
										if (key === 'econGroup') return value?._id || null;
										return value;
									})}
									suppressKeyboardEvent={(params) => {
										const shouldRunEconomics =
											params.event.key === ENTER_KEY && params.event.shiftKey;
										return shouldRunEconomics;
									}}
									onSortChanged={(event) => {
										const sortedColumns = event.columnApi
											.getColumnState()
											.filter(({ sort }) => sort);
										onSortChange(
											sortedColumns
												.sort((a, b) => (a?.sortIndex ?? 0) - (b?.sortIndex ?? 0))
												.map(({ colId, sort }) => ({
													field: colId.replace('ag-Grid-AutoColumn-', ''),
													direction: sort === 'asc' ? 1 : -1,
												}))
										);
									}}
									onGridReady={onGridReady}
									onColumnMoved={onColumnMoved}
									onColumnRowGroupChanged={onColumnRowGroupChanged}
									maintainColumnOrder
									getRowStyle={(params) => {
										if (params.data?.isGroupCase) {
											return {
												background: hexToRgba(theme.palette.primary.main, 0.15),
											};
										}
									}}
								/>
							</ColumnsContext.Provider>
						</FilterContext.Provider>
					</RequiredFieldsContext.Provider>
				</SortContext.Provider>
			</LastRunIdContext.Provider>
		);
	}
);
