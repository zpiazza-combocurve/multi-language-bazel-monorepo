import {
	FlatRowCriteria,
	StartEndDatesCriteria,
	StartEndPeriodCriteria,
	StartEndRateCriteria,
} from '@src/api/v1/projects/econ-models/row-validations/criteria-validation';
import { ValidationError } from '@src/helpers/validation';

import { IRowValidator } from './row-validations/helpers';

export class ModelCollisionError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location, ModelCollisionError.name);
	}
}

export class DuplicateNameError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location, DuplicateNameError.name);
	}
}

export class FieldError extends ValidationError {
	constructor(message?: string, location?: string) {
		super(message, location);
		this.name = FieldError.name;
	}
}
type RowGeneratorInput = {
	key?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	value?: any;
};

export const GenerateStartEndPeriodCriteria = (): StartEndPeriodCriteria => new StartEndPeriodCriteria();

export const GenerateStartEndDatesCriteria = (): StartEndDatesCriteria => new StartEndDatesCriteria();

export const GenerateFlatRowCriteria = (): FlatRowCriteria => new FlatRowCriteria();

export const GenerateStartEndRateCriteria = (): StartEndRateCriteria => new StartEndRateCriteria();

export const getMatchingValidationFunction = (
	obj: Record<string, unknown>,
	objRepresentationGenerators: () => ((input?: RowGeneratorInput) => IRowValidator)[],
): IRowValidator[] => {
	let matchingCondition: string | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let matchingValue: any = null;
	const rowPropertyConditions = [];
	for (const econFunctionValidationRows of objRepresentationGenerators()) {
		for (const prop of econFunctionValidationRows().acceptedProperties) {
			if (obj && obj[prop] !== undefined) {
				matchingCondition = prop;
				matchingValue = obj[prop];
			}
		}
		if (!matchingCondition) {
			continue;
		}
		rowPropertyConditions.push(econFunctionValidationRows({ key: matchingCondition, value: matchingValue }));
		matchingCondition = null;
		matchingValue = null;
	}
	return rowPropertyConditions;
};
