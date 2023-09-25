// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { productionArray } = require('./production-data/shared');

const MONTH_BUCKET_SIZE = 12;

const MonthlyProductionSchema = new Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects', default: null },
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true },
		chosenID: { type: Schema.Types.Mixed, index: true }, // Value of header that connects well data with well headers on import
		startIndex: { type: Number, required: true }, // Number of days between 1900/1/1 and this bucket's start
		first_production_index: { type: Number, required: true }, // 0-11. Earliest month that has prod data.

		// Same as startIndex except for every month.
		index: productionArray(Number, MONTH_BUCKET_SIZE),
		// Phase arrays have a fixed length of 12, each element is a data point.
		// If a data point is missing it will be null.
		oil: productionArray(Number, MONTH_BUCKET_SIZE),
		gas: productionArray(Number, MONTH_BUCKET_SIZE),
		choke: productionArray(Number, MONTH_BUCKET_SIZE),
		water: productionArray(Number, MONTH_BUCKET_SIZE),
		days_on: productionArray(Number, MONTH_BUCKET_SIZE),
		operational_tag: productionArray(String, MONTH_BUCKET_SIZE),

		gasInjection: productionArray(Number, MONTH_BUCKET_SIZE),
		waterInjection: productionArray(Number, MONTH_BUCKET_SIZE),
		co2Injection: productionArray(Number, MONTH_BUCKET_SIZE),
		steamInjection: productionArray(Number, MONTH_BUCKET_SIZE),
		ngl: productionArray(Number, MONTH_BUCKET_SIZE),

		// custom fields
		customNumber0: productionArray(Number, MONTH_BUCKET_SIZE),
		customNumber1: productionArray(Number, MONTH_BUCKET_SIZE),
		customNumber2: productionArray(Number, MONTH_BUCKET_SIZE),
		customNumber3: productionArray(Number, MONTH_BUCKET_SIZE),
		customNumber4: productionArray(Number, MONTH_BUCKET_SIZE),
	},
	{ timestamps: true }
);

MonthlyProductionSchema.index({ well: 1, startIndex: 1 }, { unique: true });
MonthlyProductionSchema.index({ project: 1, well: 1, startIndex: 1 }, { unique: true });

module.exports = {
	MonthlyProductionSchema,
	MONTH_BUCKET_SIZE,
};
