import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { FLUID_MODEL_KEY, IFluidModel } from '@src/models/econ/fluid-model';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiFluidModel, ApiFluidModelKey, getFilters, getSort, toApiFluidModel } from './fields/fluid-model';

export class FluidModelService extends BaseService<ApiContextV1> {
	static attribute = 'fluidModel';

	async getFluidModelsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiFluidModel | null> {
		const econModel = await this.context.econModelService.getById(id, FLUID_MODEL_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiFluidModel(econModel as IFluidModel);
	}

	async getFluidModels(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiFluidModel>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const fluidModels = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IFluidModel[];

		const result = fluidModels.slice(0, take).map(toApiFluidModel);

		return {
			result,
			hasNext: fluidModels.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiFluidModelKey] as CursorType)
					: null,
		};
	}

	async deleteFluidModelIdById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, FLUID_MODEL_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiFluidModels: Array<ApiFluidModel | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiFluidModel | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiFluidModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiFluidModel | undefined>;
	}

	async checkWells(
		apiFluidModels: Array<ApiFluidModel | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiFluidModel | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiFluidModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiFluidModel | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, FLUID_MODEL_KEY, projectId);
		return result;
	}

	async create(fluidModels: Array<IFluidModel | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(fluidModels, FLUID_MODEL_KEY, false);
		return result;
	}

	async upsert(
		fluidModels: Array<IFluidModel | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(fluidModels, projectId, FLUID_MODEL_KEY, false);
		return result;
	}
}
