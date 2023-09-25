import { Factory } from 'fishery';

import { initializeWellFactory } from './well';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeMonthlyProductionFactory = (context: any) => {
	const { MonthlyProductionModel } = context.models;
	const WellFactory = initializeWellFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { startIndex = 0 } = params;
		const { well, project } = associations;

		onCreate((monthlyProduction) => MonthlyProductionModel.create(monthlyProduction));

		afterCreate(async (monthlyProduction) => {
			if (!well) {
				monthlyProduction.well = (await WellFactory.create())._id;
			}

			if (!project) {
				monthlyProduction.project = monthlyProduction.well.project;
			}

			return monthlyProduction.save();
		});

		return {
			well,
			project,
			startIndex,
			first_production_index: startIndex,
			index: [startIndex, ...new Array(11).fill(null)],
			oil: [1, ...new Array(11).fill(null)],
		};
	});
};
