import { ValidationError } from '@src/helpers/validation';
import { ValidationErrorAggregator } from '@src/api/v1/multi-error';

import { getDecimalScale, validateDecimalScale, validateKeyLength, validateMinMaxValues } from './helpers';

describe('v1/projects/econ-models/row-validations/helpers', () => {
	// VALIDATE MIN MAX VALUES
	describe('validateMinMaxValues', () => {
		it('should not throw any error when value is within the range', () => {
			expect(() => validateMinMaxValues('testProperty', 10, 5, 15)).not.toThrow();
		});

		it('should throw ValidationError when value is below the minimum', () => {
			const errorAggregator = new ValidationErrorAggregator();
			errorAggregator.catch(() => validateMinMaxValues('testProperty', 3, 5, 15));

			const errors = errorAggregator.getErrorEntries();
			expect(errors).toHaveLength(1);
			expect(errors[0].name).toBe('ValidationError');
			expect(errors[0].message).toBe('Invalid value for `testProperty`: 3 is less than the minimum of 5.');
		});

		it('should throw ValidationError when value is above the maximum', () => {
			const errorAggregator = new ValidationErrorAggregator();
			errorAggregator.catch(() => validateMinMaxValues('testProperty', 20, 5, 15));

			const errors = errorAggregator.getErrorEntries();
			expect(errors).toHaveLength(1);
			expect(errors[0].name).toBe('ValidationError');
			expect(errors[0].message).toBe('Invalid value for `testProperty`: 20 is greater than the maximum of 15.');
		});
	});

	// VALIDATE DECIMAL SCALE
	describe('validateDecimalScale', () => {
		it('should not throw any error when decimal scale is within the limit', () => {
			expect(() => validateDecimalScale(2, 'testProperty', 1.23)).not.toThrow();
		});

		it('should throw ValidationError when decimal scale is greater than the limit', () => {
			const errorAggregator = new ValidationErrorAggregator();
			errorAggregator.catch(() => validateDecimalScale(2, 'testProperty', 1.234));

			const errors = errorAggregator.getErrorEntries();
			expect(errors).toHaveLength(1);
			expect(errors[0].name).toBe('ValidationError');
			expect(errors[0].message).toBe(
				'Invalid value for `testProperty`: testProperty has a decimal scale of 3. Decimal scale can not be greater than 2.',
			);
		});
	});

	// GET DECIMAL SCALE
	describe('getDecimalScale', () => {
		it('should return the correct decimal scale for numbers without decimal points', () => {
			expect(getDecimalScale(10)).toBe(0);
			expect(getDecimalScale(42)).toBe(0);
		});

		it('should return the correct decimal scale for numbers with decimal points', () => {
			expect(getDecimalScale(1.23)).toBe(2);
			expect(getDecimalScale(0.01)).toBe(2);
			expect(getDecimalScale(123.456)).toBe(3);
		});

		it('should return the correct decimal scale for numbers in scientific notation', () => {
			expect(getDecimalScale(1.23e-5)).toBe(7);
			expect(getDecimalScale(5e-2)).toBe(2);
			expect(getDecimalScale(2.5e4)).toBe(0);
		});
	});

	// VALIDATE KEY LENGTH
	describe('validateKeyLength', () => {
		const location = 'test-location';

		it('should not throw an error for objects with the expected key length', () => {
			const row = { key1: 'value1', key2: 'value2' };
			const keyLength = 2;

			expect(() => validateKeyLength(row, location, keyLength)).not.toThrow();
		});

		it('should throw an error for objects with less than the expected key length', () => {
			const row = { key1: 'value1' };
			const keyLength = 2;

			expect(() => validateKeyLength(row, location, keyLength)).toThrow(ValidationError);
		});

		it('should throw an error for objects with more than the expected key length', () => {
			const row = { key1: 'value1', key2: 'value2', key3: 'value3' };
			const keyLength = 2;

			expect(() => validateKeyLength(row, location, keyLength)).toThrow(ValidationError);
		});
	});
});
