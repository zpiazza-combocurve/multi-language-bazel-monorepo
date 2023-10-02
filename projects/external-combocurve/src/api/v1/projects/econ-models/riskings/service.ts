import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IRisking, RISKING_KEY } from '@src/models/econ/riskings';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiRisking, ApiRiskingKey, getFilters, getSort, toApiRisking } from './fields/risking';

export class RiskingService extends BaseService<ApiContextV1> {
	static attribute = 'risking';

	async getRiskingsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiRisking | null> {
		const econModel = await this.context.econModelService.getById(id, RISKING_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiRisking(econModel as IRisking);
	}

	async getRiskings(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiRisking>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const riskings = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IRisking[];

		const result = riskings.slice(0, take).map(toApiRisking);

		return {
			result,
			hasNext: riskings.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiRiskingKey] as CursorType)
					: null,
		};
	}

	async deleteRiskingIdById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, RISKING_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiRiskings: Array<ApiRisking | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiRisking | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiRiskings as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiRisking | undefined>;
	}

	async checkWells(
		apiRiskings: Array<ApiRisking | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiRisking | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiRiskings as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiRisking | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, RISKING_KEY, projectId);
		return result;
	}

	async create(riskings: Array<IRisking | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(riskings, RISKING_KEY);
		return result;
	}

	async upsert(riskings: Array<IRisking | undefined>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(riskings, projectId, RISKING_KEY);
		return result;
	}
}
