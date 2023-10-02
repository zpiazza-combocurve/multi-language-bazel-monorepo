import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { DIFFERENTIALS_KEY, IDifferentials } from '@src/models/econ/differentials';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiDifferentials, ApiDifferentialsKey, getFilters, getSort, toApiDifferentials } from './fields/differentials';

export class DifferentialsService extends BaseService<ApiContextV1> {
	static attribute = 'differentials';

	async getDifferentialsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiDifferentials | null> {
		const econModel = await this.context.econModelService.getById(id, DIFFERENTIALS_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiDifferentials(econModel as IDifferentials);
	}

	async getDifferentials(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiDifferentials>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const differentials = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IDifferentials[];

		const result = differentials.slice(0, take).map(toApiDifferentials);

		return {
			result,
			hasNext: differentials.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiDifferentialsKey] as CursorType)
					: null,
		};
	}

	async deleteDifferentialById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, DIFFERENTIALS_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiDifferentials: Array<ApiDifferentials | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDifferentials | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiDifferentials as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiDifferentials | undefined>;
	}

	async checkWells(
		apiDifferentials: Array<ApiDifferentials | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDifferentials | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiDifferentials as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiDifferentials | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, DIFFERENTIALS_KEY, projectId);
		return result;
	}

	async create(differentials: Array<IDifferentials | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(differentials, DIFFERENTIALS_KEY);
		return result;
	}

	async upsert(
		differentials: Array<IDifferentials | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(differentials, projectId, DIFFERENTIALS_KEY);
		return result;
	}
}
