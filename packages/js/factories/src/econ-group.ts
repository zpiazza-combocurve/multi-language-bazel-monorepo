import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeScenarioFactory } from './scenario';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeEconGroupFactory = (context: any) => {
	const { EconGroupModel } = context.models;
	const UserFactory = initializeUserFactory(context);
	const ProjectFactory = initializeProjectFactory(context);
	const ScenarioFactory = initializeScenarioFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate }) => {
		const { name = faker.datatype.uuid() } = params;
		const { createdBy, project, scenario, assignments } = associations;

		onCreate(async (econGroup) => {
			const project = econGroup.project ?? (await ProjectFactory.create())._id;
			const scenario =
				econGroup.scenario ?? (await ScenarioFactory.create({}, { associations: { project } }))._id;
			const name = econGroup.name ?? faker.datatype.uuid();
			const createdBy = econGroup.createdBy ?? (await UserFactory.create())._id;
			return EconGroupModel.create({ ...econGroup, project, scenario, name, createdBy });
		});

		return {
			name,
			createdBy,
			project,
			scenario,
			assignments,
		};
	});
};
