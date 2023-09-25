// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { openConnection } = require('./database');

const TENANT_HEADER_MAPPINGS = [
	['archiveStorageBucket', 'inpt-archive-storage-bucket'],
	['batchStorageBucket', 'inpt-batch-storage-bucket'],
	['bigQueryDataset', 'inpt-big-query-dataset'],
	['dbConnectionString', 'inpt-db-connection-string'],
	['dbName', 'inpt-db-name'],
	['econStorageBucket', 'inpt-econ-storage-bucket'],
	['fileStorageBucket', 'inpt-file-storage-bucket'],
	['importQueue', 'inpt-import-queue'],
	['pusherAppId', 'inpt-pusher-app-id'],
	['pusherCluster', 'inpt-pusher-cluster'],
	['pusherKey', 'inpt-pusher-key'],
	['pusherSecret', 'inpt-pusher-secret'],
	['subdomain', 'subdomain'],
	['redisHost', 'inpt-redis-host'],
	['redisPort', 'inpt-redis-port'],
];

function getTenantInfo(headers) {
	const tenant = {};
	TENANT_HEADER_MAPPINGS.forEach(([destKey, sourceKey]) => {
		const val = headers[sourceKey];
		if (!val) {
			throw Error(`Missing header: ${sourceKey}`); // TODO change to custom error with expected and such
		}
		tenant[destKey] = val;
	});
	return tenant;
}

async function getCloudContext(req) {
	const { headers } = req;
	const tenant = getTenantInfo(headers);
	const db = await openConnection(tenant);
	return { db, tenant };
}

const contextInitializer = (ContextClass) => async (headers) => {
	const tenant = getTenantInfo(headers);
	const db = await openConnection(tenant);
	const context = new ContextClass(tenant, db);
	return context;
};

module.exports = { contextInitializer, getCloudContext };
