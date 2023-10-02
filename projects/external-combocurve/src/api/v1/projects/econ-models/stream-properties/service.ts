import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IStreamProperties, STREAM_PROPERTIES_KEY } from '@src/models/econ/stream-properties';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { ISort } from '@src/helpers/mongo-queries';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ApiEconModel } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiStreamProperties,
	ApiStreamPropertiesKey,
	getFilters,
	getSort,
	toApiStreamProperties,
} from './fields/stream-properties';

export class StreamPropertiesService extends BaseService<ApiContextV1> {
	static attribute = 'streamProperties';

	async getStreamPropertiesCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);
		return await this.context.econModelService.getCount(mappedFilters);
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiStreamProperties | null> {
		const econModel = await this.context.econModelService.getById(id, STREAM_PROPERTIES_KEY, project);
		if (!econModel) {
			return null;
		}
		return toApiStreamProperties(econModel as IStreamProperties);
	}

	async getStreamProperties(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiStreamProperties>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);

		const streamProperties = (await this.context.models.AssumptionModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)) as IStreamProperties[];

		const result = streamProperties.slice(0, take).map(toApiStreamProperties);

		return {
			result,
			hasNext: streamProperties.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiStreamPropertiesKey] as CursorType)
					: null,
		};
	}

	async deleteStreamPropertiesById(id: Types.ObjectId, project: BaseProjectResolved): Promise<number> {
		const successCount = await this.context.econModelService.deleteById(id, STREAM_PROPERTIES_KEY, project);
		return successCount as number;
	}

	async checkScenarios(
		apiStreamProperties: Array<ApiStreamProperties | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiStreamProperties | undefined>> {
		const result = await this.context.econModelService.checkScenarios(
			apiStreamProperties as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);
		return result as Array<ApiStreamProperties | undefined>;
	}

	async checkWells(
		apiStreamProperties: Array<ApiStreamProperties | undefined>,
		projectId: Types.ObjectId,
		errorAggregator?: ValidationErrorAggregator,
	): Promise<Array<ApiStreamProperties | undefined>> {
		const result = await this.context.econModelService.checkWells(
			apiStreamProperties as Array<ApiEconModel | undefined>,
			projectId,
			errorAggregator,
		);

		return result as Array<ApiStreamProperties | undefined>;
	}

	async getExistingNames(names: string[], projectId: Types.ObjectId): Promise<string[]> {
		const result = await this.context.econModelService.getExistingNames(names, STREAM_PROPERTIES_KEY, projectId);
		return result;
	}

	async create(streamProperties: Array<IStreamProperties | undefined>): Promise<IMultiStatusResponse> {
		const result = this.context.econModelService.create(streamProperties, STREAM_PROPERTIES_KEY);
		return result;
	}

	async upsert(
		streamProperties: Array<IStreamProperties | undefined>,
		projectId: Types.ObjectId,
	): Promise<IMultiStatusResponse> {
		const result = await this.context.econModelService.upsert(streamProperties, projectId, STREAM_PROPERTIES_KEY);
		return result;
	}
}
