import { GridApi } from 'ag-grid-community';
import styled from 'styled-components';

import AgGrid, { NEW_DESIGN_REWRITES } from '@/components/AgGrid';

export const StyledAgGrid = styled(AgGrid)`
	width: 100%;
	height: 100%;

	.ag-checkbox {
		margin-right: 1rem;
	}
	${NEW_DESIGN_REWRITES}
`;

export const getIndexesFromCellRanges = (api: GridApi) => {
	const cellRanges = api.getCellRanges();
	if (!cellRanges) return;

	return cellRanges?.flatMap(({ startRow, endRow }) => {
		if (!(startRow && endRow)) return [];
		const [smallerIndex, higherIndex] = [startRow.rowIndex, endRow.rowIndex].sort((a, b) => a - b);
		return Array.from({ length: higherIndex - smallerIndex + 1 }, (_, i) => smallerIndex + i);
	});
};

export const handleSelectMultipleRows = (api: GridApi) => {
	const indexes = getIndexesFromCellRanges(api);
	if (!indexes) return;

	indexes.forEach((index) => {
		const node = api.getDisplayedRowAtIndex(index);
		if (node) node.setSelected(!node.isSelected());
	});
};
