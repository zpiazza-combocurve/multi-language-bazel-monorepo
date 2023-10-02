const config = require('./config');

const getTenantInfo = () => {
	return Promise.resolve({
		dbConnectionString: config.dbConnectionString,
		name: config.tenantName,
		dbName: config.tenantName,
		fileStorageBucket: `${config.tenantName}-combocurve-file-storage-v2`,
		batchStorageBucket: `${config.tenantName}-combocurve-batches-storage-v2`,
		econStorageBucket: `${config.tenantName}-combocurve-econ-files-v2`,
		archiveStorageBucket: `${config.tenantName}-combocurve-archive-storage-v2`,
		bigQueryDataset: `${config.tenantName}_dataset`,
	});
};

module.exports = {
	getTenantInfo,
};
