import { omit } from 'lodash';

import { DATE_FIELD, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	ignorableDbFields,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { ITag } from '@src/models/tags';

import BASE_API_TAGS_FIELDS, { readTagField } from './tags';

export const READ_RECORD_LIMIT = 200;

const API_TAGS_FIELDS = {
	...BASE_API_TAGS_FIELDS,
	name: readTagField('name', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	createdAt: readTagField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	updatedAt: readTagField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

const API_TAGS_FIELDS_WITH_ID = {
	...API_TAGS_FIELDS,
	id: readTagField('_id', OBJECT_ID_FIELD, {
		allowCursor: true,
		sortable: true,
		ignorable: true,
	}),
};

type ApiTagKey = keyof typeof API_TAGS_FIELDS;
export type ApiTagInternalKey = keyof typeof API_TAGS_FIELDS_WITH_ID;

type ITagField<T> = IField<ITag, T>;
type TypeOfField<FT> = FT extends ITagField<infer T> ? T : never;

export type ApiTag = { [key in ApiTagKey]?: TypeOfField<(typeof API_TAGS_FIELDS)[key]> };
export type ApiTagInternal = { [key in ApiTagInternalKey]?: TypeOfField<(typeof API_TAGS_FIELDS_WITH_ID)[key]> };

export const toApiTag = (tag: ITag): ApiTag => stripIgnorableFields(toApiTagInternal(tag), ignorableFields);

export const toApiTagInternal = (tag: ITag): ApiTagInternal => {
	const apiTag: Record<string, ApiTagInternal[ApiTagInternalKey]> = {};
	Object.entries(API_TAGS_FIELDS_WITH_ID).forEach(([field, { read }]) => {
		if (read) {
			apiTag[field] = read(tag);
		}
	});

	return apiTag;
};

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_TAGS_FIELDS, cursor ? { value: cursor } : undefined);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_TAGS_FIELDS_WITH_ID, undefined, cursor);

export const stripIgnorableFields = (item: ApiTagInternal, omitFields: string[]): ApiTag =>
	omitFields.length ? omit(item, omitFields) : item;

export const filterableFields = filterableReadDbFields(API_TAGS_FIELDS);

export const sortableFields = sortableDbFields(API_TAGS_FIELDS);

export const ignorableFields = ignorableDbFields(API_TAGS_FIELDS_WITH_ID);

export default API_TAGS_FIELDS;
