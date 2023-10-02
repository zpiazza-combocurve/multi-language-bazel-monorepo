import path from 'path';

import { buildSpec } from '../lib/express-openapi-ts';

import { writeSecurity } from './security';

const envPrefix = process.argv[2];
const includeSecurity = process.argv[3] === 'includeSecurity';

const { API_TENANTS_READER_CS } = process.env;

const configFile = path.join('spec', envPrefix ? `config-${envPrefix}` : 'config');

const build = async () => {
	if (includeSecurity) {
		if (!API_TENANTS_READER_CS) {
			throw new Error('Missing required env var `API_TENANTS_READER_CS`');
		}
		await writeSecurity(envPrefix, API_TENANTS_READER_CS);
	}
	buildSpec(configFile);
};

build();
