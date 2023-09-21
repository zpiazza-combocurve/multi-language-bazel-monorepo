/** @file Extends Data grid with selection capabilities */
import { useCallback, useMemo } from 'react';
import { ReactDataGridProps } from 'react-data-grid';
import styled from 'styled-components';

import { Selection } from '@/components/hooks/useSelection';
import { Checkbox } from '@/components/v2';
import { counter } from '@/helpers/Counter';

import { RowKey, useRowKeyGetter } from './shared';

const SELECTION_COLUMN = '_inpt_selection';

const SelectButton = styled(Checkbox).attrs({ disableRipple: true })`
	&.MuiIconButton-root {
		padding: 0;
	}
	// HACK for centering the checkboxes
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
`;

export interface WithSelectionProps extends ReactDataGridProps {
	selection?: Selection;
	rowKey?: RowKey;
	disableSelectionKey?: RowKey;
}

export default [
	({ selection }: WithSelectionProps) => !!selection,
	({ selection, rowKey, columns, rowGetter, rowsCount, disableSelectionKey }: WithSelectionProps) => {
		const getRowKey = useRowKeyGetter(rowKey);
		const getDisableSelectionKey = useRowKeyGetter(disableSelectionKey);
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const { allSelected, toggleAll, toggle, isSelected } = selection!;

		const columnsWithSelection = useMemo((): ReactDataGridProps['columns'] => {
			if (!getRowKey) {
				// TODO send warning
				return columns;
			}
			return [
				{
					key: SELECTION_COLUMN,
					name: '',
					frozen: true,
					headerRenderer: () => <SelectButton checked={allSelected} onClick={toggleAll} />,
					width: 36,
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
					// @ts-expect-error
					locked: true,
					formatter: ({ row }) =>
						getDisableSelectionKey?.(row) ? null : (
							<SelectButton checked={!!row[SELECTION_COLUMN]} onClick={() => toggle(getRowKey(row))} />
						),
					[SELECTION_COLUMN]: counter.nextId(SELECTION_COLUMN), // adding a field here makes it to actually rerender
				},
				...columns,
			];
		}, [columns, allSelected, toggleAll, toggle, getRowKey, getDisableSelectionKey]);

		const rowGetterWithSelection = useCallback(
			(idx) => {
				if (!isSelected || !getRowKey) {
					return rowGetter(idx);
				}
				const value = rowGetter(idx);
				return {
					...value,
					[SELECTION_COLUMN]: isSelected(getRowKey(value)),
				};
			},
			[isSelected, getRowKey, rowGetter]
		);

		return { rowsCount, rowGetter: rowGetterWithSelection, columns: columnsWithSelection };
	},
] as const;
