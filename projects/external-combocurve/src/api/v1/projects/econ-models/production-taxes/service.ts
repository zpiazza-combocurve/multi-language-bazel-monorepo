import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IProductionTaxes, ProductionTaxes_KEY } from '@src/models/econ/production-taxes';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiProductionTaxes,
	ApiProductionTaxesKey,
	getFilters,
	getSort,
	toApiProductionTaxes,
} from './fields/production-taxes';

export class ProductionTaxesService extends BaseService<ApiContextV1> {
	static attribute = 'ProductionTaxesModel';

	async getProductionTaxesCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiProductionTaxes | null> {
		const econModel = await this.context.econModelService.getById(id, ProductionTaxes_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiProductionTaxes(econModel as IProductionTaxes);
	}

	async getProductionTaxes(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiProductionTaxes>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const ProductionTaxesModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IProductionTaxes[];

		const result = ProductionTaxesModel.slice(0, take).map(toApiProductionTaxes);

		return {
			result,
			hasNext: ProductionTaxesModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiProductionTaxesKey] as CursorType)
					: null,
		};
	}

	async deleteProductionTaxesById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, ProductionTaxes_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiProductionTaxesModels: Array<ApiProductionTaxes | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiProductionTaxes | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiProductionTaxesModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiProductionTaxes | undefined>;
	}

	async checkWells(
		apiProductionTaxesModels: Array<ApiProductionTaxes | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiProductionTaxes | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiProductionTaxesModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiProductionTaxes | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, ProductionTaxes_KEY, projectId);
		return result;
	}

	async create(ProductionTaxesModel: Array<IProductionTaxes | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(ProductionTaxesModel, ProductionTaxes_KEY);
		return result;
	}

	async upsert(
		ProductionTaxesModel: Array<IProductionTaxes | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(ProductionTaxesModel, projectId, ProductionTaxes_KEY);
		return result;
	}
}
