const convertIdxToMilli = (idx) => {
	const val = idx * 24 * 60 * 60 * 1000;
	return new Date('1900-01-01').getTime() + val;
};

const convertIdxToDate = (idx) => {
	return new Date(convertIdxToMilli(idx));
};

module.exports = { convertIdxToDate };
