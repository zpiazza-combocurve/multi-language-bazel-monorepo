import _ from 'lodash';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';

import { Placeholder } from '@/components';
import EconModel from '@/cost-model/detail-components/EconModel';
import { useAlfa } from '@/helpers/alfa';
import { getApi } from '@/helpers/routing';
import { AssumptionKey } from '@/inpt-shared/constants';

import { CarbonExpenses } from './CarbonExpenses';
import { FixedExpenses } from './fixed_expenses';
import { VariableExpenses } from './variable_expenses';
import { WaterDisposal } from './water_disposal';

const TABLE_KEYS = [
	'var_exp_phase_select_sheet',
	'var_exp_category_select_sheet',
	'var_exp_gathering_sheet',
	'var_exp_processing_sheet',
	'var_exp_transportation_sheet',
	'var_exp_marketing_sheet',
	'var_exp_other_sheet',
	'fixed_exp_category_select_sheet',
	'fixed_exp_monthly_well_cost_sheet',
	'fixed_exp_other_monthly_cost_1_sheet',
	'fixed_exp_other_monthly_cost_2_sheet',
	'water_disposal_expenses_sheet',
];

const TEMPLATE_QUERY_KEY = 'expenses-display-template';

const stateIsEqual = (a, b) => {
	// Current dropdowns selection, changing them shouldn't count as a change
	const propsToIgnore = ['variable_expenses.category', 'variable_expenses.phase', 'fixed_expenses.category'];

	// Compare options ignoring some props
	const optionsA = _.omit(a?.options, propsToIgnore);
	const optionsB = _.omit(b?.options, propsToIgnore);

	return _.isEqual(optionsA, optionsB);
};

export default function ExpensesStandardView(props) {
	const { project } = useAlfa();
	const queryClient = useQueryClient();
	const dtQuery = useQuery([TEMPLATE_QUERY_KEY], () =>
		getApi(`/cost-model/getExtendedTemplate/${project?._id}/expenses`)
	);

	const invalidateModelTemplateQuery = useCallback(() => {
		queryClient.invalidateQueries([TEMPLATE_QUERY_KEY]);
	}, [queryClient]);

	if (dtQuery.isLoading) {
		return <Placeholder loading text='Preparing expenses module' />;
	}

	const {
		template: { fields: templateFields },
	} = dtQuery.data;

	return (
		<EconModel
			{...props}
			stateIsEqual={stateIsEqual}
			assumptionKey={AssumptionKey.expenses}
			assumptionName='Expenses'
			templateFields={templateFields}
			tableKeys={TABLE_KEYS}
			className='expenses'
			header='Expenses'
			tablesContainerClassName='flowing'
			invalidateModelTemplateQuery={invalidateModelTemplateQuery}
			fetchingModelTemplate={dtQuery.isFetching}
		>
			{({
				options: { variable_expenses, fixed_expenses, water_disposal, carbon_expenses },
				fields,
				handleOptionChange,
				selected,
				onSelect,
			}) => (
				<>
					{variable_expenses && (
						<VariableExpenses
							onSelect={onSelect}
							selected={selected}
							variable_expenses={variable_expenses}
							fields={fields.variable_expenses}
							setVariableExpenses={handleOptionChange}
							categoryChoice={((variable_expenses || {}).category || {}).value}
						/>
					)}
					{water_disposal && (
						<WaterDisposal
							onSelect={onSelect}
							selected={selected}
							water_disposal={water_disposal}
							fields={fields.water_disposal}
							setWaterDisposal={handleOptionChange}
						/>
					)}
					{fixed_expenses && (
						<FixedExpenses
							onSelect={onSelect}
							selected={selected}
							fixed_expenses={fixed_expenses}
							fields={fields.fixed_expenses}
							setFixedExpenses={handleOptionChange}
						/>
					)}
					{carbon_expenses && (
						<CarbonExpenses
							onSelect={onSelect}
							selected={selected}
							carbon_expenses={carbon_expenses}
							fields={fields.carbon_expenses}
							setCarbonExpenses={handleOptionChange}
						/>
					)}
				</>
			)}
		</EconModel>
	);
}
