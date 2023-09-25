import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeEconGroupConfigurationFactory = (context: any) => {
	const { EconGroupConfigurationModel } = context.models;
	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { name = faker.datatype.uuid() } = params;
		const { createdBy } = associations;

		onCreate((config) => EconGroupConfigurationModel.create(config));

		afterCreate(async (config) => {
			if (!createdBy) {
				config.createdBy = (await UserFactory.create())._id;
			}

			return config.save();
		});

		return {
			name,
			configuration: {
				headers: [faker.database.column()],
				groupName: faker.lorem.word(),
				massCreateGroups: faker.datatype.boolean(),
				headerAsName: faker.datatype.boolean(),
			},
			properties: {
				econLimit: faker.lorem.word(),
				allocation: {
					timing: faker.lorem.word(),
					properties: faker.lorem.word(),
					basis: faker.lorem.word(),
					method: faker.lorem.word(),
					methodType: faker.lorem.word(),
				},
				exclusion: {
					volumnOptions: faker.lorem.word(),
					group: faker.lorem.word(),
				},
			},
		};
	});
};
