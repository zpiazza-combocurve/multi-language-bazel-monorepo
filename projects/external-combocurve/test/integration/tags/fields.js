const toApiTag = (tag) => ({
	createdAt: tag.createdAt,
	updatedAt: tag.updatedAt,
	name: tag.name,
	description: tag.description,
});

const toBaseApiTag = (tag) => ({
	name: tag.name,
	description: tag.description,
});

module.exports = {
	toBaseApiTag,
	toApiTag,
};
