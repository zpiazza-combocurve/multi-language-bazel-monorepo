import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeAssumptionFactory = (context: any) => {
	const { AssumptionModel } = context.models;
	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const {
			assumptionKey = faker.datatype.uuid(),
			assumptionName = faker.datatype.uuid(),
			econ_function,
			name = faker.datatype.uuid(),
			unique = false,
		} = params;

		const { project } = associations;

		onCreate((assumption) => AssumptionModel.create(assumption));

		afterCreate(async (assumption) => {
			if (!assumption) {
				assumption.project = (await ProjectFactory.create())._id;
			}

			return assumption.save();
		});

		return {
			assumptionKey,
			assumptionName,
			econ_function,
			name,
			unique,
			project,
		};
	});
};
