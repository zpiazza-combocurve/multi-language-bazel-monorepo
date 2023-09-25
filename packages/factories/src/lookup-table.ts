import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeLookupTableFactory = (context: any) => {
	const { LookupTableModel } = context.models;

	const UserFactory = initializeUserFactory(context);
	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ sequence, associations, onCreate }) => {
		const { project, createdBy } = associations;

		onCreate(async (lookupTable) => {
			if (!createdBy) {
				lookupTable.createdBy = (await UserFactory.create())._id;
			}

			if (!project) {
				lookupTable.project = (
					await ProjectFactory.create({}, { associations: { createdBy: lookupTable.createdBy } })
				)._id;
			}

			return LookupTableModel.create(lookupTable);
		});

		return {
			name: `${faker.lorem.word()}_${sequence}`,
			project,
			createdBy,
			rules: [
				{
					filter: {
						conditions: [
							{
								key: 'perf_lateral_length',
								operator: 'equal',
								value: 100,
							},
						],
					},
				},
			],
		};
	});
};
