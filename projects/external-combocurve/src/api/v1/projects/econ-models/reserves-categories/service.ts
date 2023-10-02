import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IReservesCategory, RESERVES_CATEGORY_KEY } from '@src/models/econ/reserves-categories';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiReservesCategory,
	ApiReservesCategoryKey,
	getFilters,
	getSort,
	toApiReservesCategory,
} from './fields/reserves-category';

export class ReservesCategoryService extends BaseService<ApiContextV1> {
	static attribute = 'reservesCategory';

	async getReservesCategoriesCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiReservesCategory | null> {
		const econModel = await this.context.econModelService.getById(id, RESERVES_CATEGORY_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiReservesCategory(econModel as IReservesCategory);
	}

	async getReservesCategories(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiReservesCategory>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const reservesCategories = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IReservesCategory[];

		const result = reservesCategories.slice(0, take).map(toApiReservesCategory);

		return {
			result,
			hasNext: reservesCategories.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiReservesCategoryKey] as CursorType)
					: null,
		};
	}

	async checkScenarios(
		apiReservesCategories: Array<ApiReservesCategory | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiReservesCategory | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiReservesCategories as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiReservesCategory | undefined>;
	}

	async checkWells(
		apiReservesCategories: Array<ApiReservesCategory | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiReservesCategory | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiReservesCategories as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiReservesCategory | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, RESERVES_CATEGORY_KEY, projectId);
		return result;
	}

	async create(reservesCategories: Array<IReservesCategory | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(reservesCategories, RESERVES_CATEGORY_KEY);
		return result;
	}

	async upsert(
		reservesCategories: Array<IReservesCategory | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(reservesCategories, projectId, RESERVES_CATEGORY_KEY);
		return result;
	}

	async deleteReservesCategoryById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, RESERVES_CATEGORY_KEY, project);

		return successCount as number;
	}
}
