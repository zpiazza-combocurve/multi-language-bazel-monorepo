import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeScenarioFactory = (context: any) => {
	const { ScenarioModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { name = faker.datatype.uuid() } = params;
		const { project, createdBy, wells } = associations;

		onCreate(async (scenario) => {
			const project = scenario.project ?? (await ProjectFactory.create())._id;
			const name = scenario.name ?? faker.datatype.uuid();

			return ScenarioModel.create({ ...scenario, project, name });
		});

		afterCreate(async (scenario) => {
			if (!createdBy) {
				scenario.createdBy = (await UserFactory.create())._id;
			}

			return scenario.save();
		});

		return {
			name,
			project,
			createdBy,
			wells,
		};
	});
};
