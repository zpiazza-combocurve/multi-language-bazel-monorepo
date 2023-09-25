// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const LINEAR = 'linear';
const ONE_TO_ONE = '1_to_1';
const NO_NORMALIZATION = 'no_normalization';
const POWER_LAW = 'power_law_fit';
const PLUS = '+';
const MINUS = '-';
const MULTIPLY = '*';
const DIVIDE = '/';
const EUR = 'eur';
const QPEAK = 'qPeak';
const EUR_AND_QPEAK = 'eur_and_q_peak';

const OperationSchema = new Schema({
	op: { type: String, enum: [PLUS, MINUS, MULTIPLY, DIVIDE], required: true },
	opFeature: { type: String, required: true },
	_id: false,
});

const OpChainSchema = new Schema({
	startFeature: { type: String, required: true },
	opChain: [{ type: OperationSchema, required: true }],
	_id: false,
});

const BaseSchema = new Schema({
	key: { type: String },
	x: { type: OpChainSchema, required: true },
	y: { type: OpChainSchema, required: true },
	_id: false,
});

const StepsSchema = new Schema({
	/* required settings */
	base: { type: BaseSchema },
	type: { type: String, enum: [LINEAR, ONE_TO_ONE, NO_NORMALIZATION, POWER_LAW] },

	/* fit params */
	// percentage of points to trim from the begining of the sorted normalization series
	rangeStart: { type: Number, default: 0.02 },
	// percentage of points after which will trim from the end of the sorted normalization series
	rangeEnd: { type: Number, default: 0.98 },

	/* normalization params */
	// min x value to normalize
	normalizationMin: Number,
	// max x value to normalize
	normalizationMax: Number,
	// `a` value in the ax + b linear fit function
	aValue: { type: Number },
	// `b` value in the ax + b linear fit function
	bValue: { type: Number },
	// target values for each term in base.x
	target: { type: {}, default: {} },

	// whether previous steps were updated but this one hasn't
	diverged: { type: Boolean, default: false },

	// multiplier scale factor
	multiplier: { type: Number, default: 1 },

	// Legacy fields, consider removing.
	name: { type: String, default: 'Normalize' },
	key: { type: String, default: 'normalize' },
	_id: false,
});

const TypeCurveNormalizationSchema = new Schema(
	{
		typeCurve: { type: Schema.ObjectId, ref: 'type-curves', required: true },
		phase: { type: String, enum: ['oil', 'gas', 'water'], required: true },
		steps: {
			eur: StepsSchema,
			qPeak: StepsSchema,
			normalizationType: { type: String, enum: [EUR, QPEAK, EUR_AND_QPEAK], default: EUR },
		},
	},
	{ timestamps: true }
);

TypeCurveNormalizationSchema.index({ typeCurve: 1, phase: 1 }, { unique: true });

module.exports = { TypeCurveNormalizationSchema };
