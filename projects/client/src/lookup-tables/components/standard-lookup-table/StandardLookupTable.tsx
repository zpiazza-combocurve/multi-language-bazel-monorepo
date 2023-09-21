import 'react-datasheet/lib/react-datasheet.css';

import _ from 'lodash-es';
import { useCallback, useMemo } from 'react';
import ReactDataSheet from 'react-datasheet';
import styled from 'styled-components';

import { theme } from '@/helpers/styled';
import { MAX_FORECAST_NAME_VISIBLE_CHARACTERS } from '@/inpt-shared/constants';
import {
	RowRenderer,
	SheetRenderer,
	rowsFromRules,
} from '@/lookup-tables/components/standard-lookup-table/EditLookupTable/grid';
import { rulesFromGrid } from '@/lookup-tables/shared/utils';

const StyledDataSheet = styled(ReactDataSheet).attrs({
	className: 'react-datasheet',
})`
	&&&.data-grid {
		color: ${theme.textColor};
		background: ${theme.background};
		thead tr:nth-child(1) th:nth-child(1),
		tbody .cell {
			position: relative;
			&:nth-child(1) {
				z-index: 10;
				position: sticky;
				left: 0;
				.value-viewer {
					justify-content: center;
				}
			}
		}
		thead tr:nth-child(1) th:nth-child(1) {
			z-index: 15;
		}
		tr {
			background: ${theme.background};
			.cell {
				color: ${theme.textColor};
				&.read-only {
					background: ${theme.gridReadOnlyBackground};
				}
				max-width: 200px;
				white-space: nowrap;
				background: ${theme.background};
				border-color: ${theme.borderColor};
				border-width: 0;
				input.data-editor {
					color: ${theme.textColor};
				}
				.value-viewer,
				.data-editor {
					padding: 0.25rem;
					border: 1px solid ${theme.borderColor};
					width: 100%;
					height: 30px;
					display: flex;
					align-items: center;
					justify-content: flex-end;
				}
				&.selected {
					.data-editor,
					.value-viewer {
						border: 1px double rgb(33, 133, 208);
					}
				}
			}
		}
	}
`;

export const StandardLookupTable = ({ headerColumns, rules, setRules, assignmentKeys, assignmentColumns }) => {
	const setGrid = useCallback(
		(newGrid) => {
			const newRules = rulesFromGrid(newGrid, assignmentKeys);
			setRules(newRules);
		},
		[assignmentKeys, setRules]
	);

	const grid = useMemo(() => {
		return rowsFromRules(rules, headerColumns, assignmentColumns);
	}, [assignmentColumns, headerColumns, rules]);

	const valueRenderer = useCallback((cell) => {
		const { columnKey, value } = cell ?? {};
		if (columnKey === 'forecast') {
			return value ? _.truncate(value, { length: MAX_FORECAST_NAME_VISIBLE_CHARACTERS }) : '';
		}

		return value || '';
	}, []);

	const onCellsChanged = useCallback(
		(changes) => {
			const { col: firstColumn } = changes[0];
			const { col: lastColumn } = changes[changes.length - 1];
			const removeLastChange = firstColumn === lastColumn;
			const newGrid = grid.map((row) => [...row]);
			changes.forEach(({ row, col, value }, index) => {
				const canUpdate =
					changes.length === 1 || value !== '' || index !== changes.length - 1 || !removeLastChange; // HACK: weird issue with onCellsChanged from excel copy
				if (canUpdate) {
					newGrid[row][col] = { ...newGrid[row][col], value };
				}
			});
			setGrid(newGrid);
		},
		[grid, setGrid]
	);

	const sheetRenderer = useCallback(
		(props) => {
			return <SheetRenderer {...props} assignmentColumns={assignmentColumns} headerColumns={headerColumns} />;
		},
		[assignmentColumns, headerColumns]
	);

	const handleRowDrop = useCallback(
		(from, to) => {
			const newGrid = [...grid];
			newGrid[from] = grid[to];
			newGrid[to] = grid[from];
			setGrid(newGrid);
		},
		[grid, setGrid]
	);

	const renderRow = useCallback(
		(props) => {
			const {
				row,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				cells, // cells is omitted
				...rest
			} = props;
			return <RowRenderer rowIndex={row} onRowDrop={handleRowDrop} {...rest} />;
		},
		[handleRowDrop]
	);

	return (
		<StyledDataSheet
			data={grid || []}
			sheetRenderer={sheetRenderer}
			valueRenderer={valueRenderer}
			onCellsChanged={onCellsChanged}
			rowRenderer={renderRow}
		/>
	);
};
