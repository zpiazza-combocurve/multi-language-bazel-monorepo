import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { IStreamProperties, STREAM_PROPERTIES_KEY, STREAM_PROPERTIES_NAME } from '@src/models/econ/stream-properties';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import {
	parseBtuContentEconFunction,
	parseLossFlareEconFunction,
	parseShrinkageEconFunction,
	parseYieldsEconFunction,
} from '../validation';
import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import {
	API_BTU_CONTENT_ECON_FUNCTION,
	ApiBtuContentEconFunction,
	toApiBtuContentEconFunction,
	toBtuContentEconFunction,
} from './btu-content-econ-function';
import {
	API_LOSS_FLARE_ECON_FUNCTION,
	ApiLossFlareEconFunction,
	toApiLossFlareEconFunction,
	toLossFlareEconFunction,
} from './loss-flare-econ-function';
import {
	API_SHRINKAGE_ECON_FUNCTION,
	ApiShrinkageEconFunction,
	toApiShrinkageEconFunction,
	toShrinkageEconFunction,
} from './shrinkage-econ-function';
import {
	API_YIELDS_ECON_FUNCTION,
	ApiYieldsEconFunction,
	toApiYieldsEconFunction,
	toYieldsEconFunction,
} from './yields-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type StreamPropertiesField<T> = IField<IStreamProperties, T>;

const yieldsField: StreamPropertiesField<ApiYieldsEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_YIELDS_ECON_FUNCTION,
	parse: parseYieldsEconFunction,
	read: (yields) => toApiYieldsEconFunction(get(yields, ['econ_function', 'yields'])),
	write: (yields, value) => set(yields, ['econ_function', 'yields'], toYieldsEconFunction(value)),
};

const shrinkageField: StreamPropertiesField<ApiShrinkageEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_SHRINKAGE_ECON_FUNCTION,
	parse: parseShrinkageEconFunction,
	read: (shrinkage) => toApiShrinkageEconFunction(get(shrinkage, ['econ_function', 'shrinkage'])),
	write: (shrinkage, value) => set(shrinkage, ['econ_function', 'shrinkage'], toShrinkageEconFunction(value)),
};

const lossFlareField: StreamPropertiesField<ApiLossFlareEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_LOSS_FLARE_ECON_FUNCTION,
	parse: parseLossFlareEconFunction,
	read: (lossFlare) => toApiLossFlareEconFunction(get(lossFlare, ['econ_function', 'loss_flare'])),
	write: (lossFlare, value) => set(lossFlare, ['econ_function', 'loss_flare'], toLossFlareEconFunction(value)),
};

const btuContentField: StreamPropertiesField<ApiBtuContentEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_BTU_CONTENT_ECON_FUNCTION,
	parse: parseBtuContentEconFunction,
	read: (btuContent) => toApiBtuContentEconFunction(get(btuContent, ['econ_function', 'btu_content'])),
	write: (btuContent, value) => set(btuContent, ['econ_function', 'btu_content'], toBtuContentEconFunction(value)),
};

const API_STREAM_PROPERTIES_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	yields: yieldsField,
	shrinkage: shrinkageField,
	lossFlare: lossFlareField,
	btuContent: btuContentField,
};

export const toApiStreamProperties = (StreamProperties: IStreamProperties): ApiStreamProperties => {
	const apiStreamProperties: Record<string, ApiStreamProperties[ApiStreamPropertiesKey]> = {};
	Object.entries(API_STREAM_PROPERTIES_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiStreamProperties[field] = read(StreamProperties);
		}
	});
	return apiStreamProperties;
};

export const toStreamProperties = (
	apiStreamProperties: ApiStreamProperties,
	projectId: Types.ObjectId,
): IStreamProperties => {
	const streamProperties = {};
	Object.entries(API_STREAM_PROPERTIES_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (streamProperties: Partial<IStreamProperties>, value: unknown) => void;
			coercedWrite(streamProperties, apiStreamProperties[field as ApiStreamPropertiesKey]);
		}
	});
	return {
		...streamProperties,
		assumptionKey: STREAM_PROPERTIES_KEY,
		assumptionName: STREAM_PROPERTIES_NAME,
		project: projectId,
	} as IStreamProperties;
};

export type ApiStreamPropertiesKey = keyof typeof API_STREAM_PROPERTIES_FIELDS;

type TypeOfField<FT> = FT extends StreamPropertiesField<infer T> ? T : never;

export type ApiStreamProperties = {
	[key in ApiStreamPropertiesKey]?: TypeOfField<(typeof API_STREAM_PROPERTIES_FIELDS)[key]>;
};

const isApiStreamPropertiesField = (field: string): field is keyof typeof API_STREAM_PROPERTIES_FIELDS =>
	Object.keys(API_STREAM_PROPERTIES_FIELDS).includes(field);

export const getApiStreamPropertiesField = (
	field: string,
): (typeof API_STREAM_PROPERTIES_FIELDS)[ApiStreamPropertiesKey] | null => {
	if (!isApiStreamPropertiesField(field)) {
		return null;
	}
	return API_STREAM_PROPERTIES_FIELDS[field];
};

export const getRequiredFields = (streamProperties: ApiStreamProperties): ApiStreamPropertiesKey[] => {
	const baseRequired = Object.entries(API_STREAM_PROPERTIES_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiStreamPropertiesKey);
	if (streamProperties.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_STREAM_PROPERTIES_FIELDS, {
		value: merge({ project: project._id, assumptionKey: STREAM_PROPERTIES_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_STREAM_PROPERTIES_FIELDS);

export const sortableFields = sortableDbFields(API_STREAM_PROPERTIES_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_STREAM_PROPERTIES_FIELDS, undefined, cursor);

export default API_STREAM_PROPERTIES_FIELDS;
