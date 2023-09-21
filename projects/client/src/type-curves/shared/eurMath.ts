import { sortIndexes } from '@/helpers/utilities';

/**
 * Quantile calculs same as python numpy.percentile with interpolation='linear'
 *
 * ```py
 * import numpy
 * a=[2, 4, 7, 10]
 * for p in [0, 25, 33, 50, 66, 75, 100] : print numpy.percentile(a, p, interpolation='linear')
 * ```
 */

export function generatePercentileArr(array: number[]) {
	const sortidx = sortIndexes(array);
	const perc = sortIndexes(sortidx);
	return perc.map((p: number) => 1 - p / perc.length);
}
