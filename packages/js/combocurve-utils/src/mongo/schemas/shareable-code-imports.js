// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ShareableCodeUserSchema } = require('./shareable-codes');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ShareableCodeImportSchema = Schema(
	{
		shareableCode: { type: Schema.ObjectId, index: true, ref: 'shareable-codes', immutable: true, required: true },
		user: { type: ShareableCodeUserSchema, required: true, immutable: true },
		tenant: { type: String, required: true, immutable: true },
	},
	{ timestamps: true }
);

module.exports = { ShareableCodeImportSchema };
