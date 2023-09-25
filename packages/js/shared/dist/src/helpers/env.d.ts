declare const getEnv: (name: string) => string;
declare const getEnvs: <T extends string>(names: T[]) => { [K in T]: string; };
export { getEnv, getEnvs };
//# sourceMappingURL=env.d.ts.map