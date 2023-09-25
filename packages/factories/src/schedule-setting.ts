import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const activityStepFactory = Factory.define<any>(() => ({
	stepIdx: 0,
	color: '#353769',
	name: faker.datatype.uuid(),
	padOperation: 'sequence',
	previousStepIdx: [],
	stepDuration: { days: 15, useLookup: false },
	requiresResources: true,
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const resourceFactory = Factory.define<any>(() => ({
	active: true,
	availability: { start: 44908, end: 117958 },
	demobilizationDays: 1,
	mobilizationDays: 1,
	workOnHolidays: true,
	name: faker.datatype.uuid(),
	stepIdx: [],
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeScheduleSettingFactory = (context: any) => {
	const { ScheduleSettingModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { name = faker.datatype.uuid() } = params;
		const { project } = associations;

		onCreate((scheduleSetting) => {
			scheduleSetting.activitySteps = activityStepFactory.buildList(1);
			scheduleSetting.resources = resourceFactory.buildList(2, { stepIdx: [0] });

			return ScheduleSettingModel.create(scheduleSetting);
		});

		afterCreate(async (scheduleSetting) => {
			if (!project) {
				scheduleSetting.project = (await ProjectFactory.create())._id;
			}

			return scheduleSetting.save();
		});

		return {
			name,
			project,
		};
	});
};
