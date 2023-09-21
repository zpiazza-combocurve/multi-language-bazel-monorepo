import { ColDef } from 'ag-grid-community';

import { ERROR_KEY, IS_NESTED_ROW_KEY, LOOKUP_BY_FIELDS_KEY } from '@/components/AdvancedTable/constants';
import { FieldType } from '@/inpt-shared/constants';
import {
	RuleWellHeaderMatchBehavior,
	RuleWellHeaderMatchBehaviorLabel,
} from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { HIGH, LOW } from '@/lookup-tables/shared/constants';

import {
	LOOKUP_BY_KEY_DIVIDER,
	NULL_HEADER_VALUE_LABEL,
	WELL_HEADER_DELIMITER,
	generateLookupByKey,
	getFieldAndVirtualLineByLookupByKey,
	getFieldFromLookupByKey,
	getLineByLookupByKey,
	getLookupRuleRowFieldValidationError,
	getParentLineByLookupByKey,
	getRangeFieldForWellHeader,
	getWellHeaderColGroupDef,
	getWellHeaderFromRangeField,
	getWithNestedRules,
	parseConditionValue,
} from './shared';
import { NESTED_ROW_BEHAVIOR_KEY, VIRTUAL_LINES_KEY } from './types';

const field = 'some_field';
const header = 'some_header';
const headerLabel = 'Some Header';
const headerOptions = ['Option 1', 'Option 2'];
const postfix = 'random_postfix';

const lookupByKey1 = '5f5bacc22d7c4db7b4da1521d0de0b95-value';
const lookupByKey2 = 'e44993a2b4a64b3f94d952a41632b5ec-value';
const lookupByKey3 = '773b3b1b77a448bc90c93a50358396b5-value';
const lookupByKey4 = 'b4cb498a48ac46daad57699bc78c28ac-cap';
const lookupByKey5 = '42f25247e0b14c41950f049026a6b591-description';
const lookupByKey6 = '0154fb9cc45d46fcaf14357035d2d93e-unit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const expensesELTLines: any[] = [
	{
		key: 'Oil',
		category: 'G & P',
		criteria: 'Dates',
		period: '05/2023',
		value: 'f9efedefc222428c9a6f3dbc88196eb2-value',
		description: '',
		[LOOKUP_BY_FIELDS_KEY]: {
			description: '42f25247e0b14c41950f049026a6b591-description',
			unit: '053a0555dcb84ced83ab62d50698d0c1-unit',
			escalation_model: '9807c4b58f1849fc84eaeabc05fd4a91-escalation_model',
			shrinkage_condition: 'c6227accc80c428fa00ab49f94340b6e-shrinkage_condition',
			value: 'f9efedefc222428c9a6f3dbc88196eb2-value',
		},
	},
	{
		period: '06/2023',
		value: '',
		[IS_NESTED_ROW_KEY]: true,
		[LOOKUP_BY_FIELDS_KEY]: {
			value: lookupByKey1,
		},
	},
	{
		period: '07/2023',
		value: '',
		[IS_NESTED_ROW_KEY]: true,
		[LOOKUP_BY_FIELDS_KEY]: {
			value: lookupByKey2,
		},
	},
	{
		period: '08/2023',
		value: '',
		[IS_NESTED_ROW_KEY]: true,
		[LOOKUP_BY_FIELDS_KEY]: {
			value: lookupByKey3,
		},
	},
	{
		key: 'Oil',
		category: 'OPC',
		criteria: 'Flat',
		period: 'Flat',
		value: 45,
		unit: '% of Oil Rev',
		description: 'static desc',
		escalation_model: 'test',
		[LOOKUP_BY_FIELDS_KEY]: {
			cap: lookupByKey4,
		},
	},
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const expensesRulesRows: any[] = [
	{
		abstract: '3rd',
		custom_bool_4: true,
		first_prod_date___low: '2023-01-16T00:00:00.000Z',
		first_prod_date___high: '2023-01-16T00:00:00.000Z',
		first_fluid_volume___low: 40,
		first_fluid_volume___high: 40,
		perf_lateral_length: 50,
		'f9efedefc222428c9a6f3dbc88196eb2-value': 10,
		'28654ee1424c4eb29c960d760fc1a1b8-value': 15,
		'74b1033dca264322a5c3b031d1e9afe6-value': 11,
		'42f25247e0b14c41950f049026a6b591-description': 'desc 3',
		'0154fb9cc45d46fcaf14357035d2d93e-unit': '% of NGL Rev',
		'9807c4b58f1849fc84eaeabc05fd4a91-escalation_model': 'test',
		'b4cb498a48ac46daad57699bc78c28ac-cap': 111,
		[VIRTUAL_LINES_KEY]: [
			{
				key: 'Oil',
				category: 'G & P',
				criteria: 'Dates',
				period: '05/2023',
				value: 10,
				description: 'desc 3',
				unit: '% of NGL Rev',
				escalation_model: 'test',
				[LOOKUP_BY_FIELDS_KEY]: {
					description: lookupByKey5,
					unit: '0154fb9cc45d46fcaf14357035d2d93e-unit',
					escalation_model: '9807c4b58f1849fc84eaeabc05fd4a91-escalation_model',
					value: 'f9efedefc222428c9a6f3dbc88196eb2-value',
				},
			},
			{
				period: '06/2023',
				value: 15,
			},
			{
				period: '07/2023',
				value: 11,
			},
			{
				key: 'Oil',
				category: 'OPC',
				criteria: 'Flat',
				period: 'Flat',
				value: 15,
				unit: '% of Oil Rev',
				description: 'static desc',
				escalation_model: 'test',
				cap: 111,
			},
		],
	},
	{
		perf_lateral_length: 56,
		'f9efedefc222428c9a6f3dbc88196eb2-value': 12,
		'28654ee1424c4eb29c960d760fc1a1b8-value': 23,
		'74b1033dca264322a5c3b031d1e9afe6-value': 45,
		'b4cb498a48ac46daad57699bc78c28ac-cap': '',
		[VIRTUAL_LINES_KEY]: [
			{
				key: 'Oil',
				category: 'G & P',
				criteria: 'Dates',
				period: '05/2023',
				value: 12,
				description: 'desc 3',
				unit: '% of NGL Rev',
				escalation_model: 'test',
			},
			{
				period: '06/2023',
				value: 23,
			},
			{
				period: '07/2023',
				value: '1000',
				[ERROR_KEY]: {
					value: 'Max value is 100',
				},
			},
			{
				key: 'Oil',
				category: 'OPC',
				criteria: 'Flat',
				period: 'Flat',
				value: 15,
				unit: '% of Oil Rev',
				description: 'static desc',
				escalation_model: 'test',
				cap: '',
			},
		],
	},
	{
		abstract: '1st',
		custom_bool_4: null,
		first_prod_date___low: '2023-01-19T00:00:00.000Z',
		first_prod_date___high: '2023-01-19T00:00:00.000Z',
		first_fluid_volume___low: 10,
		first_fluid_volume___high: 10,
		perf_lateral_length: 10,
		'f9efedefc222428c9a6f3dbc88196eb2-value': 50,
		'28654ee1424c4eb29c960d760fc1a1b8-value': 55,
		'74b1033dca264322a5c3b031d1e9afe6-value': 45,
		'42f25247e0b14c41950f049026a6b591-description': 'desc1',
		'0154fb9cc45d46fcaf14357035d2d93e-unit': '% of Drip Cond Rev',
		'9807c4b58f1849fc84eaeabc05fd4a91-escalation_model': 'None',
		'b4cb498a48ac46daad57699bc78c28ac-cap': 211,
		[VIRTUAL_LINES_KEY]: [
			{
				key: 'Oil',
				category: 'G & P',
				criteria: 'Dates',
				period: '05/2023',
				value: 50,
				description: 'desc1',
				unit: 'qwe',
				escalation_model: 'None',
				[LOOKUP_BY_FIELDS_KEY]: {
					description: '42f25247e0b14c41950f049026a6b591-description',
					unit: lookupByKey6,
					escalation_model: '9807c4b58f1849fc84eaeabc05fd4a91-escalation_model',
					value: 'f9efedefc222428c9a6f3dbc88196eb2-value',
				},
				[ERROR_KEY]: {
					unit: 'G & P Variable Expenses must be one of the following values: $/BBL, % of Oil Rev, % of Gas Rev, % of NGL Rev, % of Drip Cond Rev, % of Total Rev',
				},
			},
			{
				period: '06/2023',
				value: 55,
			},
			{
				period: '07/2023',
				value: '1111',
			},
			{
				key: 'Oil',
				category: 'OPC',
				criteria: 'Flat',
				period: 'Flat',
				value: 15,
				unit: '% of Oil Rev',
				description: 'static desc',
				escalation_model: 'test',
				cap: 211,
			},
		],
	},
	{
		perf_lateral_length: 100,
		'f9efedefc222428c9a6f3dbc88196eb2-value': 55,
		'28654ee1424c4eb29c960d760fc1a1b8-value': 57,
		'74b1033dca264322a5c3b031d1e9afe6-value': 52,
		'b4cb498a48ac46daad57699bc78c28ac-cap': 200,
		[VIRTUAL_LINES_KEY]: [
			{
				key: 'Oil',
				category: 'G & P',
				criteria: 'Dates',
				period: '05/2023',
				value: 55,
				description: 'desc1',
				unit: 'qwe',
				escalation_model: 'None',
				[ERROR_KEY]: {
					unit: 'G & P Variable Expenses must be one of the following values: $/BBL, % of Oil Rev, % of Gas Rev, % of NGL Rev, % of Drip Cond Rev, % of Total Rev',
				},
			},
			{
				period: '06/2023',
				value: 57,
			},
			{
				period: '07/2023',
				value: 52,
			},
			{
				key: 'Oil',
				category: 'OPC',
				criteria: 'Flat',
				period: 'Flat',
				value: 15,
				unit: '% of Oil Rev',
				description: 'static desc',
				escalation_model: 'test',
				cap: 200,
			},
		],
	},
	{
		perf_lateral_length: 1000,
		'f9efedefc222428c9a6f3dbc88196eb2-value': 60,
		'28654ee1424c4eb29c960d760fc1a1b8-value': 65,
		'74b1033dca264322a5c3b031d1e9afe6-value': 57,
		'b4cb498a48ac46daad57699bc78c28ac-cap': 255,
		[VIRTUAL_LINES_KEY]: [
			{
				key: 'Oil',
				category: 'G & P',
				criteria: 'Dates',
				period: '05/2023',
				value: 60,
				description: 'desc1',
				unit: 'qwe',
				escalation_model: 'None',
				[ERROR_KEY]: {
					unit: 'G & P Variable Expenses must be one of the following values: $/BBL, % of Oil Rev, % of Gas Rev, % of NGL Rev, % of Drip Cond Rev, % of Total Rev',
				},
			},
			{
				period: '06/2023',
				value: 65,
			},
			{
				period: '07/2023',
				value: 57,
			},
			{
				key: 'Oil',
				category: 'OPC',
				criteria: 'Flat',
				period: 'Flat',
				value: 15,
				unit: '% of Oil Rev',
				description: 'static desc',
				escalation_model: 'test',
				cap: 255,
			},
		],
	},
];

describe('embedded-lookup-tables/shared', () => {
	test('generateLookupByKey()', () => {
		expect(generateLookupByKey(field).endsWith(`${LOOKUP_BY_KEY_DIVIDER}${field}`)).toEqual(true);
	});

	test('getFieldFromLookupByKey()', () => {
		expect(getFieldFromLookupByKey(`uuidV4GeneratedSymbols${LOOKUP_BY_KEY_DIVIDER}${field}`)).toEqual(field);
	});

	test('getRangeFieldForWellHeader()', () => {
		expect(getRangeFieldForWellHeader(header, postfix)).toEqual(`${header}${WELL_HEADER_DELIMITER}${postfix}`);
	});

	test('getWellHeaderFromRangeField()', () => {
		expect(getWellHeaderFromRangeField(`${header}${WELL_HEADER_DELIMITER}${postfix}`)).toEqual(header);
	});

	test('getWellHeaderColGroupDef()', () => {
		let definition = getWellHeaderColGroupDef(
			header,
			headerLabel,
			FieldType.string,
			RuleWellHeaderMatchBehavior.regular,
			headerOptions
		);

		expect(definition.headerName).toEqual(headerLabel);
		expect(definition.children.length).toEqual(1);

		let colDef1 = definition.children[0] as ColDef;

		expect(colDef1.lockPinned).toEqual(true);
		expect(colDef1.lockPosition).toEqual(true);
		expect(colDef1.lockVisible).toEqual(true);
		expect(colDef1.resizable).toEqual(true);
		expect(colDef1.sortable).toEqual(true);
		expect(colDef1.suppressMovable).toEqual(true);

		expect(colDef1.field).toEqual(header);
		expect(colDef1.headerName).toEqual(
			RuleWellHeaderMatchBehaviorLabel[RuleWellHeaderMatchBehavior.regular]?.(FieldType.text)
		);
		expect(colDef1.pinned).toEqual(true);
		expect(colDef1.cellEditorParams.options).toEqual(headerOptions);
		expect(colDef1.cellEditorParams.getOptionLabel(null)).toEqual(NULL_HEADER_VALUE_LABEL);
		expect(colDef1.cellEditorParams.getOptionLabel(undefined)).toEqual(NULL_HEADER_VALUE_LABEL);
		expect(colDef1.cellEditorParams.getOptionLabel('some value')).toEqual('some value');

		definition = getWellHeaderColGroupDef(
			header,
			headerLabel,
			FieldType.number,
			RuleWellHeaderMatchBehavior.regular,
			[]
		);

		expect(definition.children.length).toEqual(2);

		colDef1 = definition.children[0] as ColDef;
		let colDef2 = definition.children[1] as ColDef;

		expect(colDef1.field).toEqual(getRangeFieldForWellHeader(header, LOW));
		expect(colDef1.type).toEqual(FieldType.number);
		expect(colDef2.field).toEqual(getRangeFieldForWellHeader(header, HIGH));
		expect(colDef2.type).toEqual(FieldType.number);

		definition = getWellHeaderColGroupDef(
			header,
			headerLabel,
			FieldType.date,
			RuleWellHeaderMatchBehavior.regular,
			[]
		);

		expect(definition.children.length).toEqual(2);

		colDef1 = definition.children[0] as ColDef;
		colDef2 = definition.children[1] as ColDef;

		expect(colDef1.field).toEqual(getRangeFieldForWellHeader(header, LOW));
		expect(colDef1.type).toEqual(FieldType.date);
		expect(colDef2.field).toEqual(getRangeFieldForWellHeader(header, HIGH));
		expect(colDef2.type).toEqual(FieldType.date);

		definition = getWellHeaderColGroupDef(
			header,
			headerLabel,
			FieldType.number,
			RuleWellHeaderMatchBehavior.ratio,
			[]
		);

		expect(definition.children.length).toEqual(1);

		colDef1 = definition.children[0] as ColDef;

		expect(colDef1.headerName).toEqual(RuleWellHeaderMatchBehaviorLabel[RuleWellHeaderMatchBehavior.ratio]?.());
		expect(colDef1.type).toEqual(FieldType.number);

		definition = getWellHeaderColGroupDef(
			header,
			headerLabel,
			FieldType.number,
			RuleWellHeaderMatchBehavior.interpolation,
			[]
		);

		expect(definition.children.length).toEqual(1);

		colDef1 = definition.children[0] as ColDef;

		expect(colDef1.headerName).toEqual(
			RuleWellHeaderMatchBehaviorLabel[RuleWellHeaderMatchBehavior.interpolation]?.()
		);
		expect(colDef1.type).toEqual(FieldType.number);
	});

	test('getLineByLookupByKey()', () => {
		expect(getLineByLookupByKey(lookupByKey1, expensesELTLines)).toEqual(expensesELTLines[1]);
		expect(getLineByLookupByKey('not_existing', expensesELTLines)).toEqual(null);
	});

	test('getParentLineByLookupByKey()', () => {
		expect(getParentLineByLookupByKey(lookupByKey1, expensesELTLines)).toEqual(expensesELTLines[0]);
		expect(getParentLineByLookupByKey(lookupByKey2, expensesELTLines)).toEqual(expensesELTLines[0]);
		expect(getParentLineByLookupByKey(lookupByKey3, expensesELTLines)).toEqual(expensesELTLines[0]);
		expect(getParentLineByLookupByKey(lookupByKey4, expensesELTLines)).toEqual(expensesELTLines[4]);
		expect(getParentLineByLookupByKey('not_existing', expensesELTLines)).toEqual(null);
	});

	test('parseConditionValue()', () => {
		const date = new Date();
		const dateStr = date.toJSON();
		const types = { [header]: { type: FieldType.date } };

		expect(parseConditionValue(header, dateStr, types)).toEqual(date);
		expect(parseConditionValue(header, date, types)).toEqual(date);
		expect(parseConditionValue('another_header', 12, types)).toEqual(12);
		expect(parseConditionValue('another_header', 'text', types)).toEqual('text');
	});

	test('getWithNestedRules()', () => {
		const rules = [
			{ header1: 'text', nestedHeader: 1 },
			{ nestedHeader: 2, [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation },
			{ nestedHeader: 3, [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation },
			{ nestedHeader: 4, [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation },
			{ header1: 'text2', nestedHeader: 5 },
			{ header1: 'text3', nestedHeader: 6 },
			{ nestedHeader: 7, [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation },
			{ header1: 'text4', nestedHeader: 8 },
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		] as any[];

		expect(getWithNestedRules(rules)).toEqual([
			{ root: rules[0], nested: [rules[1], rules[2], rules[3]] },
			{ root: rules[4], nested: [] },
			{ root: rules[5], nested: [rules[6]] },
			{ root: rules[7], nested: [] },
		]);
	});

	test('getFieldAndVirtualLineByLookupByKey()', () => {
		expect(getFieldAndVirtualLineByLookupByKey(expensesRulesRows[0], 'not_existing')).toEqual({
			virtualLine: undefined,
			field: undefined,
		});

		expect(getFieldAndVirtualLineByLookupByKey(expensesRulesRows[0], lookupByKey5)).toEqual({
			virtualLine: expensesRulesRows[0][VIRTUAL_LINES_KEY][0],
			field: 'description',
		});
	});

	test('getLookupRuleRowFieldValidationError()', () => {
		expect(getLookupRuleRowFieldValidationError(expensesRulesRows[0], 'not_existing')).toEqual(undefined);

		expect(getLookupRuleRowFieldValidationError(expensesRulesRows[2], lookupByKey6)).toEqual(
			'G & P Variable Expenses must be one of the following values: $/BBL, % of Oil Rev, % of Gas Rev, % of NGL Rev, % of Drip Cond Rev, % of Total Rev'
		);
	});
});
