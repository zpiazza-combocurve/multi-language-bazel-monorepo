import { isPlainObject } from 'lodash';

import { IFilter, ISort, Pipeline } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';

import { IPageData } from '../pagination';

import {
	adjustSortQuery,
	ApiWellComment,
	createCursor,
	getCursorFilter,
	getFilters,
	getSort,
	IWellComment,
	parseCursor,
	toApiWellComment,
} from './fields';

export class WellCommentService extends BaseService<ApiContextV1> {
	static attribute = 'wellCommentService';

	getBasePipeline(filters: IFilter): Pipeline {
		const { createdAt, ...restFilters } = filters;
		const coalescedCreatedAt = createdAt as Record<string, Date> | Date;
		const [creationDateFilter, creationDate] = isPlainObject(coalescedCreatedAt)
			? [Object.keys(coalescedCreatedAt)[0], Object.values(coalescedCreatedAt)[0]]
			: [undefined, createdAt];

		let bucketDateFilter;
		switch (creationDateFilter) {
			case '$gt':
			case '$gte':
				bucketDateFilter = { updatedAt: { [creationDateFilter]: creationDate } };
				break;
			case '$lt':
			case '$lte':
				bucketDateFilter = { createdAt: { [creationDateFilter]: creationDate } };
				break;
			default:
				bucketDateFilter = { createdAt: { $lte: creationDate }, updatedAt: { $gte: creationDate } };
		}

		const query = filters
			? [
					{
						$match: {
							...restFilters,
							...(creationDate ? bucketDateFilter : {}),
						},
					},
			  ]
			: [];

		const pipeline = [
			{ $unwind: { path: '$comments', includeArrayIndex: 'arrayIndex' } },
			{
				$project: {
					well: 1,
					forecast: 1,
					project: 1,
					createdAt: '$comments.createdAt',
					createdBy: '$comments.createdBy',
					text: '$comments.text',
					arrayIndex: 1,
				},
			},
		];
		const creationDateQuery = createdAt ? [{ $match: { createdAt } }] : [];
		return [...query, ...pipeline, ...creationDateQuery];
	}

	getFindPipeline({
		filters,
		sort,
		skip,
		limit,
	}: {
		filters: IFilter;
		sort: ISort | undefined;
		skip: number;
		limit: number;
	}): Pipeline {
		const basePipeline = this.getBasePipeline(filters);
		const pipelineSort = sort ? [{ $sort: sort }] : [];
		const pipelineSkip = skip !== undefined ? [{ $skip: skip }] : [];
		const pipelineLimit = limit ? [{ $limit: limit }] : [];
		return [...basePipeline, ...pipelineSort, ...pipelineSkip, ...pipelineLimit];
	}

	getCountPipeline(filters: IFilter): Pipeline {
		const basePipeline = this.getBasePipeline(filters);
		const pipelineCount = [{ $group: { _id: null, total: { $sum: 1 } } }];
		return [...basePipeline, ...pipelineCount];
	}

	async getWellComments(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
	): Promise<IPageData<ApiWellComment>> {
		const { sortQuery, allowCursor } = getSort(sort) || {};
		const adjustedSortQuery = allowCursor && sortQuery ? adjustSortQuery(sortQuery) : sortQuery;
		const parsedCursor = allowCursor ? parseCursor(cursor) : null;
		const cursorFilter = getCursorFilter(sortQuery, parsedCursor);
		const mappedFilters = getFilters(filters, cursorFilter);
		const pipeline = this.getFindPipeline({
			filters: mappedFilters,
			sort: adjustedSortQuery,
			skip,
			limit: take * 2 + 1,
		});
		const wellComments = await this.context.models.WellCommentBucketModel.aggregate<IWellComment>(pipeline);

		const lastReturnedItemIndex = parsedCursor
			? wellComments.findIndex(
					(x) => x._id?.toString() === parsedCursor.id.toString() && x.arrayIndex === parsedCursor.index,
			  )
			: -1;

		const skipCount = lastReturnedItemIndex >= 0 ? lastReturnedItemIndex + 1 : 0;
		const results = wellComments.slice(skipCount, skipCount + take);
		const lastWellComment = results[results.length - 1];
		const resultCursor =
			allowCursor && lastWellComment ? createCursor(lastWellComment._id, lastWellComment.arrayIndex) : null;

		return {
			result: results.map(toApiWellComment),
			hasNext: wellComments.length - skipCount > take,
			cursor: resultCursor,
		};
	}

	async getWellCommentsCount(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getFilters(filters);
		const pipeline = this.getCountPipeline(mappedFilters);
		const count = await this.context.models.WellCommentBucketModel.aggregate<{ total: number }>(pipeline);
		return count[0]?.total ?? 0;
	}
}
