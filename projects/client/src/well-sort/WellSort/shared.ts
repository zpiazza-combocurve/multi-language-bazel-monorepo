import { useMemo } from 'react';

export function useAvailableWellColumns(columns, sortedColumns) {
	const availableColumnsKey = useMemo(
		() => Object.keys(columns).filter((key) => !sortedColumns.find(({ field }) => field === key)),
		[sortedColumns, columns]
	);

	return availableColumnsKey;
}
