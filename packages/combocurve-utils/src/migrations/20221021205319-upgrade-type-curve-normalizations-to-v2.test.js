// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up, down } = require('./20221021205319-upgrade-type-curve-normalizations-to-v2');

let db;
let mongod;
let client;
let normalizationCollection;
let normalizationWellsCollection;

const normalizationsV1 = {
	phase: 'water',
	typeCurve: new ObjectId('63499c0076cfee00137c727f'),
	steps: [
		{
			rangeStart: 0.02,
			rangeEnd: 0.98,
			diverged: false,
			multiplier: 1,
			_id: new ObjectId('612e3827834226001523ee40'),
			key: 'normalize',
			name: 'Normalize',
			base: {
				key: 'eur_pll',
				x: {
					startFeature: 'perf_lateral_length',
					opChain: [],
				},
				y: {
					startFeature: '$PHASE_EUR',
					opChain: [],
				},
			},
			type: 'no_normalization',
		},
	],
};

const normalizationsV2 = {
	phase: 'water',
	typeCurve: new ObjectId('63499c0076cfee00137c727f'),
	steps: {
		eur: {
			rangeStart: 0.02,
			rangeEnd: 0.98,
			diverged: false,
			multiplier: 1,
			_id: new ObjectId('612e3827834226001523ee40'),
			key: 'normalize',
			name: 'Normalize',
			base: {
				key: 'eur_pll',
				x: {
					startFeature: 'perf_lateral_length',
					opChain: [],
				},
				y: {
					startFeature: '$PHASE_EUR',
					opChain: [],
				},
			},
			type: 'no_normalization',
		},
		qPeak: null,
		normalizationType: 'eur',
	},
};

const normalizationWellsV1 = {
	phase: 'water',
	typeCurve: new ObjectId('63514c8563e6580014659b22'),
	well: new ObjectId('5f727c256a283f0a590e06d6'),
	multipliers: [0.838093662026532],
};

const normalizationWellsV2 = {
	phase: 'water',
	typeCurve: new ObjectId('63514c8563e6580014659b22'),
	well: new ObjectId('5f727c256a283f0a590e06d6'),
	multipliers: { eur: 0.838093662026532, qPeak: 1 },
	nominalMultipliers: { eur: 0.838093662026532, qPeak: 1 },
};

beforeEach(async () => {
	({ db, mongod, client } = await setupDb());
	normalizationCollection = db.collection('type-curve-normalizations');
	normalizationWellsCollection = db.collection('type-curve-normalization-wells');
});

afterEach(async () => {
	await mongod.stop();
	await client.close();
});

describe('upgrade-type-curve-normalizations-to-v2', () => {
	test('up', async () => {
		await normalizationCollection.insertOne(normalizationsV1);
		await normalizationWellsCollection.insertOne(normalizationWellsV1);
		await up({ db });
		await up({ db });

		const normalizationDoc = await normalizationCollection.findOne();
		const normalizationWellsDoc = await normalizationWellsCollection.findOne();

		expect(normalizationDoc.steps.eur).toStrictEqual(normalizationsV2.steps.eur);
		expect(normalizationDoc.steps.normalizationType).toStrictEqual(normalizationsV2.steps.normalizationType);
		expect(normalizationWellsDoc.multipliers.eur).toStrictEqual(normalizationWellsV2.multipliers.eur);
		expect(normalizationWellsDoc.multipliers.qPeak).toStrictEqual(null);
		expect(normalizationWellsDoc.nominalMultipliers.eur).toStrictEqual(normalizationWellsDoc.multipliers.eur);
		expect(normalizationWellsDoc.nominalMultipliers.qPeak).toStrictEqual(null);
	});

	test('down', async () => {
		await normalizationCollection.insertOne(normalizationsV2);
		await normalizationWellsCollection.insertOne(normalizationWellsV2);
		await down({ db });
		await down({ db });

		const normalizationDoc = await normalizationCollection.findOne();
		const normalizationWellsDoc = await normalizationWellsCollection.findOne();

		expect(normalizationDoc.steps[0]).toStrictEqual(normalizationsV1.steps[0]);
		expect(normalizationWellsDoc.multipliers[0]).toStrictEqual(normalizationWellsV1.multipliers[0]);
	});
});
