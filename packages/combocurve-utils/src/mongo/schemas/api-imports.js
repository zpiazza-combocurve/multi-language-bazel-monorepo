// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ApiImportSchema = Schema(
	{
		createdBy: { type: Schema.ObjectId, ref: 'users', required: true },
		dataSource: { type: String, enum: ['di'], default: 'di', required: true },
		name: { type: String, required: true },
		importData: { type: String, enum: ['headers', 'production', 'headers_and_production'] },
		importMethod: { type: String, enum: ['insert', 'update', 'upsert'] },
		filters: {
			type: [
				{
					key: { type: String, required: true },
					operator: { type: String, required: true },
					value: { type: Schema.Types.Mixed, required: true },
					_id: false,
				},
			],
		},
		status: {
			type: String,
			enum: ['created', 'queued', 'started', 'completed', 'failed'],
			default: 'created',
			required: true,
		},
		events: { type: [{ kind: { type: String }, date: { type: Date }, _id: false }] },
		stats: {
			totalWells: { type: Number, default: 0 },
			importedWells: { type: Number, default: 0 },
			foundWells: { type: Number, default: 0 },
			updatedWells: { type: Number, default: 0 },
			insertedWells: { type: Number, default: 0 },

			totalBatches: { type: Number, default: 0 },
			finishedBatches: { type: Number, default: 0 },
		},
		problems: [{}],
		isAutomatic: { type: Boolean, default: false },
	},

	{ timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = { ApiImportSchema };
