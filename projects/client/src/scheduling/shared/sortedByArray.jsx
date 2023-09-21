export function sortedByArray(arr, ids, idKey = '_id') {
	return arr.reduce((result, obj) => {
		const index = ids.indexOf(obj[idKey]);
		result[index] = obj; // eslint-disable-line
		return result;
	}, []);
}
