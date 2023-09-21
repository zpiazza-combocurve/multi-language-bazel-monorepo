import { NetworkShared } from '@combocurve/types/client';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Stack } from '@/components/v2';
import { DETAILED_FUEL_TYPES } from '@/networks/carbon/shared';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import { TimeSeriesInputCommonCriteriaOptions } from '../types';
import { getNextMonth } from './helpers';
import { NodeFormFields, TIME_SERIES_INPUT_STANDARDS, TIME_SERIES_INPUT_TABLE_COLUMNS } from './shared';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getNewCombustionRow = (criteria: TimeSeriesInputCommonCriteriaOptions, rows: any[]) => {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return {
				period: 'Flat',
				consumption_rate: 0,
			};
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return {
				period: getNextMonth(rows[rows.length - 1]?.period) ?? null,
				consumption_rate: 0,
			};
		default:
			throw new Error('Invalid criteria');
	}
};

const combustionToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.node.toolbar_operations(rows, criteria, () => getNewCombustionRow(criteria, rows));

const getCombustionColumns = (criteria: TimeSeriesInputCommonCriteriaOptions, fuelType: string): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteria),
	TIME_SERIES_INPUT_TABLE_COLUMNS.consumption_rate(fuelType, 'YR'),
];

function CombustionForm() {
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.combustion>>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');
	const watchedFuelType = watch('time_series.fuel_type');

	const memoizedToolbarOperations = useMemo(
		() => combustionToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.rows', [getNewCombustionRow(value, [])]);
			setValue('time_series.criteria', value);
		},
		[setValue]
	);

	const handleFuelTypeChange = useCallback(
		(value) => {
			setValue('time_series.fuel_type', value);
		},
		[setValue]
	);

	const memoizedColumns = useMemo(
		() => getCombustionColumns(watchedCriteria, watchedFuelType),
		[watchedCriteria, watchedFuelType]
	);

	return (
		<Stack spacing={2}>
			<TimeSeriesInput
				toolbarOperations={memoizedToolbarOperations}
				columnsDef={memoizedColumns}
				dropdownOptions={[
					{
						name: 'time_series.criteria',
						label: 'Criteria',
						menuItems: TIME_SERIES_INPUT_STANDARDS.node.criterias,
						onChange: (e) => handleCriteriaChange(e.target.value),
					},
					{
						name: 'time_series.fuel_type',
						label: 'Fuel Type',
						menuItems: Object.keys(DETAILED_FUEL_TYPES).map((key) => ({
							value: key,
							label: DETAILED_FUEL_TYPES[key].label,
						})),
						onChange: (e) => handleFuelTypeChange(e.target.value),
					},
				]}
			/>
		</Stack>
	);
}

export default CombustionForm;
