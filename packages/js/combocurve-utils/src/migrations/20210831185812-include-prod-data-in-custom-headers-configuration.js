const CUSTOM_WELL_HEADERS = {
	custom_string_0: 'Custom String 0',
	custom_string_1: 'Custom String 1',
	custom_string_2: 'Custom String 2',
	custom_string_3: 'Custom String 3',
	custom_string_4: 'Custom String 4',
	custom_string_5: 'Custom String 5',
	custom_string_6: 'Custom String 6',
	custom_string_7: 'Custom String 7',
	custom_string_8: 'Custom String 8',
	custom_string_9: 'Custom String 9',
	custom_string_10: 'Custom String 10',
	custom_string_11: 'Custom String 11',
	custom_string_12: 'Custom String 12',
	custom_string_13: 'Custom String 13',
	custom_string_14: 'Custom String 14',
	custom_string_15: 'Custom String 15',
	custom_string_16: 'Custom String 16',
	custom_string_17: 'Custom String 17',
	custom_string_18: 'Custom String 18',
	custom_string_19: 'Custom String 19',
	custom_number_0: 'Custom Number 0',
	custom_number_1: 'Custom Number 1',
	custom_number_2: 'Custom Number 2',
	custom_number_3: 'Custom Number 3',
	custom_number_4: 'Custom Number 4',
	custom_number_5: 'Custom Number 5',
	custom_number_6: 'Custom Number 6',
	custom_number_7: 'Custom Number 7',
	custom_number_8: 'Custom Number 8',
	custom_number_9: 'Custom Number 9',
	custom_number_10: 'Custom Number 10',
	custom_number_11: 'Custom Number 11',
	custom_number_12: 'Custom Number 12',
	custom_number_13: 'Custom Number 13',
	custom_number_14: 'Custom Number 14',
	custom_number_15: 'Custom Number 15',
	custom_number_16: 'Custom Number 16',
	custom_number_17: 'Custom Number 17',
	custom_number_18: 'Custom Number 18',
	custom_number_19: 'Custom Number 19',
	custom_date_0: 'Custom Date 0',
	custom_date_1: 'Custom Date 1',
	custom_date_2: 'Custom Date 2',
	custom_date_3: 'Custom Date 3',
	custom_date_4: 'Custom Date 4',
	custom_date_5: 'Custom Date 5',
	custom_date_6: 'Custom Date 6',
	custom_date_7: 'Custom Date 7',
	custom_date_8: 'Custom Date 8',
	custom_date_9: 'Custom Date 9',
	custom_bool_0: 'Custom Bool 0',
	custom_bool_1: 'Custom Bool 1',
	custom_bool_2: 'Custom Bool 2',
	custom_bool_3: 'Custom Bool 3',
	custom_bool_4: 'Custom Bool 4',
};

const DEFAULT_PRODUCTION_HEADERS = {
	customNumber0: { label: 'Custom Number 0' },
	customNumber1: { label: 'Custom Number 1' },
	customNumber2: { label: 'Custom Number 2' },
	customNumber3: { label: 'Custom Number 3' },
	customNumber4: { label: 'Custom Number 4' },
};

async function up({ db }) {
	const {
		wells,
		'daily-productions': dailyProductions,
		'monthly-productions': monthlyProductions,
		createdAt,
		...rest
	} = (await db.collection('custom-header-configurations').findOne({})) || {};

	const newConfig = {
		wells:
			wells ||
			Object.fromEntries(Object.entries(CUSTOM_WELL_HEADERS).map(([h, label]) => [h, rest[h] || { label }])),
		'daily-productions': dailyProductions || DEFAULT_PRODUCTION_HEADERS,
		'monthly-productions': monthlyProductions || DEFAULT_PRODUCTION_HEADERS,
		createdAt: createdAt || new Date(),
		updatedAt: new Date(),
	};

	await db.collection('custom-header-configurations').replaceOne({}, newConfig, { upsert: true });
}

module.exports = { up, uses: ['mongodb'] };
