import { cloneDeep } from 'lodash';

import { DATA_SOURCES, IOwnershipQualifier } from '@src/models/econ/ownership-qualifiers';
import { DATE_FIELD, getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import {
	filterableReadDbFields,
	getApiDbSort,
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
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { DefaultOwnershipQualifier, defaultOwnershipQualifier } from '../default-ownership-qualifier';
import { parseApiOwnership } from '../validations/ownership';

import { API_OWNERSHIP_FIELDS, ApiOwnership, toApiOwnership, toOwnership } from './ownership';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IOwnershipQualifierField<T> = IField<IOwnershipQualifier, T>;

const readField = <K extends keyof IOwnershipQualifier, TParsed = IOwnershipQualifier[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<IOwnershipQualifier, K, TParsed>(key, definition, options);

const readEmptyWriteField = <K extends keyof IOwnershipQualifier>(
	key: K,
	definition: IFieldDefinition<IOwnershipQualifier[K]>,
	options: IReadFieldOptions = {},
): IOwnershipQualifierField<IOwnershipQualifier[K]> => {
	return {
		...readField(key, definition, options),
		write: () => {
			// do nothing
		},
	};
};

const ownershipQualifierReadWriteDbField = <K extends keyof IOwnershipQualifier, TParsed = IOwnershipQualifier[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IOwnershipQualifier, K, TParsed>(key, definition, options);

const ownershipField = (): IOwnershipQualifierField<ApiOwnership> => {
	const key = 'ownership';
	return {
		type: OpenApiDataType.object,
		properties: API_OWNERSHIP_FIELDS,
		parse: parseApiOwnership,
		read: (ownershipQualifier) => toApiOwnership(ownershipQualifier[key]),
		write: (ownershipQualifier, value) => {
			const ownership = ownershipQualifier[key];
			if (notNil(ownership)) {
				ownershipQualifier[key] = toOwnership(ownership, value);
			}
		},
		options: { isRequired: true },
	};
};

const API_OWNERSHIP_QUALIFIER_FIELDS = {
	id: readEmptyWriteField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	well: ownershipQualifierReadWriteDbField('well', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
		sortable: true,
		isRequired: false,
	}),
	chosenID: ownershipQualifierReadWriteDbField('chosenID', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	dataSource: ownershipQualifierReadWriteDbField('dataSource', getStringEnumField(DATA_SOURCES)),
	qualifierKey: ownershipQualifierReadWriteDbField('qualifierKey', STRING_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
		isRequired: true,
	}),
	ownership: ownershipField(),
	createdAt: readField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	updatedAt: readField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

export const toApiOwnershipQualifier = (ownershipQualifier: IOwnershipQualifier): ApiOwnershipQualifier => {
	const apiOwnershipQualifier: Record<string, ApiOwnershipQualifier[ApiOwnershipQualifierKey]> = {};
	Object.entries(API_OWNERSHIP_QUALIFIER_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiOwnershipQualifier[field] = read(ownershipQualifier);
		}
	});
	return apiOwnershipQualifier;
};

export const toOwnershipQualifier = (apiOwnershipQualifier: ApiOwnershipQualifier): IOwnershipQualifier => {
	const ownershipQualifier = cloneDeep(defaultOwnershipQualifier);
	Object.entries(API_OWNERSHIP_QUALIFIER_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (production: DefaultOwnershipQualifier, value: unknown) => void;
			coercedWrite(ownershipQualifier, apiOwnershipQualifier[field as ApiOwnershipQualifierKey]);
		}
	});
	return ownershipQualifier as IOwnershipQualifier;
};

export type ApiOwnershipQualifierKey = keyof typeof API_OWNERSHIP_QUALIFIER_FIELDS;

type TypeOfField<FT> = FT extends IOwnershipQualifierField<infer T> ? T : never;

export type ApiOwnershipQualifier = {
	[key in ApiOwnershipQualifierKey]?: TypeOfField<(typeof API_OWNERSHIP_QUALIFIER_FIELDS)[key]>;
};

const isApiOwnershipQualifierField = (field: string): field is keyof typeof API_OWNERSHIP_QUALIFIER_FIELDS =>
	Object.keys(API_OWNERSHIP_QUALIFIER_FIELDS).includes(field);

export const getApiOwnershipQualifierField = (
	field: string,
): (typeof API_OWNERSHIP_QUALIFIER_FIELDS)[ApiOwnershipQualifierKey] | null => {
	if (!isApiOwnershipQualifierField(field)) {
		return null;
	}
	return API_OWNERSHIP_QUALIFIER_FIELDS[field];
};

export const getRequiredFields = (ownershipQualifier: ApiOwnershipQualifier): ApiOwnershipQualifierKey[] => {
	const baseRequired = Object.entries(API_OWNERSHIP_QUALIFIER_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiOwnershipQualifierKey);
	if (ownershipQualifier.well) {
		return [...baseRequired, 'well'];
	}
	return [...baseRequired, 'chosenID', 'dataSource'];
};

export const getFilters = (filters: ApiQueryFilters, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_OWNERSHIP_QUALIFIER_FIELDS, cursor ? { value: cursor } : undefined);

export const filterableFields = filterableReadDbFields(API_OWNERSHIP_QUALIFIER_FIELDS);

export const sortableFields = sortableDbFields(API_OWNERSHIP_QUALIFIER_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_OWNERSHIP_QUALIFIER_FIELDS, undefined, cursor);

export default API_OWNERSHIP_QUALIFIER_FIELDS;
