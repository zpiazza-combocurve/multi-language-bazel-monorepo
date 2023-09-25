import { PowerBIBaseClient } from './base';
import type { DatasetRefreshDetail, Report } from './types';
// eslint-disable-next-line no-duplicate-imports -- TODO eslint fix later
import type { EmbedToken, PowerBIIdentity, Refresh, ResponseMeta } from './types';
import { IPowerBIAuth } from './utils/auth';

export interface IPowerBIEmbedClient {
	/* tokens */

	generateEmbedToken(
		workspaceId: string,
		datasetId: string,
		reportId: string,
		identities: PowerBIIdentity[]
	): Promise<EmbedToken>;

	/* reports */

	getReportDetails(workspaceId: string, reportId: string): Promise<Report>;
}

export interface IPowerBIUserClient extends IPowerBIEmbedClient {
	/* datasets */

	getDatasetRefreshHistory(
		workspaceId: string,
		datasetId: string,
		query?: Record<string, string>
	): Promise<Refresh[]>;
	getDatasetRefresh(workspaceId: string, datasetId: string, requestId: string): Promise<DatasetRefreshDetail>;

	refreshDataset(workspaceId: string, datasetId: string): Promise<ResponseMeta>;
}

export class PowerBIUserClient extends PowerBIBaseClient implements IPowerBIUserClient {
	// eslint-disable-next-line no-useless-constructor -- TODO eslint fix later
	constructor(auth: IPowerBIAuth) {
		super(auth);
	}

	/* tokens */

	async generateEmbedToken(
		workspaceId: string,
		datasetId: string,
		reportId: string,
		identities: PowerBIIdentity[]
	): Promise<EmbedToken> {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token */
		const { body } = await this.post('GenerateToken', {
			accessLevel: 'View',
			datasets: [{ id: datasetId }],
			reports: [{ id: reportId }],
			targetWorkspaces: [{ id: workspaceId }],
			identities,
		})
			.exec()
			.parse();
		return body;
	}

	/* reports */

	async getReportDetails(workspaceId: string, reportId: string): Promise<Report> {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group */
		const { body } = await this.get(`groups/${workspaceId}/reports/${reportId}`).exec().parse();
		return body;
	}

	/* datasets */

	async getDatasetRefreshHistory(
		workspaceId: string,
		datasetId: string,
		query?: Record<string, string>
	): Promise<Refresh[]> {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/get-refresh-history-in-group */
		let uri = `groups/${workspaceId}/datasets/${datasetId}/refreshes`;

		if (query) {
			uri = `${uri}?${new URLSearchParams(query)}`;
		}

		const {
			body: { value },
		} = await this.get(uri).exec().parse();
		return value;
	}

	async getDatasetRefresh(workspaceId: string, datasetId: string, requestId: string): Promise<DatasetRefreshDetail> {
		/**
		 * Docs:
		 *
		 * - https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/get-refresh-execution-details
		 * - https://docs.microsoft.com/en-us/power-bi/connect-data/asynchronous-refresh#get-refreshesrequestid
		 */

		const { body } = await this.get(`groups/${workspaceId}/datasets/${datasetId}/refreshes/${requestId}`)
			.exec()
			.parse();
		return body;
	}

	async getDatasetRefreshOld(workspaceId: string, datasetId: string, requestId: string): Promise<Refresh> {
		/** Similar to `getDatasetRefresh`, but without using the new "enhanced refresh" API */
		const history = await this.getDatasetRefreshHistory(workspaceId, datasetId);
		const item = history.find((r) => r.requestId === requestId);

		if (!item) {
			throw new Error(`Refresh not found, the provided requestId "${requestId}" must be invalid`);
		}

		return item;
	}

	async refreshDataset(workspaceId: string, datasetId: string) {
		/**
		 * Docs:
		 *
		 * - https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/refresh-dataset-in-group
		 * - https://docs.microsoft.com/en-us/power-bi/connect-data/asynchronous-refresh#post-refreshes
		 * - https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/get-refresh-execution-details-in-group
		 */
		const { meta } = await this.post(`groups/${workspaceId}/datasets/${datasetId}/refreshes`, {
			commitMode: 'Transactional',
			maxParallelism: 2,
			retryCount: 2,
			type: 'Automatic',
		})
			.exec()
			.parse();
		return meta;
	}

	async refreshDatasetOld(workspaceId: string, datasetId: string) {
		/**
		 * Similar to `refreshDataset`, but without using the new "enhanced refresh" API
		 *
		 * Docs:
		 *
		 * - https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/refresh-dataset-in-group
		 */
		const { meta } = await this.post(`groups/${workspaceId}/datasets/${datasetId}/refreshes`, {}).exec().parse();
		return meta;
	}
}
