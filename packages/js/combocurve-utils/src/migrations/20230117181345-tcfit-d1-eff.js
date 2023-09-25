// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
const phases = ['oil', 'gas', 'water'];
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { createBatchUpdate } = require('../services/helpers/migrations/batch-updater-v2');

const configsUp = async ({ db }) => {
	const bulkSaveArray = [];
	const configs = db.collection('forecast-configurations');

	await configs.find().forEach(function (config) {
		const { _id: configId, tcFitForm } = config;
		if (!tcFitForm) return;

		const { configurations: tcFitConfigs } = tcFitForm;
		if (!tcFitConfigs) return;

		let saveConfig = false;

		const newConfigurations = _.mapValues(tcFitConfigs, (configuration) => {
			const { configuration: fitFormConfig, name } = configuration;
			if (!fitFormConfig) return configuration;
			phases.forEach((phase) => {
				const phaseConfig = fitFormConfig?.[phase];
				if (!phaseConfig) return;

				const { D1_eff } = phaseConfig;
				if (D1_eff[0] === 0) {
					saveConfig = true;
					D1_eff[0] = 1;
					fitFormConfig[phase] = { ...phaseConfig, D1_eff };
				}
			});
			return { name, configuration: fitFormConfig };
		});

		if (saveConfig) {
			bulkSaveArray.push({
				updateOne: {
					filter: { _id: configId },
					update: { $set: { 'tcFitForm.configurations': newConfigurations } },
				},
			});
		}
	});

	if (bulkSaveArray.length) {
		configs.bulkWrite(bulkSaveArray);
	}
};

const configsDown = async ({ db }) => {
	const bulkSaveArray = [];
	const configs = db.collection('forecast-configurations');

	await configs.find().forEach(function (config) {
		const { _id: configId, tcFitForm } = config;
		if (!tcFitForm) return;

		const { configurations: tcFitConfigs } = tcFitForm;
		if (!tcFitConfigs) return;

		let saveConfig = false;

		const newConfigurations = _.mapValues(tcFitConfigs, (configuration) => {
			const { configuration: fitFormConfig, name } = configuration;
			if (!fitFormConfig) return configuration;

			phases.forEach((phase) => {
				const phaseConfig = fitFormConfig?.[phase];
				if (!phaseConfig) return;

				const { D1_eff } = phaseConfig;
				if (D1_eff[0] === 1) {
					saveConfig = true;
					D1_eff[0] = 0;
					fitFormConfig[phase] = { ...phaseConfig, D1_eff };
				}
			});
			return { name, configuration: fitFormConfig };
		});

		if (saveConfig) {
			bulkSaveArray.push({
				updateOne: {
					filter: { _id: configId },
					update: { $set: { 'tcFitForm.configurations': newConfigurations } },
				},
			});
		}
	});

	if (bulkSaveArray.length) {
		configs.bulkWrite(bulkSaveArray);
	}
};

const batchUpTcFits = createBatchUpdate({
	collection: 'type-curve-fits',
	query: { 'settings.D1_eff.0': 0 },
	update: [
		{ $set: { temp: { $arrayElemAt: ['$settings.D1_eff', 1] } } },
		{ $set: { 'settings.D1_eff': [1, '$temp'] } },
		{
			$unset: 'temp',
		},
	],
});

const batchDownTcFits = createBatchUpdate({
	collection: 'type-curve-fits',
	query: { 'settings.D1_eff.0': 1 },
	update: [
		{ $set: { temp: { $arrayElemAt: ['$settings.D1_eff', 1] } } },
		{ $set: { 'settings.D1_eff': [0, '$temp'] } },
		{
			$unset: 'temp',
		},
	],
});

async function up({ db }) {
	await Promise.all([configsUp({ db }), batchUpTcFits({ db })]);
}

async function down({ db }) {
	await Promise.all([configsDown({ db }), batchDownTcFits({ db })]);
}

module.exports = { up, down, uses: ['mongodb'] };
