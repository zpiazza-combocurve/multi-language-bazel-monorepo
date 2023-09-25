// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchBulkUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const DAILY_PRODUCTION_FIELDS = [
	'oil',
	'gas',
	'water',
	'choke',
	'hours_on',
	'gas_lift_injection_pressure',
	'bottom_hole_pressure',
	'tubing_head_pressure',
	'flowline_pressure',
	'casing_head_pressure',
	'operational_tag',
	'vessel_separator_pressure',
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

const DAILY_ARRAY_SIZE = 31;

const getUpdate = (doc) => {
	const updates = DAILY_PRODUCTION_FIELDS.filter(
		(field) => doc[field] !== undefined && !Array.isArray(doc[field])
	).reduce((acc, field) => {
		const arr = new Array(DAILY_ARRAY_SIZE).fill(null);
		Object.entries(doc[field]).forEach(([key, value]) => {
			const index = +key;
			if (Number.isInteger(index) && index < DAILY_ARRAY_SIZE) {
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
	collection: 'daily-productions',
	selection: DAILY_PRODUCTION_FIELDS.reduce((acc, field) => {
		acc[field] = 1;
		return acc;
	}, {}),
	batchSize: 1000,
	query: {
		$or: DAILY_PRODUCTION_FIELDS.map((field) => ({
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
