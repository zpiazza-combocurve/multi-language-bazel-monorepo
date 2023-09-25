// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { ObjectId } = require('mongodb');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const setupDb = require('../../tests/setup-db');
// eslint-disable-next-line @typescript-eslint/no-var-requires -- TODO eslint fix later
const { up } = require('./20210831185812-include-prod-data-in-custom-headers-configuration');

let db;
let client;
let mongod;

const OLD_DOCUMENT = {
	custom_string_0: {
		label: 'XYZ header',
	},
	custom_string_1: {
		label: 'Commercial Area1',
	},
	custom_string_2: {
		label: 'Sub Type Curve Area',
	},
	custom_string_3: {
		label: 'LPI random Header',
	},
	custom_string_4: {
		label: 'CustomHeaderNew',
	},
	custom_string_5: {
		label: 'Congo Region DK',
	},
	custom_string_6: {
		label: 'US NAVY BASE',
	},
	custom_string_7: {
		label: 'Scout',
	},
	custom_string_8: {
		label: 'new new name for Text Header 9',
	},
	custom_string_9: {
		label: 'text header ten new name',
	},
	custom_number_0: {
		label: 'Test',
	},
	custom_number_1: {
		label: 'Custom Number Header 2',
	},
	custom_number_2: {
		label: 'EXETAT DK',
	},
	custom_number_3: {
		label: 'Employees size',
	},
	custom_number_4: {
		label: 'Custom Number Header 5',
	},
	custom_number_5: {
		label: 'Custom Number Header 6',
	},
	custom_number_6: {
		label: 'Custom Number Header 7',
	},
	custom_number_7: {
		label: 'Custom Number Header 8',
	},
	custom_number_8: {
		label: 'Custom Number Header 9',
	},
	custom_number_9: {
		label: 'Custom Number Header 10',
	},
	custom_date_0: {
		label: '04/30/2021',
	},
	custom_date_1: {
		label: 'Inauguration Date',
	},
	custom_date_2: {
		label: 'Custom Date Header 3',
	},
	custom_date_3: {
		label: 'Custom Date Header 4',
	},
	custom_date_4: {
		label: 'Custom Date Header 5',
	},
	custom_date_5: {
		label: 'Custom Date Header 6',
	},
	custom_date_6: {
		label: 'Custom Date Header 7',
	},
	custom_date_7: {
		label: 'Custom Date Header 8',
	},
	custom_date_8: {
		label: 'Custom Date Header 9',
	},
	custom_date_9: {
		label: 'Custom Date Header 10',
	},
	custom_bool_0: {
		label: 'yes ',
	},
	custom_bool_1: {
		label: 'Ecole DK',
	},
	custom_bool_2: {
		label: 'Custom Boolean Header 3',
	},
	custom_bool_3: {
		label: 'Custom Boolean Header 4',
	},
	custom_bool_4: {
		label: 'Custom Boolean Header 5',
	},
	custom_string_14: {
		label: 'my new label',
	},
	custom_number_10: {
		label: 'umer_heat map',
	},
	custom_number_11: {
		label: 'Custom Number Header 12',
	},
	custom_number_12: {
		label: 'Custom Number Header 13',
	},
	custom_number_13: {
		label: 'Custom Number Header 14',
	},
	custom_number_14: {
		label: 'Custom Number Header 15',
	},
	custom_number_15: {
		label: 'Custom Number Header 16',
	},
	custom_number_16: {
		label: 'Custom Number Header 17',
	},
	custom_number_17: {
		label: 'Custom Number Header 18',
	},
	custom_number_18: {
		label: 'Custom Number Header 19',
	},
	custom_number_19: {
		label: 'number 20 renamed',
	},
	custom_string_10: {
		label: 'Custom Text Header 11',
	},
	custom_string_11: {
		label: 'Custom Text Header 12',
	},
	custom_string_12: {
		label: 'Custom Text Header 13',
	},
	custom_string_13: {
		label: 'new name for Text Header 14',
	},
	custom_string_15: {
		label: 'Test_2(uk)',
	},
	custom_string_16: {
		label: 'Custom Text Header 17',
	},
	custom_string_17: {
		label: 'Custom Text Header 18',
	},
	custom_string_18: {
		label: 'Test_1(uk)',
	},
	custom_string_19: {
		label: 'Umer text',
	},

	createdAt: new Date('2020-09-22T02:19:36.580Z'),
	updatedAt: new Date('2021-06-11T20:32:25.522Z'),
};

const NEW_DOCUMENT = {
	wells: {
		custom_string_0: {
			label: 'XYZ header',
		},
		custom_string_1: {
			label: 'Commercial Area1',
		},
		custom_string_2: {
			label: 'Sub Type Curve Area',
		},
		custom_string_3: {
			label: 'LPI random Header',
		},
		custom_string_4: {
			label: 'CustomHeaderNew',
		},
		custom_string_5: {
			label: 'Congo Region DK',
		},
		custom_string_6: {
			label: 'US NAVY BASE',
		},
		custom_string_7: {
			label: 'Scout',
		},
		custom_string_8: {
			label: 'new new name for Text Header 9',
		},
		custom_string_9: {
			label: 'text header ten new name',
		},
		custom_number_0: {
			label: 'Test',
		},
		custom_number_1: {
			label: 'Custom Number Header 2',
		},
		custom_number_2: {
			label: 'EXETAT DK',
		},
		custom_number_3: {
			label: 'Employees size',
		},
		custom_number_4: {
			label: 'Custom Number Header 5',
		},
		custom_number_5: {
			label: 'Custom Number Header 6',
		},
		custom_number_6: {
			label: 'Custom Number Header 7',
		},
		custom_number_7: {
			label: 'Custom Number Header 8',
		},
		custom_number_8: {
			label: 'Custom Number Header 9',
		},
		custom_number_9: {
			label: 'Custom Number Header 10',
		},
		custom_date_0: {
			label: '04/30/2021',
		},
		custom_date_1: {
			label: 'Inauguration Date',
		},
		custom_date_2: {
			label: 'Custom Date Header 3',
		},
		custom_date_3: {
			label: 'Custom Date Header 4',
		},
		custom_date_4: {
			label: 'Custom Date Header 5',
		},
		custom_date_5: {
			label: 'Custom Date Header 6',
		},
		custom_date_6: {
			label: 'Custom Date Header 7',
		},
		custom_date_7: {
			label: 'Custom Date Header 8',
		},
		custom_date_8: {
			label: 'Custom Date Header 9',
		},
		custom_date_9: {
			label: 'Custom Date Header 10',
		},
		custom_bool_0: {
			label: 'yes ',
		},
		custom_bool_1: {
			label: 'Ecole DK',
		},
		custom_bool_2: {
			label: 'Custom Boolean Header 3',
		},
		custom_bool_3: {
			label: 'Custom Boolean Header 4',
		},
		custom_bool_4: {
			label: 'Custom Boolean Header 5',
		},
		custom_string_14: {
			label: 'my new label',
		},
		custom_number_10: {
			label: 'umer_heat map',
		},
		custom_number_11: {
			label: 'Custom Number Header 12',
		},
		custom_number_12: {
			label: 'Custom Number Header 13',
		},
		custom_number_13: {
			label: 'Custom Number Header 14',
		},
		custom_number_14: {
			label: 'Custom Number Header 15',
		},
		custom_number_15: {
			label: 'Custom Number Header 16',
		},
		custom_number_16: {
			label: 'Custom Number Header 17',
		},
		custom_number_17: {
			label: 'Custom Number Header 18',
		},
		custom_number_18: {
			label: 'Custom Number Header 19',
		},
		custom_number_19: {
			label: 'number 20 renamed',
		},
		custom_string_10: {
			label: 'Custom Text Header 11',
		},
		custom_string_11: {
			label: 'Custom Text Header 12',
		},
		custom_string_12: {
			label: 'Custom Text Header 13',
		},
		custom_string_13: {
			label: 'new name for Text Header 14',
		},
		custom_string_15: {
			label: 'Test_2(uk)',
		},
		custom_string_16: {
			label: 'Custom Text Header 17',
		},
		custom_string_17: {
			label: 'Custom Text Header 18',
		},
		custom_string_18: {
			label: 'Test_1(uk)',
		},
		custom_string_19: {
			label: 'Umer text',
		},
	},
	'daily-productions': {
		customNumber0: { label: 'Custom Number 0' },
		customNumber1: { label: 'Custom Number 1' },
		customNumber2: { label: 'Custom Number 2' },
		customNumber3: { label: 'Custom Number 3' },
		customNumber4: { label: 'Custom Number 4' },
	},
	'monthly-productions': {
		customNumber0: { label: 'Custom Number 0' },
		customNumber1: { label: 'Custom Number 1' },
		customNumber2: { label: 'Custom Number 2' },
		customNumber3: { label: 'Custom Number 3' },
		customNumber4: { label: 'Custom Number 4' },
	},

	createdAt: new Date('2020-09-22T02:19:36.580Z'),
	updatedAt: new Date('2021-06-11T20:32:25.522Z'),
};

const DEFAULT_NEW_DOCUMENT = {
	wells: {
		custom_string_0: { label: 'Custom String 0' },
		custom_string_1: { label: 'Custom String 1' },
		custom_string_2: { label: 'Custom String 2' },
		custom_string_3: { label: 'Custom String 3' },
		custom_string_4: { label: 'Custom String 4' },
		custom_string_5: { label: 'Custom String 5' },
		custom_string_6: { label: 'Custom String 6' },
		custom_string_7: { label: 'Custom String 7' },
		custom_string_8: { label: 'Custom String 8' },
		custom_string_9: { label: 'Custom String 9' },
		custom_string_10: { label: 'Custom String 10' },
		custom_string_11: { label: 'Custom String 11' },
		custom_string_12: { label: 'Custom String 12' },
		custom_string_13: { label: 'Custom String 13' },
		custom_string_14: { label: 'Custom String 14' },
		custom_string_15: { label: 'Custom String 15' },
		custom_string_16: { label: 'Custom String 16' },
		custom_string_17: { label: 'Custom String 17' },
		custom_string_18: { label: 'Custom String 18' },
		custom_string_19: { label: 'Custom String 19' },
		custom_number_0: { label: 'Custom Number 0' },
		custom_number_1: { label: 'Custom Number 1' },
		custom_number_2: { label: 'Custom Number 2' },
		custom_number_3: { label: 'Custom Number 3' },
		custom_number_4: { label: 'Custom Number 4' },
		custom_number_5: { label: 'Custom Number 5' },
		custom_number_6: { label: 'Custom Number 6' },
		custom_number_7: { label: 'Custom Number 7' },
		custom_number_8: { label: 'Custom Number 8' },
		custom_number_9: { label: 'Custom Number 9' },
		custom_number_10: { label: 'Custom Number 10' },
		custom_number_11: { label: 'Custom Number 11' },
		custom_number_12: { label: 'Custom Number 12' },
		custom_number_13: { label: 'Custom Number 13' },
		custom_number_14: { label: 'Custom Number 14' },
		custom_number_15: { label: 'Custom Number 15' },
		custom_number_16: { label: 'Custom Number 16' },
		custom_number_17: { label: 'Custom Number 17' },
		custom_number_18: { label: 'Custom Number 18' },
		custom_number_19: { label: 'Custom Number 19' },
		custom_date_0: { label: 'Custom Date 0' },
		custom_date_1: { label: 'Custom Date 1' },
		custom_date_2: { label: 'Custom Date 2' },
		custom_date_3: { label: 'Custom Date 3' },
		custom_date_4: { label: 'Custom Date 4' },
		custom_date_5: { label: 'Custom Date 5' },
		custom_date_6: { label: 'Custom Date 6' },
		custom_date_7: { label: 'Custom Date 7' },
		custom_date_8: { label: 'Custom Date 8' },
		custom_date_9: { label: 'Custom Date 9' },
		custom_bool_0: { label: 'Custom Bool 0' },
		custom_bool_1: { label: 'Custom Bool 1' },
		custom_bool_2: { label: 'Custom Bool 2' },
		custom_bool_3: { label: 'Custom Bool 3' },
		custom_bool_4: { label: 'Custom Bool 4' },
	},
	'daily-productions': {
		customNumber0: { label: 'Custom Number 0' },
		customNumber1: { label: 'Custom Number 1' },
		customNumber2: { label: 'Custom Number 2' },
		customNumber3: { label: 'Custom Number 3' },
		customNumber4: { label: 'Custom Number 4' },
	},
	'monthly-productions': {
		customNumber0: { label: 'Custom Number 0' },
		customNumber1: { label: 'Custom Number 1' },
		customNumber2: { label: 'Custom Number 2' },
		customNumber3: { label: 'Custom Number 3' },
		customNumber4: { label: 'Custom Number 4' },
	},

	createdAt: new Date('2020-09-22T02:19:36.580Z'),
	updatedAt: new Date('2021-06-11T20:32:25.522Z'),
};

beforeAll(async () => {
	({ db, client, mongod } = await setupDb());
});

afterAll(async () => {
	await mongod.stop();
	await client.close();
});

describe('20210831185812-include-prod-data-in-custom-headers-configuration', () => {
	afterEach(async () => {
		await db.collection('custom-header-configurations').deleteMany({});
	});

	test('old-document', async () => {
		await db.collection('custom-header-configurations').insert(OLD_DOCUMENT);

		await up({ db });

		const config = await db.collection('custom-header-configurations').findOne({});
		expect(config).toEqual({ ...NEW_DOCUMENT, _id: expect.any(ObjectId), updatedAt: expect.any(Date) });
	});

	test('new-document', async () => {
		await db.collection('custom-header-configurations').insert(NEW_DOCUMENT);

		await up({ db });

		const config = await db.collection('custom-header-configurations').findOne({});
		expect(config).toEqual({ ...NEW_DOCUMENT, _id: expect.any(ObjectId), updatedAt: expect.any(Date) });
	});

	test('no-previous-document', async () => {
		await up({ db });

		const config = await db.collection('custom-header-configurations').findOne({});
		expect(config).toEqual({
			...DEFAULT_NEW_DOCUMENT,
			_id: expect.any(ObjectId),
			createdAt: expect.any(Date),
			updatedAt: expect.any(Date),
		});
	});

	test('idempotence', async () => {
		await db.collection('custom-header-configurations').insert(OLD_DOCUMENT);

		await up({ db });
		await up({ db });

		const config = await db.collection('custom-header-configurations').findOne({});
		expect(config).toEqual({ ...NEW_DOCUMENT, _id: expect.any(ObjectId), updatedAt: expect.any(Date) });
	});
});
