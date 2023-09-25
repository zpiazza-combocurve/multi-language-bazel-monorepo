// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const MultipliersSchema = new Schema({
	eur: { type: Number, default: 1.0 },
	qPeak: { type: Number, default: null },
	_id: false,
});

const TypeCurveNormalizationWellSchema = new Schema({
	typeCurve: { type: Schema.ObjectId, ref: 'type-curves', required: true, index: true },
	phase: { type: String, enum: ['oil', 'gas', 'water'], required: true, index: true },
	well: { type: Schema.ObjectId, ref: 'wells', required: true, index: true },

	// output
	multipliers: { type: MultipliersSchema, required: true },
	nominalMultipliers: { type: MultipliersSchema, required: true },
});

TypeCurveNormalizationWellSchema.index({ typeCurve: 1, phase: 1, well: 1 }, { unique: true });

module.exports = { TypeCurveNormalizationWellSchema };
