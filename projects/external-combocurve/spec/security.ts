import { dump, load } from 'js-yaml';
import { GetDocType, schemas } from 'combocurve-utils/mongo';
import fs from 'fs';
import mongoose from 'mongoose';
import path from 'path';

import { IOpenApi2 } from '../lib/express-openapi-ts';

type IDbTenant = GetDocType<typeof schemas.ApiTenantSchema>;

const connectToSharedDb = async (uri: string): Promise<mongoose.Connection> => {
	return await mongoose.createConnection(uri, { useNewUrlParser: true, useUnifiedTopology: true });
};

const getApiTenants = async (sharedDbUri: string): Promise<IDbTenant[]> => {
	const db = await connectToSharedDb(sharedDbUri);
	const array = await db.model('api-tenants', schemas.ApiTenantSchema).find();
	await db.close();
	return array;
};

const SPECIAL_AUDIENCE = {
	beta: 'https://api.combocurve.com',
};

const createSecurityDefinition = (serviceAccountEmail: string, audience: string) => ({
	authorizationUrl: '',
	flow: 'implicit',
	type: 'oauth2',
	'x-google-issuer': serviceAccountEmail,
	'x-google-jwks_uri': `https://www.googleapis.com/robot/v1/metadata/x509/${serviceAccountEmail}`,
	'x-google-audiences': audience,
});

const getTenantKey = (tenant: string) => `external-api-${tenant}`;

const buildSecurityDefinitions = (tenants: IDbTenant[], envPrefix: string) => {
	return tenants.reduce(
		(accumulator, document) => {
			const { tenant, serviceAccountEmail } = document;

			const audience = SPECIAL_AUDIENCE[envPrefix] || `https://${envPrefix}-api.combocurve.com`;

			accumulator[getTenantKey(tenant)] = createSecurityDefinition(serviceAccountEmail, audience);
			return accumulator;
		},
		{} as Record<string, ReturnType<typeof createSecurityDefinition>>,
	);
};

const buildSecurity = (tenants: IDbTenant[]) => {
	return tenants.map((document) => {
		const { tenant } = document;
		const tenantKey = getTenantKey(tenant);
		return { 'api-key': [], [tenantKey]: [] };
	});
};

const build = async (envPrefix: string, uri: string) => {
	// generates securityDefinitions and security sections to from the API tenant list in the environment
	const tenants = await getApiTenants(uri);

	const securityDefinitions = buildSecurityDefinitions(tenants, envPrefix);
	const security = buildSecurity(tenants);

	return { securityDefinitions, security };
};

const loadYaml = (filePath: string) => {
	const yaml = fs.readFileSync(filePath, { encoding: 'utf-8' });
	return load(yaml);
};

const DUMP_OPTIONS = {
	// https://github.com/nodeca/js-yaml#dump-object---options-
	lineWidth: 120,
};

const dumpYaml = (filePath: string, object: unknown) => {
	const yaml = dump(object, DUMP_OPTIONS);
	fs.writeFileSync(filePath, yaml);
};

export const writeSecurity = async (envPrefix: string, sharedDbUri: string): Promise<void> => {
	// appends securityDefinitions and security sections to `base-{envPrefix}.yaml`

	const yamlPath = path.join(__dirname, `base-${envPrefix}.yaml`);
	const baseSpec = loadYaml(yamlPath) as IOpenApi2;

	const specAddition = await build(envPrefix, sharedDbUri);

	dumpYaml(yamlPath, { ...baseSpec, ...specAddition });
};
