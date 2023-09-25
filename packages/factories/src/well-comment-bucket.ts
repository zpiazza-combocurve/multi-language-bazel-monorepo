import { Factory } from 'fishery';

import { initializeUserFactory } from './user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const initializeWellCommentBucketFactory = (context: any) => {
	const { WellCommentBucketModel } = context.models;

	const UserFactory = initializeUserFactory(context);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	return Factory.define<any>(({ associations, onCreate, afterCreate }) => {
		const { comments, well } = associations;

		// eslint-disable-next-line new-cap -- TODO eslint fix later
		onCreate((wellCommentBucket) => WellCommentBucketModel(wellCommentBucket));

		afterCreate(async (wellCommentBucket) => {
			if (!comments) {
				const user = await UserFactory.create();

				const comment = {
					text: 'any text',
					createdBy: user._id,
				};

				wellCommentBucket.comments = [comment];
				wellCommentBucket.count = 1;
			}

			return wellCommentBucket.save();
		});

		return {
			well,
			index: 1,
			count: comments?.length ?? 0,
			comments,
		};
	});
};
