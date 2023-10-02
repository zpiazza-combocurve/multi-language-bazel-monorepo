import { ApiQueryFilters, IFieldDefinition } from '@src/helpers/fields/field-definition';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	ignorableDbFields,
	IReadFieldOptions,
	readDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { getStringEnumField, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { DATA_SOURCES } from '@src/models/wells';
import { IWellDirectionalSurvey } from '@src/models/well-directional-surveys';

const readField = <K extends keyof IWellDirectionalSurvey, TParsed = IWellDirectionalSurvey[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
): IField<IWellDirectionalSurvey, IWellDirectionalSurvey[K], TParsed> =>
	readDbField<IWellDirectionalSurvey, K, TParsed>(key, definition, options);

const directional_fields = {
	well: readField('well', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	dataSource: readField('dataSource', getStringEnumField(DATA_SOURCES), {
		filterOption: { read: { filterValues: 1 } },
	}),
	chosenID: readField('chosenID', STRING_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
	project: readField('project', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	id: readField('_id', OBJECT_ID_FIELD, {
		allowCursor: true,
		sortable: true,
		ignorable: true,
	}),
};

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, directional_fields, cursor ? { value: cursor } : undefined);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, directional_fields, undefined, cursor);

export const filterableFields = filterableReadDbFields(directional_fields);
export const sortableFields = sortableDbFields(directional_fields);
export const ignorableFields = ignorableDbFields(directional_fields);

export default directional_fields;
