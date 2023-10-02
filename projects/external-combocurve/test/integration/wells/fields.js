const setDefaultValues = (well) => ({
	...well,
	copied: well.copied || false,
});

module.exports = {
	setDefaultValues,
};
