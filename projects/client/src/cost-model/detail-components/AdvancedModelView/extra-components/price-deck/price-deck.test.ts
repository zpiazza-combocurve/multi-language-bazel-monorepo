import { IS_NESTED_ROW_KEY, ROW_ID_KEY, TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRowWithPeriod } from '@/cost-model/detail-components/AdvancedModelView/types';
import {
	DIFFERENTIALS_CATEGORIES,
	DIFFERENTIALS_CRITERIA,
	DIFFERENTIALS_KEYS_CONFIG,
	DIFFERENTIALS_UNITS,
} from '@/cost-model/detail-components/differentials/DifferentialsAdvancedView/constants';
import {
	PRICING_CRITERIA,
	PRICING_KEYS,
	PRICING_KEYS_CATEGORIES,
	PRICING_UNITS_MAPPINGS,
	pricingProductNameToKey,
} from '@/cost-model/detail-components/pricing/PricingAdvancedView/constants';

import { priceDecksToRows } from './shared';
import { DeckProduct, RowStructure } from './types';

const differentialsHeaderRowStructure: RowStructure = {
	key: DIFFERENTIALS_KEYS_CONFIG.OIL.label,
	category: DIFFERENTIALS_CATEGORIES.firstDiff,
	criteria: DIFFERENTIALS_CRITERIA.DATES,
	unit: DIFFERENTIALS_UNITS.PER_BBL,
	escalation: 'None',
};

describe('tests priceDecksToRows', () => {
	test('should convert Differentialsprice decks to rows for the advanced table', () => {
		const productEntries = [
			{
				code: '4681',
				settlements: [
					{
						date: '2023-06-01',
						settle: '-4.49',
					},
					{
						date: '2023-07-01',
						settle: '-4.27',
					},
					{
						date: '2023-08-01',
						settle: '-4.13',
					},
					{
						date: '2023-09-01',
						settle: '-4.12',
					},
					{
						date: '2023-10-01',
						settle: '-4.08',
					},
				],
			},
		];
		const expectedRows = [
			{
				key: 'Oil',
				category: '1st Diff',
				criteria: 'Dates',
				unit: '$/BBL',
				period: '06/2023',
				value: '-4.49',
				escalation: 'None',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: false,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String)]),
			},
			{
				period: '07/2023',
				value: '-4.27',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '08/2023',
				value: '-4.13',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '09/2023',
				value: '-4.12',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '10/2023',
				value: '-4.08',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
		];

		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should handle "Econ Limit" cmeDate', () => {
		const productEntries = [
			{
				code: '123',
				settlements: [{ date: 'Econ Limit', settle: '55.0' }],
			},
		];
		const expectedRows = [
			{
				key: 'Oil',
				category: '1st Diff',
				criteria: 'Dates',
				unit: '$/BBL',
				period: 'Econ Limit',
				value: '55.0',
				escalation: 'None',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: false,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String)]),
			},
		];
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should return an empty array when input is empty', () => {
		const productEntries: DeckProduct[] = [];
		const expectedRows: AdvancedTableRowWithPeriod[] = [];
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should return empty array if the headers are undefined', () => {
		const productEntries = [
			{
				code: '123',
				settlements: [{ date: 'Econ Limit', settle: '55.0' }],
			},
		];
		const expectedRows: AdvancedTableRowWithPeriod[] = [];
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		const actualRows = priceDecksToRows(productEntries, undefined);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should return an empty array when input is undefined', () => {
		const productEntries = undefined;
		const expectedRows: AdvancedTableRowWithPeriod[] = [];
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should return an empty array when input is null', () => {
		const productEntries = null;
		const expectedRows: AdvancedTableRowWithPeriod[] = [];
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should gracefully handle missing properties in input', () => {
		const productEntries = [
			{ code: '123', product: 'oil' },
			{ product: 'gas', settlements: [] },
		];
		const expectedRows: AdvancedTableRowWithPeriod[] = [];
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should generate unique rowIds for duplicate settlement dates', () => {
		const productEntries = [
			{
				code: '123',
				settlements: [
					{ date: '2023-05-01', settle: '55.0' },
					{ date: '2023-05-01', settle: '60.0' },
					{ date: '2023-05-02', settle: '70.0' },
				],
			},
		];
		const actualRows = priceDecksToRows(productEntries, [differentialsHeaderRowStructure]);
		const actualRowIds = actualRows.map((row) => row[ROW_ID_KEY]);
		expect(actualRowIds).toEqual(
			expect.arrayContaining([expect.any(String), expect.any(String), expect.any(String)])
		);
		expect(new Set(actualRowIds).size).toBe(actualRows.length);
	});
	test('should convert Pricing price decks to rows for the advanced table with comp econ Feature Flag on', () => {
		const productEntries = [
			{
				code: '444',
				product: 'gas',
				name: 'Henry Hub Natural Gas Future',
				link: 'gs://test-combocurve-price-catalog-raw/2023-05-02/444.json',
				settlements: [
					{ date: '2023-06-01', settle: '2.21400' },
					{ date: '2023-07-01', settle: '2.41700' },
					{ date: '2023-08-01', settle: '2.49500' },
					{ date: '2023-09-01', settle: '2.48000' },
					{ date: '2023-10-01', settle: '2.58800' },
					{ date: '2023-11-01', settle: '3.05400' },
					{ date: '2023-12-01', settle: '3.53400' },
					{ date: '2024-01-01', settle: '3.78100' },
					{ date: '2024-02-01', settle: '3.68500' },
					{ date: '2024-03-01', settle: '3.37800' },
					{ date: '2024-04-01', settle: '3.09900' },
				],
			},
		];
		const expectedRows = [
			{
				key: 'Gas',
				category: 'Full Stream',
				criteria: 'Dates',
				unit: '$/MMBTU',
				escalation: 'None',
				period: '06/2023',
				value: '2.21400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: false,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String)]),
			},
			{
				period: '07/2023',
				value: '2.41700',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '08/2023',
				value: '2.49500',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '09/2023',
				value: '2.48000',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '10/2023',
				value: '2.58800',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '11/2023',
				value: '3.05400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '12/2023',
				value: '3.53400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '01/2024',
				value: '3.78100',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '02/2024',
				value: '3.68500',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '03/2024',
				value: '3.37800',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '04/2024',
				value: '3.09900',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
		];
		const rowStructures: RowStructure[] = [];

		const mockIsCompositionalEconomicsEnabled = true;

		for (const product of productEntries) {
			const productKey = pricingProductNameToKey[product.product];
			const defaultCategory = mockIsCompositionalEconomicsEnabled
				? PRICING_KEYS_CATEGORIES[PRICING_KEYS[productKey]][0].label
				: undefined;
			const rowsStructure: RowStructure = {
				key: PRICING_KEYS[productKey],
				category: defaultCategory === 'N/A' ? null : defaultCategory,
				criteria: PRICING_CRITERIA.DATES,
				unit: PRICING_UNITS_MAPPINGS[PRICING_KEYS[productKey]][0],
				escalation: 'None',
			};
			rowStructures.push(rowsStructure);
		}

		const actualRows = priceDecksToRows(productEntries, rowStructures);
		expect(actualRows).toEqual(expectedRows);
	});
	test('should convert Pricing price decks to rows for the advanced table with comp econ Feature Flag off', () => {
		const productEntries = [
			{
				code: '444',
				product: 'gas',
				name: 'Henry Hub Natural Gas Future',
				link: 'gs://test-combocurve-price-catalog-raw/2023-05-02/444.json',
				settlements: [
					{ date: '2023-06-01', settle: '2.21400' },
					{ date: '2023-07-01', settle: '2.41700' },
					{ date: '2023-08-01', settle: '2.49500' },
					{ date: '2023-09-01', settle: '2.48000' },
					{ date: '2023-10-01', settle: '2.58800' },
					{ date: '2023-11-01', settle: '3.05400' },
					{ date: '2023-12-01', settle: '3.53400' },
					{ date: '2024-01-01', settle: '3.78100' },
					{ date: '2024-02-01', settle: '3.68500' },
					{ date: '2024-03-01', settle: '3.37800' },
					{ date: '2024-04-01', settle: '3.09900' },
				],
			},
		];
		const expectedRows = [
			{
				key: 'Gas',
				criteria: 'Dates',
				unit: '$/MMBTU',
				escalation: 'None',
				period: '06/2023',
				value: '2.21400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: false,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String)]),
			},
			{
				period: '07/2023',
				value: '2.41700',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '08/2023',
				value: '2.49500',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '09/2023',
				value: '2.48000',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '10/2023',
				value: '2.58800',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '11/2023',
				value: '3.05400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '12/2023',
				value: '3.53400',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '01/2024',
				value: '3.78100',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '02/2024',
				value: '3.68500',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '03/2024',
				value: '3.37800',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
			{
				period: '04/2024',
				value: '3.09900',
				[ROW_ID_KEY]: expect.any(String),
				[IS_NESTED_ROW_KEY]: true,
				[TREE_DATA_KEY]: expect.arrayContaining([expect.any(String), expect.any(String)]),
			},
		];
		const rowStructures: RowStructure[] = [];

		for (const product of productEntries) {
			const productKey = pricingProductNameToKey[product.product];
			const rowsStructure: RowStructure = {
				key: PRICING_KEYS[productKey],
				criteria: PRICING_CRITERIA.DATES,
				unit: PRICING_UNITS_MAPPINGS[PRICING_KEYS[productKey]][0],
				escalation: 'None',
			};
			rowStructures.push(rowsStructure);
		}

		const actualRows = priceDecksToRows(productEntries, rowStructures);
		expect(actualRows).toEqual(expectedRows);
	});
});
