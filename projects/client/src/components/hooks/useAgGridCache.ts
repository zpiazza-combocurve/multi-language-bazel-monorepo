import { ColumnMovedEvent, ColumnRowGroupChangedEvent, GridReadyEvent } from 'ag-grid-community';
import { useState } from 'react';

import { useLocalStorageState } from '@/components/hooks/useStorage';
import { assert } from '@/helpers/utilities';

/**
 * This hook is using for extending AgGrid functionality and applying caching for order of columns and grouping that was
 * previously applied.
 *
 * @example
 * 	const { onColumnMoved, onColumnRowGroupChanged, onGridReady } = useAgGridCache(
 * 		ORDERED_COLUMNS_STORAGE_KEY,
 * 		GROUPS_STORAGE_KEY
 * 	);
 *
 * 	<AgGrid
 * 		onColumnMoved={onColumnMoved}
 * 		onColumnRowGroupChanged={onColumnRowGroupChanged}
 * 		onGridReady={onGridReady}
 * 	/>;
 */

export const useAgGridCache = (columnOrderStorageKey: string, groupsStorageKey: string, isReadyToApplyCache = true) => {
	const [columnOrderList, setColumnOrderList] = useLocalStorageState<{ [key: string]: number }>(
		columnOrderStorageKey,
		{}
	);
	const [groupsList, setGroupsList] = useLocalStorageState<string[]>(groupsStorageKey, []);
	const [isGridInited, setIsGridInited] = useState(false);

	const onColumnMoved = (event: ColumnMovedEvent) => {
		if (isGridInited && isReadyToApplyCache) {
			const { columnApi } = event;

			const allColumnsKeys = columnApi.getAllGridColumns().map((column) => column.getColId());
			const allVisibleColumnsKeys = columnApi.getAllDisplayedColumns().map((column) => column.getColId());

			const orderListToSave = allVisibleColumnsKeys.reduce(
				(acc, visibleKey) => ({
					...acc,
					[visibleKey]: allColumnsKeys.findIndex((key) => key === visibleKey),
				}),
				{}
			);

			setColumnOrderList(orderListToSave);
		}
	};

	const onColumnRowGroupChanged = (event: ColumnRowGroupChangedEvent) => {
		if (isGridInited && isReadyToApplyCache) {
			const { columns } = event;

			assert(columns, 'Expect columns to be an array');

			setGroupsList(columns.map((column) => column.getColId()));
		}
	};

	const onGridReady = (event: GridReadyEvent) => {
		// Apply order of columns from local storage
		const orderedKeys = Object.keys(columnOrderList);
		if (orderedKeys.length > 0) {
			orderedKeys.forEach((key) => {
				event.columnApi.moveColumn(key, columnOrderList[key]);
			});
		}

		// Apply grouping of columns from local storage
		if (groupsList.length > 0) {
			event.columnApi.setRowGroupColumns(groupsList);
		}

		setIsGridInited(true);
	};

	return {
		onColumnMoved,
		onColumnRowGroupChanged,
		onGridReady,
		columnOrderList,
	};
};
