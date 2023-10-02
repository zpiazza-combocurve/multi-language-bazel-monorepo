import { Types } from 'mongoose';

import { ACTUAL_FORECAST_KEY, IActualOrForecast } from '@src/models/econ/actual-forecast';
import { CursorType, IPageData } from '@src/api/v1/pagination';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';

import { BaseProjectResolved } from '../../fields';

import {
	ActualForecastKey,
	ApiActualForecast,
	getDocumentFromRequest,
	getFilters,
	getRequestFromDocument,
	getSort,
} from './fields/actual-forecast';

export class ActualForecastService extends BaseService<ApiContextV1> {
	static attribute = 'ActualForecast';

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
	): Promise<IPageData<ApiActualForecast>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const queryOutput = await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const result = queryOutput.slice(0, take).map((m) => getRequestFromDocument(m as IActualOrForecast));

		return {
			result,
			hasNext: queryOutput.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ActualForecastKey] as CursorType)
					: null,
		};
	}

	async create(models: Array<ApiActualForecast>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(this.createDocs(models, projectId), ACTUAL_FORECAST_KEY);
		return result;
	}

	async upsert(models: Array<ApiActualForecast>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		return await this.context.econModelService.upsert(
			this.createDocs(models, projectId),
			projectId,
			ACTUAL_FORECAST_KEY,
		);
	}

	private createDocs(models: Array<ApiActualForecast>, projectId: Types.ObjectId): Array<IActualOrForecast> {
		return models.map((m) => getDocumentFromRequest(m, projectId));
	}
}
