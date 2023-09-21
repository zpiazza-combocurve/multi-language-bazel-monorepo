import { NetworkShared } from '@combocurve/types/client';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import { ReciprocatingCompressorRowData, TimeSeriesInputCommonCriteriaOptions } from '../types';
import { getNextMonth } from './helpers';
import { NodeFormFields, TIME_SERIES_INPUT_STANDARDS, TIME_SERIES_INPUT_TABLE_COLUMNS } from './shared';

const RECIPROCATING_COMPRESSOR_COMMON_FIXED_VALUES = {
	count: 0,
	runtime: 8760,
};
export const getNewReciprocatingCompressorRow = (
	criteria: TimeSeriesInputCommonCriteriaOptions,
	rows: ReciprocatingCompressorRowData[]
): ReciprocatingCompressorRowData => {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.FPD:
			return {
				...RECIPROCATING_COMPRESSOR_COMMON_FIXED_VALUES,
				period: 1,
			};
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return {
				...RECIPROCATING_COMPRESSOR_COMMON_FIXED_VALUES,
				period:
					getNextMonth(
						// @ts-expect-error TODO fix this
						rows[rows.length - 1]?.period
					) ?? null,
			};

		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return {
				...RECIPROCATING_COMPRESSOR_COMMON_FIXED_VALUES,
				period: 'Flat',
			};

		default:
			throw new Error(`Invalid criteria: ${criteria}`);
	}
};

const reciprocatingCompressorToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.node.toolbar_operations(rows, criteria, () =>
		getNewReciprocatingCompressorRow(criteria, rows)
	);

const getReciprocatingCompressorColumns = (criteriaOption: TimeSeriesInputCommonCriteriaOptions): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteriaOption),
	TIME_SERIES_INPUT_TABLE_COLUMNS.count,
	TIME_SERIES_INPUT_TABLE_COLUMNS.runtime,
];

function ReciprocatingCompressorForm() {
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.reciprocating_compressor>>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(
		() => reciprocatingCompressorToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const memoizedColumns = useMemo(() => getReciprocatingCompressorColumns(watchedCriteria), [watchedCriteria]);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.rows', [getNewReciprocatingCompressorRow(value, [])]);
			setValue('time_series.criteria', value);
		},
		[setValue]
	);

	return (
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
	);
}

export default ReciprocatingCompressorForm;
