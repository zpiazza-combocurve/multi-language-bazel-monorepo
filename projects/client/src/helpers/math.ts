import {
	ceilFloat,
	daysToMS,
	fixedFloat,
	floorFloat,
	isDate,
	isInt,
	isNumber,
	isNumberAndNotZero,
	msToDays,
	myBisect,
} from '@combocurve/forecast/helpers';
import _ from 'lodash';

import { idxArray, standardNormalTable } from './stdNormalTables';

// TODO no need to reexport utils here, import directly from inpt-shared
export { ceilFloat, daysToMS, fixedFloat, floorFloat, isDate, isInt, isNumber, isNumberAndNotZero, msToDays, myBisect };

/** Divides two fields, see test cases for dealing with null values. otherwise it is (a/b)/constant */
export const safeDivide = (num?: number | null, denom?: number | null, constant = 1) => {
	if (!Number.isFinite(denom) || denom === 0) {
		return null;
	}
	if (!Number.isFinite(num)) {
		return null;
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	return num! / denom! / constant;
};

export const intersect = <T>(arrIn: T[][]) => {
	const arr = _.cloneDeep(arrIn);
	arr.forEach((row) => row.sort((a, b) => (a < b ? -1 : 1)));
	arr.sort((a, b) => {
		if (a.length === b.length) {
			if (a[0] < b[0]) {
				return -1;
			}

			return 1;
		}
		if (a.length < b.length) {
			return -1;
		}

		return 1;
	});

	let output = _.cloneDeep(arr[0]);
	for (let i = 0, len = arr.length; i < len; i++) {
		const temp: T[] = [];
		for (let j = 0, k = 0, tempLen = output.length; j < tempLen && k < arr[i].length; ) {
			if (output[j] < arr[i][k]) {
				j++;
			} else if (output[j] > arr[i][k]) {
				k++;
			} else {
				temp.push(output[j]);
				j++;
				k++;
			}
		}

		output = temp;
	}

	return output;
};

export const sum = (arr, defaultValue = 0) => {
	const filteredByNumbers = arr?.filter((value) => isNumber(value));
	if (!filteredByNumbers?.length) {
		return defaultValue;
	}

	return filteredByNumbers.reduce((acc, value) => acc + value, 0);
};

export const createMatrix = (rowLength, colLength, defaultVal = 0) =>
	[...Array(rowLength)].map(() => [...Array(colLength)].map(() => defaultVal));

export const sumMatrixRows = (matrix) => {
	const rowLen = matrix[0]?.length || 0;
	const total = [...Array(rowLen)].map(() => 0);
	for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
		for (let colIdx = 0; colIdx < rowLen; colIdx++) {
			total[colIdx] += matrix[rowIdx][colIdx];
		}
	}

	return total;
};

export const getCumArr = (arr) => {
	let total = 0;
	return arr.map((val) => {
		total += val;
		return total;
	});
};

export const getMinMax = (arr) => {
	const filteredByNumbers = arr.filter((value) => isNumber(value));
	if (!filteredByNumbers?.length) {
		return [null, null];
	}

	return [Math.min(...filteredByNumbers), Math.max(...filteredByNumbers)];
};

export function alignProductionAlt(productionData, phase) {
	if (!productionData.length) {
		return productionData;
	}
	// get the index for each well's highest value
	const maxes = new Array(productionData.length);

	productionData.forEach(({ production }, wellIndex) => {
		let max = -Infinity;
		let maxIndex = -1;
		production.forEach((data) => {
			const y = data[phase];
			if (y > max) {
				max = y;
				maxIndex = data.index;
			}
		});
		maxes[wellIndex] = maxIndex;
	});

	// get differential of max index for all wells from the max index of the first well
	const diffs = maxes.map((maxIndex) => (maxIndex === -1 ? 0 : maxIndex));

	// produce the shifted index arrays and get the first index for each well to determine the smallest first
	const output = productionData.map(({ production, ...rest }, wellIndex) => ({
		...rest,
		production: production.map(({ index, ...data }) => ({
			...data,
			index: index - diffs[wellIndex],
		})),
	}));

	return output;
}

export function alignProduction(productionData, phase) {
	if (!productionData.length) {
		return productionData;
	}
	// get the index for each well's highest value
	const maxes = new Array(productionData.length);

	productionData.forEach(({ production }, wellIndex) => {
		let max = -Infinity;
		let maxIndex = -1;
		production.forEach((data) => {
			const y = data[phase];
			if (y > max) {
				max = y;
				maxIndex = data.index;
			}
		});
		maxes[wellIndex] = maxIndex;
	});

	// get differential of max index for all wells from the max index of the first well
	const diffs = maxes.map((maxIndex) => (maxIndex === -1 ? 0 : maxIndex - maxes[0]));

	// produce the shifted index arrays and get the first index for each well to determine the smallest first
	const output = productionData.map(({ production, ...rest }, wellIndex) => ({
		...rest,
		production: production.map(({ index, ...data }) => ({
			...data,
			index: index - diffs[wellIndex],
		})),
	}));

	// add min to all index values so that the minimum index will always start at 0
	const mins = output.map(({ production }) =>
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		production.length ? _.minBy<any>(production, 'index')?.index : Infinity
	);
	const minIndex = Math.min(...mins);

	if (Number.isFinite(minIndex)) {
		output.forEach(({ production }) => {
			production.forEach((data) => {
				data.index -= minIndex;
			});
		});
	}

	return output;
}

export const alignProd = (arr: { index; production }[]) => {
	const maxes: { max: number; index: number }[] = [];

	// get all maxes and the index value at the max
	for (let i = 0, inputLen = arr.length; i < inputLen; i++) {
		// assume index times are already sorted
		const { index, production } = arr[i];

		let max = -Infinity;
		let maxIdx = 0;
		for (let j = 0, prodLen = production.length; j < prodLen; j++) {
			if (production[j] > max) {
				maxIdx = j;
				max = production[j];
			}
		}

		maxes.push({
			max,
			index: index[maxIdx],
		});
	}

	// get differential of max index for all wells from the max index of the first well
	const diffArr: number[] = [];
	const refIdx = maxes[0].index;
	for (let i = 0, maxesLen = maxes.length; i < maxesLen; i++) {
		diffArr.push(maxes[i].index - refIdx);
	}

	// produce the shifted index arrays and get the first index for each well to determine the smallest first
	const firsts: number[] = [];
	const output = _.cloneDeep(arr);
	for (let i = 0, outLen = output.length; i < outLen; i++) {
		const { index } = output[i];
		for (let j = 0, idxLen = index.length; j < idxLen; j++) {
			output[i].index[j] -= diffArr[i];
		}

		firsts.push(index[0]);
	}

	// add min to all index values so that the minimum index will always start at 0
	const min = Math.min(...firsts);
	for (let i = 0, outLen = output.length; i < outLen; i++) {
		const { index } = output[i];
		for (let j = 0, idxLen = index.length; j < idxLen; j++) {
			output[i].index[j] -= min;
		}
	}

	return output;
};

function quantile(array, percentile) {
	const index = (percentile / 100) * (array.length - 1);
	let result;
	if (Math.floor(index) === index) {
		result = array[index];
	} else {
		const i = Math.floor(index);
		const fraction = index - i;
		result = array[i] + (array[i + 1] - array[i]) * fraction;
	}
	return result;
}

/**
 * @param {number[]} values List of values
 * @param {number[]} percentiles List of percentiles
 * @param {boolean} [sorted] If the array is sorted or not Default is `false`
 * @returns {number[]} List of percentile values
 */

export function calculatePercentile(values, percentiles, sorted = false) {
	const filteredArray = values.filter((value) => isNumber(value));
	if (!filteredArray?.length) {
		return Array(percentiles.length).fill(null);
	}

	const sortedArray = sorted ? filteredArray : [...filteredArray].sort((a, b) => a - b);

	return percentiles.map((p) => quantile(sortedArray, 100 - p));
}

export const mean = (arr, useOriginalLength = false) => {
	const filteredByNumbers = arr.filter((value) => Number.isFinite(value));
	if (!filteredByNumbers?.length) {
		// throw new Error('No valid number values'); maybe throw an error
		return null;
	}

	return (
		filteredByNumbers.reduce((acc, value) => acc + value, 0) / (useOriginalLength ? arr : filteredByNumbers).length
	);
};

/** @see https://en.wikipedia.org/wiki/Standard_deviation#Population_standard_deviation_of_grades_of_eight_students Defaults to Bessel's correction. Set isPopulation = true if you do not want to use Bessel's correction. */
export const stDev = (arr, isPopulation = false): number | null => {
	const filteredByNumbers = arr.filter((value) => Number.isFinite(value));
	if (!filteredByNumbers?.length) {
		return null;
	}
	const denom = isPopulation ? filteredByNumbers.length : filteredByNumbers.length - 1;
	const average = mean(filteredByNumbers);
	if (!average) return null;
	return (filteredByNumbers.reduce((acc, value) => acc + (value - average) ** 2, 0) / denom) ** 0.5;
};

/**
 * Calculates r2 coefficient
 *
 * @param yTrue_ The true y values
 * @param yPred_ The predicate y values
 * @see https://scikit-learn.org/stable/modules/generated/sklearn.metrics.r2_score.html
 * @see https://github.com/insidepetroleum/python-combocurve/blob/master/science/core_function/error_funcs.py#L61-L71
 */
export const calculateR2Coefficient = (yTrue_: (number | null)[], yPred_: (number | null)[]) => {
	if (yTrue_.length !== yPred_.length) {
		throw new Error('Arrays should be same length');
	}
	// TODO improve stripping of nulls
	let yTrue: (number | undefined | null)[] = [...yTrue_];
	let yPred: (number | undefined | null)[] = [...yPred_];
	yTrue.forEach((value, i) => {
		if (!Number.isFinite(value)) {
			yTrue[i] = undefined;
			yPred[i] = undefined;
		}
	});
	yPred.forEach((value, i) => {
		if (!Number.isFinite(value)) {
			yTrue[i] = undefined;
			yPred[i] = undefined;
		}
	});
	yTrue = yTrue.filter((p) => p !== undefined) as number[];
	yPred = yPred.filter((p) => p !== undefined) as number[];
	const meanValue = mean(yTrue);
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const ssTotal = (yTrue as number[]).reduce((acc, value) => acc + (value - meanValue!) ** 2, 0); // TODO check meanValue is not null
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const ssRes = (yTrue as number[]).reduce((acc, _value, i) => acc + (yTrue[i]! - yPred[i]!) ** 2, 0);
	// TODO use a close function
	if (ssRes === 0) {
		return 1;
	}
	if (ssTotal === 0) {
		return 0;
	}
	const r2 = 1 - ssRes / ssTotal;
	if (r2 < 0) {
		return 0;
	}
	return r2;
};

/**
 * Calculate the chi squared statistic of the categorical data.
 *
 * @param expected An array of non-negative ints representing the expected number of observations in each bin.
 * @param observed An array of non-negative ints representing the actual number of observations in each bin.
 * @returns The number representing the chi squared statistic of the data.
 * @see https://en.wikipedia.org/wiki/Chi-squared_test
 */
export const calculateChiSquared = (expected: number[], observed: number[]) => {
	const expectedNumber = expected.length ?? null;
	const observedNumber = observed.length ?? null;
	if (!expectedNumber || !observedNumber || expectedNumber !== observedNumber) {
		throw new Error('Expected and observed arrays must have the same length.');
	}
	return expected.reduce((running, e, i) => running + (observed[i] - e) ** 2 / e);
};

/**
 * Calculate cumulative values between 2 time, given 2 reference point, interpolate by linear
 *
 * @param leftPoint [leftT, leftV]
 * @param rightPoint [rightT, rightV]
 * @param calculateBetween The cumulative which should be calculated between, left and right inclusive
 * @returns Cumulative
 */

export const cumBetweenPoints = (leftPoint: number[], rightPoint: number[], calculateBetween: number[]) => {
	const [leftT, leftV_] = leftPoint;
	const [rightT, rightV_] = rightPoint;
	const [cumStart, cumEnd] = calculateBetween;

	const [leftV, rightV] = [leftV_ ?? 0, rightV_ ?? 0];

	if (leftT >= rightT) {
		throw new Error('Left start should be strictly less than right start');
	}

	if (cumStart > cumEnd) {
		throw new Error('Cum start should be less than or equal to cum end');
	}

	const slope = (rightV - leftV) / (rightT - leftT);
	const cumStartV = leftV + (cumStart - leftT) * slope;
	const cumEndV = leftV + (cumEnd - leftT) * slope;
	return ((cumStartV + cumEndV) * (cumEnd - cumStart + 1)) / 2;
};

/**
 * Get the value of a time, given 2 reference point, interpolate by linear
 *
 * @param leftPoint [leftT, leftV]
 * @param rightPoint [rightT, rightV]
 * @param targetT The x value of the interested point
 * @returns Cumulative
 */

export const linearExtrapolateFrom2Points = (
	leftPoint: [number, number],
	rightPoint: [number, number],
	targetT: number
) => {
	const [leftT, leftV = 0] = leftPoint;
	const [rightT, rightV = 0] = rightPoint;

	if (leftT >= rightT) {
		throw new Error('Left start should be strictly less than right start');
	}

	const slope = (rightV - leftV) / (rightT - leftT);
	return leftV + (targetT - leftT) * slope;
};

/**
 * Check if arr is sorted
 *
 * @see https://codehandbook.org/check-if-an-array-sorted-javascript/
 */
function isSorted(arr: number[]) {
	let second_index;
	for (let first_index = 0; first_index < arr.length; first_index++) {
		second_index = first_index + 1;
		if (arr[second_index] - arr[first_index] < 0) {
			return false;
		}
	}
	return true;
}

/**
 * Calculate cumulative of all time of discrete data
 *
 * @param timeArr
 * @param valueArr
 * @param cumStartTime
 */
export const discreteDataSelfCum = (timeArr: number[], valueArr: number[], cumStartTime: number) => {
	let curCum = 0;
	return timeArr.map((t, i) => {
		if (t < cumStartTime) {
			return 0;
		}
		let thisCum;
		if (i === 0) {
			if (timeArr.length >= 2) {
				thisCum = cumBetweenPoints(
					[timeArr[0], valueArr[0]],
					[timeArr[1], valueArr[1]],
					[cumStartTime, timeArr[0]]
				);
			} else if (timeArr.length === 1) {
				// extrapolate or not is a question here, do not extrapolate for simplicity
				thisCum = (timeArr[0] - cumStartTime + 1) * valueArr[0];
			} else {
				thisCum = 0;
			}
			curCum += thisCum;
			return curCum;
		}

		if (timeArr[i - 1] < cumStartTime) {
			// timeArr[i-1] < cumStartTime <= t
			curCum += cumBetweenPoints(
				[timeArr[i - 1], valueArr[i - 1]],
				[timeArr[i], valueArr[i]],
				[cumStartTime, timeArr[i]]
			);
			return curCum;
		}

		curCum += cumBetweenPoints(
			[timeArr[i - 1], valueArr[i - 1]],
			[timeArr[i], valueArr[i]],
			[timeArr[i - 1] + 1, timeArr[i]]
		);
		return curCum;
	});
};

/**
 * Calculate cumulative value from some discrete data points
 *
 * @param {numbers[]} timeArr The time of discrete data
 * @param {numbers[]} valueArr The value of discrete data
 * @param {number} cumStartTime The time from which cumulative should be calculated
 * @param {numbers[]} cumTimeArr The time where we want to calculate the cumulatives
 * @returns {numbers[]} Same dimenstion as cumTimeArr
 */

export const cumFromDiscreteData = ({ timeArr, valueArr, cumStartTime, cumTimeArr, checkValidity = false }) => {
	if (checkValidity) {
		if (!isSorted(timeArr)) {
			throw new Error('discrete data time arr should be sorted');
		}
		if (!isSorted(cumTimeArr)) {
			throw new Error('cum time arr should be sorted');
		}
	}
	// performance is not optimized, but this way is easier to understand & read
	const tickCum = discreteDataSelfCum(timeArr, valueArr, cumStartTime);

	let curTickIdx = -1; // should satisfy timeArr[curTickIdx] <= t < timeArr[curTickIdx + 1]
	return cumTimeArr.map((t) => {
		if (t < cumStartTime) {
			return { cum: 0, rate: 0 };
		}

		if (t >= timeArr[timeArr.length - 1]) {
			return {
				cum: tickCum[timeArr.length - 1],
				rate: t === timeArr[timeArr.length - 1] ? valueArr[valueArr.length - 1] : null,
			};
		}

		// cumStartTime <= t < timeArr[-1]
		// upadte curTickIdx first
		if (curTickIdx === -1) {
			curTickIdx = timeArr.findIndex((tickTime) => t < tickTime) - 1;
		} else {
			while (timeArr[curTickIdx + 1] <= t) {
				// gauranteed that curTickIdx + 1 < timeArr.length
				curTickIdx += 1;
			}
		}
		// decide what is the current value
		if (curTickIdx === -1) {
			return { cum: (t - cumStartTime + 1) * valueArr[0], rate: valueArr[0] };
		}

		if (timeArr[curTickIdx] <= cumStartTime && cumStartTime < timeArr[curTickIdx + 1]) {
			const leftPoint = [timeArr[curTickIdx], valueArr[curTickIdx]] as [number, number];
			const rightPoint = [timeArr[curTickIdx + 1], valueArr[curTickIdx + 1]] as [number, number];
			const v = cumBetweenPoints(leftPoint, rightPoint, [cumStartTime, t]);
			return { cum: v, rate: linearExtrapolateFrom2Points(leftPoint, rightPoint, t) };
		}

		if (timeArr[curTickIdx] === t) {
			return { cum: tickCum[curTickIdx], rate: valueArr[curTickIdx] };
		}

		const leftPoint = [timeArr[curTickIdx], valueArr[curTickIdx]] as [number, number];
		const rightPoint = [timeArr[curTickIdx + 1], valueArr[curTickIdx + 1]] as [number, number];
		const v = tickCum[curTickIdx] + cumBetweenPoints(leftPoint, rightPoint, [timeArr[curTickIdx] + 1, t]);

		return { cum: v, rate: linearExtrapolateFrom2Points(leftPoint, rightPoint, t) };
	});
};

/*
 * Cumulative distribution function
 *  see https://en.wikipedia.org/wiki/Normal_distribution#Cumulative_distribution_functions
 *  mean = 0, std = 1
 */
export const stdNormCdf = (x) => {
	if (x <= -10) {
		return standardNormalTable[0];
	}
	const wholePart = Math.floor(x);
	const mantissa = Math.floor((x - wholePart) * 100);
	const remainder = x - wholePart - mantissa / 100;
	const seek = (wholePart + 10) * 100 + mantissa;
	if (seek - 1 > standardNormalTable.length) {
		return 1;
	}
	const a = 1 - remainder * 100;
	const b = remainder * 100;
	const nextSeek = seek > standardNormalTable.length ? 1 : standardNormalTable[seek + 1];
	return standardNormalTable[seek] * a + nextSeek * b;
};

/*
 * Probit function
 * This is the inverse function of the stdNormalCdf
 * see https://en.wikipedia.org/wiki/Probit
 */
export const probit = (x) => {
	if (x <= standardNormalTable[0]) {
		return -10;
	} else if (x >= 1) {
		return -10 + (standardNormalTable.length - 1) * 0.01;
	}
	let vals = standardNormalTable;
	let indices = idxArray;
	while (vals.length > 2) {
		const mid = Math.floor((vals.length - 1) / 2);
		if (x < vals[mid]) {
			vals = vals.slice(0, mid);
			indices = indices.slice(0, mid);
		} else {
			vals = vals.slice(mid);
			indices = indices.slice(mid);
		}
	}
	if (indices.length === 1) {
		return -10 + indices[0] * 0.01;
	} else {
		const offset = (x - vals[0]) / (vals[1] - vals[0]);
		return -10 + (indices[0] + offset) * 0.01;
	}
};

/**
 * Given a numeric range and an amount of subdivisions (which include the start and end of the range), determine the
 * value of the nth subdivision.
 *
 * @param {number} start The lower limit of the range of values.
 * @param {number} end The upper limit of the range of values.
 * @param {number} totalSteps The total amount of steps, which include the start and end of the range. Must be greater
 *   than or equal to 2.
 * @param {number} step The index (0 based) of the step to determine.
 * @returns {numbers[]} The value of the step with index `step`.
 */
export const interpolate = (start: number, end: number, totalSteps: number, step: number) => {
	if (totalSteps < 2) {
		throw new Error('`totalSteps` must be greater than or equal to 2');
	}
	return start + ((end - start) * step) / (totalSteps - 1);
};
