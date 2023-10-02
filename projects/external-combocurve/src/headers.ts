import config from './config';
import { ITenantInfo } from './tenant';

// TODO: this will need more fields
export interface ITenantHeaders {
	'inpt-db-name': string;
	subdomain: string;
	'inpt-db-connection-string': string;
	'inpt-project-name': string;
	'inpt-file-storage-bucket': string;
	'inpt-batch-storage-bucket': string;
	'inpt-econ-storage-bucket': string;
	'inpt-archive-storage-bucket': string;
	'inpt-dal-server-address': string;
}

export const createHeaders = (tenant: ITenantInfo): ITenantHeaders => {
	const {
		dbName,
		name,
		dbConnectionString,
		fileStorageBucket,
		batchStorageBucket,
		econStorageBucket,
		archiveStorageBucket,
		pusherKey,
		pusherAppId,
		pusherSecret,
		pusherCluster,
		dbUsername,
		dbPassword,
		dbCluster,
		bigQueryDataset,
		importQueue,
	} = tenant;
	return Object.freeze({
		'inpt-db-name': dbName,
		subdomain: name,
		'inpt-db-connection-string': dbConnectionString,
		'inpt-project-name': 'DEPRECATED',
		'inpt-file-storage-bucket': fileStorageBucket,
		'inpt-batch-storage-bucket': batchStorageBucket,
		'inpt-econ-storage-bucket': econStorageBucket,
		'inpt-archive-storage-bucket': archiveStorageBucket,
		// TODO: get these from the right places
		'inpt-import-queue': importQueue,
		'inpt-pusher-app-id': pusherAppId,
		'inpt-pusher-cluster': pusherCluster,
		'inpt-pusher-key': pusherKey,
		'inpt-pusher-secret': pusherSecret,
		'inpt-big-query-dataset': bigQueryDataset,
		'inpt-db-username': dbUsername,
		'inpt-db-password': dbPassword,
		'inpt-db-cluster': dbCluster,
		'inpt-dal-server-address': config.dalAddress,
		'inpt-dal-url': config.dalAddress,
	});
};
