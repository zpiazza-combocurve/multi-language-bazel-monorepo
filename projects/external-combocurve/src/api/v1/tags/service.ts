import { FilterQuery, Types } from 'mongoose';

import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiContextV1 } from '@src/api/v1/context';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { BaseService } from '@src/base-context';
import { ITag } from '@src/models/tags';

import { CursorType, IPageData } from '../pagination';

import {
	ApiTag,
	ApiTagInternalKey,
	getFilters,
	getSort,
	ignorableFields,
	stripIgnorableFields,
	toApiTagInternal,
} from './fields/root-tags';

export class TagsService extends BaseService<ApiContextV1> {
	static attribute = 'tagsService';

	async getTagsCount(filters: ApiQueryFilters): Promise<number> {
		const mappedFilters = getFilters(filters);
		const baseQuery = this.context.models.TagModel.find(mappedFilters);
		const countQuery = Object.keys(mappedFilters).length
			? baseQuery.countDocuments()
			: baseQuery.estimatedDocumentCount();

		return await countQuery;
	}

	async getTags(
		skip: number,
		take: number,
		sort: ISort,
		filters: ApiQueryFilters,
		cursor?: string,
	): Promise<IPageData<ApiTag>> {
		const { sortQuery, cursorFilter, allowCursor } = getSort(sort, cursor) ?? {};
		const mappedFilters = getFilters(filters, cursorFilter);
		const tags = await this.context.models.TagModel.find(mappedFilters)
			.sort(sortQuery)
			.skip(skip)
			.limit(take + 1);

		const resultTags = tags.slice(0, take).map(toApiTagInternal);

		return {
			result: resultTags.map((x) => stripIgnorableFields(x, ignorableFields)),
			hasNext: tags.length > take,
			cursor:
				resultTags.length > 0 && allowCursor
					? (resultTags[resultTags.length - 1][Object.keys(sort)[0] as ApiTagInternalKey] as CursorType)
					: null,
		};
	}

	/**
	 * Get the the tagIDs from mongo for informed tag names
	 * @param tags - The tag names
	 * @returns The ID array
	 */
	async getTagIDs(tags: (string | Record<string, string>)[]): Promise<Types.ObjectId[]> {
		if (tags?.length == 0) {
			return [];
		}

		const tagItems = await this.context.models.TagModel.find({
			name: { $in: tags },
		} as FilterQuery<ITag>).select('_id');

		return tagItems.map((x) => x._id);
	}

	/**
	 * Fill the mappedFilters with tag IDs for informed tag names
	 * @param tags - The tag names
	 * @param mappedFilters - The filter will be filled
	 */
	async fillFilterTagIDs(tags: (string | Record<string, string>)[], mappedFilters: IFilter<unknown>): Promise<void> {
		if (tags?.length > 0) {
			mappedFilters['tags'] = { $in: await this.getTagIDs(tags) };
		}
	}
}
