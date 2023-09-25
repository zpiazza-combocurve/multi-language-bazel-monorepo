// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const AFFECTED_FIELD = [
	'completion_end_date',
	'completion_start_date',
	'custom_date_0',
	'custom_date_1',
	'custom_date_2',
	'custom_date_3',
	'custom_date_4',
	'custom_date_5',
	'custom_date_6',
	'custom_date_7',
	'custom_date_8',
	'custom_date_9',
	'date_rig_release',
	'drill_end_date',
	'drill_start_date',
	'first_prod_date',
	'gas_analysis_date',
	'permit_date',
	'refrac_date',
	'spud_date',
	'til',
];

const getUpdate = (doc) => {
	const updates = AFFECTED_FIELD.filter((field) => typeof doc[field] === 'string').reduce((acc, field) => {
		acc[field] = new Date(doc[field]);
		return acc;
	}, {});
	return {
		updateOne: {
			filter: { _id: doc._id },
			update: { $set: updates },
		},
	};
};

const batchUpdateUp = createBatchBulkUpdate({
	collection: 'wells',
	selection: AFFECTED_FIELD.reduce((acc, field) => {
		acc[field] = 1;
		return acc;
	}, {}),
	batchSize: 1000,
	query: {
		$or: AFFECTED_FIELD.map((field) => ({
			[field]: { $type: 'string' },
		})),
	},
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)),
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
