import { Factory } from 'fishery';

import { initializeWellFactory } from './well';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeDailyProductionFactory = (context: any) => {
	const { DailyProductionModel } = context.models;
	const WellFactory = initializeWellFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { startIndex = 0 } = params;
		const { well, project } = associations;

		onCreate((dailyProduction) => DailyProductionModel.create(dailyProduction));

		afterCreate(async (dailyProduction) => {
			if (!well) {
				dailyProduction.well = (await WellFactory.create())._id;
			}

			if (!project) {
				dailyProduction.project = dailyProduction.well.project;
			}

			return dailyProduction.save();
		});

		return {
			well,
			project,
			startIndex,
			first_production_index: startIndex,
			index: [startIndex, ...new Array(30).fill(null)],
			oil: [1, ...new Array(30).fill(null)],
		};
	});
};
