import { MultipleValidationError } from '@src/api/v1/multi-error';
import { RequiredFieldError } from '@src/helpers/validation';

import {
	checkModelDuplicates,
	parseApiDifferentials,
	parseDifferentialsEconFunction,
	parsePhaseFields,
	parsePhaseGroup,
} from './validation';

const getValidDifferentialsPayloadInput = () => ({
	name: 'test',
	unique: false,
	differentials: {
		firstDifferential: {
			oil: {
				escalationModel: '6418ab17b301cfee750745eb',
				rows: [
					{
						entireWellLife: 'Flat',
						pctOfBasePrice: 0.000001,
					},
				],
			},
			gas: {
				escalationModel: '64120643b301cfee75cc1a21',
				rows: [
					{
						dollarPerMcf: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			ngl: {
				escalationModel: '63fe159a6efdea186c676a98',
				rows: [
					{
						dollarPerGal: 0,
						entireWellLife: 'Flat',
					},
				],
			},
			dripCondensate: {
				escalationModel: '6418ab17b301cfee750745eb',
				rows: [
					{
						offsetToAsOf: 2,
						pctOfBasePrice: 100,
					},
					{
						offsetToAsOf: 3,
						pctOfBasePrice: 50,
					},
					{
						offsetToAsOf: 4,
						pctOfBasePrice: 0.000001,
					},
				],
			},
		},
		secondDifferential: {
			oil: {
				escalationModel: 'none',
				rows: [
					{
						dollarPerBbl: 200,
						entireWellLife: 'Flat',
					},
				],
			},
			gas: {
				escalationModel: 'none',
				rows: [
					{
						offsetToAsOf: 2,
						pctOfBasePrice: 100,
					},
					{
						offsetToAsOf: 1,
						pctOfBasePrice: 100,
					},
					{
						offsetToAsOf: 10,
						pctOfBasePrice: 100,
					},
				],
			},
			ngl: {
				escalationModel: 'none',
				rows: [
					{
						dollarPerBbl: 0,
						offsetToAsOf: 1,
					},
					{
						dollarPerBbl: 0,
						offsetToAsOf: 2,
					},
					{
						dollarPerBbl: 0,
						offsetToAsOf: 3,
					},
				],
			},
			dripCondensate: {
				escalationModel: '6418ab17b301cfee750745eb',
				rows: [
					{
						dates: '2020-02-01',
						pctOfBasePrice: 100000,
					},
					{
						dates: '2020-03-01',
						pctOfBasePrice: 0.123456,
					},
				],
			},
		},
		thirdDifferential: {
			oil: {
				escalationModel: 'none',
				rows: [
					{
						dollarPerBbl: 200,
						entireWellLife: 'Flat',
					},
				],
			},
			gas: {
				escalationModel: 'none',
				rows: [
					{
						offsetToAsOf: 2,
						pctOfBasePrice: 100,
					},
					{
						offsetToAsOf: 1,
						pctOfBasePrice: 100,
					},
					{
						offsetToAsOf: 10,
						pctOfBasePrice: 100,
					},
				],
			},
			ngl: {
				escalationModel: 'none',
				rows: [
					{
						dollarPerBbl: 0,
						offsetToAsOf: 1,
					},
					{
						dollarPerBbl: 0,
						offsetToAsOf: 2,
					},
					{
						dollarPerBbl: 0,
						offsetToAsOf: 3,
					},
				],
			},
			dripCondensate: {
				escalationModel: '6418ab17b301cfee750745eb',
				rows: [
					{
						dates: '2020-02-01',
						pctOfBasePrice: 1000000,
					},
					{
						dates: '2021-02-01',
						pctOfBasePrice: 0.123456,
					},
					{
						dates: '2022-10-01',
						pctOfBasePrice: 0,
					},
				],
			},
		},
	},
});

// function getValidDifferentialsPayload(): ApiDifferentials {
// 	return {
// 		name: 'test',
// 		unique: false,
// 		differentials: {
// 			firstDifferential: {
// 				oil: {
// 					escalationModel: '6418ab17b301cfee750745eb',
// 					rows: [
// 						{
// 							entireWellLife: 'Flat',
// 							pctOfBasePrice: 0.000001,
// 						},
// 					],
// 				},
// 				gas: {
// 					escalationModel: '64120643b301cfee75cc1a21',
// 					rows: [
// 						{
// 							dollarPerMcf: 0,
// 							entireWellLife: 'Flat',
// 						},
// 					],
// 				},
// 				ngl: {
// 					escalationModel: '63fe159a6efdea186c676a98',
// 					rows: [
// 						{
// 							dollarPerGal: 0,
// 							entireWellLife: 'Flat',
// 						},
// 					],
// 				},
// 				dripCondensate: {
// 					escalationModel: '6418ab17b301cfee750745eb',
// 					rows: [
// 						{
// 							offsetToAsOf: {
// 								start: 1,
// 								end: 2,
// 								period: 2,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 3,
// 								end: 5,
// 								period: 3,
// 							},
// 							pctOfBasePrice: 50,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 6,
// 								end: 9,
// 								period: 4,
// 							},
// 							pctOfBasePrice: 0.000001,
// 						},
// 					],
// 				},
// 			},
// 			secondDifferential: {
// 				oil: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							dollarPerBbl: 200,
// 							entireWellLife: 'Flat',
// 						},
// 					],
// 				},
// 				gas: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							offsetToAsOf: {
// 								start: 1,
// 								end: 2,
// 								period: 2,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 3,
// 								end: 3,
// 								period: 1,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 4,
// 								end: 13,
// 								period: 10,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 					],
// 				},
// 				ngl: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 1,
// 								end: 1,
// 								period: 1,
// 							},
// 						},
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 2,
// 								end: 3,
// 								period: 2,
// 							},
// 						},
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 4,
// 								end: 6,
// 								period: 3,
// 							},
// 						},
// 					],
// 				},
// 				dripCondensate: {
// 					escalationModel: '6418ab17b301cfee750745eb',
// 					rows: [
// 						{
// 							dates: {
// 								startDate: '2020-02-01',
// 								endDate: '2020-02-29',
// 							},
// 							pctOfBasePrice: 100000,
// 						},
// 						{
// 							dates: {
// 								startDate: '2020-03-01',
// 								endDate: 'Econ Limit',
// 							},
// 							pctOfBasePrice: 0.123456,
// 						},
// 					],
// 				},
// 			},
// 			thirdDifferential: {
// 				oil: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							dollarPerBbl: 200,
// 							entireWellLife: 'Flat',
// 						},
// 					],
// 				},
// 				gas: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							offsetToAsOf: {
// 								start: 1,
// 								end: 2,
// 								period: 2,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 3,
// 								end: 3,
// 								period: 1,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 						{
// 							offsetToAsOf: {
// 								start: 4,
// 								end: 13,
// 								period: 10,
// 							},
// 							pctOfBasePrice: 100,
// 						},
// 					],
// 				},
// 				ngl: {
// 					escalationModel: 'none',
// 					rows: [
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 1,
// 								end: 1,
// 								period: 1,
// 							},
// 						},
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 2,
// 								end: 3,
// 								period: 2,
// 							},
// 						},
// 						{
// 							dollarPerBbl: 0,
// 							offsetToAsOf: {
// 								start: 4,
// 								end: 6,
// 								period: 3,
// 							},
// 						},
// 					],
// 				},
// 				dripCondensate: {
// 					escalationModel: '6418ab17b301cfee750745eb',
// 					rows: [
// 						{
// 							dates: {
// 								startDate: '2020-02-01',
// 								endDate: '2021-01-31',
// 							},
// 							pctOfBasePrice: 1000000,
// 						},
// 						{
// 							dates: {
// 								startDate: '2021-02-01',
// 								endDate: '2022-09-30',
// 							},
// 							pctOfBasePrice: 0.123456,
// 						},
// 						{
// 							dates: {
// 								startDate: '2022-10-01',
// 								endDate: 'Econ Limit',
// 							},
// 							pctOfBasePrice: 0,
// 						},
// 					],
// 				},
// 			},
// 		},
// 	};
// }

describe('v1/projects/econ-models/differentials/validation.test', () => {
	describe('parseApiDifferentials', () => {
		// WORKS WITH VALID DATA
		it('should parse valid data', () => {
			const input = getValidDifferentialsPayloadInput();
			// const result = getValidDifferentialsPayload();
			expect(parseApiDifferentials(input)).toEqual(input);
		});

		// MISSING FIELDS TESTS
		it('should throw MultipleValidationError if name field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name, ...rest } = getValidDifferentialsPayloadInput();
			expect(() => parseApiDifferentials(rest as unknown as Record<string, unknown>)).toThrow(RequiredFieldError);
		});

		it('should throw MultipleValidationError if unique field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { unique, ...rest } = getValidDifferentialsPayloadInput();
			expect(() => parseApiDifferentials(rest as unknown as Record<string, unknown>)).toThrow(RequiredFieldError);
		});

		it('should throw MultipleValidationError if differentials field is missing', () => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { differentials, ...rest } = getValidDifferentialsPayloadInput();
			expect(() => parseApiDifferentials(rest as unknown as Record<string, unknown>)).toThrow(RequiredFieldError);
		});

		it('should throw RequiredFieldError if firstDifferentials field is missing', () => {
			const { differentials, ...rest } = getValidDifferentialsPayloadInput();
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { firstDifferential, ...otherDifferentials } = differentials;
			const invalidData = {
				...rest,
				differentials: otherDifferentials,
			};
			expect(() => parseApiDifferentials(invalidData)).toThrow(RequiredFieldError);
		});

		it('should receive and ERROR_ON_EXTRANEOUS_FIELDS', () => {
			const input = getValidDifferentialsPayloadInput();
			const invalidData = {
				...input,
				invalidField: 'invalidValue',
			};
			expect(() => parseApiDifferentials(invalidData)).toThrow('`invalidField` is not a valid field name');
		});
	});

	describe('parseDifferentialsEconFunction', () => {
		it('should throw RequestStructureError if data is not an object', () => {
			expect(() => parseDifferentialsEconFunction('not an object')).toThrow(
				'Invalid differentials model data structure',
			);
		});

		it('should parse valid data', () => {
			const input = getValidDifferentialsPayloadInput();
			const parsedDifferentials = parseDifferentialsEconFunction(input.differentials);
			expect(parsedDifferentials.firstDifferential?.dripCondensate?.escalationModel).toBe(
				'6418ab17b301cfee750745eb',
			);
			expect(parsedDifferentials.secondDifferential?.gas?.escalationModel).toBe('none');
		});

		it('should throw FieldNameError if data contains extraneous fields', () => {
			const input = getValidDifferentialsPayloadInput();
			const differentialsWithExtraneousField = {
				...input.differentials,
				extraneousField: 'some value',
			};
			expect(() => parseDifferentialsEconFunction(differentialsWithExtraneousField)).toThrow(
				'`extraneousField` is not a valid field name',
			);
		});
	});

	describe('parsePhaseGroup', () => {
		it('should throw an error if the data is not an object', () => {
			expect(() => parsePhaseGroup(null)).toThrow('Invalid differentials data structure');
		});

		it('should parse valid data correctly', () => {
			const input = getValidDifferentialsPayloadInput();
			const result = parsePhaseGroup(input.differentials?.thirdDifferential);
			expect(result).toEqual({
				...input.differentials?.thirdDifferential,
			});
		});

		it('should throw an error if there is an extraneous field', () => {
			const input = getValidDifferentialsPayloadInput();
			const data = {
				...input.differentials?.thirdDifferential,
				extraneousField: 'extraneous',
			};
			expect(() => parsePhaseGroup(data)).toThrow('`extraneousField` is not a valid field name');
		});
	});

	describe('parsePhaseFields', () => {
		test('returns an object with parsed fluid fields', () => {
			const input = getValidDifferentialsPayloadInput();
			const fluidFiled = input.differentials?.thirdDifferential?.dripCondensate;
			expect(parsePhaseFields(fluidFiled)).toEqual(fluidFiled);
		});

		test('throws an error when input is not an object', () => {
			const input = 'invalid input';
			const expectedErrorMessage = 'Invalid differentials data structure';
			expect(() => parsePhaseFields(input)).toThrow(expectedErrorMessage);
		});

		test('throws an error when rows property is not an array', () => {
			const input = {
				escalationModel: 'none',
				rows: 'invalid rows',
			};
			const expectedErrorMessage = 'The field `rows` must be an array of object(s).';

			expect(() => parsePhaseFields(input)).toThrow(expectedErrorMessage);
		});

		test('throws an error when rows property contains non-object items', () => {
			const input = {
				escalationModel: 'none',
				rows: ['invalid row', 'another invalid row'],
			};
			const expectedErrorMessage = 'The field `rows` must be an array of object(s).';

			expect(() => parsePhaseFields(input)).toThrow(expectedErrorMessage);
		});

		test('throws an error when a row contains invalid properties', () => {
			const input = {
				escalationModel: 'none',
				rows: [
					{
						dates: '2020-02-01',
						invalidProperty: 1000000,
					},
				],
			};
			const expectedErrorMessage = '`invalidProperty` is not a valid field name';

			expect(() => parsePhaseFields(input)).toThrow(expectedErrorMessage);
		});
	});

	describe('checkModelDuplicates', () => {
		it('returns the original array if there are no duplicates', () => {
			const input = [{ name: 'Model1' }, { name: 'Model2' }, { name: 'Model3' }];

			const output = checkModelDuplicates(input);

			expect(output).toEqual(input);
		});

		it('filters out duplicate elements and throws a MultipleValidationError', () => {
			const input = [
				{ name: 'Model1' },
				{ name: 'Model2' },
				{ name: 'Model1' },
				{ name: 'Model3' },
				{ name: 'Model2' },
			];

			expect(() => checkModelDuplicates(input)).toThrow(MultipleValidationError);
		});
	});
});
