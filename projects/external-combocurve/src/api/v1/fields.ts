import { merge } from 'lodash';
import { Types } from 'mongoose';

import { getBqFilter, IBQFilters } from '@src/helpers/bq-queries';
import { getDbFilter, IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IFieldDefinition } from '@src/helpers/fields';

export type ApiType<T> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key in string]: IField<T, any, any>;
};

export interface IFilterOption {
	/**
	 * @todo Support multiple filters when value can have comma
	 */
	filterValues: number | false;
	afterUnwind?: boolean;
	beforeUnwind?: boolean;
}

type FilterMoment = 'read' | 'delete';

export interface IReadFieldOptions {
	sortable?: boolean;
	/**
	 * **Note:** This should true only if the field has unique values,
	 * if the field contains duplicate values there will be unexpected results.
	 */
	allowCursor?: boolean;
	filterOption?: { [K in FilterMoment]?: IFilterOption };
	ignorable?: boolean;
	hasDefault?: boolean;
}

export interface IReadWriteFieldOptions extends IReadFieldOptions {
	isRequired?: boolean;
	isNullable?: boolean;
}

export type Write<T, TField> = (t: Partial<T>, value: TField) => void;

export interface IApiSort {
	sortQuery: ISort;
	cursorFilter?: IFilter;
	allowCursor: boolean;
}

export interface IFilterOptionRecord {
	[key: string]: IFilterOption;
}

export interface IUpdate<T> {
	id: Types.ObjectId;
	update: Partial<T>;
	remove: Array<keyof T>;
}

export interface IField<T, TField, TParsed = TField> extends IFieldDefinition<TParsed> {
	read?: (t: T) => TField;
	write?: Write<T, TField>;
	getBqSort?: (sort: ISort) => IApiSort;
	getBqFilter?: (filter: ApiQueryFilters) => IFilter<IBQFilters>;
	getDbSort?: (sort: ISort, cursor?: string) => IApiSort;
	getDbDeleteFilter?: (filter: ApiQueryFilters) => IFilter;
	getDbReadFilter?: (filter: ApiQueryFilters) => IFilter;
	remove?: (t: Partial<T>) => (keyof T)[];
	options?: IReadWriteFieldOptions;
}

const readField = <T, K extends keyof T, TParsed = T[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions,
): IField<T, T[K], TParsed> => {
	return {
		...definition,
		read: (t) => t[key],
		options,
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type getApiFieldAdditionalLogic<T> = (
	fieldName: string,
	field: ApiType<T>[keyof ApiType<T>],
) => ApiType<T>[keyof ApiType<T>] | undefined;

export const readDbField = <T, K extends keyof T, TParsed = T[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
): IField<T, T[K], TParsed> => {
	const {
		allowCursor = false,
		sortable = false,
		ignorable = false,
		filterOption = { read: { filterValues: false }, delete: { filterValues: false } },
		hasDefault = false,
	} = options;
	const { parseQuery } = definition;

	const getDbFieldFilter = (filter: ApiQueryFilters) => {
		const parsedValue = parseQuery?.(Object.values(filter)[0]);
		if (!parsedValue) {
			return { [key]: Object.values(filter)[0] };
		}
		return {
			[key]: getDbFilter(parsedValue),
		};
	};

	return {
		...readField(key, definition, { allowCursor, filterOption, sortable, ignorable, hasDefault }),
		getDbSort: sortable
			? (sort, cursor) => {
					const sortVal = Object.values(sort)[0];
					return {
						sortQuery: { [key]: sortVal },
						cursorFilter:
							allowCursor && cursor
								? getDbFieldFilter?.({ [key]: sortVal === 1 ? [{ gt: cursor }] : [{ lt: cursor }] })
								: undefined,
						allowCursor,
					};
			  }
			: undefined,
		getDbReadFilter: filterOption.read?.filterValues ? getDbFieldFilter : undefined,
		getDbDeleteFilter: filterOption.delete?.filterValues ? getDbFieldFilter : undefined,
	};
};

export const readBqField = <T, K extends keyof T, TParsed = T[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
): IField<T, T[K], TParsed> => {
	const {
		allowCursor = false,
		filterOption = { read: { filterValues: false }, delete: { filterValues: false } },
		sortable = false,
	} = options;
	const { parseQuery } = definition;

	return {
		...readField(key, definition, { allowCursor, filterOption, sortable }),
		getBqSort: undefined,
		getBqFilter: filterOption.read?.filterValues
			? (filter) => {
					const parsedValue = parseQuery?.(Object.values(filter)[0]);
					if (!parsedValue) {
						return {
							[key]: { value: Object.values(filter)[0], operator: '=' as const },
						};
					}
					return {
						[key]: getBqFilter(parsedValue),
					};
			  }
			: undefined,
	};
};

export const readWriteDbField = <T, K extends keyof T, TParsed = T[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
): IField<T, T[K], TParsed> => {
	const {
		sortable = false,
		filterOption = { read: { filterValues: false }, delete: { filterValues: false } },
		isRequired = false,
		hasDefault = false,
	} = options;

	const field = readDbField<T, K, TParsed>(key, definition, {
		sortable,
		filterOption,
		hasDefault,
		allowCursor: options.allowCursor,
	});

	return {
		...field,
		write: (t, value) => (t[key] = value),
		options: { ...field.options, isRequired, hasDefault },
	};
};

export const sortableDbFields = <T>(apiType: ApiType<T>): string[] =>
	Object.entries(apiType)
		.filter(([, field]) => !!field.getDbSort)
		.map(([key]) => key);

export const ignorableDbFields = <T>(apiType: ApiType<T>): string[] =>
	Object.entries(apiType)
		.filter(([, { options }]) => options?.ignorable)
		.map(([key]) => key);

const filterableDbFields = <T>(apiType: ApiType<T>, moment: FilterMoment = 'read'): IFilterOptionRecord =>
	Object.entries(apiType)
		.filter(([, field]) => !!(moment === 'read' ? field.getDbReadFilter : field.getDbDeleteFilter))
		.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
			acc[key] = options?.filterOption?.[moment] as IFilterOption;
			return acc;
		}, {});

export const filterableReadDbFields = <T>(apiType: ApiType<T>): IFilterOptionRecord =>
	filterableDbFields(apiType, 'read');

export const filterableDeleteDbFields = <T>(apiType: ApiType<T>): IFilterOptionRecord =>
	filterableDbFields(apiType, 'delete');

export const sortableBqFields = <T>(apiType: ApiType<T>): string[] =>
	Object.entries(apiType)
		.filter(([, field]) => !!field.getBqSort)
		.map(([key]) => key);

export const filterableBqFields = <T>(apiType: ApiType<T>): IFilterOptionRecord =>
	Object.entries(apiType)
		.filter(([, field]) => !!field.getBqFilter)
		.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
			acc[key] = options?.filterOption?.['read'] as IFilterOption;
			return acc;
		}, {});

export const isApiDataField = <T>(field: string, apiType: ApiType<T>): field is keyof ApiType<T> => {
	return apiType[field] !== undefined;
};

export const getApiField = <T>(
	fieldName: string,
	apiType: ApiType<T>,
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
): ApiType<T>[keyof ApiType<T>] | null => {
	if (!isApiDataField(fieldName, apiType)) {
		return null;
	}
	const field = apiType[fieldName];

	const additionalLogicResult = getApiFieldAdditionalLogic?.(fieldName, field);

	if (additionalLogicResult !== undefined) {
		return additionalLogicResult;
	}

	return field;
};

export const getApiDbSort = <T>(
	sort: ISort,
	apiType: ApiType<T>,
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
	cursor?: string,
): IApiSort | null => {
	const sortField = Object.keys(sort)[0];

	const getSort = getApiField(sortField, apiType, getApiFieldAdditionalLogic)?.getDbSort;

	if (!getSort) {
		return null;
	}
	return getSort(sort, cursor);
};

const getApiDbFilters = <T>(
	filters: ApiQueryFilters,
	apiType: ApiType<T>,
	additionalFilters?: { value: { [K in keyof ApiType<T>]?: unknown }; override?: boolean },
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
	moment: FilterMoment = 'read',
): IFilter => {
	const res = Object.entries(filters).reduce<IFilter>((cumFilters, [field, filter]) => {
		const apiField = getApiField(field, apiType, getApiFieldAdditionalLogic);
		const getFilter = moment === 'read' ? apiField?.getDbReadFilter : apiField?.getDbDeleteFilter;
		if (!getFilter) {
			return cumFilters;
		}
		return { ...cumFilters, ...getFilter({ [field]: filter }) };
	}, {});
	return additionalFilters?.override !== false
		? { ...res, ...(additionalFilters?.value ?? {}) }
		: merge(additionalFilters?.value ?? {}, res);
};

export const getApiBqSort = <T>(
	sort: ISort,
	apiType: ApiType<T>,
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
): IApiSort | null => {
	const sortField = Object.keys(sort)[0];

	const getSort = getApiField(sortField, apiType, getApiFieldAdditionalLogic)?.getBqSort;

	if (!getSort) {
		return null;
	}
	return getSort(sort);
};

export const getApiBqFilters = <T>(
	filters: ApiQueryFilters,
	apiType: ApiType<T>,
	additionalFilters?: { value: { [K in keyof ApiType<T>]: IBQFilters }; override?: boolean },
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
): IFilter<IBQFilters> => {
	const res = Object.entries(filters).reduce<IFilter<IBQFilters>>((cumFilters, [field, filter]) => {
		const getFilter = getApiField(field, apiType, getApiFieldAdditionalLogic)?.getBqFilter;
		if (!getFilter) {
			return cumFilters;
		}
		return { ...cumFilters, ...getFilter({ [field]: filter }) };
	}, {});
	return additionalFilters?.override !== false
		? { ...res, ...(additionalFilters?.value ?? {}) }
		: { ...(additionalFilters?.value ?? {}), ...res };
};

export const getApiReadDbFilters = <T>(
	filters: ApiQueryFilters,
	apiType: ApiType<T>,
	additionalFilters?: { value: { [K in keyof ApiType<T>]?: unknown }; override?: boolean },
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
): IFilter => getApiDbFilters(filters, apiType, additionalFilters, getApiFieldAdditionalLogic, 'read');

export const getApiDeleteDbFilters = <T>(
	filters: ApiQueryFilters,
	apiType: ApiType<T>,
	additionalFilters?: { value: { [K in keyof ApiType<T>]?: unknown }; override?: boolean },
	getApiFieldAdditionalLogic?: getApiFieldAdditionalLogic<T>,
): IFilter => getApiDbFilters(filters, apiType, additionalFilters, getApiFieldAdditionalLogic, 'delete');
