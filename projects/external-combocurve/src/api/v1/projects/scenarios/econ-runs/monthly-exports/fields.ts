/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigQueryDate, Job } from '@google-cloud/bigquery';
import { Types } from 'mongoose';

import {
	BIG_QUERY_DATE_FIELD,
	getStringEnumField,
	IFieldDefinition,
	NUMBER_FIELD,
	STRING_FIELD,
	STRING_OBJECT_ID_FORMAT_FIELD,
} from '@src/helpers/fields';
import {
	filterableBqFields,
	getApiBqFilters,
	getApiBqSort,
	IField,
	IReadFieldOptions,
	readBqField,
	sortableBqFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { IBQFilters } from '@src/helpers/bq-queries';
import { IEconMonthly } from '@src/models/econ/econ-monthly';
import { IEconRun } from '@src/models/econ/econ-runs';
import { JobGetQueryResult } from '@src/api/v1/bigQuery';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

export const READ_RECORD_LIMIT = 2000;
export const CONCURRENCY_LIMIT = 10;

const readBigQueryDateField = <T, K extends keyof IEconMonthly>(
	key: K,
	options: IReadFieldOptions = {},
): IEconMonthlyField<string | null, BigQueryDate> => ({
	...(readBqField<IEconMonthly, K, BigQueryDate>(key, BIG_QUERY_DATE_FIELD, options) as IField<
		IEconMonthly,
		string | null,
		BigQueryDate
	>),
	read: (econMonthly) => (econMonthly[key] === null ? null : (econMonthly[key] as BigQueryDate)?.value),
});

const readEconMonthlyField = <K extends keyof IEconMonthly, TParsed = IEconMonthly[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readBqField<IEconMonthly, K, TParsed>(key, definition, options);

export type ApiMonthlyDataKey = keyof typeof API_MONTHLY_DATA_FIELDS;

export type ApiMonthlyData = {
	[key in ApiMonthlyDataKey]?: TypeOfField<(typeof API_MONTHLY_DATA_FIELDS)[key]>;
};

const API_MONTHLY_DATA_FIELDS = {
	adValoremTax: readEconMonthlyField('ad_valorem_tax', NUMBER_FIELD),
	afterIncomeTaxCashFlow: readEconMonthlyField('after_income_tax_cash_flow', NUMBER_FIELD),
	beforeIncomeTaxCashFlow: readEconMonthlyField('before_income_tax_cash_flow', NUMBER_FIELD),
	depreciation: readEconMonthlyField('depreciation', NUMBER_FIELD),
	dripCondensateDifferentials1: readEconMonthlyField('drip_condensate_differentials_1', NUMBER_FIELD),
	dripCondensateDifferentials2: readEconMonthlyField('drip_condensate_differentials_2', NUMBER_FIELD),
	dripCondensateGatheringExpense: readEconMonthlyField('drip_condensate_gathering_expense', NUMBER_FIELD),
	dripCondensateMarketingExpense: readEconMonthlyField('drip_condensate_marketing_expense', NUMBER_FIELD),
	dripCondensateOtherExpense: readEconMonthlyField('drip_condensate_other_expense', NUMBER_FIELD),
	dripCondensatePrice: readEconMonthlyField('drip_condensate_price', NUMBER_FIELD),
	dripCondensateProcessingExpense: readEconMonthlyField('drip_condensate_processing_expense', NUMBER_FIELD),
	dripCondensateRevenue: readEconMonthlyField('drip_condensate_revenue', NUMBER_FIELD),
	dripCondensateSeveranceTax: readEconMonthlyField('drip_condensate_severance_tax', NUMBER_FIELD),
	dripCondensateTransportationExpense: readEconMonthlyField('drip_condensate_transportation_expense', NUMBER_FIELD),
	dripCondensateYield: readEconMonthlyField('drip_condensate_yield', NUMBER_FIELD),
	federalIncomeTax: readEconMonthlyField('federal_income_tax', NUMBER_FIELD),
	firstDiscountCashFlow: readEconMonthlyField('first_discount_cash_flow', NUMBER_FIELD),
	firstDiscountNetIncome: readEconMonthlyField('first_discount_net_income', NUMBER_FIELD),
	firstDiscountedCapex: readEconMonthlyField('first_discounted_capex', NUMBER_FIELD),
	gasDifferentials1: readEconMonthlyField('gas_differentials_1', NUMBER_FIELD),
	gasDifferentials2: readEconMonthlyField('gas_differentials_2', NUMBER_FIELD),
	gasFlare: readEconMonthlyField('gas_flare', NUMBER_FIELD),
	gasGatheringExpense: readEconMonthlyField('gas_gathering_expense', NUMBER_FIELD),
	gasLoss: readEconMonthlyField('gas_loss', NUMBER_FIELD),
	gasMarketingExpense: readEconMonthlyField('gas_marketing_expense', NUMBER_FIELD),
	gasOtherExpense: readEconMonthlyField('gas_other_expense', NUMBER_FIELD),
	gasPrice: readEconMonthlyField('gas_price', NUMBER_FIELD),
	gasProcessingExpense: readEconMonthlyField('gas_processing_expense', NUMBER_FIELD),
	gasRevenue: readEconMonthlyField('gas_revenue', NUMBER_FIELD),
	gasSeveranceTax: readEconMonthlyField('gas_severance_tax', NUMBER_FIELD),
	gasShrinkage: readEconMonthlyField('gas_shrinkage', NUMBER_FIELD),
	gasStartUsingForecastDate: readBigQueryDateField('gas_start_using_forecast_date'),
	gasTransportationExpense: readEconMonthlyField('gas_transportation_expense', NUMBER_FIELD),
	grossBoeSalesVolume: readEconMonthlyField('gross_boe_sales_volume', NUMBER_FIELD),
	grossBoeWellHeadVolume: readEconMonthlyField('gross_boe_well_head_volume', NUMBER_FIELD),
	grossDripCondensateSalesVolume: readEconMonthlyField('gross_drip_condensate_sales_volume', NUMBER_FIELD),
	grossGasSalesVolume: readEconMonthlyField('gross_gas_sales_volume', NUMBER_FIELD),
	grossGasWellHeadVolume: readEconMonthlyField('gross_gas_well_head_volume', NUMBER_FIELD),
	grossMcfeSalesVolume: readEconMonthlyField('gross_mcfe_sales_volume', NUMBER_FIELD),
	grossMcfeWellHeadVolume: readEconMonthlyField('gross_mcfe_well_head_volume', NUMBER_FIELD),
	grossNglSalesVolume: readEconMonthlyField('gross_ngl_sales_volume', NUMBER_FIELD),
	grossOilSalesVolume: readEconMonthlyField('gross_oil_sales_volume', NUMBER_FIELD),
	grossOilWellHeadVolume: readEconMonthlyField('gross_oil_well_head_volume', NUMBER_FIELD),
	grossWaterWellHeadVolume: readEconMonthlyField('gross_water_well_head_volume', NUMBER_FIELD),
	grossWellCount: readEconMonthlyField('gross_well_count', NUMBER_FIELD),
	inputDripCondensatePrice: readEconMonthlyField('input_drip_condensate_price', NUMBER_FIELD),
	inputGasPrice: readEconMonthlyField('input_gas_price', NUMBER_FIELD),
	inputNglPrice: readEconMonthlyField('input_ngl_price', NUMBER_FIELD),
	inputOilPrice: readEconMonthlyField('input_oil_price', NUMBER_FIELD),
	intangibleAbandonment: readEconMonthlyField('intangible_abandonment', NUMBER_FIELD),
	intangibleAppraisal: readEconMonthlyField('intangible_appraisal', NUMBER_FIELD),
	intangibleArtificialLift: readEconMonthlyField('intangible_artificial_lift', NUMBER_FIELD),
	intangibleCompletion: readEconMonthlyField('intangible_completion', NUMBER_FIELD),
	intangibleDevelopment: readEconMonthlyField('intangible_development', NUMBER_FIELD),
	intangibleDrilling: readEconMonthlyField('intangible_drilling', NUMBER_FIELD),
	intangibleExploration: readEconMonthlyField('intangible_exploration', NUMBER_FIELD),
	intangibleFacilities: readEconMonthlyField('intangible_facilities', NUMBER_FIELD),
	intangibleLeasehold: readEconMonthlyField('intangible_leasehold', NUMBER_FIELD),
	intangibleLegal: readEconMonthlyField('intangible_legal', NUMBER_FIELD),
	intangibleOtherInvestment: readEconMonthlyField('intangible_other_investment', NUMBER_FIELD),
	intangiblePad: readEconMonthlyField('intangible_pad', NUMBER_FIELD),
	intangiblePipelines: readEconMonthlyField('intangible_pipelines', NUMBER_FIELD),
	intangibleSalvage: readEconMonthlyField('intangible_salvage', NUMBER_FIELD),
	intangibleWaterline: readEconMonthlyField('intangible_waterline', NUMBER_FIELD),
	intangibleWorkover: readEconMonthlyField('intangible_workover', NUMBER_FIELD),
	leaseNri: readEconMonthlyField('lease_nri', NUMBER_FIELD),
	monthlyWellCost: readEconMonthlyField('monthly_well_cost', NUMBER_FIELD),
	netBoeSalesVolume: readEconMonthlyField('net_boe_sales_volume', NUMBER_FIELD),
	netDripCondensateSalesVolume: readEconMonthlyField('net_drip_condensate_sales_volume', NUMBER_FIELD),
	netGasSalesVolume: readEconMonthlyField('net_gas_sales_volume', NUMBER_FIELD),
	netIncome: readEconMonthlyField('net_income', NUMBER_FIELD),
	netMcfeSalesVolume: readEconMonthlyField('net_mcfe_sales_volume', NUMBER_FIELD),
	netNglSalesVolume: readEconMonthlyField('net_ngl_sales_volume', NUMBER_FIELD),
	netOilSalesVolume: readEconMonthlyField('net_oil_sales_volume', NUMBER_FIELD),
	netProfit: readEconMonthlyField('net_profit', NUMBER_FIELD),
	nglDifferentials1: readEconMonthlyField('ngl_differentials_1', NUMBER_FIELD),
	nglDifferentials2: readEconMonthlyField('ngl_differentials_2', NUMBER_FIELD),
	nglGatheringExpense: readEconMonthlyField('ngl_gathering_expense', NUMBER_FIELD),
	nglMarketingExpense: readEconMonthlyField('ngl_marketing_expense', NUMBER_FIELD),
	nglOtherExpense: readEconMonthlyField('ngl_other_expense', NUMBER_FIELD),
	nglPrice: readEconMonthlyField('ngl_price', NUMBER_FIELD),
	nglProcessingExpense: readEconMonthlyField('ngl_processing_expense', NUMBER_FIELD),
	nglRevenue: readEconMonthlyField('ngl_revenue', NUMBER_FIELD),
	nglSeveranceTax: readEconMonthlyField('ngl_severance_tax', NUMBER_FIELD),
	nglTransportationExpense: readEconMonthlyField('ngl_transportation_expense', NUMBER_FIELD),
	nglYield: readEconMonthlyField('ngl_yield', NUMBER_FIELD),
	nriDripCondensate: readEconMonthlyField('nri_drip_condensate', NUMBER_FIELD),
	nriGas: readEconMonthlyField('nri_gas', NUMBER_FIELD),
	nriNgl: readEconMonthlyField('nri_ngl', NUMBER_FIELD),
	nriOil: readEconMonthlyField('nri_oil', NUMBER_FIELD),
	nriWellCount: readEconMonthlyField('nri_well_count', NUMBER_FIELD),
	oilDifferentials1: readEconMonthlyField('oil_differentials_1', NUMBER_FIELD),
	oilDifferentials2: readEconMonthlyField('oil_differentials_2', NUMBER_FIELD),
	oilGatheringExpense: readEconMonthlyField('oil_gathering_expense', NUMBER_FIELD),
	oilLoss: readEconMonthlyField('oil_loss', NUMBER_FIELD),
	oilMarketingExpense: readEconMonthlyField('oil_marketing_expense', NUMBER_FIELD),
	oilOtherExpense: readEconMonthlyField('oil_other_expense', NUMBER_FIELD),
	oilPrice: readEconMonthlyField('oil_price', NUMBER_FIELD),
	oilProcessingExpense: readEconMonthlyField('oil_processing_expense', NUMBER_FIELD),
	oilRevenue: readEconMonthlyField('oil_revenue', NUMBER_FIELD),
	oilSeveranceTax: readEconMonthlyField('oil_severance_tax', NUMBER_FIELD),
	oilShrinkage: readEconMonthlyField('oil_shrinkage', NUMBER_FIELD),
	oilStartUsingForecastDate: readBigQueryDateField('oil_start_using_forecast_date'),
	oilTransportationExpense: readEconMonthlyField('oil_transportation_expense', NUMBER_FIELD),
	otherMonthlyCost_1: readEconMonthlyField('other_monthly_cost_1', NUMBER_FIELD),
	otherMonthlyCost_2: readEconMonthlyField('other_monthly_cost_2', NUMBER_FIELD),
	secondDiscountCashFlow: readEconMonthlyField('second_discount_cash_flow', NUMBER_FIELD),
	secondDiscountNetIncome: readEconMonthlyField('second_discount_net_income', NUMBER_FIELD),
	secondDiscountedCapex: readEconMonthlyField('second_discounted_capex', NUMBER_FIELD),
	stateIncomeTax: readEconMonthlyField('state_income_tax', NUMBER_FIELD),
	tangibleAbandonment: readEconMonthlyField('tangible_abandonment', NUMBER_FIELD),
	tangibleAppraisal: readEconMonthlyField('tangible_appraisal', NUMBER_FIELD),
	tangibleArtificialLift: readEconMonthlyField('tangible_artificial_lift', NUMBER_FIELD),
	tangibleCompletion: readEconMonthlyField('tangible_completion', NUMBER_FIELD),
	tangibleDevelopment: readEconMonthlyField('tangible_development', NUMBER_FIELD),
	tangibleDrilling: readEconMonthlyField('tangible_drilling', NUMBER_FIELD),
	tangibleExploration: readEconMonthlyField('tangible_exploration', NUMBER_FIELD),
	tangibleFacilities: readEconMonthlyField('tangible_facilities', NUMBER_FIELD),
	tangibleLeasehold: readEconMonthlyField('tangible_leasehold', NUMBER_FIELD),
	tangibleLegal: readEconMonthlyField('tangible_legal', NUMBER_FIELD),
	tangibleOtherInvestment: readEconMonthlyField('tangible_other_investment', NUMBER_FIELD),
	tangiblePad: readEconMonthlyField('tangible_pad', NUMBER_FIELD),
	tangiblePipelines: readEconMonthlyField('tangible_pipelines', NUMBER_FIELD),
	tangibleSalvage: readEconMonthlyField('tangible_salvage', NUMBER_FIELD),
	tangibleWaterline: readEconMonthlyField('tangible_waterline', NUMBER_FIELD),
	tangibleWorkover: readEconMonthlyField('tangible_workover', NUMBER_FIELD),
	taxableIncome: readEconMonthlyField('taxable_income', NUMBER_FIELD),
	totalAbandonment: readEconMonthlyField('total_abandonment', NUMBER_FIELD),
	totalAppraisal: readEconMonthlyField('total_appraisal', NUMBER_FIELD),
	totalArtificialLift: readEconMonthlyField('total_artificial_lift', NUMBER_FIELD),
	totalCapex: readEconMonthlyField('total_capex', NUMBER_FIELD),
	totalCompletion: readEconMonthlyField('total_completion', NUMBER_FIELD),
	totalDevelopment: readEconMonthlyField('total_development', NUMBER_FIELD),
	totalDrilling: readEconMonthlyField('total_drilling', NUMBER_FIELD),
	totalDripCondensateVariableExpense: readEconMonthlyField('total_drip_condensate_variable_expense', NUMBER_FIELD),
	totalExpense: readEconMonthlyField('total_expense', NUMBER_FIELD),
	totalExploration: readEconMonthlyField('total_exploration', NUMBER_FIELD),
	totalFacilities: readEconMonthlyField('total_facilities', NUMBER_FIELD),
	totalFixedExpense: readEconMonthlyField('total_fixed_expense', NUMBER_FIELD),
	totalGasVariableExpense: readEconMonthlyField('total_gas_variable_expense', NUMBER_FIELD),
	totalGrossCapex: readEconMonthlyField('total_gross_capex', NUMBER_FIELD),
	totalIntangibleCapex: readEconMonthlyField('total_intangible_capex', NUMBER_FIELD),
	totalLeasehold: readEconMonthlyField('total_leasehold', NUMBER_FIELD),
	totalLegal: readEconMonthlyField('total_legal', NUMBER_FIELD),
	totalNglVariableExpense: readEconMonthlyField('total_ngl_variable_expense', NUMBER_FIELD),
	totalOilVariableExpense: readEconMonthlyField('total_oil_variable_expense', NUMBER_FIELD),
	totalOtherInvestment: readEconMonthlyField('total_other_investment', NUMBER_FIELD),
	totalPad: readEconMonthlyField('total_pad', NUMBER_FIELD),
	totalPipelines: readEconMonthlyField('total_pipelines', NUMBER_FIELD),
	totalProductionTax: readEconMonthlyField('total_production_tax', NUMBER_FIELD),
	totalRevenue: readEconMonthlyField('total_revenue', NUMBER_FIELD),
	totalSalvage: readEconMonthlyField('total_salvage', NUMBER_FIELD),
	totalSeveranceTax: readEconMonthlyField('total_severance_tax', NUMBER_FIELD),
	totalTangibleCapex: readEconMonthlyField('total_tangible_capex', NUMBER_FIELD),
	totalVariableExpense: readEconMonthlyField('total_variable_expense', NUMBER_FIELD),
	totalWaterline: readEconMonthlyField('total_waterline', NUMBER_FIELD),
	totalWorkover: readEconMonthlyField('total_workover', NUMBER_FIELD),
	waterDisposal: readEconMonthlyField('water_disposal', NUMBER_FIELD),
	waterStartUsingForecastDate: readBigQueryDateField('water_start_using_forecast_date'),
	wiBoeSalesVolume: readEconMonthlyField('wi_boe_sales_volume', NUMBER_FIELD),
	wiDripCondensate: readEconMonthlyField('wi_drip_condensate', NUMBER_FIELD),
	wiDripCondensateSalesVolume: readEconMonthlyField('wi_drip_condensate_sales_volume', NUMBER_FIELD),
	wiGas: readEconMonthlyField('wi_gas', NUMBER_FIELD),
	wiGasSalesVolume: readEconMonthlyField('wi_gas_sales_volume', NUMBER_FIELD),
	wiMcfeSalesVolume: readEconMonthlyField('wi_mcfe_sales_volume', NUMBER_FIELD),
	wiNgl: readEconMonthlyField('wi_ngl', NUMBER_FIELD),
	wiNglSalesVolume: readEconMonthlyField('wi_ngl_sales_volume', NUMBER_FIELD),
	wiOil: readEconMonthlyField('wi_oil', NUMBER_FIELD),
	wiOilSalesVolume: readEconMonthlyField('wi_oil_sales_volume', NUMBER_FIELD),
	wiWellCount: readEconMonthlyField('wi_well_count', NUMBER_FIELD),
};

export const toApiMonthlyData = (econMonthly: IEconMonthly): ApiMonthlyData => {
	const apiMonthlyData: Record<string, ApiMonthlyData[ApiMonthlyDataKey]> = {};
	Object.entries(API_MONTHLY_DATA_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiMonthlyData[field] = read(econMonthly);
		}
	});
	return apiMonthlyData;
};

type IEconMonthlyField<T, TParsed = T> = IField<IEconMonthly, T, TParsed>;

const getMonthlyData = (): IEconMonthlyField<ApiMonthlyData | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: API_MONTHLY_DATA_FIELDS,
		read: (econMonthly) => toApiMonthlyData(econMonthly),
	};
};

const API_ECON_MONTHLY_FIELDS = {
	comboName: readEconMonthlyField('combo_name', STRING_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	date: readBigQueryDateField('date', { filterOption: { read: { filterValues: 1 } } }),
	output: getMonthlyData(),
	well: readEconMonthlyField('well_id', STRING_OBJECT_ID_FORMAT_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
};

export type ApiEconMonthlyKey = keyof typeof API_ECON_MONTHLY_FIELDS;

type TypeOfField<FT> = FT extends IEconMonthlyField<infer T, infer T2> ? T : never;

export type ApiEconMonthly = { [key in ApiEconMonthlyKey]?: TypeOfField<(typeof API_ECON_MONTHLY_FIELDS)[key]> };

export const toApiEconMonthly = (econMonthly: IEconMonthly): ApiEconMonthly => {
	const apiEconMonthly: Record<string, ApiEconMonthly[ApiEconMonthlyKey]> = {};
	Object.entries(API_ECON_MONTHLY_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEconMonthly[field] = read(econMonthly);
		}
	});
	return apiEconMonthly;
};

export const getSort = (sort: ISort): ISort | null => getApiBqSort(sort, API_ECON_MONTHLY_FIELDS)?.sortQuery ?? null;

export const sortableFields = sortableBqFields(API_ECON_MONTHLY_FIELDS);

export const getFilters = (
	filters: ApiQueryFilters,
	project: BaseProjectResolved,
	scenarioId: Types.ObjectId,
	econRun: Pick<IEconRun, 'id' | 'runDate'>,
): IFilter<IBQFilters> =>
	getApiBqFilters(filters, API_ECON_MONTHLY_FIELDS, {
		value: {
			project_id: { value: project._id.toString(), operator: '=' },
			scenario_id: { value: scenarioId.toString(), operator: '=' },
			run_id: { value: econRun.id.toString(), operator: '=' },
			run_date: { value: new BigQueryDate(econRun.runDate.toISOString().split('T')[0]), operator: '=' },
		},
	});

export const getCountFilters = (
	filters: ApiQueryFilters,
	econRun: Pick<IEconRun, 'id' | 'runDate'>,
): IFilter<IBQFilters> =>
	getApiBqFilters(filters, API_ECON_MONTHLY_FIELDS, {
		value: {
			run_id: { value: econRun.id.toString(), operator: '=' },
			run_date: { value: new BigQueryDate(econRun.runDate.toISOString().split('T')[0]), operator: '=' },
		},
	});

export const filterableFields = filterableBqFields(API_ECON_MONTHLY_FIELDS);

export type IJobKey = keyof Job;

type IJobField<T, TParsed = T> = IField<Job, T, TParsed>;

const readJobField = <K extends keyof Job, TParsed = Job[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readBqField<Job, K, TParsed>(key, definition, options);

const API_JOB_FIELDS = {
	id: readJobField('id', STRING_FIELD),
};

export type ApiJobKey = keyof typeof API_JOB_FIELDS;

type TypeOfJobField<FT> = FT extends IJobField<infer T> ? T : never;

export type ApiJob = { [key in ApiJobKey]?: TypeOfJobField<(typeof API_JOB_FIELDS)[key]> };

export const toApiJob = (job: Job): ApiJob => {
	const apiJob: Record<string, ApiJob[ApiJobKey]> = {};
	Object.entries(API_JOB_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiJob[field] = read(job);
		}
	});
	return apiJob;
};

type IMonthlyExportField<T, TParsed = T> = IField<JobGetQueryResult<IEconMonthly>, T, TParsed>;

const getMonthlyExportStatus = (): IMonthlyExportField<MonthlyExportStatus> => {
	return {
		...getStringEnumField(MONTHLY_EXPORT_STATUS),
		// per the documentation for totalRows: "Present only when the query completes successfully."
		read: ({ resultsMeta }) => (resultsMeta?.totalRows !== undefined ? 'completed' : 'running'),
	};
};

const getMonthlyExportResults = (): IMonthlyExportField<ApiEconMonthly[]> => {
	return {
		type: OpenApiDataType.array,
		items: { type: OpenApiDataType.object, properties: API_ECON_MONTHLY_FIELDS },
		read: ({ rows }) => rows.map(toApiEconMonthly),
	};
};

const MONTHLY_EXPORT_STATUS = ['completed', 'running'] as const;

type MonthlyExportStatus = (typeof MONTHLY_EXPORT_STATUS)[number];

const API_MONTHLY_EXPORT_FIELDS = {
	results: getMonthlyExportResults(),
	status: getMonthlyExportStatus(),
};

export default API_MONTHLY_EXPORT_FIELDS;

export type ApiMonthlyExportKey = keyof typeof API_MONTHLY_EXPORT_FIELDS;

type TypeOfMonthlyExportField<FT> = FT extends IMonthlyExportField<infer T> ? T : never;

export type ApiMonthlyExport = {
	[key in ApiMonthlyExportKey]?: TypeOfMonthlyExportField<(typeof API_MONTHLY_EXPORT_FIELDS)[key]>;
};

export const toApiMonthlyExport = (jobGetQueryResult: JobGetQueryResult<IEconMonthly>): ApiMonthlyExport => {
	const apiMonthlyExport: Record<string, ApiMonthlyExport[ApiMonthlyExportKey]> = {};
	Object.entries(API_MONTHLY_EXPORT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiMonthlyExport[field] = read(jobGetQueryResult);
		}
	});
	return apiMonthlyExport;
};
