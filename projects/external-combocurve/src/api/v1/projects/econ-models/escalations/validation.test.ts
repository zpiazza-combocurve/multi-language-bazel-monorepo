import { ESCALATION_CALCULATION_METHOD, ESCALATION_FREQUENCY } from '@src/models/econ/escalations';
import { RequestStructureError, TypeError, ValidationError, ValueError } from '@src/helpers/validation';
import { MultipleValidationError } from '@src/api/v1/multi-error';

import { parseApiEscalation, parseEscalationEconFunction, validateEscalationRows } from './validation';
import { ApiEscalationKey } from './fields/escalations';

describe('v1/projects/econ-models/escalations/validation.test', () => {
	// PARSE API ESCALATION MODEL
	describe('parseApiEscalation', () => {
		it('parses valid input without errors', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'EM: Flat Fail',
				unique: false,
				escalation: {
					rows: [
						{
							dollarPerYear: 1000,
							monthPeriod: 1,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			const result = parseApiEscalation(data);

			expect(result).toEqual(data);
		});

		it('throws MultipleValidationError for extraneous fields', () => {
			const data = {
				invalid_field: 'value',
			};

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(MultipleValidationError);
		});

		it('throws MultipleValidationError for missing required fields', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				id: 'someId',
				unique: true,
			};

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(MultipleValidationError);
		});

		it('should throw a MultipleValidationError if both properties are null', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							pctPerYear: null,
							dollarPerYear: null,
							monthPeriod: 1,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(MultipleValidationError);
		});

		it('should not throw error for valid row with pctPerYear', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							dates: '2020-01-01',
							pctPerYear: 5,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};
			expect(() => {
				parseApiEscalation(data);
			}).not.toThrow();
		});

		it('should not throw error for valid row with dollarPerYear', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							dates: '2020-01-01',
							dollarPerYear: 1000,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			expect(() => {
				parseApiEscalation(data);
			}).not.toThrow();
		});

		it('should throw error for row with no pctPerYear or dollarPerYear', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							dates: '2020-01-01',
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(
				'All rows must contain exactly one of the following properties: `pctPerYear` or `dollarPerYear`',
			);
		});

		it('should throw error for row with null values for both pctPerYear and dollarPerYear', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							dates: '2020-01-01',
							pctPerYear: null,
							dollarPerYear: null,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			const errors = [
				new TypeError(
					'All rows must contain exactly one of the following properties: `pctPerYear` or `dollarPerYear`',
				),
				new TypeError('`null` is not a valid number'),
				new TypeError('`null` is not a valid number'),
			];

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(new MultipleValidationError(errors));
		});

		it('should throw error for row with both valid pctPerYear and dollarPerYear properties', () => {
			const data: Partial<Record<ApiEscalationKey, unknown>> = {
				name: 'name',
				unique: false,
				escalation: {
					rows: [
						{
							dates: '2020-01-01',
							pctPerYear: 5,
							dollarPerYear: 1000,
						},
					],
					escalationFrequency: 'constant',
					calculationMethod: 'simple',
				},
			};

			expect(() => {
				parseApiEscalation(data);
			}).toThrow(
				'All rows must contain exactly one of the following properties: `pctPerYear` or `dollarPerYear`',
			);
		});
	});

	// PARSE API ESCALATION MODEL ECON FUNCTION
	describe('parseEscalationEconFunction', () => {
		it('should parse a valid escalation model econ function', () => {
			const data = {
				rows: [
					{
						dollarPerYear: 1000,
						monthPeriod: 1,
					},
				],
				escalationFrequency: ESCALATION_FREQUENCY[2],
				calculationMethod: ESCALATION_CALCULATION_METHOD[0],
			};

			const result = parseEscalationEconFunction(data);

			expect(result).toEqual(data);
		});

		it('should throw a RequestStructureError when the data is not an object', () => {
			const data = 'not an object';

			expect(() => parseEscalationEconFunction(data)).toThrow(RequestStructureError);
		});

		it('should throw a ValidationError when the rows property is not an array of objects', () => {
			const data = {
				rows: 'not an array',
				escalationFrequency: ESCALATION_FREQUENCY[0],
				calculationMethod: ESCALATION_CALCULATION_METHOD[0],
			};

			expect(() => parseEscalationEconFunction(data)).toThrow(ValidationError);
		});

		it('should throw a RequestStructureError when the rows property contains an invalid object', () => {
			const data = {
				rows: 'not a valid array of objects',
				escalationFrequency: ESCALATION_FREQUENCY[0],
				calculationMethod: ESCALATION_CALCULATION_METHOD[0],
			};

			expect(() => parseEscalationEconFunction(data)).toThrow(RequestStructureError);
		});

		it('should throw a ValueError when the escalationFrequency is not a valid value', () => {
			const data = {
				rows: [
					{
						dollarPerYear: 1000,
						monthPeriod: 1,
					},
				],
				escalationFrequency: 'invalid',
				calculationMethod: ESCALATION_CALCULATION_METHOD[0],
			};

			expect(() => parseEscalationEconFunction(data)).toThrow(ValueError);
		});

		it('should throw a ValueError when the calculationMethod is not a valid value', () => {
			const data = {
				rows: [
					{
						dollarPerYear: 1000,
						monthPeriod: 1,
					},
				],
				escalationFrequency: ESCALATION_FREQUENCY[0],
				calculationMethod: 'invalid',
			};

			expect(() => parseEscalationEconFunction(data)).toThrow(ValueError);
		});
	});

	// VALIDATE ESCALATION MODEL ROWS
	describe('validateEscalationRows', () => {
		it('should throw a RequestStructureError if input is not an array', () => {
			const nonArrayInputs = [undefined, null, {}, 42, 'not-array'];

			nonArrayInputs.forEach((input) => {
				expect(() => validateEscalationRows(input as unknown, 'location')).toThrow(RequestStructureError);
			});
		});

		it('should throw a RequestStructureError if any row is not an object', () => {
			const nonObjectRow = [42, 'not-object', undefined, null];
			const rows = [{ pctPerYear: 1 }, ...nonObjectRow];

			expect(() => validateEscalationRows(rows as unknown, 'location')).toThrow(RequestStructureError);
		});

		it('should not throw an error for valid input', () => {
			const validRow1 = {
				dollarPerYear: 11,
				dates: '2020-01-01',
			};
			const validRow2 = {
				dollarPerYear: 22,
				dates: '2020-02-01',
			};
			const rows = [validRow1, validRow2];

			expect(() => validateEscalationRows(rows, 'location')).not.toThrow();
		});
	});
});
