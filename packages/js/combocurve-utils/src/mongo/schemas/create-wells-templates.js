// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const CreateWellsTemplateSchema = new Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects', default: null },
		user: { type: Schema.ObjectId, ref: 'users', required: true },
		name: { type: String, required: true },
		default: { type: Boolean, default: false },
		wellNamePrefix: { type: String, required: true },
		numOfWells: { type: Number, required: true },
		wellsPerPad: { type: Number, required: true },
		headers: [
			{
				key: { type: String, required: true },
				value: { type: Schema.Types.Mixed },
			},
		],
	},
	{ timestamps: true }
);

CreateWellsTemplateSchema.index({ project: 1, user: 1, name: 1 }, { unique: true });

module.exports = { CreateWellsTemplateSchema };
