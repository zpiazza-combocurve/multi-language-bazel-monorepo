import { fields as template } from '@/inpt-shared/display-templates/cost-model-dialog/expenses.json';

import { labelToValueExpensesPOJO } from './parser';

describe('label to value', () => {
	test('rate keys are empty for non-rate criteria', () => {
		expect(
			labelToValueExpensesPOJO(
				{
					key: 'Fixed Expenses',
					category: '',
					criteria: 'Flat',
					rate_type: 'Gross Well Head',
					period: 'Flat',
					value: '1',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				} as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				template as any
			)
		).toMatchObject({
			key: 'fixed_expenses',
			category: '',
			criteria: 'entire_well_life',
			rate_type: '',
			period: 'Flat',
			value: 1,
		});
	});

	test('rate keys are not empty for rate criteria', () => {
		expect(
			labelToValueExpensesPOJO(
				{
					key: 'Fixed Expenses',
					category: '',
					criteria: 'Oil Rate',
					rate_type: 'Gross Well Head',
					period: 'Flat',
					value: '1',
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				} as any,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				template as any
			)
		).toMatchObject({
			key: 'fixed_expenses',
			category: '',
			criteria: 'oil_rate',
			rate_type: 'gross_well_head',
			period: 'Flat',
			value: 1,
		});
	});

	describe('fixed_expenses', () => {
		const from = {
			value: '1',
			period: 'Flat',
			affect_econ_limit: 'No',
			calculation: 'NRI',
			cap: '5',
			category: '',
			criteria: 'Flat',
			deal_terms: '1',
			deduct_before_ad_val_tax: 'No',
			deduct_before_severance_tax: 'Yes',
			description: 'Description',
			escalation_model: '',
			expense_before_fpd: 'No',
			key: 'Fixed Expenses',
			rate_type: 'Gross Well Head',
			rows_calculation_method: 'Non Monotonic',
			shrinkage_condition: 'Shrunk',
			stop_at_econ_limit: 'No',
			unit: '$/BBL',
		};

		const to = {
			groupKey: 'fixed_expenses',
			cap: 5,
			deal_terms: 1,
			affect_econ_limit: 'no',
			calculation: 'nri',
			escalation_model: '',
			category: '',
			criteria: 'entire_well_life',
			deduct_before_ad_val_tax: 'no',
			deduct_before_severance_tax: 'yes',
			description: 'Description',
			expense_before_fpd: 'no',
			key: 'fixed_expenses',
			rate_type: '',
			rows_calculation_method: '',
			shrinkage_condition: '',
			stop_at_econ_limit: 'no',
			unit: 'dollar_per_bbl',
			value: 1,
			period: 'Flat',
		};
		test('works', () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			expect(labelToValueExpensesPOJO(from as any, template as any)).toEqual(to);
		});
	});

	describe('variable_expenses', () => {
		test('works', () => {
			const from = {
				value: '1',
				period: 'Flat',
				affect_econ_limit: 'No',
				calculation: 'NRI',
				cap: '5',
				category: 'G & P',
				criteria: 'Flat',
				deal_terms: '1',
				deduct_before_ad_val_tax: 'No',
				deduct_before_severance_tax: 'Yes',
				description: 'Description',
				escalation_model: '',
				expense_before_fpd: 'No',
				key: 'Oil',
				rate_type: 'Gross Well Head',
				rows_calculation_method: 'Non Monotonic',
				shrinkage_condition: 'Shrunk',
				stop_at_econ_limit: 'No',
				unit: '$/BBL',
			};
			const to = {
				groupKey: 'variable_expenses',
				cap: 5,
				deal_terms: 1,
				affect_econ_limit: 'no',
				calculation: 'nri',
				escalation_model: '',
				category: 'gathering',
				criteria: 'entire_well_life',
				deduct_before_ad_val_tax: 'no',
				deduct_before_severance_tax: 'yes',
				description: 'Description',
				expense_before_fpd: '',
				key: 'oil',
				rate_type: '',
				rows_calculation_method: '',
				shrinkage_condition: 'shrunk',
				stop_at_econ_limit: '',
				unit: 'dollar_per_bbl',
				value: 1,
				period: 'Flat',
			};
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			expect(labelToValueExpensesPOJO(from as any, template as any)).toEqual(to);
		});
	});
});
