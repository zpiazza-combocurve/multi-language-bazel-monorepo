import { groupBy, partition } from 'lodash';
import { Types } from 'mongoose';

import {
	ApiDailyProduction,
	BUCKET_SIZE,
	getCursorFilter,
	getDefaultSort,
	getReadFilters,
	getSort,
	toApiDailyProduction,
} from '@src/api/v1/daily-productions/fields';
import {
	createProductionCursor,
	getFindPipeline,
	getProductionCountPipeline,
	getProductionPipeline,
	ISingleDailyProduction,
	parseProductionCursor,
} from '@src/helpers/single-production';
import { getCreatedMultiResponse, getOkMultiResponse } from '@src/api/v1/production-multi-status';
import { getMixedIdsQuery, ISort } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { IMultiStatusResponse } from '@src/api/v1/multi-status';
import { IPageData } from '@src/api/v1/pagination';
import { IWell } from '@src/models/wells';
import { notNil } from '@src/helpers/typing';

export abstract class DailyProductionService extends BaseService<ApiContextV1> {
	abstract attribute: string;

	async getDailyProduction(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
		project: Types.ObjectId | null = null,
	): Promise<IPageData<ApiDailyProduction>> {
		const { sortQuery, allowCursor } = getSort(sort) || getDefaultSort();
		const parsedCursor = allowCursor ? parseProductionCursor(cursor) : null;
		const cursorFilter = getCursorFilter(sortQuery, parsedCursor);
		const beforeUnwindFilters = getReadFilters(filters, project, 'beforeUnwind', cursorFilter);
		const afterUnwindFilters = getReadFilters(filters, undefined, 'afterUnwind');

		const pipeline = getProductionPipeline({
			productionKind: 'daily',
			beforeUnwindFilters,
			afterUnwindFilters,
			sort: sortQuery ?? undefined,
			skip,
			limit: take + BUCKET_SIZE + 1,
		});

		const dailyProductions = await this.context.models.DailyProductionModel.aggregate<ISingleDailyProduction>(
			pipeline,
		);

		const lastReturnedItemIndex = parsedCursor
			? dailyProductions.findIndex(
					(x) => x._id?.toString() === parsedCursor.id.toString() && x.arrayIndex === parsedCursor.index,
			  )
			: -1;
		const skipCount = lastReturnedItemIndex >= 0 ? lastReturnedItemIndex + 1 : 0;

		const result = dailyProductions.slice(skipCount, skipCount + take);
		const lastDailyProduction = result[result.length - 1];
		const resultCursor =
			allowCursor && lastDailyProduction
				? createProductionCursor(lastDailyProduction._id, lastDailyProduction.arrayIndex)
				: null;

		return {
			result: result.map(toApiDailyProduction),
			hasNext: dailyProductions.length - skipCount > take,
			cursor: resultCursor,
		};
	}

	async getDailyProductionCount(filters: ApiQueryFilters, project: Types.ObjectId | null = null): Promise<number> {
		const beforeUnwindFilters = getReadFilters(filters, project, 'beforeUnwind');
		const afterUnwindFilters = getReadFilters(filters, undefined, 'afterUnwind');

		const pipeline = getProductionCountPipeline({
			productionKind: 'daily',
			beforeUnwindFilters,
			afterUnwindFilters,
		});

		const countResult = await this.context.models.DailyProductionModel.aggregate<{ count: number }>(pipeline);
		return countResult[0]?.count ?? 0;
	}

	async findMatches(productionData: ISingleDailyProduction[]): Promise<ISingleDailyProduction[]> {
		if (!productionData.length) {
			return [];
		}
		const pipeline = getFindPipeline('daily', productionData);
		const dailyProductions = await this.context.models.DailyProductionModel.aggregate<ISingleDailyProduction>(
			pipeline,
		);
		return dailyProductions;
	}

	async findAll(productionData: ISingleDailyProduction[]): Promise<ISingleDailyProduction[]> {
		if (!productionData.length) {
			return [];
		}
		return productionData;
		// TODO: Reevaluate the need of this. Ensure that data is imported. Removed because performance.

		// const pipeline = getFindPipeline('daily', productionData);
		// const dailyProductions = await this.context.models.DailyProductionModel.aggregate<ISingleDailyProduction>(
		// 	pipeline
		// );
		// return dailyProductions;
	}

	async import(
		production: Array<ISingleDailyProduction | undefined>,
		importOperation: 'insert' | 'upsert',
		project: string | null = null,
	): Promise<ISingleDailyProduction[]> {
		const validProduction = production.filter(notNil);

		if (!validProduction.length) {
			return [];
		}

		const byWell = groupBy(validProduction, ({ well }: ISingleDailyProduction) => well?.toString());

		const body = { data: { byWell, project }, resourceType: 'daily', importOperation };

		await callCloudFunction({
			fullUrl: config.externalApiImportUrl,
			body,
			headers: this.context.headers,
		});

		return await this.findAll(validProduction);
	}

	async create(
		production: Array<ISingleDailyProduction | undefined>,
		project: string | null = null,
	): Promise<IMultiStatusResponse> {
		const created = await this.import(production, 'insert', project);
		return getCreatedMultiResponse(production, created);
	}

	async upsert(
		production: Array<ISingleDailyProduction | undefined>,
		project: string | null = null,
	): Promise<IMultiStatusResponse> {
		const upserted = await this.import(production, 'upsert', project);
		return getOkMultiResponse(production, upserted);
	}

	async getWellsIds(
		production: Array<ApiDailyProduction | undefined>,
		project: string | null = null,
	): Promise<Array<ApiDailyProduction | undefined>> {
		const validProds = production.filter(notNil);

		if (!validProds.length) {
			return production;
		}

		const [idProds, noIdProds] = partition(validProds, ({ well }) => notNil(well));

		const wellIds = [...new Set(idProds.map(({ well }) => well ?? Types.ObjectId()))];

		const dataSource = noIdProds[0]?.dataSource;
		const chosenIds = [...new Set(noIdProds.map(({ chosenID }) => chosenID ?? ''))];

		const query = getMixedIdsQuery(wellIds, chosenIds, dataSource, project);
		const wells = await this.context.models.WellModel.find(query, 'chosenID');

		const byWellId: Record<string, IWell[] | undefined> = groupBy(wells, ({ _id }: IWell) => _id.toString());
		const byChosenId: Record<string, IWell[] | undefined> = groupBy(wells, ({ chosenID }: IWell) => chosenID);

		const getWell = ({ well, chosenID }: ApiDailyProduction) =>
			(well ? byWellId[well.toString()] : chosenID ? byChosenId[chosenID] : undefined)?.[0]._id;

		return production.map((prod) => prod && { ...prod, well: getWell(prod) });
	}
}
