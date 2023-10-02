import { Types } from 'mongoose';

import { TypeError } from '@src/helpers/validation';

import { checkDuplicateProduction, DuplicateProductionError, parseApiMonthlyProduction } from './validation';

describe('v1/monthly-productions/validation', () => {
	test('checkDuplicateProduction', () => {
		const prodData = {
			oil: 1,
			gas: 2,
			water: 3,
			choke: 4,
			days_on: 5,
			operational_tag: 'test',
			gasInjection: 12,
			waterInjection: 13,
			co2Injection: 14,
			steamInjection: 15,
			ngl: 16,
			customNumber0: 17,
			customNumber1: 18,
			customNumber2: 19,
			customNumber3: 20,
			customNumber4: 21,
			arrayIndex: null,
		};
		const prod1 = { well: Types.ObjectId('123456789012345678901234'), index: 123, ...prodData };
		const prod2 = { well: Types.ObjectId('123456789012345678901235'), index: 123, ...prodData };
		const prod3 = { well: Types.ObjectId('123456789012345678901234'), index: 124, ...prodData };
		const prod4 = { well: Types.ObjectId('123456789012345678901235'), index: 124, ...prodData };
		const prod1_2 = { well: Types.ObjectId('123456789012345678901234'), index: 123, ...prodData };

		const wellIdToChosenIdMap = new Map();

		expect(() => checkDuplicateProduction([], wellIdToChosenIdMap)).not.toThrow(DuplicateProductionError);
		expect(() => checkDuplicateProduction([prod1], wellIdToChosenIdMap)).not.toThrow(DuplicateProductionError);
		expect(() => checkDuplicateProduction([prod1, prod2], wellIdToChosenIdMap)).not.toThrow(
			DuplicateProductionError,
		);
		expect(() => checkDuplicateProduction([prod1, prod3], wellIdToChosenIdMap)).not.toThrow(
			DuplicateProductionError,
		);
		expect(() => checkDuplicateProduction([prod1, prod4], wellIdToChosenIdMap)).not.toThrow(
			DuplicateProductionError,
		);
		expect(() => checkDuplicateProduction([prod1, prod2, prod3, prod4], wellIdToChosenIdMap)).not.toThrow(
			DuplicateProductionError,
		);

		expect(() => checkDuplicateProduction([prod1, prod2, prod1, prod3, prod4], wellIdToChosenIdMap)).toThrow(
			DuplicateProductionError,
		);
		expect(() => checkDuplicateProduction([prod1, prod2, prod1_2, prod3, prod4], wellIdToChosenIdMap)).toThrow(
			DuplicateProductionError,
		);
		expect(() => checkDuplicateProduction([prod2, prod3, prod1_2, prod1, prod1], wellIdToChosenIdMap)).toThrow(
			DuplicateProductionError,
		);
	});

	test('parseApiMonthlyProduction', () => {
		expect(() =>
			parseApiMonthlyProduction({
				well: '5e28beb08060a6183c54cd1b',
				date: '1970-01-01T00:00:00.000Z',
				water: '9999',
			}),
		).toThrow(TypeError);
		expect(() =>
			parseApiMonthlyProduction({
				well: '5e28beb08060a6183c54cd1b',
				date: '1970-01-01T00:00:00.000Z',
				gas: '9999',
			}),
		).toThrow(TypeError);
	});
});
