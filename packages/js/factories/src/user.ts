import { faker } from '@faker-js/faker';
import { Factory } from 'fishery';

import { initializeAccessPolicyFactory } from './access-policies';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeUserFactory = (context: any) => {
	const { UserModel } = context.models;

	const AccessPolicyFactory = initializeAccessPolicyFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, transientParams, onCreate, afterCreate }) => {
		const {
			auth0Id = `test-auth0-id-${faker.datatype.uuid()}`,
			email = `test_${faker.datatype.uuid()}@combocurve.com`.toLowerCase(),
			firstName = faker.name.firstName(),
			lastName = faker.name.lastName(),
		} = params;

		const { companyAdmin, companyProjectViewer } = transientParams;

		onCreate((user) => UserModel.create(user));

		if (companyAdmin) {
			afterCreate(async (user) => {
				await AccessPolicyFactory.create({
					memberId: user._id,
					memberType: 'users',
					resourceType: 'company',
					roles: 'company.admin',
				});

				return user;
			});
		}

		if (companyProjectViewer) {
			afterCreate(async (user) => {
				await AccessPolicyFactory.create({
					memberId: user._id,
					memberType: 'users',
					resourceType: 'company',
					roles: 'company.project.viewer',
				});

				return user;
			});
		}

		return {
			auth0Id,
			email,
			firstName,
			lastName,
		};
	});
};
