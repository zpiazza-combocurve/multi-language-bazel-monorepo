import { SecretManagerClient } from 'combocurve-utils/secret-manager';
import { Request } from 'express';

import config from '../config';
import { buildConnectionString } from './mongo';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
// @ts-expect-error
const secretsClient = new SecretManagerClient(config.gcpPrimaryProjectId);

export const getBucketNames = (name) => ({
	fileStorageBucket: `${name}-combocurve-file-storage-v2`,
	batchStorageBucket: `${name}-combocurve-batches-storage-v2`,
	econStorageBucket: `${name}-combocurve-econ-files-v2`,
	archiveStorageBucket: `${name}-combocurve-archive-storage-v2`,
});

function getGCPInfo(name) {
	return {
		...getBucketNames(name),
		importQueue: `${name}-file-import`,
		bigQueryDataset: `${name}_dataset`,
	};
}

async function getDbInfoFromSecrets({ clusterKey, nameKey }) {
	const usernameKey = 'dbUsername';
	const passwordKey = 'dbPassword';

	const [dbUsername, dbPassword, dbCluster, dbName] = await Promise.all([
		secretsClient.accessSecret(usernameKey),
		secretsClient.accessSecret(passwordKey),
		secretsClient.accessSecret(clusterKey),
		secretsClient.accessSecret(nameKey),
	]);

	if (!(dbUsername && dbPassword && dbCluster && dbName)) {
		throw Error(`Missing db info ${nameKey}`);
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

export const getDbInfo = (name) => {
	if (name === 'local') {
		return Promise.resolve(config.localDbInfo);
	}

	const clusterKey = `${name}DbCluster`;
	const nameKey = `${name}DbName`;

	return getDbInfoFromSecrets({ clusterKey, nameKey });
};

function getSharedDbInfo() {
	const secretKeys = {
		clusterKey: 'dbCluster',
		nameKey: 'dbName',
	};

	return getDbInfoFromSecrets(secretKeys);
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

async function getAuth0Info(nameKey, isSupport) {
	const clientIdKey = 'auth0AppClientId';
	const connectionKey = isSupport ? `${nameKey}Auth0SupportConnection` : `${nameKey}Auth0Connection`;
	const auth0OrganizationIdKey = isSupport ? `${nameKey}Auth0SupportOrganizationId` : `${nameKey}Auth0OrganizationId`;
	const auth0BackendClientIdKey = 'auth0BackendClientId';
	const auth0BackendClientSecretKey = 'auth0BackendClientSecret';

	const [auth0AppClientId, auth0Connection, auth0OrganizationId, auth0BackendClientId, auth0BackendClientSecret] =
		await Promise.all([
			secretsClient.accessSecret(clientIdKey),
			secretsClient.accessSecret(connectionKey),
			secretsClient.accessSecret(auth0OrganizationIdKey),
			secretsClient.accessSecret(auth0BackendClientIdKey),
			secretsClient.accessSecret(auth0BackendClientSecretKey),
		]);

	if (!(auth0AppClientId && auth0Connection && auth0OrganizationId)) {
		throw Error(`Missing Auth0 info for tenant: ${nameKey}${isSupport ? ' support' : ''}`);
	}

	return {
		auth0AppClientId,
		auth0Connection,
		auth0OrganizationId,
		auth0BackendClientId,
		auth0BackendClientSecret,
	};
}

async function getMapboxInfo() {
	const [mapboxFrontendToken, mapboxBackendToken] = await Promise.all([
		secretsClient.accessSecret('mapboxFrontendToken'),
		secretsClient.accessSecret('mapboxBackendToken'),
	]);

	return { mapboxFrontendToken, mapboxBackendToken };
}

export const getTenantInfo = async (name, isSupport) => {
	return Object.freeze({
		...(await getPusherInfo()),
		...(await getDbInfo(name)),
		...(await getAuth0Info(name, isSupport)),
		...getGCPInfo(name),
		...(await getMapboxInfo()),
		name,
		isSupport,
		shared: await getSharedDbInfo(),
	});
};

export interface ITenantHeaderInfo {
	archiveStorageBucket: string;
	batchStorageBucket: string;
	bigQueryDataset: string;
	dbConnectionString: string;
	dbName: string;
	dbUsername: string;
	dbPassword: string;
	dbCluster: string;
	econStorageBucket: string;
	fileStorageBucket: string;
	importQueue: string;
	name: string;
	pusherAppId: string;
	pusherCluster: string;
	pusherKey: string;
	pusherSecret: string;
	subdomain: string;
	dalServerAddress: string;
}

export const TENANT_HEADER_MAPPINGS: { [K in keyof ITenantHeaderInfo]: string } = {
	archiveStorageBucket: 'inpt-archive-storage-bucket',
	batchStorageBucket: 'inpt-batch-storage-bucket',
	bigQueryDataset: 'inpt-big-query-dataset',
	dbConnectionString: 'inpt-db-connection-string',
	dbName: 'inpt-db-name',
	econStorageBucket: 'inpt-econ-storage-bucket',
	fileStorageBucket: 'inpt-file-storage-bucket',
	importQueue: 'inpt-import-queue',
	name: 'subdomain',
	pusherAppId: 'inpt-pusher-app-id',
	pusherCluster: 'inpt-pusher-cluster',
	pusherKey: 'inpt-pusher-key',
	pusherSecret: 'inpt-pusher-secret',
	subdomain: 'subdomain',
	dbUsername: 'inpt-db-username',
	dbPassword: 'inpt-db-password',
	dbCluster: 'inpt-db-cluster',
	dalServerAddress: 'inpt-dal-server-address',
};

export const getRequestTenantFromHeaders = (req: Request): ITenantHeaderInfo => {
	const { headers } = req;

	const tenant = {};
	Object.entries(TENANT_HEADER_MAPPINGS).forEach(([destKey, sourceKey]) => {
		const val = headers[sourceKey];
		if (!val) {
			throw Error(`Missing header: ${sourceKey}`); // TODO change to custom error with expected and such
		}
		tenant[destKey] = val;
	});

	return tenant as ITenantHeaderInfo;
};

export const getContextTenantInfoFromHeaders = async (
	headersTenantInfo: ITenantHeaderInfo
): Promise<IBaseTenantInfo> => {
	return headersTenantInfo;
};

export type TenantInfo = Awaited<ReturnType<typeof getTenantInfo>>;

export interface IBaseTenantInfo {
	archiveStorageBucket: string;
	batchStorageBucket: string;
	bigQueryDataset: string;
	dbConnectionString: string;
	dbName: string;
	dbUsername: string;
	dbPassword: string;
	dbCluster: string;
	econStorageBucket: string;
	fileStorageBucket: string;
	importQueue: string;
	name: string;
	pusherAppId: string;
	pusherCluster: string;
	pusherKey: string;
	pusherSecret: string;
	subdomain: string;
	dalServerAddress: string;
}
