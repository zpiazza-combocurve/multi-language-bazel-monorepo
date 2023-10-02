import { LeanDocument, Types } from 'mongoose';

import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import config from '@src/config';
import { IPageData } from '@src/api/v1/pagination';
import { ISort } from '@src/helpers/mongo-queries';
import { IWell } from '@src/models/wells';
import { RequestModule } from '@src/helpers/request';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import {
	ApiAriesForecastData,
	getFilters,
	getSelectedIdProjection,
	getSettingsFromFilters,
	getSort,
	IAriesForecastData,
	IAriesForecastSettings,
	toApiAriesForecastData,
} from './fields';
import { validateWellsSelectedId } from './validation';

export const RETRIES = 3;

const flexApi = new RequestModule(`${config.flexServerUrl}/api`);

export class AriesForecastDataService extends BaseService<ApiContextV1> {
	static attribute = 'ariesForecastDataService';

	async getAriesData(
		forecastId: Types.ObjectId,
		wellIds: Types.ObjectId[],
		settings: IAriesForecastSettings,
	): Promise<IAriesForecastData[]> {
		flexApi.setHeaders({ ...this.context.headers });
		const result = await flexApi.postApi(
			`/cc-to-aries/forecast-export-rest-api`,
			{
				forecastId,
				wells: wellIds,
				...settings,
			},
			RETRIES,
		);
		return result;
	}

	async getAriesForecastDataCount(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
	): Promise<number> {
		const forecastDoc = await this.context.models.ForecastModel.findOne(
			{ _id: forecast.id, project: project._id },
			{ wells: 1 },
		);
		const mappedFilters = getFilters(filters, forecastDoc?.wells || []);

		const baseQuery = this.context.models.WellModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getAriesForecastData(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
		cursor?: string,
	): Promise<IPageData<ApiAriesForecastData>> {
		const forecastDoc = await this.context.models.ForecastModel.findOne(
			{ _id: forecast.id, project: project._id },
			{ wells: 1 },
		);
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, forecastDoc?.wells || [], cursorFilter);
		const settings = getSettingsFromFilters(filters);

		const wells = await this.context.models.WellModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)
			.select(getSelectedIdProjection(settings.selectedIdKey))
			.lean();

		validateWellsSelectedId(wells, settings.selectedIdKey);

		const wellIds = wells.map(({ _id }) => _id);

		const ariesForecastData = await this.getAriesData(forecast.id, wellIds, settings);

		return {
			result: ariesForecastData.slice(0, take).map(toApiAriesForecastData),
			hasNext: ariesForecastData.length > take,
			cursor:
				wells.length > 1 && allowCursor && sortQuery
					? wells[wells.length - 2][Object.keys(sortQuery)[0] as keyof LeanDocument<IWell>]
					: null,
		};
	}
}
