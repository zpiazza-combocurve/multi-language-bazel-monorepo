import { model, Types } from 'mongoose';

import { DATE_FIELD, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiField,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IReadFieldOptions,
	IReadWriteFieldOptions,
	readDbField,
	readWriteDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IProject } from '@src/models/projects';
import { ProjectSchema } from '@src/schemas';
import { REST_API_USER_ID } from '@src/constants/user';

export const READ_RECORD_LIMIT = 200;
export const WRITE_RECORD_LIMIT = 200;

type IProjectField<T> = IField<IProject, T>;

export type BaseProjectResolved = Pick<IProject, '_id' | 'name'>;

const readProjectField = <K extends keyof IProject, TParsed = IProject[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IProject, K, TParsed>(key, definition, options);

const readWriteProjectField = <K extends keyof IProject, TParsed = IProject[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IProject, K, TParsed>(key, definition, options);

const API_PROJECT_FIELDS = {
	createdAt: readProjectField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	id: readProjectField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	name: readWriteProjectField('name', STRING_FIELD, {
		sortable: true,
		isRequired: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	updatedAt: readProjectField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

export default API_PROJECT_FIELDS;

export type ApiProjectKey = keyof typeof API_PROJECT_FIELDS;

type TypeOfField<FT> = FT extends IProjectField<infer T> ? T : never;

export type ApiProject = { [key in ApiProjectKey]?: TypeOfField<(typeof API_PROJECT_FIELDS)[key]> };

export const toApiProject = (project: IProject): ApiProject => {
	const apiProject: Record<string, ApiProject[ApiProjectKey]> = {};
	Object.entries(API_PROJECT_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiProject[field] = read(project);
		}
	});
	return apiProject;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_PROJECT_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_PROJECT_FIELDS);

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_PROJECT_FIELDS, cursor ? { value: cursor } : undefined);

export const filterableFields = filterableReadDbFields(API_PROJECT_FIELDS);

export const requiredFields = Object.entries(API_PROJECT_FIELDS)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiProjectKey);

export const getApiProjectField = (field: string): (typeof API_PROJECT_FIELDS)[ApiProjectKey] | null =>
	getApiField<IProject>(field, API_PROJECT_FIELDS);

export const toIProject = (apiProject: ApiProject): IProject => {
	const project = new (model<IProject>('defaultProject', ProjectSchema))({
		createdBy: Types.ObjectId(REST_API_USER_ID),
	});
	Object.entries(API_PROJECT_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (project: IProject, value: unknown) => void;
			coercedWrite(project, apiProject[field as ApiProjectKey]);
		}
	});
	return project;
};
