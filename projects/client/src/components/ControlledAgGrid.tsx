import { GridApi } from 'ag-grid-community';
import _ from 'lodash';
import { useEffect, useRef } from 'react';

import AgGrid, { AgGridProps } from '@/components/AgGrid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export type FilterModel = Record<string, any>;

// export type SortModel = {
// 	colId: string | undefined;
// 	sort: string | null | undefined;
// }[];

export type ControlledAgGridProps = AgGridProps & {
	// sortModel?: SortModel;
	// onSortModelChanged?: (sortModel: SortModel) => void;
	filterModel?: FilterModel;
	onFilterModelChanged?: (filterModel: FilterModel) => void;
};

/**
 * AgGrid wrapper to have more control of the state. Controlled State:
 *
 * - Filter
 * - Sorting
 *
 * @example
 * 	import { useState } from 'react';
 * 	import ControlledAgGrid, { FilterModel, SortModel } from '@/components/ControlledAgGrid';
 *
 * 	const [sortModel, setSortModel] = useState<SortModel>([]);
 * 	const [filterModel, setFilterModel] = useState<FilterModel>({});
 *
 * 	<ControlledAgGrid
 * 		defaultColDef={{
 * 			sortable: true,
 * 			filter: 'agTextColumnFilter',
 * 		}}
 * 		filterModel={filterModel}
 * 		onFilterModelChanged={setFilterModel}
 * 		sortModel={sortModel}
 * 		onSortModelChanged={setSortModel}
 * 	/>;
 *
 * @note will override `onFilterChanged` and `onSortChange` ag grid props, but can be added if needed
 */
function ControlledAgGrid({
	// sortModel,
	// onSortModelChanged,
	filterModel,
	onFilterModelChanged,
	onGridReady,
	...agGridProps
}: ControlledAgGridProps) {
	const gridApiRef = useRef<GridApi>();

	// needs to be adjusted using the column state https://www.ag-grid.com/react-data-grid/column-state/
	// useEffect(() => {
	// 	if (!gridApiRef.current || !sortModel) {
	// 		return;
	// 	}
	// 	if (!_.isEqual(gridApiRef.current.getSortModel(), sortModel)) {
	// 		gridApiRef.current.setSortModel(sortModel);
	// 	}
	// }, [sortModel]);

	useEffect(() => {
		if (!gridApiRef.current || !filterModel) {
			return;
		}
		if (!_.isEqual(gridApiRef.current.getFilterModel(), filterModel)) {
			gridApiRef.current.setFilterModel(filterModel);
		}
	}, [filterModel]);

	return (
		<AgGrid
			{...agGridProps}
			onFilterChanged={(ev) => {
				onFilterModelChanged?.(ev.api.getFilterModel());
			}}
			// onSortChanged={(ev) => {
			// 	onSortModelChanged?.(ev.api.getSortModel());
			// }}
			onGridReady={(ev) => {
				gridApiRef.current = ev.api;
				return onGridReady?.(ev);
			}}
		/>
	);
}

export default ControlledAgGrid;
