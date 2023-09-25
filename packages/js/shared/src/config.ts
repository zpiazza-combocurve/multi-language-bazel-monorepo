import { getEnvs } from './helpers/env';

const { LOCAL_DB, LOCAL_DB_CLUSTER, LOCAL_DB_CONNECTION_STRING, PYTHON_SERVER_URL } = process.env;

const { NODE_ENV, GCP_PRIMARY_PROJECT_ID, GCP_REGIONAL_PROJECT_ID } = getEnvs([
	'NODE_ENV',
	'GCP_PRIMARY_PROJECT_ID',
	'GCP_REGIONAL_PROJECT_ID',
]);

const testEnv = NODE_ENV === 'test';
const devEnv = NODE_ENV === 'development';

const config = {
	environment: NODE_ENV,

	gcpPrimaryProjectId: GCP_PRIMARY_PROJECT_ID,
	gcpRegionalProjectId: GCP_REGIONAL_PROJECT_ID,

	testEnv,
	devEnv,
	devOrTestEnv: testEnv || devEnv,

	localDbInfo: {
		dbConnectionString: `${LOCAL_DB_CONNECTION_STRING}${LOCAL_DB}`,
		dbName: LOCAL_DB,
		dbCluster: LOCAL_DB_CLUSTER,
		dbUsername: '',
		dbPassword: '',
	},
	pythonServerUrl: PYTHON_SERVER_URL || `python-apis-dot-${GCP_REGIONAL_PROJECT_ID}.appspot.com`,
};

export default config;
