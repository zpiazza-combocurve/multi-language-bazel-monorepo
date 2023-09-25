// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const unsetPerms = (collection) =>
	createBatchUpdate({
		collection,
		query: { perms: { $exists: true } },
		update: {
			$unset: {
				perms: '',
			},
		},
	});

const unsetUsersFields = (collection) =>
	createBatchUpdate({
		collection,
		query: { role: { $exists: true } },
		update: {
			$unset: {
				role: '',
				displayRole: '',
				inActive: '',
			},
		},
	});

async function up({ db }) {
	await unsetPerms('projects')({ db });
	await unsetPerms('archived-projects')({ db });
	await unsetUsersFields('users')({ db });
}

module.exports = { up, uses: ['mongodb'] };
