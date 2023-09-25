import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const inputDataFactory = Factory.define<any>(() => ({
	well: faker.database.mongodbObjectId(),
	priority: 1,
	status: 'not_started',
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeScheduleFactory = (context: any) => {
	const { ScheduleModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { name = faker.datatype.uuid(), method = 'auto' } = params;
		const { project } = associations;

		onCreate((schedule) => {
			schedule.inputData = inputDataFactory.buildList(1);
			return ScheduleModel.create(schedule);
		});

		afterCreate(async (schedule) => {
			if (!project) {
				schedule.project = (await ProjectFactory.create())._id;
			}

			return schedule.save();
		});

		return {
			name,
			method,
			project,
		};
	});
};
