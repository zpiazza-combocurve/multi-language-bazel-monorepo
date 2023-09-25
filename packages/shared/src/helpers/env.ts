const getEnv = (name: string): string => {
	const env = process.env[name];
	if (!env) {
		throw new Error(`Missing env variable ${name}`);
	}

	return env;
};

const getEnvs = <T extends string>(names: T[]): { [K in T]: string } => {
	return names.reduce((acc, name) => {
		acc[name] = getEnv(name);
		return acc;
	}, {} as { [K in T]: string });
};

export { getEnv, getEnvs };
