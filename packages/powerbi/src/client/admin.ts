import FormData from 'form-data';

import type {
	PowerBIDatasetDetails,
	PowerBIDatasetParameterInput,
	PowerBIDatasourceDetails,
	PowerBIImportDetails,
	Report,
	ResponseMeta,
} from './types';
import { IPowerBIUserClient, PowerBIUserClient } from './user';
import { IPowerBIAuth } from './utils/auth';

export interface IPowerBIAdminClient extends IPowerBIUserClient {
	/* datasets */

	getDatasets(workspaceId: string): Promise<PowerBIDatasetDetails[]>;

	updateDatasetParameters(workspaceId: string, datasetId: string, parameters: object): Promise<ResponseMeta>;

	takeOverDataset(workspaceId: string, datasetId: string): Promise<ResponseMeta>;

	/* reports */

	getReports(workspaceId: string): Promise<Report[]>;

	/* imports */

	getImportDetails(workspaceId: string, importId: string): Promise<PowerBIImportDetails>;

	importReport(workspaceId: string, reportName: string, file: Buffer): Promise<ResponseMeta>;

	/* datasources */

	getDatasources(workspaceId: string, datasetId: string): Promise<PowerBIDatasourceDetails[]>;

	patchDatasource(
		workspaceId: string,
		gatewayId: string,
		datasourceId: string,
		datasource: object
	): Promise<ResponseMeta>;
}

export class PowerBIAdminClient extends PowerBIUserClient implements IPowerBIAdminClient {
	// eslint-disable-next-line no-useless-constructor -- TODO eslint fix later
	constructor(auth: IPowerBIAuth) {
		super(auth);
	}

	/* datasets */

	async getDatasets(workspaceId: string) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/get-datasets-in-group */
		const {
			body: { value },
		} = await this.get(`groups/${workspaceId}/datasets`).exec().parse();
		return value;
	}

	async updateDatasetParameters(workspaceId: string, datasetId: string, parameters: PowerBIDatasetParameterInput[]) {
		/**
		 * Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/update-parameters-in-group
		 *
		 * NOTE: Only the dataset owner is allowed to perform this operation
		 */
		const { meta } = await this.post(`groups/${workspaceId}/datasets/${datasetId}/Default.UpdateParameters`, {
			updateDetails: parameters,
		})
			.exec()
			.parse();
		return meta;
	}

	async takeOverDataset(workspaceId: string, datasetId: string) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/take-over-in-group */
		const { meta } = await this.post(`groups/${workspaceId}/datasets/${datasetId}/Default.TakeOver`, null)
			.exec()
			.parse();
		return meta;
	}

	/* reports */

	async getReports(workspaceId: string) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/reports/get-reports-in-group */
		const {
			body: { value },
		} = await this.get(`groups/${workspaceId}/reports`).exec().parse();
		return value;
	}

	/* imports */

	async getImportDetails(workspaceId: string, importId: string) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/imports/get-import-in-group */
		const { body } = await this.get(`groups/${workspaceId}/imports/${importId}`).exec().parse();
		return body;
	}

	async importReport(workspaceId: string, reportName: string, file: Buffer) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/imports/post-import-in-group */
		const form = new FormData();
		form.append(reportName, file);

		const query = { datasetDisplayName: `${reportName}.pbix`, nameConflict: 'CreateOrOverwrite' };
		const { meta, body } = await this.post(`groups/${workspaceId}/imports?${new URLSearchParams(query)}`, form, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		})
			.exec()
			.parse();
		return { ...meta, ...body };
	}

	/* datasources */

	async getDatasources(workspaceId: string, datasetId: string) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/datasets/get-datasources-in-group */
		const {
			body: { value },
		} = await this.get(`groups/${workspaceId}/datasets/${datasetId}/datasources`).exec().parse();
		return value;
	}

	async patchDatasource(workspaceId: string, gatewayId: string, datasourceId: string, datasource: object) {
		/** Docs: https://docs.microsoft.com/en-us/rest/api/power-bi/gateways/update-datasource */
		const { meta } = await this.patch(`gateways/${gatewayId}/datasources/${datasourceId}`, datasource)
			.exec()
			.parse();

		return meta;
	}
}
