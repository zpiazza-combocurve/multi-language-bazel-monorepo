import { FlatRowCriteria, StartEndDatesCriteria, StartEndPeriodCriteria } from './row-validations/criteria-validation';
import {
	GenerateFlatRowCriteria,
	GenerateStartEndDatesCriteria,
	GenerateStartEndPeriodCriteria,
	GenerateStartEndRateCriteria,
	getMatchingValidationFunction,
} from './validation';

describe('v1/projects/econ-models/validation', () => {
	// GET MATCHING CONDITION VALIDATION FUNCTION
	describe('getMatchingConditionValidationFunction', () => {
		const objRepresentationGenerators = () => [
			GenerateStartEndDatesCriteria,
			GenerateFlatRowCriteria,
			GenerateStartEndPeriodCriteria,
			GenerateStartEndRateCriteria,
		];

		it('should return an array of matching validation functions', () => {
			const obj = {
				dates: '1999-10-10',
				entireWellLife: 100,
				monthPeriod: 5,
				gasRate: 100,
			};

			const result = getMatchingValidationFunction(obj, objRepresentationGenerators);
			expect(result.length).toEqual(4);
		});

		it('should return an empty array when there are no matching conditions', () => {
			const obj = {
				non_existing_key1: 5,
				non_existing_key2: 1,
				non_existing_key3: 100,
			};

			const result = getMatchingValidationFunction(obj, objRepresentationGenerators);
			expect(result.length).toEqual(0);
		});
	});

	// GENERATE START END PERIOD CRITERIA
	describe('Generate StartEndPeriodCriteria', () => {
		it('should return a OffsetToProperty instance with the given value when key is "monthPeriod" and value is provided', () => {
			const input = { monthPeriod: 5 };
			const result = GenerateStartEndPeriodCriteria();
			result.validateRows({ rows: [input], location: 'test' });
			expect(result).toBeInstanceOf(StartEndPeriodCriteria);
		});

		it('should return OffsetToProperty key', () => {
			const input = { offsetToAsOf: 5 };
			const result = GenerateStartEndPeriodCriteria();
			expect(result).toBeInstanceOf(StartEndPeriodCriteria);
			result.validateRows({ rows: [input], location: 'test' });
			expect(result.key).toEqual('offsetToAsOf');
		});
	});

	// GENERATE DATES ROW PROPERTY
	describe('GenerateDatesRow', () => {
		it('DatesRowProperty should return a DatesRowProperty instance', () => {
			const result = GenerateStartEndDatesCriteria();
			expect(result).toBeInstanceOf(StartEndDatesCriteria);
		});
	});

	// GENERATE FLAT ROW PROPERTY
	describe('GenerateFlatRow', () => {
		it('should return a FlatRowProperty instance with the given value when key is "entireWellLife" and value is provided', () => {
			const result = GenerateFlatRowCriteria();

			expect(result).toBeInstanceOf(FlatRowCriteria);
		});

		it('should return a default FlatRowProperty instance when key is "entireWellLife" and value is not provided', () => {
			const result = GenerateFlatRowCriteria();

			expect(result).toBeInstanceOf(FlatRowCriteria);
			expect(result.entireWellLife).toBeUndefined();
		});

		it('should return a default FlatRowProperty instance when key is not "entireWellLife"', () => {
			const result = GenerateFlatRowCriteria();

			expect(result).toBeInstanceOf(FlatRowCriteria);
			expect(result.entireWellLife).toBeUndefined();
		});

		it('should return a default FlatRowProperty instance when no input is provided', () => {
			const result = GenerateFlatRowCriteria();

			expect(result).toBeInstanceOf(FlatRowCriteria);
			expect(result.entireWellLife).toBeUndefined();
		});
	});
});
