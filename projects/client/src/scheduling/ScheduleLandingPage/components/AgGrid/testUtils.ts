import { convertDateToIdx } from '@combocurve/forecast/helpers';
import { within } from '@testing-library/react';

import { yearsToIndex } from '@/helpers/date';

export const createAvailability = (startIndex = convertDateToIdx(new Date().setHours(0))) => ({
	start: startIndex,
	end: startIndex + yearsToIndex(200),
});

export const dateTimeToDateStr = (date) => {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	return `${month}/${day}/${year}`;
};

export const getPinnedRows = (container: HTMLElement, pinnedSide: 'left' | 'right') => {
	return container.querySelector(
		`[role=grid] .ag-body-viewport > .ag-pinned-${pinnedSide}-cols-container`
	) as HTMLElement;
};

export const getAllRows = (container: HTMLElement) => {
	return container.querySelector(
		'[role=grid] .ag-body-viewport > .ag-center-cols-clipper > .ag-center-cols-viewport > [role=rowgroup]'
	) as HTMLElement;
};

export const getRowByIndex = (rows: HTMLElement, index: number) => {
	return rows.querySelector(`[row-index="${index}"]`) as HTMLElement;
};

export const getColumn = (row: HTMLElement, column: string) => {
	return row.querySelector(`[col-id="${column}"]`) as HTMLElement;
};

export const assertColumnValue = (row: HTMLElement, column: string, value: string) => {
	expect(within(getColumn(row, column)).getByText(value)).toBeInTheDocument();
};
