import produce from 'immer';
import { useCallback, useEffect, useMemo } from 'react';

import { Box } from '@/components/v2';
import { RESERVES_CATEGORY } from '@/economics/shared/shared';
import { getWellHeaderTypes } from '@/helpers/headers';
import { useWellColumns } from '@/well-sort/WellSort';
import { SortableColumnList } from '@/well-sort/WellSort/WellSortingDialog/SortableColumnList';

const additionalCriteria = {
	[RESERVES_CATEGORY]: { label: 'Reserves Category', headerType: 'assigned_model' },
	econ_group: { label: 'Econ Group' },
};

const EXCLUDE_HEADERS = ['combo_name']; // exclude due to econ will always group by current combo setting

const useReportHeaders = (sortedHeaders, setSortedHeaders) => {
	useEffect(() => {
		if (sortedHeaders[0] === RESERVES_CATEGORY && sortedHeaders.length > 1) {
			setSortedHeaders(sortedHeaders.slice(0, 1));
		}
	}, [sortedHeaders, setSortedHeaders]);

	const wellHeaderTypes = getWellHeaderTypes();

	const excludeCriteria = useCallback(
		(field) =>
			!['string', 'multi-select'].includes(wellHeaderTypes?.[field]?.type) || EXCLUDE_HEADERS.includes(field),
		[wellHeaderTypes]
	);

	const wellHeaders = useWellColumns(excludeCriteria);
	const headers = useMemo(() => ({ ...wellHeaders, ...additionalCriteria }), [wellHeaders]);

	const getAvailableColumnsKey = useCallback(
		(index) => {
			const availableHeadersKey = Object.keys(headers).filter(
				(key) => !sortedHeaders.find((field) => field === key)
			);
			if (index === 0) {
				return availableHeadersKey;
			}
			if (sortedHeaders[0] === RESERVES_CATEGORY) {
				return [];
			}
			return availableHeadersKey.filter((key) => key !== RESERVES_CATEGORY);
		},
		[headers, sortedHeaders]
	);

	const lastAvailableHeaders = useMemo(
		() => getAvailableColumnsKey(sortedHeaders.length),
		[getAvailableColumnsKey, sortedHeaders.length]
	);

	const addHeader = useCallback(() => {
		setSortedHeaders(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			produce((draft: any[]) => {
				if (lastAvailableHeaders) {
					draft.push(lastAvailableHeaders[0]);
				}
			})
		);
	}, [lastAvailableHeaders, setSortedHeaders]);

	const sortedColumns = useMemo(() => sortedHeaders.map((header) => ({ field: header })), [sortedHeaders]);
	const headersListComponent = (
		<SortableColumnList
			getAvailableColumnsKey={getAvailableColumnsKey}
			columns={headers}
			headersLabel={
				<Box display='flex' flexDirection='column'>
					<Box display='flex'>
						<Box fontSize='1rem'>Aggregate Based On Selected Criteria</Box>
					</Box>
					<p css='color:grey; font-size:0.75rem'>Drag and drop to change priority of the headers</p>
				</Box>
			}
			setSortedColumns={(columnsOrFunction) => {
				if (typeof columnsOrFunction === 'function') {
					setSortedHeaders((headers) =>
						columnsOrFunction(headers.map((field) => ({ field }))).map(({ field }) => field)
					);
				} else {
					setSortedHeaders(() => columnsOrFunction.map(({ field }) => field));
				}
			}}
			sortedColumns={sortedColumns}
			usesDirections={false}
			usesGrouping={false}
			allowEmpty
		/>
	);

	return {
		addHeader,
		availableHeadersKey: lastAvailableHeaders,
		headers,
		headersListComponent,
		setSortedHeaders,
		sortedHeaders,
	};
};

export default useReportHeaders;
