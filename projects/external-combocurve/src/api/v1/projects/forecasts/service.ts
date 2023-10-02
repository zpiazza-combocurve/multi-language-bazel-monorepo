import { Types } from 'mongoose';

import { IProjection, ISort } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { IForecast } from '@src/models/forecasts';
import { IWell } from '@src/models/wells';
import { notNil } from '@src/helpers/typing';

import { CursorType, IPageData } from '../../pagination';
import { BaseProjectResolved } from '../fields';
import { IMultiStatusResponse } from '../../multi-status';

import { ApiForecast, ApiForecastKey, getFilters, getSort, toApiForecast } from './fields';
import { ForecastNotFoundError } from './validation';
import { getUpdateMultiResponse } from './multi-status';

export interface AddWellToForecastResponse {
	message: string;
	wellsIds: string[];
}

export type WellBaseInformation = Pick<IWell, '_id' | 'well_name'>;

export class ForecastService extends BaseService<ApiContextV1> {
	static attribute = 'forecastService';

	async getForecasts(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiForecast>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};

		const { tags, ...rest } = filters;
		const mappedFilters = getFilters(rest, project, cursorFilter);

		await this.context.tagsService.fillFilterTagIDs(tags, mappedFilters);

		const forecasts = await this.context.models.ForecastModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)
			.populate('tags');

		const result = forecasts.slice(0, take).map(toApiForecast);

		return {
			result,
			hasNext: forecasts.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiForecastKey] as CursorType)
					: null,
		};
	}

	async getForecastsCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);

		const baseQuery = this.context.models.ForecastModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiForecast | null> {
		const forecast = await this.context.models.ForecastModel.findOne({
			_id: id,
			project: project._id,
		}).populate('tags');

		if (!forecast) {
			return null;
		}
		return toApiForecast(forecast);
	}

	async getByIdProjected(
		id: Types.ObjectId,
		project: BaseProjectResolved,
		projection: IProjection<IForecast> = {},
	): Promise<IForecast | null> {
		const forecast = await this.context.models.ForecastModel.findOne(
			{
				_id: id,
				project: project._id,
			},
			projection,
		);

		if (!forecast) {
			return null;
		}
		return forecast;
	}

	async existsById(id: Types.ObjectId, project: BaseProjectResolved): Promise<boolean> {
		return await this.context.models.ForecastModel.exists({ _id: id, project: project._id });
	}

	async addWellsToForecast(
		forecastId: Types.ObjectId,
		wellIds: (Types.ObjectId | undefined)[],
	): Promise<IMultiStatusResponse> {
		let response: AddWellToForecastResponse = { message: '', wellsIds: [] };
		const validWellIds = wellIds.filter(notNil);
		if (validWellIds.length) {
			const body = {
				inputForecastWells: validWellIds.map((y) => y.toString()),
			};

			response = (await callCloudFunction({
				fullUrl: `${config.forecastServiceUrl}/api/forecasts/${forecastId}/wells`,
				body,
				headers: this.context.headers,
			})) as AddWellToForecastResponse;
		}

		return getUpdateMultiResponse(wellIds, response);
	}

	async getForecastBaseInfo(forecastId: Types.ObjectId, project: BaseProjectResolved): Promise<IForecast> {
		const forecast = await this.getByIdProjected(forecastId, project, { name: 1, type: 1, wells: 1 });
		if (!forecast) {
			throw new ForecastNotFoundError(
				`No forecast was found with id \`${forecastId}\` in project \`${project._id}:${project.name}\``,
			);
		}
		return forecast;
	}

	async getProjectWellIds(projectId: Types.ObjectId): Promise<Types.ObjectId[]> {
		return (
			(await this.context.models.ProjectModel.findOne({ _id: projectId }, { wells: 1 }))?.toObject()?.wells || []
		);
	}

	async getWellBaseInformation(wellIds: (Types.ObjectId | undefined)[]): Promise<WellBaseInformation[]> {
		const notNullWellIds = wellIds.filter(notNil);
		return (
			await this.context.models.WellModel.find({ _id: { $in: notNullWellIds } }, { _id: 1, well_name: 1 })
		).map(
			(well) =>
				({
					_id: well._id,
					well_name: well.well_name,
				}) as WellBaseInformation,
		);
	}
}
