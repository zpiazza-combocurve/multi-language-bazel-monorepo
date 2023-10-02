import { Types } from 'mongoose';

import { CursorType, IPageData } from '@src/api/v1/pagination';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { BaseService } from '@src/base-context';
import { getPipeline } from '@src/helpers/mongo-pipeline';
import { IEconRun } from '@src/models/econ/econ-runs';
import { IEconRunData } from '@src/models/econ/econ-run-data';
import { ISort } from '@src/helpers/mongo-queries';

import { ApiEconRunData, ApiEconRunDataKey, getFilters, getSort, toApiEconRunData } from './fields';

export const postSkipTakePipeline = [
	{
		$lookup: {
			as: 'econGroup',
			from: 'econ-groups',
			let: { id: '$group' },
			pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$id'] } } }, { $project: { name: 1 } }],
		},
	},
	{
		$set: { groupName: { $arrayElemAt: ['$econGroup.name', 0] } },
	},
];

export class EconRunDataService extends BaseService<ApiContextV1> {
	static attribute = 'econRunDataService';

	async getEconRunData(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
		cursor?: string,
	): Promise<IPageData<ApiEconRunData>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = getFilters(filters, project, scenarioId, econRun, cursorFilter);

		const pipeline = getPipeline(
			[],
			{ filters: mappedFilters, sort: sortQuery, skip, limit: take + 1 },
			postSkipTakePipeline,
		);
		const econRunData = await this.context.models.EconRunDataModel.aggregate<IEconRunData>(pipeline);

		const result = econRunData.slice(0, take).map(toApiEconRunData);

		return {
			result,
			hasNext: econRunData.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiEconRunDataKey] as CursorType)
					: null,
		};
	}

	async getEconRunComboNames(
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Promise<string[] | null> {
		const distinctComboNames = (await this.context.models.EconRunDataModel.distinct('comboName', {
			project: project._id,
			scenario: scenarioId,
			run: econRun.id,
		})) as string[];

		if (distinctComboNames.length === 0) {
			return null;
		}

		return distinctComboNames;
	}

	async getEconRunDataCount(
		filters: ApiQueryFilters,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Promise<number> {
		const mappedFilters = getFilters(filters, project, scenarioId, econRun);

		const baseQuery = this.context.models.EconRunDataModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(
		id: Types.ObjectId,
		project: BaseProjectResolved,
		scenarioId: Types.ObjectId,
		econRun: Pick<IEconRun, 'id' | 'runDate'>,
	): Promise<ApiEconRunData | null> {
		const pipeline = getPipeline(
			[],
			{
				filters: {
					_id: id,
					project: project._id,
					scenario: scenarioId,
					run: econRun.id,
				},
			},
			postSkipTakePipeline,
		);

		const [econRunData] = await this.context.models.EconRunDataModel.aggregate<IEconRunData>(pipeline);

		if (!econRunData) {
			return null;
		}
		return toApiEconRunData(econRunData);
	}
}
