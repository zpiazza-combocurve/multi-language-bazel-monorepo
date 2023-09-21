import { omit } from 'lodash';

import { RATE_COLUMNS } from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/constants';
import {
	getDefaultUnit,
	getExtraValue,
	getGroupKey,
	getTemplateCategory,
} from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/shared';
import { assert } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';

export const getUnitValueOrDefaultForKey = (unitLabel, key) =>
	getExtraValue('unit', unitLabel) ? getExtraValue('unit', unitLabel) : getDefaultUnit(key);

export const getRestRowObject = (key, category, rest, template) => {
	const result = {};
	const groupKey = getGroupKey(key);

	assert(groupKey);

	const templateCategory = getTemplateCategory(
		groupKey,
		key === 'fixed_expenses' ? 'monthly_well_cost' : key,
		category,
		template
	);

	const subItemsValues = omit(rest, ['value', 'period']);

	for (const key of Object.keys(omit(templateCategory, 'row_view'))) {
		let value =
			templateCategory[key]?.menuItems?.find(({ label }) => label === subItemsValues[key]) ??
			subItemsValues[key] ??
			templateCategory[key]?.Default ??
			(RATE_COLUMNS.includes(key) ? 0 : '');

		value = value?.label ? value.value : value;

		result[key] = templateCategory[key]?.fieldType === FieldType.number && value !== '' ? Number(value) : value;
	}

	return result;
};
