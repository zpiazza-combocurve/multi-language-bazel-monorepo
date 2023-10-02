import { getGCPInfo, getGCSInfo, ITenantInfo } from '@src/tenant';

export const TENANT_NAME = 'test';

export const getTenantInfo = (dbConnectionString: string): Promise<ITenantInfo> => {
	return Promise.resolve({
		...getGCPInfo(TENANT_NAME),
		...getGCSInfo(TENANT_NAME),
		dbConnectionString,
		name: TENANT_NAME,
		dbName: TENANT_NAME,
		pusherKey: '',
		pusherAppId: '',
		pusherSecret: '',
		pusherCluster: '',
		dbUsername: '',
		dbPassword: '',
		dbCluster: '',
	});
};
