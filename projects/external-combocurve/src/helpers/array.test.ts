import { multiplyArrayValues, range } from './array';

describe('helpers/array multiplyArrayValues', () => {
	it.each([
		[
			[1, 1, 1],
			[2, 2, 2],
			[2, 2, 2],
		],
		[
			[1, 2, 3],
			[5, 5, 5],
			[5, 10, 15],
		],
		[[1, 2, 3], [5], [5, 0, 0]],
		[[1], [5, 5, 5], [5, 0, 0]],
		[[], [5, 5, 5], [0, 0, 0]],
		[[], [], []],
	])(
		'should return result array with length equal to largest input array containing product of array values',
		(inputArray1: Array<number>, inputArray2: Array<number>, expectedResult: Array<number>) => {
			const result = multiplyArrayValues(inputArray1, inputArray2);

			expect(result).toEqual(expectedResult);
		},
	);

	test('should return zero filled array when one array input is undefined', () => {
		const inputArray = [1, 2, 3];
		let result = multiplyArrayValues(undefined as unknown as Array<number>, inputArray);
		const expectedResult = [0, 0, 0];

		expect(result).toEqual(expectedResult);

		result = multiplyArrayValues(inputArray, undefined as unknown as Array<number>);

		expect(result).toEqual(expectedResult);
	});

	test('should return empty array when both input arrays are undefined', () => {
		const result = multiplyArrayValues(
			undefined as unknown as Array<number>,
			undefined as unknown as Array<number>,
		);
		const expectedResult: Array<number> = [];

		expect(result).toEqual(expectedResult);
	});
});

describe('helpers/array range', () => {
	test('should return inclusive array with range of whole numbers', () => {
		const start = 12;
		const end = 17;
		const expectedResult = [12, 13, 14, 15, 16, 17];

		const result = range(start, end);

		expect(result).toEqual(expectedResult);
	});

	test('when start and end are the same should return array with single value', () => {
		const start = 12;
		const expectedResult = [12];

		const result = range(start, start);

		expect(result).toEqual(expectedResult);
	});

	test('when start value is fractional should return inclusive array with range of whole numbers', () => {
		const start = 12.123;
		const end = 17;
		const expectedResult = [12, 13, 14, 15, 16, 17];

		const result = range(start, end);

		expect(result).toEqual(expectedResult);
	});

	test('when start is greater than end should return empty array', () => {
		const start = 17;
		const end = 12;
		const expectedResult: Array<number> = [];

		const result = range(start, end);

		expect(result).toEqual(expectedResult);
	});
});
