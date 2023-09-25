import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeScenarioFactory } from './scenario';
import { initializeWellFactory } from './well';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeScenarioWellAssignmentFactory = (context: any) => {
	const { ScenarioWellAssignmentModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);
	const ScenarioFactory = initializeScenarioFactory(context);
	const WellFactory = initializeWellFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { project, scenario, well } = associations;

		onCreate((scenarioWellAssignment) => ScenarioWellAssignmentModel.create(scenarioWellAssignment));

		afterCreate(async (scenarioWellAssignment) => {
			if (!project) {
				scenarioWellAssignment.project = (await ProjectFactory.create())._id;
			}

			if (!scenario) {
				scenarioWellAssignment.scenario = (
					await ScenarioFactory.create({}, { associations: { project: scenarioWellAssignment.project } })
				)._id;
			}

			if (!well) {
				scenarioWellAssignment.well = (await WellFactory.create())._id;
			}

			return scenarioWellAssignment.save();
		});

		return {
			capex: params.capex,
			expenses: params.expenses,
			forecast_p_series: params.forecast_p_series,
			reserves_category: params.reserves_category,
			scenario,
			project,
			well,
			index: params.index,
		};
	});
};
