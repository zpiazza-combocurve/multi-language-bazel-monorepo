// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { TASK_STATUS } = require('./tasks');

const NOTIFICATION_TYPE = {
	CC_CC_IMPORT: 'cc-cc-import',
	CC_CC_EXPORT: 'cc-cc-export',
	CC_TO_ARIES: 'cc-to-aries',
	DIAGNOSTICS: 'diagnostics',
	ECONOMICS_FILE: 'economics_file',
	ECON_REPORT_BY_WELL: 'econ-report-by-well',
	FILE_UPLOAD: 'file_upload',
	FORECAST: 'forecast',
	FORECAST_IMPORT: 'forecast-import',
	PROXIMITY_FORECAST: 'proximity-forecast',
	ROLL_UP: 'rollUp',
	COPY_SCENARIO: 'copy-scenario',
	IMPORT_MODELS: 'import-models',
	IMPORT_MODELS_FROM_FILTERS: 'import-models-from-filters',
	COPY_FORECAST: 'copy-forecast',
	IMPORT_FORECAST: 'import-forecast',
	IMPORT_TYPE_CURVE: 'import-type-curve',
	MERGE_FORECASTS: 'merge-forecasts',
	DUPLICATE_FORECAST_WELLS: 'duplicate-forecast-wells',
	COPY_LOOKUP_TABLE: 'copy-lookup-table',
	IMPORT_LOOKUP_TABLE: 'import-lookup-table',
	COPY_EMBEDDED_LOOKUP_TABLE: 'copy-embedded-lookup-table',
	IMPORT_EMBEDDED_LOOKUP_TABLE: 'import-embedded-lookup-table',
	COPY_PROJECT: 'copy-project',
	IMPORT_QUALIFIER: 'import-qualifier',
	IMPORT_OWNERSHIP_QUALIFIER: 'import-ownership-qualifier',
	COPY_SCHEDULE: 'copy-schedule',
	COPY_TYPE_CURVE: 'copy-type-curve',
	CREATE_WELLS: 'create-wells',
	COPY_WELLS: 'copy-wells',
	DELETE_WELLS: 'delete-wells',
	COPY_FORECAST_LOOKUP_TABLE: 'copy-forecast-lookup-table',
	IMPORT_FORECAST_LOOKUP_TABLE: 'import-forecast-lookup-table',
	IMPORT_SCENARIO: 'import-scenario',
	FILE_IMPORT: 'file-import',
	ARCHIVE_PROJECT: 'archive-project',
	RESTORE_PROJECT: 'restore-project',
	REMOVE_LEADING_ZEROS: 'remove-leading-zeros',
	PRODUCTION_DATA_EXPORT: 'production-data-export',
	DIRECTIONAL_SURVEY_EXPORT: 'directional-survey-export',
	ECONOMICS: 'economics',
	EXPORT_FORECAST_DATA: 'forecast-export',
	EXPORT_FORECAST_CHARTS: 'forecast-charts-export',
	LIB_FORECAST: 'libForecast',
	FORECAST_CONVERT_TYPE: 'forecast-convert-type',
	WELL_CALCS: 'well-calcs',
	ECON_WELL_CALCS: 'econ-well-calcs',
	WELL_SPACING_CALCS: 'well-spacing-calcs',
	DI_IMPORT: 'di-import',
	EXPORT_SCENARIO_TABLE_WITH_LOOKUP: 'export-scenario-table-with-lookup',
	IMPORT_PROJECT: 'import-project',
	MASS_SHIFT_SEGMENTS: 'mass-shift-segments',
	MERGE_SCENARIOS: 'merge-scenarios',
	MERGE_PROJECTS: 'merge-projects',
	UPLOAD_SHAPEFILE: 'upload-shapefile',
	SCHEDULE_ORDER_IMPORT: 'schedule-order-import',
	SCHEDULE_RUN: 'schedule-run',
	VALIDATE_CHANGE_WELL_IDENTIFIERS: 'validate-change-well-identifiers',
	COLLISION_REPORT: 'collision-report',
	CHANGE_WELL_IDENTIFIERS: 'change-well-identifiers',
	DELETE_PROJECT_MODELS: 'delete-project-models',
	COPY_NETWORK: 'copy-network',
	COPY_FACILITY: 'copy-facility',
	MAP_LAYER_EXPORT: 'map-layer-export',
	EXPORT_GANTT_TO_PDF: 'export-gantt-pdf',
	EXPORT_WELLS: 'export-wells',
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const NotificationSchema = Schema(
	{
		type: {
			type: String,
			required: true,
			enum: Object.values(NOTIFICATION_TYPE),
		},
		status: {
			type: String,
			enum: [TASK_STATUS.QUEUED, TASK_STATUS.RUNNING, TASK_STATUS.COMPLETED, TASK_STATUS.FAILED],
		},
		title: { type: String },
		description: { type: String },
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, index: true },
		forUser: { type: Schema.ObjectId, ref: 'users', index: true },
		read: { type: Boolean, default: false },
		actionPerformed: { type: Boolean, default: false },
		extra: { type: Object }, // for links, errors, refs to other tables (e.g. forecast id)
	},
	{ timestamps: true }
);

NotificationSchema.index({ createdAt: 1 }, { expires: '14d' });

module.exports = { NotificationSchema, NOTIFICATION_TYPE };
