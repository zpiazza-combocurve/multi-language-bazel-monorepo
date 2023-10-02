import { range } from 'lodash';

/**
 * Returns an array of numbers from the start parameter to the end parameter with a step value of 1.
 *
 * @remarks
 * If the end parameter is larger than the start parameter an empty array is returned.
 *
 * @param start - The number to start the array
 * @param end - The number to end the array
 * @returns An array of numbers from start to end, stepping by one
 *
 */
function createRange(start: number, end: number): Array<number> {
	return range(Math.round(start), Math.round(end + 1), 1);
}

function multiplyArrayValues(array1: Array<number>, array2: Array<number>): Array<number> {
	let result: Array<number> = [];
	const [shortestLength, greatestLength] = [array1?.length ?? 0, array2?.length ?? 0].sort();

	for (let i = 0; i < shortestLength; i++) {
		result.push(array1[i] * array2[i]);
	}

	// If the arrays are not the same length pad the end of the result array with zeros to make up the difference
	if (shortestLength < greatestLength) {
		result = result.concat(Array(greatestLength - shortestLength).fill(0));
	}

	return result;
}

export { createRange as range, multiplyArrayValues };
