import { NetworkShared } from '@combocurve/types/client';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Stack } from '@/components/v2';
import { assert } from '@/helpers/utilities';
import { DETAILED_FUEL_TYPES, START_VALUE } from '@/networks/carbon/shared';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import CAPEX_OPTIONS from '../capex-options.json';
import { DrillingRowData } from '../types';
import { getNextMonth, useCustomDateHeaders } from './helpers';
import {
	Criteria,
	NodeFormFields,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS,
	TIME_SERIES_INPUT_TABLE_COLUMNS,
	TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT,
	getCriteriaBasedNewRowToolbarOperations,
} from './shared';

const DRILLING_START_WINDOW_DATE_MESSAGE =
	'Each row assigns consumption rate for drilling events that start within the defined date window';

const getDrillingColumns = (
	fuelType: string,
	additionalOptions: {
		customDateHeaders?: Record<string, string>;
	}
): ColDef[] => {
	return [
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_date_window(DRILLING_START_WINDOW_DATE_MESSAGE),
		TIME_SERIES_INPUT_TABLE_COLUMNS.consumption_rate(fuelType, 'D'),
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_criteria,
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_criteria_option(additionalOptions),
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_value,
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_criteria,
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_criteria_option(additionalOptions),
		START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_value,
	];
};

const getNewDrillingRow = (rows: DrillingRowData[]): DrillingRowData => {
	return {
		start_date_window: rows.length
			? getNextMonth(rows[rows.length - 1]?.start_date_window, TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT)
			: START_VALUE,
		consumption_rate: 0,
		start_criteria: 'FPD',
		start_criteria_option: null,
		start_value: 0,
		end_criteria: 'duration',
		end_criteria_option: null,
		end_value: 0,
	};
};

const drillingToolbarOperations = (rows): ToolbarOperation[] =>
	getCriteriaBasedNewRowToolbarOperations(rows, () => getNewDrillingRow(rows));

function DrillingForm() {
	const customDateHeaders = useCustomDateHeaders();
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.drilling>>();

	const watchedRows = watch('time_series.rows');
	const watchedFuelType = watch('time_series.fuel_type');

	const memoizedToolbarOperations = useMemo(() => drillingToolbarOperations(watchedRows), [watchedRows]);

	const handleFuelTypeChange = useCallback(
		(value) => {
			setValue('time_series.fuel_type', value);
		},
		[setValue]
	);

	const memoizedColumns = useMemo(
		() =>
			getDrillingColumns(watchedFuelType, {
				customDateHeaders,
			}),
		[watchedFuelType, customDateHeaders]
	);

	return (
		<Stack spacing={2}>
			<TimeSeriesInput
				toolbarOperations={memoizedToolbarOperations}
				columnsDef={memoizedColumns}
				dropdownOptions={[
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
				agGridProps={{
					onCellEditingStopped: (ev, context) => {
						const { data, column, newValue, oldValue, rowIndex } = ev;
						assert(rowIndex !== null, 'rowIndex is null');

						// Resetting fields if criteria type changed.
						if (
							newValue !== oldValue &&
							(column.getColId() === 'start_criteria' || column.getColId() === 'end_criteria')
						) {
							data[`${column.getColId()}_option`] = null;
							if (newValue === Criteria.FPD || newValue === Criteria.duration) {
								data[`${column.getColId().split('_')[0]}_value`] = 0;
							}
							if (newValue === Criteria.schedule) {
								data[`${column.getColId().split('_')[0]}_value`] = null;
								data[`${column.getColId()}_option`] = Object.keys(CAPEX_OPTIONS.fromSchedule)[0];
							}
							if (newValue === Criteria.headers) {
								data[`${column.getColId().split('_')[0]}_value`] = null;
								data[`${column.getColId()}_option`] = Object.keys(CAPEX_OPTIONS.fromHeaders)[0];
							}
						}
						const updatedValue = [...context.value];
						updatedValue.splice(rowIndex, 1, {
							...data,
							[ev.column.getColId()]: newValue,
						});
						context.onChange(updatedValue);
					},
				}}
			/>
		</Stack>
	);
}

export default DrillingForm;
