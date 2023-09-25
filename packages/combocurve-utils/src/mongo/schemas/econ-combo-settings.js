// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconComboSettingSchema = Schema(
	{
		name: { type: String, required: true },
		project: { type: ObjectId, required: true, ref: 'projects', immutable: true },
		scenario: { type: ObjectId, required: true, ref: 'scenarios', immutable: true },
		combos: {
			type: [
				{
					name: { type: String, required: true },
					qualifiers: { type: Object, required: true },
					selected: { type: Boolean, required: true },
				},
			],
		},
		createdBy: { type: ObjectId, ref: 'users', required: true, immutable: true },
	},
	{ timestamps: true }
);

EconComboSettingSchema.index({ project: 1, scenario: 1, name: 1 }, { unique: true });

module.exports = { EconComboSettingSchema };
