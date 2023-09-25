import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeWellFactory } from './well';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeOwnershipQualifierFactory = (context: any) => {
	const { OwnershipQualifierModel } = context.models;

	const WellFactory = initializeWellFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, associations, onCreate, afterCreate }) => {
		const { qualifierKey, ownership, chosenID, dataSource } = params;
		const { well } = associations;

		onCreate((ownershipQualifier) => OwnershipQualifierModel.create(ownershipQualifier));

		afterCreate(async (ownershipQualifier) => {
			if (!well) {
				ownershipQualifier.well = (await WellFactory.create())._id;
			}

			return ownershipQualifier.save();
		});

		return {
			well,
			chosenID,
			dataSource,
			qualifierKey: qualifierKey ?? 'q0',
			ownership: ownership ?? { name: faker.datatype.uuid() },
		};
	});
};
