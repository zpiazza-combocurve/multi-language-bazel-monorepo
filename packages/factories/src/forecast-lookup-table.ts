import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';
import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeForecastLookupTableFactory = (context: any) => {
	const { ForecastLookupTableModel } = context.models;

	const UserFactory = initializeUserFactory(context);
	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ sequence, associations, onCreate, afterCreate }) => {
		const { project, createdBy } = associations;

		onCreate((forecastLookupTable) => ForecastLookupTableModel.create(forecastLookupTable));

		afterCreate(async (forecastLookupTable) => {
			if (!project) {
				forecastLookupTable.project = (await ProjectFactory.create({}, { associations: { createdBy } }))._id;
			}

			if (!createdBy) {
				forecastLookupTable.createdBy = (await UserFactory.create())._id;
			}

			return forecastLookupTable.save();
		});

		return {
			name: `forecast-${faker.lorem.word()}-${sequence}`,
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
