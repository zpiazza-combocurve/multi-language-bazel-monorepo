import produce from 'immer';
import { useCallback, useEffect, useMemo, useState } from 'react';

import useSortablePhases from '@/components/hooks/useSortablePhases';
import { InfoTooltip } from '@/components/tooltipped';
import { Box } from '@/components/v2';
import { getWellHeaderTypes } from '@/helpers/headers';
import { useWellColumns } from '@/well-sort/WellSort';
import { SortableColumnList } from '@/well-sort/WellSort/WellSortingDialog/SortableColumnList';
import { useAvailableWellColumns } from '@/well-sort/WellSort/shared';

const GROUP_ROLL_UP_EXCLUDE_HEADERS = [
	'chosenID',
	'inptID',
	'phdwin_id',
	'aries_id',
	'api10',
	'api12',
	'api14',
	'well_number',
	'chosenKeyID',
];

// more will be added in the future
const additionalCriteria = {
	tc_name: { label: 'Applied Type Curve', headerType: 'forecast' },
	well_year: { label: 'First Production Year' },
};

const useRollupHeaders = () => {
	const [sortedHeaders, _setSortedHeaders] = useState([]);

	const { sortedPhases, sortablePhasesRender: _sortablePhasesRender } = useSortablePhases();

	const wellHeaderTypes = getWellHeaderTypes();

	const excludeCriteria = useCallback(
		(field) =>
			!['string', 'multi-select'].includes(wellHeaderTypes?.[field]?.type) ||
			GROUP_ROLL_UP_EXCLUDE_HEADERS.includes(field),
		[wellHeaderTypes]
	);

	const wellHeaders = useWellColumns(excludeCriteria);
	const headers = useMemo(() => ({ ...wellHeaders, ...additionalCriteria }), [wellHeaders]);

	const availableHeadersKey = useAvailableWellColumns(headers, sortedHeaders);

	const includesTypeCurveName = useMemo(
		() => sortedHeaders.findIndex((item) => item.field === 'tc_name') > -1,
		[sortedHeaders]
	);

	const sortablePhasesRender = useMemo(
		() => (
			<Box display='flex' flexDirection='column' marginTop='1rem' paddingX='3rem'>
				<Box alignItems='center' display='flex' marginBottom='1rem'>
					<Box marginRight='1rem'>
						<InfoTooltip labelTooltip='Select phase priority for type curve when more than one type curves applied on one well.' />
					</Box>

					<span>Select Phase Priority</span>
				</Box>

				{_sortablePhasesRender}
			</Box>
		),
		[_sortablePhasesRender]
	);

	const setSortedHeaders = useCallback(
		(partialState) =>
			_setSortedHeaders((curState) => {
				if (typeof partialState === 'function') {
					const newState = partialState(curState).map((item) => {
						if (item.field === 'tc_name') {
							return { ...item, additionalRender: sortablePhasesRender };
						}

						return { ...item, additionalRender: null };
					});

					return newState;
				}

				return partialState;
			}),
		[sortablePhasesRender]
	);

	const addHeader = useCallback(() => {
		setSortedHeaders(
			produce((draft) => {
				if (availableHeadersKey?.length) {
					draft.push({ field: availableHeadersKey[0], selected: false });
				}
			})
		);
	}, [availableHeadersKey, setSortedHeaders]);

	const headersArr = sortedHeaders.map((el) => el.field);

	const renderRollupHeaders = useMemo(
		() => (
			<SortableColumnList
				allowEmpty
				availableColumnsKey={availableHeadersKey}
				columns={headers}
				headersLabel={
					<Box display='flex' flexDirection='column'>
						<Box display='flex'>
							<Box fontSize='1rem'>Aggregate Volumes Based On Selected Criteria</Box>
							{/*
							<Box marginLeft='1rem'>
								<InfoTooltip labelTooltip='Select headers to group wells in the CSV roll-up export. Currently limited to two aggregation criteria.' />
							</Box> */}
						</Box>
						<p css='color:grey; font-size:0.75rem'>Drag and drop to change priority of the headers</p>
					</Box>
				}
				setSortedColumns={setSortedHeaders}
				sortedColumns={sortedHeaders}
				usesDirections={false}
				usesGrouping={false}
			/>
		),
		[availableHeadersKey, headers, setSortedHeaders, sortedHeaders]
	);

	// HACK: udpates the additionalRender; re-factor in the future to build around this unique functionality
	useEffect(() => {
		_setSortedHeaders(
			produce((draft) => {
				const tcNameItem = draft.find((item) => item.field === 'tc_name');
				if (tcNameItem) {
					tcNameItem.additionalRender = sortablePhasesRender;
				}
			})
		);
	}, [sortablePhasesRender]);

	return {
		addHeader,
		availableHeadersKey,
		headers,
		headersArr,
		includesTypeCurveName,
		renderRollupHeaders,
		setSortedHeaders,
		sortablePhasesRender,
		sortedHeaders,
		sortedPhases,
	};
};

export default useRollupHeaders;
