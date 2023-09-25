/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

export const initializeNetworkFactory = (context: any) => {
	const { NetworkModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);

	return Factory.define<any>(({ onCreate }) => {
		onCreate(async (network = {}) => {
			const {
				createdBy = (await UserFactory.create())._id,
				project = (await ProjectFactory.create({ user: createdBy }))._id,
				name = faker.datatype.uuid(),
			} = network;

			return NetworkModel.create({ ...network, createdBy, project, name });
		});
		return {};
	});
};
