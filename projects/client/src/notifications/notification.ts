import _ from 'lodash';

export interface NotificationExtraData {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	body?: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	output?: any;
	error?: string;
}

export interface Notification {
	id: string;
	status: TaskStatus;
	title: string;
	description: string;
	type: NotificationType;
	progress?: number;
	read: boolean;
	createdAt: Date;
	updatedAt?: Date;
	extra: NotificationExtraData;
	dynamic: boolean;
	hidden: boolean;
	actionPerformed?: boolean;
}

const excludableUpdateProps = ['_id'];
const dateProps = ['createdAt', 'updatedAt'];
const objectProps = ['extra'];

export enum TaskStatus {
	QUEUED = 'queued',
	RUNNING = 'pending',
	COMPLETED = 'complete',
	FAILED = 'failed',
}

export enum NotificationType {
	CC_CC_IMPORT = 'cc-cc-import',
	CC_CC_EXPORT = 'cc-cc-export',
	CC_TO_ARIES = 'cc-to-aries',
	CC_TO_PHDWIN = 'cc-to-phdwin',
	DIAGNOSTICS = 'diagnostics',
	ECONOMICS_FILE = 'economics_file',
	ECON_REPORT_BY_WELL = 'econ-report-by-well',
	FEEDBACK = 'feedback',
	FILE_UPLOAD = 'file_upload',
	FORECAST = 'forecast',
	FORECAST_IMPORT = 'forecast-import',
	ROLL_UP = 'rollUp',
	COPY_SCENARIO = 'copy-scenario',
	IMPORT_MODELS = 'import-models',
	IMPORT_MODELS_FROM_FILTERS = 'import-models-from-filters',
	COPY_FORECAST = 'copy-forecast',
	IMPORT_FORECAST = 'import-forecast',
	IMPORT_TYPE_CURVE = 'import-type-curve',
	MERGE_FORECASTS = 'merge-forecasts',
	DUPLICATE_FORECAST_WELLS = 'duplicate-forecast-wells',
	COPY_LOOKUP_TABLE = 'copy-lookup-table',
	IMPORT_LOOKUP_TABLE = 'import-lookup-table',
	COPY_EMBEDDED_LOOKUP_TABLE = 'copy-embedded-lookup-table',
	IMPORT_EMBEDDED_LOOKUP_TABLE = 'import-embedded-lookup-table',
	COPY_PROJECT = 'copy-project',
	IMPORT_QUALIFIER = 'import-qualifier',
	IMPORT_OWNERSHIP_QUALIFIER = 'import-ownership-qualifier',
	COPY_SCHEDULE = 'copy-schedule',
	COPY_TYPE_CURVE = 'copy-type-curve',
	CREATE_WELLS = 'create-wells',
	COPY_WELLS = 'copy-wells',
	DELETE_WELLS = 'delete-wells',
	COPY_FORECAST_LOOKUP_TABLE = 'copy-forecast-lookup-table',
	IMPORT_FORECAST_LOOKUP_TABLE = 'import-forecast-lookup-table',
	IMPORT_SCENARIO = 'import-scenario',
	FILE_IMPORT = 'file-import',
	ARCHIVE_PROJECT = 'archive-project',
	RESTORE_PROJECT = 'restore-project',
	REMOVE_LEADING_ZEROS = 'remove-leading-zeros',
	PRODUCTION_DATA_EXPORT = 'production-data-export',
	DIRECTIONAL_SURVEY_EXPORT = 'directional-survey-export',
	ECONOMICS = 'economics',
	EXPORT_FORECAST_DATA = 'forecast-export',
	EXPORT_FORECAST_CHARTS = 'forecast-charts-export',
	FORECAST_CONVERT_TYPE = 'forecast-convert-type',
	WELL_CALCS = 'well-calcs',
	WELL_SPACING_CALCS = 'well-spacing-calcs',
	ECON_WELL_CALCS = 'econ-well-calcs',
	DI_IMPORT = 'di-import',
	EXPORT_SCENARIO_TABLE_WITH_LOOKUP = 'export-scenario-table-with-lookup',
	IMPORT_PROJECT = 'import-project',
	MASS_SHIFT_SEGMENTS = 'mass-shift-segments',
	MASS_ADD_SEGMENT = 'mass-add-segment',
	MERGE_SCENARIOS = 'merge-scenarios',
	MERGE_PROJECTS = 'merge-projects',
	UPLOAD_SHAPEFILE = 'upload-shapefile',
	COLLISION_REPORT = 'collision-report',
	CHANGE_WELL_IDENTIFIERS = 'change-well-identifiers',
	SCHEDULE_ORDER_IMPORT = 'schedule-order-import',
	SCHEDULE_RUN = 'schedule-run',
	COPY_SCHEDULING_LOOKUP_TABLE = 'copy-scheduling-lookup-table',
	IMPORT_SCHEDULING_LOOKUP_TABLE = 'import-scheduling-lookup-table',
	DELETE_PROJECT_MODELS = 'delete-project-models',
	VALIDATE_CHANGE_WELL_IDENTIFIERS = 'validate-change-well-identifiers',
	MAP_LAYER_EXPORT = 'map-layer-export',
	EXPORT_GANTT_TO_PDF = 'export-gantt-pdf',
	EXPORT_WELLS = 'export-wells',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function mapNotification(serverNotification: any, dynamic = true): Notification {
	const notification = {
		id: serverNotification._id,
		status: serverNotification.status,
		title: serverNotification.title,
		description: serverNotification.description,
		type: serverNotification.type,
		progress: serverNotification.progress,
		read: serverNotification.read,
		createdAt: serverNotification.createdAt ? new Date(serverNotification.createdAt) : new Date(),
		updatedAt: serverNotification.updatedAt ? new Date(serverNotification.updatedAt) : undefined,
		extra: serverNotification.extra,
		dynamic,
		hidden: false,
		actionPerformed: serverNotification.actionPerformed,
	};

	return notification;
}

/** @note this function mutates the arguments */
export function mergeWithExistingNotification(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	serverNotification: any,
	existingNotification: Notification
): Notification {
	if (
		serverNotification.updatedAt &&
		existingNotification.updatedAt &&
		new Date(serverNotification.updatedAt) < existingNotification.updatedAt
	) {
		return existingNotification;
	}

	Object.keys(serverNotification).forEach((prop) => {
		if (excludableUpdateProps.indexOf(prop) < 0) {
			if (_.isUndefined(existingNotification[prop]) || objectProps.indexOf(prop) < 0) {
				if (dateProps.indexOf(prop) > 0) {
					existingNotification[prop] = new Date(serverNotification[prop]);
				} else {
					existingNotification[prop] = serverNotification[prop];
				}
			}
			// existing object prop
			else {
				_.merge(existingNotification[prop], serverNotification[prop]);
			}
		}
	});

	return existingNotification;
}

export default Notification;
