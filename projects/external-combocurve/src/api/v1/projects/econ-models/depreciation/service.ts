import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { Depreciation_KEY, IDepreciation } from '@src/models/econ/depreciation';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiDepreciation,
	ApiDepreciationKey,
	getFilters,
	getSort,
	toApiDepreciation,
} from './fields/depreciation-econ-function';

export class DepreciationService extends BaseService<ApiContextV1> {
	static attribute = 'depreciationModel';

	async getDepreciationsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiDepreciation | null> {
		const econModel = await this.context.econModelService.getById(id, Depreciation_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiDepreciation(econModel as IDepreciation);
	}

	async getDepreciations(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiDepreciation>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const depreciationModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IDepreciation[];

		const result = depreciationModel.slice(0, take).map(toApiDepreciation);

		return {
			result,
			hasNext: depreciationModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiDepreciationKey] as CursorType)
					: null,
		};
	}

	async deleteDepreciationById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, Depreciation_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiDepreciationModels: Array<ApiDepreciation | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDepreciation | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiDepreciationModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiDepreciation | undefined>;
	}

	async checkWells(
		apiDepreciationModels: Array<ApiDepreciation | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDepreciation | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiDepreciationModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiDepreciation | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, Depreciation_KEY, projectId);
		return result;
	}

	async create(depreciationModel: Array<IDepreciation | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(depreciationModel, Depreciation_KEY);
		return result;
	}

	async upsert(
		depreciationModel: Array<IDepreciation | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(depreciationModel, projectId, Depreciation_KEY);
		return result;
	}
}
