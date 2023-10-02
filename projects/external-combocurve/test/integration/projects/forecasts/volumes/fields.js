const toApiForecastVolumes = (volumes, project, forecast, forecastOutputs) => {
	return volumes.map((volume) => {
		volume.project = project.id;
		volume.forecast = forecast.id;
		volume.well = volume.well.toString();
		volume.phases.forEach((phase) => {
			const forecastOutput = forecastOutputs.find(
				(output) => output.phase == phase.phase && output.well == volume.well,
			);

			phase.forecastOutputId = forecastOutput._id.toString();
			phase.series.forEach((series) => {
				series.startDate = series.startDate.toISOString();
				series.endDate = series.endDate.toISOString();
			});

			if (phase.ratio) {
				phase.ratio.startDate = phase.ratio.startDate.toISOString();
				phase.ratio.endDate = phase.ratio.endDate.toISOString();
			} else {
				delete phase.ratio;
			}
		});

		return volume;
	});
};

module.exports = {
	toApiForecastVolumes,
};
