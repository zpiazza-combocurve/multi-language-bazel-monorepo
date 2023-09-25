// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { MONTH_BUCKET_SIZE } = require('./monthly-productions');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { productionArray } = require('./production-data/shared');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const MonthlyStreamDataSchema = Schema(
	{
		first_production_index: { type: Number, required: true }, // 0-11. Earliest month that has prod data.
		startIndex: { type: Number, required: true }, // Number of days between 1900/1/1 and this bucket's start
		chosenID: { type: Schema.Types.Mixed, index: true }, // Value of header that connects well data with well headers on import
		stream: { type: Schema.ObjectId, ref: 'streams', required: true, immutable: true, index: true },
		streamAssignment: {
			type: Schema.ObjectId,
			ref: 'stream-well-assignments',
			required: true,
			immutable: true,
			index: true,
		},
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true, index: true },

		// Same as startIndex except for every month.
		index: productionArray(Number, MONTH_BUCKET_SIZE),
		// Phase arrays have a fixed length of 12, each element is a data point.
		// If a data point is missing it will be null.
		oil: productionArray(Number, MONTH_BUCKET_SIZE),
		gas: productionArray(Number, MONTH_BUCKET_SIZE),
		water: productionArray(Number, MONTH_BUCKET_SIZE),
	},

	{ timestamps: true }
);

module.exports = { MonthlyStreamDataSchema };
