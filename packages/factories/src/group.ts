import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeGroupFactory = (context: any) => {
	const { GroupModel } = context.models;

	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate }) => {
		const { name = faker.datatype.uuid(), description = faker.lorem.sentence(10), users = [] } = params;
		const { createdBy } = associations;

		onCreate(async (group) => {
			if (!createdBy) {
				group.createdBy = (await UserFactory.create())._id;
			}

			return GroupModel.create(group);
		});

		return {
			name,
			description,
			users,
		};
	});
};
