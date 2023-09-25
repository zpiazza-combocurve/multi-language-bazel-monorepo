// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DAY_BUCKET_SIZE } = require('./daily-productions');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { productionArray } = require('./production-data/shared');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const DailyStreamDataSchema = Schema(
	{
		chosenID: { type: Schema.Types.Mixed, index: true }, // Value of header that connects well data with well headers on import
		first_production_index: { type: Number, required: true }, // 0-31. Earliest day that has prod data.
		startIndex: { type: Number, required: true }, // Number of days between 1900/1/1 and this bucket's start. Has trailing null values if the month has less than 31 days.
		stream: { type: Schema.ObjectId, ref: 'streams', required: true, immutable: true, index: true },
		streamAssignment: {
			type: Schema.ObjectId,
			ref: 'stream-well-assignments',
			required: true,
			immutable: true,
			index: true,
		},
		well: { type: Schema.ObjectId, ref: 'wells', required: true, immutable: true, index: true },

		// Same as startIndex except for every day. Months with less than 31 days will have trailing nulls.
		index: productionArray(Number, DAY_BUCKET_SIZE),
		// Phase arrays have a fixed length of 31, each element is a data point.
		// Months with less than 31 days will have trailing nulls and consumers will need to filter based on the
		// index array or calculate how many days are in the month.
		// If a data point is missing it will be null.
		oil: productionArray(Number, DAY_BUCKET_SIZE),
		gas: productionArray(Number, DAY_BUCKET_SIZE),
		water: productionArray(Number, DAY_BUCKET_SIZE),
	},

	{ timestamps: true }
);

module.exports = { DailyStreamDataSchema };
