import { FieldNameError, isObject, isString, RequestStructureError, RequiredFieldError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';

import { ApiReversion, ApiReversionkey, getReversionField, requiredFields } from '../fields/reversion';
import { API_REVERSION_TYPE_TO_DB } from '../fields/reversion';
import { ValidationErrorAggregator } from '../../multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from './ownership-qualifier';

export const parseReversion = (data: unknown, location?: string): ApiReversion => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid initial ownership data structure`, location);
	}

	const initialOwnership: Record<string, ApiReversion[ApiReversionkey]> = {};

	const errorAggregator = new ValidationErrorAggregator();
	const reversionType = isString(data['reversionType']) ? data['reversionType'] : undefined;

	if (!data.balance) {
		data.balance = 'gross';
	}

	if (!data.includeNetProfitInterest) {
		data.includeNetProfitInterest = 'yes';
	}

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const reversionField = getReversionField(
					field,
					reversionType && API_REVERSION_TYPE_TO_DB[reversionType],
				);

				if (!reversionField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = reversionField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiReversion[ApiReversionkey]);

				if (write) {
					initialOwnership[field] = parsedValue;
				}
			}),
		);

	requiredFields
		.filter((field) => isNil(data[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, location);
			}),
		);

	errorAggregator.throwAll();

	return initialOwnership;
};
