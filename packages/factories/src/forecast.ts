import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeProjectFactory } from './project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeForecastFactory = (context: any) => {
	const { ForecastModel } = context.models;

	const ProjectFactory = initializeProjectFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate }) => {
		const { name = faker.datatype.uuid(), type } = params;
		const { project } = associations;

		onCreate(async (forecast) => {
			if (!project) {
				forecast.project = (await ProjectFactory.create())._id;
			}

			return ForecastModel.create(forecast);
		});

		return {
			name,
			type,
			project,
		};
	});
};
