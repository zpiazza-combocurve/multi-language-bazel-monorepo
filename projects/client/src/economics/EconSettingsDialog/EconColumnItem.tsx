import { TableColumn, TableRow } from 'react-md';

import { Checkbox } from '@/components/v2';

import { OPTION_TYPE } from './shared';

export function EconColumnItem({ columnKey, columnTemplate, columnValue, onToggleColumn }) {
	const { label, options } = columnTemplate;
	const { selected_options } = columnValue;

	const renderColumn = (option) => (
		<TableColumn>
			{options[option] && (
				<Checkbox
					name={`one-liner-${columnKey}`}
					onChange={() => onToggleColumn(columnKey, option)}
					checked={selected_options[option]}
				/>
			)}
		</TableColumn>
	);

	return (
		<TableRow>
			<TableColumn>
				<span css='margin-left: 3rem;'>{label}</span>
			</TableColumn>
			{renderColumn(OPTION_TYPE.ONE_LINER_KEY)}
			{renderColumn(OPTION_TYPE.MONTHLY_KEY)}
			{renderColumn(OPTION_TYPE.AGGREGATE_KEY)}
		</TableRow>
	);
}
