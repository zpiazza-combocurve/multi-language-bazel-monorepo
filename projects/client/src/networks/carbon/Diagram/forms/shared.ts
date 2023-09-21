import type { NetworkShared } from '@combocurve/types/client';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { AbstractColDef, ColDef, ValueFormatterParams, ValueParserParams, ValueSetterParams } from 'ag-grid-community';
import { format as formatDate } from 'date-fns';

import { DASHED_CELL_CLASS_NAME, Editors, getAgGridValueHandler } from '@/components/AgGrid';
import { MenuItem } from '@/components/v2/misc/SelectField';
import { parseKnownDateFormats } from '@/helpers/dates';
import { arrayToRecord, assert } from '@/helpers/utilities';
import ComboboxCellEditor from '@/networks/carbon/ComboboxCellEditor';
import { DETAILED_FUEL_TYPES, START_VALUE } from '@/networks/carbon/shared';

import TimeSeriesInputCellRenderer, { TimeSeriesTableCellRendererTypes } from '../TimeSeriesInputCellRenderer';
import { ToolbarOperation } from '../TimeSeriesInputTable';
import CAPEX_OPTIONS from '../capex-options.json';
import { TimeSeriesInputCommonCriteriaOptions, TimeSeriesTableOperations } from '../types';

const numberParser = (params: ValueParserParams) => {
	const asNumber = Number(params.newValue);
	if (Number.isFinite(asNumber)) return asNumber;
	return params.oldValue;
};

export const headerWithTooltip = (
	text: string,
	message?: string
): {
	headerName: AbstractColDef['headerName'];
	headerTooltip: AbstractColDef['headerTooltip'];
} => {
	return {
		headerName: text,
		headerTooltip: message ?? text,
	};
};

export const TIME_SERIES_OUTPUT_DATE_FORMAT = 'MM/dd/yyyy';
export const TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT = 'MM/dd/yyyy';

const TIME_SERIES_INPUT_NODE_CRITERIAS: MenuItem[] = [
	{
		label: 'Flat',
		value: TimeSeriesInputCommonCriteriaOptions.Flat,
	},
	// {
	// 	label: 'FPD',
	// 	value: PneumaticDeviceCriteriaOptions.FPD,
	// },
	{
		label: 'Dates',
		value: TimeSeriesInputCommonCriteriaOptions.Dates,
	},
];

const STANDARD_PERIOD_COL_DEFS: {
	[key in TimeSeriesInputCommonCriteriaOptions]: Partial<ColDef>;
} = {
	[TimeSeriesInputCommonCriteriaOptions.Flat]: {
		field: 'period',
		...headerWithTooltip('Period'),
		cellEditor: 'numericCellEditor',
		cellRenderer: TimeSeriesInputCellRenderer,
		editable: false,
	},
	[TimeSeriesInputCommonCriteriaOptions.Dates]: {
		field: 'period',
		...headerWithTooltip('Period (MM/DD/YYYY)'),
		cellEditor: Editors.TextEditor,
		cellRenderer: TimeSeriesInputCellRenderer,
		cellRendererParams: {
			type: TimeSeriesTableCellRendererTypes.DateRange,
			helperFormat: TIME_SERIES_OUTPUT_DATE_FORMAT,
		},
		valueFormatter: (params) => {
			const valueAsDate = parseKnownDateFormats(params.value);
			if (valueAsDate) return formatDate(valueAsDate, TIME_SERIES_OUTPUT_DATE_FORMAT);
			return params.value;
		},
		valueParser: (params) => {
			const parsed = parseKnownDateFormats(params.newValue);
			return parsed ? formatDate(parsed, TIME_SERIES_OUTPUT_DATE_FORMAT) : params.newValue;
		},
	},
	[TimeSeriesInputCommonCriteriaOptions.FPD]: {},
};

export const TIME_SERIES_INPUT_TABLE_COLUMNS = {
	// Criteria-based columns
	period: (criteria) => STANDARD_PERIOD_COL_DEFS[criteria],
	// Common columns
	count: {
		field: 'count',
		...headerWithTooltip('Count'),
		valueParser: numberParser,
		cellEditor: 'numericCellEditor',
		cellRenderer: TimeSeriesInputCellRenderer,
	},
	runtime: {
		field: 'runtime',
		...headerWithTooltip('Runtime (HR/Y)'),
		valueParser: numberParser,
		cellEditor: 'numericCellEditor',
		cellRenderer: TimeSeriesInputCellRenderer,
	},
	flowback_rate: {
		field: 'flowback_rate',
		...headerWithTooltip('Flowback Rate (MCF/D)'),
		valueParser: numberParser,
		cellEditor: 'numericCellEditor',
		cellRenderer: TimeSeriesInputCellRenderer,
	},
	consumption_rate: (fuelType, timeUnit) => ({
		field: 'consumption_rate',
		...headerWithTooltip('Consumption Rate'),
		cellEditor: 'numericCellEditor',
		cellRenderer: TimeSeriesInputCellRenderer,
		cellRendererParams: {
			type: TimeSeriesTableCellRendererTypes.Rate,
			rate: DETAILED_FUEL_TYPES[fuelType]?.display_unit
				? `${DETAILED_FUEL_TYPES[fuelType]?.display_unit}/${timeUnit}`
				: '',
		},
	}),
	allocation: {
		field: 'allocation',
		...headerWithTooltip('Allocation'),
		cellEditor: 'numericCellEditor',
		valueFormatter: ({ value }) => (typeof value === 'number' ? `${value}%` : String(value)),
		valueParser: numberParser,
		cellRenderer: TimeSeriesInputCellRenderer,
	},
};

// const TimeSeriesCommonModeMenuItems: MenuItem[] = [
// 	{
// 		label: 'Per Well',
// 		value: TimeSeriesCommonModeOptions.Well,
// 	},
// 	{
// 		label: 'Per Facility',
// 		value: TimeSeriesCommonModeOptions.Facility,
// 	},
// ];

// const pneumaticDeviceStaticDropdownOptions: DropdownOption[] = [
// 	{
// 		name: 'time_series.assigning_mode',
// 		label: 'Assigning Mode',
// 		menuItems: TimeSeriesCommonModeMenuItems,
// 	},
// ];

const TIME_SERIES_INPUT_EDGE_CRITERIAS: MenuItem[] = [
	{ label: 'Flat', value: TimeSeriesInputCommonCriteriaOptions.Flat },
	{
		label: 'Dates',
		value: TimeSeriesInputCommonCriteriaOptions.Dates,
	},
];

const getStandardToolbarOperations = (rows, criteria, getNewRow): ToolbarOperation[] => [
	{
		operationId: TimeSeriesTableOperations.ADD,
		label: 'Row',
		handleOperation: (event, data) => {
			const { getValues, tableRef, setValue } = data;
			assert(tableRef.current, 'tableRef.current is not defined');
			const values = getValues('time_series');
			const newRow = getNewRow(values.criteria as TimeSeriesInputCommonCriteriaOptions, rows);
			setValue('time_series.rows', [...values.rows, newRow]);
		},
		buttonProps: {
			startIcon: faPlus,
			variant: 'outlined',
			color: 'secondary',
			disabled:
				criteria === TimeSeriesInputCommonCriteriaOptions.Flat &&
				rows.length === 1 &&
				'Only one row is allowed for Flat criteria',
		},
	},
	{
		operationId: TimeSeriesTableOperations.DELETE_ROW,
		label: 'Delete',
		handleOperation: (event, data) => {
			const { getValues, tableRef, setValue } = data;
			assert(tableRef.current, 'tableRef.current is not defined');
			const values = getValues('time_series');
			const selectedIndexes = tableRef.current.api.getSelectedNodes().map((node) => node.rowIndex);
			const newRows = values.rows.filter((_, i) => !selectedIndexes.includes(i));
			setValue('time_series.rows', newRows);
		},
		buttonProps: {
			color: 'error',
		},
	},
	{
		operationId: TimeSeriesTableOperations.CLEAR,
		label: 'Clear',
		handleOperation: (event, data) => {
			const { setValue } = data;
			setValue('time_series.rows', []);
		},
	},
];

export const TIME_SERIES_INPUT_STANDARDS = {
	output_date_format: TIME_SERIES_OUTPUT_DATE_FORMAT,
	node: {
		criterias: TIME_SERIES_INPUT_NODE_CRITERIAS,
		toolbar_operations: (rows, criteria, getNewRow) => getStandardToolbarOperations(rows, criteria, getNewRow),
	},
	edge: {
		criterias: TIME_SERIES_INPUT_EDGE_CRITERIAS,
		toolbar_operations: (rows, criteria, getNewRow) => getStandardToolbarOperations(rows, criteria, getNewRow),
	},
};

// **
// Drilling and Completion Section
// **

const DrillingAndCompletionNumberParser = (params: ValueParserParams) => {
	const asNumber = Number(params.newValue);
	if (Number.isFinite(asNumber)) {
		return asNumber;
	}
	return params.oldValue;
};

const DrillingAndCompletionNumberSetter = (params: ValueSetterParams) => {
	if (!params.colDef.field || !params.newValue) return false;
	const asNumber = Number(params.newValue);
	if (Number.isFinite(asNumber)) {
		params.data[params.colDef.field] = params.newValue;
		return true;
	}
	params.data[params.colDef.field] = params.oldValue;
	return false;
};

export enum Criteria {
	FPD = 'FPD',
	schedule = 'schedule',
	headers = 'headers',
	duration = 'duration',
}

const COMMON_CRITERIA_OPTIONS = [Criteria.FPD, Criteria.schedule, Criteria.headers];
const START_CRITERIA_OPTIONS = COMMON_CRITERIA_OPTIONS;
const END_CRITERIA_OPTIONS = [...COMMON_CRITERIA_OPTIONS, Criteria.duration];
const CRITERIA_LABELS: Record<string, string> = {
	[Criteria.FPD]: 'FPD',
	[Criteria.schedule]: 'From Schedule',
	[Criteria.headers]: 'From Headers',
	[Criteria.duration]: 'Duration',
};

export const getCriteriaBasedNewRowToolbarOperations = (rows, getNewRow): ToolbarOperation[] => [
	{
		operationId: TimeSeriesTableOperations.ADD,
		label: 'Row',
		handleOperation: (event, data) => {
			const { getValues, tableRef, setValue } = data;
			assert(tableRef.current, 'tableRef.current is not defined');
			const values = getValues('time_series');
			const newRow = getNewRow(rows);
			setValue('time_series.rows', [...values.rows, newRow]);
		},
		buttonProps: {
			startIcon: faPlus,
			variant: 'outlined',
			color: 'secondary',
			disabled: false,
		},
	},
	{
		operationId: TimeSeriesTableOperations.DELETE_ROW,
		label: 'Delete',
		handleOperation: (event, data) => {
			const { getValues, tableRef, setValue } = data;
			assert(tableRef.current, 'tableRef.current is not defined');
			const values = getValues('time_series');
			const selectedIndexes = tableRef.current.api.getSelectedNodes().map((node) => node.rowIndex);
			const newRows = values.rows.filter((_, i) => !selectedIndexes.includes(i));
			setValue('time_series.rows', newRows);
		},
		buttonProps: {
			color: 'error',
		},
	},
	{
		operationId: TimeSeriesTableOperations.CLEAR,
		label: 'Clear',
		handleOperation: (event, data) => {
			const { setValue } = data;
			setValue('time_series.rows', []);
		},
	},
];

const getCriteriaOptions = (additionalOptions) => ({
	[Criteria.FPD]: [],
	[Criteria.schedule]: CAPEX_OPTIONS.fromSchedule,
	[Criteria.headers]: {
		...CAPEX_OPTIONS.fromHeaders,
		...(additionalOptions.customDateHeaders ?? []),
	},
});

const getComboboxValueHandlers = (field, optionMap) => {
	return {
		valueFormatter: (params: ValueFormatterParams) => {
			if (params.node && !params.column.isCellEditable(params.node)) return '';
			const items = optionMap[params.data[field]] ?? [];
			const valueToLabel = Array.isArray(items) ? arrayToRecord(items, 'value', 'label') : items;
			return valueToLabel[params.value] ?? String(params.value ?? 'Select option');
		},
		valueParser: (params) => {
			const items = optionMap[params.data[field]] ?? [];
			const valueToLabel = Array.isArray(items) ? arrayToRecord(items, 'value', 'label') : items;
			return valueToLabel[params.newValue] ? params.newValue : params.oldValue;
		},
		valueSetter: (params) => {
			const items = optionMap[params.data[field]] ?? [];
			const valueToLabel = Array.isArray(items) ? arrayToRecord(items, 'value', 'label') : items;
			const newValue = valueToLabel[params.newValue] ? params.newValue : params.oldValue;
			params.data[params.colDef.field] = newValue;
			return true;
		},
	};
};

export const START_AND_END_CRITERIA_BASED_TIME_SERIES_INPUT_COLUMNS = {
	start_date_window: (tooltipMessage: string) => ({
		field: 'start_date_window',
		...headerWithTooltip('Start Date Window (MM/DD/YYYY)', tooltipMessage),
		cellEditor: Editors.TextEditor,
		cellRenderer: TimeSeriesInputCellRenderer,
		cellRendererParams: {
			type: TimeSeriesTableCellRendererTypes.DateWindow,
			helperFormat: TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT,
		},
		valueFormatter: (params) => {
			if (params.value === START_VALUE) return params.value;
			const valueAsDate = parseKnownDateFormats(params.value);
			if (valueAsDate) return formatDate(valueAsDate, TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT);
			return params.value;
		},
		valueParser: (params) => {
			if (params.newValue === START_VALUE) return params.newValue;
			const parsed = parseKnownDateFormats(params.newValue);
			return parsed ? formatDate(parsed, TIME_SERIES_OUTPUT_DATE_WINDOW_FORMAT) : params.newValue;
		},
		editable: (params) => {
			return params.data.start_date_window !== START_VALUE;
		},
	}),
	start_criteria: {
		field: 'start_criteria',
		...headerWithTooltip('Start Criteria'),
		cellEditor: ComboboxCellEditor,
		cellEditorParams: { options: START_CRITERIA_OPTIONS },
		...getAgGridValueHandler(CRITERIA_LABELS),
	},
	start_criteria_option: (additionalOptions: Record<string, Record<string, string>>) => ({
		field: 'start_criteria_option',
		...headerWithTooltip('Start Criteria Option'),
		cellEditor: ComboboxCellEditor,
		cellEditorParams: (params) => {
			if (params.data.start_criteria === Criteria.schedule) {
				return { options: Object.keys(CAPEX_OPTIONS.fromSchedule) };
			}
			if (params.data.start_criteria === Criteria.headers) {
				return {
					options: [
						...Object.keys(CAPEX_OPTIONS.fromHeaders),
						...Object.keys(additionalOptions.customDateHeaders),
					],
				};
			}
		},
		editable: (params) =>
			params.data.start_criteria === Criteria.headers || params.data.start_criteria === Criteria.schedule,
		cellClassRules: {
			[DASHED_CELL_CLASS_NAME]: (params) =>
				!(params.data.start_criteria === Criteria.headers || params.data.start_criteria === Criteria.schedule),
		},
		...getComboboxValueHandlers('start_criteria', getCriteriaOptions(additionalOptions)),
	}),
	start_value: {
		field: 'start_value',
		cellEditor: Editors.NumberEditor,
		cellRenderer: TimeSeriesInputCellRenderer,
		...headerWithTooltip('Start Value (Days)'),
		valueSetter: DrillingAndCompletionNumberSetter,
		valueParser: DrillingAndCompletionNumberParser,
		editable: (params) => params.data.start_criteria === Criteria.FPD,
		cellClassRules: {
			[DASHED_CELL_CLASS_NAME]: (params) => params.data.start_criteria !== Criteria.FPD,
		},
	},
	end_criteria: {
		field: 'end_criteria',
		...headerWithTooltip('End Criteria'),
		cellEditor: ComboboxCellEditor,
		cellEditorParams: { options: END_CRITERIA_OPTIONS },
		...getAgGridValueHandler(CRITERIA_LABELS),
	},
	end_criteria_option: (additionalOptions: Record<string, Record<string, string>>) => ({
		field: 'end_criteria_option',
		...headerWithTooltip('End Criteria Option'),
		cellEditor: ComboboxCellEditor,
		cellEditorParams: (params) => {
			if (params.data.end_criteria === Criteria.schedule) {
				return { options: Object.keys(CAPEX_OPTIONS.fromSchedule) };
			}
			if (params.data.end_criteria === Criteria.headers) {
				return {
					options: [
						...Object.keys(CAPEX_OPTIONS.fromHeaders),
						...Object.keys(additionalOptions.customDateHeaders),
					],
				};
			}
		},
		editable: (params) =>
			params.data.end_criteria === Criteria.headers || params.data.end_criteria === Criteria.schedule,
		cellClassRules: {
			[DASHED_CELL_CLASS_NAME]: (params) =>
				!(params.data.end_criteria === Criteria.headers || params.data.end_criteria === Criteria.schedule),
		},
		...getComboboxValueHandlers('end_criteria', getCriteriaOptions(additionalOptions)),
	}),
	end_value: {
		field: 'end_value',
		cellEditor: Editors.NumberEditor,
		cellRenderer: TimeSeriesInputCellRenderer,
		...headerWithTooltip('End Value (Days)'),
		valueSetter: DrillingAndCompletionNumberSetter,
		valueParser: DrillingAndCompletionNumberParser,
		editable: (params) =>
			params.data.end_criteria === Criteria.FPD || params.data.end_criteria === Criteria.duration,
		cellClassRules: {
			[DASHED_CELL_CLASS_NAME]: (params) =>
				params.data.end_criteria !== Criteria.FPD && params.data.end_criteria !== Criteria.duration,
		},
	},
};

export type NodeFormFields<T extends NetworkShared.NodeType> = Pick<
	NetworkShared.NodeByTypeMap[T],
	'name' | 'description'
> &
	NetworkShared.NodeByTypeMap[T]['params'];
