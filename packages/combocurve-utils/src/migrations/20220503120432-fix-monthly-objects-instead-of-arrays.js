// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const MONTHLY_PRODUCTION_FIELDS = [
	'oil',
	'gas',
	'water',
	'operational_tag',
	'choke',
	'days_on',
	'gasInjection',
	'waterInjection',
	'co2Injection',
	'steamInjection',
	'ngl',
	'customNumber0',
	'customNumber1',
	'customNumber2',
	'customNumber3',
	'customNumber4',
];

const MONTHLY_ARRAY_SIZE = 12;

const getUpdate = (doc) => {
	const updates = MONTHLY_PRODUCTION_FIELDS.filter(
		(field) => doc[field] !== undefined && !Array.isArray(doc[field])
	).reduce((acc, field) => {
		const arr = new Array(MONTHLY_ARRAY_SIZE).fill(null);
		Object.entries(doc[field]).forEach(([key, value]) => {
			const index = +key;
			if (Number.isInteger(index) && index < MONTHLY_ARRAY_SIZE) {
				arr[index] = value;
			}
		});
		acc[field] = arr;
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
	collection: 'monthly-productions',
	selection: MONTHLY_PRODUCTION_FIELDS.reduce((acc, field) => {
		acc[field] = 1;
		return acc;
	}, {}),
	batchSize: 1000,
	query: {
		$or: MONTHLY_PRODUCTION_FIELDS.map((field) => ({
			$nor: [
				{
					[field]: { $exists: false },
				},
				{
					[field]: { $type: 'array' },
				},
			],
		})),
	},
	buildUpdates: (batch) => batch.map((doc) => getUpdate(doc)),
});

async function up({ db }) {
	await batchUpdateUp({ db });
}

module.exports = { up, uses: ['mongodb'] };
