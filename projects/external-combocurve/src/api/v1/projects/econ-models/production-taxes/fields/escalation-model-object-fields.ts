import { set } from 'lodash';

import { EscalationModelObject, IEscalationModelRow } from '@src/models/econ/production-taxes';
import { FieldNameError, isObject, RequestStructureError } from '@src/helpers/validation';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { notNil } from '@src/helpers/typing';
import { OpenApiDataType } from '@src/helpers/fields/data-type';
import { STRING_FIELD } from '@src/helpers/fields';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../../validation';

export type ApiEscalationModelObjectKeys = keyof typeof ESCALATION_MODEL_OBJECT;
export type IEscalationModelObjectField<T> = IField<EscalationModelObject, T>;

type TypeOfField<FT> = FT extends IEscalationModelObjectField<infer T> ? T : never;

export type ApiEscalationModelObject = {
	[key in ApiEscalationModelObjectKeys]?: TypeOfField<(typeof ESCALATION_MODEL_OBJECT)[key]>;
};

const escalationModelReadWriteDbField = <K extends keyof EscalationModelObject>(
	key: K,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<EscalationModelObject, K, string>(key, STRING_FIELD, options);

export const ESCALATION_MODEL_OBJECT = {
	escalationModel1: escalationModelReadWriteDbField('escalation_model_1'),
	escalationModel2: escalationModelReadWriteDbField('escalation_model_2'),
};

export const escalationModelObjectReadWriteDbField = (): IField<IEscalationModelRow, ApiEscalationModelObject> => ({
	type: OpenApiDataType.object,
	properties: ESCALATION_MODEL_OBJECT,
	parse: (data: unknown, location?: string) => parseEscalationModelObject(data, location),
	read: (adValoremTaxEconFunction) => read(adValoremTaxEconFunction['escalation_model']),
	write: (adValoremTaxEconFunction, escalationModelValue) => {
		set(adValoremTaxEconFunction, ['escalation_model'], write(escalationModelValue));
	},
});

const read = (escalationModel: EscalationModelObject): ApiEscalationModelObject => {
	const apiEscalationModelObject: Record<string, ApiEscalationModelObject[ApiEscalationModelObjectKeys]> = {};
	Object.entries(ESCALATION_MODEL_OBJECT).forEach(([field, { read }]) => {
		if (read && escalationModel) {
			apiEscalationModelObject[field] = read(escalationModel);
		}
	});
	return apiEscalationModelObject as ApiEscalationModelObject;
};

const write = (apiEscalationModelObject: ApiEscalationModelObject): EscalationModelObject => {
	const escalationModelObject = {};
	Object.entries(ESCALATION_MODEL_OBJECT).forEach(([field, { write }]) => {
		if (write) {
			const value = apiEscalationModelObject[field as ApiEscalationModelObjectKeys];
			if (value) {
				write(escalationModelObject, value);
			}
		}
	});
	return escalationModelObject as EscalationModelObject;
};

export const getEscalationModelObjectField = (
	field: string,
): (typeof ESCALATION_MODEL_OBJECT)[ApiEscalationModelObjectKeys] | null => getApiField(field, ESCALATION_MODEL_OBJECT);

export const parseEscalationModelObject = (data: unknown, location?: string): ApiEscalationModelObject => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ProductionTaxes data structure`, location);
	}

	const escalationModelObject: Record<string, ApiEscalationModelObject[ApiEscalationModelObjectKeys]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const pricingEconFunctionField = getEscalationModelObjectField(field);

				if (!pricingEconFunctionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}
				const { write, parse } = pricingEconFunctionField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiEscalationModelObject[ApiEscalationModelObjectKeys]);

				if (write) {
					escalationModelObject[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return escalationModelObject;
};
