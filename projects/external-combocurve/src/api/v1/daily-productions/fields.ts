import { merge } from 'lodash';
import { Types } from 'mongoose';

import { DATE_FIELD, getStringEnumField, NUMBER_FIELD, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { initSingleDailyProduction, IProductionCursor, ISingleDailyProduction } from '@src/helpers/single-production';
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
export const BUCKET_SIZE = 31;

type IDailyProductionField<T> = IProductionField<ISingleDailyProduction, T>;

const dailyReadWriteField = readWriteField<ISingleDailyProduction>();
const dailyReadField = readField<ISingleDailyProduction>();
const dailyDateField = productionDateField<ISingleDailyProduction>(
	(date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())),
	'daily',
);

const dailyWellField = wellField<ISingleDailyProduction>();

const API_DAILY_PRODUCTION_FIELDS = {
	well: dailyReadWriteField('well', OBJECT_ID_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 100, beforeUnwind: true }, delete: { filterValues: 1 } },
		isRequired: false,
		isProductionData: false,
	}),

	date: dailyDateField,

	oil: dailyReadWriteField('oil', NUMBER_FIELD, { isProductionData: true }),
	gas: dailyReadWriteField('gas', NUMBER_FIELD, { isProductionData: true }),
	choke: dailyReadWriteField('choke', NUMBER_FIELD),
	water: dailyReadWriteField('water', NUMBER_FIELD, { isProductionData: true }),
	hoursOn: dailyReadWriteField('hours_on', NUMBER_FIELD),
	operationalTag: dailyReadWriteField('operational_tag', STRING_FIELD),
	gasLiftInjectionPressure: dailyReadWriteField('gas_lift_injection_pressure', NUMBER_FIELD),
	bottomHolePressure: dailyReadWriteField('bottom_hole_pressure', NUMBER_FIELD),
	tubingHeadPressure: dailyReadWriteField('tubing_head_pressure', NUMBER_FIELD),
	flowlinePressure: dailyReadWriteField('flowline_pressure', NUMBER_FIELD),
	casingHeadPressure: dailyReadWriteField('casing_head_pressure', NUMBER_FIELD),
	vesselSeparatorPressure: dailyReadWriteField('vessel_separator_pressure', NUMBER_FIELD),
	gasInjection: dailyReadWriteField('gasInjection', NUMBER_FIELD),
	waterInjection: dailyReadWriteField('waterInjection', NUMBER_FIELD),
	co2Injection: dailyReadWriteField('co2Injection', NUMBER_FIELD),
	steamInjection: dailyReadWriteField('steamInjection', NUMBER_FIELD),
	ngl: dailyReadWriteField('ngl', NUMBER_FIELD),
	customNumber0: dailyReadWriteField('customNumber0', NUMBER_FIELD),
	customNumber1: dailyReadWriteField('customNumber1', NUMBER_FIELD),
	customNumber2: dailyReadWriteField('customNumber2', NUMBER_FIELD),
	customNumber3: dailyReadWriteField('customNumber3', NUMBER_FIELD),
	customNumber4: dailyReadWriteField('customNumber4', NUMBER_FIELD),

	createdAt: dailyReadField('createdAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1, beforeUnwind: true } },
		sortable: true,
	}),
	updatedAt: dailyReadField('updatedAt', DATE_FIELD, {
		filterOption: { read: { filterValues: 1, beforeUnwind: true } },
		sortable: true,
	}),

	chosenID: dailyWellField('chosenID', STRING_FIELD),
	dataSource: dailyWellField('dataSource', getStringEnumField(DATA_SOURCES)),
};

export default API_DAILY_PRODUCTION_FIELDS;

export type ApiDailyProductionKey = keyof typeof API_DAILY_PRODUCTION_FIELDS;
type TypeOfField<FT> = FT extends IDailyProductionField<infer T> ? T : never;
export type ApiDailyProduction = {
	[key in ApiDailyProductionKey]?: TypeOfField<(typeof API_DAILY_PRODUCTION_FIELDS)[key]>;
};

export const toApiDailyProduction = (dailyProduction: ISingleDailyProduction): ApiDailyProduction => {
	const apiProduction: Record<string, ApiDailyProduction[ApiDailyProductionKey]> = {};
	Object.entries(API_DAILY_PRODUCTION_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiProduction[field] = read(dailyProduction);
		}
	});
	return apiProduction;
};

export const toISingleDailyProduction = (apiDailyProduction: ApiDailyProduction): ISingleDailyProduction => {
	const singleProduction = initSingleDailyProduction();
	Object.entries(API_DAILY_PRODUCTION_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (production: ISingleDailyProduction, value: unknown) => void;
			coercedWrite(singleProduction, apiDailyProduction[field as ApiDailyProductionKey]);
		}
	});
	return singleProduction;
};

const isApiDailyProductionField = (field: string): field is keyof typeof API_DAILY_PRODUCTION_FIELDS =>
	Object.keys(API_DAILY_PRODUCTION_FIELDS).includes(field);

export const getApiDailyProductionField = (
	field: string,
): (typeof API_DAILY_PRODUCTION_FIELDS)[ApiDailyProductionKey] | null => {
	if (!isApiDailyProductionField(field)) {
		return null;
	}
	return API_DAILY_PRODUCTION_FIELDS[field];
};

export const getSort = (sort: ISort): IApiSort | null => {
	const sortField = Object.keys(sort)[0];
	const getSort = getApiDailyProductionField(sortField)?.getDbSort;
	if (!getSort) {
		return null;
	}
	return getSort(sort);
};

export const getDefaultSort = (): IApiSort => ({ sortQuery: { well: 1, startIndex: 1 }, allowCursor: true });

export const sortableFields = Object.entries(API_DAILY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbSort)
	.map(([key]) => key);

export const getReadFilters = (
	filters: ApiQueryFilters,
	project: Types.ObjectId | undefined | null,
	matchMoment: MatchMoment,
	cursor?: IFilter,
): IFilter => {
	const res = Object.entries(filters).reduce<IFilter>((cumFilters, [field, filter]) => {
		const apiField = getApiDailyProductionField(field);
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
		const getFilter = getApiDailyProductionField(field)?.getDbDeleteFilter;
		if (!getFilter) {
			return cumFilters;
		}
		const mappedFilter = getFilter({ [field]: filter });

		return { ...cumFilters, ...mappedFilter };
	}, {});

	return { ...res, project };
};

export const filterableReadDbFields = Object.entries(API_DAILY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbReadFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.read as IFilterOption;
		return acc;
	}, {});

export const filterableDeleteDbFields = Object.entries(API_DAILY_PRODUCTION_FIELDS)
	.filter(([, field]) => !!field.getDbDeleteFilter)
	.reduce<IFilterOptionRecord>((acc, [key, { options }]) => {
		acc[key] = options?.filterOption?.delete as IFilterOption;
		return acc;
	}, {});

export const getRequiredFields = (prod: ApiDailyProduction): ApiDailyProductionKey[] => {
	const baseRequired = Object.entries(API_DAILY_PRODUCTION_FIELDS)
		.filter(([, field]) => field?.options?.isRequired)
		.map(([key]) => key as ApiDailyProductionKey);
	if (prod.well) {
		return [...baseRequired, 'well'];
	}
	return [...baseRequired, 'chosenID', 'dataSource'];
};

export const productionDataFields = Object.entries(API_DAILY_PRODUCTION_FIELDS)
	.filter(([, field]) => field?.options?.isProductionData)
	.map(([key]) => key);

export const getCursorFilter = (sort: ISort, cursor: IProductionCursor | null): IFilter | undefined => {
	if (!cursor) {
		return undefined;
	}

	const sortVal = Object.values(sort)[0];

	return { _id: sortVal === 1 ? { $gte: cursor.id } : { $lte: cursor.id } };
};
