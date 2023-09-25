// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');

// Docs for secret library:
// https://cloud.google.com/secret-manager/docs/reference/libraries#client-libraries-install-nodejs
// https://googleapis.dev/nodejs/secretmanager/latest/v1beta1.SecretManagerServiceClient.html#accessSecretVersion

class InvalidArgumentException extends Error {
	constructor(...params) {
		super(...params);
		this.name = InvalidArgumentException.name;
		this.expected = true;
	}
}

const NOT_FOUND = 5;

class SecretManagerClient {
	/**
	 * Constructs the SecretManager client. If project and credentials are not supplied will use the
	 * GOOGLE_APPLICATION_CREDENTIALS env var to find the service.json key file. Otherwise will use app engine default
	 * credentials.
	 *
	 * @param {any} project
	 * @param {any} credentials
	 */
	constructor(project, credentials) {
		if (!project) {
			throw new InvalidArgumentException('Must provide the GCP project name to retrieve secrets from');
		}
		this.project = project;
		if (project && credentials) {
			this.client = new SecretManagerServiceClient({ project, credentials });
		} else {
			this.client = new SecretManagerServiceClient({ project });
		}
	}

	async accessSecret(key) {
		const [accessResponse] = await this.client.accessSecretVersion({
			name: `projects/${this.project}/secrets/${key}/versions/latest`,
		});
		return accessResponse.payload.data.toString('utf8');
	}

	/**
	 * Creates a new secret
	 *
	 * @param {any} key
	 * @param {any} payload
	 * @param {any} labels - Optional labels, for example {'label': 'value'} have to be lowercase or number with - or _
	 */
	async createSecret(key, payload, labels) {
		await this.client.createSecret({
			parent: `projects/${this.project}`,
			secret: {
				name: key,
				replication: { automatic: {} },
				labels,
			},
			secretId: key,
		});

		await this.addSecretVersion(key, payload);
	}

	async addSecretVersion(name, payload, labels, create = false) {
		try {
			await this.client.addSecretVersion({
				parent: `projects/${this.project}/secrets/${name}`,
				payload: {
					data: Buffer.from(payload, 'utf-8'),
				},
			});
		} catch (e) {
			if (e.code === NOT_FOUND && create) {
				await this.createSecret(name, payload, labels);
			} else {
				throw e;
			}
		}
	}
}

module.exports = {
	SecretManagerClient,
};
