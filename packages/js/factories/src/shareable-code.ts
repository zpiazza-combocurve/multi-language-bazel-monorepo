import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeShareableCodeFactory = (context: any) => {
	const { ShareableCodeModel } = context.sharedModels;

	const UserFactory = initializeUserFactory(context);
	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate }) => {
		const { expireAt, code = faker.datatype.uuid(), tenant = 'local', enabled = true } = params;
		const { project, user } = associations;

		onCreate(async (shareableCode) => {
			if (!project) {
				shareableCode.project = (await ProjectFactory.create())._id;
			}

			if (!user) {
				const newUser = await UserFactory.create();

				shareableCode.user = {
					_id: newUser._id,
					firstName: newUser.firstName,
					lastName: newUser.lastName,
					email: newUser.email,
				};
			}

			return ShareableCodeModel.create(shareableCode);
		});

		return {
			tenant,
			code,
			enabled,
			project,
			expireAt,
			user,
		};
	});
};
