// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconSettingSchema = Schema(
	{
		columns: {
			type: [
				{
					_id: false,
					key: { type: String },
					selected_options: {
						aggregate: Boolean,
						monthly: Boolean,
						one_liner: Boolean,
					},
				},
			],
			required: true,
		},
		createdBy: { type: ObjectId, ref: 'users', required: true, immutable: true },
		name: { type: String, required: true },
	},
	{ timestamps: true }
);

module.exports = { EconSettingSchema };
