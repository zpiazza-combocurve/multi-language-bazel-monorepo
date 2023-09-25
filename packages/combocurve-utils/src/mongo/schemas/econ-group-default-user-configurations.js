// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconGroupDefaultUserConfigurationSchema = Schema({
	econGroupConfiguration: { type: Schema.ObjectId, ref: 'econ-group-configurations', required: true },
	user: { type: Schema.ObjectId, ref: 'users', required: true },
});

EconGroupDefaultUserConfigurationSchema.index({ user: 1 }, { unique: true });

module.exports = { EconGroupDefaultUserConfigurationSchema };
