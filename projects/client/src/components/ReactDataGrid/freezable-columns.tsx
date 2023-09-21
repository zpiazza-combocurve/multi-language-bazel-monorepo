/**
 * @file Extends Data grid with freezable columns
 * @note this will make column.headerRenderer prop unusable
 */
import { faThumbtack } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { useMemo, useState } from 'react';
import { Column, ReactDataGridProps } from 'react-data-grid';
import styled from 'styled-components';

import { useSet } from '@/components/hooks';
import { IconButton } from '@/components/v2';

export interface WithFreezableColumnsProps {
	freezableColumns?: boolean;
	columns: (Column & { locked?: boolean })[];
}

const CELL_PADDING = 8 * 2;

const HoverButton = styled(IconButton)`
	&.MuiIconButton-root {
		padding: 0;
	}
`;

function FreezableColumn({ column, onToggleFrozen }: { column: Column; onToggleFrozen: (key: string) => void }) {
	return (
		<div
			css={`
				display: flex;
				&:not(:hover) {
					[data-show-on-hover='true'] {
						display: none;
					}
				}
			`}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			style={{ width: column.width! - CELL_PADDING }}
		>
			<span
				css={`
					flex: 1 1 auto;
					text-overflow: ellipsis;
					white-space: nowrap;
					overflow: hidden;
				`}
			>
				{column.name}
			</span>
			<div css='flex-grow: 1;' />
			<HoverButton size='small' onClick={() => onToggleFrozen(column.key)} data-show-on-hover={!column.frozen}>
				{faThumbtack}
			</HoverButton>
		</div>
	);
}

export default [
	({ freezableColumns }: WithFreezableColumnsProps) => !!freezableColumns,
	({ columns: initialColumns }: Assign<ReactDataGridProps, WithFreezableColumnsProps>) => {
		const [initialFrozen] = useState(() => initialColumns.filter(({ frozen }) => frozen).map(({ key }) => key));

		const { set: frozenColumns, toggle: toggleFrozen } = useSet(initialFrozen);

		const columns = useMemo((): Column[] => {
			const [frozen, notFrozen] = _.partition(initialColumns, (col) => frozenColumns.has(col.key));
			const freezableHeaderRenderer = ({ column }) => (
				<FreezableColumn column={column} onToggleFrozen={toggleFrozen} />
			);
			return [...frozen, ...notFrozen].map((columnData) => ({
				...columnData,
				frozen: frozenColumns.has(columnData.key),
				headerRenderer: columnData.locked ? columnData.headerRenderer : freezableHeaderRenderer,
			}));
		}, [initialColumns, frozenColumns, toggleFrozen]);

		return { columns };
	},
] as const;
