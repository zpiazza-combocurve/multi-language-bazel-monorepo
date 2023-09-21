/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from 'react';
import * as React from 'react';
import { DataGridProps, Row } from 'react-data-grid-canary';

import { ReactDataGridCanary, ReactDataGridCanaryIndexColumn, ReactDataGridCanarySelectionColumn } from '@/components';
import { useCallbackRef } from '@/components/hooks';
import { formatNumber } from '@/helpers/utilities';

import * as TablePlugins from './Table/plugins';

export interface TableProps<R = any, SR = unknown, KEY = React.Key> extends DataGridProps<R, SR> {
	selection?: import('@/components/hooks/useSelection').Selection<KEY>;
	rowKey?: keyof R;
	onGetKey?: (key: KEY) => void;
	indexed?: any;
	columns: any;
	rows: any;
	rowRenderer?: any;
	rowKeyGetter?: any;
}

export function numericCellFormatter({ row, column }) {
	if (row[TablePlugins.LOADING_KEY]) {
		// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
		return <></>;
	}
	return <>{formatNumber(row[column.key], 3)}</>;
}

/**
 * Common property wrappers over react-data-grid@canary
 *
 * @deprecated Use ag-grid
 * @example
 * 	import React, { useMemo } from 'react';
 * 	import { getWellHeaders } from '@/helpers/headers';
 * 	import { Table } from '@/tables/Table';
 *
 * 	function SimpleTable({ wellDataArray }) {
 * 		const wellIds = useMemo(() => wellDataArray.map(({ _id }) => _id), [wellDataArray]);
 * 		const columns = useMemo(() => Object.keys(getWellHeaders()).map((key) => ({ key, name: headers[key] })), []);
 * 		const selection = useSelection(wellIds);
 * 		return <Table rowKey='_id' columns={columns} selection={selection} rows={wellDataArray} />;
 * 	}
 * 	// async rows example
 * 	import React, { useMemo } from 'react';
 * 	import { getWellHeaders } from '@/helpers/headers';
 * 	import { Table } from '@/tables/Table';
 *
 * 	function AsyncTable({ wellIds }) {
 * 		const columns = useMemo(() => Object.keys(getWellHeaders()).map((key) => ({ key, name: headers[key] })), []);
 * 		const selection = useSelection(wellIds);
 * 		return (
 * 			<Table
 * 				rowKey='_id'
 * 				columns={columns}
 * 				selection={selection}
 * 				{...Table.Plugins.useAsyncRows({
 * 					rowKey: '_id',
 * 					ids: wellIds,
 * 					fetch: async (ids) => postApi('/well/getWellHeaderValues', { wells: ids }),
 * 				})}
 * 			/>
 * 		);
 * 	}
 */
export const Table = Object.assign(
	React.memo(
		<R, SR = unknown, KEY = React.Key>({
			selection,
			rowKey,
			columns: propColumns,
			rowKeyGetter: propRowKeyGetter,
			onGetKey: propOnGetKey,
			rowRenderer: PropRowRenderer = Row,
			indexed,
			...props
		}: TableProps<R, SR, KEY>) => {
			const hasSelection = !!selection;

			const onGetKey = useCallbackRef(propOnGetKey);

			const columns = useMemo(() => {
				if (hasSelection) {
					return [
						ReactDataGridCanarySelectionColumn,
						...(indexed ? [ReactDataGridCanaryIndexColumn] : []),
						...propColumns,
					];
				}
				return propColumns;
			}, [propColumns, hasSelection, indexed]);

			const rowKeyGetter = useMemo(() => {
				if (rowKey) {
					return (row: R) => row[rowKey] as any as KEY;
				}
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				return propRowKeyGetter!;
			}, [propRowKeyGetter, rowKey]);

			const { select, deselect } = selection ?? {};

			const rowRenderer = useCallback(
				function RowRenderer({ selectRow, ...rowProps }) {
					const key = rowKeyGetter(rowProps.row) as KEY;
					const customSelectRow = useCallback(
						({ checked }) => {
							if (checked) {
								select?.(key);
							} else {
								deselect?.(key);
							}
						},
						[key]
					);
					onGetKey?.(key);
					return <PropRowRenderer selectRow={hasSelection ? customSelectRow : selectRow} {...rowProps} />;
				},
				[PropRowRenderer, rowKeyGetter, select, deselect, hasSelection, onGetKey]
			);

			const handleSelectedRowsChange = useCallbackRef((newSelection: Set<KEY>) => {
				if (!selection) {
					return;
				}
				if (newSelection.size === props.rows.length) {
					selection.selectAll();
				} else if (newSelection.size === 0) {
					selection.deselectAll();
				} else {
					selection.setSelectedSet(newSelection);
				}
			});

			return (
				<ReactDataGridCanary
					// TODO remove anys when update to latests version and try again
					selectedRows={selection?.selectedSet as any}
					onSelectedRowsChange={handleSelectedRowsChange as any}
					{...props}
					rowRenderer={rowRenderer}
					columns={columns}
					rowKeyGetter={rowKeyGetter as any}
				/>
			);
		}
		// TODO: fix types above, React.memo messes up generic types
	) as any,
	{ Plugins: TablePlugins }
);
