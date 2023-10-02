/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { MultipleValidationError } from '@src/api/v1/multi-error';

import { checkModelDuplicates, parseApiExpenses } from './validation';

function getValidExpensesPayload(): Record<string, any> {
	return {
		name: 'test',
		unique: false,
		variableExpenses: {
			oil: {
				gathering: {
					shrinkageCondition: 'shrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					cap: 25,
					dealTerms: 23,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				marketing: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					cap: 258,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				transportation: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				processing: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				other: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
			},
			gas: {
				gathering: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerMcf: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				marketing: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerMcf: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				transportation: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerMcf: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				processing: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerMcf: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				other: {
					shrinkageCondition: 'unshrunk',
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerMcf: 0,
							entireWellLife: 'Flat',
						},
					],
				},
			},
			ngl: {
				gathering: {
					description: 'lol',
					escalationModel: '642f2f56670d176d8558ef7b',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: true,
					deductBeforeAdValTax: true,
					dealTerms: 32,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							pctOfOilRev: 23,
							totalFluidRate: 23,
						},
						{
							pctOfOilRev: 23,
							totalFluidRate: 25,
						},
					],
				},
				marketing: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				transportation: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				processing: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				other: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
			},
			dripCondensate: {
				gathering: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				marketing: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				transportation: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				processing: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
				other: {
					description: '',
					escalationModel: 'none',
					calculation: 'wi',
					affectEconLimit: true,
					deductBeforeSeveranceTax: false,
					deductBeforeAdValTax: false,
					dealTerms: 1,
					rateType: 'gross_well_head',
					rowsCalculationMethod: 'non_monotonic',
					rows: [
						{
							dollarPerBbl: 0,
							entireWellLife: 'Flat',
						},
					],
				},
			},
		},
		fixedExpenses: {
			monthlyWellCost: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 2,
					},
				],
			},
			otherMonthlyCost1: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 2,
					},
				],
			},
			otherMonthlyCost2: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost3: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost4: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost5: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost6: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost7: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
			otherMonthlyCost8: {
				stopAtEconLimit: true,
				expenseBeforeFpd: false,
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				cap: 78,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						fixedExpense: 0,
					},
				],
			},
		},
		waterDisposal: {
			escalationModel: 'none',
			calculation: 'wi',
			description: '',
			affectEconLimit: true,
			deductBeforeSeveranceTax: false,
			deductBeforeAdValTax: false,
			cap: 52,
			dealTerms: 1,
			rateType: 'gross_well_head',
			rowsCalculationMethod: 'non_monotonic',
			rows: [
				{
					dollarPerBbl: 0,
					entireWellLife: 'Flat',
				},
			],
		},
		carbonExpenses: {
			category: 'ch4',
			ch4: {
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				cap: 36,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						carbonExpense: 0,
					},
				],
			},
			co2: {
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						carbonExpense: 0,
					},
				],
			},
			co2E: {
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						carbonExpense: 0,
					},
				],
			},
			n2O: {
				description: '',
				escalationModel: 'none',
				calculation: 'wi',
				affectEconLimit: true,
				deductBeforeSeveranceTax: false,
				deductBeforeAdValTax: false,
				dealTerms: 1,
				rateType: 'gross_well_head',
				rowsCalculationMethod: 'non_monotonic',
				rows: [
					{
						entireWellLife: 'Flat',
						carbonExpense: 0,
					},
				],
			},
		},
	};
}

describe('v1/projects/econ-models/expenses/validation.test', () => {
	describe('parseApiExpenses expenses.variableExpenses', () => {
		it('should throw an RequiredFieldError if variableExpenses is not sent', () => {
			const input = getValidExpensesPayload();

			delete input.variableExpenses;
			expect(() => parseApiExpenses(input)).toThrow('Missing required field: `variableExpenses`');
		});

		it('should throw an RequestStructureError if variableExpenses is not an object', () => {
			const input = getValidExpensesPayload();

			input.variableExpenses = 'invalid';
			expect(() => parseApiExpenses(input)).toThrow(
				'Invalid value for `variableExpenses`: `invalid`. `variableExpenses` must be an object.',
			);
		});

		describe('expenses.variableExpenses', () => {
			describe('expenses.variableExpenses.oil', () => {
				it('should throw an RequiredFieldError if variableExpenses.oil is not sent', () => {
					const input = getValidExpensesPayload();
					const phase = 'oil';

					delete input.variableExpenses[phase];
					expect(() => parseApiExpenses(input)).toThrow(
						'Missing required field: `variableExpenses.' + phase + '`',
					);
				});

				it('should throw an RequestStructureError if variableExpenses.oil is not an object', () => {
					const input = getValidExpensesPayload();
					const phase = 'oil';
					input.variableExpenses[phase] = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `' + phase + '`: `invalid`. `' + phase + '` must be an object.',
					);
				});
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'oil gathering, marketing, transportation, processing and other expenses throw error if they are not objects',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'oil';
						input.variableExpenses[phase]![expense] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'Invalid value for `' + expense + '`: `invalid`. `' + expense + '` must be an object.',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'oil gathering, marketing, transportation, processing and other expenses throw error if not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'oil';

						delete input.variableExpenses[phase]![expense];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' + phase + '.' + expense + '`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'oil gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'oil';
						delete input.variableExpenses[phase]![expense]['shrinkageCondition'];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' +
								phase +
								'.' +
								expense +
								'.shrinkageCondition`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'oil gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is not unshrunk or shrunk',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'oil';

						input.variableExpenses[phase]![expense]['shrinkageCondition'] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'`variableExpenses.' +
								phase +
								'.' +
								expense +
								'.shrinkageCondition`' +
								' must be one of the following values: unshrunk, shrunk',
						);
					},
				);
			});
			describe('expenses.variableExpenses.gas', () => {
				it('should throw an RequiredFieldError if variableExpenses.gas is not sent', () => {
					const input = getValidExpensesPayload();
					const phase = 'gas';

					delete input.variableExpenses[phase];
					expect(() => parseApiExpenses(input)).toThrow(
						'Missing required field: `variableExpenses.' + phase + '`',
					);
				});

				it('should throw an RequestStructureError if variableExpenses.gas is not an object', () => {
					const input = getValidExpensesPayload();
					const phase = 'gas';
					input.variableExpenses[phase] = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `' + phase + '`: `invalid`. `' + phase + '` must be an object.',
					);
				});
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'gas gathering, marketing, transportation, processing and other expenses throw error if they are not objects',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'gas';
						input.variableExpenses[phase]![expense] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'Invalid value for `' + expense + '`: `invalid`. `' + expense + '` must be an object.',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'gas gathering, marketing, transportation, processing and other expenses throw error if not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'gas';

						delete input.variableExpenses[phase]![expense];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' + phase + '.' + expense + '`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'gas gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'gas';

						delete input.variableExpenses[phase]![expense]['shrinkageCondition'];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' +
								phase +
								'.' +
								expense +
								'.shrinkageCondition`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'gas gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is not unshrunk or shrunk',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'gas';

						input.variableExpenses[phase]![expense]['shrinkageCondition'] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'`variableExpenses.' +
								phase +
								'.' +
								expense +
								'.shrinkageCondition`' +
								' must be one of the following values: unshrunk, shrunk',
						);
					},
				);
			});
			describe('expenses.variableExpenses.ngl', () => {
				it('should throw an RequiredFieldError if variableExpenses.ngl is not sent', () => {
					const input = getValidExpensesPayload();
					const phase = 'ngl';

					delete input.variableExpenses[phase];
					expect(() => parseApiExpenses(input)).toThrow(
						'Missing required field: `variableExpenses.' + phase + '`',
					);
				});

				it('should throw an RequestStructureError if variableExpenses.ngl is not an object', () => {
					const input = getValidExpensesPayload();
					const phase = 'ngl';
					input.variableExpenses[phase] = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `' + phase + '`: `invalid`. `' + phase + '` must be an object.',
					);
				});
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'ngl gathering, marketing, transportation, processing and other expenses throw error if they are not objects',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'ngl';
						input.variableExpenses[phase]![expense] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'Invalid value for `' + expense + '`: `invalid`. `' + expense + '` must be an object.',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'ngl gathering, marketing, transportation, processing and other expenses throw error if not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'ngl';

						delete input.variableExpenses[phase]![expense];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' + phase + '.' + expense + '`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'ngl gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'ngl';

						input.variableExpenses[phase]![expense]['shrinkageCondition'] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow('`shrinkageCondition` is not a valid field name');
					},
				);
			});
			describe('expenses.variableExpenses.dripCondensate', () => {
				it('should throw an RequiredFieldError if variableExpenses.dripCondensate is not sent', () => {
					const input = getValidExpensesPayload();
					const phase = 'dripCondensate';

					delete input.variableExpenses[phase];
					expect(() => parseApiExpenses(input)).toThrow(
						'Missing required field: `variableExpenses.' + phase + '`',
					);
				});

				it('should throw an RequestStructureError if variableExpenses.dripCondensate is not an object', () => {
					const input = getValidExpensesPayload();
					const phase = 'dripCondensate';
					input.variableExpenses[phase] = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `' + phase + '`: `invalid`. `' + phase + '` must be an object.',
					);
				});
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'dripCondensate gathering, marketing, transportation, processing and other expenses throw error if they are not objects',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'dripCondensate';
						input.variableExpenses[phase]![expense] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow(
							'Invalid value for `' + expense + '`: `invalid`. `' + expense + '` must be an object.',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'dripCondensate gathering, marketing, transportation, processing and other expenses throw error if not sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'dripCondensate';

						delete input.variableExpenses[phase]![expense];
						expect(() => parseApiExpenses(input)).toThrow(
							'Missing required field: `variableExpenses.' + phase + '.' + expense + '`',
						);
					},
				);
				it.each([['gathering'], ['marketing'], ['transportation'], ['processing'], ['other']])(
					'dripCondensate gathering, marketing, transportation, processing and other expenses throw error if shrinkageCondition is sent',
					(expense: string) => {
						const input = getValidExpensesPayload();
						const phase = 'dripCondensate';
						input.variableExpenses[phase]![expense]['shrinkageCondition'] = 'invalid';
						expect(() => parseApiExpenses(input)).toThrow('`shrinkageCondition` is not a valid field name');
					},
				);
			});
		});
	});

	describe('parseApiExpenses expenses.fixedExpenses', () => {
		it('should throw an RequiredFieldError if fixedExpenses is not sent', () => {
			const input = getValidExpensesPayload();

			delete input.fixedExpenses;
			expect(() => parseApiExpenses(input)).toThrow('Missing required field: `fixedExpenses`');
		});

		it('should throw an RequestStructureError if fixedExpenses is not an object', () => {
			const input = getValidExpensesPayload();

			input.fixedExpenses = 'invalid';
			expect(() => parseApiExpenses(input)).toThrow(
				'Invalid value for `fixedExpenses`: `invalid`. `fixedExpenses` must be an object.',
			);
		});

		describe('expenses.fixedExpenses.monthlyWellCost', () => {
			it('should throw an RequestStructureError if fixedExpenses.monthlyWellCost is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.monthlyWellCost = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `monthlyWellCost`: `invalid`. `monthlyWellCost` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.monthlyWellCost is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.monthlyWellCost;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.monthlyWellCost`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.monthlyWellCost.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.monthlyWellCost.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.monthlyWellCost.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.monthlyWellCost.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.monthlyWellCost.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});

		describe('expenses.fixedExpenses.otherMonthlyCost1', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost1 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost1 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost1`: `invalid`. `otherMonthlyCost1` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost1 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost1;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost1`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost1.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost1.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost1.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost1.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost1.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});

		describe('expenses.fixedExpenses.otherMonthlyCost2', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost2 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost2 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost2`: `invalid`. `otherMonthlyCost2` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost2 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost2;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost2`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost2.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost2.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost2.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost2.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost2.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost3', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost3 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost3 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost3`: `invalid`. `otherMonthlyCost3` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost3 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost3;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost3`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost3.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost3.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost3.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost3.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost3.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost4', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost4 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost4 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost4`: `invalid`. `otherMonthlyCost4` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost4 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost4;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost4`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost4.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost4.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost4.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost4.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost4.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost5', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost5 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost5 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost5`: `invalid`. `otherMonthlyCost5` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost5 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost5;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost5`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost5.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost5.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost5.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost5.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost5.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost6', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost6 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost6 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost6`: `invalid`. `otherMonthlyCost6` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost6 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost6;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost6`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost6.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost6.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost6.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost6.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost6.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost7', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost7 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost7 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost7`: `invalid`. `otherMonthlyCost7` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost7 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost7;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost7`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost7.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost7.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost7.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost7.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost7.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
		describe('expenses.fixedExpenses.otherMonthlyCost8', () => {
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost8 is not an object', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost8 = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `otherMonthlyCost8`: `invalid`. `otherMonthlyCost8` must be an object.',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost8 is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost8;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost8`',
				);
			});
			it('should throw an RequiredFieldError if fixedExpenses.otherMonthlyCost8.expenseBeforeFpd is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.fixedExpenses.otherMonthlyCost8.expenseBeforeFpd;
				expect(() => parseApiExpenses(input)).toThrow(
					'Missing required field: `fixedExpenses.otherMonthlyCost8.expenseBeforeFpd`',
				);
			});
			it('should throw an RequestStructureError if fixedExpenses.otherMonthlyCost8.expenseBeforeFpd is not a valid Boolean', () => {
				const input = getValidExpensesPayload();

				input.fixedExpenses.otherMonthlyCost8.expenseBeforeFpd = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow('invalid` is not a valid Boolean');
			});
		});
	});

	describe('parseApiExpenses expenses.waterDisposal', () => {
		it('should throw an RequiredFieldError if waterDisposal is not sent', () => {
			const input = getValidExpensesPayload();

			delete input.waterDisposal;
			expect(() => parseApiExpenses(input)).toThrow('Missing required field: `waterDisposal`');
		});

		it('should throw an RequestStructureError if waterDisposal is not an object', () => {
			const input = getValidExpensesPayload();

			input.waterDisposal = 'invalid';
			expect(() => parseApiExpenses(input)).toThrow(
				'Invalid value for `waterDisposal`: `invalid`. `waterDisposal` must be an object.',
			);
		});
		describe('base expense fields', () => {
			it('description should throw a TypeError if escalationModel is not string', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.description = 123;
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a string');
			});
			it('escalationModel should throw a TypeError if escalationModel is not `none` or `objectId`', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.escalationModel = '123';
				expect(() => parseApiExpenses(input)).toThrow(
					"If Escalation Model is provided it must be either 'none' or a valid Object Id",
				);
			});
			it('calculation should throw a TypeError if calculation is not valid enum value', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.calculation = '123';
				expect(() => parseApiExpenses(input)).toThrow(
					'`waterDisposal.calculation` must be one of the following values: wi, nri, lease_nri, one_minus_wi, one_minus_nri, wi_minus_one, nri_minus_one, one_minus_lease_nri, lease_nri_minus_one, 100_pct_wi',
				);
			});
			it('affectEconLimit should throw a TypeError if affectEconLimit is not boolean', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.affectEconLimit = '123';
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a valid Boolean');
			});
			it('deductBeforeSeveranceTax should throw a TypeError if deductBeforeSeveranceTax is not boolean', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.deductBeforeSeveranceTax = '123';
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a valid Boolean');
			});
			it('deductBeforeAdValTax should throw a TypeError if deductBeforeAdValTax is not boolean', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.deductBeforeAdValTax = '123';
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a valid Boolean');
			});
			it('dealTerms should throw a TypeError if dealTerms is not number', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.dealTerms = '123';
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a valid number');
			});

			it('rateType should throw a TypeError if rateType is not a valid enum value', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.rateType = '123';
				expect(() => parseApiExpenses(input)).toThrow(
					'`waterDisposal.rateType` must be one of the following values: gross_well_head, gross_sales, net_sales',
				);
			});
			it('rowsCalculationMethod should throw a TypeError if rowsCalculationMethod is not a valid enum value', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.rowsCalculationMethod = '123';
				expect(() => parseApiExpenses(input)).toThrow(
					'`waterDisposal.rowsCalculationMethod` must be one of the following values: monotonic, non_monotonic',
				);
			});
			it('cap should throw a TypeError if cap  is not a number value', () => {
				const input = getValidExpensesPayload();

				input.waterDisposal.cap = '123';
				expect(() => parseApiExpenses(input)).toThrow('`123` is not a valid number');
			});
		});

		describe('parseApiExpenses expenses.carbonExpenses', () => {
			it('should throw an RequiredFieldError if carbonExpenses is not sent', () => {
				const input = getValidExpensesPayload();

				delete input.carbonExpenses;
				expect(() => parseApiExpenses(input)).toThrow('Missing required field: `carbonExpenses`');
			});

			it('should throw an RequestStructureError if carbonExpenses is not an object', () => {
				const input = getValidExpensesPayload();

				input.carbonExpenses = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'Invalid value for `carbonExpenses`: `invalid`. `carbonExpenses` must be an object.',
				);
			});
			it('should throw an RequestStructureError if carbonExpenses.category is not an enum valid value', () => {
				const input = getValidExpensesPayload();

				input.carbonExpenses.category = 'invalid';
				expect(() => parseApiExpenses(input)).toThrow(
					'`carbonExpenses.category` must be one of the following values: co2e, co2, ch4, n2o',
				);
			});

			describe('expenses.carbonExpenses.ch4', () => {
				it('should throw an RequestStructureError if expenses.carbonExpenses.ch4 is not an object', () => {
					const input = getValidExpensesPayload();

					input.carbonExpenses.ch4 = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `ch4`: `invalid`. `ch4` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if expenses.carbonExpenses.ch4 is not sent', () => {
					const input = getValidExpensesPayload();

					delete input.carbonExpenses.ch4;
					expect(() => parseApiExpenses(input)).toThrow('Missing required field: `carbonExpenses.ch4`');
				});
			});
			describe('expenses.carbonExpenses.co2', () => {
				it('should throw an RequestStructureError if expenses.carbonExpenses.co2 is not an object', () => {
					const input = getValidExpensesPayload();

					input.carbonExpenses.co2 = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `co2`: `invalid`. `co2` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if expenses.carbonExpenses.co2 is not sent', () => {
					const input = getValidExpensesPayload();

					delete input.carbonExpenses.co2;
					expect(() => parseApiExpenses(input)).toThrow('Missing required field: `carbonExpenses.co2`');
				});
			});
			describe('expenses.carbonExpenses.co2E', () => {
				it('should throw an RequestStructureError if expenses.carbonExpenses.co2E is not an object', () => {
					const input = getValidExpensesPayload();

					input.carbonExpenses.co2E = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `co2E`: `invalid`. `co2E` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if expenses.carbonExpenses.co2E is not sent', () => {
					const input = getValidExpensesPayload();

					delete input.carbonExpenses.co2E;
					expect(() => parseApiExpenses(input)).toThrow('Missing required field: `carbonExpenses.co2E`');
				});
			});
			describe('expenses.carbonExpenses.n2O', () => {
				it('should throw an RequestStructureError if expenses.carbonExpenses.n2O is not an object', () => {
					const input = getValidExpensesPayload();

					input.carbonExpenses.n2O = 'invalid';
					expect(() => parseApiExpenses(input)).toThrow(
						'Invalid value for `n2O`: `invalid`. `n2O` must be an object.',
					);
				});
				it('should throw an RequiredFieldError if expenses.carbonExpenses.n2O is not sent', () => {
					const input = getValidExpensesPayload();

					delete input.carbonExpenses.n2O;
					expect(() => parseApiExpenses(input)).toThrow('Missing required field: `carbonExpenses.n2O`');
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
});
