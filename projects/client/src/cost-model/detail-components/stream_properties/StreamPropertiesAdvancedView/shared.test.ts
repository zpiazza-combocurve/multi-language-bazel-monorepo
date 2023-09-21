import { v4 as uuidv4 } from 'uuid';

import { PERIOD_DATA_KEY, ROW_ID_KEY, TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { addTreeDataInfo } from '@/cost-model/detail-components/AdvancedModelView/shared';
import {
	STREAM_PROPERTIES_CATEGORIES,
	STREAM_PROPERTIES_CRITERIA,
	STREAM_PROPERTIES_KEYS,
} from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/constants';
import { StreamPropertiesRow } from '@/cost-model/detail-components/stream_properties/StreamPropertiesAdvancedView/types';

import { getStreamPropertiesColumnsDef, rowBufferToOption } from './shared';

const STREAM_PROPERTIES_HEADER_NAME = 'Stream Properties';

const MOCKED_ROW_DATA = [
	{ [ROW_ID_KEY]: 'oil_shrink_key', key: 'Oil', category: 'Shrink' },
	{ [ROW_ID_KEY]: 'oil_loss_key', key: 'Oil', category: 'Loss' },
];

describe('StreamPropertiesAdvancedView shared functions', () => {
	describe('getStreamPropertiesColumnsDef', () => {
		describe('when enableELTColumn argument is passed as false', () => {
			const response = getStreamPropertiesColumnsDef(false);
			const streamPropertiesColGroupDef = response.find(
				({ headerName }) => headerName === STREAM_PROPERTIES_HEADER_NAME
			);

			test(`returns an array with a ColGroupDef object that has a headerName property of value ${STREAM_PROPERTIES_HEADER_NAME}`, () => {
				expect(Array.isArray(response)).toBe(true);
				expect(streamPropertiesColGroupDef).toHaveProperty('headerName', STREAM_PROPERTIES_HEADER_NAME);
			});

			test('returns an array without a eltName field as child of Stream Properties ColGroupDef', () => {
				const eltNameField = streamPropertiesColGroupDef?.children.find(
					(colDef) => colDef['field'] === 'eltName'
				);
				expect(eltNameField).toBeUndefined();
			});
		});

		describe('when enableELTColumn argument is passed as true', () => {
			const response = getStreamPropertiesColumnsDef(true);
			const streamPropertiesColGroupDef = response.find(
				({ headerName }) => headerName === STREAM_PROPERTIES_HEADER_NAME
			);

			test(`returns an array with a ColGroupDef object that has a headerName property of value ${STREAM_PROPERTIES_HEADER_NAME}`, () => {
				expect(Array.isArray(response)).toBe(true);
				expect(streamPropertiesColGroupDef).toHaveProperty('headerName', STREAM_PROPERTIES_HEADER_NAME);
			});

			test('returns an array with a eltName field as child of Stream Properties ColGroupDef', () => {
				const eltNameField = streamPropertiesColGroupDef?.children.find(
					(colDef) => colDef['field'] === 'eltName'
				);
				expect(eltNameField).not.toBeUndefined();
			});
		});
	});

	describe('addTreeDataInfo', () => {
		const response = addTreeDataInfo(MOCKED_ROW_DATA) as StreamPropertiesRow[];
		test.each(response)(
			'adds tree data key to $key/$category row',
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			({ key, category, [TREE_DATA_KEY]: treeDataKey }) => {
				expect(treeDataKey).not.toBeUndefined();
			}
		);
	});
});

describe('rowBufferToOption', () => {
	test('returns an option object for BTU row buffers', () => {
		const rowBuffer = [
			{
				key: STREAM_PROPERTIES_KEYS.BTU,
				category: null,
				criteria: null,
				period: null,
				value: '1000',
				unit: 'MBTU/MCF',
				source: null,
			},
		];
		const expectedOption = {
			btu_category: 'shrunk_gas',
			btu_value: 1000,
		};
		expect(rowBufferToOption(rowBuffer as unknown as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object for non-BTU row buffers', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.OIL,
				category: STREAM_PROPERTIES_CATEGORIES.SHRINK,
				criteria: 'Flat',
				period: 'Flat',
				value: '100',
				unit: '% Remaining',
				source: undefined,
				rate_type: undefined,
				rows_calculation_method: undefined,
			},
		];
		const expectedOption = {
			assumptionFieldName: 'shrinkage',
			categoryKey: 'oil',
			headers: {
				criteria: { value: 'entire_well_life', label: 'Flat' },
				pct_remaining: '% Remaining',
			},
			optionRows: [{ pct_remaining: 100, criteria: 'Flat' }],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object with correct headers for NGL row buffers', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.NGL,
				category: STREAM_PROPERTIES_CATEGORIES.YIELD,
				criteria: 'Flat',
				period: 'Flat',
				value: '0',
				unit: 'BBL/MMCF',
				source: 'Unshrunk Gas',
			},
		];
		const expectedOption = {
			assumptionFieldName: 'yields',
			categoryKey: 'ngl',
			headers: {
				yield: 'NGL Yield',
				gas_type: { label: 'Unshrunk Gas', value: 'unshrunk_gas' },
				criteria: { value: 'entire_well_life', label: 'Flat' },
			},
			optionRows: [{ gas_type: 'Unshrunk Gas', yield: 0, criteria: 'Flat' }],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object with correct headers for drip condensate row buffers', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.DRIP_COND,
				category: STREAM_PROPERTIES_CATEGORIES.YIELD,
				criteria: 'Flat',
				period: 'Flat',
				value: '0',
				unit: 'BBL/MMCF',
				source: 'Unshrunk Gas',
			},
		];
		const expectedOption = {
			assumptionFieldName: 'yields',
			categoryKey: 'drip_condensate',
			headers: {
				yield: 'Drip Cond Yield',
				gas_type: { label: 'Unshrunk Gas', value: 'unshrunk_gas' },
				criteria: { value: 'entire_well_life', label: 'Flat' },
			},
			optionRows: [{ gas_type: 'Unshrunk Gas', yield: 0, criteria: 'Flat' }],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object with correct rows for "Entire Well Life" criteria', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.GAS,
				category: STREAM_PROPERTIES_CATEGORIES.SHRINK,
				criteria: 'Flat',
				period: 'Flat',
				value: '100',
				unit: '% Remaining',
				source: undefined,
				rate_type: undefined,
				rows_calculation_method: undefined,
			},
		];
		const expectedOption = {
			assumptionFieldName: 'shrinkage',
			categoryKey: 'gas',
			headers: {
				criteria: { value: 'entire_well_life', label: 'Flat' },
				pct_remaining: '% Remaining',
			},
			optionRows: [{ pct_remaining: 100, criteria: 'Flat' }],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object with correct rows for "Dates" criteria', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.OIL,
				category: STREAM_PROPERTIES_CATEGORIES.LOSS,
				criteria: STREAM_PROPERTIES_CRITERIA.dates,
				period: '01/01/2022',
				value: '10',
				unit: '% Remaining',
				source: null,
				[PERIOD_DATA_KEY]: {
					start: '01/2022',
					end: '03/2022',
					criteria: STREAM_PROPERTIES_CRITERIA.dates,
					isLastRow: false,
					nextPeriod: undefined,
				},
			},
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.OIL,
				category: STREAM_PROPERTIES_CATEGORIES.LOSS,
				criteria: STREAM_PROPERTIES_CRITERIA.dates,
				period: '03/01/2022',
				value: '20',
				unit: '% Remaining',
				source: undefined,
				rate_type: undefined,
				rows_calculation_method: undefined,
				[PERIOD_DATA_KEY]: {
					start: '03/2022',
					end: 'Econ Limit',
					criteria: STREAM_PROPERTIES_CRITERIA.dates,
					isLastRow: true,
					nextPeriod: undefined,
				},
			},
		];
		const expectedOption = {
			assumptionFieldName: 'loss_flare',
			categoryKey: 'oil_loss',
			headers: {
				criteria: { value: 'dates', label: 'Dates' },
				pct_remaining: '% Remaining',
			},
			optionRows: [
				{
					pct_remaining: 10,
					criteria: { start_date: '2022/01/01', end_date: '2022/02/28', period: 3 },
				},
				{ pct_remaining: 20, criteria: { start_date: '2022/03/01', end_date: 'Econ Limit', period: 1 } },
			],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});

	test('returns an option object with correct rows for "Offset to FPD" and "Offset to As of Date" criteria', () => {
		const rowBuffer = [
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.GAS,
				category: STREAM_PROPERTIES_CATEGORIES.FLARE,
				criteria: STREAM_PROPERTIES_CRITERIA.offset_to_fpd,
				period: 3,
				value: '30',
				unit: '% Remaining',
				source: null,
				[PERIOD_DATA_KEY]: {
					isLastRow: false,
					criteria: STREAM_PROPERTIES_CRITERIA.offset_to_fpd,
					nextPeriod: 3,
					start: 1,
					end: 4,
				},
			},
			{
				[ROW_ID_KEY]: uuidv4(),
				key: STREAM_PROPERTIES_KEYS.GAS,
				category: STREAM_PROPERTIES_CATEGORIES.FLARE,
				criteria: STREAM_PROPERTIES_CRITERIA.offset_to_fpd,
				period: 3,
				value: '40',
				unit: '% Remaining',
				source: undefined,
				rate_type: undefined,
				rows_calculation_method: undefined,
				[PERIOD_DATA_KEY]: {
					isLastRow: true,
					criteria: STREAM_PROPERTIES_CRITERIA.offset_to_fpd,
					nextPeriod: null,
					start: 4,
					end: 'Inf',
				},
			},
		];
		const expectedOption = {
			assumptionFieldName: 'loss_flare',
			categoryKey: 'gas_flare',
			headers: {
				pct_remaining: '% Remaining',
				criteria: { value: 'offset_to_fpd', label: 'FPD' },
			},
			optionRows: [
				{ pct_remaining: 30, criteria: { start: 1, end: 3, period: 3 } },
				{ pct_remaining: 40, criteria: { start: 4, end: 6, period: 3 } },
			],
		};
		expect(rowBufferToOption(rowBuffer as StreamPropertiesRow[])).toEqual(expectedOption);
	});
});

// TODO: Find a way to get the bufferRowToOption mock working
// Leaving this test here for now, but not discarding because it has some boilerplate ready
// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
// describe('rowsToAssumption', () => {
// 	const spyCreateEconFunction = jest.spyOn(genData, 'createEconFunction');
// 	spyCreateEconFunction.mockReturnValue({});
//
// 	const template: StreamPropertiesTemplate = StreamPropertiesTemplateMock as unknown as StreamPropertiesTemplate;
// 	const rows: StreamPropertiesRow[] = [
// 		{
// 			key: 'Oil',
// 			category: 'Shrink',
// 			fieldName: 'oil',
// 			criteria: 'Flat',
// 			period: 'Flat',
// 			source: null,
// 			value: 100,
// 			unit: '% Remaining',
// 		},
// 		{
// 			key: 'Oil',
// 			category: 'Loss',
// 			fieldName: 'oil_loss',
// 			criteria: 'As Of',
// 			period: 3,
// 			source: null,
// 			value: 100,
// 			unit: '% Remaining',
// 		},
// 		{
// 			period: 5,
// 			value: '90',
// 		},
// 		{
// 			period: 6,
// 			value: '75',
// 		},
// 		{
// 			key: 'Gas',
// 			category: 'Shrink',
// 			fieldName: 'gas',
// 			criteria: 'Flat',
// 			period: 'Flat',
// 			source: null,
// 			value: 100,
// 			unit: '% Remaining',
// 		},
// 		{
// 			key: 'Gas',
// 			category: 'Loss',
// 			fieldName: 'gas_loss',
// 			criteria: 'Flat',
// 			period: 'Flat',
// 			source: null,
// 			value: 100,
// 			unit: '% Remaining',
// 		},
// 		{
// 			key: 'Gas',
// 			category: 'Flare',
// 			fieldName: 'gas_flare',
// 			criteria: 'Dates',
// 			period: '03/2023',
// 			source: null,
// 			value: 100,
// 			unit: '% Remaining',
// 		},
// 		{
// 			period: '07/2023',
// 			value: '95',
// 		},
// 		{
// 			period: '10/2024',
// 			value: '70',
// 		},
// 		{
// 			key: 'NGL',
// 			category: 'Yield',
// 			fieldName: 'ngl',
// 			criteria: 'Flat',
// 			period: 'Flat',
// 			source: 'Unshrunk Gas',
// 			value: '33',
// 			unit: 'BBL/MMCF',
// 		},
// 		{
// 			key: 'Drip Cond',
// 			category: 'Yield',
// 			fieldName: 'drip_condensate',
// 			criteria: 'Flat',
// 			period: 'Flat',
// 			source: 'Unshrunk Gas',
// 			value: '175',
// 			unit: 'BBL/MMCF',
// 		},
// 		{
// 			key: 'BTU',
// 			category: 'Shrunk',
// 			fieldName: 'shrunk_gas',
// 			criteria: null,
// 			source: null,
// 			value: '1700',
// 			unit: 'MBTU/MCF',
// 		},
// 		{
// 			key: 'BTU',
// 			category: 'Unshrunk',
// 			fieldName: 'unshrunk_gas',
// 			criteria: null,
// 			source: null,
// 			value: 1000,
// 			unit: 'MBTU/MCF',
// 		},
// 	] as unknown as StreamPropertiesRow[];
//
// eslint-disable-next-line jest/no-commented-out-tests -- TODO eslint fix later
// 	it('should return the expected options object and call rowBufferToOption with the correct input', () => {
// 		const rowBufferToOptionSpy = jest.spyOn(shared, 'rowBufferToOption');
// 		const assumption = shared.rowsToAssumption(rows, template);
//
// 		expect(assumption).not.toBeUndefined();
// 		//expect(jest.isMockFunction(rowBufferToOption)).toBe(true);
// 		expect(rowBufferToOptionSpy).toHaveBeenCalledTimes(9);
//
// 		/* Check if rowBufferToOption is called with the correct input. For example: */
// 		expect(rowBufferToOption).toHaveBeenCalledWith([
// 			rows[0],
// 			rows.slice(1, 4),
// 			rows[4],
// 			rows[5],
// 			rows.slice(6, 9),
// 			rows[9],
// 			rows[10],
// 			rows[11],
// 			rows[12],
// 		]);
//
// 		expect(originalRowBufferToOption).not.toHaveBeenCalled();
// 	});
// });
