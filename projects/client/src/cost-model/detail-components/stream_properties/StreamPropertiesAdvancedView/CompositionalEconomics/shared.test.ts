import { GetGroupRowAggParams } from 'ag-grid-community';

import {
	calculateGroupRowAggState,
	computePlantEfficiency,
	computePostExtraction,
	computeRemainingMolPercentage,
	computeShrinkPercentRemaining,
	computeYield,
} from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/CompositionalEconomics/shared';
import { CompositionalEconomicsRow } from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/CompositionalEconomics/types';

const columns = ['category', 'molPercentage', 'molFactor', 'plantEfficiency', 'value', 'shrink', 'postExtraction'];
const rows = [
	['CO2', 0.577, 6.4593, 0.0, 0, 0.577, 0.6431],
	['N2', 0.553, 4.1643, 0.0, 0, 0.553, 0.6164],
	['C1', 82.586, 6.417, 0.0, 0, 82.586, 92.055],
	['C2', 9.189, 10.123, 47.241, 27.57, 4.848, 5.4038],
	['C3', 3.958, 10.428, 80.5, 20.846, 0.7718, 0.8602],
	['iC4', 0.564, 12.386, 85.8, 3.76, 0.08, 0.0891],
	['nC4', 1.06, 11.933, 83.5, 6.627, 0.1749, 0.1949],
	['iC5', 0.367, 13.843, 82.5, 2.63, 0.0642, 0.0715],
	['nC5', 0.336, 13.721, 82.5, 2.3863, 0.0588, 0.0655],
];

const data = rows.map((row) => {
	const obj = {};
	columns.forEach((column, index) => {
		obj[column] = row[index];
	});
	return { ...obj, key: 'Compositional', source: 'Calculated' } as CompositionalEconomicsRow;
});

const subtotalShrink = data.reduce((acc, row) => acc + Number(row.shrink), 0);

describe('Compute plant efficiency', () => {
	test('should return 0 if no data is passed', () => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		expect(computePlantEfficiency({})).toBe(0);
	});
});

describe.each(data)(`given row %p`, (row) => {
	test(`should return ${row.plantEfficiency} plant efficiency`, () => {
		expect(computePlantEfficiency(row)).toBeCloseTo(row.plantEfficiency ?? 0, 1);
	});

	test(`should return ${row.value} yield`, () => {
		expect(computeYield(row)).toBeCloseTo(Number(row.value) ?? 0, 1);
	});

	test(`should return ${row.shrink} shrink`, () => {
		expect(computeShrinkPercentRemaining(row)).toBeCloseTo(Number(row.shrink) ?? 0, 1);
	});

	test(`should return ${row.postExtraction} post extraction`, () => {
		expect(computePostExtraction(row, subtotalShrink)).toBeCloseTo(Number(row.postExtraction) ?? 0, 1);
	});
});

describe('computeRemainingMolPercentage', () => {
	const componentRows = data.filter((row) => row.category !== 'Remaining');
	test('should return expected mol percentage', () => {
		expect(computeRemainingMolPercentage(componentRows)).toBeCloseTo(0.81);
	});
});

describe('calculateGroupRowAggState', () => {
	const params = {
		nodes: [
			{
				data: {
					category: 'C2',
					value: 25,
					molPercentage: 9.189,
					molFactor: 10.123,
					plantEfficiency: 42.8363,
					shrink: 5.2528,
					btu: 1769.7,
					postExtraction: 6.1412,
				},
			},
			{
				data: {
					category: 'C3',
					value: 20,
					molPercentage: 3.958,
					molFactor: 10.428,
					plantEfficiency: 77.233,
					shrink: 0.9011,
					btu: 2515.1,
					postExtraction: 1.0535,
				},
			},
			{
				data: {
					category: 'Remaining',
					value: 90,
					molPercentage: 86.853,
					molFactor: undefined,
					plantEfficiency: undefined,
					shrink: 79.38,
					btu: 1000,
					postExtraction: 92.8053,
				},
			},
		],
	};

	const expectedResult = {
		groupRowAgg: {
			key: 'Subtotal',
			value: 135,
			molPercentage: 100,
			shrink: 85.53,
			btu: 1063.23,
			postExtraction: 100,
		},
		rowsLength: 3,
	};

	test('should return the correct subtotals', () => {
		expect(calculateGroupRowAggState(params as GetGroupRowAggParams)).toEqual(expectedResult);
	});
});
