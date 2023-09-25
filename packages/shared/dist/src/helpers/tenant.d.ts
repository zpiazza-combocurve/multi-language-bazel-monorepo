import { Request } from 'express';
export declare const getBucketNames: (name: any) => {
    fileStorageBucket: string;
    batchStorageBucket: string;
    econStorageBucket: string;
    archiveStorageBucket: string;
};
export declare const getDbInfo: (name: any) => Promise<{
    dbConnectionString: string;
    dbName: string | undefined;
    dbCluster: string | undefined;
    dbUsername: string;
    dbPassword: string;
}>;
export declare const getTenantInfo: (name: any, isSupport: any) => Promise<Readonly<{
    name: any;
    isSupport: any;
    shared: {
        dbUsername: string;
        dbPassword: string;
        dbCluster: string;
        dbName: string;
        dbConnectionString: string;
    };
    mapboxFrontendToken: string;
    mapboxBackendToken: string;
    importQueue: string;
    bigQueryDataset: string;
    fileStorageBucket: string;
    batchStorageBucket: string;
    econStorageBucket: string;
    archiveStorageBucket: string;
    auth0AppClientId: string;
    auth0Connection: string;
    auth0OrganizationId: string;
    auth0BackendClientId: string;
    auth0BackendClientSecret: string;
    dbConnectionString: string;
    dbName: string | undefined;
    dbCluster: string | undefined;
    dbUsername: string;
    dbPassword: string;
    pusherKey: string;
    pusherAppId: string;
    pusherSecret: string;
    pusherCluster: string;
}>>;
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
}
export declare const TENANT_HEADER_MAPPINGS: {
    [K in keyof ITenantHeaderInfo]: string;
};
export declare const getRequestTenantFromHeaders: (req: Request) => ITenantHeaderInfo;
export declare const getContextTenantInfoFromHeaders: (headersTenantInfo: ITenantHeaderInfo) => Promise<IBaseTenantInfo>;
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
}
//# sourceMappingURL=tenant.d.ts.map