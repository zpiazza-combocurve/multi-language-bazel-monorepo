/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MultipleValidationError } from '@src/api/v1/multi-error';
import { RequiredFieldError } from '@src/helpers/validation';

import { checkModelDuplicates, parseApiDepreciation } from './validation';

const getValidDepreciationPayload = (): Record<string, any> => ({
	name: 'rest api test',
	unique: false,
	depreciation: {
		modelType: 'depreciation',
		taxCredit: 30,
		tcjaBonus: true,
		bonusDepreciation: [
			{
				tangibleBonusDepreciation: 0,
				intangibleBonusDepreciation: 4,
			},
		],
		depreciation: [
			{
				tanFactor: 3,
				intanFactor: 3,
			},
			{
				tanFactor: 3,
				intanFactor: 3,
			},
		],
	},
});

const getValidDepletionPayload = (): Record<string, any> => ({
	name: 'rest-api-test',
	unique: false,
	depreciation: {
		modelType: 'depletion',
		tangibleImmediateDepletion: 45,
		intangibleImmediateDepletion: 98,
		tangibleDepletionModel: 'unit_of_production_major',
		intangibleDepletionModel: 'fpd',
	},
});

describe('v1/projects/econ-models/depreciation/validation.test', () => {
	describe('parseApiDepreciation depreciation', () => {
		it('should throw an RequiredFieldError if depreciation is not sent', () => {
			const input = getValidDepreciationPayload();

			delete input.depreciation;
			expect(() => parseApiDepreciation(input)).toThrow('Missing required field: `depreciation`');
		});

		it('should throw an RequestStructureError if depreciation is not an object', () => {
			const input = getValidDepreciationPayload();

			input.depreciation = 'invalid';
			expect(() => parseApiDepreciation(input)).toThrow(
				'Invalid value for `depreciation`: `invalid`. `depreciation` must be an object.',
			);
		});

		it('should throw an RequiredFieldError if depreciation.modelType is not sent', () => {
			const input = getValidDepreciationPayload();

			delete input.depreciation.modelType;
			expect(() => parseApiDepreciation(input)).toThrow('Missing required field: `depreciation.modelType`');
		});

		it('should throw an RequestStructureError if depreciation.modelType is not an string', () => {
			const input = getValidDepreciationPayload();

			input.depreciation.modelType = 'invalid';
			expect(() => parseApiDepreciation(input)).toThrow(
				'`depreciation.modelType` must be one of the following values: depreciation, depletion',
			);
		});
		describe('parseApiDepreciation depreciation.modelType = depreciation', () => {
			it('should throw an FieldNameError if an unknown field is not sent', () => {
				const input = getValidDepletionPayload();

				input.depreciation.test = 'test';
				expect(() => parseApiDepreciation(input)).toThrow('`test` is not a valid field name');
			});
			describe('depreciation.taxCredit', () => {
				it('should throw an RequiredFieldError if depreciation.taxCredit is not sent', () => {
					const input = getValidDepreciationPayload();

					delete input.depreciation.taxCredit;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.taxCredit`',
					);
				});

				it('should throw an RequestStructureError if depreciation.taxCredit is not an number', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.taxCredit = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid number');
				});
			});

			describe('depreciation.tcjaBonus', () => {
				it('should throw an RequiredFieldError if depreciation.tcjaBonus is not sent', () => {
					const input = getValidDepreciationPayload();

					delete input.depreciation.tcjaBonus;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.tcjaBonus`',
					);
				});

				it('should throw an RequestStructureError if depreciation.tcjaBonus is not an number', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.tcjaBonus = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid Boolean');
				});
			});
			describe('depreciation.bonusDepreciation', () => {
				it('should throw an RequiredFieldError if depreciation.bonusDepreciation is not sent', () => {
					const input = getValidDepreciationPayload();

					delete input.depreciation.bonusDepreciation;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.bonusDepreciation`',
					);
				});

				it('should throw an ValidationError if depreciation.bonusDepreciation is not an number', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.bonusDepreciation = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid array');
				});

				it('should throw an ValidationError if depreciation.bonusDepreciation item is not object', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.bonusDepreciation[0] = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow(
						'Invalid value for `0`: `invalid`. `0` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if depreciation.bonusDepreciation item is empty', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.bonusDepreciation[0] = {};
					const errors = [
						new RequiredFieldError(
							'Missing required field: `depreciation.bonusDepreciation.0.tangibleBonusDepreciation`',
						),
						new RequiredFieldError(
							'Missing required field: `depreciation.bonusDepreciation.0.intangibleBonusDepreciation`',
						),
					];

					expect(() => parseApiDepreciation(input, 1)).toThrow(new MultipleValidationError(errors));
				});
				it('should throw an RequiredFieldError if depreciation.bonusDepreciation item has unknown properties', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.bonusDepreciation[0].test = {};

					expect(() => parseApiDepreciation(input, 1)).toThrow('`test` is not a valid field name');
				});
				it('should throw an ValidationError if depreciation.bonusDepreciation has more than 1 item', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.bonusDepreciation[1] = input.depreciation.bonusDepreciation[0];
					expect(() => parseApiDepreciation(input)).toThrow('must NOT have more than 1 items');
				});
			});
			describe('depreciation.depreciation', () => {
				it('should throw an RequiredFieldError if depreciation.depreciation is not sent', () => {
					const input = getValidDepreciationPayload();

					delete input.depreciation.depreciation;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.depreciation`',
					);
				});

				it('should throw an ValidationError if depreciation.depreciation is not an number', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.depreciation = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid array');
				});

				it('should throw an ValidationError if depreciation.depreciation item is not object', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.depreciation[0] = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow(
						'Invalid value for `0`: `invalid`. `0` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if depreciation.depreciation item is empty', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.depreciation[0] = {};
					const errors = [
						new RequiredFieldError('Missing required field: `depreciation.depreciation.0.tanFactor`'),
						new RequiredFieldError('Missing required field: `depreciation.depreciation.0.intanFactor`'),
					];

					expect(() => parseApiDepreciation(input, 1)).toThrow(new MultipleValidationError(errors));
				});
				it('should throw an RequiredFieldError if depreciation.depreciation item has unknown properties', () => {
					const input = getValidDepreciationPayload();

					input.depreciation.depreciation[0].test = {};

					expect(() => parseApiDepreciation(input, 1)).toThrow('`test` is not a valid field name');
				});
			});
		});

		describe('parseApiDepreciation depreciation.modelType = depletion', () => {
			it('should throw an FieldNameError if an unknown field is not sent', () => {
				const input = getValidDepletionPayload();

				input.depreciation.test = 'test';
				expect(() => parseApiDepreciation(input)).toThrow('`test` is not a valid field name');
			});
			describe('depreciation.tangibleImmediateDepletion', () => {
				it('should throw an RequiredFieldError if depreciation.tangibleImmediateDepletion is not sent', () => {
					const input = getValidDepletionPayload();

					delete input.depreciation.tangibleImmediateDepletion;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.tangibleImmediateDepletion`',
					);
				});

				it('should throw an RequestStructureError if depreciation.tangibleImmediateDepletion is not an number', () => {
					const input = getValidDepletionPayload();

					input.depreciation.tangibleImmediateDepletion = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid number');
				});
			});
			describe('depreciation.intangibleImmediateDepletion', () => {
				it('should throw an RequiredFieldError if depreciation.intangibleImmediateDepletion is not sent', () => {
					const input = getValidDepletionPayload();

					delete input.depreciation.intangibleImmediateDepletion;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.intangibleImmediateDepletion`',
					);
				});

				it('should throw an RequestStructureError if depreciation.intangibleImmediateDepletion is not an number', () => {
					const input = getValidDepletionPayload();

					input.depreciation.intangibleImmediateDepletion = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow('`invalid` is not a valid number');
				});
			});
			describe('depreciation.tangibleDepletionModel', () => {
				it('should throw an RequiredFieldError if depreciation.tangibleDepletionModel is not sent', () => {
					const input = getValidDepletionPayload();

					delete input.depreciation.tangibleDepletionModel;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.tangibleDepletionModel`',
					);
				});

				it('should throw an RequestStructureError if depreciation.tangibleDepletionModel is not an enum', () => {
					const input = getValidDepletionPayload();

					input.depreciation.tangibleDepletionModel = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow(
						'`depreciation.tangibleDepletionModel` must be one of the following values: unit_of_production_major, unit_of_production_BOE, ecl, fpd, never',
					);
				});
			});
			describe('depreciation.intangibleDepletionModel', () => {
				it('should throw an RequiredFieldError if depreciation.intangibleDepletionModel is not sent', () => {
					const input = getValidDepletionPayload();

					delete input.depreciation.intangibleDepletionModel;
					expect(() => parseApiDepreciation(input)).toThrow(
						'Missing required field: `depreciation.intangibleDepletionModel`',
					);
				});

				it('should throw an RequestStructureError if depreciation.intangibleDepletionModel is not an enum', () => {
					const input = getValidDepletionPayload();

					input.depreciation.intangibleDepletionModel = 'invalid';
					expect(() => parseApiDepreciation(input)).toThrow(
						'`depreciation.intangibleDepletionModel` must be one of the following values: unit_of_production_major, unit_of_production_BOE, ecl, fpd, never',
					);
				});
			});
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
