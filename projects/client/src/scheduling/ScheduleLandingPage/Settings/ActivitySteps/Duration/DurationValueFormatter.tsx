import { ValueFormatterParams } from 'ag-grid-community';

import { formatDays } from '../../shared/helpers';
import { LookupTableName } from './LookupTableName';

export function DurationValueFormatter(params: ValueFormatterParams) {
	const {
		context: { lookupTables = [], isSchedulingLookupTableEnabled },
		value,
	} = params;

	if (isSchedulingLookupTableEnabled && value.useLookup && value.scheduleLookupId) {
		const lookupTable = lookupTables.find((table) => table._id === value.scheduleLookupId);
		const name = lookupTable?.name ?? 'Loading';

		return <LookupTableName name={name} />;
	}

	return formatDays(value.days);
}
