import { Types } from 'mongoose';

import { ITypeCurve2, ITypeCurveRepWell, TypeCurveVolumeFit } from '@src/models/type-curve';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import config from '@src/config';
import { getPipeline } from '@src/helpers/mongo-pipeline';
import { ISort } from '@src/helpers/mongo-queries';
import { RequestModule } from '@src/helpers/request';

import { CursorType, IPageData } from '../../pagination';
import { BaseProjectResolved } from '../fields';

import { ApiTypeCurve, ApiTypeCurveKey, getFilters, getSort, toApiTypeCurve } from './fields/type-curve';
import { ApiTypeCurveRepWell, toApiTypeCurveRepWell } from './fields/type-curve-rep-wells';
import {
	ApiTypeCurveVolumeFit,
	toApiTypeCurveVolumeFit,
	WellsRepVolumeFitQuery,
} from './fields/type-curve-volume-fits';

export const basePipeline = [
	{
		$lookup: {
			from: 'type-curve-fits',
			localField: 'fits.gas',
			foreignField: '_id',
			as: 'fits.gas',
		},
	},
	{
		$lookup: {
			from: 'type-curve-fits',
			localField: 'fits.oil',
			foreignField: '_id',
			as: 'fits.oil',
		},
	},
	{
		$lookup: {
			from: 'type-curve-fits',
			localField: 'fits.water',
			foreignField: '_id',
			as: 'fits.water',
		},
	},
	{
		$project: {
			name: 1,
			'fits.gas': { $arrayElemAt: ['$fits.gas', 0] },
			'fits.oil': { $arrayElemAt: ['$fits.oil', 0] },
			'fits.water': { $arrayElemAt: ['$fits.water', 0] },
			forecast: 1,
			createdAt: 1,
			updatedAt: 1,
		},
	},
];

const flexApi = new RequestModule(`${config.flexServerUrl}/api`);
export const RETRIES = 3;

export class TypeCurveService extends BaseService<ApiContextV1> {
	static attribute = 'typeCurveService';

	async getTypeCurves(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		cursor?: string,
	): Promise<IPageData<ApiTypeCurve>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, cursorFilter);
		const pipeline = getPipeline(basePipeline, { filters: mappedFilters, sort: sortQuery, skip, limit: take + 1 });
		const typeCurves = await this.context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);

		const result = typeCurves.slice(0, take).map(toApiTypeCurve);

		return {
			result,
			hasNext: typeCurves.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiTypeCurveKey] as CursorType)
					: null,
		};
	}

	async getTypeCurvesCount(filters: ApiQueryFilters, project: BaseProjectResolved): Promise<number> {
		const mappedFilters = getFilters(filters, project);

		const baseQuery = this.context.models.TypeCurveModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(id: Types.ObjectId, project: BaseProjectResolved): Promise<ApiTypeCurve | null> {
		const pipeline = getPipeline(basePipeline, {
			filters: {
				_id: id,
				project: project._id,
			},
		});

		const [typeCurve] = await this.context.models.TypeCurveModel.aggregate<ITypeCurve2>(pipeline);
		if (!typeCurve) {
			return null;
		}
		return toApiTypeCurve(typeCurve);
	}

	async exists(id: Types.ObjectId, project: Types.ObjectId): Promise<boolean> {
		const doesTypeCurveExist = await this.context.models.TypeCurveModel.exists({
			_id: id,
			project,
		});

		return doesTypeCurveExist;
	}

	async getVolumeFits(
		typeCurveId: string,
		type: 'monthly' | 'daily',
		{ skip, limit }: WellsRepVolumeFitQuery,
	): Promise<ApiTypeCurveVolumeFit[]> {
		const payload = {
			skip,
			limit,
			tc_id: [typeCurveId],
			is_monthly: type === 'monthly' ? true : false,
		};
		flexApi.setHeaders({ ...this.context.headers });

		const results = (await flexApi.postApi(
			`/tc-mass-edit/external-tc-volumes`,
			payload,
			RETRIES,
		)) as TypeCurveVolumeFit[];

		return results.map((result) => toApiTypeCurveVolumeFit(result));
	}

	async getWellsRep(typeCurveId: string, { skip, limit }: WellsRepVolumeFitQuery): Promise<ApiTypeCurveRepWell[]> {
		const payload = {
			skip,
			limit,
			tc_id: [typeCurveId],
		};
		flexApi.setHeaders({ ...this.context.headers });

		const results = (await flexApi.postApi(
			`/tc-mass-edit/external-tc-rep-wells`,
			payload,
			RETRIES,
		)) as ITypeCurveRepWell[];
		return results.map((result) => toApiTypeCurveRepWell(result));
	}
}
