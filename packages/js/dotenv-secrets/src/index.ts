import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import dotenv from 'dotenv';
import fs from 'node:fs';

const ENV_TEMPLATE_FILE = '.env.tpl';

// eslint-disable-next-line no-console
const log = (message: string) => console.log(message ? `dotenv-secrets: ${message}` : message);

const getSecretName = (projectId: string | undefined, secretId: string) => `projects/${projectId}/secrets/${secretId}`;
const getVersionName = (secretName: string) => `${secretName}/versions/latest`;

let secretManager: SecretManagerServiceClient;
const accessSecret = async (secretName: string) => {
	if (!secretManager) {
		secretManager = new SecretManagerServiceClient();
	}

	const versionName = getVersionName(secretName);
	const [version] = await secretManager.accessSecretVersion({
		name: versionName,
	});

	if (version.payload?.data == null) {
		throw new Error('Error accessing secrets, version.payload.data is null.');
	}

	return version.payload.data.toString();
};

export async function config() {
	log('');

	// parse the env var template
	if (fs.existsSync(ENV_TEMPLATE_FILE)) {
		log(`Parsing template file "${ENV_TEMPLATE_FILE}" ...`);
	} else {
		log(`Template file "${ENV_TEMPLATE_FILE}" not found\n`);
		dotenv.config(); // load regular env vars even if there is no template
		return;
	}
	const template = dotenv.parse(fs.readFileSync(ENV_TEMPLATE_FILE));
	const templateVars = Object.keys(template);

	// load default env var values defined in the template
	templateVars.forEach((varName) => {
		const [, defaultValue] = template[varName].split(/^default:/);

		if (defaultValue) {
			process.env[varName] = defaultValue;
		}
	});

	// load env vars from .env
	// this will override env vars loaded in the previous step
	dotenv.config();

	// create a mapping from env var name to secret name
	const projectId = process.env['GCP_PRIMARY_PROJECT_ID'];
	const secretMapping = templateVars.reduce<Record<string, string>>((mapping, varName) => {
		const [, secretId] = template[varName].split(/^secret:/);

		if (secretId) {
			mapping[varName] = getSecretName(projectId, secretId);
		}
		return mapping;
	}, {});

	const secretVars = Object.keys(secretMapping);

	if (secretVars.length > 0) {
		log(`Loading secret values ...`);
	} else {
		log(`No secret env vars found in "${ENV_TEMPLATE_FILE}" ...`);
	}

	// load each secret declared in the template as an env var
	// this will override env vars previously loaded
	const results = secretVars.map(async (varName) => {
		let success;
		const secretName = secretMapping[varName];
		try {
			const secretValue = await accessSecret(secretName);
			process.env[varName] = secretValue;
			success = true;
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error(error);
			success = false;
		}
		return { success, varName, secretName };
	});

	log('');
	await Promise.all(results).then((resolved) => {
		resolved.forEach(({ success, varName, secretName }) => {
			log(`${success ? '✅' : '❌'} ${varName.padEnd(24)} <- ${secretName}`);
		});
	});
	log('');
}
