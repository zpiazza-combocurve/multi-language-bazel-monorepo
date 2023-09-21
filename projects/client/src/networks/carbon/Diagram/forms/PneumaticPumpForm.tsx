import { NetworkShared } from '@combocurve/types/client';
import { Divider } from '@material-ui/core';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { AssumptionKey } from '@/inpt-shared/constants';

import { FluidModelAccordionItem } from '../EditNodeDialog';
import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import { PneumaticPumpRowData, TimeSeriesInputCommonCriteriaOptions } from '../types';
import { getNextMonth } from './helpers';
import { NodeFormFields, TIME_SERIES_INPUT_STANDARDS, TIME_SERIES_INPUT_TABLE_COLUMNS } from './shared';

const PNEUMATIC_PUMP_COMMON_FIXED_VALUES = {
	count: 0,
	runtime: 8760,
};

export const getNewPneumaticPumpRow = (
	criteria: TimeSeriesInputCommonCriteriaOptions,
	rows: PneumaticPumpRowData[]
): PneumaticPumpRowData => {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.FPD:
			return {
				...PNEUMATIC_PUMP_COMMON_FIXED_VALUES,
				period: 1,
			};
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return {
				...PNEUMATIC_PUMP_COMMON_FIXED_VALUES,
				period:
					getNextMonth(
						// @ts-expect-error TODO fix this
						rows[rows.length - 1]?.period
					) ?? null,
			};

		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return {
				...PNEUMATIC_PUMP_COMMON_FIXED_VALUES,
				period: 'Flat',
			};

		default:
			throw new Error(`Invalid criteria: ${criteria}`);
	}
};

const pneumaticPumpToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.node.toolbar_operations(rows, criteria, () => getNewPneumaticPumpRow(criteria, rows));

const getPneumaticDeviceColumns = (criteriaOption: TimeSeriesInputCommonCriteriaOptions): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteriaOption),
	TIME_SERIES_INPUT_TABLE_COLUMNS.count,
	TIME_SERIES_INPUT_TABLE_COLUMNS.runtime,
];

function PneumaticPumpForm() {
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.pneumatic_pump>>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(
		() => pneumaticPumpToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const memoizedColumns = useMemo(() => getPneumaticDeviceColumns(watchedCriteria), [watchedCriteria]);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.rows', [getNewPneumaticPumpRow(value, [])]);
			setValue('time_series.criteria', value);
		},
		[setValue]
	);

	return (
		<>
			<FluidModelAccordionItem name={AssumptionKey.fluidModel} />
			<Divider />
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

export default PneumaticPumpForm;
