import { useCallback, useMemo } from 'react';

import { AgGridProps, Editors, NEW_DESIGN_REWRITES } from '@/components/AgGrid';
import { AgGridSSRM, AgGridSSRMRef } from '@/components/AgGrid.ssrm';
import { FilterContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/WellHeaderComponent';
import { ISortContext, SortContext } from '@/scenarios/Scenario/ScenarioPage/ScenarioTable/HeaderComponents/useSorting';
import TextFilter from '@/scheduling/components/AgGrid/TextFilter';
import { WellHeaderComponent } from '@/scheduling/components/AgGrid/WellHeaderComponent/WellHeaderComponent';
import { EMPTY, LOADING } from '@/tables/Table/useAsyncRows';

import { SkeletonRenderer } from '../components/AgGrid/Renderers/SkeletonRenderer';
import { AssignmentsApi } from './api/AssignmentsApi';
import {
	CACHE_BLOCK_SIZE,
	DEFAULT_COLUMN_STATES,
	EDITABLE_COLUMNS,
	NPV_COLUMN,
	NULLABLE_VALUES,
	PRIORITY_COLUMN,
} from './consts';

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
	scheduleId: Inpt.ObjectId;
	columns: {
		key: string;
		title: string;
		width: number;
		frozen?: boolean;
		cellRenderer?: React.ReactElement;
		pinned?: 'left' | 'right';
	}[];
	wellIds: string[];
	currentSort: { field: string; direction: 'asc' | 'desc' };
	setCurrentSort: React.Dispatch<React.SetStateAction<{ field: string; direction: 'asc' | 'desc' }>>;
	filters: Record<string, string>;
	setHeaderFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
	previewData: { [key: string]: { npv: number } };
};

export const PreviewTableGrid = ({
	agGridRef,
	scheduleId,
	columns,
	wellIds,
	currentSort,
	setCurrentSort,
	filters,
	setHeaderFilters,
	previewData,
	...props
}: WellTableGridProps) => {
	const assignmentsApi = useMemo(() => new AssignmentsApi(scheduleId), [scheduleId]);

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
				priority: null,
				npv: null,
				...(previewData[assignment.well._id] ? previewData[assignment.well._id] : {}),
			}));
		},
		[assignmentsApi, previewData]
	);

	const columnDefs = useMemo(
		() =>
			columns.map((column) => {
				const nonWellHeaderColumn = ![...EDITABLE_COLUMNS, NPV_COLUMN].includes(column.key);
				return {
					field: column.key,
					headerName: column.title,
					width: column.width,
					lockPosition: column.frozen,
					pinned: column.pinned,
					editable: false,
					cellRenderer: column.cellRenderer || defaultCellRerender,
					filter: nonWellHeaderColumn ? TextFilter : undefined,
					filterParams: nonWellHeaderColumn ? { showIcon: true, colId: column.key } : {},
					headerComponent: nonWellHeaderColumn ? WellHeaderComponent : undefined,
				};
			}),
		[columns]
	);

	const visibleHeaders = columns.map(({ key }) => key);

	return (
		<SortContext.Provider value={sortContext}>
			<FilterContext.Provider value={filterContextValue}>
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
					context={{
						columns,
					}}
					groupHeaderHeight={0}
					groupDisplayType='groupRows'
					enableRangeSelection
					suppressRowClickSelection
					suppressRowDeselection
					rowSelection='multiple'
					suppressMultiRangeSelection
					headerHeight={80}
					fetch={fetch}
					ids={wellIds}
					visibleHeaders={visibleHeaders}
					rowModelType='serverSide'
					serverSideStoreType='partial'
					suppressCsvExport
					cacheBlockSize={CACHE_BLOCK_SIZE}
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
					processCellForClipboard={(params) => {
						if (NULLABLE_VALUES.includes(params.value)) return EMPTY;
						return params.value;
					}}
					{...props}
				/>
			</FilterContext.Provider>
		</SortContext.Provider>
	);
};
