import { fields as ECON_COLUMNS } from '@/inpt-shared/display-templates/general/economics_columns.json';
import { fields as WELL_HEADERS_TYPES } from '@/inpt-shared/display-templates/wells/well_header_types.json';
import { fields as WELL_HEADERS } from '@/inpt-shared/display-templates/wells/well_headers.json';

import { CSVExportTemplate, SuggestedTemplateSymbol } from '../../exports/CSVExportDialog/types';

export const EMPTY_TEMPLATE: Required<CSVExportTemplate> & { _id: string; [SuggestedTemplateSymbol]: boolean } = {
	_id: Symbol('EMPTY_TEMPLATE') as unknown as string,
	name: '',
	createdBy: '',
	type: 'oneLiner',
	project: '',
	cashflowOptions: {
		type: 'monthly',
		timePeriods: 1,
		useTimePeriods: false,
		hybridOptions: {
			yearType: 'calendar',
			months: 1,
		},
	},
	columns: [],
	[SuggestedTemplateSymbol]: false,
};

export const WELL_CASHFLOW_PDF_EXPORT_TYPE = 'cashflow-pdf';
export const AGG_CASHFLOW_PDF_EXPORT_TYPE = 'cashflow-agg-pdf';

export const CUSTOM_PDF_REPORT_EXPORT_TYPE = 'custom-pdf';
export const WELL_CARBON_REPORT_CSV_EXPORT_TYPE = 'ghg';

export const ECON_PDF_REPORT_TYPE_OPTIONS = {
	[WELL_CASHFLOW_PDF_EXPORT_TYPE]: 'Well Cash Flow (PDF)',
	[AGG_CASHFLOW_PDF_EXPORT_TYPE]: 'Aggregate Cash Flow (PDF)',
};

export const GHG_CSV_REPORT_TYPE_OPTIONS = {
	[WELL_CARBON_REPORT_CSV_EXPORT_TYPE]: 'Well Carbon Report (CSV)',
};

export const ECON_CSV_REPORT_TYPE_OPTIONS = {
	oneLiner: 'Well Oneline',
	'cashflow-csv': 'Well Cash Flow',
	'cashflow-agg-csv': 'Aggregate Cash Flow',
};

// 'econ-csv' contains oneliner and cashflows report types; used for export options
export const REPORT_TYPE_OPTIONS = {
	[CUSTOM_PDF_REPORT_EXPORT_TYPE]: 'Custom PDF Editor',
	'cashflow-agg-csv-monthly': 'Aggregate Monthly Cash Flow (CSV)',
	'cashflow-agg-csv-yearly': 'Aggregate Yearly Cash Flow (CSV)',
	'cashflow-csv-monthly': 'Well Monthly Cash Flow (CSV)',
	'cashflow-csv-yearly': 'Well Yearly Cash Flow (CSV)',
	'econ-csv': 'Custom CSV Editor',
	oneLiner: 'Well Oneline Cash Flow (CSV)',
	...GHG_CSV_REPORT_TYPE_OPTIONS,
	...ECON_PDF_REPORT_TYPE_OPTIONS,
};

// 'econ-csv' expands to oneliner and cashflows report types; used for file name for download
export const REPORT_TYPE_OPTIONS_WITH_ECON_CSV = {
	'cashflow-agg-csv-monthly': 'Aggregate Monthly Cash Flow (CSV)',
	'cashflow-agg-csv-yearly': 'Aggregate Yearly Cash Flow (CSV)',
	'cashflow-csv-monthly': 'Well Monthly Cash Flow (CSV)',
	'cashflow-csv-yearly': 'Well Yearly Cash Flow (CSV)',
	'econ-csv': 'Custom CSV Report',
	...ECON_CSV_REPORT_TYPE_OPTIONS,
	...GHG_CSV_REPORT_TYPE_OPTIONS,
	...ECON_PDF_REPORT_TYPE_OPTIONS,
};

export const ADDITIONAL_HEADERS = {
	project_name: 'Project Name',
	scenario_name: 'Scenario Name',
	user_name: 'User Name',
	combo_name: 'Combo Name',
	econ_group: 'Econ Group',
	created_at: 'Created At',
	qualifiers: 'Qualifiers',
};

export const CASHFLOW_REPORT_OPTIONS = {
	monthly: 'Monthly',
	yearly: 'Yearly',
	hybrid: 'Hybrid',
};

export const HYBRID_YEAR_TYPE = {
	calendar: 'Calendar',
	fiscal: 'Fiscal',
};

export const MAX_ECON_LIFE = 12 * 100;
export const MIN_ECON_LIFE = 0;

export const ALL_CUSTOM_HEADERS = {
	custom_string_0: 'Custom Text Header 1',
	custom_string_1: 'Custom Text Header 2',
	custom_string_2: 'Custom Text Header 3',
	custom_string_3: 'Custom Text Header 4',
	custom_string_4: 'Custom Text Header 5',
	custom_string_5: 'Custom Text Header 6',
	custom_string_6: 'Custom Text Header 7',
	custom_string_7: 'Custom Text Header 8',
	custom_string_8: 'Custom Text Header 9',
	custom_string_9: 'Custom Text Header 10',
	custom_string_10: 'Custom Text Header 11',
	custom_string_11: 'Custom Text Header 12',
	custom_string_12: 'Custom Text Header 13',
	custom_string_13: 'Custom Text Header 14',
	custom_string_14: 'Custom Text Header 15',
	custom_string_15: 'Custom Text Header 16',
	custom_string_16: 'Custom Text Header 17',
	custom_string_17: 'Custom Text Header 18',
	custom_string_18: 'Custom Text Header 19',
	custom_string_19: 'Custom Text Header 20',
	custom_number_0: 'Custom Number Header 1',
	custom_number_1: 'Custom Number Header 2',
	custom_number_2: 'Custom Number Header 3',
	custom_number_3: 'Custom Number Header 4',
	custom_number_4: 'Custom Number Header 5',
	custom_number_5: 'Custom Number Header 6',
	custom_number_6: 'Custom Number Header 7',
	custom_number_7: 'Custom Number Header 8',
	custom_number_8: 'Custom Number Header 9',
	custom_number_9: 'Custom Number Header 10',
	custom_number_10: 'Custom Number Header 11',
	custom_number_11: 'Custom Number Header 12',
	custom_number_12: 'Custom Number Header 13',
	custom_number_13: 'Custom Number Header 14',
	custom_number_14: 'Custom Number Header 15',
	custom_number_15: 'Custom Number Header 16',
	custom_number_16: 'Custom Number Header 17',
	custom_number_17: 'Custom Number Header 18',
	custom_number_18: 'Custom Number Header 19',
	custom_number_19: 'Custom Number Header 20',
	custom_date_0: 'Custom Date Header 1',
	custom_date_1: 'Custom Date Header 2',
	custom_date_2: 'Custom Date Header 3',
	custom_date_3: 'Custom Date Header 4',
	custom_date_4: 'Custom Date Header 5',
	custom_date_5: 'Custom Date Header 6',
	custom_date_6: 'Custom Date Header 7',
	custom_date_7: 'Custom Date Header 8',
	custom_date_8: 'Custom Date Header 9',
	custom_date_9: 'Custom Date Header 10',
	custom_bool_0: 'Custom Boolean Header 1',
	custom_bool_1: 'Custom Boolean Header 2',
	custom_bool_2: 'Custom Boolean Header 3',
	custom_bool_3: 'Custom Boolean Header 4',
	custom_bool_4: 'Custom Boolean Header 5',
};

export const AGG_HEADERS = {
	first_aggregation_header: 'First Aggregation Header',
	second_aggregation_header: 'Second Aggregation Header',
	aggregation_group: 'Aggregation Group',
};

export const CUMULATIVE_ECON_COLUMNS = {
	cum_gross_oil_well_head_volume: 'Cum Gross Oil Well Head Volume',
	cum_gross_gas_well_head_volume: 'Cum Gross Gas Well Head Volume',
	cum_gross_boe_well_head_volume: 'Cum Gross BOE Well Head Volume',
	cum_gross_mcfe_well_head_volume: 'Cum Gross MCFE Well Head Volume',
	cum_gross_water_well_head_volume: 'Cum Gross Water Well Head Volume',
	cum_gross_oil_sales_volume: 'Cum Gross Oil Sales Volume',
	cum_gross_gas_sales_volume: 'Cum Gross Gas Sales Volume',
	cum_gross_ngl_sales_volume: 'Cum Gross NGL Sales Volume',
	cum_gross_drip_condensate_sales_volume: 'Cum Gross Drip Condensate Sales Volume',
	cum_gross_boe_sales_volume: 'Cum Gross BOE Sales Volume',
	cum_gross_mcfe_sales_volume: 'Cum Gross MCFE Sales Volume',
	cum_wi_oil_sales_volume: 'Cum WI Oil Sales Volume',
	cum_wi_gas_sales_volume: 'Cum WI Gas Sales Volume',
	cum_wi_ngl_sales_volume: 'Cum WI NGL Sales Volume',
	cum_wi_drip_condensate_sales_volume: 'Cum WI Drip Condensate Sales Volume',
	cum_wi_boe_sales_volume: 'Cum WI BOE Sales Volume',
	cum_wi_mcfe_sales_volume: 'Cum WI MCFE Sales Volume',
	cum_wi_water_sales_volume: 'Cum WI Water Sales Volume',
	cum_net_oil_sales_volume: 'Cum Net Oil Sales Volume',
	cum_net_gas_sales_volume: 'Cum Net Gas Sales Volume',
	cum_net_ngl_sales_volume: 'Cum Net NGL Sales Volume',
	cum_net_drip_condensate_sales_volume: 'Cum Net Drip Condensate Sales Volume',
	cum_net_boe_sales_volume: 'Cum Net BOE Sales Volume',
	cum_net_mcfe_sales_volume: 'Cum Net MCFE Sales Volume',
	cum_net_water_sales_volume: 'Cum Net Water Sales Volume',
	cum_net_oil_well_head_volume: 'Cum Net Oil Well Head Volume',
	cum_net_gas_well_head_volume: 'Cum Net Gas Well Head Volume',
	cum_net_water_well_head_volume: 'Cum Net Water Well Head Volume',
	cum_oil_revenue: 'Cum Net Oil Revenue',
	cum_gas_revenue: 'Cum Net Gas Revenue',
	cum_ngl_revenue: 'Cum Net NGL Revenue',
	cum_drip_condensate_revenue: 'Cum Net Drip Condensate Revenue',
	cum_total_revenue: 'Cum Total Net Revenue',
	cum_oil_gathering_expense: 'Cum Oil G & P Expense',
	cum_oil_processing_expense: 'Cum Oil OPC Expense',
	cum_oil_transportation_expense: 'Cum Oil TRN Expense',
	cum_oil_marketing_expense: 'Cum Oil MKT Expense',
	cum_oil_other_expense: 'Cum Oil Other Expense',
	cum_total_oil_variable_expense: 'Cum Total Oil Variable Expense',
	cum_gas_gathering_expense: 'Cum Gas G & P Expense',
	cum_gas_processing_expense: 'Cum Gas OPC Expense',
	cum_gas_transportation_expense: 'Cum Gas TRN Expense',
	cum_gas_marketing_expense: 'Cum Gas MKT Expense',
	cum_gas_other_expense: 'Cum Gas Other Expense',
	cum_total_gas_variable_expense: 'Cum Total Gas Variable Expense',
	cum_ngl_gathering_expense: 'Cum NGL G & P Expense',
	cum_ngl_processing_expense: 'Cum NGL OPC Expense',
	cum_ngl_transportation_expense: 'Cum NGL TRN Expense',
	cum_ngl_marketing_expense: 'Cum NGL MKT Expense',
	cum_ngl_other_expense: 'Cum NGL Other Expense',
	cum_total_ngl_variable_expense: 'Cum Total NGL Variable Expense',
	cum_drip_condensate_gathering_expense: 'Cum Drip Condensate G & P Expense',
	cum_drip_condensate_processing_expense: 'Cum Drip Condensate OPC Expense',
	cum_drip_condensate_transportation_expense: 'Cum Drip Condensate TRN Expense',
	cum_drip_condensate_marketing_expense: 'Cum Drip Condensate MKT Expense',
	cum_drip_condensate_other_expense: 'Cum Drip Condensate Other Expense',
	cum_total_drip_condensate_variable_expense: 'Cum Total Drip Condensate Variable Expense',
	cum_water_disposal: 'Cum Water Disposal Expense',
	cum_co2e_expense: 'Cum CO2e Expense',
	cum_co2_expense: 'Cum CO2 Expense',
	cum_ch4_expense: 'Cum CH4 Expense',
	cum_n2o_expense: 'Cum N2O Expense',
	cum_total_carbon_expense: 'Cum Total Carbon Expense',
	cum_total_variable_expense: 'Cum Total Variable Expense',
	cum_monthly_well_cost: 'Cum Fixed Expense 1',
	cum_other_monthly_cost_1: 'Cum Fixed Expense 2',
	cum_other_monthly_cost_2: 'Cum Fixed Expense 3',
	cum_other_monthly_cost_3: 'Cum Fixed Expense 4',
	cum_other_monthly_cost_4: 'Cum Fixed Expense 5',
	cum_other_monthly_cost_5: 'Cum Fixed Expense 6',
	cum_other_monthly_cost_6: 'Cum Fixed Expense 7',
	cum_other_monthly_cost_7: 'Cum Fixed Expense 8',
	cum_other_monthly_cost_8: 'Cum Fixed Expense 9',
	cum_total_fixed_expense: 'Cum Total Fixed Expense',
	cum_total_expense: 'Cum Total Expense',
	cum_oil_severance_tax: 'Cum Oil Severance Tax',
	cum_gas_severance_tax: 'Cum Gas Severance Tax',
	cum_ngl_severance_tax: 'Cum NGL Severance Tax',
	cum_drip_condensate_severance_tax: 'Cum Drip Condensate Severance Tax',
	cum_total_severance_tax: 'Cum Total Severance Tax',
	cum_ad_valorem_tax: 'Cum Ad Valorem Tax',
	cum_total_production_tax: 'Cum Total Production Tax',
	cum_tangible_drilling: 'Cum Net Tangible Drilling',
	cum_intangible_drilling: 'Cum Net Intangible Drilling',
	cum_total_drilling: 'Cum Total Net Drilling',
	cum_tangible_completion: 'Cum Net Tangible Completion',
	cum_intangible_completion: 'Cum Net Intangible Completion',
	cum_total_completion: 'Cum Total Net Completion',
	cum_tangible_legal: 'Cum Net Tangible Legal',
	cum_intangible_legal: 'Cum Net Intangible Legal',
	cum_total_legal: 'Cum Total Net Legal',
	cum_tangible_pad: 'Cum Net Tangible Pad',
	cum_intangible_pad: 'Cum Net Intangible Pad',
	cum_total_pad: 'Cum Total Net Pad',
	cum_tangible_facilities: 'Cum Net Tangible Facilities',
	cum_intangible_facilities: 'Cum Net Intangible Facilities',
	cum_total_facilities: 'Cum Total Net Facilities',
	cum_tangible_artificial_lift: 'Cum Net Tangible Artificial Lift',
	cum_intangible_artificial_lift: 'Cum Net Intangible Artificial Lift',
	cum_total_artificial_lift: 'Cum Total Net Artificial Lift',
	cum_tangible_workover: 'Cum Net Tangible Workover',
	cum_intangible_workover: 'Cum Net Intangible Workover',
	cum_total_workover: 'Cum Total Net Workover',
	cum_tangible_leasehold: 'Cum Net Tangible Leasehold',
	cum_intangible_leasehold: 'Cum Net Intangible Leasehold',
	cum_total_leasehold: 'Cum Total Net Leasehold',
	cum_tangible_development: 'Cum Net Tangible Development',
	cum_intangible_development: 'Cum Net Intangible Development',
	cum_total_development: 'Cum Total Net Development',
	cum_tangible_pipelines: 'Cum Net Tangible Pipelines',
	cum_intangible_pipelines: 'Cum Net Intangible Pipelines',
	cum_total_pipelines: 'Cum Total Net Pipelines',
	cum_tangible_exploration: 'Cum Net Tangible Exploration',
	cum_intangible_exploration: 'Cum Net Intangible Exploration',
	cum_total_exploration: 'Cum Total Net Exploration',
	cum_tangible_waterline: 'Cum Net Tangible Waterline',
	cum_intangible_waterline: 'Cum Net Intangible Waterline',
	cum_total_waterline: 'Cum Total Net Waterline',
	cum_tangible_appraisal: 'Cum Net Tangible Appraisal',
	cum_intangible_appraisal: 'Cum Net Intangible Appraisal',
	cum_total_appraisal: 'Cum Total Net Appraisal',
	cum_tangible_other_investment: 'Cum Net Tangible Other Investment',
	cum_intangible_other_investment: 'Cum Net Intangible Other Investment',
	cum_total_other_investment: 'Cum Total Net Other Investment',
	cum_tangible_abandonment: 'Cum Net Tangible Abandonment',
	cum_intangible_abandonment: 'Cum Net Intangible Abandonment',
	cum_total_abandonment: 'Cum Total Net Abandonment',
	cum_tangible_salvage: 'Cum Net Tangible Salvage',
	cum_intangible_salvage: 'Cum Net Intangible Salvage',
	cum_total_salvage: 'Cum Total Net Salvage',
	cum_total_tangible_capex: 'Cum Total Net Tangible Investment',
	cum_total_intangible_capex: 'Cum Total Net Intangible Investment',
	cum_total_capex: 'Cum Total Net Investment',
	cum_first_discounted_capex: 'Cum First Discount Total Net Investment',
	cum_second_discounted_capex: 'Cum Second Discount Total Net Investment',
	cum_total_gross_capex: 'Cum Total Gross Investment',
	cum_net_profit: 'Cum NPI Cash Flow',
	cum_net_income: 'Cum Net Operating Income',
	cum_first_discount_net_income: 'Cum First Discount Net Operating Income',
	cum_second_discount_net_income: 'Cum Second Discount Net Operating Income',
	cum_before_income_tax_cash_flow: 'Cum Before Income Tax Cash Flow',
	cum_first_discount_cash_flow: 'Cum First Discount Cash Flow',
	cum_second_discount_cash_flow: 'Cum Second Discount Cash Flow',
	cum_tax_credit: 'Cum Tax Credit',
	cum_tangible_depreciation: 'Cum Tangible Depreciation',
	cum_intangible_depreciation: 'Cum Intangible Depreciation',
	cum_depreciation: 'Cum Total Depreciation',
	cum_depletion: 'Cum Total Depletion',
	cum_tangible_depletion: 'Cum Tangible Cost Depletion',
	cum_intangible_depletion: 'Cum Intangible Cost Depletion',
	cum_percentage_depletion: 'Cum Percentage Depletion',
	cum_total_deductions: 'Cum Total Deductions',
	cum_taxable_income: 'Cum Taxable Income',
	cum_state_income_tax: 'Cum State Income Tax',
	cum_federal_income_tax: 'Cum Federal Income Tax',
	cum_after_income_tax_cash_flow: 'Cum After Income Tax Cash Flow',
	cum_afit_first_discount_cash_flow: 'Cum AFIT First Discount Cash Flow',
	cum_afit_second_discount_cash_flow: 'Cum AFIT Second Discount Cash Flow',
	cum_gross_co2e_mass_emission: 'Cum Gross CO2e Mass Emitted',
	cum_gross_co2_mass_emission: 'Cum Gross CO2 Mass Emitted',
	cum_gross_ch4_mass_emission: 'Cum Gross CH4 Mass Emitted',
	cum_gross_n2o_mass_emission: 'Cum Gross N2O Mass Emitted',
	cum_wi_co2e_mass_emission: 'Cum WI CO2e Mass Emitted',
	cum_wi_co2_mass_emission: 'Cum WI CO2 Mass Emitted',
	cum_wi_ch4_mass_emission: 'Cum WI CH4 Mass Emitted',
	cum_wi_n2o_mass_emission: 'Cum WI N2O Mass Emitted',
	cum_nri_co2e_mass_emission: 'Cum NRI CO2e Mass Emitted',
	cum_nri_co2_mass_emission: 'Cum NRI CO2 Mass Emitted',
	cum_nri_ch4_mass_emission: 'Cum NRI CH4 Mass Emitted',
	cum_nri_n2o_mass_emission: 'Cum NRI N2O Mass Emitted',
};

const QUALIFIER_COLUMNS = {
	reserves_category_qualifier: 'Reserves Category Qualifier',
	ownership_reversion_qualifier: 'Ownership and Reversion Qualifier',
	dates_qualifier: 'Dates Qualifier',
	forecast_qualifier: 'Forecast Qualifier',
	forecast_p_series_qualifier: 'Forecast P Series Qualifier',
	schedule_qualifier: 'Schedule Qualifier',
	capex_qualifier: 'CAPEX Qualifier',
	pricing_qualifier: 'Pricing Qualifier',
	differentials_qualifier: 'Differentials Qualifier',
	stream_properties_qualifier: 'Stream Properties Qualifier',
	expenses_qualifier: 'Expenses Qualifier',
	production_taxes_qualifier: 'Production Taxes Qualifier',
	production_vs_fit_qualifier: 'Actual or Forecast Qualifier',
	risking_qualifier: 'Risking Qualifier',
};

export const WELL_COUNT_COLUMNS = {
	gross_well_count: 'Gross Well Count',
	wi_well_count: 'WI Well Count',
	nri_well_count: 'NRI Well Count',
};

export const ADDITIONAL_ECON_COLUMNS_BY_WELL = {
	well_index: 'Index',
	incremental_index: 'Incremental Index',
	econ_prms_resources_class: 'Econ PRMS Resources Class',
	econ_prms_reserves_category: 'Econ PRMS Reserves Category',
	econ_prms_reserves_sub_category: 'Econ PRMS Reserves Sub Category',
	project_name: 'Project Name',
	scenario_name: 'Scenario Name',
	user_name: 'User Name',
	combo_name: 'Combo Name',
	econ_group: 'Econ Group',
	...QUALIFIER_COLUMNS,
	created_at: 'Created At',
	error: 'Error',
	warning: 'Warning',
	date: 'Date',
	...WELL_COUNT_COLUMNS,
};

export const ADDITIONAL_ECON_COLUMNS_ONE_LINER = {
	well_index: 'Index',
	incremental_index: 'Incremental Index',
	econ_prms_resources_class: 'Econ PRMS Resources Class',
	econ_prms_reserves_category: 'Econ PRMS Reserves Category',
	econ_prms_reserves_sub_category: 'Econ PRMS Reserves Sub Category',
	project_name: 'Project Name',
	scenario_name: 'Scenario Name',
	user_name: 'User Name',
	combo_name: 'Combo Name',
	econ_group: 'Econ Group',
	...QUALIFIER_COLUMNS,
	created_at: 'Created At',
	error: 'Error',
	warning: 'Warning',
	...WELL_COUNT_COLUMNS,
};

export const ADDITIONAL_ECON_COLUMNS_AGG_CF = {
	project_name: 'Project Name',
	scenario_name: 'Scenario Name',
	user_name: 'User Name',
	combo_name: 'Combo Name',
	econ_group: 'Econ Group',
	...QUALIFIER_COLUMNS,
	created_at: 'Created At',
	date: 'Date',
	...WELL_COUNT_COLUMNS,
};

export const ALL_ADDITIONAL_COLUMNS = {
	...ADDITIONAL_ECON_COLUMNS_BY_WELL,
	...ADDITIONAL_ECON_COLUMNS_ONE_LINER,
	...ADDITIONAL_ECON_COLUMNS_AGG_CF,
};

// HACK: these are the ones currently working on csv export python side
export const WELL_HEADER_MAP = {
	abstract: 'Abstract',
	acre_spacing: 'Acre Same Zone Spacing',
	allocation_type: 'Allocation Type',
	api10: 'API 10',
	api12: 'API 12',
	api14: 'API 14',
	aries_id: 'Aries ID',
	azimuth: 'Azimuth',
	basin: 'Basin',
	block: 'Block',
	casing_id: 'Casing ID',
	choke_size: 'Choke Size',
	chosenID: 'Chosen ID',
	chosenKeyID: 'Chosen ID Key',
	completion_design: 'Completion Design',
	completion_end_date: 'Completion End Date',
	completion_start_date: 'Completion Start Date',
	copied: 'Copied Well',
	country: 'Country',
	county: 'County/Parish',
	current_operator: 'Current Operator',
	current_operator_alias: 'Current Operator Alias',
	current_operator_code: 'Current Operator Code',
	current_operator_ticker: 'Current Operator Ticker',
	dataSource: 'Data Source',
	dataPool: 'Data Pool',
	date_rig_release: 'Date Rig Release',
	distance_from_base_of_zone: 'Distance From Base Of Zone',
	distance_from_top_of_zone: 'Distance From Top Of Zone',
	district: 'District',
	drill_end_date: 'Drill End Date',
	drill_start_date: 'Drill Start Date',
	elevation: 'Elevation',
	elevation_type: 'Elevation Type',
	field: 'Field',
	first_additive_volume: 'Additive Vol (1st Job)',
	first_cluster_count: 'Cluster Count  (1st Job)',
	first_fluid_per_perforated_interval: 'Total Fluid/Perf LL (1st Job)',
	first_fluid_volume: 'Total Fluid (1st Job)',
	first_frac_vendor: 'Frac Vendor (1st Job)',
	first_max_injection_pressure: 'Max Injection Pressure  (1st Job)',
	first_max_injection_rate: 'Max Injection Rate  (1st Job)',
	first_prod_date: 'First Prod Date',
	first_prod_date_daily_calc: 'First Daily Prod Date Calc',
	first_prod_date_monthly_calc: 'First Monthly Prod Date Calc',
	first_prop_weight: 'Total Prop (1st Job)',
	first_proppant_per_fluid: 'Total Prop/Fluid (1st Job)',
	first_proppant_per_perforated_interval: 'Total Prop/Perf LL (1st Job)',
	first_stage_count: 'Stage Count  (1st Job)',
	first_test_flow_tbg_press: 'First Test Flow TBG Press',
	first_test_gas_vol: 'First Test Gas Vol',
	first_test_gor: 'First Test Gor',
	first_test_oil_vol: 'First Test Oil Vol',
	first_test_water_vol: 'First Test Water Vol',
	first_treatment_type: 'Treatment Type (1st Job)',
	flow_path: 'Flow Path',
	fluid_type: 'Fluid Type',
	footage_in_landing_zone: 'Footage In Landing Zone',
	formation_thickness_mean: 'Formation Thickness Mean',
	gas_gatherer: 'Gas Gatherer',
	gas_specific_gravity: 'Gas Specific Gravity',
	generic: 'Created Well',
	ground_elevation: 'Ground Elevation',
	has_daily: 'Has Daily Data',
	has_monthly: 'Has Monthly Data',
	hole_direction: 'Hole Direction',
	hz_well_spacing_any_zone: 'Hz Well Spacing Any Zone',
	hz_well_spacing_same_zone: 'Hz Well Spacing Same Zone',
	initial_respress: 'Initial Respress',
	initial_restemp: 'Initial Restemp',
	inptID: 'INPT ID',
	landing_zone: 'Landing Zone',
	landing_zone_base: 'Landing Zone Base',
	landing_zone_top: 'Landing Zone Top',
	lateral_length: 'Lateral Length',
	lease_name: 'Lease Name',
	lease_number: 'Lease Number',
	lower_perforation: 'Lower Perforation',
	matrix_permeability: 'Matrix Permeability',
	measured_depth: 'Measured Depth',
	num_treatment_records: 'Num Treatment Records',
	oil_api_gravity: 'Oil API Gravity',
	oil_gatherer: 'Oil Gatherer',
	oil_specific_gravity: 'Oil Specific Gravity',
	pad_name: 'Pad Name',
	parent_child_any_zone: 'Parent Child Any Zone',
	parent_child_same_zone: 'Parent Child Same Zone',
	percent_in_zone: 'Percent In Zone',
	perf_lateral_length: 'Perf Lateral Length',
	permit_date: 'Permit Date',
	phdwin_id: 'PhdWin ID',
	play: 'Play',
	porosity: 'Porosity',
	previous_operator: 'Previous Operator',
	previous_operator_alias: 'Previous Operator Alias',
	previous_operator_code: 'Previous Operator Code',
	previous_operator_ticker: 'Previous Operator Ticker',
	primary_product: 'Primary Product',
	production_method: 'Production Method',
	proppant_mesh_size: 'Prop Mesh Size',
	proppant_type: 'Prop Type',
	range: 'Range',
	recovery_method: 'Recovery Method',
	refrac_additive_volume: 'Additive Vol (Refrac)',
	refrac_cluster_count: 'Cluster Count (Refrac)',
	refrac_date: 'Refrac Date',
	refrac_fluid_per_perforated_interval: 'Total Fluid/Perf LL (Refrac)',
	refrac_fluid_volume: 'Total Fluid (Refrac)',
	refrac_frac_vendor: 'Frac Vendor (Refrac)',
	refrac_max_injection_pressure: 'Max Injection Pressure (Refrac)',
	refrac_max_injection_rate: 'Max Injection Rate (Refrac)',
	refrac_prop_weight: 'Total Prop (Refrac)',
	refrac_proppant_per_fluid: 'Total Prop/Fluid (Refrac)',
	refrac_proppant_per_perforated_interval: 'Total Prop/Perf LL (Refrac)',
	refrac_stage_count: 'Stage Count (Refrac)',
	refrac_treatment_type: 'Treatment Type (Refrac)',
	rig: 'Rig Name',
	section: 'Section',
	sg: 'Sg',
	so: 'So',
	spud_date: 'Spud Date',
	stage_spacing: 'Stage Spacing',
	state: 'State',
	status: 'Status',
	subplay: 'Subplay',
	surfaceLatitude: 'Surface Latitude',
	surfaceLongitude: 'Surface Longitude',
	survey: 'Survey',
	sw: 'Sw',
	target_formation: 'Target Formation',
	thickness: 'Thickness',
	til: 'TIL',
	toeLatitude: 'Toe Latitude',
	toeLongitude: 'Toe Longitude',
	toe_in_landing_zone: 'Toe In Landing Zone',
	toe_up: 'Toe Up',
	total_additive_volume: 'Additive Vol (All Jobs)',
	total_cluster_count: 'Total Cluster (All Jobs)',
	total_fluid_per_perforated_interval: 'Total Fluid/Perf LL (All Jobs)',
	total_fluid_volume: 'Total Fluid (All Jobs)',
	total_prop_weight: 'Total Prop (All Jobs)',
	total_proppant_per_fluid: 'Total Prop/Fluid (All Jobs)',
	total_proppant_per_perforated_interval: 'Total Prop/Perf LL (All Jobs)',
	total_stage_count: 'Total Stages (All Jobs)',
	township: 'Township',
	true_vertical_depth: 'True Vertical Depth',
	tubing_depth: 'Tubing Depth',
	tubing_id: 'Tubing ID',
	type_curve_area: 'Type Curve Area',
	upper_perforation: 'Upper Perforation',
	vt_well_spacing_any_zone: 'Vt Well Spacing Any Zone',
	vt_well_spacing_same_zone: 'Vt Well Spacing Same Zone',
	well_name: 'Well Name',
	well_number: 'Well Number',
	well_type: 'Well Type',
	mostRecentImportDesc: 'Import Name',
};

export const allPossibleColumns = {
	...ECON_COLUMNS,
	...ADDITIONAL_ECON_COLUMNS_BY_WELL,
	...ADDITIONAL_ECON_COLUMNS_ONE_LINER,
	...ADDITIONAL_ECON_COLUMNS_AGG_CF,
	...CUMULATIVE_ECON_COLUMNS,
};

export enum ID {
	reportType = 'report-type-select',
	reportTypeMenu = 'report-type-select-menu',
	cashflow = 'cashflow-csv',
	byWelltemplate = 'cashflow-csv-By\\ Well',
	export = 'export',
	download = 'file-download',
	csvEditorMenuItem = 'econ-csv-menu-item',
	csvExportMenu = 'csv-export-menu',
	cashflowReportFormGroup = 'cashflow-report-form-group',
	cashflowReportHybidFormGroup = 'cashflow-report-hybrid-form-group',
	headersAndOutputColumnsGroup = 'headers-and-output-group',
	templateName = 'template-name',
}

export const PDF_ADDITIONAL_HEADERS = {
	incremental_index: 'Incremental Index',
	econ_group: 'Econ Group',
	econ_prms_resources_class: 'Econ PRMS Resources Class',
	econ_prms_reserves_category: 'Econ PRMS Reserves Category',
	econ_prms_reserves_sub_category: 'Econ PRMS Reserves Sub Category',
};

type EconColumn = (typeof ECON_COLUMNS)[keyof typeof ECON_COLUMNS];
type ReportType = keyof EconColumn['options'];
type Category = EconColumn['category'];
export function getColumns({
	type,
	category,
	keyRegexp,
	labelRegexp,
	withUnits,
}: {
	type?: ReportType;
	category?: Category | Category[];
	keyRegexp?: string | RegExp;
	labelRegexp?: string | RegExp;
	withUnits?: boolean;
} = {}) {
	return Object.entries(ECON_COLUMNS)
		.filter(([key, value]) => {
			if (category) {
				if (typeof category === 'string' && value.category !== category) return false;
				if (!category.includes(value.category)) return false;
			}
			if (type && !value.options[type]) return false;
			if (keyRegexp && !key.match(keyRegexp)) return false;
			if (labelRegexp && !value.label.match(labelRegexp)) return false;
			return true;
		})
		.map(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { unit, unit_key: unitKey } = value as any;
			if (withUnits) {
				if (unit) return [key, `${value.label} (${unit})`];
				const unitFromUnitKey = (function unitFromUnitKey() {
					if (['oil', 'water', 'drip_condensate', 'ngl', 'boe'].includes(unitKey)) return 'MBBL';
					if (['mcfe', 'gas'].includes(unitKey)) return 'MMCF';
					if (['mcfe', 'gas'].includes(unitKey)) return 'MMCF';
					if (['oil_price', 'ngl_price', 'drip_condensate_price'].includes(unitKey)) return '$/BBL';
					if (['gas_price'].includes(unitKey)) return '$/MCF';
					if (['cash'].includes(unitKey)) return 'M$';
				})();
				if (unitFromUnitKey) return [key, `${value.label} (${unitFromUnitKey})`];
			}
			return [key, value.label];
		});
}

export function getDiscountTableCashflow() {
	function getCashflowTableForCategory(category) {
		const percents = ['0', '2', '5', '8', '10', '12', '15', '20', '25', '30', '40', '50', '60', '70', '80', '100'];
		const labelRegexp = /(.*)(Discount.*) (CF) ([0-9]+)$/;
		const columns = getColumns({ category, labelRegexp }).map(([key, label]) => {
			return [
				key,
				label.replace(labelRegexp, (match, afit, rest, cf, index) => {
					return `${afit}${percents[index - 1]}% ${rest} Cash Flow (M$)`
						.replace('Cum ', '')
						.replace('Table ', '');
				}),
			];
		});
		return columns;
	}
	return Object.fromEntries(getCashflowTableForCategory('Cash Flow'));
}

export const PDF_DISCOUNT_DETAILS = getDiscountTableCashflow();

type WellHeader = (typeof WELL_HEADERS_TYPES)[keyof typeof WELL_HEADERS_TYPES];
type WellHeaderType = keyof WellHeader['type'];
export function getWellHeaders({
	type,
	keyRegexp,
	labelRegexp,
}: {
	type?: WellHeaderType;
	keyRegexp?: string | RegExp;
	labelRegexp?: string | RegExp;
} = {}) {
	return Object.fromEntries(
		Object.entries(WELL_HEADERS_TYPES)
			.filter(([key, value]) => {
				if (type && value.type !== type) return false;
				if (keyRegexp && !key.match(keyRegexp)) return false;
				if (labelRegexp && !WELL_HEADERS[key].match(labelRegexp)) return false;
				return true;
			})
			.filter(([key]) => !ECON_COLUMNS[key])
			.map(([key]) => [key, WELL_HEADERS[key]])
	);
}

function excludeWords(words) {
	return `^((?!${words.join('|')}).)*$`;
}
export function getByWellHeaders() {
	const excludedHeaders = [
		'Directional Survey',
		'Heel',
		'Closest Well',
		'Import Date',
		'Import Type',
		'Last Prod Date',
		'Cum',
		'Last 12',
		'First 12',
		'First 6',
		'Last Month',
		'Months Produced',
		'Econ Scenario & Combo',
		'Econ Run Date',
		'PRMS Reserves Category',
		'PRMS Reserves Sub Category',
		'Created At',
		'Updated At',
		'Custom',
	];
	const regexp = new RegExp(excludeWords(excludedHeaders));
	return getWellHeaders({ labelRegexp: regexp });
}
export const BY_WELL_HEADERS = getByWellHeaders();
