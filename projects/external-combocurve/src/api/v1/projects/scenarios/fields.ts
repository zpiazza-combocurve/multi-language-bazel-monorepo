import { merge } from 'lodash';

import { DATE_FIELD, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiDeleteDbFilters,
	getApiReadDbFilters,
	IApiSort,
	IField,
	IFilterOption,
	IFilterOptionRecord,
	IReadFieldOptions,
	IReadWriteFieldOptions,
	readDbField,
	readWriteDbField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IScenario } from '@src/models/scenarios';

import { BaseProjectResolved } from '../fields';

export const READ_RECORD_LIMIT = 200;

type IScenarioField<T> = IField<IScenario, T>;

const readScenarioField = <K extends keyof IScenario, TParsed = IScenario[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IScenario, K, TParsed>(key, definition, options);

const readWriteScenarioField = <K extends keyof IScenario, TParsed = IScenario[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IScenario, K, TParsed>(key, definition, options);

const API_SCENARIO_FIELDS = {
	createdAt: readScenarioField('createdAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
	id: readWriteScenarioField('_id', OBJECT_ID_FIELD, {
		sortable: true,
		allowCursor: true,
		filterOption: { delete: { filterValues: 100 } },
	}),
	name: readWriteScenarioField('name', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 }, delete: { filterValues: 100 } },
	}),
	updatedAt: readScenarioField('updatedAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
};

export default API_SCENARIO_FIELDS;

export type ApiScenarioKey = keyof typeof API_SCENARIO_FIELDS;

type TypeOfField<FT> = FT extends IScenarioField<infer T> ? T : never;

export type ApiScenario = { [key in ApiScenarioKey]?: TypeOfField<(typeof API_SCENARIO_FIELDS)[key]> };

export const toApiScenario = (scenario: IScenario): ApiScenario => {
	const apiScenario: Record<string, ApiScenario[ApiScenarioKey]> = {};
	Object.entries(API_SCENARIO_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiScenario[field] = read(scenario);
		}
	});
	return apiScenario;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_SCENARIO_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_SCENARIO_FIELDS);

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_SCENARIO_FIELDS, { value: merge({ project: project._id }, cursor || {}) });

export const filterableFields = filterableReadDbFields(API_SCENARIO_FIELDS);

export const filterableDeleteDbFields = Object.entries(API_SCENARIO_FIELDS)
	.filter(([, field]) => !!field.getDbDeleteFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.delete as IFilterOption;
		return acc;
	}, {});

const isScenarioField = (field: string): field is keyof typeof API_SCENARIO_FIELDS =>
	Object.keys(API_SCENARIO_FIELDS).includes(field);

export const getScenarioField = (field: string): (typeof API_SCENARIO_FIELDS)[ApiScenarioKey] | null => {
	if (!isScenarioField(field)) {
		return null;
	}
	return API_SCENARIO_FIELDS[field];
};

export const getDeleteFilters = (filters: ApiQueryFilters): IFilter =>
	getApiDeleteDbFilters(filters, API_SCENARIO_FIELDS);
