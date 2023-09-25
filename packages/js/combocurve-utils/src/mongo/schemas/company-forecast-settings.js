// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const commonSettings = {
	D_lim_eff: Number,
	enforce_sw: Boolean,
	q_final: Number,
	well_life_dict: {
		well_life_method: {
			type: String,
			enum: ['duration_from_first_data', 'duration_from_last_data', 'duration_from_today', 'fixed_date'],
		},
		num: Number,
		fixed_date: Date,
	},
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const CompanyForecastSettingSchema = Schema(
	{
		name: { type: String, required: true, default: 'Default' },
		createdBy: { type: Schema.ObjectId, ref: 'users' },
		settings: {
			shared: commonSettings,
			oil: commonSettings,
			gas: commonSettings,
			water: commonSettings,
		},
	},
	{ timestamps: true }
);

module.exports = { CompanyForecastSettingSchema };
