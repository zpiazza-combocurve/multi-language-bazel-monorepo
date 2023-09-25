// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ModularEconomicsConfigurationSchema = new Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects', required: true },
		user: { type: Schema.ObjectId, ref: 'users', required: true },
		name: { type: String, required: true },
		configuration: { type: Schema.Types.Mixed },
	},
	{ timestamps: true }
);

ModularEconomicsConfigurationSchema.index({ project: 1, user: 1, name: 1 }, { unique: true });

module.exports = { ModularEconomicsConfigurationSchema };
