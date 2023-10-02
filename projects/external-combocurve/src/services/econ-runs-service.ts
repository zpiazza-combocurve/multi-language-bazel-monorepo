import { FilterQuery, Types } from 'mongoose';

import { ApiEconRun, ApiEconRunKey, getFilters, getSort, projection, toApiEconRun } from '@src/api/v1/econ-runs/fields';
import { CursorType, IPageData } from '@src/api/v1/pagination';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseProjectResolved } from '@src/api/v1/projects/fields';
import { BaseService } from '@src/base-context';
import { ITag } from '@src/models/tags';

export class EconRunService extends BaseService<ApiContextV1> {
	static attribute = 'econRunService';

	async getEconRuns(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		projectId: Types.ObjectId | null = null,
		scenarioId: Types.ObjectId | null = null,
		cursor?: string,
	): Promise<IPageData<ApiEconRun>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) || {};
		const mappedFilters = await this.getFilters(filters, projectId, scenarioId, cursorFilter);

		const econRuns = await this.context.models.EconRunModel.find(mappedFilters, projection)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1)
			.populate('tags');

		const result = econRuns.slice(0, take).map(toApiEconRun);

		return {
			result,
			hasNext: econRuns.length > take,
			cursor:
				result.length > 0 && allowCursor
					? (result[result.length - 1][Object.keys(sort)[0] as ApiEconRunKey] as CursorType)
					: null,
		};
	}

	async getEconRunsCount(
		filters: ApiQueryFilters,
		projectId: Types.ObjectId | null = null,
		scenarioId: Types.ObjectId | null = null,
	): Promise<number> {
		const mappedFilters = await this.getFilters(filters, projectId, scenarioId);

		const baseQuery = this.context.models.EconRunModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();
		return await countQuery;
	}

	async getById(
		id: Types.ObjectId,
		projectId: Types.ObjectId | null = null,
		scenarioId: Types.ObjectId | null = null,
	): Promise<ApiEconRun | null> {
		const econRun = await this.context.models.EconRunModel.findOne(
			{
				_id: id,
				...(projectId ? { project: projectId } : {}),
				...(scenarioId ? { scenario: scenarioId } : {}),
			},
			projection,
		).populate('tags');

		if (!econRun) {
			return null;
		}
		return toApiEconRun(econRun);
	}

	async existsById(id: Types.ObjectId, project: BaseProjectResolved, scenarioId: Types.ObjectId): Promise<boolean> {
		return await this.context.models.EconRunModel.exists({ _id: id, project: project._id, scenario: scenarioId });
	}

	private async getFilters(
		filters: ApiQueryFilters,
		projectId: Types.ObjectId | null,
		scenarioId: Types.ObjectId | null,
		cursor?: IFilter,
	): Promise<IFilter> {
		const { tags, ...restFilters } = filters;
		const mappedFilters = getFilters(restFilters, projectId, scenarioId, cursor);
		await this.applyFilterByTags(tags, mappedFilters);

		return mappedFilters;
	}

	private async applyFilterByTags(tags: (string | Record<string, string>)[], mappedFilters: IFilter<unknown>) {
		if (tags?.length > 0) {
			const tagItems = await this.context.models.TagModel.find({
				name: { $in: tags },
			} as FilterQuery<ITag>).select('_id');
			const tagIds = tagItems.map((x) => x._id);
			mappedFilters['tags'] = { $in: tagIds };
		}
	}
}
