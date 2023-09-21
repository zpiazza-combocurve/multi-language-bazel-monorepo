import { faChartBar, faGlobe, faLocation } from '@fortawesome/pro-regular-svg-icons';
import { ToggleButtonGroup } from '@material-ui/lab';
import {
	ColDef,
	IServerSideDatasource,
	IServerSideGetRowsParams,
	SelectionChangedEvent,
	SideBarDef,
	SortChangedEvent,
	SortModelItem,
} from 'ag-grid-community';
import {
	Dispatch,
	ForwardedRef,
	SetStateAction,
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';

import AgGrid, { AgGridRef, CHECKBOX_COLUMN_DEF, NUMBER_CELL_CLASS_NAME, getCountColumnDef } from '@/components/AgGrid';
import { FontAwesomeIcon } from '@/components/FontAwesomeIcon';
import { Selection } from '@/components/hooks/useSelection';
import { useLocalStorageState } from '@/components/hooks/useStorage';
import SelectedCount from '@/components/misc/SelectedCount';
import { Button, ToggleGroupButton, Typography } from '@/components/v2';
import IconButton from '@/components/v2/IconButton';
import { genericErrorAlert } from '@/helpers/alerts';
import { SCOPE_KEY, WELLS_COLLECTION_KEY, useWellHeaders } from '@/helpers/headers';
import { Filter, Vis1Filter } from '@/inpt-shared/filters/shared';
import { AgGridToMongoDbSortDirMap } from '@/inpt-shared/helpers/agGrid';
import { getSeparatedHeaders, isPCH } from '@/inpt-shared/project/project-custom-headers/shared';
import {
	WELL_HEADER_NUMBER_COLUMNS,
	getWellHeaderColumnType,
	getWellHeaderValueFormatter,
	projectCustomHeaderTemplate,
} from '@/manage-wells/WellsPage/TableView/CollectionTable/shared';
import { ExportMap } from '@/map/ExportMap';
import MapLayers from '@/map/MapLayers';
import { MapShortcutsFloater } from '@/map/MapShortcutsFloater';
import { HeaderCheckboxSelection } from '@/module-list/HeaderCheckboxSelection';

import { lightFilterWells } from '../api';
import { LightFilterWellsResponseModel } from '../types';
import WellFilterVis1 from '../well-filter-vis-1';
import styles from './new-well-filter.module.scss';

const CACHE_BLOCK_SIZE = 500;
const SCROLL_DEBOUNCE_TIME = 200;

const SELECTION_COL_ID = 'selection';
const COUNT_COL_ID = '#';
const INITIAL_SELECTED_HEADERS = ['api14', 'well_name', 'well_number', 'basin', 'state', 'county'];
const getSelectedHeadersLocalStorageKey = (projectId: Inpt.ObjectId<'project'> | undefined) =>
	`NEW_WELLS_FILTERING_SELECTED_HEADERS-${projectId ?? 'company'}`;

const MAX_WELLS_FOR_CHART_VIEW = 2000;

const agGridSidebar = {
	toolPanels: [
		{
			id: 'columns',
			labelDefault: 'Columns',
			labelKey: 'columns',
			iconKey: 'columns',
			toolPanel: 'agColumnsToolPanel',
			toolPanelParams: {
				suppressPivotMode: true,
				suppressRowGroups: true,
				suppressValues: true,
			},
		},
	],
} as SideBarDef;

const getSorting = (sortModel: SortModelItem[]) => {
	if (sortModel.length > 0) {
		return [
			{
				field: sortModel[0].colId,
				direction: AgGridToMongoDbSortDirMap[sortModel[0].sort] as 1 | -1,
			},
		];
	}

	return undefined;
};

const mapHeaderToAgGridColumn = (key: string, label: string, type: string | undefined, hide: boolean) => {
	const isProjCH = isPCH(key);

	return {
		field: key,
		headerName: label,
		type,
		filter: null,
		sortable: key !== SCOPE_KEY && key !== WELLS_COLLECTION_KEY,
		resizable: true,
		hide,
		headerComponentParams: !isProjCH ? undefined : { template: projectCustomHeaderTemplate },
		toolPanelClass: !isProjCH ? undefined : styles['with-pch-circle'],
	} as ColDef;
};

type ContentHeaderLeftProps = {
	total: number;
	selection: Selection<string>;
	onApplySelectionFilter: () => void;
	handleMainViewChange: (view?: 'vis1' | 'map') => void;
	mainView?: string;
};

export const ContentHeaderLeft = (props: ContentHeaderLeftProps) => {
	const { selection, total, onApplySelectionFilter, handleMainViewChange, mainView } = props;
	const applyDisabled = selection.selectedSet.size === 0 || selection.selectedSet.size === total;
	const canViewBarChart = total < MAX_WELLS_FOR_CHART_VIEW;

	useEffect(() => {
		if (total >= MAX_WELLS_FOR_CHART_VIEW && mainView === 'vis1') {
			handleMainViewChange(undefined);
		}
	}, [total, handleMainViewChange, mainView]);

	return (
		<div className={styles['content-header']}>
			<Typography className={styles['content-header-title']}>Filtered Wells</Typography>
			<SelectedCount count={selection.selectedSet.size} total={total} withLabel={false} />
			<ToggleButtonGroup
				value={mainView}
				exclusive
				className={styles['view-button-group']}
				onChange={(event, value) => {
					handleMainViewChange(value);
				}}
			>
				<ToggleGroupButton TooltipProps={{ title: 'Map' }} value='map'>
					<FontAwesomeIcon
						css={`
							color: white;
						`}
						icon={faGlobe}
						size='xs'
					/>
				</ToggleGroupButton>
				<ToggleGroupButton
					TooltipProps={{
						title: (!canViewBarChart && 'Filtered wells total must be less than 2000') || 'Bar Chart',
					}}
					value='vis1'
					disabled={!canViewBarChart}
					// hacky way to allow tooltip while button is disabled
					css={`
						&.Mui-disabled {
							pointer-events: auto;
						}
						${!canViewBarChart ? `&:hover {background-color: unset}` : ''}
					`}
				>
					<FontAwesomeIcon icon={faChartBar} css={!canViewBarChart ? '' : 'color: white'} size='xs' />
				</ToggleGroupButton>
			</ToggleButtonGroup>
			<Button
				disabled={applyDisabled}
				className={styles['apply-selection-button']}
				color='secondary'
				variant='text'
				onClick={onApplySelectionFilter}
			>
				Apply
			</Button>
		</div>
	);
};

export const ContentHeaderRight = ({ handleCenterMap, mapLayersRef }) => {
	return (
		<div>
			<MapShortcutsFloater />
			<IconButton onClick={handleCenterMap} tooltipTitle='Center on Wells' size='medium'>
				{faLocation}
			</IconButton>
			<ExportMap mapLayersRef={mapLayersRef} size='medium' />
		</div>
	);
};

export interface ContentProps {
	projectId?: Inpt.ObjectId<'project'>;
	wells?: string[] | 'ALL_WELLS';
	existingWells: Inpt.ObjectId<'well'>[];
	appliedFilters: Filter[];
	setFilterResult: Dispatch<SetStateAction<LightFilterWellsResponseModel>>;
	selection: Selection<string>;
	onSortChanged: (event: SortChangedEvent) => void;
	setGeoFilter: (newFilter) => void;
	handleCenterMap: () => void;
	showMap: boolean;
	mapLayersRef;
	mapFeatures;
	project:
		| Assign<
				Inpt.Project,
				{
					createdBy: Inpt.User;
				}
		  >
		| undefined;
	mainView?: 'vis1' | 'map';
	vis1Headers: string[];
	vis1Filters: Vis1Filter[];
	setVis1Filters: Dispatch<SetStateAction<Vis1Filter[]>>;
	applyVis1Filter: (wells, header, value, id) => void;
	deleteVis1Filter: (id) => void;
	wellHeaders?: Record<string, string>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	wellHeaderTypes?: Record<string, any>;
}

export interface ContentRef {
	deselectAllRows: () => void;
}

export const Content = forwardRef<ContentRef, ContentProps>((props: ContentProps, ref: ForwardedRef<ContentRef>) => {
	const {
		projectId,
		project,
		existingWells,
		appliedFilters,
		selection,
		setFilterResult,
		wells,
		onSortChanged,
		setGeoFilter,
		showMap,
		mapFeatures,
		mapLayersRef,
		handleCenterMap,
		mainView,
		vis1Headers,
		vis1Filters,
		setVis1Filters,
		applyVis1Filter,
		deleteVis1Filter,
		wellHeaders,
		wellHeaderTypes,
	} = props;

	const [selectedHeaders, setSelectedHeaders] = useLocalStorageState(
		getSelectedHeadersLocalStorageKey(projectId),
		INITIAL_SELECTED_HEADERS
	);

	const [isTableVisible, setIsTableVisible] = useState(true);

	const agGridRef = useRef<AgGridRef>(null);

	const { wellHeadersLabels, wellHeadersTypes, fetchingPCHsData } = useWellHeaders({
		enableProjectCustomHeaders: !!projectId,
		enableScopeHeader: !!projectId,
	});

	const disableToggleAll = !wells || wells === 'ALL_WELLS';

	const columnDefs = useMemo(() => {
		return fetchingPCHsData
			? []
			: [
					{
						...CHECKBOX_COLUMN_DEF,
						initialPinned: 'left',
						colId: SELECTION_COL_ID,
						headerName: disableToggleAll ? '' : 'Selection',
						headerCheckboxSelection: false,
						headerComponent: disableToggleAll ? undefined : HeaderCheckboxSelection,
						headerComponentParams: {
							selection,
						},
					} as ColDef,
					{
						...getCountColumnDef(),
						initialPinned: 'left',
						colId: COUNT_COL_ID,
						suppressMovable: true,
						lockVisible: true,
						lockPosition: true,
					} as ColDef,
					...selectedHeaders.map((key) =>
						mapHeaderToAgGridColumn(
							key,
							wellHeadersLabels[key],
							getWellHeaderColumnType(key, wellHeadersTypes),
							false
						)
					),
					...Object.entries(wellHeadersLabels)
						.filter(([key]) => !selectedHeaders.includes(key))
						.map(([key, label]) =>
							mapHeaderToAgGridColumn(key, label, getWellHeaderColumnType(key, wellHeadersTypes), true)
						),
			  ];
	}, [fetchingPCHsData, disableToggleAll, selection, selectedHeaders, wellHeadersLabels, wellHeadersTypes]);

	const serverSideDatasource = useMemo(
		(): IServerSideDatasource => ({
			getRows: async (params: IServerSideGetRowsParams) => {
				const { regularHeaders, projectCustomHeaders } = getSeparatedHeaders(selectedHeaders);
				const sorting = getSorting(params.request.sortModel);

				try {
					const filterResult = await lightFilterWells(
						projectId,
						appliedFilters,
						regularHeaders,
						projectCustomHeaders,
						existingWells,
						sorting,
						params.request.startRow,
						(params.request.endRow ?? 0) - (params.request.startRow ?? 0),
						true
					);

					setFilterResult(filterResult);

					params.success({
						rowData: filterResult.viewPage,
						rowCount: filterResult.totalCount,
					});
				} catch (err) {
					params.fail();
					genericErrorAlert(err);
				}
			},
		}),
		[existingWells, appliedFilters, projectId, selectedHeaders, setFilterResult]
	);

	const handleOnSelectionChanged = useCallback(
		(event: SelectionChangedEvent) => {
			selection.setSelectedSet(event.api.getSelectedNodes().map((rowNode) => rowNode.data._id));
		},
		[selection]
	);

	useEffect(() => {
		agGridRef.current?.api?.forEachNode((rowNode) => {
			if (rowNode.data && selection) {
				rowNode.setSelected(selection.isSelected(rowNode.data._id), false, true);
			}
		});
	}, [selection]);

	useImperativeHandle(ref, () => ({
		deselectAllRows: () => {
			agGridRef.current?.api?.forEachNode((rowNode) => {
				if (rowNode.data && selection) {
					rowNode.setSelected(false, false, true);
				}
			});
		},
	}));

	const getRowId = useCallback((params) => params.data._id, []);

	const defaultColDef = useMemo(
		(): ColDef => ({
			editable: false,
			menuTabs: ['generalMenuTab'],
			valueFormatter: getWellHeaderValueFormatter(wellHeadersTypes),
			cellClassRules: {
				[NUMBER_CELL_CLASS_NAME]: (params) => WELL_HEADER_NUMBER_COLUMNS.includes(params.colDef.type as string),
			},
		}),
		[wellHeadersTypes]
	);

	useEffect(() => {
		if (!showMap && !isTableVisible) {
			setIsTableVisible(true);
		}
	}, [showMap, isTableVisible, setIsTableVisible]);

	useEffect(() => {
		if (showMap) {
			handleCenterMap();
		}
	}, [showMap, handleCenterMap]);

	const handleVis1Changes = (changes: { allSelected?: boolean; vis1Filters?; selectedWells? }) => {
		if (changes?.vis1Filters) {
			setVis1Filters(vis1Filters);
		}
	};

	const changeVis1Filters = (vis1) => {
		setVis1Filters(vis1);
	};

	return (
		<>
			{showMap && (
				<MapLayers
					ref={mapLayersRef}
					css={{ height: isTableVisible ? '50%' : '90%', marginBottom: '0.5rem' }}
					mapVisible={showMap}
					setGeoFilter={setGeoFilter}
					mapFeatures={mapFeatures}
					appliedFilters={appliedFilters}
					altProject={project}
					showDraw
					allowShowingMapSettings
				/>
			)}
			{mainView === 'vis1' && (
				<WellFilterVis1
					css={{ height: isTableVisible ? '75% !important' : '90%', marginBottom: '0.5rem' }}
					wellHeaderTypes={wellHeaderTypes}
					project={project}
					mainView={mainView}
					wellHeaders={wellHeaders}
					vis1Headers={vis1Headers}
					vis1Filters={vis1Filters}
					appliedFilters={appliedFilters}
					applyVis1Filter={applyVis1Filter}
					deleteVis1Filter={deleteVis1Filter}
					handleChange={handleVis1Changes}
					changeVis1Filters={changeVis1Filters}
				/>
			)}
			<div
				css={`
					height: ${isTableVisible ? (showMap || mainView === 'vis1' ? '45%' : '100%') : 'unset'};
				`}
			>
				{showMap && (
					<Button
						css={`
							margin-bottom: 0.5rem;
						`}
						onClick={() => setIsTableVisible((prev) => !prev)}
					>
						{isTableVisible ? 'Hide Table' : 'Show Table'}
					</Button>
				)}
				{isTableVisible && (
					<AgGrid
						css={{ height: showMap ? '90%' : '100%' }}
						ref={agGridRef}
						columnDefs={columnDefs}
						getRowId={getRowId}
						rowModelType='serverSide'
						serverSideStoreType='partial'
						cacheBlockSize={CACHE_BLOCK_SIZE}
						blockLoadDebounceMillis={SCROLL_DEBOUNCE_TIME}
						serverSideDatasource={serverSideDatasource}
						sideBar={agGridSidebar}
						rowSelection='multiple'
						suppressRowClickSelection
						suppressMultiSort
						suppressExcelExport
						suppressCsvExport
						defaultColDef={defaultColDef}
						columnTypes={{
							// to not have warnings in the console
							string: {},
							'multi-select': {},
							date: {},
							boolean: {},
							number: {},
							percent: {},
							integer: {},
							'precise-number': {},
						}}
						onSelectionChanged={handleOnSelectionChanged}
						onSortChanged={onSortChanged}
						onDisplayedColumnsChanged={(params) => {
							if (params.columnApi.getAllDisplayedColumns().length > 0) {
								setSelectedHeaders(
									params.columnApi
										.getAllDisplayedColumns()
										.map((column) => column.getColId())
										.filter((key) => key !== SELECTION_COL_ID && key !== COUNT_COL_ID)
								);
							}
						}}
					/>
				)}
			</div>
		</>
	);
});
