// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ApiCredentialSchema = Schema(
	{
		apiKeyId: { type: String, required: true },
		apiKeyName: { type: String, required: true },
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		serviceAccountKeyId: { type: String, required: true },
		tenant: { type: String, required: true, immutable: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

ApiCredentialSchema.index({ tenant: 1, serviceAccountKeyId: 1 }, { unique: true });

module.exports = { ApiCredentialSchema };
