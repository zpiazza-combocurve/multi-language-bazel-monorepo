// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const PasswordlessTokenSchema = Schema(
	{
		uid: { type: String, required: true, unique: true },
	},
	{ timestamps: true }
);

module.exports = { PasswordlessTokenSchema };
