import { set } from 'lodash';

import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IPhaseFields, IPhaseGroup } from '@src/models/econ/differentials';
import { IFieldDefinition } from '@src/helpers/fields/field-definition';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { STRING_FIELD } from '@src/helpers/fields';

import { parsePhaseFields } from '../validation';
import { rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

import { PhaseGroupField } from './phase-group-fields';

export type IPhaseFieldType<T> = IField<IPhaseFields, T>;

type TypeOfField<FT> = FT extends IPhaseFieldType<infer T> ? T : never;

export type ApiPhaseFieldsKey = keyof typeof PHASE_FIELDS;

export type ApiPhaseFields = {
	[key in ApiPhaseFieldsKey]?: TypeOfField<(typeof PHASE_FIELDS)[key]>;
};

const phaseFieldReadWriteDbField = <K extends keyof IPhaseFields, TParsed = IPhaseFields[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IPhaseFields, K, TParsed>(key, definition, options);

const PHASE_FIELDS = {
	escalationModel: phaseFieldReadWriteDbField('escalation_model', STRING_FIELD),
	rows: rowsReadWriteDbField(),
};

export const getPhaseGroupFields = <K extends keyof IPhaseGroup>(key: K): PhaseGroupField<ApiPhaseFields> => ({
	type: OpenApiDataType.object,
	properties: PHASE_FIELDS,
	parse: (data: unknown, location?: string) => parsePhaseFields(data, location),
	read: (phaseGroup) => toApiPhaseField(phaseGroup[key]),
	write: (phaseGroup, value) => set(phaseGroup, [key], toPhaseFields(value)),
});

const toPhaseFields = (apiPhaseField: ApiPhaseFields): IPhaseFields | Record<string, unknown> => {
	const phaseFieldResult = {} as IPhaseFields;

	Object.entries(PHASE_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (differentials: IPhaseFields, value: unknown) => void;
			coercedWrite(phaseFieldResult as IPhaseFields, apiPhaseField[field as ApiPhaseFieldsKey]);
		}
	});
	return phaseFieldResult;
};

const toApiPhaseField = (differentialsType: IPhaseFields): ApiPhaseFields => {
	const apiPhaseField: Record<string, ApiPhaseFields[ApiPhaseFieldsKey]> = {};
	Object.entries(PHASE_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiPhaseField[field] = read(differentialsType) as ApiPhaseFields[ApiPhaseFieldsKey];
		}
	});
	return apiPhaseField;
};

export const getApiPhaseField = (field: string): (typeof PHASE_FIELDS)[ApiPhaseFieldsKey] | null =>
	getApiField(field, PHASE_FIELDS);
