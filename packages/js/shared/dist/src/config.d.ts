declare const config: {
    environment: string;
    gcpPrimaryProjectId: string;
    gcpRegionalProjectId: string;
    testEnv: boolean;
    devEnv: boolean;
    devOrTestEnv: boolean;
    localDbInfo: {
        dbConnectionString: string;
        dbName: string | undefined;
        dbCluster: string | undefined;
        dbUsername: string;
        dbPassword: string;
    };
    pythonServerUrl: string;
};
export default config;
//# sourceMappingURL=config.d.ts.map