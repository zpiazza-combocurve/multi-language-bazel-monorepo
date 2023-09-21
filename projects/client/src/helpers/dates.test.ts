import { isValidDate } from '@/helpers/dates';

describe('isValidDate', () => {
	test('null is not a date', () => {
		expect(isValidDate(null)).toBe(false);
	});

	test('undefined is not a date', () => {
		expect(isValidDate(undefined)).toBe(false);
	});

	test('a number is not a date', () => {
		expect(isValidDate(5)).toBe(false);
	});

	test('an empty string is not a date', () => {
		expect(isValidDate('')).toBe(false);
	});

	test('an valid date string is not a date', () => {
		expect(isValidDate(new Date().toISOString())).toBe(false);
	});

	test('an empty array is not a date', () => {
		expect(isValidDate([])).toBe(false);
	});

	test('an empty object is not a date', () => {
		expect(isValidDate({})).toBe(false);
	});

	test('an valid date is a date', () => {
		expect(isValidDate(new Date())).toBe(true);
	});
});
