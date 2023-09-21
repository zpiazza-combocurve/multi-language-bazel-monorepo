import { faArrowDown, faArrowUp } from '@fortawesome/pro-regular-svg-icons';
import { ColumnState, IHeaderParams } from 'ag-grid-community';
import { createContext, useContext } from 'react';

import { Icon } from '@/components/v2';

export interface ISortContext {
	[key: string]: { sortDirection?: 'asc' | 'desc' | null; sortIndex?: number | null };
}
export const SortContext = createContext<ISortContext>({});

const getNextColumnDirection = (direction) => {
	if (!direction) return 'asc';
	if (direction === 'asc') return 'desc';
	return null;
};

export function useSorting(props: IHeaderParams) {
	const colId = props.column.getColId();
	const colDef = props.column.getColDef();

	const { [colId]: sortContext } = useContext(SortContext);
	const { sortDirection, sortIndex } = sortContext ?? {};
	const sortedColumns = props.columnApi.getColumnState().filter(({ sort }) => sort);

	// const sortDirection =

	const sortDirectionIndicator = sortDirection && (
		<Icon
			css={`
				font-size: 1rem;
			`}
			fontSize='small'
		>
			{sortDirection === 'asc' ? faArrowUp : faArrowDown}
		</Icon>
	);

	const sortIndexIndicator = sortedColumns.length > 1 && <span>{sortIndex}</span>;

	const { sortable } = colDef;

	const onSortChange = (event: React.MouseEvent<HTMLElement>) => {
		const sortColumnDirection = props.column.getSort();

		const shiftPressed = event.shiftKey;

		const state: ColumnState[] = (() => {
			const nextSortDirection = getNextColumnDirection(sortColumnDirection);
			const sortIndex = props.column.getSortIndex() ?? 0;
			if (!shiftPressed) return [{ colId, sort: nextSortDirection }];
			const sortedColumns =
				props.columnApi.getColumnState().filter(({ sort, colId: _colId }) => sort && _colId !== colId) || [];
			return [
				...sortedColumns.map((column) => {
					const columnIndex = column.sortIndex;
					if (columnIndex == null) return column;
					return {
						...column,
						sortIndex: columnIndex < sortIndex ? columnIndex : columnIndex - 1,
					};
				}),
				{ colId, sort: nextSortDirection, sortIndex: sortedColumns.length },
			];
		})();

		props.columnApi.applyColumnState({
			state,
			defaultState: { sort: null, sortIndex: null },
		});
	};

	return { sortDirectionIndicator, sortIndexIndicator, onSortChange: sortable ? onSortChange : undefined, sortable };
}
