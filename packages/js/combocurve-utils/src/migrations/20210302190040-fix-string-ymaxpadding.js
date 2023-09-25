// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { asyncSeries } = require('../services/helpers/utilities');

const getConfigs = (forecastConfig, configKey) =>
	Object.entries((forecastConfig[configKey] && forecastConfig[configKey].configurations) || {}).map(([k, v]) => [
		`${configKey}.configurations.${k}`,
		v,
	]);

async function up({ db }) {
	const collection = db.collection('forecast-configurations');
	const forecastConfigs = await collection.find().toArray();
	await asyncSeries(forecastConfigs, async (config) => {
		const update = [...getConfigs(config, 'deterministicGridChart'), ...getConfigs(config, 'comparisonGridChart')]
			.filter(
				([, { configuration }]) =>
					typeof (configuration && configuration.graphSettings && configuration.graphSettings.yMaxPadding) ===
					'string'
			)
			.reduce(
				(upd, [key, { configuration }]) => ({
					...upd,
					[`${key}.configuration.graphSettings.yMaxPadding`]: +configuration.graphSettings.yMaxPadding,
				}),
				{}
			);
		if (Object.keys(update).length > 0) {
			return collection.updateOne({ _id: config._id }, { $set: update });
		}
		return Promise.resolve();
	});
}

module.exports = { up, uses: ['mongodb'] };
