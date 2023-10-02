import { resolve } from 'path';

import {
	ACTUAL_FORECAST_RRL,
	ACTUAL_FORECAST_WRL,
} from '../src/api/v1/projects/econ-models/actual-forecast/controllers';
import ariesForecastDataSchema, {
	READ_RECORD_LIMIT as FORECAST_ARIES_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/forecasts/aries/fields';
import capexSchema, {
	READ_RECORD_LIMIT as CAPEX_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as CAPEX_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/capex/fields/capex';
import customColumnSchema, {
	READ_RECORD_LIMIT as CUSTOM_COLUMNS_READ_RECORD_LIMIT,
} from '../src/api/v1/custom-columns/fields/wells-custom-columns-fields';
import dailyProductionSchema, {
	READ_RECORD_LIMIT as DAILY_PRODUCTION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as DAILY_PRODUCTION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/daily-productions/fields';
import dateSettingsSchema, {
	READ_RECORD_LIMIT as DATES_SETTINGS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as DATES_SETTINGS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/date-settings/fields/date-settings';
import depreciationSchema, {
	READ_RECORD_LIMIT as DEPRECIATION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as DEPRECIATION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/depreciation/fields/depreciation-econ-function';
import differentialsSchema, {
	READ_RECORD_LIMIT as DIFFERENTIAL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as DIFFERENTIAL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/differentials/fields/differentials';
import econMonthlyExportSchema, {
	READ_RECORD_LIMIT as ECON_RUNS_MONTHLY_EXPORTS_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/scenarios/econ-runs/monthly-exports/fields';
import econRunDataSchema, {
	READ_RECORD_LIMIT as ECON_RUNS_ONE_LINERS_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/scenarios/econ-runs/one-liners/fields';
import econRunSchema, {
	READ_RECORD_LIMIT as SCENARIOS_ECON_RUNS_READ_RECORD_LIMIT,
} from '../src/api/v1/econ-runs/fields';
import emissionsSchema, {
	READ_RECORD_LIMIT as EMISSIONS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as EMISSIONS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/emissions/fields/emission';
import escalationsSchema, {
	READ_RECORD_LIMIT as ESCALATION_MODEL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as ESCALATION_MODEL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/escalations/fields/escalations';
import expensesSchema, {
	READ_RECORD_LIMIT as EXPENSES_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as EXPENSES_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/expenses/fields/expenses';
import fluidModelSchema, {
	READ_RECORD_LIMIT as FLUID_MODEL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as FLUID_MODEL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/fluid-models/fields/fluid-model';
import forecastDataSchema, {
	READ_RECORD_LIMIT as FORECAST_OUTPUTS_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/forecasts/outputs/fields/forecast-outputs';
import forecastSchema, {
	READ_RECORD_LIMIT as FORECASTS_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/forecasts/fields';
import forecastVolumeSchema, {
	READ_RECORD_LIMIT as FORECAST_VOLUMES_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/forecasts/volumes/fields/forecast-volumes';
import {
	GENERAL_OPTIONS_RRL,
	GENERAL_OPTIONS_WRL,
} from '../src/api/v1/projects/econ-models/general-options/controller';
import monthlyProductionSchema, {
	READ_RECORD_LIMIT as MONTHLY_PRODUCTION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as MONTHLY_PRODUCTION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/monthly-productions/fields';
import owenrshipQualifierSchema, {
	READ_RECORD_LIMIT as OWNERSHIP_QUALIFIERS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as OWNERSHIP_QUALIFIERS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/ownership-qualifiers/fields/ownership-qualifier';
import ownershipReversionSchema, {
	READ_RECORD_LIMIT as OWNERSHIP_REVERSION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as OWNERSHIP_REVERSION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/ownership-reversions/fields/ownership-reversions';
import pricingSchema, {
	READ_RECORD_LIMIT as PRICING_MODEL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PRICING_MODEL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/pricing/fields/pricing';
import productionTaxesSchema, {
	READ_RECORD_LIMIT as PRODUCTION_TAXES_MODEL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PRODUCTION_TAXES_MODEL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/production-taxes/fields/production-taxes';
import {
	READ_RECORD_LIMIT as PROJECT_COMPANY_WELL_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PROJECT_COMPANY_WELL_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/company-wells/fields';
import {
	READ_RECORD_LIMIT as PROJECT_DAILY_PRODUCTION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PROJECT_DAILY_PRODUCTION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/daily-productions/fields';
import {
	READ_RECORD_LIMIT as PROJECT_MONTHLY_PRODUCTION_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PROJECT_MONTHLY_PRODUCTION_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/monthly-productions/fields';
import {
	READ_RECORD_LIMIT as PROJECT_WELLS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as PROJECT_WELLS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/wells/fields';
import projectSchema, { READ_RECORD_LIMIT as PROJECT_READ_RECORD_LIMIT } from '../src/api/v1/projects/fields';
import reservesCategorySchema, {
	READ_RECORD_LIMIT as RESERVES_CATEGORY_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as RESERVES_CATEGORY_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/reserves-categories/fields/reserves-category';
import riskingsSchema, {
	READ_RECORD_LIMIT as RISKINGS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as RISKINGS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/riskings/fields/risking';
import scenarioSchema, {
	READ_RECORD_LIMIT as SCENARIOS_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/scenarios/fields';
import streamPropertiesSchema, {
	READ_RECORD_LIMIT as STREAM_PROPERTIES_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as STREAM_PROPERTIES_WRITE_RECORD_LIMIT,
} from '../src/api/v1/projects/econ-models/stream-properties/fields/stream-properties';
import tagsSchema, { READ_RECORD_LIMIT as TAGS_READ_RECORD_LIMIT } from '../src/api/v1/tags/fields/root-tags';
import typeCurveSchema, {
	READ_RECORD_LIMIT as PROJECT_TYPE_CURVES_READ_RECORD_LIMIT,
} from '../src/api/v1/projects/type-curves/fields/type-curve';
import wellCommentSchema, {
	READ_RECORD_LIMIT as WELL_COMMENTS_READ_RECORD_LIMIT,
} from '../src/api/v1/well-comments/fields';
import wellMappingSchema, {
	READ_RECORD_LIMIT as WELL_MAPPINGS_READ_RECORD_LIMIT,
} from '../src/api/v1/well-mappings/fields';
import wellSchema, {
	READ_RECORD_LIMIT as WELLS_READ_RECORD_LIMIT,
	WRITE_RECORD_LIMIT as WELLS_WRITE_RECORD_LIMIT,
} from '../src/api/v1/wells/fields';
import { API_ADD_WELL_FORECAST_FIELDS as addWellToForecastSchema } from '../src/api/v1/projects/forecasts/fields';
import { DS_READ_RECORD_LIMIT } from '../src/api/v1/directional-surveys/controller';
import EconModelQualifierAssignmentController from '../src/api/v1/projects/econ-models/assignments/controller';
import ScenarioQualifiersController from '../src/api/v1/projects/scenarios/qualifiers/controller';
import ScenarioWellsController from '../src/api/v1/projects/scenarios/well-assignments/controller';
import { WRITE_RECORD_LIMIT as WELLS_IDENTIFIER_WRITE_RECORD_LIMIT } from '../src/api/v1/wells/identifier/fields';

export default {
	modulesBaseDir: resolve(__dirname, '../src/api'),
	outputFile: 'openapi-spec.yaml',
	resources: {
		'v1/daily-productions': {
			generateDefinitions: true,
			schema: dailyProductionSchema,
			readOptions: {
				recordLimit: DAILY_PRODUCTION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: DAILY_PRODUCTION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/monthly-productions': {
			generateDefinitions: true,
			schema: monthlyProductionSchema,
			readOptions: {
				recordLimit: MONTHLY_PRODUCTION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: MONTHLY_PRODUCTION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/ownership-qualifiers': {
			generateDefinitions: true,
			schema: owenrshipQualifierSchema,
			readOptions: {
				recordLimit: OWNERSHIP_QUALIFIERS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: OWNERSHIP_QUALIFIERS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects': {
			generateDefinitions: true,
			schema: projectSchema,
			readOptions: {
				recordLimit: PROJECT_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/company-wells': {
			generateDefinitions: false,
			relativeDir: 'v1/projects/company-wells',
			schema: wellSchema,
			readOptions: {
				recordLimit: PROJECT_COMPANY_WELL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PROJECT_COMPANY_WELL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/daily-productions': {
			generateDefinitions: false,
			relativeDir: 'v1/projects/daily-productions',
			schema: dailyProductionSchema,
			readOptions: {
				recordLimit: PROJECT_DAILY_PRODUCTION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PROJECT_DAILY_PRODUCTION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts',
			schema: forecastSchema,
			readOptions: {
				recordLimit: FORECASTS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts/wells': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts',
			schema: addWellToForecastSchema,
			readOptions: {
				recordLimit: FORECASTS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts/{forecastId}/parameters/{wellId}/{phase}/{series}': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts/parameters',
			definitionName: 'ForecastParameters',
		},
		'v1/projects/{projectId}/forecasts/{forecastId}/aries': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts/aries',
			schema: ariesForecastDataSchema,
			definitionName: 'AriesForecast',
			readOptions: {
				recordLimit: FORECAST_ARIES_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts/{forecastId}/outputs': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts/outputs',
			schema: forecastDataSchema,
			definitionName: 'ForecastOutput',
			readOptions: {
				recordLimit: FORECAST_OUTPUTS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts/{forecastId}/daily-volumes': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts/volumes',
			schema: forecastVolumeSchema,
			definitionName: 'ForecastVolumes',
			readOptions: {
				recordLimit: FORECAST_VOLUMES_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/forecasts/{forecastId}/monthly-volumes': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/forecasts/volumes',
			schema: forecastVolumeSchema,
			definitionName: 'ForecastVolumes',
			readOptions: {
				recordLimit: FORECAST_VOLUMES_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/monthly-productions': {
			generateDefinitions: false,
			relativeDir: 'v1/projects/monthly-productions',
			schema: monthlyProductionSchema,
			readOptions: {
				recordLimit: PROJECT_MONTHLY_PRODUCTION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PROJECT_MONTHLY_PRODUCTION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/scenarios': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/scenarios',
			schema: scenarioSchema,
			readOptions: {
				recordLimit: SCENARIOS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs': {
			generateDefinitions: false,
			relativeDir: 'v1/projects/scenarios/econ-runs',
			schema: econRunSchema,
			readOptions: {
				recordLimit: SCENARIOS_ECON_RUNS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/scenarios/{scenarioId}/qualifiers': {
			generated: true,
			controller: ScenarioQualifiersController,
		},
		'v1/projects/{projectId}/scenarios/{scenarioId}/well-assignments': {
			generated: true,
			controller: ScenarioWellsController,
		},
		'v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs/{econRunId}/monthly-exports': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/scenarios/econ-runs/monthly-exports',
			schema: econMonthlyExportSchema,
			readOptions: {
				recordLimit: ECON_RUNS_MONTHLY_EXPORTS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/scenarios/{scenarioId}/econ-runs/{econRunId}/one-liners': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/scenarios/econ-runs/one-liners',
			schema: econRunDataSchema,
			readOptions: {
				recordLimit: ECON_RUNS_ONE_LINERS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/type-curves': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/type-curves',
			schema: typeCurveSchema,
			readOptions: {
				recordLimit: PROJECT_TYPE_CURVES_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/wells': {
			generateDefinitions: false,
			relativeDir: 'v1/projects/wells',
			schema: wellSchema,
			readOptions: {
				recordLimit: PROJECT_WELLS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PROJECT_WELLS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/econ-runs': {
			generateDefinitions: true,
			schema: econRunSchema,
			readOptions: {
				recordLimit: SCENARIOS_ECON_RUNS_READ_RECORD_LIMIT,
			},
		},
		'v1/tags': {
			generateDefinitions: true,
			schema: tagsSchema,
			readOptions: {
				recordLimit: TAGS_READ_RECORD_LIMIT,
			},
		},
		'v1/wells': {
			generateDefinitions: true,
			schema: wellSchema,
			readOptions: {
				recordLimit: WELLS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: WELLS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/well-comments': {
			generateDefinitions: true,
			schema: wellCommentSchema,
			readOptions: {
				recordLimit: WELL_COMMENTS_READ_RECORD_LIMIT,
			},
		},
		'v1/well-mappings': {
			generateDefinitions: true,
			schema: wellMappingSchema,
			readOptions: {
				recordLimit: WELL_MAPPINGS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/{econName}/{econModelId}/assignments': {
			generated: true,
			controller: EconModelQualifierAssignmentController,
		},
		'v1/projects/{projectId}/econ-models/actual-forecast': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/actual-forecast',
			readOptions: {
				recordLimit: ACTUAL_FORECAST_RRL,
			},
			writeOptions: {
				recordLimit: ACTUAL_FORECAST_WRL,
			},
		},
		'v1/projects/{projectId}/econ-models/general-options': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/general-options',
			readOptions: {
				recordLimit: GENERAL_OPTIONS_RRL,
			},
			writeOptions: {
				recordLimit: GENERAL_OPTIONS_WRL,
			},
		},
		'v1/wells-identifiers': {
			generateDefinitions: true,
			readOptions: {
				recordLimit: WELLS_IDENTIFIER_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/reserves-categories': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/reserves-categories',
			schema: reservesCategorySchema,
			readOptions: {
				recordLimit: RESERVES_CATEGORY_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: RESERVES_CATEGORY_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/escalations': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/escalations',
			schema: escalationsSchema,
			readOptions: {
				recordLimit: ESCALATION_MODEL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: ESCALATION_MODEL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/differentials': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/differentials',
			schema: differentialsSchema,
			readOptions: {
				recordLimit: DIFFERENTIAL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: DIFFERENTIAL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/pricing': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/pricing',
			schema: pricingSchema,
			readOptions: {
				recordLimit: PRICING_MODEL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PRICING_MODEL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/ownership-reversions': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/ownership-reversions',
			schema: ownershipReversionSchema,
			readOptions: {
				recordLimit: OWNERSHIP_REVERSION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: OWNERSHIP_REVERSION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/production-taxes': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/production-taxes',
			schema: productionTaxesSchema,
			readOptions: {
				recordLimit: PRODUCTION_TAXES_MODEL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: PRODUCTION_TAXES_MODEL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/riskings': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/riskings',
			schema: riskingsSchema,
			readOptions: {
				recordLimit: RISKINGS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: RISKINGS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/stream-properties': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/stream-properties',
			schema: streamPropertiesSchema,
			readOptions: {
				recordLimit: STREAM_PROPERTIES_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: STREAM_PROPERTIES_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/expenses': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/expenses',
			schema: expensesSchema,
			readOptions: {
				recordLimit: EXPENSES_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: EXPENSES_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/emissions': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/emissions',
			schema: emissionsSchema,
			readOptions: {
				recordLimit: EMISSIONS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: EMISSIONS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/fluid-models': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/fluid-models',
			schema: fluidModelSchema,
			readOptions: {
				recordLimit: FLUID_MODEL_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: FLUID_MODEL_WRITE_RECORD_LIMIT,
			},
		},
		'v1/directional-surveys': {
			generateDefinitions: true,
			schema: {},
			readOptions: {
				recordLimit: DS_READ_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/capex': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/capex',
			schema: capexSchema,
			readOptions: {
				recordLimit: CAPEX_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: CAPEX_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/date-settings': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/date-settings',
			schema: dateSettingsSchema,
			readOptions: {
				recordLimit: DATES_SETTINGS_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: DATES_SETTINGS_WRITE_RECORD_LIMIT,
			},
		},
		'v1/projects/{projectId}/econ-models/depreciation': {
			generateDefinitions: true,
			relativeDir: 'v1/projects/econ-models/depreciation',
			schema: depreciationSchema,
			readOptions: {
				recordLimit: DEPRECIATION_READ_RECORD_LIMIT,
			},
			writeOptions: {
				recordLimit: DEPRECIATION_WRITE_RECORD_LIMIT,
			},
		},
		'v1/custom-columns/{collection}': {
			generateDefinitions: true,
			relativeDir: 'v1/custom-columns',
			schema: customColumnSchema,
			readOptions: {
				recordLimit: CUSTOM_COLUMNS_READ_RECORD_LIMIT,
			},
		},
	},
	specBaseFiles: ['base.yaml'],
	specDir: __dirname,
};
