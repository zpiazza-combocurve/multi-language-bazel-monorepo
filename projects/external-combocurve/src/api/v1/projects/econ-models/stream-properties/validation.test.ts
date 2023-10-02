/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldNameError, RequestStructureError } from '@src/helpers/validation';
import { MultipleValidationError, ValidationErrorAggregator } from '@src/api/v1/multi-error';

import {
	checkModelDuplicates,
	parseApiStreamProperties,
	parseBtuContentEconFunction,
	parseEconFunctionRowField,
	parseLossFlareEconFunction,
	parseShrinkageEconFunction,
	parseYieldsEconFunction,
	validateStreamPropertyRows,
} from './validation';
import { ApiBtuContentEconFunction } from './fields/btu-content-econ-function';
import { ApiStreamProperties } from './fields/stream-properties';

const getValidStreamPropertiesInput = () => ({
	name: 'stream test',
	unique: false,
	yields: {
		rowsCalculationMethod: 'monotonic',
		ngl: {
			rows: [
				{
					yield: 0.000001,
					gasRate: 5,
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 10,
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 15,
					shrunkGas: 'Shrunk Gas',
				},
			],
		},
		dripCondensate: {
			rows: [
				{
					yield: 2001,
					offsetToFpd: 99,
					unshrunkGas: 'Unshrunk Gas',
				},
			],
		},
	},
	shrinkage: {
		rowsCalculationMethod: 'non_monotonic',
		oil: {
			rows: [
				{
					gasRate: 123132132,
					pctRemaining: 100,
				},
			],
		},
		gas: {
			rows: [
				{
					entireWellLife: 'Flat',
					pctRemaining: 100,
				},
			],
		},
	},
	lossFlare: {
		rowsCalculationMethod: 'non_monotonic',
		oilLoss: {
			rows: [
				{
					entireWellLife: 'Flat',
					pctRemaining: 100,
				},
			],
		},
		gasLoss: {
			rows: [
				{
					offsetToFpd: 24,
					pctRemaining: 100,
				},
			],
		},
		gasFlare: {
			rows: [
				{
					entireWellLife: 'Flat',
					pctRemaining: 100,
				},
			],
		},
	},
	btuContent: {
		unshrunkGas: 1231.999999999,
		shrunkGas: 999.999,
	},
});

const getValidYieldsPropertiesInput = () => ({
	rowsCalculationMethod: 'monotonic',
	ngl: {
		rows: [
			{
				yield: 0.000001,
				gasRate: 5,
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: 10,
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: 15,
				shrunkGas: 'Shrunk Gas',
			},
		],
	},
	dripCondensate: {
		rows: [
			{
				yield: 2001,
				offsetToFpd: 99,
				unshrunkGas: 'Unshrunk Gas',
			},
		],
	},
});
const getValidYieldsPropertiesOutput = () => ({
	rowsCalculationMethod: 'monotonic',
	ngl: {
		rows: [
			{
				yield: 0.000001,
				gasRate: {
					start: 5,
					end: 10,
				},
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: {
					start: 10,
					end: 15,
				},
				shrunkGas: 'Shrunk Gas',
			},
			{
				yield: 9,
				gasRate: {
					start: 15,
					end: 'inf',
				},
				shrunkGas: 'Shrunk Gas',
			},
		],
	},
	dripCondensate: {
		rows: [
			{
				yield: 2001,
				offsetToFpd: {
					start: 1,
					end: 99,
					period: 99,
				},
				unshrunkGas: 'Unshrunk Gas',
			},
		],
	},
});

const getValidShrinkagePropertiesInput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oil: {
		rows: [
			{
				gasRate: 123132132,
				pctRemaining: 100,
			},
		],
	},
	gas: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});
const getValidShrinkagePropertiesOutput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oil: {
		rows: [
			{
				gasRate: {
					start: 123132132,
					end: 'inf',
				},
				pctRemaining: 100,
			},
		],
	},
	gas: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

const getValidLossFlarePropertiesInput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oilLoss: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
	gasLoss: {
		rows: [
			{
				offsetToFpd: 24,
				pctRemaining: 100,
			},
		],
	},
	gasFlare: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});
const getValidLossFlarePropertiesOutput = () => ({
	rowsCalculationMethod: 'non_monotonic',
	oilLoss: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
	gasLoss: {
		rows: [
			{
				offsetToFpd: {
					start: 1,
					end: 24,
					period: 24,
				},
				pctRemaining: 100,
			},
		],
	},
	gasFlare: {
		rows: [
			{
				entireWellLife: 'Flat',
				pctRemaining: 100,
			},
		],
	},
});

function getValidBtuContentPropertiesEconFunction(): ApiBtuContentEconFunction {
	return {
		unshrunkGas: 1231.999999999,
		shrunkGas: 999.999,
	};
}

describe('v1/projects/econ-models/stream-properties/validation.test', () => {
	describe('parseApiStreamProperties', () => {
		it('should parse valid stream properties data', () => {
			const data = getValidStreamPropertiesInput();

			const expectedResult = getValidStreamPropertiesInput();

			expect(parseApiStreamProperties(data)).toMatchObject(expectedResult);
		});

		it('should throw MultipleValidationError for missing stream properties', () => {
			const data = {};

			expect(() => parseApiStreamProperties(data)).toThrow(MultipleValidationError);
		});

		it('should throw FieldNameError for duplicate stream properties', () => {
			const data = getValidStreamPropertiesInput();
			const duplicateData = {
				...data,
				invalidProperty: 'bad data',
			};

			expect(() => parseApiStreamProperties(duplicateData)).toThrow(FieldNameError);
		});

		it('should throw MultipleValidationError for invalid stream properties row', () => {
			const data = getValidStreamPropertiesInput();
			data.yields.ngl.rows.push({
				yield: 0.000001,
			} as any);
			expect(() => parseApiStreamProperties(data)).toThrow(MultipleValidationError);
		});

		it('should throw a FieldNameError for extraneous fields', () => {
			const data = getValidStreamPropertiesInput();
			const invalidData = {
				...data,
				extraField: 'extraValue',
			};

			expect(() => parseApiStreamProperties(invalidData)).toThrow(FieldNameError);
		});
	});

	describe('parseShrinkageEconFunction', () => {
		it('should parse valid Shrinkage Econ Function data', () => {
			const input = getValidShrinkagePropertiesInput();
			const expectedOutput = getValidShrinkagePropertiesOutput();
			const result = parseShrinkageEconFunction(input);

			expect(result).toMatchObject(expectedOutput);
		});

		it('should throw RequestStructureError for non-object input', () => {
			const invalidInput = 'Invalid input';

			expect(() => parseShrinkageEconFunction(invalidInput)).toThrow(RequestStructureError);
		});

		it('should throw FieldNameError for invalid field name', () => {
			const shrinkage = getValidShrinkagePropertiesInput();
			const invalidInput = {
				...shrinkage,
				invalidKey: 'invalidValue',
			};

			expect(() => parseShrinkageEconFunction(invalidInput)).toThrow(FieldNameError);
		});
	});

	describe('parseYieldsEconFunction', () => {
		it('should parse valid Yields Econ Function data', () => {
			const input = getValidYieldsPropertiesInput();

			const expectedOutput = getValidYieldsPropertiesOutput();

			const result = parseYieldsEconFunction(input);

			expect(result).toMatchObject(expectedOutput);
		});

		it('should throw RequestStructureError for non-object input', () => {
			const invalidInput = 'Invalid input';

			expect(() => parseYieldsEconFunction(invalidInput)).toThrow(RequestStructureError);
		});

		it('should throw FieldNameError for invalid field name', () => {
			const shrinkage = getValidYieldsPropertiesInput();
			const invalidInput = {
				...shrinkage,
				invalidKey: 'invalidValue',
			};

			expect(() => parseYieldsEconFunction(invalidInput)).toThrow(FieldNameError);
		});
	});

	describe('parseLossFlareEconFunction', () => {
		it('should parse valid LossFlare Econ Function data', () => {
			const input = getValidLossFlarePropertiesInput();

			const expectedOutput = getValidLossFlarePropertiesOutput();

			const result = parseLossFlareEconFunction(input);

			expect(result).toMatchObject(expectedOutput);
		});

		it('should throw RequestStructureError for non-object input', () => {
			const invalidInput = 'Invalid input';

			expect(() => parseLossFlareEconFunction(invalidInput)).toThrow(RequestStructureError);
		});

		it('should throw FieldNameError for invalid field name', () => {
			const shrinkage = getValidLossFlarePropertiesInput();
			const invalidInput = {
				...shrinkage,
				invalidKey: 'invalidValue',
			};

			expect(() => parseLossFlareEconFunction(invalidInput)).toThrow(FieldNameError);
		});
	});

	describe('parseBtuContentEconFunction', () => {
		it('should parse valid BtuContent Econ Function data', () => {
			const input = getValidBtuContentPropertiesEconFunction();

			const expectedOutput = getValidBtuContentPropertiesEconFunction();

			const result = parseBtuContentEconFunction(input);

			expect(result).toMatchObject(expectedOutput);
		});

		it('should throw RequestStructureError for non-object input', () => {
			const invalidInput = 'Invalid input';

			expect(() => parseBtuContentEconFunction(invalidInput)).toThrow(RequestStructureError);
		});

		it('should throw FieldNameError for invalid field name', () => {
			const shrinkage = getValidBtuContentPropertiesEconFunction();
			const invalidInput = {
				...shrinkage,
				invalidKey: 'invalidValue',
			};

			expect(() => parseBtuContentEconFunction(invalidInput)).toThrow(FieldNameError);
		});
	});

	describe('parseEconFunctionRowField', () => {
		it('should throw a RequestStructureError if input is not an object', () => {
			expect(() => parseEconFunctionRowField('invalid_input')).toThrow(RequestStructureError);
		});

		it('should throw a MultipleValidationError if input contains an invalid field', () => {
			const invalidFieldData = {
				yield: 2001,
				offsetToFpd: {
					start: 1,
					end: 99,
					period: 99,
				},
				unshrunkGas: 'Unshrunk Gas',
				invalidField: 'invalid_value',
			};

			expect(() => parseEconFunctionRowField(invalidFieldData)).toThrow(MultipleValidationError);
		});

		it('should return a valid object if input is valid', () => {
			const validInput = {
				rows: [
					{
						yield: 2001,
						offsetToFpd: 99,
						unshrunkGas: 'Unshrunk Gas',
					},
				],
			};

			const result = parseEconFunctionRowField(validInput);
			expect(result).toHaveProperty('rows');
			expect(result.rows).toEqual(validInput.rows);
		});
	});

	describe('checkModelDuplicates', () => {
		it('should not throw any error if no duplicates are found', () => {
			const data1 = getValidStreamPropertiesInput();
			const data2 = getValidStreamPropertiesInput();
			data2.name = 'stream test 2';
			const apiStreamProperties: Array<ApiStreamProperties | undefined> = [
				{ ...(data1 as unknown as ApiStreamProperties) },
				{ ...(data2 as unknown as ApiStreamProperties) },
			];
			const errorAggregator = new ValidationErrorAggregator();

			expect(() => checkModelDuplicates(apiStreamProperties, errorAggregator)).not.toThrow();
		});

		it('should throw a DuplicateStreamPropertiesError if duplicates are found', () => {
			const data = getValidStreamPropertiesInput();
			const apiStreamProperties = [
				{ ...(data as unknown as ApiStreamProperties) },
				{ ...(data as unknown as ApiStreamProperties) },
			];
			const errorAggregator = new ValidationErrorAggregator();

			checkModelDuplicates(apiStreamProperties, errorAggregator);
			const errors = errorAggregator.getErrorEntries();

			expect(errors).toHaveLength(1);
			expect(errors[0].name).toMatch(/DuplicateStreamPropertiesError/);
			expect(errors[0].message).toMatch(/More than one Stream Properties model data supplied with name/);
		});
	});

	describe('validateStreamPropertyRows', () => {
		test('should throw an error if rows is not an array', () => {
			const rows = 'not an array';

			expect(() => validateStreamPropertyRows(rows as any, 'rows')).toThrow(
				new RequestStructureError('The field `rows` must be an array of object(s).', 'rows'),
			);
		});

		test('should throw an error if any element in rows is not an object', () => {
			const rows = [1, 'string', { valid: true }];

			expect(() => validateStreamPropertyRows(rows as any, 'rows')).toThrow(
				new RequestStructureError('The field `rows` must be an array of object(s).', 'rows'),
			);
		});

		test('should pass with a valid rows input', () => {
			const rows = [
				{
					yield: 0.000001,
					gasRate: 5,
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 10,
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 15,
					shrunkGas: 'Shrunk Gas',
				},
			];

			expect(() => validateStreamPropertyRows(rows, 'rows')).not.toThrow();
		});

		test('should throw an error if any row validation function fails', () => {
			const rows = [
				{
					yield: 0.000001,
					gasRate: 5,
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 4, // invalid
					shrunkGas: 'Shrunk Gas',
				},
				{
					yield: 9,
					gasRate: 15,
					shrunkGas: 'Shrunk Gas',
				},
			];

			expect(() => validateStreamPropertyRows(rows, 'rows')).toThrow(
				new Error(
					'The value of `gasRate` in this row must be greater than the value of `gasRate` in the previous row.',
				),
			);
		});
	});
});
