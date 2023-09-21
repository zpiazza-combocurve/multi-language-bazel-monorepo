import { faSnowflake, faSort } from '@fortawesome/pro-regular-svg-icons';
import _ from 'lodash';
import { isValidElement, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { useSet } from '@/components/hooks';
import { FeatureIcons } from '@/helpers/features';
import { getHeaderValueDisplay } from '@/helpers/headers';
import { getProjectHeadersTypes } from '@/helpers/project-custom-headers';
import { excludeProps, ifProp, theme, unlessProp } from '@/helpers/styled';
import { formatValue as realFormatValue } from '@/helpers/utilities';
import { fields as WELL_HEADER_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import styles from '@/manage-wells/WellsPage/TableView/CollectionTable/HeadersTable.module.scss';

import Button from './Button';
import ReactDataGrid from './ReactDataGrid';
import { RowContentLoader } from './RowLoader';

function formatValue(value) {
	if (isValidElement(value)) {
		return value;
	}
	return realFormatValue(value);
}

// const INDEX_WIDTH = 40 + 14 * 2; // HACK: checkbox INDEX + cell padding
const ROW_LOADING = Symbol('WellTableRow Loading');
const MIN_COLUMN_WIDTH = 100;
const DEFAULT_COLUMN_WIDTH = 200;
const ROW_INDEX_ID = '__inpt_index';
const ROW_HEIGHT = 40;
const COMPACT_ROW_HEIGHT = 25;

const rightBorderStyles = css`
	border-right: 1px solid ${theme.borderColor};
`;

const TRANSITION_TIME = '200ms';

const cellStyles = css`
	background: ${theme.background};
	transition: background ${TRANSITION_TIME};
	color: inherit;
	border-bottom: 1px solid ${theme.borderColor};
`;

const ShowOnHover = styled.div`
	transition: opacity ${TRANSITION_TIME};
	opacity: 0;
	display: inline-flex;
	align-items: baseline;
`;

const DefaultCellRenderer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	height: 100%;
	padding: 0.5rem;
	transition: background ${TRANSITION_TIME};
	background: ${theme.background};
	&:hover ${ShowOnHover} {
		opacity: 1;
	}
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const Title = styled.span`
	flex: 1 1 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	display: flex;
	align-items: center;
`;

const Actions = styled.div`
	display: flex;
	align-items: baseline;
	flex: 0 0 auto;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

const DefaultHeaderRenderer = memo(
	({ id, name, canFreeze, frozen, action, freeze, canSort, sorted, sortDir, onSort, marked }) => {
		const handleFreeze = useCallback(() => {
			freeze(id);
		}, [freeze, id]);
		const freezeButton = canFreeze && <Button faIcon={faSnowflake} secondary small onClick={handleFreeze} />;

		const toggleSort = useCallback(
			(event) => {
				event.stopPropagation();
				onSort(id);
			},
			[id, onSort]
		);
		const sortIconDir = sortDir === 'asc' ? FeatureIcons.sortAsc : FeatureIcons.sortDesc;
		const sortButton = canSort && <Button small faIcon={sorted ? sortIconDir : faSort} onClick={toggleSort} />;
		return (
			<DefaultCellRenderer frozen={frozen}>
				<Title>
					{marked && <span className={styles['colored-circle']} />}
					{name}
				</Title>
				<Actions>
					{action}
					{sorted ? sortButton : <ShowOnHover>{sortButton}</ShowOnHover>}
					{frozen ? freezeButton : <ShowOnHover>{freezeButton}</ShowOnHover>}
				</Actions>
			</DefaultCellRenderer>
		);
	}
);

const NumberCellRenderer = styled(DefaultCellRenderer)`
	justify-content: center;
`;

const NumberCellFormatter = memo(({ value, title }) => <NumberCellRenderer title={title}>{value}</NumberCellRenderer>);

const DefaultCellFormatter = memo(({ value, title, loading }) => {
	const formattedValue = formatValue(value);
	return (
		<DefaultCellRenderer title={title || ''}>
			{loading ? <RowContentLoader width={100} /> : formattedValue}
		</DefaultCellRenderer>
	);
});

const StyledCell = styled.div.withConfig({
	shouldForwardProp: excludeProps(['width', 'height', 'frozen', 'left', 'lastFrozen', 'noAnimation']),
})`
	${cellStyles}
	${unlessProp(
		'noAnimation',
		`transition: height ${TRANSITION_TIME}, width ${TRANSITION_TIME}, background ${TRANSITION_TIME};`
	)}
	${ifProp('lastFrozen', rightBorderStyles)}
	${({ frozen, left }) =>
		frozen &&
		css`
			position: sticky;
			left: ${left || 0}px;
		`}
	${({ width, height }) => css`
		width: ${width}px;
		height: ${height}px;
	`}
	display: 'inline-block';
`;

const Cell = memo(({ formatter, loading, value, id, row, ...rest }) => {
	return <StyledCell {...rest}>{formatter({ loading, value, id, row })}</StyledCell>;
});

const opaqueColorSelection = ({ primary, secondary }) => {
	if (primary) {
		return theme.primaryColorOpaque;
	}
	if (secondary) {
		return theme.secondaryColorOpaque;
	}
	return theme.backgroundOpaque;
};

const StyledRow = styled.div`
	width: 100%;
	background: ${theme.background};
	transition: background ${TRANSITION_TIME};
	border-bottom: 1px solid ${theme.borderColor};
	&:hover {
		background: ${opaqueColorSelection};
		${DefaultCellRenderer} {
			background: ${opaqueColorSelection};
		}
	}
	${({ height }) => css`
		height: ${height}px;
	`}
	display: flex;
`;

const Row = memo(
	({ height, columns, row, colVisibleEndIdx, colVisibleStartIdx, lastFrozenColumnIndex, primary, secondary, id }) => {
		const widths = useMemo(() => {
			const result = [];
			columns.reduce((acumulator, { width }) => {
				result.push(acumulator);
				return acumulator + width;
			}, 0);
			return result;
		}, [columns]);
		const initialWidth = widths[colVisibleStartIdx] - widths[lastFrozenColumnIndex + 1];
		const frozenColumns = useMemo(() => {
			return columns.slice(0, lastFrozenColumnIndex + 1);
		}, [columns, lastFrozenColumnIndex]);
		const visibleColumns = useMemo(() => {
			return columns.slice(colVisibleStartIdx, colVisibleEndIdx + 1);
		}, [colVisibleEndIdx, colVisibleStartIdx, columns]);
		const fillerKey = `filler-cell-${id}`;
		const children = useMemo(() => {
			const newColumns = [
				...frozenColumns,
				{
					key: fillerKey,
					width: initialWidth,
					formatter: () => '',
				},
				...visibleColumns,
			];
			return newColumns.map(({ key, width, frozen, left, formatter }, columnIndex) => {
				return (
					<Cell
						key={key}
						{...{
							height,
							width,
							frozen,
							left: frozen && left,
							formatter,
							loading:
								(row[ROW_LOADING] && (row[key] === undefined || row[key] === null)) ||
								row[key] === ROW_LOADING,
							id,
							value: row[key],
							lastFrozen: lastFrozenColumnIndex === columnIndex,
							noAnimation: key === fillerKey,
							row,
						}}
					/>
				);
			});
		}, [fillerKey, frozenColumns, height, id, initialWidth, lastFrozenColumnIndex, row, visibleColumns]);

		return <StyledRow {...{ height, primary, secondary }}>{children}</StyledRow>;
	}
);

export function WellTable({
	columns,
	compact,
	idField: idFieldProp,
	indexed,
	limitColumnsSize,
	rawProjectHeaders,
	resize,
	rowIndexInc = 0,
	rowRenderer,
	rows,
	selection,
	...props
}) {
	const { primary, secondary } = props;
	const idField = idFieldProp ?? ROW_INDEX_ID;
	const rowSelectionEnabled = !!selection;

	const scrollPositionRef = useRef(0);

	const wellHeaderTypes = useMemo(() => {
		if (rawProjectHeaders) {
			return { ...WELL_HEADER_TYPES, ...getProjectHeadersTypes(rawProjectHeaders) };
		}
		return WELL_HEADER_TYPES;
	}, [rawProjectHeaders]);

	const [initialFrozen] = useState(() => columns.filter(({ frozen }) => frozen).map(({ key }) => key));
	const { set: frozenColumns, toggle: toggleFrozen } = useSet(initialFrozen);

	const orderedColumns = useMemo(() => {
		const { false: notFrozen = [], true: frozen = [] } = _.groupBy(columns, (column) =>
			frozenColumns.has(column.key)
		);

		const allCols = [...frozen, ...notFrozen];
		return limitColumnsSize ? allCols.slice(0, limitColumnsSize) : allCols;
	}, [columns, frozenColumns, limitColumnsSize]);

	const [columnsWidth, setColumnsWidth] = useState({});
	const onResize = useCallback(
		(idx, newWidth) => {
			const index = idx - (rowSelectionEnabled ? 1 : 0) - (indexed ? 1 : 0);
			const id = orderedColumns[index].key;
			setColumnsWidth((p) => {
				const newColumnWidth = { ...p };
				newColumnWidth[id] = newWidth;
				return newColumnWidth;
			});
		},
		[indexed, orderedColumns, rowSelectionEnabled]
	);

	const indexFormatter = useCallback(({ value }) => {
		return <NumberCellFormatter {...{ value: value + 1, title: value + 1 }} />;
	}, []);

	const defaultFormatter = useCallback(
		({ value, loading }) => (
			<DefaultCellFormatter {...{ value, title: typeof value === 'string' ? value : null, loading }} />
		),
		[]
	);

	const toggleColumnWidth = useCallback(
		(idx, key, extraWidth) => {
			const columnWidth = columnsWidth[key] || DEFAULT_COLUMN_WIDTH;
			onResize(idx, columnWidth + extraWidth);
		},
		[columnsWidth, onResize]
	);

	const newColumns = useMemo(
		() =>
			[
				...(indexed
					? [
							{
								key: ROW_INDEX_ID,
								frozen: true,
								name: '#',
								formatter: indexFormatter,
								// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
								headerRenderer: ({ column: { value, key, name, canFreeze, frozen, action } }) => (
									<NumberCellFormatter
										key={key}
										{...{
											id: key,
											key,
											name,
											canFreeze,
											frozen,
											action,
											freeze: value?.freeze,
											value: name,
										}}
									/>
								),
								width: 48,
							},
					  ]
					: []),
				...orderedColumns.map(({ action, width: columnWidth, value, ...column }) => {
					const actualWidth = Math.max(
						columnsWidth[column.key] || columnWidth || DEFAULT_COLUMN_WIDTH,
						MIN_COLUMN_WIDTH
					);
					return {
						resizable: true,
						width: columnWidth === null ? null : actualWidth + (action ? 40 : 0),
						canFreeze: true,
						value: { freeze: toggleFrozen, value },
						...column,
						frozen: frozenColumns.has(column.key),
						action,
					};
				}),
			].map((column) => ({
				formatter: defaultFormatter,
				// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
				headerRenderer: ({
					column: {
						value,
						key,
						name,
						canFreeze,
						frozen,
						action,
						filterable,
						columnOptions,
						setFilter,
						idx,
						canSort,
						sortDir,
						onSort,
						sorted,
						marked,
					},
				}) => {
					return (
						<DefaultHeaderRenderer
							key={key}
							{...{
								id: key,
								key,
								name,
								canFreeze,
								frozen,
								action,
								freeze: value?.freeze,
								filterable,
								columnOptions,
								setFilter,
								idx,
								toggleColumnWidth,
								canSort,
								sortDir,
								onSort,
								sorted,
								marked,
							}}
						/>
					);
				},
				...column,
			})),
		[
			indexed,
			indexFormatter,
			orderedColumns,
			columnsWidth,
			toggleFrozen,
			frozenColumns,
			defaultFormatter,
			toggleColumnWidth,
		]
	);

	const newRows = useMemo(
		() =>
			rows.map((row, rowIndex) => {
				const formattedRow = _.mapValues(row, (_value, key) =>
					getHeaderValueDisplay(row, key, wellHeaderTypes)
				);
				return {
					...formattedRow,

					// HACK: pagination is handled by the data provider. use index increment to display the correct index
					[ROW_INDEX_ID]: rowIndex + rowIndexInc,
					lastRow: rowIndex === rows.length - 1,
				};
			}),
		[rowIndexInc, rows, wellHeaderTypes]
	);

	const lastFrozenColumnIndex = frozenColumns.size + (rowSelectionEnabled ? 1 : 0) + (indexed ? 1 : 0) - 1;

	const baseRow = useCallback(
		(rowProps) => {
			const {
				height: rowHeight,
				columns: rowColumns,
				row,
				colVisibleEndIdx: incorrectColVisibleEndIdx,
				colVisibleStartIdx: incorrectColVisibleStartIdx,
				lastFrozenColumnIndex: incorrectLastFrozenColumnIndex,
			} = rowProps;
			const diff = lastFrozenColumnIndex - incorrectLastFrozenColumnIndex;
			const colVisibleStartIdx = Math.max(incorrectColVisibleStartIdx + diff, lastFrozenColumnIndex + 1);
			const colVisibleEndIdx = Math.max(incorrectColVisibleEndIdx, colVisibleStartIdx + 10);
			return (
				<Row
					{...{
						height: rowHeight,
						columns: rowColumns,
						row,
						colVisibleEndIdx,
						colVisibleStartIdx,
						lastFrozenColumnIndex,
						primary,
						secondary,
						id: row[idField],
					}}
				/>
			);
		},
		[idField, lastFrozenColumnIndex, primary, secondary]
	);

	const RowRenderer = useCallback(
		(rowProps) => {
			return rowRenderer ? rowRenderer({ ...rowProps, renderBaseRow: baseRow }) : baseRow(rowProps);
		},
		[baseRow, rowRenderer]
	);

	const disableSelectionKey = useCallback((row) => row.valid === false, []);

	useEffect(() => {
		/**
		 * @hack: needed to scroll to the correct position on resize
		 * refer to: https://stackoverflow.com/questions/56306297/react-data-grid-rows-disappearing-on-dynamically-providing-height
		 */
		const gridEl = document.getElementsByClassName('react-grid-Canvas')?.[0];
		if (gridEl) {
			gridEl.scrollTop = 0;
			gridEl.scrollTop = scrollPositionRef.current;
		}
	}, [resize]);

	return (
		<ReactDataGrid
			css={`
				.react-grid-HeaderCell {
					padding: initial;
					.react-grid-HeaderCell__draggable {
						width: 0.1rem !important;
						border-radius: 50%;
					}
				}
			`}
			columns={newColumns}
			disableSelectionKey={disableSelectionKey}
			headerRowHeight={ROW_HEIGHT}
			minColumnWidth={MIN_COLUMN_WIDTH}
			onColumnResize={onResize}
			onScroll={(e) => {
				scrollPositionRef.current = e.scrollTop;
			}}
			rowHeight={compact ? COMPACT_ROW_HEIGHT : ROW_HEIGHT}
			rowKey={idField}
			rowRenderer={RowRenderer}
			rows={newRows}
			selection={selection}
			{...props}
		/>
	);
}
