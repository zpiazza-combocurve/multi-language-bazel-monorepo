import {
	calculateR2Coefficient,
	cumBetweenPoints,
	fixedFloat,
	interpolate,
	isInt,
	isNumber,
	isNumberAndNotZero,
	safeDivide,
} from './math';

describe('helpers/math', () => {
	test('isNumber()', () => {
		expect(isNumber(0)).toEqual(true);
		expect(isNumber(100)).toEqual(true);
		expect(isNumber(0.01)).toEqual(true);
		expect(isNumber(-1)).toEqual(true);
		expect(isNumber(-100)).toEqual(true);
		expect(isNumber(-123.123)).toEqual(true);
		expect(isNumber(null)).toEqual(false);
		expect(isNumber(undefined)).toEqual(false);
		expect(isNumber('test')).toEqual(false);
		expect(isNumber({})).toEqual(false);
		expect(isNumber([])).toEqual(false);
	});

	test('isNumberAndNotZero()', () => {
		expect(isNumberAndNotZero(0)).toEqual(false);
		expect(isNumberAndNotZero(100)).toEqual(true);
		expect(isNumberAndNotZero(0.01)).toEqual(true);
		expect(isNumberAndNotZero(-1)).toEqual(true);
		expect(isNumberAndNotZero(-100)).toEqual(true);
		expect(isNumberAndNotZero(-123.123)).toEqual(true);
		expect(isNumberAndNotZero(null)).toEqual(false);
		expect(isNumberAndNotZero(undefined)).toEqual(false);
		expect(isNumberAndNotZero('test')).toEqual(false);
		expect(isNumberAndNotZero({})).toEqual(false);
		expect(isNumberAndNotZero([])).toEqual(false);
	});

	test('isInt()', () => {
		expect(isInt(0)).toEqual(true);
		expect(isInt(100)).toEqual(true);
		expect(isInt(0.01)).toEqual(false);
		expect(isInt(-1)).toEqual(true);
		expect(isInt(-100)).toEqual(true);
		expect(isInt(-123.123)).toEqual(false);
		expect(isInt(null)).toEqual(false);
		expect(isInt(undefined)).toEqual(false);
		expect(isInt('test')).toEqual(false);
		expect(isInt({})).toEqual(false);
		expect(isInt([])).toEqual(false);
	});

	test('fixedFloat(val, 2)', () => {
		expect(fixedFloat(0, 2)).toEqual(0);
		expect(fixedFloat(100, 2)).toEqual(100);
		expect(fixedFloat(0.01, 2)).toEqual(0.01);
		expect(fixedFloat(0.001, 2)).toEqual(0);
		expect(fixedFloat(99.99, 2)).toEqual(99.99);
		expect(fixedFloat(99.999, 2)).toEqual(100);
		expect(fixedFloat(-1, 2)).toEqual(-1);
		expect(fixedFloat(-100, 2)).toEqual(-100);
		expect(fixedFloat(-123.123, 2)).toEqual(-123.12);
		expect(fixedFloat(-99.99, 2)).toEqual(-99.99);
		expect(fixedFloat(-99.999, 2)).toEqual(-100);
		expect(fixedFloat(null, 2)).toEqual(null);
		expect(fixedFloat(undefined, 2)).toEqual(null);
		expect(fixedFloat('test', 2)).toEqual(null);
		expect(fixedFloat({}, 2)).toEqual(null);
		expect(fixedFloat([], 2)).toEqual(null);
	});

	test('safeDivide() null if denom is null 0 or undefined', () => {
		expect(safeDivide(null, null)).toBe(null);
		expect(safeDivide(undefined, null)).toBe(null);
		expect(safeDivide(0, null)).toBe(null);
		expect(safeDivide(5, null)).toBe(null);
		expect(safeDivide(null)).toBe(null);
		expect(safeDivide()).toBe(null);
		expect(safeDivide(0)).toBe(null);
		expect(safeDivide(5)).toBe(null);
		expect(safeDivide(null, 0)).toBe(null);
		expect(safeDivide(undefined, 0)).toBe(null);
		expect(safeDivide(0, 0)).toBe(null);
		expect(safeDivide(5, 0)).toBe(null);
	});

	test('safeDivide() null if nominator is null or undefined', () => {
		expect(safeDivide(null, 5)).toBe(null);
		expect(safeDivide(undefined, 5)).toBe(null);
	});

	test('safeDivide() divides if both values are numbers', () => {
		expect(safeDivide(0, 5)).toBe(0);
		expect(safeDivide(10, 5)).toBe(2);
		expect(safeDivide(10, -5)).toBe(-2);
		expect(safeDivide(10, 5, 2)).toBe(1);
	});

	test('calculateR2Coefficient()', () => {
		expect(calculateR2Coefficient([3, -0.5, 2, 7], [2.5, 0.0, 2, 8])).toBeCloseTo(0.948);
		expect(calculateR2Coefficient([1, 2, 3], [1, 2, 3])).toBeCloseTo(1);
		expect(calculateR2Coefficient([1, 2, 3], [3, 2, 1])).toBeCloseTo(0);
		expect(calculateR2Coefficient([1, 1, 1], [1, 1, 1])).toBeCloseTo(1);
		expect(calculateR2Coefficient([1, 1, 1], [2, 2, 2])).toBeCloseTo(0);
	});
	test('calculateR2Coefficient() different size to raise warning', () => {
		expect(() => calculateR2Coefficient([1], [1, 2])).toThrow();
	});
	test('calculateR2Coefficient() if arrays length is 0 should return 1', () => {
		expect(calculateR2Coefficient([], [])).toBeCloseTo(1);
	});
	test('calculateR2Coefficient() should skip nulls', () => {
		expect(calculateR2Coefficient([null, 3, 4, -0.5, 2, 7], [1, 2.5, null, 0.0, 2, 8])).toBeCloseTo(0.948);
	});

	test('cumBetweenPoints()', () => {
		expect(cumBetweenPoints([1, 5], [5, 9], [1, 5])).toBe(35);
		expect(cumBetweenPoints([1, 9], [5, 5], [2, 4])).toBe(21);
		expect(cumBetweenPoints([1, 0], [3, 5], [2, 2])).toBe(2.5);
		expect(cumBetweenPoints([1, 0], [3, 5], [-2, 10])).toBe(97.5);
	});

	test('cumBetweenPoints() leftStart should be strictly less than rightStart', () => {
		expect(() => cumBetweenPoints([1, 2], [0, 3], [1, 2])).toThrow();
	});

	test('cumBetweenPoints() cumStart should be less than or equal cumEnd', () => {
		expect(() => cumBetweenPoints([1, 2], [2, 3], [1, 0])).toThrow();
	});

	test('interpolate()', () => {
		expect(interpolate(0, 4, 5, 3)).toBeCloseTo(3);
		expect(interpolate(0, 4, 5, 2)).toBeCloseTo(2);
		expect(interpolate(1, 5, 5, 3)).toBeCloseTo(4);
		expect(interpolate(0, 100, 21, 5)).toBeCloseTo(25);
		expect(interpolate(0, 100, 21, 0)).toBeCloseTo(0);
		expect(interpolate(0, 100, 21, 20)).toBeCloseTo(100);
	});
});
