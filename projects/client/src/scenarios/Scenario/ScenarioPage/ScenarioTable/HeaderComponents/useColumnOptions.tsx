import { IHeaderParams } from 'ag-grid-community';

import { INITIAL_ASSUMPTIONS, INITIAL_HEADERS, allAssumptionKeys, allHeaderKeys } from '@/scenarios/shared';

const EXTRA_COLUMNS = ['selection', '####', 'econ-run', 'index', 'econGroup']; // TODO: get from table component

export function useColumnOptions(props: IHeaderParams) {
	const colId = props.column.getColId();
	const colDef = props.column.getColDef();
	const { enableRowGroup } = colDef;

	const pinMenuItem = {
		label: 'Pin',
		children: [
			{
				label: 'Pin Left',
				onClick: () => {
					props.columnApi.applyColumnState({ state: [{ colId, pinned: 'left' }] });
				},
			},
			{
				label: 'Pin Right',
				onClick: () => {
					props.columnApi.applyColumnState({ state: [{ colId, pinned: 'right' }] });
				},
			},
			{
				label: 'No Pin',
				onClick: () => {
					props.columnApi.applyColumnState({ state: [{ colId, pinned: false }] });
				},
			},
		],
	};

	const autoSizeMenuItems = [
		{
			label: 'Auto Size This Column',
			onClick: () => {
				props.columnApi.autoSizeColumn(colId, true);
			},
		},
		{
			label: 'Auto Size All Columns',
			onClick: () => {
				props.columnApi.autoSizeAllColumns(true);
			},
		},
		{
			label: 'Reset Columns',
			onClick: () => {
				const extraColumnsSet = new Set(
					props.columnApi.getColumnState().map(({ colId, hide }) => (hide ? null : colId))
				);
				const extraColumns = EXTRA_COLUMNS.filter((colId) => extraColumnsSet.has(colId));
				const defaultVisibleColumnsSet = new Set([...extraColumns, ...INITIAL_HEADERS, ...INITIAL_ASSUMPTIONS]);

				props.columnApi.resetColumnState();
				props.columnApi.applyColumnState({
					state: [...EXTRA_COLUMNS, ...allHeaderKeys, ...allAssumptionKeys].map((colId) => ({
						colId,
						hide: !defaultVisibleColumnsSet.has(colId),
					})),
					applyOrder: true,
				});
			},
		},
	];

	const groupMenuItems =
		enableRowGroup && colId !== 'emission'
			? [
					{
						label: 'Aggregate by Header',
						onClick: () => {
							props.columnApi.applyColumnState({ state: [{ colId, rowGroup: true }] });
						},
					},
					{
						label: 'Remove Aggregation',
						onClick: () => {
							props.columnApi.applyColumnState({ state: [{ colId, rowGroup: false }] });
						},
					},
			  ]
			: null;

	return { pinMenuItem, autoSizeMenuItems, groupMenuItems };
}
