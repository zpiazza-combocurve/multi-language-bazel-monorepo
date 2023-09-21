import { NetworkShared } from '@combocurve/types/client';
import { Divider } from '@material-ui/core';
import { ColDef } from 'ag-grid-community';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { getAgGridValueHandler } from '@/components/AgGrid';
import { AssumptionKey } from '@/inpt-shared/constants';
import ComboboxCellEditor from '@/networks/carbon/ComboboxCellEditor';
import { DEVICE_TYPE_LABELS, DEVICE_TYPE_LIST } from '@/networks/carbon/shared';
import { PneumaticDeviceType } from '@/networks/carbon/types';

import { FluidModelAccordionItem } from '../EditNodeDialog';
import TimeSeriesInput, { ToolbarOperation } from '../TimeSeriesInputTable';
import { PneumaticDeviceRowData, TimeSeriesInputCommonCriteriaOptions } from '../types';
import { getNextMonth } from './helpers';
import {
	NodeFormFields,
	TIME_SERIES_INPUT_STANDARDS,
	TIME_SERIES_INPUT_TABLE_COLUMNS,
	headerWithTooltip,
} from './shared';

const PNEUMATIC_DEVICE_COMMON_FIXED_VALUES = {
	count: 0,
	runtime: 8760,
	device_type: PneumaticDeviceType.highBleed,
};
const getNewPneumaticDeviceRow = (
	criteria: TimeSeriesInputCommonCriteriaOptions,
	rows: PneumaticDeviceRowData[]
): PneumaticDeviceRowData => {
	switch (criteria) {
		case TimeSeriesInputCommonCriteriaOptions.FPD:
			return {
				...PNEUMATIC_DEVICE_COMMON_FIXED_VALUES,
				period: 1,
			};
		case TimeSeriesInputCommonCriteriaOptions.Dates:
			return {
				...PNEUMATIC_DEVICE_COMMON_FIXED_VALUES,
				period:
					getNextMonth(
						// @ts-expect-error TODO fix this
						rows[rows.length - 1]?.period
					) ?? null,
			};

		case TimeSeriesInputCommonCriteriaOptions.Flat:
			return {
				...PNEUMATIC_DEVICE_COMMON_FIXED_VALUES,
				period: 'Flat',
			};

		default:
			throw new Error(`Invalid criteria: ${criteria}`);
	}
};

const pneumaticDeviceToolbarOperations = (rows, criteria): ToolbarOperation[] =>
	TIME_SERIES_INPUT_STANDARDS.node.toolbar_operations(rows, criteria, () => getNewPneumaticDeviceRow(criteria, rows));

const DEVICE_TYPE_COLUMN: ColDef = {
	field: 'device_type',
	...headerWithTooltip('Device Type'),
	cellEditor: ComboboxCellEditor,
	cellEditorParams: {
		options: DEVICE_TYPE_LIST,
	},
	...getAgGridValueHandler(
		Object.keys(DEVICE_TYPE_LABELS).map((key) => ({ value: key, label: DEVICE_TYPE_LABELS[key] }))
	),
};

const getPneumaticDeviceColumns = (criteriaOption: TimeSeriesInputCommonCriteriaOptions): ColDef[] => [
	TIME_SERIES_INPUT_TABLE_COLUMNS.period(criteriaOption),
	TIME_SERIES_INPUT_TABLE_COLUMNS.count,
	TIME_SERIES_INPUT_TABLE_COLUMNS.runtime,
	DEVICE_TYPE_COLUMN,
];

function PneumaticDeviceForm() {
	const { watch, setValue } = useFormContext<NodeFormFields<NetworkShared.NodeType.pneumatic_device>>();
	const watchedCriteria = watch('time_series.criteria');
	const watchedRows = watch('time_series.rows');

	const memoizedToolbarOperations = useMemo(
		() => pneumaticDeviceToolbarOperations(watchedRows, watchedCriteria),
		[watchedRows, watchedCriteria]
	);

	const memoizedColumns = useMemo(() => getPneumaticDeviceColumns(watchedCriteria), [watchedCriteria]);

	const handleCriteriaChange = useCallback(
		(value) => {
			setValue('time_series.criteria', value);
			setValue('time_series.rows', [getNewPneumaticDeviceRow(value, [])]);
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

export default PneumaticDeviceForm;
