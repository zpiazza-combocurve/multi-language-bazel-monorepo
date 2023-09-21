import { PERIOD_DATA_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import {
	AdvancedTableRowWithPeriod,
	BaseAssumptionsCriteriaKeys,
} from '@/cost-model/detail-components/AdvancedModelView/types';

import {
	concatenateKeyCategory,
	getModelTimeSeriesRows,
	groupTimeSeriesRows,
	parseAssumptionOptionsRowsCriteria,
} from './shared';

describe('groupTimeSeriesRows', () => {
	test('correctly groups rows with keys', () => {
		const rows = [
			{ key: 'Oil', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '3', escalation: 'None' },
			{ key: 'Gas', unit: '$/MMBTU', criteria: 'Flat', period: 'Flat', value: '7', escalation: 'None' },
			{ key: 'NGL', unit: '% of Oil Price', criteria: 'As Of', period: 6, value: '100', escalation: 'None' },
			{ period: 9, value: '99' },
			{ key: 'Drip Cond', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '9', escalation: 'None' },
			{ key: '8/8ths Break Even', unit: 'NPV Discount %', criteria: 'Based on Price Ratio', value: '1' },
		];
		const result = groupTimeSeriesRows(rows as AdvancedTableRowWithPeriod[]);
		expect(result).toEqual([
			[{ key: 'Oil', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '3', escalation: 'None' }],
			[{ key: 'Gas', unit: '$/MMBTU', criteria: 'Flat', period: 'Flat', value: '7', escalation: 'None' }],
			[
				{ key: 'NGL', unit: '% of Oil Price', criteria: 'As Of', period: 6, value: '100', escalation: 'None' },
				{ period: 9, value: '99' },
			],
			[{ key: 'Drip Cond', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '9', escalation: 'None' }],
			[{ key: '8/8ths Break Even', unit: 'NPV Discount %', criteria: 'Based on Price Ratio', value: '1' }],
		]);
	});
	test('correctly group rows with no period', () => {
		const rows = [
			{ key: 'Oil', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '3', escalation: 'None' },
			{ key: 'Gas', unit: '$/MMBTU', criteria: 'Flat', period: 'Flat', value: '7', escalation: 'None' },
			{ key: 'NGL', unit: '% of Oil Price', criteria: 'As Of', period: 6, value: '100', escalation: 'None' },
			{ key: 'Drip Cond', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '9', escalation: 'None' },
			{ key: '8/8ths Break Even', unit: 'NPV Discount %', criteria: 'Based on Price Ratio', value: '1' },
		];
		const result = groupTimeSeriesRows(rows as AdvancedTableRowWithPeriod[]);
		expect(result).toEqual([
			[{ key: 'Oil', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '3', escalation: 'None' }],
			[{ key: 'Gas', unit: '$/MMBTU', criteria: 'Flat', period: 'Flat', value: '7', escalation: 'None' }],
			[{ key: 'NGL', unit: '% of Oil Price', criteria: 'As Of', period: 6, value: '100', escalation: 'None' }],
			[{ key: 'Drip Cond', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '9', escalation: 'None' }],
			[{ key: '8/8ths Break Even', unit: 'NPV Discount %', criteria: 'Based on Price Ratio', value: '1' }],
		]);
	});
	test('throw error if the keys are not in proper order', () => {
		const rows = [
			{ period: 9, value: '99' },
			{ key: 'Oil', unit: '$/BBL', criteria: 'Flat', period: 'Flat', value: '3', escalation: 'None' },
			{ key: 'Gas', unit: '$/MMBTU', criteria: 'Flat', period: 'Flat', value: '7', escalation: 'None' },
			{ key: '8/8ths Break Even', unit: 'NPV Discount %', criteria: 'Based on Price Ratio', value: '1' },
		];
		expect(() => groupTimeSeriesRows(rows as AdvancedTableRowWithPeriod[])).toThrow(
			'groupTimeSeriesRows: group does not have a key'
		);
	});
});

describe('parseAssumptionOptionsRowsCriteria', () => {
	describe('when row criteria is flat', () => {
		test('returns "Flat"', () => {
			const row = {
				[ROW_ID_KEY]: '1',
				criteria: 'Flat',
				period: 'Flat',
				[PERIOD_DATA_KEY]: {
					nextPeriod: null,
					criteria: 'Flat',
					isLastRow: true,
					start: 1,
					end: 'Econ Limit',
				},
			};
			const result = parseAssumptionOptionsRowsCriteria({ row, isRateCriteria: true });
			expect(result).toStrictEqual('Flat');
		});
	});

	describe('when isRateCriteria is passed as true', () => {
		test('returns object with start and end attributes', () => {
			const row = {
				[ROW_ID_KEY]: '1',
				[PERIOD_DATA_KEY]: { start: 1, end: 2, isLastRow: false, criteria: 'Gas Rate', nextPeriod: false },
			};
			const result = parseAssumptionOptionsRowsCriteria({ row, isRateCriteria: true });
			expect(result).toStrictEqual({ start: 1, end: 2 });
		});
	});

	describe('when isDateCriteria is passed as true', () => {
		const row = {
			[ROW_ID_KEY]: '1',
			period: '01/2023',
			[PERIOD_DATA_KEY]: {
				nextPeriod: false,
				criteria: 'Dates',
				start: '01/2023',
				end: '03/2023',
				isLastRow: false,
			},
		};

		describe('when row has last row attribute set as false', () => {
			test('returns object with start_date and end_date formatted as YYYY/MM/DD and period being the difference between start and end dates in months + 1', () => {
				row[PERIOD_DATA_KEY].isLastRow = false;
				const result = parseAssumptionOptionsRowsCriteria({ row, isDateCriteria: true });
				expect(result).toStrictEqual({ end_date: '2023/02/28', period: 3, start_date: '2023/01/01' });
			});
		});

		describe('when row has last row attribute set as true', () => {
			test('returns object with start_date formatted as YYYY/MM/DD, end_date equals "Econ Limit" and period equals 1', () => {
				row[PERIOD_DATA_KEY].isLastRow = true;
				const result = parseAssumptionOptionsRowsCriteria({ row, isDateCriteria: true });
				expect(result).toStrictEqual({ end_date: 'Econ Limit', period: 1, start_date: '2023/01/01' });
			});
		});
	});

	describe('when both isRateCriteria and isDateCriteria are passed as false', () => {
		const row: AdvancedTableRowWithPeriod = {
			[ROW_ID_KEY]: '1',
			period: 5,
			[PERIOD_DATA_KEY]: {
				nextPeriod: 7,
				criteria: 'As Of',
				isLastRow: false,
				start: 2,
				end: 7,
			},
		};

		describe('when row has last row attribute set as false', () => {
			test('returns object with following attributes: start, period and end equals end - 1', () => {
				if (row[PERIOD_DATA_KEY]) row[PERIOD_DATA_KEY].isLastRow = false;
				const result = parseAssumptionOptionsRowsCriteria({ row });
				expect(result).toStrictEqual({ start: 2, end: 6, period: 5 });
			});
		});

		describe('when row has last row attribute set as true', () => {
			test('returns object with following attributes: start, period and end equals end - 1', () => {
				if (row[PERIOD_DATA_KEY]) {
					row[PERIOD_DATA_KEY].isLastRow = true;
					row[PERIOD_DATA_KEY].end = 'Econ Limit';
					row[PERIOD_DATA_KEY].nextPeriod = null;
				}
				const result = parseAssumptionOptionsRowsCriteria({ row });
				expect(result).toStrictEqual({ start: 2, end: 6, period: 5 });
			});
		});
	});
});

describe('concatenateKeyCategory', () => {
	const testKey = 'TestKey';
	const testCategory = 'TestCategory';
	const expectedConcatenatedResult = testKey.concat(testCategory);

	test('returns key and category concatenated when both are passed', () => {
		const response = concatenateKeyCategory({ key: testKey, category: testCategory });
		expect(response).toBe(expectedConcatenatedResult);
	});

	test('returns key value when category is not passed', () => {
		const response = concatenateKeyCategory({ key: testKey });
		expect(response).toBe(testKey);
	});

	test('returns category value when key is not passed', () => {
		const response = concatenateKeyCategory({ category: testCategory });
		expect(response).toBe(testCategory);
	});
});

describe('getModelTimeSeriesRows', () => {
	const DATES_CRITERIA_ROWS = [
		{
			[ROW_ID_KEY]: '1',
			key: 'Oil',
			criteria: 'Dates',
			period: '01/2023',
			value: 10,
			[PERIOD_DATA_KEY]: {
				nextPeriod: '03/2023',
				criteria: 'Dates',
				start: '01/2023',
				end: '03/2023',
				isLastRow: false,
			},
		},
		{
			[ROW_ID_KEY]: '2',
			period: '03/2023',
			value: 20,
			[PERIOD_DATA_KEY]: {
				nextPeriod: '06/2023',
				criteria: 'Dates',
				start: '03/2023',
				end: '06/2023',
				isLastRow: false,
			},
		},
		{
			[ROW_ID_KEY]: '3',
			period: '06/2023',
			value: 30,
			[PERIOD_DATA_KEY]: {
				nextPeriod: undefined,
				criteria: 'Dates',
				start: '06/2023',
				end: 'Econ Limit',
				isLastRow: true,
			},
		},
	];

	const AS_OF_CRITERIA_ROWS = [
		{
			[ROW_ID_KEY]: '1',
			key: 'Gas',
			criteria: 'As Of',
			period: 1,
			value: 10,
			[PERIOD_DATA_KEY]: {
				nextPeriod: 4,
				criteria: 'As Of',
				isLastRow: false,
				start: 1,
				end: 2,
			},
		},
		{
			[ROW_ID_KEY]: '2',
			period: 4,
			value: 20,
			[PERIOD_DATA_KEY]: {
				nextPeriod: 5,
				criteria: 'As Of',
				isLastRow: false,
				start: 2,
				end: 6,
			},
		},
		{
			[ROW_ID_KEY]: '3',
			period: 5,
			value: 30,
			[PERIOD_DATA_KEY]: {
				nextPeriod: null,
				criteria: 'As Of',
				isLastRow: true,
				start: 6,
				end: 'Econ Limit',
			},
		},
	];

	describe('returns an array of rows with each row containing assumption key and parsed criteria', () => {
		const assumptionKeys = ['price', 'differential'];
		const criteria = [
			{
				criteria: 'DATES',
				rows: DATES_CRITERIA_ROWS,
				expectedCriteriaKeys: ['start_date', 'end_date', 'period'],
			},
			{ criteria: 'AS_OF', rows: AS_OF_CRITERIA_ROWS, expectedCriteriaKeys: ['start', 'end', 'period'] },
		];
		assumptionKeys.forEach((assumptionKey) => {
			criteria.forEach(({ criteria, rows, expectedCriteriaKeys }) => {
				const response = getModelTimeSeriesRows({
					rows: rows as AdvancedTableRowWithPeriod[],
					criteria,
					assumptionKey: assumptionKey as BaseAssumptionsCriteriaKeys,
				});

				response.forEach((row, idx) => {
					test(`returns row ${idx} has "${assumptionKey}" key`, () => {
						expect(row).toHaveProperty(assumptionKey);
					});

					test(`returns row ${idx} ${assumptionKey} equals to corresponding input row value`, () => {
						const expectedValue = rows[idx].value;
						expect(row[assumptionKey]).toBe(expectedValue);
					});

					test.each(expectedCriteriaKeys)('returns row %i with parsed criteria containing %s key', (key) => {
						expect(row.criteria).toHaveProperty(key);
					});
				});
			});
		});
	});
});
