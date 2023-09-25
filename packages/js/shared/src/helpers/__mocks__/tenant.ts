export const getBucketNames = () => ({
	fileStorageBucket: 'test-combocurve-file-storage-v2',
	batchStorageBucket: 'test-combocurve-batches-storage-v2',
	econStorageBucket: 'test-combocurve-econ-files-v2',
	archiveStorageBucket: 'test-combocurve-archive-storage-v2',
});

function getGCPInfo() {
	return {
		...getBucketNames(),
		importQueue: 'test-file-import',
		bigQueryDataset: 'test_dataset',
	};
}

const getDbInfo = () => ({
	dbConnectionString: global.__MONGO_URI__,
});

function getPusherInfo() {
	return {
		pusherKey: 'test',
		pusherAppId: 'test',
		pusherSecret: 'test',
		pusherCluster: 'test',
	};
}

function getAuth0Info() {
	return {
		auth0AppClientId: 'test',
		auth0Connection: 'test-users',
		auth0OrganizationId: 'testorgid',
		auth0BackendClientId: 'test',
		auth0BackendClientSecret: 'test',
	};
}

function getPowerBiInfo() {
	return {
		pbiUsername: 'test',
		pbiPassword: 'test',
	};
}

const getTenantInfo = async (name, isSupport) => ({
	...getPusherInfo(),
	...getDbInfo(),
	...getAuth0Info(),
	...getPowerBiInfo(),
	...getGCPInfo(),
	name,
	isSupport,
	shared: getDbInfo(),
});

export { getTenantInfo, getDbInfo };
