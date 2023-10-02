import { TypeError, ValueError } from '@src/helpers/validation';
import { MultipleValidationError } from '@src/api/v1/multi-error';

import { parseApiRisking } from './validation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValidRisking(): Record<string, any> {
	return {
		id: '643438ed6c2cf900126a673f',
		name: 'jdh-risking-test1',
		unique: false,
		risking: {
			riskProd: false,
			riskNglDripCondViaGasRisk: true,
			oil: {
				rows: [
					{
						entireWellLife: 'Flat',
						multiplier: 100,
					},
				],
			},
			gas: {
				rows: [
					{
						offsetToFpd: 2,
						multiplier: 100,
					},
				],
			},
			ngl: {
				rows: [
					{
						offsetToAsOf: 2,
						multiplier: 100,
					},
				],
			},
			dripCondensate: {
				rows: [
					{
						offsetToEndHistory: 2,
						multiplier: 100,
					},
				],
			},
			water: {
				rows: [
					{
						offsetToEndHistory: 2,
						multiplier: 100,
					},
				],
			},
		},
		shutIn: {
			rows: [
				{
					dates: {
						startDate: '2023-04-01',
						endDate: '2023-04-27',
					},
					multiplier: 1,
					phase: 'all',
					repeatRangeOfDates: 'no_repeat',
					totalOccurrences: 1,
					unit: 'day',
					scalePostShutInEndCriteria: 'econ_limit',
					scalePostShutInEnd: ' ',
					fixedExpense: true,
					capex: true,
				},
			],
		},
	};
}
//TODO: shut in scale post shut in end
describe('v1/risking/validation/parseApiReservesCategory', () => {
	describe('riskingModel', () => {
		describe('riskProd', () => {
			test('valid value should return result', () => {
				let input = getValidRisking();
				input.risking.riskProd = true;

				let result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();

				input = getValidRisking();
				input.risking.riskProd = false;

				result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing property should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.riskProd;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.riskProd`');

				input = getValidRisking();
				input.risking.riskProd = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.riskProd`');
			});

			test('invalid value type should throw exception', () => {
				let input = getValidRisking();
				input.risking.riskProd = 2;

				expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a valid Boolean');

				input = getValidRisking();
				input.risking.riskProd = null;

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid Boolean');

				input = getValidRisking();
				input.risking.riskProd = {};

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid Boolean');
			});
		});

		describe('riskNglDripCondViaGasRisk', () => {
			test('valid value should return result', () => {
				let input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = true;

				let result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();

				input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = false;

				result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing property should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.riskNglDripCondViaGasRisk;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Missing required field: `risking.riskNglDripCondViaGasRisk`',
				);

				input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Missing required field: `risking.riskNglDripCondViaGasRisk`',
				);
			});

			test('invalid value type should throw exception', () => {
				let input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = 2;

				expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a valid Boolean');

				input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = null;

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid Boolean');

				input = getValidRisking();
				input.risking.riskNglDripCondViaGasRisk = {};

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid Boolean');
			});
		});

		describe('oil', () => {
			test('missing value should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.oil;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.oil`');

				input = getValidRisking();
				input.risking.oil = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.oil`');
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.risking.oil = 'invalidValue';

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `oil`: `invalidValue`. `oil` must be an object.',
				);
			});

			test('null value should throw exception', () => {
				const input = getValidRisking();

				input.risking.oil = null;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `oil`: `null`. `oil` must be an object.',
				);
			});
		});

		describe('gas', () => {
			test('missing value should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.gas;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.gas`');

				input = getValidRisking();
				input.risking.gas = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.gas`');
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.risking.gas = 'invalidValue';

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `gas`: `invalidValue`. `gas` must be an object.',
				);
			});

			test('null value should throw exception', () => {
				const input = getValidRisking();

				input.risking.gas = null;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `gas`: `null`. `gas` must be an object.',
				);
			});
		});

		describe('ngl', () => {
			test('missing value should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.ngl;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.ngl`');

				input = getValidRisking();
				input.risking.ngl = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.ngl`');
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.risking.ngl = 'invalidValue';

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `ngl`: `invalidValue`. `ngl` must be an object.',
				);
			});

			test('null value should throw exception', () => {
				const input = getValidRisking();

				input.risking.ngl = null;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `ngl`: `null`. `ngl` must be an object.',
				);
			});
		});

		describe('drip_condensate', () => {
			test('missing value should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.dripCondensate;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.dripCondensate`');

				input = getValidRisking();
				input.risking.dripCondensate = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.dripCondensate`');
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.risking.dripCondensate = 'invalidValue';

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `dripCondensate`: `invalidValue`. `dripCondensate` must be an object.',
				);
			});

			test('null value should throw exception', () => {
				const input = getValidRisking();

				input.risking.dripCondensate = null;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `dripCondensate`: `null`. `dripCondensate` must be an object.',
				);
			});
		});

		describe('water', () => {
			test('missing value should throw exception', () => {
				let input = getValidRisking();
				delete input.risking.water;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.water`');

				input = getValidRisking();
				input.risking.water = undefined;

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `risking.water`');
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.risking.water = 'invalidValue';

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `water`: `invalidValue`. `water` must be an object.',
				);
			});

			test('null value should throw exception', () => {
				const input = getValidRisking();

				input.risking.water = null;

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `water`: `null`. `water` must be an object.',
				);
			});
		});

		// these tests are valid for all of the following properties as they share the same row definitions:
		// oil, gas, ngl, dripCondensate, water
		describe('standard rows', () => {
			test('valid value should return result', () => {
				const input = getValidRisking();

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
				'invalid offset type should throw exception',
				(itemType: string) => {
					const input = getValidRisking();

					input.risking[itemType].rows = [
						{
							multiplier: 1,
							offsetToDiscountDate: 2,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'All rows must contain exactly one of the following properties: `entireWellLife`, `offsetToFpd`, `offsetToAsOf`, `offsetToFirstSegment`, `offsetToEndHistory`, `dates`, `seasonal`',
					);
				},
			);

			it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
				'multiple qualifier types should throw exception',
				(itemType: string) => {
					const input = getValidRisking();

					input.risking[itemType].rows = [
						{
							multiplier: 1,
							dates: '2022-03-01',
						},
						{
							multiplier: 1,
							offsetToAsOf: 2,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'All rows must contain exactly one of the following properties: `entireWellLife`, `offsetToFpd`, `offsetToAsOf`, `offsetToFirstSegment`, `offsetToEndHistory`, `dates`, `seasonal`',
					);
				},
			);

			it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
				'no rows should throw exception',
				(itemType: string) => {
					const input = getValidRisking();

					input.risking[itemType].rows = [];

					expect(() => parseApiRisking(input, 1)).toThrow('must NOT have fewer than 1 items');
				},
			);

			it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
				'more than 100 rows should throw exception',
				(itemType: string) => {
					let input = getValidRisking();
					input.risking[itemType].rows = [];

					for (let i = 0; i < 100; i++) {
						input.risking[itemType].rows.push({ multiplier: 1, offsetToAsOf: 2 });
					}

					// validation not triggered at 100
					expect(input.risking[itemType].rows.length).toBe(100);
					parseApiRisking(input, 1);

					input = getValidRisking();
					input.risking[itemType].rows = [];

					for (let i = 0; i <= 100; i++) {
						input.risking[itemType].rows.push({ multiplier: 1, offsetToAsOf: 2 });
					}

					expect(input.risking[itemType].rows.length).toBe(101);
					expect(() => parseApiRisking(input, 1)).toThrow('must NOT have more than 100 items');
				},
			);

			it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
				'no row criteria should throw exception',
				(itemType: string) => {
					const input = getValidRisking();

					input.risking[itemType].rows = [
						{
							multiplier: 1,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'All rows must contain exactly one of the following properties: `entireWellLife`, `offsetToFpd`, `offsetToAsOf`, `offsetToFirstSegment`, `offsetToEndHistory`, `dates`, `seasonal`',
					);
				},
			);

			describe('multiplier', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'missing value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						delete input.risking[itemType].rows[0].multiplier;

						expect(() => parseApiRisking(input, 1)).toThrow(
							`Missing required field: \`risking.${itemType}.rows.0.multiplier\``,
						);

						input = getValidRisking();
						input.risking[itemType].rows[0].multiplier = undefined;

						expect(() => parseApiRisking(input, 1)).toThrow(
							`Missing required field: \`risking.${itemType}.rows.0.multiplier\``,
						);
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0].multiplier = 'invalidValue';

						expect(() => parseApiRisking(input, 1)).toThrow('`invalidValue` is not a valid number');

						input = getValidRisking();
						input.risking[itemType].rows[0].multiplier = null;

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid number');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0].multiplier = -1;

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].multiplier\` must be >= 0`,
						);

						input = getValidRisking();
						input.risking[itemType].rows[0].multiplier = 1000001;

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].multiplier\` must be <= 1000000`,
						);
					},
				);
			});

			describe('entireWellLife', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								entireWellLife: 'Flat',
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'multiple rows should throw exception',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								entireWellLife: 'Flat',
							},
							{
								multiplier: 1,
								entireWellLife: 'Flat',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow(
							'There can only be one row in a Model with the `entireWellLife` property.',
						);
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							entireWellLife: 2,
						};

						let errors = [
							new TypeError('`2` is not a string'),
							new ValueError(
								`\`risking.${itemType}.rows[0].entireWellLife\` must be one of the following values: Flat`,
							),
						];

						expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							entireWellLife: {},
						};

						errors = [
							new TypeError('`[object Object]` is not a string'),
							new ValueError(
								`\`risking.${itemType}.rows[0].entireWellLife\` must be one of the following values: Flat`,
							),
						];

						expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							entireWellLife: null,
						};

						errors = [
							new TypeError('`null` is not a string'),
							new ValueError(
								`\`risking.${itemType}.rows[0].entireWellLife\` must be one of the following values: Flat`,
							),
						];

						expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value should throw exception',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows[0] = {
							multiplier: 1,
							entireWellLife: 'invalidValue',
						};

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].entireWellLife\` must be one of the following values: Flat`,
						);
					},
				);
			});

			describe('offsetToFpd', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								offsetToFpd: 2,
							},
							{
								multiplier: 1,
								offsetToFpd: 2,
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFpd: 'invalidValueType',
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFpd: null,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid period value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFpd: 1.5,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFpd: 1201,
						};

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].offsetToFpd\` must be <= 1200`,
						);
					},
				);
			});

			describe('offsetToAsOf', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								offsetToAsOf: 2,
							},
							{
								multiplier: 1,
								offsetToAsOf: 2,
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();

						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToAsOf: 'invalidValueType',
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToAsOf: null,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid period value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToAsOf: 1.5,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToAsOf: 1201,
						};

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].offsetToAsOf\` must be <= 1200`,
						);
					},
				);
			});

			describe('offsetToFirstSegment', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								offsetToFirstSegment: 2,
							},
							{
								multiplier: 1,
								offsetToFirstSegment: 2,
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFirstSegment: 'invalidValueType',
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFirstSegment: null,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid period value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFirstSegment: 1.5,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToFirstSegment: 1201,
						};

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].offsetToFirstSegment\` must be <= 1200`,
						);
					},
				);
			});

			describe('offsetToEndHistory', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								offsetToEndHistory: 2,
							},
							{
								multiplier: 1,
								offsetToEndHistory: 2,
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToEndHistory: 'invalidValueType',
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToEndHistory: null,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid period value should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToEndHistory: 1.5,
						};

						expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

						input = getValidRisking();
						input.risking[itemType].rows[0] = {
							multiplier: 1,
							offsetToEndHistory: 1201,
						};

						expect(() => parseApiRisking(input, 1)).toThrow(
							`\`risking.${itemType}.rows[0].offsetToEndHistory\` must be <= 1200`,
						);
					},
				);
			});

			describe('dates', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								dates: '2022-03-01',
							},
							{
								multiplier: 1,
								dates: '2022-04-01',
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'invalid value type should throw exception',
					(itemType: string) => {
						let input = getValidRisking();
						input.risking[itemType].rows = [
							{
								multiplier: 1,
								dates: 2,
							},
							{
								multiplier: 1,
								dates: '2022-03-01',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a string');

						input = getValidRisking();
						input.risking[itemType].rows = [
							{
								multiplier: 1,
								dates: 'invalidValueType',
							},
							{
								multiplier: 1,
								dates: '2022-03-01',
							},
						];

						const errors = [
							new TypeError('`invalid value` is not a valid ISO date'),
							new TypeError('should be <= 2262-04-01'),
						];

						expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

						input = getValidRisking();
						input.risking[itemType].rows = [
							{
								multiplier: 1,
								dates: null,
							},
							{
								multiplier: 1,
								dates: '2022-03-01',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a string');
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'should throw an error if the startDate is not a valid date',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 1,
								dates: 'invalid value',
							},
							{
								multiplier: 1,
								dates: '2022-03-01',
							},
						];

						const errors = [
							new TypeError('`invalid value` is not a valid ISO date'),
							new TypeError('should be <= 2262-04-01'),
						];

						expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
					},
				);
			});

			describe('seasonal', () => {
				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'valid value should return result',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 99,
								seasonal: 'Jan',
							},
							{
								multiplier: 99,
								seasonal: 'Feb',
							},
							{
								multiplier: 99,
								seasonal: 'Mar',
							},
							{
								multiplier: 99,
								seasonal: 'Apr',
							},
							{
								multiplier: 99,
								seasonal: 'May',
							},
							{
								multiplier: 99,
								seasonal: 'Jun',
							},
							{
								multiplier: 99,
								seasonal: 'Jul',
							},
							{
								multiplier: 99,
								seasonal: 'Aug',
							},
							{
								multiplier: 99,
								seasonal: 'Sep',
							},
							{
								multiplier: 99,
								seasonal: 'Oct',
							},
							{
								multiplier: 99,
								seasonal: 'Nov',
							},
							{
								multiplier: 99,
								seasonal: 'Dec',
							},
						];

						const result = parseApiRisking(input, 1);

						expect(result).not.toBeNull();
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'less than 12 month rows should throw exception',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 99,
								seasonal: 'Jan',
							},
							{
								multiplier: 99,
								seasonal: 'Feb',
							},
							{
								multiplier: 99,
								seasonal: 'Mar',
							},
							{
								multiplier: 99,
								seasonal: 'Apr',
							},
							{
								multiplier: 99,
								seasonal: 'May',
							},
							{
								multiplier: 99,
								seasonal: 'Jun',
							},
							{
								multiplier: 99,
								seasonal: 'Jul',
							},
							{
								multiplier: 99,
								seasonal: 'Aug',
							},
							{
								multiplier: 99,
								seasonal: 'Sep',
							},
							{
								multiplier: 99,
								seasonal: 'Oct',
							},
							{
								multiplier: 99,
								seasonal: 'Nov',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow(
							'Seasonal rows array must contain exactly 12 rows, one for each of the following `seasonal` values: `Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`',
						);
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'incorrectly sorted month rows should throw exception',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 99,
								seasonal: 'Dec',
							},
							{
								multiplier: 99,
								seasonal: 'Jan',
							},
							{
								multiplier: 99,
								seasonal: 'Feb',
							},
							{
								multiplier: 99,
								seasonal: 'Mar',
							},
							{
								multiplier: 99,
								seasonal: 'Apr',
							},
							{
								multiplier: 99,
								seasonal: 'May',
							},
							{
								multiplier: 99,
								seasonal: 'Jun',
							},
							{
								multiplier: 99,
								seasonal: 'Jul',
							},
							{
								multiplier: 99,
								seasonal: 'Aug',
							},
							{
								multiplier: 99,
								seasonal: 'Sep',
							},
							{
								multiplier: 99,
								seasonal: 'Oct',
							},
							{
								multiplier: 99,
								seasonal: 'Nov',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow(
							'Seasonal rows array must contain exactly 12 rows, one for each of the following `seasonal` values: `Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`',
						);
					},
				);

				it.each(['oil', 'gas', 'water', 'ngl', 'dripCondensate'])(
					'more than 12 month rows should throw exception',
					(itemType: string) => {
						const input = getValidRisking();

						input.risking[itemType].rows = [
							{
								multiplier: 99,
								seasonal: 'Jan',
							},
							{
								multiplier: 99,
								seasonal: 'Feb',
							},
							{
								multiplier: 99,
								seasonal: 'Mar',
							},
							{
								multiplier: 99,
								seasonal: 'Apr',
							},
							{
								multiplier: 99,
								seasonal: 'May',
							},
							{
								multiplier: 99,
								seasonal: 'Jun',
							},
							{
								multiplier: 99,
								seasonal: 'Jul',
							},
							{
								multiplier: 99,
								seasonal: 'Aug',
							},
							{
								multiplier: 99,
								seasonal: 'Sep',
							},
							{
								multiplier: 99,
								seasonal: 'Oct',
							},
							{
								multiplier: 99,
								seasonal: 'Nov',
							},
							{
								multiplier: 99,
								seasonal: 'Dec',
							},
							{
								multiplier: 99,
								seasonal: 'Jan',
							},
						];

						expect(() => parseApiRisking(input, 1)).toThrow(
							'Seasonal rows array must contain exactly 12 rows, one for each of the following `seasonal` values: `Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`',
						);
					},
				);
			});
		});

		// eslint-disable-next-line jest/no-disabled-tests
		describe.skip('well_stream', () => {
			test('valid value should return result', () => {
				const input = getValidRisking();

				input.risking.wellStream = {
					rows: [
						{
							offsetToAsOf: 2,
							count: 10,
						},
					],
				};

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid offset type should throw exception', () => {
				const input = getValidRisking();

				input.risking.wellStream.rows = [
					{
						count: 1,
						offsetToEndHistory: 2,
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'All rows must contain exactly one of the following properties: `entireWellLife`, `offsetToFpd`, `offsetToAsOf`, `offsetToDiscountDate`, `dates`',
				);
			});

			test('missing both count and percentage should throw exception', () => {
				const input = getValidRisking();

				input.risking.wellStream = {
					rows: [
						{
							offsetToAsOf: 2,
							multiplier: 10,
						},
					],
				};

				expect(() => parseApiRisking(input, 1)).toThrow(
					'All objects in the array must contain either `count` or `percentage` properties',
				);
			});

			test('extra property should throw exception', () => {
				const input = getValidRisking();

				input.risking.wellStream = {
					rows: [
						{
							offsetToAsOf: 2,
							count: 10,
							multiplier: 10,
						},
					],
				};

				expect(() => parseApiRisking(input, 1)).toThrow(
					'There can only be 2 properties the Model row, but there are 3. Properties submitted are: offsetToAsOf, count, multiplier.',
				);
			});

			test('mixed count and percentage should throw exception', () => {
				const input = getValidRisking();

				input.risking.wellStream = {
					rows: [
						{
							offsetToAsOf: 2,
							count: 10,
						},
						{
							offsetToAsOf: 2,
							percentage: 10,
						},
					],
				};

				expect(() => parseApiRisking(input, 1)).toThrow(
					'All objects in the array must contain either `count` or `percentage` properties',
				);
			});

			test('missing criteria should throw exception', () => {
				const input = getValidRisking();

				input.risking.wellStream = {
					rows: [
						{
							count: 10,
						},
					],
				};

				expect(() => parseApiRisking(input, 1)).toThrow(
					'All rows must contain exactly one of the following properties: `entireWellLife`, `offsetToFpd`, `offsetToAsOf`, `offsetToDiscountDate`, `dates`',
				);
			});

			describe('count', () => {
				test('valid values should return result', () => {
					let input = getValidRisking();
					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								count: 1,
							},
						],
					};

					let result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();

					input = getValidRisking();
					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								count: 250000,
							},
						],
					};

					result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('less than or equal to zero should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								count: 0,
							},
						],
					};

					expect(() => parseApiRisking(input, 1)).toThrow('`risking.wellStream.rows[0].count` must be >= 1');
				});

				test('greater than or equal to 250000 should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								count: 250001,
							},
						],
					};

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].count` must be <= 250000',
					);
				});
			});

			describe('percentage', () => {
				test('valid values should return result', () => {
					let input = getValidRisking();
					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								percentage: 0,
							},
						],
					};

					let result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();

					input = getValidRisking();
					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								percentage: 1000000,
							},
						],
					};

					result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('less than zero should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								percentage: -1,
							},
						],
					};

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].percentage` must be >= 0',
					);
				});

				test('greater than or equal to 1000000 should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream = {
						rows: [
							{
								offsetToAsOf: 2,
								percentage: 1000001,
							},
						],
					};

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].percentage` must be <= 1000000',
					);
				});
			});

			describe('entireWellLife', () => {
				test('valid value should return result', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: 'Flat',
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('multiple rows should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: 'Flat',
						},
						{
							count: 1,
							entireWellLife: 'Flat',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'There can only be one row in a Model with the `entireWellLife` property.',
					);
				});

				test('invalid value type should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: 2,
						},
					];

					let errors = [
						new TypeError('`2` is not a string'),
						new ValueError(
							'`risking.wellStream.rows[0].entireWellLife` must be one of the following values: Flat',
						),
					];

					expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: {},
						},
					];

					errors = [
						new TypeError('`[object Object]` is not a string'),
						new ValueError(
							'`risking.wellStream.rows[0].entireWellLife` must be one of the following values: Flat',
						),
					];

					expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: null,
						},
					];

					errors = [
						new TypeError('`null` is not a string'),
						new ValueError(
							'`risking.wellStream.rows[0].entireWellLife` must be one of the following values: Flat',
						),
					];

					expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
				});

				test('invalid value should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							entireWellLife: 'invalidValue',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].entireWellLife` must be one of the following values: Flat',
					);
				});
			});

			describe('offsetToFpd', () => {
				test('valid value should return result', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToFpd: 2,
						},
						{
							count: 1,
							offsetToFpd: 2,
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('invalid value type should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToFpd: 'invalidValueType',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToFpd: null,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
				});

				test('invalid period value should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToFpd: 1.5,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToFpd: 1201,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].offsetToFpd` must be <= 1200',
					);
				});
			});

			describe('offsetToAsOf', () => {
				test('valid value should return result', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToAsOf: 2,
						},
						{
							count: 1,
							offsetToAsOf: 2,
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('invalid value type should throw exception', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToAsOf: 'invalidValueType',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToAsOf: null,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
				});

				test('invalid period value should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToAsOf: 1.5,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToAsOf: 1201,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].offsetToAsOf` must be <= 1200',
					);
				});
			});

			describe('offsetToDiscountDate', () => {
				test('valid value should return result', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToDiscountDate: 2,
						},
						{
							count: 1,
							offsetToDiscountDate: 2,
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('invalid value type should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToDiscountDate: 'invalidValueType',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`invalidValueType` is not a valid integer');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToDiscountDate: null,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid integer');
				});

				test('invalid period value should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToDiscountDate: 1.5,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`1.5` is not a valid integer');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							offsetToDiscountDate: 1201,
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow(
						'`risking.wellStream.rows[0].offsetToDiscountDate` must be <= 1200',
					);
				});
			});

			describe('dates', () => {
				test('valid value should return result', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							dates: '2022-03-01',
						},
						{
							count: 1,
							dates: '2022-04-01',
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				});

				test('invalid value type should throw exception', () => {
					let input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							dates: 2,
						},
						{
							count: 1,
							dates: '2022-03-01',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a string');

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							dates: 'invalidValueType',
						},
						{
							count: 1,
							dates: '2022-03-01',
						},
					];

					const errors = [
						new TypeError('`invalid value` is not a valid ISO date'),
						new TypeError('should be <= 2262-04-01'),
					];

					expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

					input = getValidRisking();
					input.risking.wellStream.rows = [
						{
							count: 1,
							dates: null,
						},
						{
							count: 1,
							dates: '2022-03-01',
						},
					];

					expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a string');
				});

				test('should throw an error if the startDate is not a valid date', () => {
					const input = getValidRisking();

					input.risking.wellStream.rows = [
						{
							count: 1,
							dates: 'invalid value',
						},
						{
							count: 1,
							dates: '2022-04-01',
						},
					];

					const errors = [
						new TypeError('`invalid value` is not a valid ISO date'),
						new TypeError('should be <= 2262-04-01'),
					];

					expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
				});
			});
		});
	});

	describe('shutIn', () => {
		test('valid value should return result', () => {
			const input = getValidRisking();

			input.shutIn.rows = [
				{
					phase: 'all',
					multiplier: 1,
					repeatRangeOfDates: 'no_repeat',
					totalOccurrences: 1,
					unit: 'day',
					scalePostShutInEndCriteria: 'econ_limit',
					scalePostShutInEnd: ' ',
					fixedExpense: true,
					capex: true,
					dates: {
						startDate: '2023-04-01',
						endDate: '2023-04-27',
					},
				},
			];

			const result = parseApiRisking(input, 1);

			expect(result).not.toBeNull();
		});

		test('empty rows should return result', () => {
			const input = getValidRisking();

			input.shutIn.rows = [];

			const result = parseApiRisking(input, 1);

			expect(result).not.toBeNull();
		});

		test('mixed qualifiers should throw exception', () => {
			const input = getValidRisking();

			input.shutIn.rows = [
				{
					phase: 'all',
					multiplier: 1,
					repeatRangeOfDates: 'no_repeat',
					totalOccurrences: 1,
					unit: 'day',
					scalePostShutInEndCriteria: 'econ_limit',
					scalePostShutInEnd: ' ',
					capex: true,
					fixedExpense: true,
					offsetToAsOf: {
						start: 1,
						end: 2,
					},
				},
				{
					phase: 'all',
					multiplier: 1,
					repeatRangeOfDates: 'no_repeat',
					totalOccurrences: 1,
					unit: 'day',
					scalePostShutInEndCriteria: 'econ_limit',
					scalePostShutInEnd: ' ',
					capex: true,
					fixedExpense: true,
					dates: {
						startDate: '2023-04-01',
						endDate: '2023-04-27',
					},
				},
			];

			expect(() => parseApiRisking(input, 1)).toThrow(
				'All objects in the array must contain either offsetToAsOf or dates properties',
			);
		});

		describe('phase', () => {
			it.each(['all', 'oil', 'gas', 'water'])('valid value should return result', (phase: string) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase,
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `shutIn.rows.0.phase`');
			});

			test('invalid value type should throw exception', () => {
				let input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 2,
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				let errors = [
					new TypeError('`2` is not a string'),
					new ValueError('`shutIn.rows[0].phase` must be one of the following values: all, oil, gas, water'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: null,
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`null` is not a string'),
					new ValueError('`shutIn.rows[0].phase` must be one of the following values: all, oil, gas, water'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: {},
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`[object Object]` is not a string'),
					new ValueError('`shutIn.rows[0].phase` must be one of the following values: all, oil, gas, water'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'other',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'`shutIn.rows[0].phase` must be one of the following values: all, oil, gas, water',
				);
			});
		});

		describe('repeatRangeOfDates', () => {
			it.each(['no_repeat', 'monthly', 'yearly'])(
				'valid value should return result',
				(repeatRangeOfDates: string) => {
					const input = getValidRisking();

					input.shutIn.rows = [
						{
							phase: 'all',
							multiplier: 1,
							repeatRangeOfDates,
							totalOccurrences: 1,
							unit: 'day',
							scalePostShutInEndCriteria: 'econ_limit',
							scalePostShutInEnd: ' ',
							fixedExpense: true,
							capex: true,
							dates: {
								startDate: '2023-04-01',
								endDate: '2023-04-27',
							},
						},
					];

					const result = parseApiRisking(input, 1);

					expect(result).not.toBeNull();
				},
			);

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Missing required field: `shutIn.rows.0.repeatRangeOfDates`',
				);
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 2,
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				let errors = [
					new TypeError('`2` is not a string'),
					new ValueError(
						'`shutIn.rows[0].repeatRangeOfDates` must be one of the following values: no_repeat, monthly, yearly',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: null,
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`null` is not a string'),
					new ValueError(
						'`shutIn.rows[0].repeatRangeOfDates` must be one of the following values: no_repeat, monthly, yearly',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: {},
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`[object Object]` is not a string'),
					new ValueError(
						'`shutIn.rows[0].repeatRangeOfDates` must be one of the following values: no_repeat, monthly, yearly',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'other',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'`shutIn.rows[0].repeatRangeOfDates` must be one of the following values: no_repeat, monthly, yearly',
				);
			});

			test('when offsetAsOfDateCriteria value other than no_repeat should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'monthly',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'When OffsetToAsOf criteria is used repeatRangeOfDates must have the following value: `no_repeat`',
				);
			});
		});

		describe('totalOccurrences', () => {
			it.each([1, 1200])('valid value should return result', (totalOccurrences) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'monthly',
						totalOccurrences,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'monthly',
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Missing required field: `shutIn.rows.0.totalOccurrences`',
				);
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 'test',
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`test` is not a valid number');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: null,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid number');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: {},
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid number');
			});

			test('value less than or equal to zero should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 0,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].totalOccurrences` must be >= 1');
			});

			test('value greater than 1200 should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1201,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].totalOccurrences` must be <= 1200');
			});

			test('when not Date criteria value other than 1 should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 2,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'When OffsetToAsOf criteria is used totalOccurrences must have the following value: 1',
				);
			});
		});

		describe('unit', () => {
			it.each(['day', 'month'])('valid value should return result', (unit) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit,
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						totalOccurrences: 1,
						repeatRangeOfDates: 'no_repeat',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `shutIn.rows.0.unit`');
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 2,
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				let errors = [
					new TypeError('`2` is not a string'),
					new ValueError('`shutIn.rows[0].phase` must be one of the following values: day, month'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: null,
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				errors = [
					new TypeError('`null` is not a string'),
					new ValueError('`shutIn.rows[0].unit` must be one of the following values: day, month'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: {},
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				errors = [
					new TypeError('`[object Object]` is not a string'),
					new ValueError('`shutIn.rows[0].unit` must be one of the following values: day, month'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'other',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'`shutIn.rows[0].unit` must be one of the following values: day, month',
				);
			});

			test('when not OffsetToAsOf criteria value other than day should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 2,
						unit: 'month',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'When Dates criteria is used unit must have the following value: `day`',
				);
			});
		});

		describe('multiplier', () => {
			it.each([0.1, 1, 1000])('valid value should return result', (multiplier) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier,
						repeatRangeOfDates: 'monthly',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						totalOccurrences: 1,
						repeatRangeOfDates: 'monthly',
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `shutIn.rows.0.multiplier`');
			});

			test('invalid value type should throw exception', () => {
				let input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 'test',
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`test` is not a valid number');

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: null,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid number');

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: {},
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid number');
			});

			test('value less than or equal to zero should throw exception', () => {
				let input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: -1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].multiplier` must be > 0');

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 0,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].multiplier` must be > 0');
			});

			test('value greater than 1000 should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1001,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].multiplier` must be <= 1000');
			});
		});

		describe('scalePostShutInEndCriteria', () => {
			test('valid econ_limit value for dates criteria should return result', () => {
				let input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				let result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();

				input = getValidRisking();
				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',

						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid econ_limit value for dates criteria should return result', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: '2023-04-27',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'scalePostShutInEnd cannot have a value when scalePostShutInEndCriteria is `econ_limit`',
				);
			});

			test('valid dates value for dates criteria should return result', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'dates',
						scalePostShutInEnd: '2023-04-27',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('valid econ_limit value for offsetToAsOf criteria should return result', () => {
				let input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				let result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();

				input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid econ_limit value for offsetToAsOf criteria should throw error', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: '1',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'scalePostShutInEnd cannot have a value when scalePostShutInEndCriteria is `econ_limit`',
				);
			});

			test('valid offset_to_as_of_date value for offsetToAsOf criteria should return result', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'offset_to_as_of_date',
						scalePostShutInEnd: '2',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid offset_to_as_of_date value for offsetToAsOf criteria should throw error', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'offset_to_as_of_date',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
				];

				const errors = [new TypeError('` ` is not a valid number'), new TypeError('should be >= 1')];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('missing value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Missing required field: `shutIn.rows.0.scalePostShutInEndCriteria`',
				);
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 2,
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				let errors = [
					new TypeError('`2` is not a string'),
					new ValueError(
						'`shutIn.rows[0].scalePostShutInEndCriteria` must be one of the following values: dates, offset_to_as_of_date, econ_limit',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: null,
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`null` is not a string'),
					new ValueError(
						'`shutIn.rows[0].scalePostShutInEndCriteria` must be one of the following values: dates, offset_to_as_of_date, econ_limit',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: {},
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				errors = [
					new TypeError('`[object Object]` is not a string'),
					new ValueError(
						'`shutIn.rows[0].scalePostShutInEndCriteria` must be one of the following values: dates, offset_to_as_of_date, econ_limit',
					),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('invalid value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'other',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'`shutIn.rows[0].scalePostShutInEndCriteria` must be one of the following values: dates, econ_limit',
				);
			});
		});

		describe('fixedExpense', () => {
			it.each([true, false])('valid value should return result', (fixedExpense: boolean) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing property should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `shutIn.rows.0.fixedExpense`');
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: 2,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a valid Boolean');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: null,
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid Boolean');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: {},
						capex: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid Boolean');
			});
		});

		describe('capex', () => {
			it.each([true, false])('valid value should return result', (capex: boolean) => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('missing property should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('Missing required field: `shutIn.rows.0.capex`');
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: 2,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`2` is not a valid Boolean');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: null,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`null` is not a valid Boolean');

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: {},
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`[object Object]` is not a valid Boolean');
			});
		});

		// note that for shut in there is no econ limit or row-over-row date validation
		// each object is validated on its own values only
		describe('dates', () => {
			test('valid value should return result', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-01',
							endDate: '2023-04-27',
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: 2,
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `dates`: `2`. `dates` must be an object.',
				);

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: 'invalidValueType',
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `dates`: `invalidValueType`. `dates` must be an object.',
				);

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: null,
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `dates`: `null`. `dates` must be an object.',
				);
			});

			test('should throw an error if the startDate is not a valid date', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: {
							startDate: 'test',
							endDate: '2023-04-27',
						},
					},
				];

				const errors = [
					new TypeError('`test` is not a valid ISO date'),
					new TypeError('should be <= 2262-04-01'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('should throw an error if the endDate is not a valid date', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-27',
							endDate: 'test',
						},
					},
				];

				const errors = [
					new TypeError('`test` is not a valid ISO date'),
					new TypeError('should be <= 2262-04-01'),
				];

				expect(() => parseApiRisking(input, 1)).toThrow(new MultipleValidationError(errors));
			});

			test('should throw an error if the endDate is less than the startDate', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						dates: {
							startDate: '2023-04-27',
							endDate: '2023-03-27',
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('should be >= 2023-04-27');
			});
		});

		// note that for shut in there is no econ limit or row-over-row offsetToAsOf validation
		// each object is validated on its own values only
		describe('offsetToAsOf', () => {
			test('valid value should return result', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: {
							start: 1,
							end: 2,
						},
					},
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: {
							start: 1.5,
							end: 2,
						},
					},
				];

				const result = parseApiRisking(input, 1);

				expect(result).not.toBeNull();
			});

			test('invalid value type should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: 2,
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `offsetToAsOf`: `2`. `offsetToAsOf` must be an object.',
				);

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: 'invalidValueType',
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `offsetToAsOf`: `invalidValueType`. `offsetToAsOf` must be an object.',
				);

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: null,
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow(
					'Invalid value for `offsetToAsOf`: `null`. `offsetToAsOf` must be an object.',
				);
			});

			test('invalid start value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: {
							start: 0,
							end: 4,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].offsetToAsOf.start` must be >= 1');
			});

			test('invalid end value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: {
							start: 1,
							end: 1000001,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].offsetToAsOf.end` must be <= 1000000');
			});

			test('start value after end value should throw exception', () => {
				const input = getValidRisking();

				input.shutIn.rows = [
					{
						phase: 'all',
						multiplier: 1,
						repeatRangeOfDates: 'no_repeat',
						totalOccurrences: 1,
						unit: 'day',
						scalePostShutInEndCriteria: 'econ_limit',
						scalePostShutInEnd: ' ',
						capex: true,
						fixedExpense: true,
						offsetToAsOf: {
							start: 2,
							end: 1,
						},
					},
				];

				expect(() => parseApiRisking(input, 1)).toThrow('`shutIn.rows[0].offsetToAsOf.end` must be >= 2');
			});
		});
	});
});
