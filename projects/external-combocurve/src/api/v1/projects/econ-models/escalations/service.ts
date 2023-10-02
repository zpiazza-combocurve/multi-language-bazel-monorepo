import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { ESCALATION_KEY, IEscalation } from '@src/models/econ/escalations';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiEscalation, ApiEscalationKey, getFilters, getSort, toApiEscalation } from './fields/escalations';

export class EscalationService extends BaseService<ApiContextV1> {
	static attribute = 'escalation';

	async getEscalationsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiEscalation | null> {
		const econModel = await this.context.econModelService.getById(id, ESCALATION_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiEscalation(econModel as IEscalation);
	}

	async getEscalations(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiEscalation>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const escalations = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IEscalation[];

		const result = escalations.slice(0, take).map(toApiEscalation);

		return {
			result,
			hasNext: escalations.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiEscalationKey] as CursorType)
					: null,
		};
	}

	async deleteEscalationIdById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, ESCALATION_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiEscalations: Array<ApiEscalation | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEscalation | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiEscalations as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiEscalation | undefined>;
	}

	async checkWells(
		apiEscalations: Array<ApiEscalation | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiEscalation | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiEscalations as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiEscalation | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, ESCALATION_KEY, projectId);
		return result;
	}

	async create(escalations: Array<IEscalation | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(escalations, ESCALATION_KEY);
		return result;
	}

	async upsert(
		escalations: Array<IEscalation | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(escalations, projectId, ESCALATION_KEY);
		return result;
	}
}
