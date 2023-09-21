import { NetworkShared } from '@combocurve/types/client';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import { CentrifugalCompressorRowData, TimeSeriesInputCommonCriteriaOptions } from '../types';
import { getNextMonth } from './helpers';
import { NodeFormFields, TIME_SERIES_INPUT_STANDARDS, TIME_SERIES_INPUT_TABLE_COLUMNS } from './shared';

const CENTRIFUGAL_COMPRESSOR_COMMON_FIXED_VALUES = {
	count: 0,
	runtime: 8760,
};
export const getNewCentrifugalCompressorRow = (
	criteria: TimeSeriesInputCommonCriteriaOptions,
	rows: CentrifugalCompressorRowData[]
): CentrifugalCompressorRowData => {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.FPD:
			return {
				...CENTRIFUGAL_COMPRESSOR_COMMON_FIXED_VALUES,
				period: 1,
			};
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return {
				...CENTRIFUGAL_COMPRESSOR_COMMON_FIXED_VALUES,
				period:
					getNextMonth(
						// @ts-expect-error -- TODO check why typescript is complaining
						rows[rows.length - 1]?.period
					) ?? null,
			};

		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return {
				...CENTRIFUGAL_COMPRESSOR_COMMON_FIXED_VALUES,
				period: 'Flat',
			};

		default:
			throw new Error(`Invalid criteria: ${criteria}`);
	}
};

const centrifugalCompressorToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.node.toolbar_operations(rows, criteria, () =>
		getNewCentrifugalCompressorRow(criteria, rows)
	);

const getCentrifugalCompressorColumns = (criteriaOption: TimeSeriesInputCommonCriteriaOptions): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteriaOption),
	TIME_SERIES_INPUT_TABLE_COLUMNS.count,
	TIME_SERIES_INPUT_TABLE_COLUMNS.runtime,
];

function CentrifugalCompressorForm() {
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.centrifugal_compressor>>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(
		() => centrifugalCompressorToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const memoizedColumns = useMemo(() => getCentrifugalCompressorColumns(watchedCriteria), [watchedCriteria]);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.rows', [getNewCentrifugalCompressorRow(value, [])]);
			setValue('time_series.criteria', value);
		},
		[setValue]
	);

	return (
		<>
			<TimeSeriesInput
				toolbarOperations={memoizedToolbarOperations}
				dropdownOptions={[
					{
						name: 'time_series.criteria',
						label: 'Criteria',
						menuItems: TIME_SERIES_INPUT_STANDARDS.node.criterias,
						onChange: (e) => handleCriteriaChange(e.target.value),
					},
				]}
				columnsDef={memoizedColumns}
			/>
		</>
	);
}

export default CentrifugalCompressorForm;
