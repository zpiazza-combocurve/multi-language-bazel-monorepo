// eslint-disable-next-line
// @ts-nocheck
import qs from 'querystring';
import { SecretManagerClient } from 'combocurve-utils/secret-manager';

import config from './config';

let secretsClient;

if (config.environment != 'test') {
	secretsClient = new SecretManagerClient(config.gcpPrimaryProjectId);
}

function buildConnectionString({ username, password, cluster, database, params = null }) {
	const encodedUser = encodeURIComponent(username);
	const encodedPassword = encodeURIComponent(password);

	const url = `mongodb+srv://${encodedUser}:${encodedPassword}@${cluster}/${database}`;

	if (!params) {
		return url;
	}
	const encodedParams = qs.stringify(params);
	return `${url}?${encodedParams}`;
}

async function getDbInfo(name: string) {
	if (config.devEnv && name === 'local') {
		return Promise.resolve(config.localDbInfo);
	}

	const usernameKey = `dbUsername`;
	const passwordKey = `dbPassword`;
	const clusterKey = `${name}DbCluster`;
	const nameKey = `${name}DbName`;

	const [dbUsername, dbPassword, dbCluster, dbName] = await Promise.all([
		secretsClient.accessSecret(usernameKey),
		secretsClient.accessSecret(passwordKey),
		secretsClient.accessSecret(clusterKey),
		secretsClient.accessSecret(nameKey),
	]);

	if (!(dbUsername && dbPassword && dbCluster && dbName)) {
		throw Error(`Missing db info for tenant: ${name}`);
	}

	const dbConnectionString = buildConnectionString({
		username: dbUsername,
		password: dbPassword,
		cluster: dbCluster,
		database: dbName,
	});

	return {
		dbUsername,
		dbPassword,
		dbCluster,
		dbName,
		dbConnectionString,
	};
}

async function getPusherInfo() {
	const keyKey = 'pusherKey';
	const appIdKey = 'pusherAppId';
	const secretKey = 'pusherSecret';
	const clusterKey = 'pusherCluster';

	const [pusherKey, pusherAppId, pusherSecret, pusherCluster] = await Promise.all([
		secretsClient.accessSecret(keyKey),
		secretsClient.accessSecret(appIdKey),
		secretsClient.accessSecret(secretKey),
		secretsClient.accessSecret(clusterKey),
	]);

	if (!(pusherKey && pusherAppId && pusherSecret && pusherCluster)) {
		throw Error('Missing pusher info');
	}

	return {
		pusherKey,
		pusherAppId,
		pusherSecret,
		pusherCluster,
	};
}

export const getGCPInfo = (tenantName: string): Pick<ITenantInfo, 'bigQueryDataset' | 'importQueue'> => ({
	importQueue: `${tenantName}-file-import`,
	bigQueryDataset: `${tenantName}_dataset`,
});

export const getGCSInfo = (
	tenant: string,
): Pick<ITenantInfo, 'fileStorageBucket' | 'batchStorageBucket' | 'econStorageBucket' | 'archiveStorageBucket'> => ({
	fileStorageBucket: `${tenant}-combocurve-file-storage-v2`,
	batchStorageBucket: `${tenant}-combocurve-batches-storage-v2`,
	econStorageBucket: `${tenant}-combocurve-econ-files-v2`,
	archiveStorageBucket: `${tenant}-combocurve-archive-storage-v2`,
});

export interface ITenantInfo {
	// TODO: this will need more fields
	dbConnectionString: string;
	dbName: string;
	bigQueryDataset: string;
	name: string;
	fileStorageBucket: string;
	batchStorageBucket: string;
	econStorageBucket: string;
	archiveStorageBucket: string;
	pusherKey: string;
	pusherAppId: string;
	pusherSecret: string;
	pusherCluster: string;
	dbUsername: string;
	dbPassword: string;
	dbCluster: string;
	dbName: string;
	dbConnectionString: string;
	importQueue: string;
}

export const getTenantInfo = async (tenant: string): Promise<ITenantInfo> => {
	const dbInfo = await getDbInfo(tenant);
	const gpcInfo = getGCPInfo(tenant);
	const gcsInfo = getGCSInfo(tenant);
	const pusherInfo = await getPusherInfo();
	return Promise.resolve({
		...dbInfo,
		...gpcInfo,
		...gcsInfo,
		...pusherInfo,
		name: tenant,
	});
};
