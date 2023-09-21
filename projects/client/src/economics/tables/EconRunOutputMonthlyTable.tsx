import { ColDef, ColGroupDef, ColumnValueChangedEvent } from 'ag-grid-community';
import produce from 'immer';
import _ from 'lodash';
import { useMemo, useState } from 'react';

import AgGrid from '@/components/AgGrid';
import { useAgGridCache } from '@/components/hooks';
import {
	CUMULATIVE_FIELD_PREFIX,
	ECON_RUN_OUTPUT_MONTHLY_TABLE_COLUMN_ORDER,
	ECON_RUN_OUTPUT_MONTHLY_TABLE_GROUP_CACHE,
	NUMBER_TYPE_TO_USE,
	autoGroupColumnDef,
	commonColDefFields,
	econOutputDefaultValueFormatter,
	getOutputFieldAggregationFunction,
	getRows,
	outputAgGridSidebar,
} from '@/economics/shared/shared';
import { labelWithUnit } from '@/helpers/text';
import { fields as econOutputColumns } from '@/inpt-shared/display-templates/general/economics_columns.json';

const autoGroupColumnDefExtended = {
	...autoGroupColumnDef,
	cellRendererParams: {
		suppressCount: true,
	},
};

function calculateTotalsField(rows: Record<string, string | number>[], field: string, aggFunc: string) {
	switch (aggFunc) {
		case 'avg': {
			return rows.length ? rows.reduce((acc, curr) => acc + (curr[field] as number), 0) / rows.length : 0;
		}

		case 'count': {
			return rows.length;
		}

		case 'first': {
			return rows.length > 0 ? rows[0][field] : 0;
		}

		case 'last': {
			return rows.length > 0 ? rows[rows.length - 1][field] : 0;
		}

		case 'min': {
			return rows.length > 0 ? Math.min(...rows.map((row) => row[field] as number)) : 0;
		}

		case 'max': {
			return rows.length > 0 ? Math.max(...rows.map((row) => row[field] as number)) : 0;
		}

		case 'sum': {
			return rows.reduce((acc, curr) => acc + (curr[field] as number), 0);
		}

		default:
			return 0;
	}
}

function getColumns(output: Inpt.EconRun['outputGroups']['all']) {
	const filtered = output.filter(({ key }) => key !== 'date');

	const columnsByCategory = _.groupBy(
		filtered,
		({ key }) =>
			econOutputColumns[key.startsWith(CUMULATIVE_FIELD_PREFIX) ? key.slice(CUMULATIVE_FIELD_PREFIX.length) : key]
				.category
	);

	const groupedOutputColumnsDefs: ColGroupDef[] = [];

	Object.entries(columnsByCategory).forEach(([category, categoryColumns]) => {
		const categoryColDefs = categoryColumns.map(({ key, unit, name }) => {
			return {
				...commonColDefFields,
				field: key,
				headerName: labelWithUnit(name, unit),
				valueFormatter: econOutputDefaultValueFormatter,
				type: NUMBER_TYPE_TO_USE,
				aggFunc: getOutputFieldAggregationFunction(key),
				enableValue: true,
			} as ColDef;
		});

		groupedOutputColumnsDefs.push({
			headerName: category,
			children: categoryColDefs,
		});
	});

	return groupedOutputColumnsDefs;
}

const sideBar = outputAgGridSidebar();

export default function EconRunOutputMonthlyTable({ output }: { output: Inpt.EconRun['outputGroups']['all'] }) {
	const { onGridReady, onColumnRowGroupChanged, onColumnMoved } = useAgGridCache(
		ECON_RUN_OUTPUT_MONTHLY_TABLE_COLUMN_ORDER,
		ECON_RUN_OUTPUT_MONTHLY_TABLE_GROUP_CACHE,
		!!output
	);

	const columnDefs = useMemo(() => {
		if (!output) {
			return [];
		}
		return [
			{
				field: 'year',
				headerName: 'Year',
				rowGroup: true,
				rowGroupIndex: 0,
				enableRowGroup: true,
				hide: true,
				enablePivot: true,
				filter: true,
			},
			{
				field: 'quarter',
				headerName: 'Quarter',
				enableRowGroup: true,
				hide: true,
				enablePivot: true,
				filter: true,
			},
			{
				field: 'month',
				headerName: 'Month',
				pinned: true,
				enablePivot: true,
				filter: true,
			},
			...getColumns(output),
		];
	}, [output]);

	const [totals, setTotals] = useState<Record<string, number | string | null>[]>([]);

	const rows = useMemo(() => {
		if (!output?.[0].years) {
			return [];
		}

		const rows = getRows(output);
		const totalsRow = { ...rows[0], date: null, year: null, quarter: null, month: 'Total', _key: 'total' };
		const aggFields = Object.keys(_.omit(totalsRow, ['date', 'year', 'quarter', 'month', '_key']));

		aggFields.forEach((field) => {
			totalsRow[field] = calculateTotalsField(rows, field, getOutputFieldAggregationFunction(field));
		});

		setTotals([totalsRow]);

		return rows;
	}, [output]);

	const onColumnValueChanged = (event: ColumnValueChangedEvent) => {
		if (event.column) {
			const field = event.column.getColId();
			const aggFunc = event.column.getAggFunc();

			if (field && aggFunc) {
				setTotals(
					produce((draft) => {
						draft[0][field] = calculateTotalsField(rows, field, aggFunc as string);
					})
				);
			}
		}
	};

	return (
		<AgGrid
			getRowNodeId='_key'
			css='height: 100%'
			rowData={rows}
			columnDefs={columnDefs}
			autoGroupColumnDef={autoGroupColumnDefExtended}
			suppressAggFuncInHeader
			sideBar={sideBar}
			enableRangeSelection
			rowSelection='multiple'
			groupDisplayType='multipleColumns'
			pinnedBottomRowData={totals}
			onColumnValueChanged={onColumnValueChanged}
			onColumnMoved={onColumnMoved}
			onColumnRowGroupChanged={onColumnRowGroupChanged}
			onGridReady={onGridReady}
			maintainColumnOrder
		/>
	);
}
