const toApiProject = (project) => ({
	id: project._id.toString(),
	name: project.name,
	createdAt: project.createdAt,
	updatedAt: project.updatedAt,
});

module.exports = {
	toApiProject,
};
