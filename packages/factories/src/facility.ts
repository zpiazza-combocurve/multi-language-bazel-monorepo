/* eslint-disable @typescript-eslint/no-explicit-any */
import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

export const initializeFacilityFactory = (context: any) => {
	const { FacilityModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);
	const UserFactory = initializeUserFactory(context);

	return Factory.define<any>(({ onCreate }) => {
		onCreate(async (facility = {}) => {
			const {
				createdBy = (await UserFactory.create())._id,
				project = (await ProjectFactory.create({ user: createdBy }))._id,
				name = faker.datatype.uuid(),
			} = facility;

			return FacilityModel.create({ ...facility, createdBy, project, name });
		});
		return {};
	});
};
