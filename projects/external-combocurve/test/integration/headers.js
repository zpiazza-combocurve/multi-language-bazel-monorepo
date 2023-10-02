const createHeaders = (tenant) => {
	const {
		dbName,
		name,
		dbConnectionString,
		fileStorageBucket,
		batchStorageBucket,
		econStorageBucket,
		archiveStorageBucket,
	} = tenant;
	return Object.freeze({
		'inpt-db-name': dbName,
		subdomain: name,
		'inpt-db-connection-string': dbConnectionString,
		'inpt-file-storage-bucket': fileStorageBucket,
		'inpt-batch-storage-bucket': batchStorageBucket,
		'inpt-econ-storage-bucket': econStorageBucket,
		'inpt-archive-storage-bucket': archiveStorageBucket,
		'inpt-import-queue': 'import-queue',
		'inpt-pusher-app-id': '670367',
		'inpt-pusher-cluster': 'us2',
		'inpt-pusher-key': '33a8880b62bcfc127ea5',
		'inpt-pusher-secret': '05b01641cf8654cbed18',
		'inpt-project-name': '',
		'inpt-big-query-dataset': '',
		'inpt-db-username': '',
		'inpt-db-password': '',
		'inpt-db-cluster': '',
	});
};

module.exports = {
	createHeaders,
};
