import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { DataSource } from '@src/models/wells';
import { ITenantHeaders } from '@src/headers';
import { notNil } from '@src/helpers/typing';

import { IMultiStatusResponse, IRecordStatus, mergeRecordResults } from '../../multi-status';
import { ApiContextV1 } from '../../context';

import { toFailedStatus, toUpdatedStatus } from './multi-status';

export const ID_FIELDS = ['inptID', 'api10', 'api12', 'api14', 'aries_id', 'phdwin_id'] as const;
export type IdField = (typeof ID_FIELDS)[number];

export type ValidationResult = {
	collisions: Record<string, string[]>;
	missingIdentifier?: string[];
};

type WellValidationErrors = {
	wellId: string;
	results: ValidationResult;
};

type ChangeIdentifierResponse = { updated: string[]; notUpdated: WellValidationErrors[] };

export type WellIdentifierNewInfo = {
	dataSource?: DataSource;
	chosenKeyID?: IdField;
	companyScope?: boolean;
};

export type WellIdentifierRequest = {
	wellId: string;
	newInfo: WellIdentifierNewInfo;
};

export class WellIdentifierService extends BaseService<ApiContextV1> {
	static attribute = 'wellIdentifierService';

	async getExistingWellIds(wellIds: string[]): Promise<string[]> {
		return (await this.context.models.WellModel.find({ _id: { $in: wellIds } }, { _id: 1 })).map(({ _id }) =>
			_id.toString(),
		);
	}

	async changeWellIdentifiers(
		request: (WellIdentifierRequest | undefined)[],
		userId: string | undefined,
	): Promise<IMultiStatusResponse> {
		const validItems = request.filter(notNil);
		let response: ChangeIdentifierResponse = { updated: [], notUpdated: [] };
		if (validItems.length) {
			response = (await callCloudFunction({
				fullUrl: `${config.wellServiceUrl}/api/wells-identifier`,
				body: validItems,
				headers: { ...this.context.headers, 'USER-ID': userId } as ITenantHeaders,
			})) as ChangeIdentifierResponse;
		}
		return this.getUpdateMultiResponse(request, response);
	}

	private getUpdateMultiResponse(
		originalArray: (WellIdentifierRequest | undefined)[],
		response: ChangeIdentifierResponse,
	): IMultiStatusResponse {
		const multiResponse = {} as IMultiStatusResponse;

		const originalArrayWellIds = originalArray.map((w) => w?.wellId.toString());
		const updated = originalArrayWellIds.map((wellId) => {
			if (wellId && response.updated.includes(wellId)) {
				return wellId;
			}
			return undefined;
		});
		const failedResponse = originalArrayWellIds.map((w, index) => {
			if (w && !updated.includes(w)) {
				const errorResults = response.notUpdated.find((y) => y.wellId == w)?.results;
				return toFailedStatus(w, errorResults, index);
			}
			return undefined;
		}) as IRecordStatus[];
		const createdResponse = updated.map((w) => w && toUpdatedStatus(w)) as IRecordStatus[];

		multiResponse.results = mergeRecordResults(createdResponse, failedResponse, originalArrayWellIds.length);

		return multiResponse;
	}
}
