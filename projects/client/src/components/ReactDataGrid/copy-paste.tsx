/** @file Adds Copy/paste functionality */
import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { ReactDataGridProps } from 'react-data-grid';

import { useCallbackRef } from '@/components/hooks';

function useEventListener(element, name, handler) {
	const handlerRef = useCallbackRef(handler);
	useEffect(() => {
		element.addEventListener(name, handlerRef);

		return () => element.removeEventListener(name, handlerRef);
	}, [element, name, handlerRef]);
}

const defaultParsePaste = (text) => text.split(/\r\n|\n|\r/).map((row) => row.split('\t'));
const defaultValueFormat = (value) => value;
const defaultValueParse = (value) => value;
const defaultValueValidate = () => true;

export interface WithCellEditing extends Omit<ReactDataGridProps, 'columns'> {
	allowCopyPaste?: boolean;
	onUpdateRows?;
	parsePaste?;
	columns: (ReactDataGridProps['columns'][0] & {
		valueValidate?;
		valueParse?;
		valueFormat?;
	})[];
}

function useCellEditing({ columns, rowGetter, parsePaste = defaultParsePaste, onUpdateRows }: WithCellEditing) {
	const [cellSelection, setCellSelection] = useState<{
		topLeft: null | { rowIdx; colIdx };
		bottomRight: null | { rowIdx; colIdx };
	}>({
		topLeft: null,
		bottomRight: null,
	});

	const handleSelectionComplete = useCallback(
		({ topLeft, bottomRight }) => {
			setCellSelection((p) => ({
				...p,
				topLeft: {
					rowIdx: topLeft.rowIdx,
					colIdx: topLeft.idx,
				},
				bottomRight: {
					rowIdx: bottomRight.rowIdx,
					colIdx: bottomRight.idx,
				},
			}));
		},
		[setCellSelection]
	);

	useEventListener(window, 'paste', (event) => {
		event.preventDefault();
		const { topLeft } = cellSelection;

		if (!topLeft) {
			return;
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const newRows = [] as any[];
		const pasteData = parsePaste(event.clipboardData.getData('text/plain'));

		pasteData.forEach((row, rowIndex) => {
			const rowData = {};
			// Merge the values from pasting and the keys from the columns
			columns.slice(topLeft.colIdx, topLeft.colIdx + row.length).forEach((col, j) => {
				// Create the key-value pair for the row
				if (col.editable) {
					const validate = col.valueValidate || defaultValueValidate;
					const parse = col.valueParse || defaultValueParse;
					const parsedValue = parse(row[j]);
					const currentRow = rowGetter(topLeft.rowIdx + rowIndex);
					const currentValue = currentRow ? currentRow[col.key] : null;
					rowData[col.key] = validate(parsedValue) ? parsedValue : currentValue;
				}
			});
			// Push the new row to the changes
			newRows.push(rowData);
		});
		onUpdateRows?.(topLeft.rowIdx, newRows);
	});

	useEventListener(window, 'copy', (event) => {
		event.preventDefault();
		const { topLeft, bottomRight } = cellSelection;

		if (!topLeft || !bottomRight) {
			return;
		}

		// Loop through each row
		const text = _.range(topLeft.rowIdx, bottomRight.rowIdx + 1)
			.map(
				// Loop through each column
				(rowIdx) =>
					columns
						.slice(topLeft.colIdx, bottomRight.colIdx + 1)
						.map(
							// Grab the row values and make a text string
							(col) => {
								const formatValue = col.valueFormat || defaultValueFormat;
								return formatValue(rowGetter(rowIdx)[col.key]);
							}
						)
						.join('\t')
			)
			.join('\n');
		event.clipboardData.setData('text/plain', text);
	});

	return { cellRangeSelection: { onComplete: handleSelectionComplete } };
}

export default [(props: WithCellEditing) => !!props.allowCopyPaste, useCellEditing] as const;
