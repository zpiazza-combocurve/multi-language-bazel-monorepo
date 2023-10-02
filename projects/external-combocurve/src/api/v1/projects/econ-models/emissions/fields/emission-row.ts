import { get, set } from 'lodash';

import { BOOLEAN_FIELD, getStringEnumField, NUMBER_FIELD, STRING_FIELD } from '@src/helpers/fields';
import { EMISSION_CATEGORY, EMISSION_UNIT, IEmissionRow } from '@src/models/econ/emissions';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { IFieldDefinition } from '@src/helpers/fields/field-definition';
import { isNil } from '@src/helpers/typing';

export type IEmissionRowField<T> = IField<IEmissionRow, T>;

export type ApiEmissionRowKey = keyof typeof EMISSION_ROW_FIELDS;
type TypeOfEmissionRowField<FT> = FT extends IEmissionRowField<infer T> ? T : never;

export type ApiEmissionRow = {
	[key in ApiEmissionRowKey]?: TypeOfEmissionRowField<(typeof EMISSION_ROW_FIELDS)[key]>;
};

const emissionRowReadWriteDbField = <K extends keyof IEmissionRow, TParsed = IEmissionRow[K]>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IEmissionRow, K, TParsed>(key, definition, options);

export const EMISSION_ROW_FIELDS = {
	selected: emissionRowReadWriteDbField('selected', BOOLEAN_FIELD),
	category: emissionRowReadWriteDbField('category', getStringEnumField(EMISSION_CATEGORY)),
	co2e: emissionRowReadWriteDbField('co2e', NUMBER_FIELD),
	co2: emissionRowReadWriteDbField('co2', NUMBER_FIELD),
	ch4: emissionRowReadWriteDbField('ch4', NUMBER_FIELD),
	n2o: emissionRowReadWriteDbField('n2o', NUMBER_FIELD),
	unit: emissionRowReadWriteDbField('unit', getStringEnumField(EMISSION_UNIT)),
	escalationModel: emissionRowReadWriteDbField('escalation_model', STRING_FIELD),
};

export const toEmissionRow = (apiEmissionRow: ApiEmissionRow): IEmissionRow | Record<string, unknown> => {
	const emissionRowResult = {};

	if (isNil(apiEmissionRow)) {
		return emissionRowResult;
	}

	Object.entries(EMISSION_ROW_FIELDS).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (emission: IEmissionRow, value: unknown) => void;
			coercedWrite(emissionRowResult as IEmissionRow, apiEmissionRow[field as ApiEmissionRowKey]);
		}
	});

	if (!get(emissionRowResult, 'selected')) {
		set(emissionRowResult, 'selected', false);
	}

	if (!get(emissionRowResult, 'escalation_model')) {
		set(emissionRowResult, 'escalation_model', 'none');
	}

	return emissionRowResult;
};

export const toApiEmissionRow = (emissionType: IEmissionRow): ApiEmissionRow => {
	const apiEmissionType: Record<string, ApiEmissionRow[ApiEmissionRowKey]> = {};
	Object.entries(EMISSION_ROW_FIELDS).forEach(([field, { read }]) => {
		if (read) {
			apiEmissionType[field] = read(emissionType) as ApiEmissionRow[ApiEmissionRowKey];
		}
	});
	return apiEmissionType;
};

export const getApiEmissionTypeField = (field: string): (typeof EMISSION_ROW_FIELDS)[ApiEmissionRowKey] | null =>
	getApiField(field, EMISSION_ROW_FIELDS);
