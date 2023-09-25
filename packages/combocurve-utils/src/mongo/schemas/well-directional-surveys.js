// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const WELL_DIRECTIONAL_SURVEY_SCHEMA_VERSION = 1;

const SURVEY_FIELDS = [
	'measuredDepth',
	'trueVerticalDepth',
	'azimuth',
	'inclination',
	'deviationNS',
	'deviationEW',
	'latitude',
	'longitude',
];

const surveyArrayValidator = {
	validator(v) {
		if (!v) {
			return true;
		}
		// The alias is not needed
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const doc = this;
		return SURVEY_FIELDS.every((field) => !doc?.[field] || doc[field].length === v.length);
	},
	message: 'Invalid array length for `{PATH}`',
};

const WellDirectionalSurveySchema = new Schema(
	{
		schemaVersion: { type: Number, default: WELL_DIRECTIONAL_SURVEY_SCHEMA_VERSION },
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true, index: true },
		project: { type: Schema.ObjectId, ref: 'projects', default: null },
		measuredDepth: { type: [Number], validate: surveyArrayValidator }, // in feet
		trueVerticalDepth: { type: [Number], validate: surveyArrayValidator }, // in feet
		azimuth: { type: [Number], validate: surveyArrayValidator }, // in degrees
		inclination: { type: [Number], validate: surveyArrayValidator }, // in degrees
		deviationNS: { type: [Number], validate: surveyArrayValidator }, // in feet
		deviationEW: { type: [Number], validate: surveyArrayValidator }, // in feet
		latitude: { type: [Number], validate: surveyArrayValidator }, // in degrees [-90, 90]
		longitude: { type: [Number], validate: surveyArrayValidator }, // in degrees [-180, 180]
	},
	{ timestamps: true }
);

WellDirectionalSurveySchema.virtual('asGeoLine').get(function anon() {
	// The alias is not needed
	// eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/no-invalid-this -- TODO eslint fix later
	const doc = this;
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	const coordinates = doc.longitude.map((lon, i) => [lon, this.latitude[i]]);

	return {
		type: 'Feature',
		geometry: {
			type: 'LineString',
			coordinates,
		},
		properties: {
			// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
			wellId: this._id,
		},
	};
});

module.exports = { WellDirectionalSurveySchema };
