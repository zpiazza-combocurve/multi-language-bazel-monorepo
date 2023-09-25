// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const UmbrellaColumns = [
	'headers',
	'pSeries',
	'assumptions.capex',
	'assumptions.dates',
	'assumptions.risking',
	'assumptions.expenses',
	'assumptions.escalation',
	'assumptions.depreciation',
	'assumptions.general_options',
	'assumptions.production_taxes',
	'assumptions.production_vs_fit',
	'assumptions.stream_properties',
	'assumptions.ownership_reversion',
	'assumptions.pricing',
	'assumptions.differentials',
];

// eslint-disable-next-line new-cap -- TODO eslint fix later
const TypeCurveUmbrellaSchema = Schema({
	column: { type: String, enum: UmbrellaColumns, required: true, immutable: true },
	name: { type: String, required: true },
	typeCurve: { type: Schema.ObjectId, ref: 'type-curves', required: true, index: true, immutable: true },
	value: { type: Schema.Types.Mixed },
});

module.exports = { TypeCurveUmbrellaSchema };
