import { merge } from 'lodash';

import { ApiQueryFilters, OpenApiDataType } from '@src/helpers/fields/field-definition';
import { DATE_FIELD, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
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
import { IFilter, ISort } from '@src/helpers/mongo-queries';
import { ITypeCurve2 } from '@src/models/type-curve';

import { BaseProjectResolved } from '../../fields';

import API_TYPE_CURVE_FIT_FIELDS, { ApiTypeCurveFit, toApiTypeCurveFit } from './type-curve-fit';

export const READ_RECORD_LIMIT = 200;

type ITypeCurveField<T> = IField<ITypeCurve2, T>;

const readTypeCurveField = <K extends keyof ITypeCurve2, TParsed = ITypeCurve2[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadFieldOptions = {},
) => readDbField<ITypeCurve2, K, TParsed>(key, definition, options);

interface ApiTypeCurveFitField {
	gas?: ApiTypeCurveFit;
	oil?: ApiTypeCurveFit;
	water?: ApiTypeCurveFit;
}

const fitsField = (): ITypeCurveField<ApiTypeCurveFitField | undefined> => {
	return {
		type: OpenApiDataType.object,
		properties: {
			gas: { type: OpenApiDataType.object, properties: API_TYPE_CURVE_FIT_FIELDS },
			oil: { type: OpenApiDataType.object, properties: API_TYPE_CURVE_FIT_FIELDS },
			water: { type: OpenApiDataType.object, properties: API_TYPE_CURVE_FIT_FIELDS },
		},
		read: (typeCurve) => {
			const gasFit = typeCurve.fits?.gas && toApiTypeCurveFit(typeCurve.fits?.gas);
			const oilFit = typeCurve.fits?.oil && toApiTypeCurveFit(typeCurve.fits?.oil);
			const waterFit = typeCurve.fits?.water && toApiTypeCurveFit(typeCurve.fits?.water);

			return (
				(gasFit || oilFit || waterFit) && {
					gas: gasFit,
					oil: oilFit,
					water: waterFit,
				}
			);
		},
	};
};

const API_TYPE_CURVE_FIELDS = {
	id: readTypeCurveField('_id', OBJECT_ID_FIELD, { sortable: true, allowCursor: true }),
	fits: fitsField(),
	forecast: readTypeCurveField('forecast', OBJECT_ID_FIELD),
	name: readTypeCurveField('name', STRING_FIELD, { sortable: true, filterOption: { read: { filterValues: 1 } } }),
	createdAt: readTypeCurveField('createdAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
	updatedAt: readTypeCurveField('updatedAt', DATE_FIELD, {
		sortable: true,
		filterOption: { read: { filterValues: 1 } },
	}),
};

export default API_TYPE_CURVE_FIELDS;

export type ApiTypeCurveKey = keyof typeof API_TYPE_CURVE_FIELDS;

type TypeOfField<FT> = FT extends ITypeCurveField<infer T> ? T : never;

export type ApiTypeCurve = { [key in ApiTypeCurveKey]?: TypeOfField<(typeof API_TYPE_CURVE_FIELDS)[key]> };

export const toApiTypeCurve = (typeCurve: ITypeCurve2): ApiTypeCurve => {
	const apiTypeCurve: Record<string, ApiTypeCurve[ApiTypeCurveKey]> = {};
	Object.entries(API_TYPE_CURVE_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiTypeCurve[field] = read(typeCurve);
		}
	});
	return apiTypeCurve;
};

export const getSort = (sort: ISort, cursor?: string): IApiSort | null =>
	getApiDbSort(sort, API_TYPE_CURVE_FIELDS, undefined, cursor);

export const sortableFields = sortableDbFields(API_TYPE_CURVE_FIELDS);

export const getFilters = (filters: ApiQueryFilters, project: BaseProjectResolved, cursor?: IFilter): IFilter =>
	getApiReadDbFilters(filters, API_TYPE_CURVE_FIELDS, { value: merge({ project: project._id }, cursor || {}) });

export const filterableFields = filterableReadDbFields(API_TYPE_CURVE_FIELDS);
