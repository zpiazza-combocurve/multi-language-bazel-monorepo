const toApiScenario = ({ _id, createdAt, name, updatedAt }) => ({
	id: _id.toString(),
	name,
	createdAt,
	updatedAt,
});

module.exports = {
	toApiScenario,
};
