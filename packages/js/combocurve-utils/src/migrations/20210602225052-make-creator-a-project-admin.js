async function up({ db }) {
	const projects = await db.collection('projects').find({}, { _id: 1, createdBy: 1 }).toArray();

	const accessPolicies = projects.map(({ _id: resourceId, createdBy: memberId }) => ({
		updateOne: {
			filter: {
				memberType: 'users',
				memberId,
				resourceType: 'project',
				resourceId,
			},
			update: {
				$push: {
					roles: 'project.project.admin',
				},
			},
			upsert: true,
		},
	}));

	if (accessPolicies.length) {
		await db.collection('access-policies').bulkWrite(accessPolicies);
	}
}

module.exports = { up, uses: ['mongodb'] };
