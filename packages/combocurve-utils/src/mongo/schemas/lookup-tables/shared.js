// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const _ = require('lodash');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const Types = require('mongoose');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { WellSchema } = require('../wells');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { PROJECT_CUSTOM_HEADER_KEYS } = require('../project-custom-headers');

const IGNORE_HEADERS = ['schemaVersion'];

const WELL_HEADERS = _.difference(Object.keys(WellSchema.obj), IGNORE_HEADERS);

const LOOKUP_TABLES_OPERATORS = {
	EQUAL: 'equal',
	NOT_EQUAL: 'not_equal',
	GREATER_THAN: 'greater_than',
	GREATER_THAN_EQUAL: 'greater_than_equal',
	LESS_THAN: 'less_than',
	LESS_THAN_EQUAL: 'less_than_equal',
	IN: 'in',
	NOT_IN: 'not_in',
};

const lookupTableFilter = {
	conditions: {
		required: true,
		type: [
			{
				key: { type: String, enum: [...WELL_HEADERS, ...PROJECT_CUSTOM_HEADER_KEYS], required: true },
				operator: {
					type: String,
					enum: Object.values(LOOKUP_TABLES_OPERATORS),
					default: LOOKUP_TABLES_OPERATORS.EQUAL,
				},
				value: { type: Types.Mixed, required: true },
			},
		],
	},
};

const LOOKUP_TABLES_WELL_HEADERS_WITH_TYPES = WELL_HEADERS.reduce((accumulator, header) => {
	accumulator[header] = WellSchema.path(header).instance.toString();
	return accumulator;
}, {});

module.exports = { WELL_HEADERS, LOOKUP_TABLES_OPERATORS, lookupTableFilter, LOOKUP_TABLES_WELL_HEADERS_WITH_TYPES };
