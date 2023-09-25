// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const TypeCurveWellAssignmentSchema = new Schema({
	typeCurve: { type: Schema.ObjectId, ref: 'type-curves', required: true, index: true, immutable: true },
	well: { type: Schema.ObjectId, ref: 'wells', required: true, index: true, immutable: true },
	oil: { type: Boolean, required: true },
	gas: { type: Boolean, required: true },
	water: { type: Boolean, required: true },
});

TypeCurveWellAssignmentSchema.index({ typeCurve: 1, well: 1 }, { unique: true });
TypeCurveWellAssignmentSchema.index({ typeCurve: 1, oil: 1 });
TypeCurveWellAssignmentSchema.index({ typeCurve: 1, gas: 1 });
TypeCurveWellAssignmentSchema.index({ typeCurve: 1, water: 1 });

module.exports = { TypeCurveWellAssignmentSchema };
