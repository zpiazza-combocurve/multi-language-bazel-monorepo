// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const fileSchema = {
	mapping: {},
	headers: [String],
	file: { type: Schema.ObjectId, ref: 'files', required: true },
	mappedHeaders: [String],
	category: {
		type: String,
		enum: [
			'acProperty',
			'acDaily',
			'acProduct',
			'acEconomic',
			'acScenario',
			'acSetup',
			'acSetupdata',
			'arSidefile',
			'arEnddate',
			'arLookup',
			'ariesProject',
			'projlist',
		],
	},
};

const wellInfoSchema = {
	chosenID: String,
	well_name: String,
	well_number: String,
};

const updateWellInfoSchema = {
	...wellInfoSchema,
	wells: [{ type: Schema.ObjectId, ref: 'wells' }],
};

// eslint-disable-next-line new-cap -- TODO eslint fix later
const FileImportSchema = Schema({
	user: { type: Schema.ObjectId, ref: 'users', required: true },
	project: { type: Schema.ObjectId, ref: 'projects' },
	dataPool: { type: String, enum: ['external', 'internal'], default: 'internal', required: true },
	description: String,
	dataSource: { type: String, required: true },
	replace_production: Boolean,
	status: {
		type: String,
		enum: [
			'uploading',
			'mapping',
			'mapped',
			'queued',
			'started',
			'complete',
			'aries_started',
			'aries_complete',
			'failed',
			'aborted',
		],
		default: 'uploading',
		required: true,
	},

	stats: {
		totalWells: { type: Number, default: 0 },
		importedWells: { type: Number, default: 0 },
		foundWells: { type: Number, default: 0 },
		updatedWells: { type: Number, default: 0 },
		insertedWells: { type: Number, default: 0 },

		totalMonthly: { type: Number, default: 0 },
		insertedMonthly: { type: Number, default: 0 },
		updatedMonthly: { type: Number, default: 0 },
		failedMonthly: { type: Number, default: 0 },

		totalDaily: { type: Number, default: 0 },
		insertedDaily: { type: Number, default: 0 },
		updatedDaily: { type: Number, default: 0 },
		failedDaily: { type: Number, default: 0 },

		totalSurveyRows: { type: Number, default: 0 },
		insertedSurveyRows: { type: Number, default: 0 },
		updatedSurveyRows: { type: Number, default: 0 },
		failedSurveyRows: { type: Number, default: 0 },
		totalSurveyWells: { type: Number, default: 0 },
		insertedSurveyWells: { type: Number, default: 0 },
		updatedSurveyWells: { type: Number, default: 0 },
		failedSurveyWells: { type: Number, default: 0 },

		totalBatches: { type: Number, default: 0 },
		finishedBatches: { type: Number, default: 0 },
	},
	events: [{ type: { type: String, date: Date } }],
	// This cannot be used as a mongoose schema pathname. As we are not really using it, I'm just gonna leave it
	// commented out for now.
	// errors: [{}],
	headerFile: fileSchema,
	productionDailyFile: fileSchema,
	productionMonthlyFile: fileSchema,
	directionalSurveyFile: fileSchema,

	importType: { type: String, enum: ['generic', 'aries'] },
	files: [fileSchema],

	ariesSetting: {},

	wellsToCreate: { type: [wellInfoSchema], default: null },
	wellsToUpdate: { type: [updateWellInfoSchema], default: null },

	importMode: { type: String, enum: ['create', 'update', 'both'], default: 'both' },

	dataSettings: {
		coordinateReferenceSystem: { type: String, enum: ['WGS84', 'NAD27', 'NAD83'], default: 'WGS84' },
	},

	batchFiles: [String],
});

FileImportSchema.virtual('changeStatus').set(function changeStatus(new_status) {
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	this.status = new_status;
	// eslint-disable-next-line @typescript-eslint/no-invalid-this -- TODO eslint fix later
	this.events.push({ type: new_status, date: new Date() });
});

module.exports = { FileImportSchema };
