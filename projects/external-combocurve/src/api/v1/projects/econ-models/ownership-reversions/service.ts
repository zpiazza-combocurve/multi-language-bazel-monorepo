import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IOwnershipReversions, OWNERSHIP_REVERSION_KEY } from '@src/models/econ/ownership-reversions';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiOwnershipReversion,
	ApiOwnershipReversionKey,
	getFilters,
	getSort,
	toApiOwnershipReversion,
} from './fields/ownership-reversions';

export class OwnershipReversionService extends BaseService<ApiContextV1> {
	static attribute = 'ownershipReversion';

	async getOwnershipReversionsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiOwnershipReversion | null> {
		const econModel = await this.context.econModelService.getById(id, OWNERSHIP_REVERSION_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiOwnershipReversion(econModel as IOwnershipReversions);
	}

	async getOwnershipReversions(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiOwnershipReversion>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const reservesCategories = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IOwnershipReversions[];

		const result = reservesCategories.slice(0, take).map(toApiOwnershipReversion);

		return {
			result,
			hasNext: reservesCategories.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiOwnershipReversionKey] as CursorType)
					: null,
		};
	}

	async checkScenarios(
		apiOwnershipReversion: Array<ApiOwnershipReversion | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiOwnershipReversion | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiOwnershipReversion as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiOwnershipReversion | undefined>;
	}

	async checkWells(
		apiOwnershipReversion: Array<ApiOwnershipReversion | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiOwnershipReversion | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiOwnershipReversion as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiOwnershipReversion | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, OWNERSHIP_REVERSION_KEY, projectId);
		return result;
	}

	async create(ownershipReversions: Array<IOwnershipReversions | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(ownershipReversions, OWNERSHIP_REVERSION_KEY);
		return result;
	}

	async upsert(
		ownershipReversions: Array<IOwnershipReversions | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(
			ownershipReversions,
			projectId,
			OWNERSHIP_REVERSION_KEY,
		);
		return result;
	}

	async deleteOwnershipReversionById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, OWNERSHIP_REVERSION_KEY, project);

		return successCount as number;
	}
}
