// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const MAX_WELL_COMMENTS_PER_BUCKET = 1000;

const WellCommentSchema = new Schema(
	{
		text: { type: String, required: true, immutable: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', immutable: true },
	},
	{ _id: false, timestamps: true }
);

const WellCommentBucketSchema = new Schema(
	{
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true },
		index: { type: Number, required: true },
		count: { type: Number, required: true },
		project: { type: Schema.ObjectId, ref: 'projects', immutable: true },
		scenario: { type: Schema.ObjectId, ref: 'scenarios', immutable: true },
		forecast: { type: Schema.ObjectId, ref: 'forecasts', immutable: true },
		comments: [WellCommentSchema],
	},
	{ timestamps: true }
);

WellCommentBucketSchema.index({ well: 1 });
WellCommentBucketSchema.index({ project: 1 });

module.exports = { WellCommentBucketSchema, MAX_WELL_COMMENTS_PER_BUCKET };
