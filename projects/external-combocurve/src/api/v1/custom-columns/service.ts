import {
	ICustomHeaderConfiguration,
	ISingleProductionCustomColumn,
	IWellCustomColumn,
} from '@src/models/custom-columns';
import { BaseService } from '@src/base-context';

import { ApiContextV1 } from '../context';

import {
	ApiSingleProductionCustomColumn,
	toApiSingleProductionCustomColumn,
} from './fields/single-production-custom-columns-fields';
import { ApiWellCustomColumn, toApiWellCustomColumn } from './fields/wells-custom-columns-fields';

export const CUSTOM_HEADER_COLLECTIONS = ['wells', 'daily-productions', 'monthly-productions'];
export type CustomHeadersCollections = keyof Pick<
	ICustomHeaderConfiguration,
	'wells' | 'monthly-productions' | 'daily-productions'
>;
export class CustomColumnService extends BaseService<ApiContextV1> {
	attribute = 'customColumnService';

	async getCustomColumns(
		collection: CustomHeadersCollections,
	): Promise<ApiSingleProductionCustomColumn | ApiWellCustomColumn> {
		const customHeaders = await this.context.models.CustomHeaderConfigurationModel.findOne().lean();
		const collectionHeader = customHeaders?.[collection];
		if (collection !== 'wells') {
			return toApiSingleProductionCustomColumn(collectionHeader as ISingleProductionCustomColumn);
		} else {
			return toApiWellCustomColumn(collectionHeader as IWellCustomColumn);
		}
	}
}
