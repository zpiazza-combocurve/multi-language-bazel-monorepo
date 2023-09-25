import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeProjectFactory = (context: any) => {
	const { ProjectModel } = context.models;

	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { name = faker.datatype.uuid() } = params;
		const { createdBy } = associations;

		onCreate((project) => ProjectModel.create(project));

		afterCreate(async (project) => {
			if (!createdBy) {
				project.createdBy = (await UserFactory.create())._id;
			}

			return project.save();
		});

		return {
			name,
			createdBy,
		};
	});
};
