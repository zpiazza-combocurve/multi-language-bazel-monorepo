import { merge } from 'lodash';
import { Types } from 'mongoose';

import {
	filterableReadDbFields,
	getApiDbSort,
	getApiReadDbFilters,
	IApiSort,
	IField,
	sortableDbFields,
} from '@src/api/v1/fields';
import { GENERAL_OPTIONS_KEY, GENERAL_OPTIONS_NAME, IGeneralOptions } from '@src/models/econ/general-options';
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { readRequestFromDocument, writeDocumentWithRequest } from '@src/helpers/fields/parses';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';

import { API_ECON_MODEL_FIELDS } from '../../fields';
import { BaseProjectResolved } from '../../../fields';

import { boeConversionField } from './boe-convertion';
import { discontTableField } from './discont-table';
import { incomeTaxField } from './income-tax';
import { mainOptionsField } from './main-options';
import { reportingUnitsField } from './reporting-units';

export const GENERAL_OPTIONS_FIELDS = {
	...API_ECON_MODEL_FIELDS,
	mainOptions: mainOptionsField,
	incomeTax: incomeTaxField,
	discountTable: discontTableField,
	boeConversion: boeConversionField,
	reportingUnits: reportingUnitsField,
};

// DB Mapping
export type IGeneralOptionsField<T> = IField<IGeneralOptions, T>;
type TypeOfGeneralOptionsField<FT> = FT extends IGeneralOptionsField<infer T> ? T : never;

// Api Mapping
export type ApiGeneralOptionsFieldsKeys = keyof typeof GENERAL_OPTIONS_FIELDS;
export type ApiGeneralOptionsType = {
	[key in ApiGeneralOptionsFieldsKeys]?: TypeOfGeneralOptionsField<(typeof GENERAL_OPTIONS_FIELDS)[key]>;
};

export const filterableFields = filterableReadDbFields(GENERAL_OPTIONS_FIELDS);
export const sortableFields = sortableDbFields(GENERAL_OPTIONS_FIELDS);

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, GENERAL_OPTIONS_FIELDS, {
		value: merge({ project: project._id, assumptionKey: GENERAL_OPTIONS_KEY }, cursor || {}),
	});

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, GENERAL_OPTIONS_FIELDS, undefined, cursor);

const isField = (field: string): field is keyof typeof GENERAL_OPTIONS_FIELDS =>
	Object.keys(GENERAL_OPTIONS_FIELDS).includes(field);

export const getGeneralOptionsField = (
	field: string,
): (typeof GENERAL_OPTIONS_FIELDS)[ApiGeneralOptionsFieldsKeys] | null => {
	if (!isField(field)) {
		return null;
	}
	return GENERAL_OPTIONS_FIELDS[field];
};

export const getRequestFromDocument = (mongoModel: IGeneralOptions): ApiGeneralOptionsType => {
	const apiModel = readRequestFromDocument<IGeneralOptions, ApiGeneralOptionsType, ApiGeneralOptionsFieldsKeys>(
		mongoModel,
		GENERAL_OPTIONS_FIELDS,
	);

	return formatResponse(apiModel);
};

function formatResponse(response: ApiGeneralOptionsType): ApiGeneralOptionsType {
	if (response.mainOptions?.incomeTax == 'no') {
		delete response.incomeTax;
	}

	return response;
}

export const getDocumentFromRequest = (apiModel: ApiGeneralOptionsType, projectId: Types.ObjectId): IGeneralOptions => {
	const mongoModel = writeDocumentWithRequest<IGeneralOptions, ApiGeneralOptionsType, ApiGeneralOptionsFieldsKeys>(
		apiModel,
		GENERAL_OPTIONS_FIELDS,
	);

	return {
		...mongoModel,
		assumptionKey: GENERAL_OPTIONS_KEY,
		assumptionName: GENERAL_OPTIONS_NAME,
		project: projectId,
	} as IGeneralOptions;
};

export default GENERAL_OPTIONS_FIELDS;
