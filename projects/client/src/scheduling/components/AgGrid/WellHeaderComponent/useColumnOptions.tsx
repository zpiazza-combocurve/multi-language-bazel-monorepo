import { IHeaderParams } from 'ag-grid-community';

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
				props.columnApi.resetColumnState();
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
