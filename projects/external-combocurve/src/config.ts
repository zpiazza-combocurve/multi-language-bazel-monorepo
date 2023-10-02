/**
 * The purpose of this file is to provide a single key-value configuration object containing all the settings
 * for the environment to be referenced across the app.
 *
 * Principles:
 *	- Don't Repeat Yourself (DRY).
 *	- Separate configuration from code.
 *	- Don't hard-code settings. Prefer environment variables (specially for credentials).
 *	- When unable to use env vars, use config files which are not checked into revision control.
 *	- Avoid config groups (per environment config groups) since they don't scale cleanly.
 *	- Define environment specific config at deploy time via independent environment vars.
 *
 * See this article: https://12factor.net/config
 */

import inspector from 'inspector';

const {
	EXTERNAL_API_IMPORT_URL,
	FLEX_CLOUD_FUNCTIONS_URL,
	FLEX_SERVER_URL,
	LOCAL_DB,
	LOCAL_DB_CLUSTER,
	LOCAL_DB_CONNECTION_STRING,
	GCP_PRIMARY_PROJECT_ID,
	GCP_REGIONAL_PROJECT_ID,
	LOCAL_ENV,
	NODE_ENV,
	PORT,
	REGION,
	WELL_SERVICE_URL,
	DATABASE_TIMEOUT_SECONDS,
	FORECAST_SERVICE_URL,
	CLOUD_FUNCTION_DEFAULT_MAX_RETRIES,
	CLOUD_FUNCTION_MAX_TIMEOUT_SECONDS,
	DAILY_FORECAST_VOLUME_YEAR_NUMBER_LIMIT,
	ECON_MONTHLY_CONCURRENCY,
	ECON_MONTHLY_ATTEMPTS,
	ECON_MONTHLY_ATTEMPT_DELAY_MS,
	DAL_ADDRESS,
	GEN_SPECS,
} = process.env; // eslint-disable-line no-process-env

const localDbInfo = {
	dbConnectionString: `${LOCAL_DB_CONNECTION_STRING}${LOCAL_DB}`,
	dbName: LOCAL_DB,
	dbCluster: LOCAL_DB_CLUSTER,
	dbUsername: '',
	dbPassword: '',
};

const devEnv = NODE_ENV === 'development';

export default {
	devEnv,
	environment: NODE_ENV,
	externalApiImportUrl: EXTERNAL_API_IMPORT_URL,
	flexCloudFunctionsUrl: FLEX_CLOUD_FUNCTIONS_URL || `https://${REGION}-${GCP_PRIMARY_PROJECT_ID}.cloudfunctions.net`,
	flexServerUrl: FLEX_SERVER_URL || `https://flex-cc-dot-${GCP_REGIONAL_PROJECT_ID}.appspot.com`,
	gcpPrimaryProjectId: GCP_PRIMARY_PROJECT_ID as string,
	isDebug: !!inspector.url(),
	localDbInfo,
	localEnv: LOCAL_ENV, // controls which tenant the development server uses
	port: PORT ? Number(PORT) : 5007,
	region: REGION,
	serviceName: 'external-api',
	wellServiceUrl: WELL_SERVICE_URL,
	databaseTimeoutSeconds: DATABASE_TIMEOUT_SECONDS ? Number(DATABASE_TIMEOUT_SECONDS) : 60,
	cloudFunctionDefaultMaxRetries: CLOUD_FUNCTION_DEFAULT_MAX_RETRIES ? Number(CLOUD_FUNCTION_DEFAULT_MAX_RETRIES) : 3,
	cloudFunctionMaxTimeoutSeconds: CLOUD_FUNCTION_MAX_TIMEOUT_SECONDS
		? Number(CLOUD_FUNCTION_MAX_TIMEOUT_SECONDS)
		: 180,
	forecastServiceUrl: FORECAST_SERVICE_URL,
	dailyForecastVolumeYearNumberLimit: DAILY_FORECAST_VOLUME_YEAR_NUMBER_LIMIT
		? Number(DAILY_FORECAST_VOLUME_YEAR_NUMBER_LIMIT)
		: 5,
	econMonthlyConcurrency: ECON_MONTHLY_CONCURRENCY ? Number(ECON_MONTHLY_CONCURRENCY) : 4,
	restApiUserEmail: 'rest.api@combocurve.com',
	econMonthlyAttempts: ECON_MONTHLY_ATTEMPTS ? Number(ECON_MONTHLY_ATTEMPTS) : 4,
	econMonthlyAttemptDelayMS: ECON_MONTHLY_ATTEMPT_DELAY_MS ? Number(ECON_MONTHLY_ATTEMPT_DELAY_MS) : 1000,
	dalAddress: DAL_ADDRESS ?? '',
	genSpecs: GEN_SPECS ?? false,
};
