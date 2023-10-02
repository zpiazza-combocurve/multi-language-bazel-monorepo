/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { set } from 'lodash';

import { RequiredFieldError, TypeError } from '@src/helpers/validation';
import { MultipleValidationError } from '@src/api/v1/multi-error';

import { checkModelDuplicates, parseApiProductionTaxes } from './validation';
import { ApiProductionTaxes } from './fields/production-taxes';

const getValidProductionTaxesModel = (): Record<string, any> => ({
	name: 'test',
	unique: false,
	adValoremTax: {
		deductSeveranceTax: false,
		shrinkageCondition: 'shrunk',
		calculation: 'nri',
		rateType: 'gross_well_head',
		rowsCalculationMethod: 'non_monotonic',
		escalationModel: {
			escalationModel1: 'none',
			escalationModel2: '62fbcecfcab9dfc5b88427cd',
		},
		rows: [
			{
				entireWellLife: 'Flat',
				pctOfRevenue: 0,
				dollarPerBoe: 0,
			},
		],
	},
	severanceTax: {
		state: 'alabama',
		shrinkageCondition: 'shrunk',
		calculation: 'nri',
		rateType: 'gross_well_head',
		rowsCalculationMethod: 'non_monotonic',
		oil: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427c4',
				escalationModel2: '62fbcecfcab9dfc5b88427c4',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		gas: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427cf',
				escalationModel2: '62fbcecfcab9dfc5b88427c4',
			},
			rows: [
				{
					dollarPerMcf: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		ngl: {
			escalationModel: {
				escalationModel1: '62fbcecfcab9dfc5b88427c4',
				escalationModel2: '62fbcecfcab9dfc5b88427cd',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
		dripCondensate: {
			escalationModel: {
				escalationModel1: '642f2f56670d176d8558ef7b',
				escalationModel2: '642f2f56670d176d8558ef7b',
			},
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
					pctOfRevenue: 10,
				},
			],
		},
	},
});
const setModelInvalidValue = (path: string[], value: any): ApiProductionTaxes => {
	const model = getValidProductionTaxesModel();
	set(model, path, value);
	return model;
};

describe('v1/projects/econ-models/production-taxes/validation.test', () => {
	describe('parseApiProductionTaxes', () => {
		// WORKS WITH VALID DATA
		it('should parse valid data', () => {
			const input = getValidProductionTaxesModel();
			expect(parseApiProductionTaxes(input)).toEqual(input);
		});

		// MISSING FIELDS TESTS
		it('should throw RequiredFieldError if name field is missing', () => {
			const input = getValidProductionTaxesModel();
			delete input.name;
			expect(() => parseApiProductionTaxes(input)).toThrow(RequiredFieldError);
		});

		it('should throw RequiredFieldError if unique field is missing', () => {
			const input = getValidProductionTaxesModel();
			delete input.unique;
			expect(() => parseApiProductionTaxes(input)).toThrow(RequiredFieldError);
		});

		it('should throw RequiredFieldError if adValoremTax field is missing', () => {
			const input = getValidProductionTaxesModel();
			delete input.adValoremTax;
			expect(() => parseApiProductionTaxes(input)).toThrow(RequiredFieldError);
		});

		it('should throw Error if adValoremTax.rateType is `gross_sales` but no `waterRate`, `oilRate` or `gasRate` are specified', () => {
			const input = getValidProductionTaxesModel();
			input.adValoremTax!.rateType = 'gross_sales';

			expect(() => parseApiProductionTaxes(input)).toThrow(
				new TypeError(
					'`rateType` must be `gross_well_head` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
					'[0].adValoremTax.rateType',
				),
			);
		});
		it('should not throw Error if adValoremTax.rateType is `gross_sales` and either `waterRate`, `oilRate` or `gasRate` are specified', () => {
			const input = getValidProductionTaxesModel();
			input.adValoremTax!.rateType = 'gross_sales';
			delete input.adValoremTax!.rows![0].entireWellLife;
			input.adValoremTax!.rows![0].waterRate = 1;

			expect(() => parseApiProductionTaxes(input)).not.toThrow();
		});
		it('should throw Error if adValoremTax.rowsCalculationMethod is `monotonic` but no `waterRate`, `oilRate` or `gasRate` are specified', () => {
			const input = getValidProductionTaxesModel();
			input.adValoremTax!.rowsCalculationMethod = 'monotonic';

			expect(() => parseApiProductionTaxes(input)).toThrow(
				new TypeError(
					'`rowsCalculationMethod` must be `non_monotonic` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
					'[0].adValoremTax.rowsCalculationMethod',
				),
			);
		});
		it('should not throw Error if adValoremTax.rowsCalculationMethod is `monotonic` an either `waterRate`, `oilRate` or `gasRate` are specified', () => {
			const input = getValidProductionTaxesModel();
			input.adValoremTax!.rowsCalculationMethod = 'monotonic';
			delete input.adValoremTax!.rows![0].entireWellLife;
			input.adValoremTax!.rows![0].waterRate = 1;
			expect(() => parseApiProductionTaxes(input)).not.toThrow();
		});

		it.each([
			[
				{ ...setModelInvalidValue(['adValoremTax', 'deductSeveranceTax'], 'invalid') },
				'`invalid` is not a valid Boolean',
			],
			[
				{ ...setModelInvalidValue(['adValoremTax', 'shrinkageCondition'], 'invalid') },
				'`adValoremTax.shrinkageCondition` must be one of the following values: unshrunk, shrunk',
			],
			[
				{ ...setModelInvalidValue(['adValoremTax', 'calculation'], 'invalid') },
				'`adValoremTax.calculation` must be one of the following values: wi, nri, lease_nri, one_minus_wi, one_minus_nri, wi_minus_one, nri_minus_one, one_minus_lease_nri, lease_nri_minus_one, 100_pct_wi',
			],
			[
				{ ...setModelInvalidValue(['adValoremTax', 'rateType'], 'invalid') },
				'`rateType` must be `gross_well_head` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
			],
			[
				{ ...setModelInvalidValue(['adValoremTax', 'rowsCalculationMethod'], 'invalid') },
				'`rowsCalculationMethod` must be `non_monotonic` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
			],
		])('advalorem properties invalid values throw error', (payload, validPropertiesMessage) => {
			expect(() => parseApiProductionTaxes(payload)).toThrow(validPropertiesMessage);
		});

		it('advalorem escalation property throws a MultipleValidationError when is not valid', () => {
			const input = { ...setModelInvalidValue(['adValoremTax', 'escalationModel'], 'invalid') };
			expect(() => parseApiProductionTaxes(input)).toThrow(
				'Invalid value for `escalationModel`: `invalid`. `escalationModel` must be an object',
			);
		});

		it('should throw RequiredFieldError if severanceTax field is missing', () => {
			const input = getValidProductionTaxesModel();
			delete input.severanceTax;
			expect(() => parseApiProductionTaxes(input)).toThrow(RequiredFieldError);
		});

		it.each([
			[
				{ ...setModelInvalidValue(['severanceTax', 'state'], 'invalid') },
				'`severanceTax.state` must be one of the following values: custom, alaska, alabama, arkansas, arizona, california, colorado, florida, idaho, indiana, kansas, kentucky, louisiana, maryland, michigan, mississippi, montana, north_dakota, nebraska, new_mexico, nevada, new_york, ohio, oklahoma, oregon, pennsylvania, pennsylvania horizontal, pennsylvania vertical, south_dakota, tennessee, texas, utah, virginia, west_virginia, wyoming',
			],
			[
				{ ...setModelInvalidValue(['severanceTax', 'shrinkageCondition'], 'invalid') },
				'`severanceTax.shrinkageCondition` must be one of the following values: unshrunk, shrunk',
			],
			[
				{ ...setModelInvalidValue(['severanceTax', 'calculation'], 'invalid') },
				'`severanceTax.calculation` must be one of the following values: wi, nri, lease_nri, one_minus_wi, one_minus_nri, wi_minus_one, nri_minus_one, one_minus_lease_nri, lease_nri_minus_one, 100_pct_wi',
			],
		])('severanceTax properties invalid values throw error', (payload, validPropertiesMessage) => {
			expect(() => parseApiProductionTaxes(payload)).toThrow(validPropertiesMessage);
		});

		it('severanceTax oil escalation property throws a Error when is not valid', () => {
			const input = { ...setModelInvalidValue(['severanceTax', 'oil', 'escalationModel'], 'invalid') };
			expect(() => parseApiProductionTaxes(input)).toThrow(
				'Invalid value for `escalationModel`: `invalid`. `escalationModel` must be an object',
			);
		});
		it('severanceTax gas escalation property throws a Error when is not valid', () => {
			const input = { ...setModelInvalidValue(['severanceTax', 'gas', 'escalationModel'], 'invalid') };
			expect(() => parseApiProductionTaxes(input)).toThrow(
				'Invalid value for `escalationModel`: `invalid`. `escalationModel` must be an object',
			);
		});
		it('severanceTax ngl escalation property throws a Error when is not valid', () => {
			const input = { ...setModelInvalidValue(['severanceTax', 'ngl', 'escalationModel'], 'invalid') };
			expect(() => parseApiProductionTaxes(input)).toThrow(
				'Invalid value for `escalationModel`: `invalid`. `escalationModel` must be an object',
			);
		});
		it('severanceTax dripCondensate escalation property throws a Error when is not valid', () => {
			const input = { ...setModelInvalidValue(['severanceTax', 'dripCondensate', 'escalationModel'], 'invalid') };
			expect(() => parseApiProductionTaxes(input)).toThrow(
				'Invalid value for `escalationModel`: `invalid`. `escalationModel` must be an object',
			);
		});

		it('should throw Error if severanceTax.rateType is `gross_sales` but no `waterRate`, `oilRate` or `gasRate` are specified in oil.rows', () => {
			const input = getValidProductionTaxesModel();
			input.severanceTax!.rateType = 'gross_sales';

			expect(() => parseApiProductionTaxes(input)).toThrow(
				new TypeError(
					'`rateType` must be `gross_well_head` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
					'[0].severanceTax.rateType',
				),
			);
		});
		it.each([['oil'], ['gas'], ['ngl'], ['dripCondensate']])(
			'should not throw Error if severanceTax.rateType is `gross_sales` an either `waterRate`, `oilRate` or `gasRate` are specified in oil.rows',
			(phase) => {
				const input = getValidProductionTaxesModel();
				delete input.severanceTax![phase].rows![0].entireWellLife;
				input.severanceTax![phase].rows![0].waterRate = 1;
				input.severanceTax!.rateType = 'gross_sales';

				expect(() => parseApiProductionTaxes(input)).not.toThrow();
			},
		);
		it('should throw Error if severanceTax.rowsCalculationMethod is `monotonic` but no `waterRate`, `oilRate` or `gasRate` are specified in oil, gas, ngl or  dripCondensate rows', () => {
			const input = getValidProductionTaxesModel();
			input.severanceTax!.rowsCalculationMethod = 'monotonic';

			expect(() => parseApiProductionTaxes(input)).toThrow(
				new TypeError(
					'`rowsCalculationMethod` must be `non_monotonic` if either `waterRate`, `oilRate` or `gasRate` are not specified in the `rows` array',
					'[0].severanceTax.rowsCalculationMethod',
				),
			);
		});

		it.each([['oil'], ['gas'], ['ngl'], ['dripCondensate']])(
			'should not throw Error if severanceTax.rowsCalculationMethod is `monotonic` an either `waterRate`, `oilRate` or `gasRate` are specified in oil.rows',
			(phase) => {
				const input = getValidProductionTaxesModel();
				delete input.severanceTax![phase].rows![0].entireWellLife;
				input.severanceTax.rowsCalculationMethod = 'monotonic';
				input.severanceTax![phase].rows![0].waterRate = 1;

				expect(() => parseApiProductionTaxes(input)).not.toThrow();
			},
		);

		it('should receive and ERROR_ON_EXTRANEOUS_FIELDS', () => {
			const input = getValidProductionTaxesModel();
			const invalidData = {
				...input,
				invalidField: 'invalidValue',
			};
			expect(() => parseApiProductionTaxes(invalidData)).toThrow('`invalidField` is not a valid field name');
		});
	});

	describe('checkModelDuplicates', () => {
		it('returns the original array if there are no duplicates', () => {
			const input = [{ name: 'Model1' }, { name: 'Model2' }, { name: 'Model3' }];

			const output = checkModelDuplicates(input);

			expect(output).toEqual(input);
		});

		it('filters out duplicate elements and throws a MultipleValidationError', () => {
			const input = [
				{ name: 'Model1' },
				{ name: 'Model2' },
				{ name: 'Model1' },
				{ name: 'Model3' },
				{ name: 'Model2' },
			];

			expect(() => checkModelDuplicates(input)).toThrow(MultipleValidationError);
		});
	});
});
