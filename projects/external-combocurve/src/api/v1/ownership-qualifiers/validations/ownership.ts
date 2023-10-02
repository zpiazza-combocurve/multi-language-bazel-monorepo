import { FieldNameError, isObject, RequestStructureError, RequiredFieldError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';

import { ApiOwnership, ApiOwnershipKey, getApiOwnershipField, getRequiredFields } from '../fields/ownership';
import { ValidationErrorAggregator } from '../../multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from './ownership-qualifier';

export const parseApiOwnership = (data: unknown, location?: string): ApiOwnership => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid ownership data structure`, location);
	}

	const ownership: Record<string, ApiOwnership[ApiOwnershipKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const ownershipField = getApiOwnershipField(field);

				if (!ownershipField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = ownershipField;

				const parsedValue = parse ? parse(value, fieldPath) : (value as ApiOwnership[ApiOwnershipKey]);

				if (write) {
					ownership[field] = parsedValue;
				}
			}),
		);

	const requiredFields = getRequiredFields(ownership);
	requiredFields
		.filter((field) => isNil(data[field]))
		.forEach((field) =>
			errorAggregator.catch(() => {
				throw new RequiredFieldError(`Missing required field: \`${field}\``, location);
			}),
		);

	errorAggregator.throwAll();

	return ownership;
};
