import { BaseContext, BaseService } from '@combocurve/shared';
// eslint-disable-next-line no-duplicate-imports -- TODO eslint fix later
import { logger } from '@combocurve/shared';
// eslint-disable-next-line no-duplicate-imports -- TODO eslint fix later
import { config } from '@combocurve/shared';
import { getAuthHeader } from 'combocurve-utils/google-cloud-caller';
import http from 'http';
import https from 'https';

const { pythonServerUrl, devEnv } = config;

// This class/file is a temporary solution. If you are seeing this beyond v34 this should be removed as a top priority!
// Once we can pull the python service out of the internal-api and into its own package then this can be removed.
export class PythonApiService extends BaseService<BaseContext> {
	// eslint-disable-next-line no-useless-constructor -- TODO eslint fix later
	constructor(context: BaseContext) {
		super(context);
	}

	private callPythonApi = async ({
		method,
		url,
		body,
		retries,
	}: {
		method: 'POST' | 'GET';
		url: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		body: any;
		retries: number;
	}) => {
		const urlScheme = devEnv ? 'http://' : 'https://';
		const port = devEnv ? 5000 : 443;

		const authObject = await getAuthHeader(urlScheme + pythonServerUrl);
		const authHeader = authObject.Authorization as string;

		const options = {
			hostname: pythonServerUrl,
			port,
			path: url,
			method,
			headers: {
				authorization: authHeader,
				'content-type': 'application/json',
				'inpt-db-connection-string': this.context.tenant.dbConnectionString,
				'inpt-db-name': this.context.tenant.dbName,
				'inpt-db-username': this.context.tenant.dbUsername,
				'inpt-db-password': this.context.tenant.dbPassword,
				'inpt-db-cluster': this.context.tenant.dbCluster,
				'inpt-pusher-app-id': this.context.tenant.pusherAppId,
				'inpt-pusher-key': this.context.tenant.pusherKey,
				'inpt-pusher-secret': this.context.tenant.pusherSecret,
				'inpt-pusher-cluster': this.context.tenant.pusherCluster,
				'inpt-file-storage-bucket': this.context.tenant.fileStorageBucket,
				'inpt-batch-storage-bucket': this.context.tenant.batchStorageBucket,
				'inpt-econ-storage-bucket': this.context.tenant.econStorageBucket,
				'inpt-archive-storage-bucket': this.context.tenant.archiveStorageBucket,
				'inpt-import-queue': this.context.tenant.importQueue,
				'inpt-big-query-dataset': this.context.tenant.bigQueryDataset,
			},
		};

		let req;
		if (devEnv) {
			req = http.request(options, (res) => {
				res.on('data', (d) => {
					process.stdout.write(d);
				});
			});
		} else {
			req = https.request(options, (res) => {
				res.on('data', (d) => {
					process.stdout.write(d);
				});
			});
		}

		req.on('error', (error) => {
			logger.error(
				`There was an error calling python_apis from the forecast-service for ${this.context.tenant.name}: ${error}`
			);
			if (retries > 0) {
				this.callPythonApi({ method, url, body, retries: retries - 1 });
				logger.debug(`Retrying python api call from the forecast-service for ${this.context.tenant.name}`);
			}
		});

		req.write(JSON.stringify(body));
		req.end();
	};

	//When we deprecate this file, the following method should be moved to python-service.ts:
	updateEur = ({
		body,
		retries = 1,
	}: {
		body: {
			forecast_ids: string[]; //The ids of forecasts to be updated
			wells?: string[]; //The ids of wells in the forecasts to be updated. If not included, every well in the forecast will be updated.
			phases?: string[]; //The phases to update. If not included, all phases will be updated.
			is_deterministic?: boolean; // Whether the forecasts are deterministic or not. All forecasts must be of the same deterministic/probabilistic type.
		};
		retries?: number;
	}) => {
		return this.callPythonApi({
			method: 'POST',
			url: '/update_eur',
			body,
			retries,
		});
	};
}
