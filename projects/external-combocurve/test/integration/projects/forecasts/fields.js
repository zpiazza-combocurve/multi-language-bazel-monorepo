const toApiForecast = ({ _id, name, type, running, runDate }) => ({
	id: _id.toString(),
	name,
	type,
	running,
	runDate,
});

module.exports = {
	toApiForecast,
};
