// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');

const ECON_RUN_V2_SENSITIVITY = 2;
const ECON_RUN_V3_VISUALIZATIONS = 3;
const ECON_RUN_V4_INCREMENTALS = 4;

// eslint-disable-next-line new-cap -- TODO eslint fix later
const EconRunSchema = Schema(
	{
		batchSize: { type: Number, required: true },
		error: {},
		econFiles: {
			byWellMonthlyCsv: { type: Schema.ObjectId },
		},
		outputGroups: {},
		outputParams: {
			type: {
				runMode: { type: String, default: 'full', enum: ['full', 'fast', 'lite'] },
				columns: [{}],
				columnFields: {},
				generalOptions: {},
				suggestedHeaders: { type: Boolean, default: false },

				projectName: { type: String, required: true },
				scenarioName: { type: String, required: true },
				userName: { type: String, required: true },
				generalOptionsName: { type: String, required: true },
				combos: {
					type: [
						{
							// _id: { type: Schema.ObjectId } // automatically added by mongoose
							name: { type: String, required: true },
							qualifiers: { type: Object, required: true },
						},
					],
					required: true,
				},
				timeZone: { type: String, default: 'UTC' },
			},
			required: true,
		},
		outputVersion: {
			// version of the output generation being used at the time this run is created
			// necessary to detect which features (e.g: visualization) are available for this run
			type: Number,
			required: true,
		},
		pivotTables: {},
		project: { type: Schema.ObjectId, ref: 'projects', required: true, immutable: true, index: true },
		reports: {
			// [PowerBITemplate]: {lastRefreshUserRequestId: String},
		},
		runDate: { type: Date, required: true, immutable: true, index: true },
		reportDate: { type: Date }, // deprecated
		reportRefreshStart: { type: Date }, // deprecated
		scenario: { type: Schema.ObjectId, ref: 'scenarios', required: true, immutable: true },
		status: { type: String, enum: ['pending', 'complete', 'failed'] },
		usedUmbrellas: [
			/**
			 * Used qualifiers
			 *
			 * @deprecated: usage of this field should be discontinued in favor of `combos`
			 */
			{
				column: { type: String, required: true },
				name: { type: String, required: true },
			},
		],
		user: { type: Schema.ObjectId, ref: 'users', required: true, immutable: true, index: true },
		wells: {
			type: [{ type: Schema.ObjectId, ref: 'wells' }],
			required: true,
			immutable: true,
		},
		scenarioWellAssignments: {
			type: [{ type: Schema.ObjectId, ref: 'scenario-well-assignments' }],
			required: true,
			immutable: true,
		},
		econGroups: {
			type: [{ type: Schema.ObjectId, ref: 'econ-groups' }],
			required: false,
			immutable: true,
		},
		tags: [{ type: Schema.ObjectId, ref: 'tags', index: true }],
	},
	{ timestamps: true }
);

EconRunSchema.index({ scenario: 1, user: 1 }, { unique: true });

module.exports = { EconRunSchema, ECON_RUN_V2_SENSITIVITY, ECON_RUN_V3_VISUALIZATIONS, ECON_RUN_V4_INCREMENTALS };
