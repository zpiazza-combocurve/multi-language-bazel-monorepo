import { RequestStructureError } from '@src/helpers/validation';
import { ValidationChain } from '@src/strategies/validation-chain/validation-chain';

import { CreateDSRequest, UpdateDSRequest } from '../models/requests';
import { ValidationErrorAggregator } from '../../multi-error';

import {
	arraysNotEmptyAndSameLenght,
	coordinatesShouldBeValid,
	dataSourceShouldBeValid,
	inclinationShouldBeValid,
	positiveValuesOnly,
	requiredFields,
	shouldHaveOnlyOneWell,
	spatialTypeShouldBeValid,
} from './core';

let createValidationChain: ValidationChain<CreateDSRequest> | null = null;
let updateValidationChain: ValidationChain<UpdateDSRequest> | null = null;

export function validateCreationRequest(req: CreateDSRequest): ValidationErrorAggregator {
	if (createValidationChain === null) {
		createValidationChain = new ValidationChain<CreateDSRequest>(createDSValidations.requiredFields);
		createValidationChain.setNext(createDSValidations.arraysNotEmptyAndSameLenght);
		createValidationChain.setNext(createDSValidations.positivesArrays);
		createValidationChain.setNext(createDSValidations.dataSourceShouldBeValid);
		createValidationChain.setNext(createDSValidations.spatialTypeShouldBeValid);
		createValidationChain.setNext(createDSValidations.coordinatesShouldBeValid);
		createValidationChain.setNext(createDSValidations.inclinationShouldBeValid);
		createValidationChain.setNext(createDSValidations.shouldHaveOnlyOneWell);
	}

	return createValidationChain.validate(req, req.chosenID);
}

export const commonPositiveArrays = ['measuredDepth', 'trueVerticalDepth', 'azimuth', 'inclination'];
export const createRequiredProperties = [
	'chosenID',
	'dataSource',
	'spatialDataType',
	'measuredDepth',
	'trueVerticalDepth',
	'azimuth',
	'inclination',
	'deviationEW',
	'deviationNS',
	'latitude',
	'longitude',
];

const createDSValidations = {
	noPrefix: '',

	requiredFields: (input: CreateDSRequest): void => {
		requiredFields(input, createDSValidations.noPrefix, createRequiredProperties);
	},

	arraysNotEmptyAndSameLenght: (input: CreateDSRequest): void => {
		arraysNotEmptyAndSameLenght(input, createDSValidations.noPrefix);
	},

	positivesArrays: (input: CreateDSRequest): void => {
		positiveValuesOnly(input, createDSValidations.noPrefix, commonPositiveArrays);
	},

	dataSourceShouldBeValid: (input: CreateDSRequest): void => {
		dataSourceShouldBeValid(input.dataSource);
	},

	spatialTypeShouldBeValid: (input: CreateDSRequest): void => {
		spatialTypeShouldBeValid(input.spatialDataType, createDSValidations.noPrefix);
	},

	coordinatesShouldBeValid: (input: CreateDSRequest): void => {
		coordinatesShouldBeValid(input);
	},

	inclinationShouldBeValid: (input: CreateDSRequest): void => {
		inclinationShouldBeValid(input, createDSValidations.noPrefix);
	},

	shouldHaveOnlyOneWell: (input: CreateDSRequest): void => {
		shouldHaveOnlyOneWell(input);
	},
};

export function validateUpdateRequest(req: UpdateDSRequest): ValidationErrorAggregator {
	if (updateValidationChain === null) {
		updateValidationChain = new ValidationChain<UpdateDSRequest>(updateDSValidations.arraysNotEmptyAndSameLenght);
		updateValidationChain.setNext(updateDSValidations.positiveArrays);
		updateValidationChain.setNext(updateDSValidations.coordinatesShouldBeValid);
		updateValidationChain.setNext(updateDSValidations.inclinationShouldBeValid);
		updateValidationChain.setNext(updateDSValidations.spatialTypeShouldBeValid);
	}

	return updateValidationChain.validate(req);
}

const updateDSValidations = {
	arraysNotEmptyAndSameLenght: (input: UpdateDSRequest): void => {
		const agg = new ValidationErrorAggregator();

		agg.catch(() => {
			if (input.add) {
				arraysNotEmptyAndSameLenght(input.add, 'add.');
			}
		});

		agg.catch(() => {
			if (input.update) {
				arraysNotEmptyAndSameLenght(input.update, 'update.');
			}
		});

		agg.throwAll();
	},

	positiveArrays: (input: UpdateDSRequest): void => {
		const agg = new ValidationErrorAggregator();

		agg.catch(() => {
			if (input.add) {
				positiveValuesOnly(input.add, 'add.', commonPositiveArrays);
			}
		});

		agg.catch(() => {
			if (input.update) {
				positiveValuesOnly(input.update, 'update.', commonPositiveArrays);
			}
		});

		agg.catch(() => {
			if (input.remove !== null && input.remove.some((s) => s < 0)) {
				throw new RequestStructureError(`The field 'remove' must contains only positive values.`);
			}
		});

		agg.throwAll();
	},

	spatialTypeShouldBeValid: (input: UpdateDSRequest): void => {
		const agg = new ValidationErrorAggregator();

		agg.catch(() => {
			if (input.add) {
				spatialTypeShouldBeValid(input.spatialDataType, '.');
			}
		});

		agg.throwAll();
	},

	coordinatesShouldBeValid: (input: UpdateDSRequest): void => {
		const agg = new ValidationErrorAggregator();

		agg.catch(() => {
			if (input.add) {
				coordinatesShouldBeValid(input.add);
			}
		});

		agg.catch(() => {
			if (input.update) {
				coordinatesShouldBeValid(input.update);
			}
		});

		agg.throwAll();
	},

	inclinationShouldBeValid: (input: UpdateDSRequest): void => {
		const agg = new ValidationErrorAggregator();

		agg.catch(() => {
			if (input.add) {
				inclinationShouldBeValid(input.add, 'add.');
			}
		});

		agg.catch(() => {
			if (input.update) {
				inclinationShouldBeValid(input.update, 'update.');
			}
		});

		agg.throwAll();
	},
};
