// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const qs = require('qs');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const fetch = require('node-fetch');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { getAuthHeaders } = require('./auth');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { API_URL } = require('./config');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { PBIRequestError } = require('./errors');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { loadFormData } = require('./files');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { retry } = require('./retries');

class PowerBI {
	constructor(clientId, clientSecret) {
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	async _internalGetFetchParams(uri, options) {
		const { headers = {}, method = 'GET', ...rest } = options;
		const url = API_URL + uri;

		const authHeaders = await getAuthHeaders(this.clientId, this.clientSecret);
		const finalOptions = {
			...rest,
			method,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				...headers,
				...authHeaders,
			},
		};
		return [url, finalOptions];
	}

	async _internalFetchApi(uri, fetchOptions) {
		const [url, options] = await this._internalGetFetchParams(uri, fetchOptions);
		const response = await fetch(url, options);
		const text = await response.text();

		const { headers, ok, status } = response;
		const requestId = headers.get('requestid');

		if (!ok) {
			throw new PBIRequestError({
				method: options.method,
				url,
				status,
				requestId,
				response: text,
				pbiErrorInfo: headers.get('X-PowerBI-Error-Info'),
			});
		}
		const body = text ? JSON.parse(text) : undefined;
		return { body, meta: { requestId } };
	}

	async fetchApi(uri, fetchOptions = {}) {
		return retry(() => this._internalFetchApi(uri, fetchOptions));
	}

	/* datasets */

	async getDatasets(workspaceId) {
		const {
			body: { value },
		} = await this.fetchApi(`groups/${workspaceId}/datasets`);
		return value;
	}

	async getDatasetRefreshHistory(workspaceId, datasetId, query) {
		let uri = `groups/${workspaceId}/datasets/${datasetId}/refreshes`;

		if (query) {
			uri = `${uri}?${qs.stringify(query)}`;
		}

		const {
			body: { value },
		} = await this.fetchApi(uri);
		return value;
	}

	async refreshDataset(workspaceId, datasetId) {
		const { meta } = await this.fetchApi(`groups/${workspaceId}/datasets/${datasetId}/refreshes`, {
			formData: {
				NotifyOption: 'MailOnFailure',
			},
			headers: {
				'Content-Type': 'application/json',
			},
			method: 'POST',
		});
		return meta;
	}

	async updateDatasetParameters(workspaceId, datasetId, parameters) {
		// NOTE: This operation is only supported for the dataset owner
		const { meta } = await this.fetchApi(`groups/${workspaceId}/datasets/${datasetId}/Default.UpdateParameters`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ updateDetails: parameters }),
		});
		return meta;
	}

	async takeOverDataset(workspaceId, datasetId) {
		const { meta } = await this.fetchApi(`groups/${workspaceId}/datasets/${datasetId}/Default.TakeOver`, {
			method: 'POST',
		});
		return meta;
	}

	/* reports */

	async getReports(workspaceId) {
		const {
			body: { value },
		} = await this.fetchApi(`groups/${workspaceId}/reports`);
		return value;
	}

	async getReportDetails(workspaceId, reportId) {
		const { body } = await this.fetchApi(`groups/${workspaceId}/reports/${reportId}`);
		return body;
	}

	/* imports */

	async getImportDetails(workspaceId, importId) {
		const { body } = await this.fetchApi(`groups/${workspaceId}/imports/${importId}`);
		return body;
	}

	async importReport(workspaceId, reportName, reportPath) {
		const requestBody = await loadFormData(reportPath, reportName);

		const { meta, body } = await this.fetchApi(
			`groups/${workspaceId}/imports?datasetDisplayName=${reportName}.pbix&nameConflict=CreateOrOverwrite`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'multipart/form-data',
				},
				body: requestBody,
			}
		);
		return { ...meta, ...body };
	}

	/* datasources */

	async getDatasources(workspaceId, datasetId) {
		const {
			body: { value },
		} = await this.fetchApi(`groups/${workspaceId}/datasets/${datasetId}/datasources`);
		return value;
	}

	async patchDatasource(gatewayId, datasourceId, datasource) {
		// NOTE: This operation is only supported for the dataset owner
		const { meta } = await this.fetchApi(`gateways/${gatewayId}/datasources/${datasourceId}`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
			},
			body: JSON.stringify(datasource),
		});

		return meta;
	}
}

module.exports = { PowerBI };
