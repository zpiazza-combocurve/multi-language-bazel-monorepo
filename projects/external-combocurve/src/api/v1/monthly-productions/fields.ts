import { merge } from 'lodash';
import { Types } from 'mongoose';

import { DATE_FIELD, getStringEnumField, NUMBER_FIELD, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import {
	initSingleMonthlyProduction,
	IProductionCursor,
	ISingleMonthlyProduction,
} from '@src/helpers/single-production';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { DATA_SOURCES } from '@src/models/wells';

import { IApiSort, IFilterOption, IFilterOptionRecord } from '../fields';
import {
	IProductionField,
	MatchMoment,
	productionDateField,
	readField,
	readWriteField,
	wellField,
} from '../production-fields';

export const READ_RECORD_LIMIT = 20000;
export const WRITE_RECORD_LIMIT = 20000;
export const BUCKET_SIZE = 12;

type IMonthlyProductionField<T> = IProductionField<ISingleMonthlyProduction, T>;

const monthlyReadWriteField = readWriteField<ISingleMonthlyProduction>();
const monthlyReadField = readField<ISingleMonthlyProduction>();
const monthlyDateField = productionDateField<ISingleMonthlyProduction>(
	(date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 15)),
	'monthly',
);
const monthlyWellField = wellField<ISingleMonthlyProduction>();

const API_MONTHLY_PRODUCTION_FIELDS = {
	well: monthlyReadWriteField('well', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 100, beforeUnwind: true }, delete: { filterValues: 1 } },
		isRequired: false,
		isProductionData: false,
	}),

	date: monthlyDateField,

	oil: monthlyReadWriteField('oil', NUMBER_FIELD, { isProductionData: true }),
	gas: monthlyReadWriteField('gas', NUMBER_FIELD, { isProductionData: true }),
	choke: monthlyReadWriteField('choke', NUMBER_FIELD),
	water: monthlyReadWriteField('water', NUMBER_FIELD, { isProductionData: true }),
	daysOn: monthlyReadWriteField('days_on', NUMBER_FIELD),
	operationalTag: monthlyReadWriteField('operational_tag', STRING_FIELD),
	gasInjection: monthlyReadWriteField('gasInjection', NUMBER_FIELD),
	waterInjection: monthlyReadWriteField('waterInjection', NUMBER_FIELD),
	co2Injection: monthlyReadWriteField('co2Injection', NUMBER_FIELD),
	steamInjection: monthlyReadWriteField('steamInjection', NUMBER_FIELD),
	ngl: monthlyReadWriteField('ngl', NUMBER_FIELD),
	customNumber0: monthlyReadWriteField('customNumber0', NUMBER_FIELD),
	customNumber1: monthlyReadWriteField('customNumber1', NUMBER_FIELD),
	customNumber2: monthlyReadWriteField('customNumber2', NUMBER_FIELD),
	customNumber3: monthlyReadWriteField('customNumber3', NUMBER_FIELD),
	customNumber4: monthlyReadWriteField('customNumber4', NUMBER_FIELD),

	createdAt: monthlyReadField('createdAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1, beforeUnwind: true } },
		sortable: true,
	}),
	updatedAt: monthlyReadField('updatedAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1, beforeUnwind: true } },
		sortable: true,
	}),

	chosenID: monthlyWellField('chosenID', STRING_FIELD),
	dataSource: monthlyWellField('dataSource', getStringEnumField(DATA_SOURCES)),
};

export default API_MONTHLY_PRODUCTION_FIELDS;

export type ApiMonthlyProductionKey = keyof typeof API_MONTHLY_PRODUCTION_FIELDS;
type TypeOfField<FT> = FT extends IMonthlyProductionField<infer T> ? T : never;
export type ApiMonthlyProduction = {
	[key in ApiMonthlyProductionKey]?: TypeOfField<(typeof API_MONTHLY_PRODUCTION_FIELDS)[key]>;
};

export const toApiMonthlyProduction = (monthlyProduction: ISingleMonthlyProduction): ApiMonthlyProduction => {
	const apiProduction: Record<string, ApiMonthlyProduction[ApiMonthlyProductionKey]> = {};
	Object.entries(API_MONTHLY_PRODUCTION_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiProduction[field] = read(monthlyProduction);
		}
	});
	return apiProduction;
};

export const toISingleMonthlyProduction = (apiMonthlyProduction: ApiMonthlyProduction): ISingleMonthlyProduction => {
	const singleProduction = initSingleMonthlyProduction();
	Object.entries(API_MONTHLY_PRODUCTION_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (production: ISingleMonthlyProduction, value: unknown) => void;
			coercedWrite(singleProduction, apiMonthlyProduction[field as ApiMonthlyProductionKey]);
		}
	});
	return singleProduction;
};

const isApiMonthlyProductionField = (field: string): field is keyof typeof API_MONTHLY_PRODUCTION_FIELDS =>
	Object.keys(API_MONTHLY_PRODUCTION_FIELDS).includes(field);

export const getApiMonthlyProductionField = (
	field: string,
): (typeof API_MONTHLY_PRODUCTION_FIELDS)[ApiMonthlyProductionKey] | null => {
	if (!isApiMonthlyProductionField(field)) {
		return null;
	}
	return API_MONTHLY_PRODUCTION_FIELDS[field];
};

export const getSort = (sort: ISort): IApiSort | null => {
	const sortField = Object.keys(sort)[0];
	const getSort = getApiMonthlyProductionField(sortField)?.getDbSort;
	if (!getSort) {
		return null;
	}
	return getSort(sort);
};

export const getDefaultSort = (): IApiSort => ({ sortQuery: { well: 1, startIndex: 1 }, allowCursor: true });

export const sortableFields = Object.entries(API_MONTHLY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbSort)
	.map(([key]) => key);

export const getReadFilters = (
	filters: ApiQueryFilters,
	project: Types.ObjectId | undefined | null,
	matchMoment: MatchMoment,
	cursor?: IFilter,
): IFilter => {
	const res = Object.entries(filters).reduce<IFilter>((cumFilters, [field, filter]) => {
		const apiField = getApiMonthlyProductionField(field);
		const getFilter = apiField?.getDbReadFilter;
		if (!getFilter) {
			return cumFilters;
		}

		let mappedFilter = {};
		const isAfterUnwindFilter = apiField?.options?.filterOption?.read?.afterUnwind;
		const isBeforeUnwindFilter = apiField?.options?.filterOption?.read?.beforeUnwind;

		const isAfterUnwindMoment = matchMoment == 'afterUnwind';
		const isBeforeUnwindMoment = matchMoment == 'beforeUnwind';

		if ((!!isAfterUnwindFilter && isAfterUnwindMoment) || (!!isBeforeUnwindFilter && isBeforeUnwindMoment)) {
			mappedFilter = getFilter({ [field]: filter }, matchMoment);
		}

		return { ...cumFilters, ...mappedFilter };
	}, {});

	return merge({ ...res }, { ...(project !== undefined ? { project } : {}) }, cursor || {});
};

export const getDeleteFilters = (filters: ApiQueryFilters, project: Types.ObjectId | null = null): IFilter => {
	const res = Object.entries(filters).reduce<IFilter>((cumFilters, [field, filter]) => {
		const getFilter = getApiMonthlyProductionField(field)?.getDbDeleteFilter;
		if (!getFilter) {
			return cumFilters;
		}
		const mappedFilter = getFilter({ [field]: filter });
		return { ...cumFilters, ...mappedFilter };
	}, {});

	return { ...res, project };
};

export const filterableReadDbFields = Object.entries(API_MONTHLY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbReadFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.read as IFilterOption;
		return acc;
	}, {});

export const filterableDeleteDbFields = Object.entries(API_MONTHLY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbDeleteFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.delete as IFilterOption;
		return acc;
	}, {});

export const getRequiredFields = (prod: ApiMonthlyProduction): ApiMonthlyProductionKey[] => {
	const baseRequired = Object.entries(API_MONTHLY_PRODUCTION_FIELDS)
		.filter(([, field]) => field?.options?.isRequired)
		.map(([key]) => key as ApiMonthlyProductionKey);
	if (prod.well) {
		return [...baseRequired, 'well'];
	}
	return [...baseRequired, 'chosenID', 'dataSource'];
};

export const productionDataFields = Object.entries(API_MONTHLY_PRODUCTION_FIELDS)
	.filter(([, field]) => field?.options?.isProductionData)
	.map(([key]) => key);

export const getCursorFilter = (sort: ISort, cursor: IProductionCursor | null): IFilter | undefined => {
	if (!cursor) {
		return undefined;
	}

	const sortVal = Object.values(sort)[0];

	return { _id: sortVal === 1 ? { $gte: cursor.id } : { $lte: cursor.id } };
};
