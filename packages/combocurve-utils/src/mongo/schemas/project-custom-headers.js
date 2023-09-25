// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { Schema } = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { WellSchema } = require('./wells');

const PROJECT_CUSTOM_HEADER_KEY_PREFIX = '_project_custom_header';
const PROJECT_CUSTOM_HEADERS_LIMIT = 50;
const PROJECT_CUSTOM_HEADER_KEYS = [
	PROJECT_CUSTOM_HEADER_KEY_PREFIX,
	..._.range(PROJECT_CUSTOM_HEADERS_LIMIT - 1).map((_, i) => `${PROJECT_CUSTOM_HEADER_KEY_PREFIX}_${i + 1}`),
];

const wellFields = new Set(Object.keys(WellSchema.paths));

// eslint-disable-next-line new-cap -- TODO eslint fix later
const ProjectCustomHeaderSchema = Schema(
	{
		project: { type: Schema.ObjectId, ref: 'projects', index: true },
		headers: {
			type: [
				{
					name: {
						type: String,
						validate: {
							validator: (v) => !wellFields.has(v),
							message: '`{VALUE}` matches an existing field in the wells collection.',
						},
					},
					label: String,
					headerType: {
						type: {
							type: String,
							enum: ['string', 'number', 'boolean', 'date', 'percent', 'multi-select', 'multi-checkbox'],
						},

						primary: Boolean,
						visualization: Boolean,

						// for type: 'date'
						kind: { type: String, enum: ['date', 'timestamp'] },

						// for type: 'multi-select' | 'multi-checkbox'
						options: { type: [{ label: String, value: String }], default: undefined },

						// for type: 'number'
						min: Number,
						max: Number,
						digits: Number,

						// for type: 'string'
						static: Boolean,
					},
				},
			],
			validate: [
				{
					validator: (v) => new Set(v.map(({ name }) => name)).size === v.length,
					message: 'Header names in `{PATH}` are not unique.',
				},
				{
					validator: (v) => v.length <= PROJECT_CUSTOM_HEADERS_LIMIT,
					message: `\`{PATH}\` exceeds the limit of ${PROJECT_CUSTOM_HEADERS_LIMIT}.`,
				},
			],
		},
	},
	{ timestamps: true }
);

module.exports = {
	ProjectCustomHeaderSchema,
	PROJECT_CUSTOM_HEADER_KEY_PREFIX,
	PROJECT_CUSTOM_HEADERS_LIMIT,
	PROJECT_CUSTOM_HEADER_KEYS,
};
