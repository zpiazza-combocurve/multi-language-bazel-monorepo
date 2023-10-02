import { get, merge, set } from 'lodash';
import { Types } from 'mongoose';

import { ESCALATION_KEY, ESCALATION_NAME, IEscalation, IEscalationEconFunction } from '@src/models/econ/escalations';
import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';
import { IApiRowField } from '../../row-fields/econ-function-row-fields';
import { parseEscalationEconFunction } from '../validation';

import {
	API_ESCALATION_ECON_FUNCTION,
	ApiEscalationEconFunction,
	toApiEscalationEconFunction,
	toEscalationEconFunction,
} from './escalation-econ-function';

export const WRITE_RECORD_LIMIT = 500;
export const READ_RECORD_LIMIT = 200;

export type IEscalationField<T> = IField<IEscalation, T>;

const escalationField: IEscalationField<ApiEscalationEconFunction> = {
	type: OpenApiDataType.object,
	properties: API_ESCALATION_ECON_FUNCTION,
	parse: parseEscalationEconFunction,
	read: (escalation) =>
		toApiEscalationEconFunction(
			get(escalation, ['econ_function', 'escalation_model']) as IEscalationEconFunction & Partial<IApiRowField>,
		),
	write: (escalation, value) =>
		set(escalation, ['econ_function', 'escalation_model'], toEscalationEconFunction(value)),
};

const API_ESCALATION_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	escalation: escalationField,
};

export const toApiEscalation = (escalation: IEscalation): ApiEscalation => {
	const apiEscalation: Record<string, ApiEscalation[ApiEscalationKey]> = {};
	Object.entries(API_ESCALATION_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEscalation[field] = read(escalation);
		}
	});
	return apiEscalation;
};

export const toEscalation = (apiEscalation: ApiEscalation, projectId: Types.ObjectId): IEscalation => {
	const escalation = {};
	Object.entries(API_ESCALATION_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (escalation: Partial<IEscalation>, value: unknown) => void;
			coercedWrite(escalation, apiEscalation[field as ApiEscalationKey]);
		}
	});
	return {
		...escalation,
		assumptionKey: ESCALATION_KEY,
		assumptionName: ESCALATION_NAME,
		project: projectId,
	} as IEscalation;
};

export type ApiEscalationKey = keyof typeof API_ESCALATION_FIELDS;

type TypeOfField<FT> = FT extends IEscalationField<infer T> ? T : never;

export type ApiEscalation = {
	[key in ApiEscalationKey]?: TypeOfField<(typeof API_ESCALATION_FIELDS)[key]>;
};

const isApiEscalationField = (field: string): field is keyof typeof API_ESCALATION_FIELDS =>
	Object.keys(API_ESCALATION_FIELDS).includes(field);

export const getApiEscalationField = (field: string): (typeof API_ESCALATION_FIELDS)[ApiEscalationKey] | null => {
	if (!isApiEscalationField(field)) {
		return null;
	}
	return API_ESCALATION_FIELDS[field];
};

export const getRequiredFields = (escalation: ApiEscalation): ApiEscalationKey[] => {
	const baseRequired = Object.entries(API_ESCALATION_FIELDS)
		.filter(([, field]) => !!field?.options?.isRequired)
		.map(([key]) => key as ApiEscalationKey);
	if (escalation.unique) {
		return [...baseRequired, 'well', 'scenario'];
	}
	return baseRequired;
};

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_ESCALATION_FIELDS, {
		value: merge({ project: project._id, assumptionKey: ESCALATION_KEY }, cursor || {}),
	});

export const filterableFields = filterableReadDbFields(API_ESCALATION_FIELDS);

export const sortableFields = sortableDbFields(API_ESCALATION_FIELDS);

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_ESCALATION_FIELDS, undefined, cursor);

export default API_ESCALATION_FIELDS;
