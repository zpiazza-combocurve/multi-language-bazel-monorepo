import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Divider, Stack } from '@/components/v2';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import {
	BasicEdgeFormFields,
	StandardEdgeRowData,
	StandardEdgeTimeSeriesInput,
	TimeSeriesInputCommonCriteriaOptions,
} from '../types';
import { getNextMonth } from './helpers';
import { TIME_SERIES_INPUT_STANDARDS, TIME_SERIES_INPUT_TABLE_COLUMNS } from './shared';
import { FormTextField } from './shared-components';

export const getNewStandardEdgeRow = (
	criteria: TimeSeriesInputCommonCriteriaOptions,
	rows: StandardEdgeRowData[]
): StandardEdgeRowData => {
	if (criteria === TimeSeriesInputCommonCriteriaOptions.Flat) {
		return {
			period: 'Flat',
			allocation: 100,
		};
	}
	if (criteria === TimeSeriesInputCommonCriteriaOptions.Dates) {
		return {
			period:
				getNextMonth(
					// @ts-expect-error TODO fix this
					rows[rows.length - 1]?.period
				) ?? null,
			allocation: 100,
		};
	}
	throw new Error(`Invalid criteria: ${criteria}`);
};

const standardEdgeToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.edge.toolbar_operations(rows, criteria, () => getNewStandardEdgeRow(criteria, rows));

const getStandardEdgeColumns = (criteria: TimeSeriesInputCommonCriteriaOptions): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteria),
	TIME_SERIES_INPUT_TABLE_COLUMNS.allocation,
];

interface StandardEdgeFormFields extends BasicEdgeFormFields {
	time_series: StandardEdgeTimeSeriesInput;
}
function StandardEdgeForm() {
	const { watch, setValue } = useFormContext<StandardEdgeFormFields>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(
		() => standardEdgeToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.rows', [getNewStandardEdgeRow(value, [])]);
			setValue('time_series.criteria', value);
		},
		[setValue]
	);

	const memoizedColumns = useMemo(() => getStandardEdgeColumns(watchedCriteria), [watchedCriteria]);

	return (
		<Stack spacing={2}>
			<FormTextField name='description' label='Description' />
			<Divider />
			<TimeSeriesInput
				toolbarOperations={memoizedToolbarOperations}
				columnsDef={memoizedColumns}
				dropdownOptions={[
					{
						name: 'time_series.criteria',
						label: 'Criteria',
						menuItems: TIME_SERIES_INPUT_STANDARDS.edge.criterias,
						onChange: (e) => handleCriteriaChange(e.target.value),
					},
				]}
			/>
		</Stack>
	);
}

export default StandardEdgeForm;
