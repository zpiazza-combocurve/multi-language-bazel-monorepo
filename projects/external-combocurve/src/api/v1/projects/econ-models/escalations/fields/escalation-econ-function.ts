import { isNil } from 'lodash';

import {
	ESCALATION_CALCULATION_METHOD,
	ESCALATION_FREQUENCY,
	IEscalationEconFunction,
} from '@src/models/econ/escalations';
import { getApiField, IField, IReadWriteFieldOptions, readWriteDbField } from '@src/api/v1/fields';
import { getStringEnumField, IFieldDefinition } from '@src/helpers/fields';

import { ApiEconFunctionRow, IApiRowField, rowsReadWriteDbField } from '../../row-fields/econ-function-row-fields';

export type IEscalationEconFunctionField<T> = IField<IEscalationEconFunction, T>;

const escalationEconFunctionReadWriteDbField = <
	K extends keyof IEscalationEconFunction,
	TParsed = IEscalationEconFunction[K],
>(
	key: K,
	definition: IFieldDefinition<TParsed>,
	options: IReadWriteFieldOptions = {},
) => readWriteDbField<IEscalationEconFunction, K, TParsed>(key, definition, options);

// TODO: update rows field to use getRow function
export const API_ESCALATION_ECON_FUNCTION = {
	rows: rowsReadWriteDbField(),
	escalationFrequency: escalationEconFunctionReadWriteDbField(
		'escalation_frequency',
		getStringEnumField(ESCALATION_FREQUENCY),
	),
	calculationMethod: escalationEconFunctionReadWriteDbField(
		'calculation_method',
		getStringEnumField(ESCALATION_CALCULATION_METHOD),
	),
};

export type ApiEscalationEconFunctionKey = keyof typeof API_ESCALATION_ECON_FUNCTION;

type TypeOfField<FT> = FT extends IEscalationEconFunctionField<infer T> ? T : never;

export type ApiEscalationEconFunction = {
	[key in ApiEscalationEconFunctionKey]?: TypeOfField<(typeof API_ESCALATION_ECON_FUNCTION)[key]>;
};

export const getApiEscalationEconFunctionField = (
	field: string,
): (typeof API_ESCALATION_ECON_FUNCTION)[ApiEscalationEconFunctionKey] | null =>
	getApiField(field, API_ESCALATION_ECON_FUNCTION);

export const getRequiredFields: ApiEscalationEconFunctionKey[] = Object.entries(API_ESCALATION_ECON_FUNCTION)
	.filter(([, field]) => !!field?.options?.isRequired)
	.map(([key]) => key as ApiEscalationEconFunctionKey);

export const toEscalationEconFunction = (
	apiEscalationEconFunction: ApiEscalationEconFunction,
): IEscalationEconFunction | Record<string, unknown> => {
	const escalationEconFunctionResult = {};

	if (isNil(apiEscalationEconFunction)) {
		return {};
	}

	Object.entries(API_ESCALATION_ECON_FUNCTION).forEach(([field, { write }]) => {
		if (write) {
			const coercedWrite = write as (escalation: IEscalationEconFunction, value: unknown) => void;
			coercedWrite(
				escalationEconFunctionResult as IEscalationEconFunction,
				apiEscalationEconFunction[field as ApiEscalationEconFunctionKey],
			);
		}
	});
	return escalationEconFunctionResult;
};

export const toApiEscalationEconFunction = (
	escalation: IEscalationEconFunction & Partial<IApiRowField>,
): ApiEscalationEconFunction => {
	const apiEscalationEconFunction: Record<
		string,
		ApiEscalationEconFunction[ApiEscalationEconFunctionKey] | ApiEconFunctionRow[]
	> = {};
	Object.entries(API_ESCALATION_ECON_FUNCTION).forEach(([field, { read }]) => {
		if (read) {
			apiEscalationEconFunction[field] = read(escalation);
		}
	});
	return apiEscalationEconFunction;
};
