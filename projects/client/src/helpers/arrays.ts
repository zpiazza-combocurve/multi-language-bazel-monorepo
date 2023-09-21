const EPSILON = 1e-10;

// given a sorted number array, returns a "similar" one in strictly ascending or strinctly descending order
// (i.e. no two elements are equal)
export const strictlyDifferent = (sortedArray: number[], { ascending = true } = {}): number[] => {
	const signedEpsilon = ascending ? EPSILON : -EPSILON;

	let equalCount = 0;

	return sortedArray.map((cur, i) => {
		if (i === 0 || cur !== sortedArray[i - 1]) {
			equalCount = 0;
			return cur;
		}
		equalCount += 1;
		return cur + signedEpsilon * equalCount;
	});
};
