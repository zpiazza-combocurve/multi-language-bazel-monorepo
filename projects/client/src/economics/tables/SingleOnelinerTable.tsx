import { escapeRegExp } from 'lodash';
import { useMemo } from 'react';

import { labelWithUnit } from '@/helpers/text';
import { formatNumber, formatValue } from '@/helpers/utilities';
import { Table } from '@/tables/Table';

export function getOneLinerRows(row: Inpt.EconRunData['oneLinerData'], search = '') {
	return Object.values(row)
		.sort((a, b) => a.order - b.order)
		.filter(({ name }) => name.toLowerCase().match(escapeRegExp(search.toLowerCase())))
		.map(({ name, unit, value, type, key }) => {
			let processedValue;
			if (type === 'number') {
				processedValue = formatNumber(value, 3);
			} else if (type === 'date') {
				// skipping the date process here due to econ result already has formatted date
				processedValue = value;
			} else {
				processedValue = formatValue(value);
			}
			return {
				header: labelWithUnit(name, unit),
				value: processedValue,
				key,
			};
		});
}

const SINGLE_ONELINER_COLUMNS = [
	{ key: 'header', name: 'Oneliner' },
	{ key: 'value', name: 'Value', cellClass: 'align-right', headerCellClass: 'align-right' },
];

export default function SingleOnelinerTable({
	search,
	oneLiner,
	className,
}: {
	search?: string;
	oneLiner: Inpt.EconRunData['oneLinerData'];
	className?: string;
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const rows: any[] = useMemo(() => getOneLinerRows(oneLiner, search), [oneLiner, search]);

	return <Table className={className} columns={SINGLE_ONELINER_COLUMNS} rows={rows} rowKey='header' />;
}
