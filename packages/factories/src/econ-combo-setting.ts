import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeScenarioFactory } from './scenario';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeEconComboSettingFactory = (context: any) => {
	const { EconComboSettingModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);
	const ScenarioFactory = initializeScenarioFactory(context);
	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ sequence, associations, onCreate, afterCreate }) => {
		const { project, scenario, createdBy } = associations;

		onCreate((econComboSetting) => EconComboSettingModel.create(econComboSetting));

		afterCreate(async (econComboSetting) => {
			if (!project) {
				econComboSetting.project = (await ProjectFactory.create({}, { associations: { createdBy } }))._id;
			}

			if (!scenario) {
				econComboSetting.scenario = (await ScenarioFactory.create({}, { associations: { createdBy } }))._id;
			}

			if (!createdBy) {
				econComboSetting.createdBy = (await UserFactory.create())._id;
			}

			return econComboSetting.save();
		});

		return {
			name: `${faker.lorem.word()}_${sequence}`,
			project,
			scenario,
			createdBy,
			combos: [],
		};
	});
};
