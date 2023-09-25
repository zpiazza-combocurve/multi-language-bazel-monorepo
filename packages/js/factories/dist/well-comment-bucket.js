"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWellCommentBucketFactory = void 0;
const fishery_1 = require("fishery");
const user_1 = require("./user");
const initializeWellCommentBucketFactory = (context) => {
    const { WellCommentBucketModel } = context.models;
    const UserFactory = (0, user_1.initializeUserFactory)(context);
    return fishery_1.Factory.define(({ associations, onCreate, afterCreate }) => {
        const { comments, well } = associations;
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
exports.initializeWellCommentBucketFactory = initializeWellCommentBucketFactory;
