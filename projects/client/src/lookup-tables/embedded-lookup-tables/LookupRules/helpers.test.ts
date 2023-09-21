import { format } from 'date-fns';

import { makeUtc } from '@/helpers/date';
import { DEFAULT_DATE_FORMAT } from '@/helpers/dates';
import { getObjectSchemaValidationErrors } from '@/helpers/yup-helpers';
import { FieldType } from '@/inpt-shared/constants';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { HIGH, LOW } from '@/lookup-tables/shared/constants';

import { NULL_HEADER_VALUE_LABEL, getRangeFieldForWellHeader } from '../shared';
import { HEADER_VALIDATION_ERRORS_KEY, LookupRuleRow, NESTED_ROW_BEHAVIOR_KEY } from '../types';
import {
	findRuleForWell,
	formatWellHeaderValue,
	getHeadersValidationSchema,
	getWellHeaderRangeDefinitions,
	isCellEditable,
	mapCombinationToRule,
	parseWellHeaderValue,
	ruleMatchesWellHeadersCombination,
} from './helpers';

const stringHeader = 'string_header';
const numericalHeader = 'numerical_header';
const numericalHeader2 = 'numerical_header2';
const percentHeader = 'percent_header';
const booleanHeader = 'boolean_header';
const dateHeader = 'date_header';
const interpolationHeaderKey = numericalHeader;
const dateValue = new Date(2027, 5, 20, 12, 0, 0);
const formattedDate = format(dateValue, DEFAULT_DATE_FORMAT);
const utcJuly1st2025Date = makeUtc(new Date(2025, 6, 1));
const stringValue = 'string_value';
const numericalValue = 'numerical_value';

const dateHeaderLow = getRangeFieldForWellHeader(dateHeader, LOW);
const dateHeaderHigh = getRangeFieldForWellHeader(dateHeader, HIGH);
const percentHeaderLow = getRangeFieldForWellHeader(percentHeader, LOW);
const percentHeaderHigh = getRangeFieldForWellHeader(percentHeader, HIGH);
const numericalHeaderLow = getRangeFieldForWellHeader(numericalHeader, LOW);
const numericalHeaderHigh = getRangeFieldForWellHeader(numericalHeader, HIGH);

describe('embedded-lookup-tables/LookupRules/helpers', () => {
	test('formatWellHeaderValue()', () => {
		//string header

		expect(
			formatWellHeaderValue(
				stringHeader,
				'some text',
				FieldType.string,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual('some text');

		expect(
			formatWellHeaderValue(
				stringHeader,
				'some text',
				FieldType.string,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.interpolation
			)
		).toEqual(undefined);

		expect(
			formatWellHeaderValue(
				stringHeader,
				null,
				FieldType.string,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		expect(
			formatWellHeaderValue(
				stringHeader,
				undefined,
				FieldType.string,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		//boolean header

		expect(
			formatWellHeaderValue(
				booleanHeader,
				true,
				FieldType.boolean,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual('Yes');

		expect(
			formatWellHeaderValue(
				booleanHeader,
				false,
				FieldType.boolean,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual('No');

		expect(
			formatWellHeaderValue(
				booleanHeader,
				true,
				FieldType.boolean,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.interpolation
			)
		).toEqual(undefined);

		expect(
			formatWellHeaderValue(
				booleanHeader,
				null,
				FieldType.boolean,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		expect(
			formatWellHeaderValue(
				booleanHeader,
				undefined,
				FieldType.boolean,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		// date header

		expect(
			formatWellHeaderValue(
				dateHeader,
				dateValue,
				FieldType.date,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(formattedDate);

		expect(
			formatWellHeaderValue(
				dateHeader,
				dateValue,
				FieldType.date,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.interpolation
			)
		).toEqual(undefined);

		expect(
			formatWellHeaderValue(
				dateHeader,
				null,
				FieldType.date,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		expect(
			formatWellHeaderValue(
				dateHeader,
				undefined,
				FieldType.date,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		// numerical header

		expect(
			formatWellHeaderValue(
				numericalHeader,
				15,
				FieldType.number,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(15);

		expect(
			formatWellHeaderValue(
				numericalHeader,
				23,
				FieldType.number,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.interpolation
			)
		).toEqual(23);

		expect(
			formatWellHeaderValue(
				numericalHeader,
				null,
				FieldType.number,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);

		expect(
			formatWellHeaderValue(
				numericalHeader,
				undefined,
				FieldType.number,
				interpolationHeaderKey,
				RuleWellHeaderMatchBehavior.regular
			)
		).toEqual(NULL_HEADER_VALUE_LABEL);
	});

	test('isCellEditable()', () => {
		const parentRule = {} as LookupRuleRow;
		const interpolationRuleRow = {
			[NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation,
		} as LookupRuleRow;
		const chosenHeaders = [stringHeader, dateHeader, numericalHeader];
		const columnNotEditable = () => false;
		const columnIsEditable = () => true;
		const editableHeader = { header: stringHeader, editable: true };
		const nonEditableHeader = { header: stringHeader, editable: false };
		const editableNonHeader = { header: '', editable: true };
		const nonEditableNonHeader = { header: '', editable: false };

		expect(isCellEditable(parentRule, stringHeader, chosenHeaders, columnIsEditable, numericalHeader)).toEqual(
			editableHeader
		);

		expect(
			isCellEditable(interpolationRuleRow, stringHeader, chosenHeaders, columnIsEditable, numericalHeader)
		).toEqual(nonEditableHeader);

		expect(isCellEditable(parentRule, stringValue, chosenHeaders, columnIsEditable, numericalHeader)).toEqual(
			editableNonHeader
		);

		expect(
			isCellEditable(interpolationRuleRow, stringValue, chosenHeaders, columnNotEditable, numericalHeader)
		).toEqual(nonEditableNonHeader);

		expect(
			isCellEditable(interpolationRuleRow, numericalValue, chosenHeaders, columnIsEditable, numericalHeader)
		).toEqual(editableNonHeader);
	});

	test('parseWellHeaderValue()', () => {
		// number and percent

		expect(parseWellHeaderValue('45vn', 77, FieldType.number)).toEqual(77);
		expect(parseWellHeaderValue('45', 22, FieldType.number)).toEqual(45);
		expect(parseWellHeaderValue('1e99999', 11, FieldType.percent)).toEqual(11);
		expect(parseWellHeaderValue('text', 11, FieldType.percent)).toEqual(11);
		expect(parseWellHeaderValue('text', undefined, FieldType.percent)).toEqual(undefined);

		// date

		expect(parseWellHeaderValue('07/25', formattedDate, FieldType.date)).toEqual(utcJuly1st2025Date);
		expect(parseWellHeaderValue('07/2025', formattedDate, FieldType.date)).toEqual(utcJuly1st2025Date);
		expect(parseWellHeaderValue('07/01/2025', formattedDate, FieldType.date)).toEqual(utcJuly1st2025Date);
		expect(parseWellHeaderValue('07/01/25', formattedDate, FieldType.date)).toEqual(utcJuly1st2025Date);
		expect(parseWellHeaderValue('text', formattedDate, FieldType.date)).toEqual(undefined);

		// boolean

		expect(parseWellHeaderValue('YEs', false, FieldType.boolean)).toEqual(true);
		expect(parseWellHeaderValue('TruE', false, FieldType.boolean)).toEqual(true);
		expect(parseWellHeaderValue(true, false, FieldType.boolean)).toEqual(true);
		expect(parseWellHeaderValue('nO', true, FieldType.boolean)).toEqual(false);
		expect(parseWellHeaderValue('fALse', true, FieldType.boolean)).toEqual(false);
		expect(parseWellHeaderValue(false, true, FieldType.boolean)).toEqual(false);
		expect(parseWellHeaderValue('', true, FieldType.boolean)).toEqual(undefined);
		expect(parseWellHeaderValue(null, true, FieldType.boolean)).toEqual(undefined);
		expect(parseWellHeaderValue(undefined, true, FieldType.boolean)).toEqual(undefined);
		expect(parseWellHeaderValue('n/A', true, FieldType.boolean)).toEqual(undefined);
		expect(parseWellHeaderValue('invalid', true, FieldType.boolean)).toEqual(true);

		// others
		expect(parseWellHeaderValue('newText', 'previousText', FieldType.string)).toEqual('newText');
		expect(parseWellHeaderValue('newText', 'previousText', FieldType.text)).toEqual('newText');
		expect(parseWellHeaderValue('newText', 'previousText', undefined)).toEqual('newText');
		expect(parseWellHeaderValue(25, 'previousText', undefined)).toEqual(25);
	});

	test('mapCombinationToRule()', () => {
		const wellHeadersTypes: Record<string, { type: string }> = {
			[dateHeader]: { type: 'date' },
			[percentHeader]: { type: 'percent' },
			[numericalHeader]: { type: 'number' },
			[stringHeader]: { type: 'string' },
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const combination: Record<string, any> = {
			[dateHeader]: dateValue,
			[percentHeader]: 10,
			[numericalHeader]: 111,
			[stringHeader]: 'some text',
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const mappedToRule: Record<string, any> = {
			[dateHeaderLow]: dateValue,
			[dateHeaderHigh]: dateValue,
			[percentHeaderLow]: 10,
			[percentHeaderHigh]: 10,
			[numericalHeaderLow]: 111,
			[numericalHeaderHigh]: 111,
			[stringHeader]: 'some text',
		};

		expect(mapCombinationToRule(combination, wellHeadersTypes)).toEqual(mappedToRule);
	});

	test('getWellHeaderRangeDefinitions()', () => {
		const headers = [dateHeader, percentHeader, numericalHeader, numericalHeader2, stringHeader, booleanHeader];
		const headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior> = {
			[dateHeader]: RuleWellHeaderMatchBehavior.regular,
			[percentHeader]: RuleWellHeaderMatchBehavior.regular,
			[numericalHeader]: RuleWellHeaderMatchBehavior.ratio,
			[numericalHeader2]: RuleWellHeaderMatchBehavior.interpolation,
			[stringHeader]: RuleWellHeaderMatchBehavior.regular,
			[booleanHeader]: RuleWellHeaderMatchBehavior.regular,
		};
		const wellHeadersTypes: Record<string, { type: string }> = {
			[dateHeader]: { type: 'date' },
			[percentHeader]: { type: 'percent' },
			[numericalHeader]: { type: 'number' },
			[numericalHeader2]: { type: 'number' },
			[stringHeader]: { type: 'string' },
			[booleanHeader]: { type: 'boolean' },
		};

		const definition: Record<string, { type: string; behavior: RuleWellHeaderMatchBehavior; colIds: string[] }> = {
			[dateHeader]: {
				type: 'date',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [dateHeaderLow, dateHeaderHigh],
			},
			[percentHeader]: {
				type: 'percent',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [percentHeaderLow, percentHeaderHigh],
			},
			[numericalHeader]: {
				type: 'number',
				behavior: RuleWellHeaderMatchBehavior.ratio,
				colIds: [numericalHeader],
			},
			[numericalHeader2]: {
				type: 'number',
				behavior: RuleWellHeaderMatchBehavior.interpolation,
				colIds: [numericalHeader2],
			},
			[stringHeader]: { type: 'string', behavior: RuleWellHeaderMatchBehavior.regular, colIds: [stringHeader] },
			[booleanHeader]: {
				type: 'boolean',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [booleanHeader],
			},
		};

		expect(getWellHeaderRangeDefinitions(headers, wellHeadersTypes, headersMatchBehavior)).toEqual(definition);
	});

	test('getHeadersValidationSchema()', () => {
		const definitions: Record<string, { type: string; behavior: RuleWellHeaderMatchBehavior; colIds: string[] }> = {
			[stringHeader]: { type: 'string', behavior: RuleWellHeaderMatchBehavior.regular, colIds: [stringHeader] },
			[booleanHeader]: {
				type: 'boolean',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [booleanHeader],
			},
			[dateHeader]: {
				type: 'date',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [dateHeaderLow, dateHeaderHigh],
			},
			[numericalHeader]: {
				type: 'number',
				behavior: RuleWellHeaderMatchBehavior.regular,
				colIds: [numericalHeaderLow, numericalHeaderHigh],
			},
		};

		const definitionsWithRatio = {
			...definitions,
			[numericalHeader2]: {
				type: 'number',
				behavior: RuleWellHeaderMatchBehavior.ratio,
				colIds: [numericalHeader2],
			},
		};

		const definitionsWithInterpolation = {
			...definitions,
			[numericalHeader2]: {
				type: 'number',
				behavior: RuleWellHeaderMatchBehavior.interpolation,
				colIds: [numericalHeader2],
			},
		};

		const wellHeadersLabels: Record<string, string> = {
			[stringHeader]: 'String Header',
			[booleanHeader]: 'Boolean Header',
			[dateHeader]: 'Date Header',
			[numericalHeader]: 'Numerical Header',
			[numericalHeader2]: 'Numerical Header 2',
		};

		const ratioSchema = getHeadersValidationSchema(definitionsWithRatio, wellHeadersLabels);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const ratioRows: any[] = [
			{
				string_header: '2nd',
				boolean_header: false,
				date_header___low: makeUtc(new Date(2023, 0, 18)),
				date_header___high: makeUtc(new Date(2023, 0, 17)),
				numerical_header___low: 20,
				numerical_header___high: 16,
				numerical_header2: 0,
			},
			{
				string_header: '4th',
				date_header___low: makeUtc(new Date(2022, 10, 9)),
				date_header___high: makeUtc(new Date(2022, 10, 9)),
				numerical_header___low: 50,
				numerical_header___high: 50,
				numerical_header2: 34,
			},
			{
				string_header: '1st',
				date_header___low: makeUtc(new Date(2023, 0, 19)),
				date_header___high: makeUtc(new Date(2023, 0, 19)),
				numerical_header___low: 10,
				numerical_header___high: 10,
			},
		];

		for (let i = 0; i < ratioRows.length; ++i) {
			const previousRow = i ? ratioRows[i - 1] : undefined;
			const currentRow = ratioRows[i];
			const nextRow = i < ratioRows.length - 1 ? ratioRows[i + 1] : undefined;

			const validationErrors = getObjectSchemaValidationErrors(ratioSchema, currentRow, {
				context: { currentRow, previousRow, nextRow },
			});

			if (validationErrors) {
				currentRow[HEADER_VALIDATION_ERRORS_KEY] = validationErrors;
			}
		}

		expect(ratioRows[0][HEADER_VALIDATION_ERRORS_KEY]).toEqual({
			date_header___high: `End can't be smaller than Start`,
			numerical_header___high: `Max can't be smaller than Min`,
			numerical_header2: 'Value can not be 0',
		});
		expect(Object.keys(ratioRows[1][HEADER_VALIDATION_ERRORS_KEY] ?? {}).length).toEqual(0);
		expect(ratioRows[2][HEADER_VALIDATION_ERRORS_KEY]).toEqual({
			numerical_header2: 'Numerical Header 2 is a required field',
		});

		const interpolationSchema = getHeadersValidationSchema(definitionsWithInterpolation, wellHeadersLabels);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const interpolationRows: any[] = [
			{
				string_header: '2nd',
				boolean_header: false,
				date_header___low: makeUtc(new Date(2023, 0, 18)),
				date_header___high: makeUtc(new Date(2023, 0, 18)),
				numerical_header___low: 20,
				numerical_header___high: 20,
			},
			{ [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation, numerical_header2: 4 },
			{
				string_header: '4th',
				date_header___low: makeUtc(new Date(2022, 10, 9)),
				date_header___high: makeUtc(new Date(2022, 10, 9)),
				numerical_header___low: 50,
				numerical_header___high: 50,
				numerical_header2: 0,
			},
			{ numerical_header2: 1 },
			{ [NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation, numerical_header2: 1 },
		];

		for (let i = 0; i < interpolationRows.length; ++i) {
			const previousRow = i ? interpolationRows[i - 1] : undefined;
			const currentRow = interpolationRows[i];
			const nextRow = i < interpolationRows.length - 1 ? interpolationRows[i + 1] : undefined;

			const validationErrors = getObjectSchemaValidationErrors(interpolationSchema, currentRow, {
				context: { currentRow, previousRow, nextRow },
			});

			if (validationErrors) {
				currentRow[HEADER_VALIDATION_ERRORS_KEY] = validationErrors;
			}
		}

		expect(interpolationRows[0][HEADER_VALIDATION_ERRORS_KEY]).toEqual({
			numerical_header2: 'Numerical Header 2 is a required field',
		});
		expect(Object.keys(interpolationRows[1][HEADER_VALIDATION_ERRORS_KEY] ?? {}).length).toEqual(0);
		expect(interpolationRows[2][HEADER_VALIDATION_ERRORS_KEY]).toEqual({
			numerical_header2: 'Rule with interpolation should have at least 2 rows',
		});
		expect(Object.keys(interpolationRows[3][HEADER_VALIDATION_ERRORS_KEY] ?? {}).length).toEqual(0);
		expect(interpolationRows[4][HEADER_VALIDATION_ERRORS_KEY]).toEqual({
			numerical_header2: `Value can't be the same as previous`,
		});
	});

	test('ruleMatchesWellHeadersCombination()', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const definitionsEntries: any[] = [
			['abstract', { type: 'string', behavior: 'regular', colIds: ['abstract'] }],
			['custom_bool_4', { type: 'boolean', behavior: 'regular', colIds: ['custom_bool_4'] }],
			[
				'first_prod_date',
				{ type: 'date', behavior: 'regular', colIds: ['first_prod_date___low', 'first_prod_date___high'] },
			],
			[
				'first_fluid_volume',
				{
					type: 'number',
					behavior: 'regular',
					colIds: ['first_fluid_volume___low', 'first_fluid_volume___high'],
				},
			],
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const combinations: any[] = [
			{
				abstract: '2nd',
				custom_bool_4: false,
				first_prod_date: makeUtc(new Date(2023, 0, 18)),
				first_fluid_volume: 20,
			},
			{ abstract: '4th', first_prod_date: makeUtc(new Date(2022, 10, 9)), first_fluid_volume: 50 },
			{ abstract: '1st', first_prod_date: makeUtc(new Date(2023, 0, 19)), first_fluid_volume: 10 },
			{
				abstract: '3rd',
				custom_bool_4: true,
				first_prod_date: makeUtc(new Date(2023, 0, 16)),
				first_fluid_volume: 40,
			},
			{ abstract: '3rd', first_prod_date: makeUtc(new Date(2023, 0, 17)), first_fluid_volume: 30 },
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const rows: any[] = [
			{
				abstract: '2nd',
				custom_bool_4: false,
				first_prod_date___low: makeUtc(new Date(2023, 0, 18)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 18)),
				first_fluid_volume___low: 20,
				first_fluid_volume___high: 20,
			},
			{
				abstract: '4th',
				first_prod_date___low: makeUtc(new Date(2022, 10, 9)),
				first_prod_date___high: makeUtc(new Date(2022, 10, 9)),
				first_fluid_volume___low: 50,
				first_fluid_volume___high: 50,
			},
			{
				abstract: '1st',
				first_prod_date___low: makeUtc(new Date(2023, 0, 19)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 19)),
				first_fluid_volume___low: 10,
				first_fluid_volume___high: 10,
			},
			{
				abstract: '3rd',
				custom_bool_4: true,
				first_prod_date___low: makeUtc(new Date(2023, 0, 16)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 16)),
				first_fluid_volume___low: 40,
				first_fluid_volume___high: 40,
			},
			{
				abstract: '3rd',
				first_prod_date___low: makeUtc(new Date(2023, 0, 17)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 17)),
				first_fluid_volume___low: 30,
				first_fluid_volume___high: 30,
			},
			{ abstract: '3rd', first_prod_date___low: makeUtc(new Date(2023, 0, 16)) },
			{},
		];

		expect(ruleMatchesWellHeadersCombination(rows[0], combinations[0], definitionsEntries)).toEqual(true);
		expect(ruleMatchesWellHeadersCombination(rows[1], combinations[1], definitionsEntries)).toEqual(true);
		expect(ruleMatchesWellHeadersCombination(rows[2], combinations[2], definitionsEntries)).toEqual(true);
		expect(ruleMatchesWellHeadersCombination(rows[3], combinations[3], definitionsEntries)).toEqual(true);
		expect(ruleMatchesWellHeadersCombination(rows[4], combinations[4], definitionsEntries)).toEqual(true);
		expect(ruleMatchesWellHeadersCombination(rows[5], combinations[2], definitionsEntries)).toEqual(false);
		expect(ruleMatchesWellHeadersCombination(rows[6], combinations[1], definitionsEntries)).toEqual(false);
		expect(ruleMatchesWellHeadersCombination(rows[4], combinations[3], definitionsEntries)).toEqual(false);
		expect(ruleMatchesWellHeadersCombination(rows[3], combinations[2], definitionsEntries)).toEqual(false);
	});

	test('findRuleForWell()', () => {
		const headers = ['abstract', 'custom_bool_4', 'first_prod_date', 'first_fluid_volume'];

		const headersTypes = {
			abstract: { type: 'string' },
			custom_bool_4: { type: 'boolean' },
			first_prod_date: { type: 'date' },
			first_fluid_volume: {
				type: 'number',
			},
		};

		const headersBehavior = {
			abstract: RuleWellHeaderMatchBehavior.regular,
			custom_bool_4: RuleWellHeaderMatchBehavior.regular,
			first_prod_date: RuleWellHeaderMatchBehavior.regular,
			first_fluid_volume: RuleWellHeaderMatchBehavior.regular,
		};

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const combinations: any[] = [
			{
				abstract: '2nd',
				custom_bool_4: false,
				first_prod_date: makeUtc(new Date(2023, 0, 18)),
				first_fluid_volume: 20,
			},
			{ abstract: '4th', first_prod_date: makeUtc(new Date(2022, 10, 9)), first_fluid_volume: 50 },
			{ abstract: '1st', first_prod_date: makeUtc(new Date(2023, 0, 19)), first_fluid_volume: 10 },
			{
				abstract: '3rd',
				custom_bool_4: true,
				first_prod_date: makeUtc(new Date(2023, 0, 16)),
				first_fluid_volume: 40,
			},
			{ abstract: '3rd', first_prod_date: makeUtc(new Date(2023, 0, 17)), first_fluid_volume: 30 },
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const rows: any[] = [
			{
				abstract: '2nd',
				custom_bool_4: false,
				first_prod_date___low: makeUtc(new Date(2023, 0, 18)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 18)),
				first_fluid_volume___low: 20,
				first_fluid_volume___high: 20,
			},
			{
				abstract: '4th',
				first_prod_date___low: makeUtc(new Date(2022, 10, 9)),
				first_prod_date___high: makeUtc(new Date(2022, 10, 9)),
				first_fluid_volume___low: 50,
				first_fluid_volume___high: 50,
			},
			{
				abstract: '1st',
				first_prod_date___low: makeUtc(new Date(2023, 0, 19)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 19)),
				first_fluid_volume___low: 10,
				first_fluid_volume___high: 10,
			},
			{
				abstract: '3rd',
				custom_bool_4: true,
				first_prod_date___low: makeUtc(new Date(2023, 0, 16)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 16)),
				first_fluid_volume___low: 40,
				first_fluid_volume___high: 40,
			},
			{
				abstract: '3rd',
				first_prod_date___low: makeUtc(new Date(2023, 0, 17)),
				first_prod_date___high: makeUtc(new Date(2023, 0, 17)),
				first_fluid_volume___low: 30,
				first_fluid_volume___high: 30,
			},
			{ abstract: '3rd', first_prod_date___low: makeUtc(new Date(2023, 0, 16)) },
			{},
		];

		expect(findRuleForWell(headers, rows, headersTypes, combinations[0], headersBehavior)).toEqual({
			root: rows[0],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, combinations[1], headersBehavior)).toEqual({
			root: rows[1],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, combinations[2], headersBehavior)).toEqual({
			root: rows[2],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, combinations[3], headersBehavior)).toEqual({
			root: rows[3],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, combinations[4], headersBehavior)).toEqual({
			root: rows[4],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, {}, headersBehavior)).toEqual({
			root: rows[6],
			nested: [],
		});
		expect(findRuleForWell(headers, rows, headersTypes, { abstract: 'not existing' }, headersBehavior)).toEqual(
			undefined
		);
	});
});
