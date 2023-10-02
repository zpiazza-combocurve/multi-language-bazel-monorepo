import { FieldNameError, isObject, RequestStructureError, RequiredFieldError } from '@src/helpers/validation';
import { isNil, notNil } from '@src/helpers/typing';

import {
	ApiInitialOwnership,
	ApiInitialOwnershipkey,
	getApiInitialOwnershipField,
	requiredFields,
} from '../fields/initialOwnership';
import { ValidationErrorAggregator } from '../../multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from './ownership-qualifier';

export const parseApiInitialOwnership = (data: unknown, location?: string): ApiInitialOwnership => {
	if (!isObject(data)) {
		throw new RequestStructureError(`Invalid initial ownership data structure`, location);
	}

	const initialOwnership: Record<string, ApiInitialOwnership[ApiInitialOwnershipkey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const fieldPath = `${location}.${field}`;
				const ownershipField = getApiInitialOwnershipField(field);

				if (!ownershipField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, fieldPath);
					}
					return;
				}

				const { write, parse } = ownershipField;

				const parsedValue = parse
					? parse(value, fieldPath)
					: (value as ApiInitialOwnership[ApiInitialOwnershipkey]);

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
