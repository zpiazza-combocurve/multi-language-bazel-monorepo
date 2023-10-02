/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
const {
	Types: { ObjectId },
} = require('mongoose');

const monthlyVolumes = [
	{
		project: ObjectId('62fc0449133c6c001360278f'),
		forecast: ObjectId('64148ebe4506d000126c6e2b'),
		resolution: 'monthly',
		well: ObjectId('62fc044e65e0050bccf5434d'),
		phases: [
			{
				forecastOutputId: ObjectId('5f235b064342c356a8a7ccd2'),
				phase: 'oil',
				ratio: undefined,
				series: [],
			},
			{
				forecastOutputId: ObjectId('5f235b064342c356a8a7ccd1'),
				phase: 'water',
				series: [],
				ratio: {
					eur: 511653.5001915499,
					basePhase: 'oil',
					startDate: new Date('2019-08-15T00:00:00.000Z'),
					endDate: new Date('2077-03-15T00:00:00.000Z'),
					volumes: [],
				},
			},
			{
				forecastOutputId: ObjectId('5f235b064342c356a8a7ccd3'),
				phase: 'gas',
				series: [],
				ratio: {
					eur: 428937.0362814385,
					basePhase: 'oil',
					startDate: new Date('2019-08-15T00:00:00.000Z'),
					endDate: new Date('2077-03-15T00:00:00.000Z'),
					volumes: [],
				},
			},
		],
	},
];

module.exports = {
	monthlyVolumes,
};
