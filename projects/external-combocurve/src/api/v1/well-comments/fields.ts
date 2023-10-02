import { Types } from 'mongoose';

import { DATE_FIELD, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IField, IReadFieldOptions, readDbField } from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { parseNumber, parseObjectId, ValidationError } from '@src/helpers/validation';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';

export const READ_RECORD_LIMIT = 200;

export interface IWellComment {
	_id?: Types.ObjectId;
	createdAt?: Date;
	createdBy?: Types.ObjectId;
	forecast: Types.ObjectId | null;
	project: Types.ObjectId | null;
	scenario: Types.ObjectId | null;
	text: string;
	well: Types.ObjectId;
	arrayIndex: number | null;
}

export type IWellCommentKey = keyof IWellComment;

export interface IWellCommentCursor {
	id: Types.ObjectId;
	index: number;
}

type IWellCommentField<T> = IField<IWellComment, T>;

const readWellCommentField = <K extends keyof IWellComment, TParsed = IWellComment[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IWellComment, K, TParsed>(key, definition, options);

const API_WELL_COMMENT_FIELDS = {
	commentedAt: readWellCommentField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	commentedBy: readWellCommentField('createdBy', OBJECT_ID_FIELD),
	forecast: readWellCommentField('forecast', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	project: readWellCommentField('project', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	// scenario: readWellCommentField('scenario', OBJECT_ID_FIELD, { sortable: true, filterable: true }), Won't be exposed for now
	text: readWellCommentField('text', STRING_FIELD),
	well: readWellCommentField('well', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

const API_WELL_COMMENT_FIELDS_WITH_ID = {
	...API_WELL_COMMENT_FIELDS,
	id: readWellCommentField('_id', OBJECT_ID_FIELD, {
		allowCursor: true,
		sortable: true,
	}),
};

export type ApiWellCommentKey = keyof typeof API_WELL_COMMENT_FIELDS;

type TypeOfField<FT> = FT extends IWellCommentField<infer T> ? T : never;

export type ApiWellComment = { [key in ApiWellCommentKey]?: TypeOfField<(typeof API_WELL_COMMENT_FIELDS)[key]> };

export const toApiWellComment = (wellComment: IWellComment): ApiWellComment => {
	const apiWellComment: Record<string, ApiWellComment[ApiWellCommentKey]> = {};
	Object.entries(API_WELL_COMMENT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiWellComment[field] = read(wellComment);
		}
	});
	return apiWellComment;
};

export const getSort = (sort: ISort): IApiSort | null => getApiDbSort(sort, API_WELL_COMMENT_FIELDS_WITH_ID);

export const sortableFields = sortableDbFields(API_WELL_COMMENT_FIELDS);

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_WELL_COMMENT_FIELDS, cursor ? { value: cursor } : undefined);

export const filterableFields = filterableReadDbFields(API_WELL_COMMENT_FIELDS);

export const adjustSortQuery = (sortQuery: ISort): ISort => ({ ...sortQuery, ...{ arrayIndex: 1 } });

export const parseCursor = (cursor?: string): IWellCommentCursor | null => {
	if (!cursor) {
		return null;
	}

	try {
		const [idPart, indexPart] = cursor.split('+');
		const id = parseObjectId(idPart);
		const index = parseNumber(indexPart);

		return {
			id,
			index,
		};
	} catch (error) {
		throw new ValidationError(`Cursor is not valid`);
	}
};

export const createCursor = (id?: Types.ObjectId, index?: number | null): string => `${id}+${index}`;

export const getCursorFilter = (sort?: ISort, cursor?: IWellCommentCursor | null): IFilter | undefined => {
	if (!cursor || !sort) {
		return undefined;
	}

	const sortVal = Object.values(sort)[0];

	return { _id: sortVal === 1 ? { $gte: cursor.id } : { $lte: cursor.id } };
};

export default API_WELL_COMMENT_FIELDS;
