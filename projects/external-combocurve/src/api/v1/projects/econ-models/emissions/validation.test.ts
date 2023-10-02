import { cloneDeep, get, set } from 'lodash';

import { FieldNameError, RequiredFieldError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	checkModelDuplicates,
	DuplicateEmissionError,
	parseApiEmission,
	parseEmissionEconFunction,
} from './validation';
import { ApiEmission } from './fields/emission';

const validEmissionsModel: ApiEmission = {
	unique: false,
	emissions: {
		rows: [
			{
				selected: true,
				category: 'associated_gas',
				co2e: 1,
				co2: 0,
				ch4: 0,
				n2o: 0,
				unit: 'mt_per_mbbl',
				escalationModel: 'none',
			},
		],
	},
};

function getEmissionsModel(name: string) {
	const item = cloneDeep(validEmissionsModel);

	return { name, ...item };
}

describe('api/v1/projects/econ-models/emissions/validation checkModelDuplicates', () => {
	test('should throw error if duplicate model names', () => {
		const models = [getEmissionsModel('model1'), getEmissionsModel('model1')];
		expect(() => checkModelDuplicates(models)).toThrow(DuplicateEmissionError);
	});

	test('should aggregate error if duplicate model names when ValidationErrorAggregator provided', () => {
		const models = [getEmissionsModel('model1'), getEmissionsModel('model1')];
		const aggregator = new ValidationErrorAggregator();

		checkModelDuplicates(models, aggregator);

		expect(aggregator.errors.length).toBe(1);
		expect(aggregator.errors[0]).toBeInstanceOf(DuplicateEmissionError);
	});

	test('should return valid models if no duplicates', () => {
		const models = [getEmissionsModel('model1'), getEmissionsModel('model2')];

		const result = checkModelDuplicates(models);

		expect(result).toEqual(models);
	});
});

describe('api/v1/projects/econ-models/emissions/validation parseApiEmission', () => {
	test('should return valid model if no validation errors', () => {
		const model = getEmissionsModel('model1');

		const result = parseApiEmission(model);

		expect(result).toEqual(model);
	});

	test('should throw error if emissions is not provided', () => {
		const model = getEmissionsModel('model1');

		delete model.emissions;

		const expectedError = new RequiredFieldError('Missing required field: `emissions`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows not provided', () => {
		const model = getEmissionsModel('model1');

		delete model.emissions?.rows;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows category not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.category;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.category`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows co2e not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.co2e;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.co2e`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows co2 not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.co2;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.co2`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows ch4 not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.ch4;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.ch4`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows n2o not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.n2o;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.n2o`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});

	test('should throw error if emissions rows unit not provided', () => {
		const model = getEmissionsModel('model1');

		const item = get(model, 'emissions.rows[0]');

		delete item?.unit;

		const expectedError = new RequiredFieldError('Missing required field: `emissions.rows.0.unit`');

		expect(() => parseApiEmission(model)).toThrow(expectedError);
	});
});

describe('api/v1/projects/econ-models/emissions/validation parseEmissionEconFunction', () => {
	test('should return valid model if no validation errors', () => {
		const model = getEmissionsModel('model1').emissions;

		const result = parseEmissionEconFunction(model);

		expect(result).toEqual(model);
	});

	test('should throw error if validation errors', () => {
		const model = getEmissionsModel('model1').emissions;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		set(model!, 'invalidField', true);

		const expectedError = new FieldNameError('`invalidField` is not a valid field name');

		expect(() => parseEmissionEconFunction(model)).toThrow(expectedError);
	});
});
