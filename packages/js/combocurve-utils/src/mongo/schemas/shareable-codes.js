// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ShareableCodeUserSchema = Schema({
	email: { type: String, required: true },
	firstName: String,
	lastName: String,
});

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ShareableCodeSchema = Schema(
	{
		code: { type: String, required: true, index: true, unique: true, immutable: true },
		tenant: { type: String, required: true, immutable: true },
		enabled: { type: Boolean, required: true, default: true },
		project: { type: Schema.ObjectId, required: true, immutable: true },
		archivedProject: { type: Schema.ObjectId, immutable: true },
		user: { type: ShareableCodeUserSchema, required: true, immutable: true },
		expireAt: Date,
	},
	{ timestamps: true, toJSON: { virtuals: true } }
);

ShareableCodeSchema.virtual('imports', {
	ref: 'shareable-code-imports',
	localField: '_id',
	foreignField: 'shareableCode',
});

ShareableCodeSchema.index({ tenant: 1, projectId: 1 });

module.exports = { ShareableCodeSchema, ShareableCodeUserSchema };
