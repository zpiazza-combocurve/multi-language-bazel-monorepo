import { NetworkShared } from '@combocurve/types/client';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { Stack } from '@/components/v2';
import { assert } from '@/helpers/utilities';
import { START_VALUE } from '@/networks/carbon/shared';

import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import CAPEX_OPTIONS from '../capex-options.json';
import { FlowbackRowData } from '../types';
import { getNextMonth, useCustomDateHeaders } from './helpers';
import {
	Criteria,
	NodeFormFields,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS,
	TIME_SERIES_INPUT_TABLE_COLUMNS,
	getCriteriaBasedNewRowToolbarOperations,
} from './shared';

const COMPLETION_START_DATE_WINDOW_MESSAGE =
	'Each row assigns consumption rate for completion events that start within the defined date window';
const getFlowbackColumns = (additionalOptions: { customDateHeaders?: Record<string, string> }) => [
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_date_window(COMPLETION_START_DATE_WINDOW_MESSAGE),
	TIME_SERIES_INPUT_TABLE_COLUMNS.flowback_rate,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_criteria,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_criteria_option(additionalOptions),
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.start_value,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_criteria,
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_criteria_option(additionalOptions),
	START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS.end_value,
];

const getNewFlowbackColumn = (rows: FlowbackRowData[]): FlowbackRowData => {
	return {
		flowback_rate: 0,
		start_date_window: rows.length ? getNextMonth(rows[rows.length - 1]?.start_date_window) : START_VALUE,
		start_criteria: 'FPD',
		start_criteria_option: null,
		start_value: 0,
		end_criteria: 'duration',
		end_criteria_option: null,
		end_value: 0,
	};
};

const flowbackToolbarOperations = (rows): ToolbarOperation[] =>
	getCriteriaBasedNewRowToolbarOperations(rows, () => getNewFlowbackColumn(rows));

function FlowbackForm() {
	const customDateHeaders = useCustomDateHeaders();
	const flowbackColumns = useMemo(() => getFlowbackColumns({ customDateHeaders }), [customDateHeaders]);
	const { watch } = useFormContext<NodeFormFields<NetworkShared.NodeType.flowback>>();
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(() => flowbackToolbarOperations(watchedRows), [watchedRows]);

	return (
		<Stack spacing={2}>
			<TimeSeriesInput
				toolbarOperations={memoizedToolbarOperations}
				columnsDef={flowbackColumns}
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

export default FlowbackForm;
