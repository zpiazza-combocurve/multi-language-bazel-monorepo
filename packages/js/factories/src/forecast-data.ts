import { Factory } from 'fishery';

import { initializeForecastFactory } from './forecast';
import { initializeProjectFactory } from './project';
import { initializeWellFactory } from './well';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeForecastDataFactory = (context: any) => {
	const { ForecastDataModel } = context.models;

	const ForecastFactory = initializeForecastFactory(context);
	const ProjectFactory = initializeProjectFactory(context);
	const WellFactory = initializeWellFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate }) => {
		const { status } = params;
		const { project, forecast, well } = associations;

		onCreate(async (forecastData) => {
			if (!project) {
				forecastData.project = (await ProjectFactory.create())._id;
			}

			if (!forecast) {
				forecastData.forecast = (
					await ForecastFactory.create({}, { associations: { project: forecastData.project } })
				)._id;
			}

			if (!well) {
				forecastData.well = (await WellFactory.create())._id;
			}

			return ForecastDataModel.create(forecastData);
		});

		return {
			status,
			forecast,
			well,
			project,
		};
	});
};
