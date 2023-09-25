// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ratioPSeries = {
	segments: [],
	diagnostics: {},
	basePhase: { type: String, enum: [null, 'oil', 'gas', 'water'], default: null },
	x: { type: String, enum: ['time', 'cum'], default: 'time' },
};

const TypeCurveFitSchema = new Schema({
	adjusted: { type: Boolean, default: false },
	align: { type: String, enum: ['align', 'noalign'] },
	eurPercentile: { type: Boolean, default: false },
	fitType: { type: String, enum: [null, 'rate', 'ratio'], default: null },
	normalize: { type: Boolean, default: false },
	P_dict: {},
	phase: { type: String, enum: ['oil', 'gas', 'water'], required: true, index: true },
	ratio_P_dict: {
		P10: ratioPSeries,
		P50: ratioPSeries,
		P90: ratioPSeries,
		best: ratioPSeries,
	},
	regressionType: { type: String, enum: ['cum', 'rate'], default: 'cum' },
	resolution: { type: String, enum: ['monthly', 'daily'] },
	settings: {},
	typeCurve: { type: Schema.ObjectId, ref: 'type-curves', required: true, index: true },
});

TypeCurveFitSchema.index({ typeCurve: 1, phase: 1 });

module.exports = { TypeCurveFitSchema };
