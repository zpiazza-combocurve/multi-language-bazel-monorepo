import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { GENERAL_OPTIONS_KEY, IGeneralOptions } from '@src/models/econ/general-options';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseProjectResolved } from '../../fields';

import {
	ApiGeneralOptionsFieldsKeys,
	ApiGeneralOptionsType,
	getDocumentFromRequest,
	getFilters,
	getRequestFromDocument,
	getSort,
} from './fields/econ-function';

export class GeneralOptionsService extends BaseService<ApiContextV1> {
	static attribute = 'GeneralOptions';

	async getCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getPaginated(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiGeneralOptionsType>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const queryOutput = await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const result = queryOutput.slice(0, take).map((m) => getRequestFromDocument(m as IGeneralOptions));

		return {
			result,
			hasNext: queryOutput.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiGeneralOptionsFieldsKeys] as CursorType)
					: null,
		};
	}

	async create(models: Array<ApiGeneralOptionsType>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(this.createDocs(models, projectId), GENERAL_OPTIONS_KEY);
		return result;
	}

	async upsert(models: Array<ApiGeneralOptionsType>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		return await this.context.econModelService.upsert(
			this.createDocs(models, projectId),
			projectId,
			GENERAL_OPTIONS_KEY,
		);
	}

	private createDocs(models: Array<ApiGeneralOptionsType>, projectId: Types.ObjectId): Array<IGeneralOptions> {
		return models.map((m) => getDocumentFromRequest(m, projectId));
	}
}
