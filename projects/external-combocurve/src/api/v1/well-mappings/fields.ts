import { LeanDocument, model } from 'mongoose';

import { DATA_SOURCES, IWell } from '@src/models/wells';
import { DATE_FIELD, getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IReadFieldOptions,
	readDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { WellSchema } from '@src/schemas';

export const READ_RECORD_LIMIT = 100000;

export const defaultWell = new (model<IWell>('defaultWell', WellSchema))({});

type LeanWell = LeanDocument<IWell>;

export type WellKey = keyof LeanWell;

export type WellField<T> = IField<LeanWell, T>;

const readField = <K extends WellKey, TParsed = LeanWell[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => ({ key, ...readDbField<LeanWell, K, TParsed>(key, definition, options) });

const API_WELL_MAPPING_FIELDS = {
	id: readField('_id', OBJECT_ID_FIELD, {
		allowCursor: true,
		sortable: true,
		filterOption: { read: { filterValues: 100 } },
	}),
	chosenID: readField('chosenID', STRING_FIELD, { filterOption: { read: { filterValues: 100 } } }),
	dataSource: readField('dataSource', getStringEnumField(DATA_SOURCES), {
		filterOption: { read: { filterValues: 1 } },
	}),
	projectId: readField('project', OBJECT_ID_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	createdAt: readField('createdAt', DATE_FIELD, { filterOption: { read: { filterValues: 1 } } }),
	updatedAt: readField('updatedAt', DATE_FIELD, { filterOption: { read: { filterValues: 1 } } }),
};

export default API_WELL_MAPPING_FIELDS;

export type ApiWellMappingKey = keyof typeof API_WELL_MAPPING_FIELDS;

export type WellMappingField = (typeof API_WELL_MAPPING_FIELDS)[ApiWellMappingKey];

type TypeOfField<FT> = FT extends WellField<infer T> ? T : never;

export type ApiWellMapping = { [key in ApiWellMappingKey]?: TypeOfField<(typeof API_WELL_MAPPING_FIELDS)[key]> };

export const toApiWellMapping = (well: LeanWell): ApiWellMapping => {
	const apiWell: Record<string, ApiWellMapping[ApiWellMappingKey]> = {};
	Object.entries(API_WELL_MAPPING_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiWell[field] = read(well);
		}
	});
	return apiWell;
};

export const readOnlyFields = Object.entries(API_WELL_MAPPING_FIELDS)
	.filter(([, field]) => field.read && !field.write)
	.map(([key]) => key);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_WELL_MAPPING_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_WELL_MAPPING_FIELDS);

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_WELL_MAPPING_FIELDS, cursor ? { value: cursor } : undefined);

export const filterableReadFields = filterableReadDbFields(API_WELL_MAPPING_FIELDS);

export const projection = Object.values(API_WELL_MAPPING_FIELDS).map(({ key }) => key);
