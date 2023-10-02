import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IPricing, Pricing_KEY } from '@src/models/econ/pricing';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiPricing, ApiPricingKey, getFilters, getSort, toApiPricing } from './fields/pricing';

export class PricingService extends BaseService<ApiContextV1> {
	static attribute = 'pricingModel';

	async getPricingsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiPricing | null> {
		const econModel = await this.context.econModelService.getById(id, Pricing_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiPricing(econModel as IPricing);
	}

	async getPricings(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiPricing>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const pricingModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IPricing[];

		const result = pricingModel.slice(0, take).map(toApiPricing);

		return {
			result,
			hasNext: pricingModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiPricingKey] as CursorType)
					: null,
		};
	}

	async deletePricingById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, Pricing_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiPricingModels: Array<ApiPricing | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiPricing | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiPricingModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiPricing | undefined>;
	}

	async checkWells(
		apiPricingModels: Array<ApiPricing | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiPricing | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiPricingModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiPricing | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, Pricing_KEY, projectId);
		return result;
	}

	async create(pricingModel: Array<IPricing | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(pricingModel, Pricing_KEY);
		return result;
	}

	async upsert(pricingModel: Array<IPricing | undefined>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(pricingModel, projectId, Pricing_KEY);
		return result;
	}
}
