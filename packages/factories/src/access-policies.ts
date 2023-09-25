import { Factory } from 'fishery';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeAccessPolicyFactory = (context: any) => {
	const { AccessPolicyModel } = context.models;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, onCreate }) => {
		const { memberId, memberType, resourceType, resourceId, roles } = params;

		onCreate((accessPolicy) => AccessPolicyModel.create(accessPolicy));

		return {
			memberId,
			memberType,
			resourceId,
			resourceType,
			roles,
		};
	});
};
