import { FieldNameError, isObject, RequestStructureError, ValidationError } from '@src/helpers/validation';
import { notNil } from '@src/helpers/typing';

import { errorLocation } from '../validation';
import { ValidationErrorAggregator } from '../../multi-error';

import { ApiScenario, ApiScenarioKey, getScenarioField } from './fields';

export class ScenarioNotFoundError extends ValidationError {
	constructor(message?: string, location?: string, statusCode = 404) {
		super(message, location, ScenarioNotFoundError.name, statusCode);
	}
}

export const parseScenarioPayload = (
	data: Array<Record<string, unknown>>,
	namesHash: Set<string>,
	errors: ValidationErrorAggregator,
): (ApiScenario | undefined)[] => {
	return data.map((element, index) =>
		errors.catch(() => {
			if (!isObject(element)) {
				throw new RequestStructureError('Invalid Scenario model data structure', `[${index}]`);
			}

			return createRequestFromBody(element, namesHash, errors, index);
		}),
	);
};

export const createRequestFromBody = (
	data: Record<string, unknown>,
	namesHash: Set<string>,
	errors: ValidationErrorAggregator,
	index: number,
): ApiScenario | undefined => {
	const scenario: Record<string, ApiScenario[ApiScenarioKey]> = {};
	const errorCount = errors.errors.length;

	Object.entries(data)
		.filter(([, value]) => notNil(value))
		.forEach(([field, value]) =>
			errors.catch(() => {
				const currentField = getScenarioField(field);

				if (!currentField) {
					throw new FieldNameError(`\`${field}\` is not a valid field name`, `[${index}]`);
				}

				const { write, parse } = currentField;

				const parsedValue = parse
					? parse(value, errorLocation(field, index))
					: (value as ApiScenario[ApiScenarioKey]);

				if (write) {
					scenario[field] = parsedValue;
				}

				if (field === 'name') {
					const name = parsedValue as string;
					if (namesHash.has(name)) {
						throw new RequestStructureError(
							`A scenario with the name '${parsedValue}' already exists in this project`,
							`[${index}]`,
						);
					}

					namesHash.add(name);
				}
			}),
		);

	errors.catch(() => {
		if (scenario.name === undefined) {
			throw new RequestStructureError('Scenario name is required', `[${index}]`);
		}
	});

	return errors.errors.length === errorCount ? scenario : undefined;
};
