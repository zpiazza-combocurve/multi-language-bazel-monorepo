import { merge } from 'lodash';
import { Types } from 'mongoose';

import { ApiQueryFilters, OpenApiDataType } from '@src/helpers/fields/field-definition';
import { DATE_FIELD, getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { ECON_RUN_STATUS, IEconRun, IEconRunOutputParams } from '@src/models/econ/econ-runs';
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
import { IApiTag, tagsFieldDefinition, toApiTag } from '@src/api/v1/tags/fields/tags';
import { IFilter, ISort } from '@src/helpers/mongo-queries';

export const READ_RECORD_LIMIT = 200;

type IEconRunField<T> = IField<IEconRun, T>;

const readEconRunDataField = <K extends keyof IEconRun, TParsed = IEconRun[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => ({ key, ...readDbField<IEconRun, K, TParsed>(key, definition, options) });

const readEconRunTagsField = () => ({
	key: 'tags',
	...readDbField<IEconRun, 'tags', Array<IApiTag> | undefined>('tags', tagsFieldDefinition(), {
		filterOption: { read: { filterValues: 1 } },
	}),
	read: (econRun: IEconRun) => econRun['tags']?.map(toApiTag) ?? [],
	write: undefined,
});

export const BASE_API_ECON_RUN_FIELDS = {
	id: readEconRunDataField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	runDate: readEconRunDataField('runDate', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	status: readEconRunDataField('status', getStringEnumField(ECON_RUN_STATUS)),
	tags: readEconRunTagsField(),
	outputParams: {
		key: 'outputParams',
		...readDbField<IEconRun, 'outputParams', IEconRunOutputParams>('outputParams', {
			type: OpenApiDataType.object,
			properties: { prodAnalyticsType: STRING_FIELD },
		}),
		read: (econRun: IEconRun): IEconRunOutputParams => {
			return {
				prodAnalyticsType: econRun['outputParams']?.prodAnalyticsType,
			};
		},
		write: undefined,
	},
};

const API_ECON_RUN_FIELDS = {
	...BASE_API_ECON_RUN_FIELDS,
	project: readEconRunDataField('project', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
	scenario: readEconRunDataField('scenario', OBJECT_ID_FIELD, {
		filterOption: { read: { filterValues: 1 } },
	}),
};

export default API_ECON_RUN_FIELDS;

export type ApiEconRunKey = keyof typeof API_ECON_RUN_FIELDS;

type TypeOfField<FT> = FT extends IEconRunField<infer T> ? T : never;

export type ApiEconRun = { [key in ApiEconRunKey]?: TypeOfField<(typeof API_ECON_RUN_FIELDS)[key]> };

export const toApiEconRun = (econRun: IEconRun): ApiEconRun => {
	const apiEconRun: Record<string, ApiEconRun[ApiEconRunKey]> = {};
	Object.entries(API_ECON_RUN_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEconRun[field] = read(econRun);
		}
	});
	return apiEconRun;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_ECON_RUN_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_ECON_RUN_FIELDS);

export const getFilters = (
	filters: ApiQueryFilters,
	projectId: Types.ObjectId | null = null,
	scenarioId: Types.ObjectId | null = null,
	cursor?: IFilter,
): IFilter => {
	const additionalFilters = merge(
		{ ...(projectId && { project: projectId }) },
		{ ...(scenarioId && { scenario: scenarioId }) },
		cursor || {},
	);
	return getApiReadDbFilters(filters, API_ECON_RUN_FIELDS, { value: additionalFilters });
};

export const filterableFields = filterableReadDbFields(API_ECON_RUN_FIELDS);

export const projection = Object.values(API_ECON_RUN_FIELDS).map(({ key }) => key);
