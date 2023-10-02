import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { getPipeline, PipelineBuilder } from '@src/helpers/mongo-pipeline';
import { ISort, Steps } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { getForecastDataModel } from '@src/helpers/context';
import { IForecastData } from '@src/models/forecast-data';

import { BaseForecastResolved } from '../fields';
import { BaseProjectResolved } from '../../fields';

import { ApiForecastData, getFilters, getSort, toApiForecastData } from './fields/forecast-outputs';

export const projectionPipe = [
	{
		$project: {
			createdAt: 1,
			forecast: 1,
			forecasted: 1,
			forecastedAt: 1,
			forecastedBy: 1,
			forecastType: 1,
			P_dict: 1,
			phase: 1,
			project: 1,
			ratio: 1,
			reviewedAt: 1,
			reviewedBy: 1,
			runDate: 1,
			status: 1,
			typeCurve: 1,
			typeCurveApplySetting: 1,
			updatedAt: 1,
			well: 1,
			data_freq: 1,
		},
	},
];

export const postSkipTakePipeline = [
	{
		$lookup: {
			as: 'typeCurveData',
			from: 'type-curves',
			let: { id: '$typeCurve' },
			pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$id'] } } }, { $project: { name: 1, tcType: 1, _id: 0 } }],
		},
	},
	{
		$set: { typeCurveData: { $arrayElemAt: ['$typeCurveData', 0] } },
	},
];

const defaultOrder = [Steps.Match, Steps.Project, Steps.Sort, Steps.Skip, Steps.Limit, Steps.Lookup, Steps.Set];

// Sorting by forecast ascending or descending: When the sort is before the projection,
// it’s able to use the forecast index whereas after the projection it is not.
const forecastOrder = [Steps.Match, Steps.Sort, Steps.Project, Steps.Skip, Steps.Limit, Steps.Lookup, Steps.Set];

export class ForecastDataService extends BaseService<ApiContextV1> {
	static attribute = 'forecastDataService';

	async getForecastData(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
		cursor?: string,
	): Promise<IPageData<ApiForecastData>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, Types.ObjectId(forecast.id), cursorFilter);
		const forecastDataModel = getForecastDataModel(this.context, forecast.type);

		const isSortingByForecast = 'forecast' in sort;
		const pipeline = PipelineBuilder.new()
			.setOptions({ filters: mappedFilters, sort: sortQuery, skip, limit: take + 1 })
			.setStep(Steps.Project, projectionPipe[0])
			.setStep(Steps.Lookup, postSkipTakePipeline[0])
			.setStep(Steps.Set, postSkipTakePipeline[1])
			.build(isSortingByForecast ? forecastOrder : defaultOrder);

		const forecastData = await forecastDataModel.aggregate<IForecastData>(pipeline);

		const result = forecastData.slice(0, take).map((forecastDatum) => toApiForecastData(forecastDatum, forecast));
		return {
			result: result,
			hasNext: forecastData.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as keyof ApiForecastData] as CursorType)
					: null,
		};
	}

	async getForecastDataCount(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
	): Promise<number> {
		const mappedFilters = getFilters(filters, project, forecast.id);

		const forecastDataModel = getForecastDataModel(this.context, forecast.type);
		const baseQuery = forecastDataModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(
		id: Types.ObjectId,
		project: BaseProjectResolved,
		forecast: BaseForecastResolved,
	): Promise<ApiForecastData | null> {
		const pipeline = getPipeline(
			projectionPipe,
			{
				filters: {
					_id: id,
					project: project._id,
				},
			},
			postSkipTakePipeline,
		);

		const forecastDataModel = getForecastDataModel(this.context, forecast.type);
		const [forecastData] = await forecastDataModel.aggregate<IForecastData>(pipeline);

		if (!forecastData) {
			return null;
		}
		return toApiForecastData(forecastData, forecast);
	}
}
