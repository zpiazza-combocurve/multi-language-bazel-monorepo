// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { econGroupPropertiesSchema } = require('./econ-groups');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconGroupConfigurationSchema = Schema(
	{
		name: { type: String, required: true, unique: true },
		createdBy: { type: ObjectId, ref: 'users', required: true, index: true, immutable: true },
		configuration: {
			headers: [{ type: String }],
			groupName: { type: String },
			massCreateGroups: { type: Boolean },
			headerAsName: { type: Boolean },
		},
		properties: econGroupPropertiesSchema,
	},
	{ minimize: false, timestamps: true }
);

module.exports = { EconGroupConfigurationSchema };
