/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Schema } from 'mongoose';

import { AccessPolicySchema, GroupSchema } from './schemas';
import { ApiCredentialSchema } from './schemas/api-credentials';
import { ApiImportSchema } from './schemas/api-imports';
import { ApiTenantSchema } from './schemas/api-tenants';
import {
	ARCHIVE_PROJECT_VERSIONS,
	ArchivedProjectSchema,
	LATEST_ARCHIVE_PROJECT_VERSION,
} from './schemas/archived-projects';
import { AssumptionSchema } from './schemas/assumptions';
import { CompanyForecastSettingSchema } from './schemas/company-forecast-settings';
import { CreateWellsTemplateSchema } from './schemas/create-wells-templates';
import { CustomHeaderConfigurationSchema } from './schemas/custom-header-configurations';
import { DailyProductionSchema } from './schemas/daily-productions';
import { DailyStreamDataSchema } from './schemas/daily-stream-datas';
import { DataImportMappingSchema } from './schemas/data-imports-mappings';
import { DefaultUserSortingSchema } from './schemas/default-user-sortings';
import { DeterministicForecastDataSchema } from './schemas/deterministic-forecast-datas';
import { EconComboSettingSchema } from './schemas/econ-combo-settings';
import { EconGroupConfigurationSchema } from './schemas/econ-group-configurations';
import { EconGroupDefaultUserConfigurationSchema } from './schemas/econ-group-default-user-configurations';
import { EconGroupSchema } from './schemas/econ-groups';
import { EconReportExportConfigurationSchema } from './schemas/econ-report-export-configurations';
import { EconReportExportDefaultUserConfigurationSchema } from './schemas/econ-report-export-default-user-configurations';
import { EconReportSettingSchema } from './schemas/econ-report-settings';
import {
	ECON_RUN_V2_SENSITIVITY,
	ECON_RUN_V3_VISUALIZATIONS,
	ECON_RUN_V4_INCREMENTALS,
	EconRunSchema,
} from './schemas/econ-runs';
import { EconRunsDataSchema } from './schemas/econ-runs-datas';
import { EconSettingSchema } from './schemas/econ-settings';
import { EconVisualizationSetupSchema } from './schemas/econ-visualization-setups';
import { EmbeddedLookupTableSchema } from './schemas/embedded-lookup-tables.js';
import { FacilitySchema } from './schemas/facilities';
import { FileImportSchema } from './schemas/file-imports';
import { FileSchema } from './schemas/files';
import { FilterSettingSchema } from './schemas/filter-settings';
import { FilterSchema } from './schemas/filters';
import { ForecastBucketSchema } from './schemas/forecast-buckets';
import { ForecastConfiguration, ForecastConfigurationSchema } from './schemas/forecast-configuration';
import { ForecastDataSchema } from './schemas/forecast-datas';
import { ForecastExportSchema } from './schemas/forecast-exports';
import {
	PHASE_ENUM as FORECAST_LOOKUP_TABLES_PHASE_ENUM,
	RESOLUTION_ENUM as FORECAST_LOOKUP_TABLES_RESOLUTION_ENUM,
	ForecastLookupTableSchema,
} from './schemas/forecast-lookup-tables';
import { FORECAST_ROLL_UP_BATCH_SIZE, ForecastRollUpRunSchema } from './schemas/forecast-roll-up-runs';
import { ForecastWellAssignmentSchema } from './schemas/forecast-well-assignments';
import {
	BASE_SERIES,
	DIAGNOSTIC_BATCH_SIZE,
	FORECAST_BASE_PHASES,
	FORECAST_BATCH_SIZE,
	ForecastSchema,
	MAX_WELLS_IN_FORECAST,
	MTD_DENOM,
	forecastDataObj,
} from './schemas/forecasts';
import { GhgRunSchema } from './schemas/ghg-runs';
import { HeatmapSettingSchema } from './schemas/heatmap-settings';
import { LookupTableSchema } from './schemas/lookup-tables';
import { LOOKUP_TABLES_OPERATORS, LOOKUP_TABLES_WELL_HEADERS_WITH_TYPES } from './schemas/lookup-tables/shared';
import { MapHeaderSchema } from './schemas/map-headers';
import { ModularEconomicsConfigurationSchema } from './schemas/modular-economics-configuration';
import { MonthlyProductionSchema } from './schemas/monthly-productions';
import { MonthlyStreamDataSchema } from './schemas/monthly-stream-datas';
import { updateNetworkTopLevelIds } from './schemas/network/shared';
import { NetworkSchema } from './schemas/networks';
import { NOTIFICATION_TYPE, NotificationSchema } from './schemas/notifications';
import { OwnershipQualifierSchema } from './schemas/ownership-qualifiers';
import { PasswordlessTokenSchema } from './schemas/passwordless-tokens';
import {
	PROJECT_CUSTOM_HEADERS_LIMIT,
	PROJECT_CUSTOM_HEADER_KEYS,
	PROJECT_CUSTOM_HEADER_KEY_PREFIX,
	ProjectCustomHeaderSchema,
} from './schemas/project-custom-headers';
import { ProjectCustomHeadersDataSchema } from './schemas/project-custom-headers-datas';
import { ProjectSchema } from './schemas/projects';
import { ProximityForecastDataSchema } from './schemas/proximity-forecast-datas';
import { QueueSchema } from './schemas/queues';
import { RollUpGroupSchema } from './schemas/roll-up-groups';
import { ROLL_UP_BATCH_SIZE, ScenRollUpRunSchema, rollUpParseDate } from './schemas/scen-roll-up-runs';
import {
	ASSUMPTION_FIELDS,
	QUALIFIERS,
	SCEN_WELL_ASSIGNMENT_DEFAULT_VALUES,
	SCEN_WELL_ASSIGNMENT_QUALIFIER_FIELDS,
	SCEN_WELL_ASSIGNMENT_SCHEMA_VERSION,
	ScenarioWellAssignmentSchema,
} from './schemas/scenario-well-assignments';
import {
	DEFAULT_QUALIFIER_KEY,
	MAX_WELLS_IN_SCENARIO,
	SCENARIO_MAX_QUALIFIERS_PER_COLUMN,
	ScenarioError,
	ScenarioSchema,
} from './schemas/scenarios';
import { ScheduleConstructionSchema } from './schemas/schedule-constructions';
import { ScheduleInputQualifiersSchema } from './schemas/schedule-input-qualifiers';
import { ScheduleSettingSchema } from './schemas/schedule-settings';
import { ScheduleWellOutputSchema } from './schemas/schedule-well-outputs';
import { ScheduleSchema } from './schemas/schedules';
import { SessionSchema } from './schemas/sessions';
import { ShapefileSchema } from './schemas/shapefiles';
import { ShareableCodeImportSchema } from './schemas/shareable-code-imports';
import { ShareableCodeSchema } from './schemas/shareable-codes';
import { SortingSchema } from './schemas/sortings';
import { StreamWellAssignmentSchema } from './schemas/stream-well-assignments';
import { StreamSchema } from './schemas/streams';
import { TagSchema } from './schemas/tags';
import { TASK_DEFAULT_CALL_STATE, TASK_STATUS, TaskSchema } from './schemas/tasks';
import { TypeCurveFitSchema } from './schemas/type-curve-fits';
import { TypeCurveNormalizationWellSchema } from './schemas/type-curve-normalization-wells';
import { TypeCurveNormalizationSchema } from './schemas/type-curve-normalizations';
import { TypeCurveUmbrellaSchema } from './schemas/type-curve-umbrellas';
import { TypeCurveWellAssignmentSchema } from './schemas/type-curve-well-assignments';
import { TC_NO_NORMALIZATION, TypeCurveSchema } from './schemas/type-curves';
import { UserSchema } from './schemas/users';
import { MAX_WELL_COMMENTS_PER_BUCKET, WellCommentBucketSchema } from './schemas/well-comments';
import { WellDirectionalSurveySchema } from './schemas/well-directional-surveys';
import { WellIdentifiersValidationResultSchema } from './schemas/well-identifiers-validation-results';
import { WellSchema, getGeoHash } from './schemas/wells';

export * from './schemas';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const schemas: { [k: string]: any } = {
	ApiCredentialSchema,
	ApiImportSchema,
	ApiTenantSchema,
	ArchivedProjectSchema,
	ARCHIVE_PROJECT_VERSIONS,
	LATEST_ARCHIVE_PROJECT_VERSION,
	ASSUMPTION_FIELDS,
	AssumptionSchema,
	CreateWellsTemplateSchema,
	CustomHeaderConfigurationSchema,
	DailyProductionSchema,
	DailyStreamDataSchema,
	DataImportMappingSchema,
	DeterministicForecastDataSchema,
	DIAGNOSTIC_BATCH_SIZE,
	ECON_RUN_V2_SENSITIVITY,
	ECON_RUN_V3_VISUALIZATIONS,
	ECON_RUN_V4_INCREMENTALS,
	EconRunSchema,
	GhgRunSchema,
	EconComboSettingSchema,
	EconGroupConfigurationSchema,
	EconGroupDefaultUserConfigurationSchema,
	EconGroupSchema,
	EconReportExportConfigurationSchema,
	EconReportExportDefaultUserConfigurationSchema,
	EconReportSettingSchema,
	EconRunsDataSchema,
	EconSettingSchema,
	EconVisualizationSetupSchema,
	FileImportSchema,
	FileSchema,
	FilterSettingSchema,
	FilterSchema,
	FORECAST_BASE_PHASES,
	FORECAST_BASE_SERIES: BASE_SERIES,
	FORECAST_BATCH_SIZE,
	FORECAST_ROLL_UP_BATCH_SIZE,
	ForecastBucketSchema,
	ForecastConfiguration,
	ForecastConfigurationSchema,
	ForecastDataSchema,
	ForecastExportSchema,
	ForecastRollUpRunSchema,
	ForecastSchema,
	ForecastWellAssignmentSchema,
	HeatmapSettingSchema,
	LOOKUP_TABLES_OPERATORS,
	LOOKUP_TABLES_WELL_HEADERS_WITH_TYPES,
	LookupTableSchema,
	FORECAST_LOOKUP_TABLES_PHASE_ENUM,
	FORECAST_LOOKUP_TABLES_RESOLUTION_ENUM,
	ForecastLookupTableSchema,
	MapHeaderSchema,
	MAX_WELLS_IN_FORECAST,
	MAX_WELLS_IN_SCENARIO,
	MonthlyProductionSchema,
	MonthlyStreamDataSchema,
	MTD_DENOM,
	NotificationSchema,
	NOTIFICATION_TYPE,
	OwnershipQualifierSchema,
	PasswordlessTokenSchema,
	ProjectCustomHeadersDataSchema,
	ProjectCustomHeaderSchema,
	PROJECT_CUSTOM_HEADER_KEY_PREFIX,
	PROJECT_CUSTOM_HEADERS_LIMIT,
	PROJECT_CUSTOM_HEADER_KEYS,
	ProjectSchema,
	ProximityForecastDataSchema,
	QUALIFIERS,
	QueueSchema,
	ROLL_UP_BATCH_SIZE,
	RollUpGroupSchema,
	SCEN_WELL_ASSIGNMENT_DEFAULT_VALUES,
	SCEN_WELL_ASSIGNMENT_QUALIFIER_FIELDS,
	SCEN_WELL_ASSIGNMENT_SCHEMA_VERSION,
	SCENARIO_MAX_QUALIFIERS_PER_COLUMN,
	DEFAULT_QUALIFIER_KEY,
	ScenarioError,
	ScenarioSchema,
	ScenarioWellAssignmentSchema,
	ScenRollUpRunSchema,
	ScheduleConstructionSchema,
	ScheduleSchema,
	ScheduleSettingSchema,
	ScheduleInputQualifiersSchema,
	ModularEconomicsConfigurationSchema,
	EmbeddedLookupTableSchema,
	ScheduleWellOutputSchema,
	SessionSchema,
	ShapefileSchema,
	ShareableCodeImportSchema,
	ShareableCodeSchema,
	SortingSchema,
	DefaultUserSortingSchema,
	StreamSchema,
	StreamWellAssignmentSchema,
	TASK_DEFAULT_CALL_STATE,
	TASK_STATUS,
	TaskSchema,
	TC_NO_NORMALIZATION,
	TypeCurveFitSchema,
	TypeCurveNormalizationSchema,
	TypeCurveNormalizationWellSchema,
	TypeCurveSchema,
	TypeCurveUmbrellaSchema,
	TypeCurveWellAssignmentSchema,
	UserSchema,
	AccessPolicySchema,
	WellIdentifiersValidationResultSchema,
	WellSchema,
	forecastDataObj,
	getGeoHash,
	rollUpParseDate,
	CompanyForecastSettingSchema,
	MAX_WELL_COMMENTS_PER_BUCKET,
	WellCommentBucketSchema,
	WellDirectionalSurveySchema,
	TagSchema,
	NetworkSchema,
	FacilitySchema,
	updateNetworkTopLevelIds,
	GroupSchema,
};

// Remove this after update to mongoose 6
export type GetDocType<S> = S extends Schema<infer T> ? T : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const bulkReplace = async (model: any, documents: any[], upsert: any, getReplaceFilter: any, transform: any) => {
	const operations = documents.map((document) => {
		transform(document);
		const filter = getReplaceFilter(document);
		return { replaceOne: { filter, replacement: document, upsert } };
	});

	return model.bulkWrite(operations);
};

/**
 * Executes a find query and saves the found documents back to the db in batches. Compared to batchCopy is safer in
 * performance
 *
 * @param model - Collection to find and insert to.
 * @param queryParams - Query to use in find.
 * @param batchSize - Size of batch to insert back into the db.
 * @param selection - Optional projection for the find.
 * @param transform - Optional transform, accepts a mongo document and modifies it.
 */
export const safeBatchCopy = async (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	model: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	queryParams: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	batchSize: any = 250,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	selection: any = false,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	transform: any = (elem: any) => elem
) => {
	const docs = [];
	const query = model.find(queryParams).select(selection).lean();
	const cursor = query.cursor();

	// eslint-disable-next-line no-await-in-loop
	for (let doc = await cursor.next(); doc !== null; doc = await cursor.next()) {
		// @ts-ignore -- TODO ts fix later
		docs.push(doc);
		if (docs.length === batchSize) {
			docs.forEach(transform);
			// eslint-disable-next-line no-await-in-loop
			await model.insertMany(docs);
			docs.length = 0;
		}
	}

	if (docs.length > 0) {
		docs.forEach(transform);
		await model.insertMany(docs);
	}
};

/**
 * Executes a find query and replace the documents matching the replace filter with the found documents.
 *
 * @param model - Collection to find and replace to.
 * @param queryParams - Query to use in find source docs.
 * @param getReplaceFilter - Function to get filter to match the docs to be replaced.
 * @param batchSize - Size of batch to replace back into the db.
 * @param selection - Optional projection for the find.
 * @param transform - Optional transform, accepts a mongo document and modifies it.
 * @param upsert - If true, replacement doc will be inserted if no doc matches the replace filter
 */
export const BatchReplace = async (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	model: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	queryParams: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	getReplaceFilter: any,
	batchSize = 250,
	selection = false,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	transform: any = (elem: any) => elem,
	upsert = false
) => {
	const docs = [];
	const query = model.find(queryParams).select(selection).lean();
	const cursor = query.cursor();

	// eslint-disable-next-line no-await-in-loop
	for (let doc = await cursor.next(); doc !== null; doc = await cursor.next()) {
		// @ts-ignore -- TODO ts fix later
		docs.push(doc);
		if (docs.length === batchSize) {
			// eslint-disable-next-line no-await-in-loop
			await bulkReplace(model, docs, upsert, getReplaceFilter, transform);
			docs.length = 0;
		}
	}

	if (docs.length > 0) {
		await bulkReplace(model, docs, upsert, getReplaceFilter, transform);
	}
};
