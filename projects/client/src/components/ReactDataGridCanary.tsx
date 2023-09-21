import DataGrid, { DataGridProps } from 'react-data-grid-canary';
import styled, { css } from 'styled-components';

import { Box } from '@/components/v2';
import Checkbox from '@/components/v2/Checkbox';

const DATA_GRID_SELECT_COLUMN = 'select-row';
const DATA_GRID_INDEX_COLUMN = '__INPT_INDEX_KEY';

const reactDataGridCanaryStyles = css`
	width: 100%;
	height: 100%;
	.rdg-header-row,
	.rdg-row {
		--background-color: var(--background);
		background-color: var(--background);
		.rdg-cell {
			border-right: 2px solid var(--border-color);
			border-bottom: 2px solid var(--border-color);
			&.align-right {
				text-align: right;
			}
		}
	}
	&& {
		--background-color: var(--background);
		--color: inherit;
		--border-color: inherit;
		--row-selected-hover-background-color: inherit;
	}
	overflow: scroll;
`;

const SelectButton = styled(Checkbox).attrs({ disableRipple: true })`
	.MuiIconButton-root {
		padding: 0;
	}
	// HACK for centering the checkboxes
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
`;

export const ReactDataGridCanarySelectionColumn = {
	key: DATA_GRID_SELECT_COLUMN,
	name: '',
	width: 36,
	maxWidth: 36,
	frozen: true,
	headerRenderer(props) {
		const { allRowsSelected, onAllRowsSelectionChange } = props;
		return <SelectButton onClick={() => onAllRowsSelectionChange(!allRowsSelected)} checked={allRowsSelected} />;
	},
	formatter(props) {
		const { isRowSelected, onRowSelectionChange } = props;
		return (
			<SelectButton
				onClick={(ev) => {
					onRowSelectionChange(!isRowSelected);
					ev.stopPropagation();
				}}
				checked={isRowSelected}
			/>
		);
	},
	groupFormatter(props) {
		const { isRowSelected, onRowSelectionChange } = props;
		return (
			<SelectButton
				onClick={(ev) => {
					onRowSelectionChange(!isRowSelected);
					ev.stopPropagation();
				}}
				checked={isRowSelected}
			/>
		);
	},
};

export const ReactDataGridCanaryIndexColumn = {
	key: DATA_GRID_INDEX_COLUMN,
	name: '#',
	width: 36,
	minWidth: 36,
	frozen: true,
	headerRenderer(props) {
		const {
			column: { name },
		} = props;
		return (
			<Box display='flex' justifyContent='center'>
				{name}
			</Box>
		);
	},
	formatter(props) {
		const {
			row: { [DATA_GRID_INDEX_COLUMN]: index },
		} = props;
		return (
			<Box display='flex' justifyContent='center'>
				{index + 1}
			</Box>
		);
	},
};

export function ReactDataGridCanary<R, SR = unknown>({ rows, ...props }: DataGridProps<R, SR>) {
	const _rows = rows?.map((row, index) => ({ [DATA_GRID_INDEX_COLUMN]: index, ...row }), [rows]);
	return <DataGrid<R, SR> css={reactDataGridCanaryStyles} {...props} rows={_rows} />;
}
