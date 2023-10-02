import { groupBy } from 'lodash';

import { FieldNameError, ValidationError } from '@src/helpers/validation';
import { validateSchema, ValidationSchemas } from '@src/helpers/schemaValidator';
import { notNil } from '@src/helpers/typing';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { ERROR_ON_EXTRANEOUS_FIELDS } from '../../validation';

import { ApiExpenses, ApiExpensesKey, getApiExpensesField } from './fields/expenses';

export class ExpensesNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ExpensesNotFoundError.name, statusCode);
	}
}

export class DuplicateExpensesError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = DuplicateExpensesError.name;
	}
}

export class ExpensesCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ExpensesCollisionError.name;
	}
}

export class ExpensesRowValidationError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = ExpensesRowValidationError.name;
	}
}

export const errorLocation = (field: string, index?: number): string =>
	index !== undefined ? `[${index}].${field}` : field;

export const parseApiExpenses = (data: Record<string, unknown>, index?: number): ApiExpenses => {
	const expenses: Record<string, ApiExpenses[ApiExpensesKey]> = {};

	const errorAggregator = new ValidationErrorAggregator();

	validateSchema(ValidationSchemas.Expenses, data, errorAggregator, index);

	errorAggregator.throwAll();

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errorAggregator.catch(() => {
				const expensesField = getApiExpensesField(field);

				if (!expensesField) {
					if (ERROR_ON_EXTRANEOUS_FIELDS) {
						throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
					}
					return;
				}

				const { write, parse } = expensesField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiExpenses[ApiExpensesKey]);

				if (write) {
					expenses[field] = parsedValue;
				}
			}),
		);

	errorAggregator.throwAll();

	return expenses;
};

export const checkModelDuplicates = (
	apiExpenses: Array<ApiExpenses | undefined>,
	errorAggregator?: ValidationErrorAggregator,
): Array<ApiExpenses | undefined> => {
	const filtered = apiExpenses.filter(notNil).map(({ name }, indexInList) => ({ name, indexInList }));

	const idIndexMap = groupBy(filtered, ({ name }) => name);

	const currentErrorAggregator = errorAggregator ?? new ValidationErrorAggregator();

	const validElements = [...apiExpenses];

	Object.entries(idIndexMap).forEach(([name, occurrences]) =>
		currentErrorAggregator.catch(() => {
			if (occurrences.length > 1) {
				occurrences.forEach(({ indexInList }) => (validElements[indexInList] = undefined));

				throw new DuplicateExpensesError(
					`More than one Expenses data supplied with name \`${name}\``,
					occurrences.map(({ indexInList }) => `[${indexInList}]`).join(', '),
				);
			}
		}),
	);

	if (!errorAggregator) {
		currentErrorAggregator.throwAll();
	}

	return validElements;
};
