// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { DATA_SOURCES } = require('./constants/data-sources');

const ID_FIELDS = ['inptID', 'api10', 'api12', 'api14', 'aries_id', 'phdwin_id'];
const OPERATION_TYPES = ['scopeToCompany', 'scopeToProject', 'dataSource', 'chosenId'];

const { ObjectId } = Schema;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const WellIdentifiersValidationResultSchema = Schema(
	{
		wells: { type: [{ type: ObjectId, ref: 'wells' }], required: true },
		update: {
			type: {
				project: String,
				dataSource: { type: String, enum: DATA_SOURCES },
				chosenID: { type: String, enum: ID_FIELDS },
			},
			required: true,
		},
		operationType: { type: String, enum: OPERATION_TYPES, required: true },
		project: { type: ObjectId, ref: 'projects' },
		path: String,

		result: {
			// the keys of the `collisions` map are meant to be ObjectId as well, but they must be stored as strings due to MongoDB limitations
			collisions: { type: Map, of: [ObjectId] },
			missingIdentifier: [ObjectId],
		},
		active: { type: Boolean, default: true },

		createdBy: { type: ObjectId, ref: 'users', index: true },
		notification: { type: ObjectId, ref: 'notifications' },
	},
	{ timestamps: true }
);

WellIdentifiersValidationResultSchema.index({ createdAt: 1 }, { expires: '14d' });

module.exports = { WellIdentifiersValidationResultSchema };
