// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ApiTenantSchema = Schema(
	{
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true },
		tenant: { type: String, required: true, immutable: true },
		gcpProjectId: { type: String, required: true },
		serviceAccountEmail: { type: String, required: true },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
);

ApiTenantSchema.index({ tenant: 1 }, { unique: true });

module.exports = { ApiTenantSchema };
