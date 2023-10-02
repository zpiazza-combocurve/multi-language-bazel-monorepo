import { Types } from 'mongoose';

import {
	ApiWell,
	ApiWellKey,
	getChosenId,
	getReadFilters,
	getSort,
	getWellField,
	IReplace,
	IWellKey,
	toApiWell,
} from '@src/api/v1/wells/fields';
import { CursorType, IPageData } from '@src/api/v1/pagination';
import {
	getCreatedMultiResponse,
	getReplaceMultiResponse,
	getUpdateMultiResponse,
} from '@src/api/v1/wells/multi-status';
import { getMixedIdsQuery, getScopeProject, ISort, WellScope } from '@src/helpers/mongo-queries';
import { IMultiStatusResponse, IRecordStatus } from '@src/api/v1/multi-status';
import { isNil, notNil } from '@src/helpers/typing';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { callCloudFunction } from '@src/helpers/cloud-caller';
import config from '@src/config';
import { IUpdate } from '@src/api/v1/fields';
import { IWell } from '@src/models/wells';

interface IGetFilterOptions {
	skip: number;
	take: number;
	sort?: ISort;
	cursor?: string;
	filters?: ApiQueryFilters;
}

interface IFindOptions {
	project?: string | null;
	projection?: IWellKey[];
	limit?: number;
}

export abstract class WellService extends BaseService<ApiContextV1> {
	abstract attribute: string;

	async getWells(filterOptions: IGetFilterOptions, scope: WellScope): Promise<IPageData<ApiWell>> {
		const { skip, take, sort = {}, filters = {}, cursor } = filterOptions;
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = scope.project
			? getReadFilters(filters, cursorFilter, {
					_id: { $in: scope.project?.wells || [] },
					project: getScopeProject(scope),
			  })
			: getReadFilters(filters, cursorFilter);

		const wells = await this.context.models.WellModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const result = wells.slice(0, take).map(toApiWell);

		return {
			result,
			hasNext: wells.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiWellKey] as CursorType)
					: null,
		};
	}

	async getWellsCount(filters: ApiQueryFilters, scope: WellScope): Promise<number> {
		const mappedFilters = scope.project
			? getReadFilters(filters, undefined, {
					_id: { $in: scope.project?.wells || [] },
					project: getScopeProject(scope),
			  })
			: getReadFilters(filters);

		const baseQuery = this.context.models.WellModel.find(mappedFilters);

		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();

		return await countQuery;
	}

	async getById(id: Types.ObjectId, scope: WellScope): Promise<ApiWell | null> {
		if (scope.project && !scope.project.wells?.some((wellId) => wellId.equals(id))) {
			return null;
		}

		const scopeFilter = { project: getScopeProject(scope) };

		const well = await this.context.models.WellModel.findOne({ _id: id, ...scopeFilter });
		if (!well) {
			return null;
		}
		return toApiWell(well);
	}

	async getExistingChosenIds(wells: IWell[], project: Types.ObjectId | null = null): Promise<string[]> {
		if (!wells.length) {
			return [];
		}

		const { dataSource } = wells[0];

		return this.context.models.WellModel.distinct('chosenID', {
			chosenID: { $in: wells.map((well) => well.chosenID) },
			project,
			dataSource,
		});
	}

	async getMatchingWells(
		wells: IWell[],
		{ projection = undefined, limit = 0, project = null }: IFindOptions = {},
	): Promise<IWell[]> {
		if (!wells.length) {
			return [];
		}

		const queryProjection = projection?.join(' ');
		const limitCount = limit || 0;
		const { dataSource } = wells[0];

		return this.context.models.WellModel.find(
			{
				chosenID: { $in: wells.map((well) => well.chosenID) },
				project,
				dataSource,
			},
			queryProjection,
		).limit(limitCount);
	}

	async getMatchingWellsById(
		ids: Types.ObjectId[],
		{ projection = undefined, limit = 0, project = null }: IFindOptions = {},
	): Promise<IWell[]> {
		const queryProjection = projection?.join(' ');
		const limitCount = limit || 0;
		return this.context.models.WellModel.find(
			{
				_id: { $in: ids },
				project,
			},
			queryProjection,
		).limit(limitCount);
	}

	async getMatchingWellsMixed(
		wells: ApiWell[],
		{ projection = undefined, limit = 0, project = null }: IFindOptions = {},
	): Promise<IWell[]> {
		if (!wells.length) {
			return [];
		}

		const queryProjection = projection?.join(' ');
		const limitCount = limit || 0;
		const { dataSource } = wells[0];

		const ids = wells.map(({ id }) => id).filter(notNil);
		const chosenIds = wells
			.filter(({ id }) => isNil(id))
			.map(getChosenId)
			.filter(notNil);

		const query = getMixedIdsQuery(ids, chosenIds, dataSource, project);
		return this.context.models.WellModel.find(query, queryProjection).limit(limitCount);
	}

	toDbWell(apiWell: ApiWell): IWell {
		const well = new this.context.models.WellModel({});

		Object.entries(apiWell).forEach(([field, value]) => {
			const apiWellField = getWellField(field, apiWell);

			if (apiWellField) {
				const { write } = apiWellField;

				if (write) {
					const coercedWrite = write as (well: IWell, value: unknown) => void;
					coercedWrite(well, value);
				}
			}
		});
		return well;
	}

	async create(wells: Array<IWell | undefined>, project: string | null = null): Promise<IMultiStatusResponse> {
		const validWells = wells.filter(notNil);

		let res: IWell[];

		if (validWells.length) {
			const body = {
				data: { dataSource: validWells[0].dataSource, project, wells: validWells },
				resourceType: 'headers',
				importOperation: 'insert',
			};

			await callCloudFunction({
				fullUrl: config.externalApiImportUrl,
				body,
				headers: this.context.headers,
			});

			res = await this.getMatchingWells(validWells, {
				project,
				projection: ['chosenID', 'dataSource', 'createdAt', 'updatedAt'],
			});
		} else {
			res = [];
		}

		return getCreatedMultiResponse(wells, res);
	}

	async replaceWell(data: IReplace, project: string | null = null): Promise<IRecordStatus | null> {
		const { results } = await this.replaceWells([data], project);
		return results[0] ?? null;
	}

	async replaceWells(
		data: Array<IReplace | undefined>,
		project: string | null = null,
		currentTimestamp: Date = new Date(),
	): Promise<IMultiStatusResponse> {
		const validReplace = data.filter(notNil);

		let result: IWell[];

		if (validReplace.length) {
			const body = {
				data: {
					dataSource: validReplace[0].update.dataSource,
					project: project,
					replaces: validReplace,
				},
				resourceType: 'headers',
				importOperation: 'replace',
			};

			await callCloudFunction({
				fullUrl: config.externalApiImportUrl,
				body,
				headers: this.context.headers,
			});

			result = await this.getMatchingWellsById(
				validReplace.map(({ id }) => id),
				{ projection: ['chosenID', 'dataSource', 'createdAt', 'updatedAt'], project },
			);

			result = result.filter((x) => x?.updatedAt && x.updatedAt > currentTimestamp);
		} else {
			result = [];
		}

		return getReplaceMultiResponse(data, result);
	}

	async updateWell(data: IUpdate<IWell>, project: string | null = null): Promise<IRecordStatus | null> {
		const { results } = await this.updateWells([data], project);
		return results[0] ?? null;
	}

	async updateWells(
		data: Array<IUpdate<IWell> | undefined>,
		project: string | null = null,
		currentTimestamp: Date = new Date(),
	): Promise<IMultiStatusResponse> {
		const validUpdates = data.filter(notNil);

		let result: IWell[];

		if (validUpdates.length) {
			const body = {
				data: {
					dataSource: validUpdates[0].update.dataSource,
					project,
					replaces: validUpdates,
					setDefaultValues: false,
				},
				resourceType: 'headers',
				importOperation: 'replace',
			};

			await callCloudFunction({
				fullUrl: config.externalApiImportUrl,
				body,
				headers: this.context.headers,
			});

			result = await this.getMatchingWellsById(
				validUpdates.map(({ id }) => id),
				{ projection: ['chosenID', 'dataSource', 'createdAt', 'updatedAt'], project },
			);

			result = result.filter((x) => x?.updatedAt && x.updatedAt > currentTimestamp);
		} else {
			result = [];
		}

		return getUpdateMultiResponse(data, result);
	}
}
