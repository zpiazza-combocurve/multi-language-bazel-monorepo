import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { DateSettings_KEY, IDateSettings } from '@src/models/econ/date-settings';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiDateSettings, ApiDateSettingsKey, getFilters, getSort, toApiDateSettings } from './fields/date-settings';

export class DateSettingsService extends BaseService<ApiContextV1> {
	static attribute = 'DateSettingsModel';

	async getDateSettingsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiDateSettings | null> {
		const econModel = await this.context.econModelService.getById(id, DateSettings_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiDateSettings(econModel as IDateSettings);
	}

	async getDateSettings(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiDateSettings>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const DateSettingsModel = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IDateSettings[];

		const result = DateSettingsModel.slice(0, take).map(toApiDateSettings);

		return {
			result,
			hasNext: DateSettingsModel.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiDateSettingsKey] as CursorType)
					: null,
		};
	}

	async deleteDateSettingsById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, DateSettings_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiDateSettingsModels: Array<ApiDateSettings | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDateSettings | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiDateSettingsModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiDateSettings | undefined>;
	}

	async checkWells(
		apiDateSettingsModels: Array<ApiDateSettings | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiDateSettings | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiDateSettingsModels as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiDateSettings | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, DateSettings_KEY, projectId);
		return result;
	}

	async create(DateSettingsModel: Array<IDateSettings | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(DateSettingsModel, DateSettings_KEY);
		return result;
	}

	async upsert(
		DateSettingsModel: Array<IDateSettings | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(DateSettingsModel, projectId, DateSettings_KEY);
		return result;
	}
}
