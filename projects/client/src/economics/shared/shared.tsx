import { ValueFormatterParams } from 'ag-grid-community';
import { parse } from 'date-fns';
import { produce } from 'immer';
import { flatMap, map } from 'lodash-es';
import { useMutation } from 'react-query';

import { NUMBER_CELL_CLASS_NAME, defaultValueFormatter } from '@/components/AgGrid';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@/components/v2';
import { useEconSettings } from '@/economics/EconSettingsDialog/useEconSettings';
import {
	AGG_CASHFLOW_PDF_EXPORT_TYPE,
	CUSTOM_PDF_REPORT_EXPORT_TYPE,
	ECON_CSV_REPORT_TYPE_OPTIONS,
	ECON_PDF_REPORT_TYPE_OPTIONS,
	GHG_CSV_REPORT_TYPE_OPTIONS,
	REPORT_TYPE_OPTIONS_WITH_ECON_CSV,
	WELL_CARBON_REPORT_CSV_EXPORT_TYPE,
	WELL_CASHFLOW_PDF_EXPORT_TYPE,
} from '@/economics/Economics/shared/constants';
import { LastRunSummaryQuery } from '@/economics/shared/queries';
import { DialogProps } from '@/helpers/dialog';
import { postApi } from '@/helpers/routing';
import { local } from '@/helpers/storage';
import { formatNumber } from '@/helpers/utilities';
import { fields as wellHeaders } from '@/inpt-shared/display-templates/wells/well_headers.json';

export function isPDFReport(reportType: string) {
	return Object.keys(ECON_PDF_REPORT_TYPE_OPTIONS).includes(reportType);
}

export function isGHGReport(reportType: string) {
	return Object.keys(GHG_CSV_REPORT_TYPE_OPTIONS).includes(reportType);
}

export function isEconCSVReport(reportType: string) {
	return Object.keys(ECON_CSV_REPORT_TYPE_OPTIONS).includes(reportType);
}

export const RESERVES_CATEGORY = 'res_cat';
export const NUMBER_TYPE_TO_USE = 'small-number';
export const groupingHeadersNames = {
	...wellHeaders,
	[RESERVES_CATEGORY]: 'Reserves Category',
	econ_group: 'Econ Group',
};

export const outputAgGridSidebar = (toolPanelParams = {}) => ({
	toolPanels: [
		{
			id: 'columns',
			labelDefault: 'Columns',
			labelKey: 'columns',
			iconKey: 'columns',
			toolPanel: 'agColumnsToolPanel',
			toolPanelParams: {
				suppressPivotMode: true,
				...toolPanelParams,
			},
		},
	],
});

const OUTPUT_FIELD_DEFAULT_AGGREGATION_FUNCTION = 'sum';
const OUTPUT_FIELD_AGGREGATION_FUNCTION = {
	gross_oil_well_head_volume: 'sum',
	gross_gas_well_head_volume: 'sum',
	gross_boe_well_head_volume: 'sum',
	gross_mcfe_well_head_volume: 'sum',
	gross_water_well_head_volume: 'sum',
	gross_oil_sales_volume: 'sum',
	gross_gas_sales_volume: 'sum',
	gross_ngl_sales_volume: 'sum',
	gross_drip_condensate_sales_volume: 'sum',
	gross_boe_sales_volume: 'sum',
	gross_mcfe_sales_volume: 'sum',
	wi_oil: 'avg',
	wi_gas: 'avg',
	wi_ngl: 'avg',
	wi_drip_condensate: 'avg',
	nri_oil: 'avg',
	nri_gas: 'avg',
	nri_ngl: 'avg',
	nri_drip_condensate: 'avg',
	lease_nri: 'avg',
	wi_oil_sales_volume: 'sum',
	wi_gas_sales_volume: 'sum',
	wi_ngl_sales_volume: 'sum',
	wi_drip_condensate_sales_volume: 'sum',
	wi_boe_sales_volume: 'sum',
	wi_mcfe_sales_volume: 'sum',
	net_oil_sales_volume: 'sum',
	net_gas_sales_volume: 'sum',
	net_ngl_sales_volume: 'sum',
	net_drip_condensate_sales_volume: 'sum',
	net_boe_sales_volume: 'sum',
	net_mcfe_sales_volume: 'sum',
	ngl_yield: 'avg',
	drip_condensate_yield: 'avg',
	oil_shrinkage: 'avg',
	gas_shrinkage: 'avg',
	oil_loss: 'avg',
	gas_loss: 'avg',
	gas_flare: 'avg',
	unshrunk_gas_btu: 'avg',
	shrunk_gas_btu: 'avg',
	input_oil_price: 'avg',
	input_gas_price: 'avg',
	input_ngl_price: 'avg',
	input_drip_condensate_price: 'avg',
	oil_differentials_1: 'avg',
	gas_differentials_1: 'avg',
	ngl_differentials_1: 'avg',
	drip_condensate_differentials_1: 'avg',
	oil_differentials_2: 'avg',
	gas_differentials_2: 'avg',
	ngl_differentials_2: 'avg',
	drip_condensate_differentials_2: 'avg',
	oil_price: 'avg',
	gas_price: 'avg',
	ngl_price: 'avg',
	drip_condensate_price: 'avg',
	oil_revenue: 'sum',
	gas_revenue: 'sum',
	ngl_revenue: 'sum',
	drip_condensate_revenue: 'sum',
	total_revenue: 'sum',
	oil_gathering_expense: 'sum',
	oil_processing_expense: 'sum',
	oil_transportation_expense: 'sum',
	oil_marketing_expense: 'sum',
	oil_other_expense: 'sum',
	total_oil_variable_expense: 'sum',
	gas_gathering_expense: 'sum',
	gas_processing_expense: 'sum',
	gas_transportation_expense: 'sum',
	gas_marketing_expense: 'sum',
	gas_other_expense: 'sum',
	total_gas_variable_expense: 'sum',
	ngl_gathering_expense: 'sum',
	ngl_processing_expense: 'sum',
	ngl_transportation_expense: 'sum',
	ngl_marketing_expense: 'sum',
	ngl_other_expense: 'sum',
	total_ngl_variable_expense: 'sum',
	drip_condensate_gathering_expense: 'sum',
	drip_condensate_processing_expense: 'sum',
	drip_condensate_transportation_expense: 'sum',
	drip_condensate_marketing_expense: 'sum',
	drip_condensate_other_expense: 'sum',
	total_drip_condensate_variable_expense: 'sum',
	water_disposal: 'sum',
	total_variable_expense: 'sum',
	monthly_well_cost: 'sum',
	other_monthly_cost_1: 'sum',
	other_monthly_cost_2: 'sum',
	total_fixed_expense: 'sum',
	total_expense: 'sum',
	oil_severance_tax: 'sum',
	gas_severance_tax: 'sum',
	ngl_severance_tax: 'sum',
	drip_condensate_severance_tax: 'sum',
	total_severance_tax: 'sum',
	ad_valorem_tax: 'sum',
	total_production_tax: 'sum',
	tangible_drilling: 'sum',
	intangible_drilling: 'sum',
	net_profit: 'sum',
	net_income: 'sum',
	first_discount_net_income: 'sum',
	second_discount_net_income: 'sum',
	total_drilling: 'sum',
	tangible_completion: 'sum',
	intangible_completion: 'sum',
	total_completion: 'sum',
	tangible_legal: 'sum',
	intangible_legal: 'sum',
	total_legal: 'sum',
	tangible_pad: 'sum',
	intangible_pad: 'sum',
	total_pad: 'sum',
	tangible_facilities: 'sum',
	intangible_facilities: 'sum',
	total_facilities: 'sum',
	tangible_artificial_lift: 'sum',
	intangible_artificial_lift: 'sum',
	total_artificial_lift: 'sum',
	tangible_workover: 'sum',
	intangible_workover: 'sum',
	total_workover: 'sum',
	tangible_leasehold: 'sum',
	intangible_leasehold: 'sum',
	total_leasehold: 'sum',
	tangible_development: 'sum',
	intangible_development: 'sum',
	total_development: 'sum',
	tangible_pipelines: 'sum',
	intangible_pipelines: 'sum',
	total_pipelines: 'sum',
	tangible_exploration: 'sum',
	intangible_exploration: 'sum',
	total_exploration: 'sum',
	tangible_waterline: 'sum',
	intangible_waterline: 'sum',
	total_waterline: 'sum',
	tangible_appraisal: 'sum',
	intangible_appraisal: 'sum',
	total_appraisal: 'sum',
	tangible_other_investment: 'sum',
	intangible_other_investment: 'sum',
	total_other_investment: 'sum',
	tangible_abandonment: 'sum',
	intangible_abandonment: 'sum',
	total_abandonment: 'sum',
	tangible_salvage: 'sum',
	intangible_salvage: 'sum',
	total_salvage: 'sum',
	total_tangible_capex: 'sum',
	total_intangible_capex: 'sum',
	total_capex: 'sum',
	first_discounted_capex: 'sum',
	second_discounted_capex: 'sum',
	total_gross_capex: 'sum',
	before_income_tax_cash_flow: 'sum',
	first_discount_cash_flow: 'sum',
	second_discount_cash_flow: 'sum',
	depreciation: 'sum',
	taxable_income: 'sum',
	state_tax_rate: 'avg',
	federal_tax_rate: 'avg',
	after_income_tax_cash_flow: 'sum',
	well_life: 'avg',
	oil_risk: 'avg',
	gas_risk: 'avg',
	ngl_risk: 'avg',
	drip_condensate_risk: 'avg',
	water_risk: 'avg',
	oil_tc_risk: 'avg',
	gas_tc_risk: 'avg',
	water_tc_risk: 'avg',
	oil_boe_conversion: 'avg',
	wet_gas_boe_conversion: 'avg',
	dry_gas_boe_conversion: 'avg',
	ngl_boe_conversion: 'avg',
	drip_condensate_boe_conversion: 'avg',
	oil_production_as_of_date: 'sum',
	gas_production_as_of_date: 'sum',
	water_production_as_of_date: 'sum',
	undiscounted_roi: 'avg',
	first_discount_roi: 'avg',
	second_discount_roi: 'avg',
	first_discount_roi_undiscounted_capex: 'avg',
	second_discount_roi_undiscounted_capex: 'avg',
	irr: 'avg',
	payout_duration: 'avg',
	first_discount_payout_duration: 'avg',
	second_discount_payout_duration: 'avg',
	gor: 'avg',
	wor: 'avg',
	water_cut: 'avg',
	oil_breakeven: 'avg',
	gas_breakeven: 'avg',
	original_wi_oil: 'avg',
	original_wi_gas: 'avg',
	original_wi_ngl: 'avg',
	original_wi_drip_condensate: 'avg',
	original_nri_oil: 'avg',
	original_nri_gas: 'avg',
	original_nri_ngl: 'avg',
	original_nri_drip_condensate: 'avg',
	consecutive_negative_cash_flow_month_count: 'avg',
	total_negative_cash_flow_month_count: 'avg',
	one_month_gross_oil_well_head_volume: 'sum',
	three_month_gross_oil_well_head_volume: 'sum',
	six_month_gross_oil_well_head_volume: 'sum',
	one_year_gross_oil_well_head_volume: 'sum',
	two_year_gross_oil_well_head_volume: 'sum',
	three_year_gross_oil_well_head_volume: 'sum',
	five_year_gross_oil_well_head_volume: 'sum',
	ten_year_gross_oil_well_head_volume: 'sum',
	one_month_gross_oil_sales_volume: 'sum',
	three_month_gross_oil_sales_volume: 'sum',
	six_month_gross_oil_sales_volume: 'sum',
	one_year_gross_oil_sales_volume: 'sum',
	two_year_gross_oil_sales_volume: 'sum',
	three_year_gross_oil_sales_volume: 'sum',
	five_year_gross_oil_sales_volume: 'sum',
	ten_year_gross_oil_sales_volume: 'sum',
	one_month_wi_oil_sales_volume: 'sum',
	three_month_wi_oil_sales_volume: 'sum',
	six_month_wi_oil_sales_volume: 'sum',
	one_year_wi_oil_sales_volume: 'sum',
	two_year_wi_oil_sales_volume: 'sum',
	three_year_wi_oil_sales_volume: 'sum',
	five_year_wi_oil_sales_volume: 'sum',
	ten_year_wi_oil_sales_volume: 'sum',
	one_month_net_oil_sales_volume: 'sum',
	three_month_net_oil_sales_volume: 'sum',
	six_month_net_oil_sales_volume: 'sum',
	one_year_net_oil_sales_volume: 'sum',
	two_year_net_oil_sales_volume: 'sum',
	three_year_net_oil_sales_volume: 'sum',
	five_year_net_oil_sales_volume: 'sum',
	ten_year_net_oil_sales_volume: 'sum',
	one_month_gross_gas_well_head_volume: 'sum',
	three_month_gross_gas_well_head_volume: 'sum',
	six_month_gross_gas_well_head_volume: 'sum',
	one_year_gross_gas_well_head_volume: 'sum',
	two_year_gross_gas_well_head_volume: 'sum',
	three_year_gross_gas_well_head_volume: 'sum',
	five_year_gross_gas_well_head_volume: 'sum',
	ten_year_gross_gas_well_head_volume: 'sum',
	one_month_gross_gas_sales_volume: 'sum',
	three_month_gross_gas_sales_volume: 'sum',
	six_month_gross_gas_sales_volume: 'sum',
	one_year_gross_gas_sales_volume: 'sum',
	two_year_gross_gas_sales_volume: 'sum',
	three_year_gross_gas_sales_volume: 'sum',
	five_year_gross_gas_sales_volume: 'sum',
	ten_year_gross_gas_sales_volume: 'sum',
	one_month_wi_gas_sales_volume: 'sum',
	three_month_wi_gas_sales_volume: 'sum',
	six_month_wi_gas_sales_volume: 'sum',
	one_year_wi_gas_sales_volume: 'sum',
	two_year_wi_gas_sales_volume: 'sum',
	three_year_wi_gas_sales_volume: 'sum',
	five_year_wi_gas_sales_volume: 'sum',
	ten_year_wi_gas_sales_volume: 'sum',
	one_month_net_gas_sales_volume: 'sum',
	three_month_net_gas_sales_volume: 'sum',
	six_month_net_gas_sales_volume: 'sum',
	one_year_net_gas_sales_volume: 'sum',
	two_year_net_gas_sales_volume: 'sum',
	three_year_net_gas_sales_volume: 'sum',
	five_year_net_gas_sales_volume: 'sum',
	ten_year_net_gas_sales_volume: 'sum',
	one_month_gross_boe_well_head_volume: 'sum',
	three_month_gross_boe_well_head_volume: 'sum',
	six_month_gross_boe_well_head_volume: 'sum',
	one_year_gross_boe_well_head_volume: 'sum',
	two_year_gross_boe_well_head_volume: 'sum',
	three_year_gross_boe_well_head_volume: 'sum',
	five_year_gross_boe_well_head_volume: 'sum',
	ten_year_gross_boe_well_head_volume: 'sum',
	one_month_gross_boe_sales_volume: 'sum',
	three_month_gross_boe_sales_volume: 'sum',
	six_month_gross_boe_sales_volume: 'sum',
	one_year_gross_boe_sales_volume: 'sum',
	two_year_gross_boe_sales_volume: 'sum',
	three_year_gross_boe_sales_volume: 'sum',
	five_year_gross_boe_sales_volume: 'sum',
	ten_year_gross_boe_sales_volume: 'sum',
	one_month_wi_boe_sales_volume: 'sum',
	three_month_wi_boe_sales_volume: 'sum',
	six_month_wi_boe_sales_volume: 'sum',
	one_year_wi_boe_sales_volume: 'sum',
	two_year_wi_boe_sales_volume: 'sum',
	three_year_wi_boe_sales_volume: 'sum',
	five_year_wi_boe_sales_volume: 'sum',
	ten_year_wi_boe_sales_volume: 'sum',
	one_month_net_boe_sales_volume: 'sum',
	three_month_net_boe_sales_volume: 'sum',
	six_month_net_boe_sales_volume: 'sum',
	one_year_net_boe_sales_volume: 'sum',
	two_year_net_boe_sales_volume: 'sum',
	three_year_net_boe_sales_volume: 'sum',
	five_year_net_boe_sales_volume: 'sum',
	ten_year_net_boe_sales_volume: 'sum',
	one_month_gross_ngl_sales_volume: 'sum',
	three_month_gross_ngl_sales_volume: 'sum',
	six_month_gross_ngl_sales_volume: 'sum',
	one_year_gross_ngl_sales_volume: 'sum',
	two_year_gross_ngl_sales_volume: 'sum',
	three_year_gross_ngl_sales_volume: 'sum',
	five_year_gross_ngl_sales_volume: 'sum',
	ten_year_gross_ngl_sales_volume: 'sum',
	one_month_wi_ngl_sales_volume: 'sum',
	three_month_wi_ngl_sales_volume: 'sum',
	six_month_wi_ngl_sales_volume: 'sum',
	one_year_wi_ngl_sales_volume: 'sum',
	two_year_wi_ngl_sales_volume: 'sum',
	three_year_wi_ngl_sales_volume: 'sum',
	five_year_wi_ngl_sales_volume: 'sum',
	ten_year_wi_ngl_sales_volume: 'sum',
	one_month_net_ngl_sales_volume: 'sum',
	three_month_net_ngl_sales_volume: 'sum',
	six_month_net_ngl_sales_volume: 'sum',
	one_year_net_ngl_sales_volume: 'sum',
	two_year_net_ngl_sales_volume: 'sum',
	three_year_net_ngl_sales_volume: 'sum',
	five_year_net_ngl_sales_volume: 'sum',
	ten_year_net_ngl_sales_volume: 'sum',
	one_month_gross_water_well_head_volume: 'sum',
	three_month_gross_water_well_head_volume: 'sum',
	six_month_gross_water_well_head_volume: 'sum',
	one_year_gross_water_well_head_volume: 'sum',
	two_year_gross_water_well_head_volume: 'sum',
	three_year_gross_water_well_head_volume: 'sum',
	five_year_gross_water_well_head_volume: 'sum',
	ten_year_gross_water_well_head_volume: 'sum',
	one_month_gross_drip_condensate_sales_volume: 'sum',
	three_month_gross_drip_condensate_sales_volume: 'sum',
	six_month_gross_drip_condensate_sales_volume: 'sum',
	one_year_gross_drip_condensate_sales_volume: 'sum',
	two_year_gross_drip_condensate_sales_volume: 'sum',
	three_year_gross_drip_condensate_sales_volume: 'sum',
	five_year_gross_drip_condensate_sales_volume: 'sum',
	ten_year_gross_drip_condensate_sales_volume: 'sum',
	one_month_wi_drip_condensate_sales_volume: 'sum',
	three_month_wi_drip_condensate_sales_volume: 'sum',
	six_month_wi_drip_condensate_sales_volume: 'sum',
	one_year_wi_drip_condensate_sales_volume: 'sum',
	two_year_wi_drip_condensate_sales_volume: 'sum',
	three_year_wi_drip_condensate_sales_volume: 'sum',
	five_year_wi_drip_condensate_sales_volume: 'sum',
	ten_year_wi_drip_condensate_sales_volume: 'sum',
	one_month_net_drip_condensate_sales_volume: 'sum',
	three_month_net_drip_condensate_sales_volume: 'sum',
	six_month_net_drip_condensate_sales_volume: 'sum',
	one_year_net_drip_condensate_sales_volume: 'sum',
	two_year_net_drip_condensate_sales_volume: 'sum',
	three_year_net_drip_condensate_sales_volume: 'sum',
	five_year_net_drip_condensate_sales_volume: 'sum',
	ten_year_net_drip_condensate_sales_volume: 'sum',
	last_one_month_oil_average: 'sum',
	last_three_month_oil_average: 'sum',
	last_one_month_gas_average: 'sum',
	last_three_month_gas_average: 'sum',
	last_one_month_boe_average: 'sum',
	last_three_month_boe_average: 'sum',
	last_one_month_mcfe_average: 'sum',
	last_three_month_mcfe_average: 'sum',
	last_one_month_water_average: 'sum',
	last_three_month_water_average: 'sum',
	discount_table_cash_flow_1: 'sum',
	discount_table_cash_flow_2: 'sum',
	discount_table_cash_flow_3: 'sum',
	discount_table_cash_flow_4: 'sum',
	discount_table_cash_flow_5: 'sum',
	discount_table_cash_flow_6: 'sum',
	discount_table_cash_flow_7: 'sum',
	discount_table_cash_flow_8: 'sum',
	discount_table_cash_flow_9: 'sum',
	discount_table_cash_flow_10: 'sum',
	discount_table_cash_flow_11: 'sum',
	discount_table_cash_flow_12: 'sum',
	discount_table_cash_flow_13: 'sum',
	discount_table_cash_flow_14: 'sum',
	discount_table_cash_flow_15: 'sum',
	discount_table_cash_flow_16: 'sum',
	oil_well_head_eur: 'sum',
	gas_well_head_eur: 'sum',
	water_well_head_eur: 'sum',
	oil_shrunk_eur: 'sum',
	gas_shrunk_eur: 'sum',
	ngl_shrunk_eur: 'sum',
	drip_condensate_shrunk_eur: 'sum',
	oil_well_head_eur_over_pll: 'avg',
	gas_well_head_eur_over_pll: 'avg',
	water_well_head_eur_over_pll: 'avg',
	oil_shrunk_eur_over_pll: 'avg',
	gas_shrunk_eur_over_pll: 'avg',
	ngl_shrunk_eur_over_pll: 'avg',
	drip_condensate_shrunk_eur_over_pll: 'avg',
	tangible_depreciation: 'sum',
	intangible_depreciation: 'sum',
	depletion: 'sum',
	tangible_depletion: 'sum',
	intangible_depletion: 'sum',
	percentage_depletion: 'sum',
	total_deduction: 'sum',
	afit_first_discount_cash_flow: 'sum',
	afit_second_discount_cash_flow: 'sum',
	tax_credit: 'sum',
};

export const CUMULATIVE_FIELD_PREFIX = 'cum_';

export const econOutputDefaultValueFormatter = (
	params: ValueFormatterParams,
	items?: { value: string; label: string }[]
) => {
	const value = params.value;
	if (value == null) {
		return value;
	}

	if (params.column.getColDef().type === NUMBER_TYPE_TO_USE) {
		return formatNumber(value, 3);
	}

	return defaultValueFormatter(params, items);
};

export const getOutputFieldAggregationFunction = (field: string): string => {
	const fromDict = OUTPUT_FIELD_AGGREGATION_FUNCTION[field];
	return fromDict
		? fromDict
		: field.startsWith(CUMULATIVE_FIELD_PREFIX)
		? 'last'
		: OUTPUT_FIELD_DEFAULT_AGGREGATION_FUNCTION;
};

export const commonColDefFields = {
	valueFormatter: econOutputDefaultValueFormatter,
	resizable: true,
	sortable: true,
	width: 200,
	cellClassRules: {
		[NUMBER_CELL_CLASS_NAME]: (params) => params.colDef.type === NUMBER_TYPE_TO_USE,
	},
};

export const autoGroupColumnDef = {
	pinned: true,
	valueFormatter: econOutputDefaultValueFormatter,
	width: 200,
	resizable: true,
};

export const BASIC_OUTPUT_ONELINER_HEADERS = [
	{
		...commonColDefFields,
		field: 'econ_group',
		headerName: 'Econ Group',
		pinned: true,
		filter: true,
	},
	{
		...commonColDefFields,
		field: 'well_name',
		headerName: 'Well Name',
		pinned: true,
		filter: true,
	},
	{
		...commonColDefFields,
		field: 'well_number',
		headerName: 'Well Number',
		pinned: true,
		filter: true,
	},
];

export const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

/**
 * @example
 * 	getMonthIndex('2010-08-01'); // 7
 */
export function getMonthIndex(month: string) {
	return parse(month, 'yyyy-MM-dd', new Date()).getMonth();
}

export function getRows(output: Inpt.EconRun['outputGroups']['all']) {
	/** List of months and years */
	const yearsMonths = {};
	output?.[0].years.forEach(({ year, months }) => {
		yearsMonths[year] = months.map((m) => getMonthIndex(m as string)); // first one is string
	});

	/** Grouped by year/month/header, original is in header/year/month */
	const entries = {} as Record<string, Record<string, Record<string, string | number>>>;

	output.forEach((header) => {
		header.years.forEach((year) => {
			year.months.forEach((month, index) => {
				entries[year.year] ??= {};
				entries[year.year][index] ??= { monthIndex: yearsMonths[year.year][index] };
				entries[year.year][index][header.key] = month;
			});
		});
	}, []);

	const flatOutput = flatMap(entries, (yearData, year) =>
		map(yearData, (month) => {
			return {
				...month,
				year,
				quarter: quarterNames[Math.floor(parseInt(month.monthIndex.toString()) / 3)],
				month: monthNames[parseInt(month.monthIndex.toString())],
				_key: `${year}-${month.monthIndex}`,
			};
		})
	);
	return flatOutput;
}

export const fileNameMap = {
	...REPORT_TYPE_OPTIONS_WITH_ECON_CSV,
	error: 'Economics Run Error',
	oneLiner: 'Well Oneline',
	'cashflow-csv': 'Well Cash Flow',
	'cashflow-agg-csv': 'Aggregate Cash Flow',
	[WELL_CARBON_REPORT_CSV_EXPORT_TYPE]: 'Well Carbon Report',
	[AGG_CASHFLOW_PDF_EXPORT_TYPE]: 'Econ Report',
	[WELL_CASHFLOW_PDF_EXPORT_TYPE]: 'Well Econ Report',
	[CUSTOM_PDF_REPORT_EXPORT_TYPE]: 'Custom PDF Report',
};

export function EconErrorDialog({ visible, onHide, resolve }: DialogProps<boolean>) {
	return (
		<Dialog open={visible} onClose={onHide}>
			<DialogTitle>No Available Group Econ Result</DialogTitle>
			<DialogContent>
				Either all wells encountered an error or the aggregation date was after all econ limits. Download the
				monthly file for more details
			</DialogContent>
			<DialogActions>
				<Button onClick={onHide}>Cancel</Button>
				<Button color='primary' onClick={() => resolve(true)} variant='contained'>
					Download
				</Button>
			</DialogActions>
		</Dialog>
	);
}

const DISCOUNT_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const MONTHLY_COLS = [
	'gross_oil_well_head_volume',
	'gross_gas_well_head_volume',
	'gross_boe_well_head_volume',
	'net_oil_sales_volume',
	'net_gas_sales_volume',
	'net_ngl_sales_volume',
	'oil_price',
	'gas_price',
	'ngl_price',
	'oil_revenue',
	'gas_revenue',
	'ngl_revenue',
	'total_revenue',
	'total_expense',
	'total_severance_tax',
	'ad_valorem_tax',
	'total_capex',
	'net_profit',
	'before_income_tax_cash_flow',
	'first_discount_cash_flow',
	'state_tax_rate',
	'federal_tax_rate',
];

export const addColumnForPDF = (columns) => {
	// the following columns are needed for well PDF generation
	const addOneLiner = DISCOUNT_NUMBERS.map((x) => `discount_table_cash_flow_${x}`);
	addOneLiner.push('original_wi_oil');
	addOneLiner.push('as_of_date');
	addOneLiner.push('discount_date');

	const newColumns = produce(columns, (draft) => {
		draft.forEach((col) => {
			if (MONTHLY_COLS.includes(col.key)) {
				col.selected_options.monthly = true;
			} else if (addOneLiner.includes(col.key)) {
				col.selected_options.one_liner = true;
			}
		});
	});

	return newColumns;
};

export function useQuickEconRunMutation() {
	const { settings: allSettings, currentSetting, loading, loadingSettings } = useEconSettings();

	return {
		runEconomicsMutation: useMutation(
			async ({ settings, scenarioId, wellAssignments }: { settings?; scenarioId; wellAssignments }) => {
				const body = {
					scenarioId,
					scenarioWellAssignmentIds: wellAssignments.map(({ _id }) => _id),
					columns: addColumnForPDF((settings ?? currentSetting).columns),
				};

				const { error, ...rest } = await postApi(`/economics/runSingleWellEcon`, body);

				if (error) {
					throw error;
				}

				LastRunSummaryQuery.invalidate(scenarioId);

				return rest;
			}
		),
		loading: loading || loadingSettings,
		settings: allSettings,
	};
}

export const ECON_RUN_CHECKED_SETTINGS = 'ECON_RUN_CHECKED_SETTINGS';
export const ECON_RUN_OUTPUT_ONELINER_TABLE_COLUMN_ORDER = 'ECON_RUN_OUTPUT_ONELINER_TABLE_COLUMN_ORDER';
export const ECON_RUN_OUTPUT_ONELINER_TABLE_GROUP_CACHE = 'ECON_RUN_OUTPUT_ONELINER_TABLE_GROUP_CACHE';
export const ECON_RUN_OUTPUT_MONTHLY_TABLE_COLUMN_ORDER = 'ECON_RUN_OUTPUT_MONTHLY_TABLE_COLUMN_ORDER';
export const ECON_RUN_OUTPUT_MONTHLY_TABLE_GROUP_CACHE = 'ECON_RUN_OUTPUT_MONTHLY_TABLE_GROUP_CACHE';
export const ECON_RUN_CACHE_RESET_FLAG = 'ECON_RUN_CACHE_RESET_FLAG';

export const clearEconRunOutputCache = () => {
	local.setItem(ECON_RUN_OUTPUT_ONELINER_TABLE_COLUMN_ORDER, {});
	local.setItem(ECON_RUN_OUTPUT_ONELINER_TABLE_GROUP_CACHE, []);
	local.setItem(ECON_RUN_OUTPUT_MONTHLY_TABLE_COLUMN_ORDER, {});
	local.setItem(ECON_RUN_OUTPUT_MONTHLY_TABLE_GROUP_CACHE, []);
};
