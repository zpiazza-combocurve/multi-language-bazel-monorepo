// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { productionArray } = require('./production-data/shared');

const DAY_BUCKET_SIZE = 31;

const DailyProductionSchema = new Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects', default: null },
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true },
		chosenID: { type: Schema.Types.Mixed, index: true }, // Value of header that connects well data with well headers on import
		startIndex: { type: Number, required: true }, // Number of days between 1900/1/1 and this bucket's start. Has trailing null values if the month has less than 31 days.
		first_production_index: { type: Number, required: true }, // 0-31. Earliest day that has prod data.

		// Same as startIndex except for every day. Months with less than 31 days will have trailing nulls.
		index: productionArray(Number, DAY_BUCKET_SIZE),
		// Phase arrays have a fixed length of 31, each element is a data point.
		// Months with less than 31 days will have trailing nulls and consumers will need to filter based on the
		// index array or calculate how many days are in the month.
		// If a data point is missing it will be null.
		oil: productionArray(Number, DAY_BUCKET_SIZE),
		gas: productionArray(Number, DAY_BUCKET_SIZE),
		choke: productionArray(Number, DAY_BUCKET_SIZE),
		water: productionArray(Number, DAY_BUCKET_SIZE),
		hours_on: productionArray(Number, DAY_BUCKET_SIZE),
		gas_lift_injection_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		bottom_hole_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		tubing_head_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		flowline_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		casing_head_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		vessel_separator_pressure: productionArray(Number, DAY_BUCKET_SIZE),
		operational_tag: productionArray(String, DAY_BUCKET_SIZE),

		gasInjection: productionArray(Number, DAY_BUCKET_SIZE),
		waterInjection: productionArray(Number, DAY_BUCKET_SIZE),
		co2Injection: productionArray(Number, DAY_BUCKET_SIZE),
		steamInjection: productionArray(Number, DAY_BUCKET_SIZE),
		ngl: productionArray(Number, DAY_BUCKET_SIZE),

		// custom fields
		customNumber0: productionArray(Number, DAY_BUCKET_SIZE),
		customNumber1: productionArray(Number, DAY_BUCKET_SIZE),
		customNumber2: productionArray(Number, DAY_BUCKET_SIZE),
		customNumber3: productionArray(Number, DAY_BUCKET_SIZE),
		customNumber4: productionArray(Number, DAY_BUCKET_SIZE),
	},
	{ timestamps: true }
);

DailyProductionSchema.index({ well: 1, startIndex: 1 }, { unique: true });
DailyProductionSchema.index({ project: 1, well: 1, startIndex: 1 }, { unique: true });

module.exports = { DailyProductionSchema };
