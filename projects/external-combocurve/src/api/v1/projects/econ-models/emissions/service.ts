import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { EMISSIONS_KEY, IEmission } from '@src/models/econ/emissions';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiEmission, ApiEmissionKey, getFilters, getSort, toApiEmission } from './fields/emission';

export class EmissionService extends BaseService<ApiContextV1> {
	static attribute = 'emissionModel';

	async getEmissionsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiEmission | null> {
		const econModel = await this.context.econModelService.getById(id, EMISSIONS_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiEmission(econModel as IEmission);
	}

	async getEmissions(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiEmission>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const emissionModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IEmission[];

		const result = emissionModel.slice(0, take).map(toApiEmission);

		return {
			result,
			hasNext: emissionModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiEmissionKey] as CursorType)
					: null,
		};
	}

	async deleteEmissionById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, EMISSIONS_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiEmissionModels: Array<ApiEmission | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEmission | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiEmissionModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiEmission | undefined>;
	}

	async checkWells(
		apiEmissionModels: Array<ApiEmission | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEmission | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiEmissionModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiEmission | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		if (!names || names.length === 0) {
			return [];
		}

		const result = await this.context.econModelService.getExistingNames(names, EMISSIONS_KEY, projectId);
		return result;
	}

	async create(emissionModel: Array<IEmission | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(emissionModel, EMISSIONS_KEY, false);
		return result;
	}

	async upsert(
		emissionModel: Array<IEmission | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(emissionModel, projectId, EMISSIONS_KEY, false);
		return result;
	}
}
