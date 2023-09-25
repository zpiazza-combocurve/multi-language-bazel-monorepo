import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeWellFactory = (context: any) => {
	const { WellModel, ProjectModel } = context.models;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { well_name = faker.datatype.uuid(), ...rest } = params;
		const { project } = associations;

		onCreate((well) => WellModel.create(well));

		afterCreate(async (well) => {
			if (project) {
				await ProjectModel.updateOne({ _id: project }, { $push: { wells: well._id } });
			}

			return well;
		});

		return {
			project,
			well_name,

			...rest,
		};
	});
};
