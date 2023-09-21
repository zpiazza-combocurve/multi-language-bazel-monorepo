import { groupBy, transform } from 'lodash-es';
import { useMemo, useState } from 'react';

import { NUMBER_TYPE_TO_USE, getMonthIndex, getRows, monthNames } from '@/economics/shared/shared';
import { labelWithUnit } from '@/helpers/text';
import { formatNumber } from '@/helpers/utilities';
import { Table, numericCellFormatter } from '@/tables/Table';

export function getColumns(output: Inpt.EconRun['outputGroups']['all']) {
	const totals: Record<string, Record<string, number>> = {};
	output.forEach((header) =>
		header.years.forEach((yearData) => {
			totals[header.key] ??= {};
			totals[header.key][yearData.year] = yearData.total;
		})
	);
	return output.map(({ name, key, unit }, index) => ({
		key,
		name: labelWithUnit(name, unit),
		frozen: index === 0,
		width: index === 0 ? 100 : 150,
		groupFormatter:
			index === 0
				? undefined
				: ({ groupKey, column }) => (
						<div style={{ textAlign: 'right' }}>{formatNumber(totals[column.key][groupKey], 3)}</div>
				  ),
		summaryFormatter: index === 0 ? undefined : numericCellFormatter,
		// eslint-disable-next-line react/jsx-no-useless-fragment -- TODO eslint fix later
		formatter: index === 0 ? ({ row }) => <>{monthNames[getMonthIndex(row.date)]}</> : numericCellFormatter,
		type: index === 0 ? undefined : NUMBER_TYPE_TO_USE,
		summaryCellClass: index === 0 ? undefined : 'align-right',
		headerCellClass: index === 0 ? undefined : 'align-right',
		cellClass: index === 0 ? undefined : 'align-right',
	}));
}

export default function EconOutputMonthlyTable({
	output,
	className = '',
}: {
	output: Inpt.EconRun['outputGroups']['all'];
	className?: string;
}) {
	const columns = useMemo(() => {
		if (!output) {
			return [];
		}
		// eslint-disable-next-line react/no-unstable-nested-components -- TODO eslint fix later
		return [{ key: 'year', name: 'Year', frozen: true, summaryFormatter: () => <>Total</> }, ...getColumns(output)];
	}, [output]);

	const rows = useMemo(() => (output?.[0].years ? getRows(output) : []), [output]);

	const [expandedGroupIds, setExpandedGroupIds] = useState(() => new Set());

	const summaryRows = useMemo(
		() => [
			transform(
				output,
				(acc, { key, total }) => {
					if (key !== 'date') {
						acc[key] = total;
					}
				},
				{}
			),
		],
		[output]
	);

	return (
		<Table
			rowKey='_key'
			className={className}
			columns={columns}
			rows={rows}
			defaultColumnOptions={{ resizable: true }}
			groupBy={['year']}
			rowGrouper={groupBy}
			expandedGroupIds={expandedGroupIds}
			onExpandedGroupIdsChange={setExpandedGroupIds}
			summaryRows={summaryRows}
		/>
	);
}
