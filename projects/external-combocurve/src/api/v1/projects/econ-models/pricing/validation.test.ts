/* eslint-disable @typescript-eslint/no-explicit-any */
import { RequestStructureError, RequiredFieldError } from '@src/helpers/validation';

import { parseApiPricing, parsePricingEconFunction, parsePricingType, validatePricingRows } from './validation';

const getValidPricingPayload = () => ({
	name: 'test',
	unique: false,
	priceModel: {
		oil: {
			cap: 78,
			escalationModel: 'none',
			rows: [
				{
					entireWellLife: 'Flat',
					price: 10000000,
				},
			],
		},
		gas: {
			cap: 12,
			escalationModel: 'none',
			rows: [
				{
					dollarPerMmbtu: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		ngl: {
			escalationModel: 'none',
			rows: [
				{
					pctOfOilPrice: 100,
					offsetToAsOf: 5,
				},
				{
					pctOfOilPrice: 100,
					offsetToAsOf: 5,
				},
			],
		},
		dripCondensate: {
			escalationModel: 'none',
			rows: [
				{
					dates: '2023-04-01',
					dollarPerBbl: 0,
				},
				{
					dates: '2023-10-01',
					dollarPerBbl: 0,
				},
			],
		},
	},
});

const getValidPricingModel = (): Record<string, unknown> => ({
	oil: {
		escalationModel: 'none',
		rows: [
			{
				entireWellLife: 'Flat',
				price: 10000000,
			},
		],
	},
	gas: {
		escalationModel: undefined,
		rows: [
			{
				dollarPerMmbtu: 0,
				entireWellLife: 'Flat',
			},
		],
	},
	ngl: {
		escalationModel: undefined,
		rows: [
			{
				pctOfOilPrice: 100,
				offsetToAsOf: 5,
			},
			{
				pctOfOilPrice: 100,
				offsetToAsOf: 5,
			},
		],
	},
});

const getValidPricingType = () => ({
	escalationModel: undefined,
	rows: [
		{
			pctOfOilPrice: 100,
			offsetToAsOf: 5,
		},
		{
			pctOfOilPrice: 100,
			offsetToAsOf: 5,
		},
	],
});

const getValidPricingRows = () => [
	{
		pctOfOilPrice: 100,
		offsetToAsOf: 5,
	},
	{
		pctOfOilPrice: 100,
		offsetToAsOf: 5,
	},
];

describe('v1/projects/econ-models/pricing/validation.test', () => {
	describe('parseApiPricing', () => {
		// WORKS WITH VALID DATA
		it('should parse valid input correctly', () => {
			const input = getValidPricingPayload();

			const result = parseApiPricing(input);

			expect(result).toEqual(input);
		});

		// INVALID FIELD INPUT TESTS
		it('should throw ValidationErrorAggregator for invalid name input', () => {
			const input = getValidPricingPayload();
			input.name = 1234 as any;

			expect(() => parseApiPricing(input)).toThrow('`1234` is not a string');
		});

		it('should throw ValidationErrorAggregator for invalid unique input', () => {
			const input = getValidPricingPayload();
			input.unique = 'invalid' as any;

			expect(() => parseApiPricing(input)).toThrow('`invalid` is not a valid Boolean');
		});

		it('should throw ValidationErrorAggregator for invalid priceModel input', () => {
			const input = getValidPricingPayload();
			input.priceModel = 'invalid' as any;

			expect(() => parseApiPricing(input)).toThrow(
				'Invalid value for `priceModel`: `invalid`. `priceModel` must be an object.',
			);
		});

		// MISSING FIELDS TESTS
		it('should throw MultipleValidationError if name field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name, ...rest } = getValidPricingPayload();
			expect(() => parseApiPricing(rest as any)).toThrow(RequiredFieldError);
		});

		it('should throw RequiredFieldError if unique field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { unique, ...rest } = getValidPricingPayload();
			expect(() => parseApiPricing(rest as any)).toThrow(RequiredFieldError);
		});

		it('should throw MultipleValidationError if priceModel field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { unique, ...rest } = getValidPricingPayload();
			expect(() => parseApiPricing(rest as any)).toThrow(RequiredFieldError);
		});

		it('should receive and ERROR_ON_EXTRANEOUS_FIELDS', () => {
			const input = getValidPricingPayload();
			const invalidData = {
				...input,
				invalidField: 'invalidValue',
			};
			expect(() => parseApiPricing(invalidData)).toThrow('`invalidField` is not a valid field name');
		});

		it('should throw a TypeError when rows is an empty array', () => {
			const input = getValidPricingPayload();
			const invalidData = {
				...input,
			};

			invalidData.priceModel.oil.rows = [];

			expect(() => parseApiPricing(invalidData)).toThrow('must NOT have fewer than 1 items');
		});
	});

	describe('parsePricingEconFunction', () => {
		it('should parse valid data correctly', () => {
			const input = getValidPricingModel();
			const result = parsePricingEconFunction(input);
			expect(result).toEqual(input);
		});

		it('should throw a RequestStructureError when data is not an object', () => {
			const data = 'notAnObject';
			const location = 'exampleLocation';

			expect(() => parsePricingEconFunction(data, location)).toThrow(RequestStructureError);
		});

		it('should throw a FieldNameError when an invalid field is encountered', () => {
			const input = getValidPricingModel();
			const invalidData = {
				...input,
				invalidField: 'invalidValue',
			};
			const location = 'exampleLocation';

			expect(() => parsePricingEconFunction(invalidData, location)).toThrow(
				'`invalidField` is not a valid field name',
			);
		});
	});

	describe('parsePricingType', () => {
		it('should parse a valid pricing type object', () => {
			const data = getValidPricingType();

			const result = parsePricingType(data);

			expect(result).toEqual(data);
		});

		it('should throw a RequestStructureError when data is not an object', () => {
			const data = 'invalid data';

			expect(() => parsePricingType(data)).toThrow(new RequestStructureError('Invalid Pricing data structure'));
		});
	});

	describe('validatePricingRows', () => {
		const validRows = getValidPricingRows();

		it('should not throw an error for valid rows', () => {
			const testFunc = () => validatePricingRows(validRows, 'testLocation');
			expect(testFunc).not.toThrow();
		});

		it('should throw a RequestStructureError when rows is not an array', () => {
			const testFunc = () => validatePricingRows({}, 'testLocation');
			expect(testFunc).toThrow(RequestStructureError);
		});

		it('should throw a RequestStructureError when any element in the rows array is not an object', () => {
			const testFunc = () => validatePricingRows([...validRows, 1], 'testLocation');
			expect(testFunc).toThrow(RequestStructureError);
		});
	});
});
