import { Types } from 'mongoose';

import { COMPANY_SCOPE_FILTER, IFilter } from '@src/helpers/mongo-queries';
import { DATA_SOURCES, IWell } from '@src/models/wells';
import {
	filterableDeleteDbFields,
	getApiDeleteDbFilters,
	getApiField,
	IField,
	IReadWriteFieldOptions,
	readWriteDbField,
} from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition, OBJECT_ID_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { ApiQueryFilters } from '@src/helpers/fields/field-definition';
import { IProject } from '@src/models/projects';

export { READ_RECORD_LIMIT, WRITE_RECORD_LIMIT } from '../../wells/fields';

export const projectResolvedProjection = {
	_id: 1 as const,
	wells: 1 as const,
	name: 1 as const,
};

export type ProjectResolved = Pick<IProject, keyof typeof projectResolvedProjection>;

export type IProjectCompanyWell = Pick<IWell, '_id' | 'dataSource' | 'chosenID'>;

export type IProjectCompanyWellKey = keyof IProjectCompanyWell;

type IProjectCompanyWellField<T> = IField<IProjectCompanyWell, T>;

const readEmptyWriteField = <K extends keyof IProjectCompanyWell>(
	key: K,
	definition: IFieldDefinition<IWell[K]>,
	options: IReadWriteFieldOptions = {},
): IProjectCompanyWellField<IProjectCompanyWell[K]> => {
	return {
		...readWriteDbField(key, definition, options),
		write: () => {
			// do nothing
		},
	};
};

const API_PROJECT_COMPANY_WELL_FIELDS = {
	id: readEmptyWriteField('_id', OBJECT_ID_FIELD, {
		filterOption: {
			delete: { filterValues: 100 },
		},
	}),

	dataSource: readEmptyWriteField('dataSource', getStringEnumField(DATA_SOURCES), {
		isRequired: true,
		filterOption: { delete: { filterValues: 1 } },
	}),
	chosenID: readEmptyWriteField('chosenID', STRING_FIELD, {
		filterOption: {
			delete: { filterValues: 100 },
		},
	}),
};

export default API_PROJECT_COMPANY_WELL_FIELDS;

export type ApiProjectCompanyWellKey = keyof typeof API_PROJECT_COMPANY_WELL_FIELDS;

type TypeOfField<FT> = FT extends IProjectCompanyWellField<infer T> ? T : never;

export type ApiProjectCompanyWell = {
	[key in ApiProjectCompanyWellKey]?: TypeOfField<(typeof API_PROJECT_COMPANY_WELL_FIELDS)[key]>;
};

export type ApiWellWithId = ApiProjectCompanyWell & { id: Types.ObjectId };

export const getRequiredFields = (well: ApiProjectCompanyWell): ApiProjectCompanyWellKey[] => {
	const baseRequired = Object.entries(API_PROJECT_COMPANY_WELL_FIELDS)
		.filter(([, field]) => field?.options?.isRequired)
		.map(([key]) => key as ApiProjectCompanyWellKey);
	if (well.id) {
		return [...baseRequired, 'id'];
	}
	return [...baseRequired, 'chosenID'];
};

export const getProjectCompanyWellField = (
	fieldName: string,
): (typeof API_PROJECT_COMPANY_WELL_FIELDS)[ApiProjectCompanyWellKey] | null =>
	getApiField(fieldName, API_PROJECT_COMPANY_WELL_FIELDS);

export const filterableDeleteFields = filterableDeleteDbFields(API_PROJECT_COMPANY_WELL_FIELDS);

export const getDeleteFilters = (filters: ApiQueryFilters): IFilter =>
	getApiDeleteDbFilters(filters, API_PROJECT_COMPANY_WELL_FIELDS, { value: { ...COMPANY_SCOPE_FILTER } });
