import { Types } from 'mongoose';

import { CAPEX_KEY, ICapex } from '@src/models/econ/capex';
import { CursorType, IPageData } from '@src/api/v1/pagination';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiCapex, ApiCapexKey, getFilters, getSort, toApiCapex } from './fields/capex';

export class CapexService extends BaseService<ApiContextV1> {
	static attribute = 'capexService';

	async getCapexCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiCapex | null> {
		const econModel = await this.context.econModelService.getById(id, CAPEX_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiCapex(econModel as ICapex);
	}

	async getCapex(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiCapex>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const capex = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as ICapex[];

		const result = capex.slice(0, take).map(toApiCapex);

		return {
			result,
			hasNext: capex.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiCapexKey] as CursorType)
					: null,
		};
	}

	async deleteCapexById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, CAPEX_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiCapex: Array<ApiCapex | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiCapex | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiCapex as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiCapex | undefined>;
	}

	async checkWells(
		apiCapex: Array<ApiCapex | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiCapex | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiCapex as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiCapex | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, CAPEX_KEY, projectId);
		return result;
	}

	async create(capex: Array<ICapex | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(capex, CAPEX_KEY);
		return result;
	}

	async upsert(capex: Array<ICapex | undefined>, projectId: Types.ObjectId): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(capex, projectId, CAPEX_KEY);
		return result;
	}
}
