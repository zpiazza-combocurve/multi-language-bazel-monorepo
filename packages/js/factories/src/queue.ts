import { Factory } from 'fishery';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeQueueFactory = (context: any) => {
	const { QueueModel } = context.sharedModels;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ params, onCreate }) => {
		const { assigned = false, kind, name } = params;

		onCreate((queue) => QueueModel.create(queue));

		return {
			assigned,
			kind,
			name,
		};
	});
};
