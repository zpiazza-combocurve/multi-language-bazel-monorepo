"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_1 = require("./helpers/env");
const { LOCAL_DB, LOCAL_DB_CLUSTER, LOCAL_DB_CONNECTION_STRING, PYTHON_SERVER_URL } = process.env;
const { NODE_ENV, GCP_PRIMARY_PROJECT_ID, GCP_REGIONAL_PROJECT_ID } = (0, env_1.getEnvs)([
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
exports.default = config;
//# sourceMappingURL=config.js.map