import { groupBy, partition } from 'lodash';
import { Types } from 'mongoose';

import {
	ApiMonthlyProduction,
	BUCKET_SIZE,
	getCursorFilter,
	getDefaultSort,
	getReadFilters,
	getSort,
	toApiMonthlyProduction,
} from '@src/api/v1/monthly-productions/fields';
import {
	createProductionCursor,
	getFindPipeline,
	getProductionCountPipeline,
	getProductionPipeline,
	ISingleMonthlyProduction,
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

export abstract class MonthlyProductionService extends BaseService<ApiContextV1> {
	abstract attribute: string;

	async getMonthlyProduction(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
		project: Types.ObjectId | null = null,
	): Promise<IPageData<ApiMonthlyProduction>> {
		const { sortQuery, allowCursor } = getSort(sort) || getDefaultSort();
		const parsedCursor = allowCursor ? parseProductionCursor(cursor) : null;
		const cursorFilter = getCursorFilter(sortQuery, parsedCursor);
		const beforeUnwindFilters = getReadFilters(filters, project, 'beforeUnwind', cursorFilter);
		const afterUnwindFilters = getReadFilters(filters, undefined, 'afterUnwind');

		const pipeline = getProductionPipeline({
			productionKind: 'monthly',
			beforeUnwindFilters,
			afterUnwindFilters,
			sort: sortQuery ?? undefined,
			skip,
			limit: take + BUCKET_SIZE + 1,
		});

		const monthlyProductions = await this.context.models.MonthlyProductionModel.aggregate<ISingleMonthlyProduction>(
			pipeline,
		);

		const lastReturnedItemIndex = parsedCursor
			? monthlyProductions.findIndex(
					(x) => x._id?.toString() === parsedCursor.id.toString() && x.arrayIndex === parsedCursor.index,
			  )
			: -1;
		const skipCount = lastReturnedItemIndex >= 0 ? lastReturnedItemIndex + 1 : 0;

		const result = monthlyProductions.slice(skipCount, skipCount + take);
		const lastMontlyProduction = result[result.length - 1];
		const resultCursor =
			allowCursor && lastMontlyProduction
				? createProductionCursor(lastMontlyProduction._id, lastMontlyProduction.arrayIndex)
				: null;

		return {
			result: result.map(toApiMonthlyProduction),
			hasNext: monthlyProductions.length - skipCount > take,
			cursor: resultCursor,
		};
	}

	async getMonthlyProductionCount(filters: ApiQueryFilters, project: Types.ObjectId | null = null): Promise<number> {
		const beforeUnwindFilters = getReadFilters(filters, project, 'beforeUnwind');
		const afterUnwindFilters = getReadFilters(filters, undefined, 'afterUnwind');

		const pipeline = getProductionCountPipeline({
			productionKind: 'monthly',
			beforeUnwindFilters,
			afterUnwindFilters,
		});

		const countResult = await this.context.models.MonthlyProductionModel.aggregate<{ count: number }>(pipeline);
		return countResult[0]?.count ?? 0;
	}

	async findMatches(productionData: ISingleMonthlyProduction[]): Promise<ISingleMonthlyProduction[]> {
		if (!productionData.length) {
			return [];
		}
		const pipeline = getFindPipeline('monthly', productionData);
		const monthlyProductions = await this.context.models.MonthlyProductionModel.aggregate<ISingleMonthlyProduction>(
			pipeline,
		);
		return monthlyProductions;
	}

	async findAll(productionData: ISingleMonthlyProduction[]): Promise<ISingleMonthlyProduction[]> {
		if (!productionData.length) {
			return [];
		}
		return productionData;
		// TODO: Reevaluate the need of this. Ensure that data is imported. Removed because performance.

		// const pipeline = getFindPipeline('monthly', productionData);
		// const monthlyProductions = await this.context.models.MonthlyProductionModel.aggregate<ISingleMonthlyProduction>(
		// 	pipeline
		// );
		// return monthlyProductions;
	}

	async import(
		production: Array<ISingleMonthlyProduction | undefined>,
		importOperation: 'insert' | 'upsert',
		project: string | null = null,
	): Promise<ISingleMonthlyProduction[]> {
		const validProduction = production.filter(notNil);

		if (!validProduction.length) {
			return [];
		}

		const byWell = groupBy(validProduction, ({ well }: ISingleMonthlyProduction) => well?.toString());

		const body = { data: { byWell, project }, resourceType: 'monthly', importOperation };

		await callCloudFunction({
			fullUrl: config.externalApiImportUrl,
			body,
			headers: this.context.headers,
		});

		return await this.findAll(validProduction);
	}

	async create(
		production: Array<ISingleMonthlyProduction | undefined>,
		project: string | null = null,
	): Promise<IMultiStatusResponse> {
		const created = await this.import(production, 'insert', project);
		return getCreatedMultiResponse(production, created);
	}

	async upsert(
		production: Array<ISingleMonthlyProduction | undefined>,
		project: string | null = null,
	): Promise<IMultiStatusResponse> {
		const upserted = await this.import(production, 'upsert', project);
		return getOkMultiResponse(production, upserted);
	}

	async getWellsIds(
		production: Array<ApiMonthlyProduction | undefined>,
		project: string | null = null,
	): Promise<Array<ApiMonthlyProduction | undefined>> {
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

		const getWell = ({ well, chosenID }: ApiMonthlyProduction) =>
			(well ? byWellId[well.toString()] : chosenID ? byChosenId[chosenID] : undefined)?.[0]._id;

		return production.map((prod) => prod && { ...prod, well: getWell(prod) });
	}
}
