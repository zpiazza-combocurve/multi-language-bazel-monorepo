import _ from 'lodash';
import { useMemo } from 'react';
import * as yup from 'yup';

import { getELTLineCellPlaceholderSchema, getEltColumnValidation } from '@/components/AdvancedTable/schemaValidation';
import { getPeriodSchema } from '@/components/AdvancedTable/sharedSchemas';
import {
	concatenateKeyCategory,
	mapTemplateFieldToYup,
	toLowerCaseTransform,
	useTemplateQuery,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { arrayToRecord, assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import {
	fields as DEFAULT_EXPENSES_TEMPLATE,
	extra as EXTRA_EXPENSES_TEMPLATE_DATA,
} from '@/inpt-shared/display-templates/cost-model-dialog/expenses.json';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';

import { ALL_COLUMNS, COLUMN_LABELS_WITHOUT_SHRINKAGE_CONDITION, RATE_KEYS, RATE_LABELS } from './constants';
import {
	ALL_KEY_CATEGORIES,
	CARBON_KEY,
	EXPENSES_TEMPLATE_QUERY_KEY,
	ExpensesTemplate,
	VARIABLE_EXPENSES_PHASES,
	getColumnLabel,
	getExpensesTable,
	getExtraLabel,
	getExtraValue,
} from './shared';

export const KEYS = EXTRA_EXPENSES_TEMPLATE_DATA.key.menuItems.map(({ label }) => label);
const CRITERIA = EXTRA_EXPENSES_TEMPLATE_DATA.criteria.menuItems.map(({ label }) => label);

const CATEGORY_TOOLTIPS = {
	'G & P': 'Gathering and Processing',
	OPC: 'Operating Cost',
	TRN: 'Transportation',
	MKT: 'Marketing Fees',
};

export const MAX_CATEGORY_COUNT = ALL_KEY_CATEGORIES.reduce((acc, value) => {
	const key = getExtraLabel('key', value.key);
	const category = getExtraLabel('category', value.category);
	const type = concatenateKeyCategory({ key, category });
	acc[type] = (acc[type] ?? 0) + 1;
	return acc;
}, {});

const getTemplateSchema = (template: ExpensesTemplate, field: string) => {
	const label = getColumnLabel(template, field);

	assert(label, 'Expected label for field', () => ({ field }));

	return yup
		.mixed()
		.when(
			['isELTRow', 'isFromELTDataLines', 'key', 'category'],
			([isELTRow, isFromELTDataLines, key, category], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row').label(label);
				}

				const table = getExpensesTable({ template, key, category });

				if (table) {
					return mapTemplateFieldToYup(table?.[field], isFromELTDataLines).label(label);
				}

				return schema.omitted('${path} cannot be used for chosen key/category').label(label);
			}
		);
};

export function getExpenseRowSchema(template: ExpensesTemplate, elts: ModuleListEmbeddedLookupTableItem[]) {
	const periodSchema = yup.object({
		period: getPeriodSchema({
			template,
			getTemplateField: getExpensesTable,
			rateCriterias: RATE_LABELS,
			label: getColumnLabel(template, 'period'),
		}),
	});

	const valuePeriodSchema = yup
		.object({
			value: yup
				.number()
				.when(
					['isELTRow', 'isFromELTDataLines', '$parentRow'],
					([isELTRow, isFromELTDataLines, $parentRow], schema) => {
						if (isELTRow) {
							return schema.omitted('${path} cannot be used for this row');
						}

						if (isFromELTDataLines) {
							return getELTLineCellPlaceholderSchema(schema);
						}

						return schema
							.typeError('Value must be a valid number')
							.optional()
							.test('value', (value, testContext) => {
								if (!$parentRow) {
									return true;
								}
								const { key, category, unit } = $parentRow;
								// get correct key and category if it is a time series row
								const table = getExpensesTable({ template, key, category });
								if (!table) {
									return true;
								}
								if (value == null) {
									return testContext.createError({ message: 'Value is required' });
								}
								if (key === 'Fixed Expenses') {
									const { max, min } = table.row_view.columns.fixed_expense;
									if (value > max) {
										return testContext.createError({ message: `Max value is ${max}` });
									}
									if (value < min) {
										return testContext.createError({ message: `Min value is ${min}` });
									}
									return true;
								}
								if (key === 'Carbon Expenses') {
									const { max, min } = table.row_view.columns.carbon_expense;
									if (value > max) {
										return testContext.createError({ message: `Max value is ${max}` });
									}
									if (value < min) {
										return testContext.createError({ message: `Min value is ${min}` });
									}
									return true;
								}

								const menuItem = table.row_view.columns.unit_cost?.menuItems.find(
									(menuItem) => menuItem.label === unit
								);
								if (!menuItem) {
									return true;
								}
								const { max, min } = menuItem;
								if (value > max) {
									return testContext.createError({ message: `Max value is ${max}` });
								}
								if (value < min) {
									return testContext.createError({ message: `Min value is ${min}` });
								}
								return true;
							});
					}
				)
				.label(getColumnLabel(template, 'value')),
		})
		.concat(periodSchema);

	const timeSeriesSchema = yup
		.object({
			...['key', 'unit', 'category', 'criteria', 'eltName', ...ALL_COLUMNS].reduce((acc, key) => {
				acc[key] = yup.string().omitted();
				return acc;
			}, {}),
		})
		.concat(valuePeriodSchema);

	const expensesRowSchema = yup
		.object({
			...getEltColumnValidation(elts),
			...arrayToRecord(ALL_COLUMNS, _.identity, (val) => getTemplateSchema(template, val)),

			key: yup
				.string()
				.when(
					['isELTRow', 'isFromELTDataLines', '$type', '$keyCategoryCount'],
					([isELTRow, isFromELTDataLines, type, keyCategoryCount], schema) => {
						if (isELTRow) {
							return schema.omitted('${path} cannot be used for this row');
						}

						return schema
							.required()
							.transform(toLowerCaseTransform(KEYS))
							.oneOf(KEYS)
							.meta({ template: EXTRA_EXPENSES_TEMPLATE_DATA.key })
							.test('unique-table', 'Too many key/category of the same type', (key, testContext) => {
								if (isFromELTDataLines) {
									return true;
								}
								const count = _.find(
									keyCategoryCount,
									(_value, key) => key.toLowerCase() === type.toLowerCase()
								);
								const max = _.find(
									MAX_CATEGORY_COUNT,
									(_value, key) => key.toLowerCase() === type.toLowerCase()
								);
								if (!max) {
									// if there's no entry for this pair it is an incorrect unexpected key/category pair
									return testContext.createError({ message: `Not a valid key/category pair` });
								}
								if (['Water Disposal', 'Fixed Expenses'].includes(key)) {
									return count <= max
										? true
										: testContext.createError({ message: `Can only be ${max} ${key}` });
								}
								return count <= max
									? true
									: testContext.createError({
											message: `Can only be ${max} of each key/category pair`,
									  });
							});
					}
				)
				.label(getColumnLabel(template, 'key')),

			category: yup
				.mixed()
				.when(['isELTRow', 'key'], ([isELTRow, keyLabel], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					const key = getExtraValue('key', keyLabel);

					if (VARIABLE_EXPENSES_PHASES.includes(key)) {
						const template = _.pick(DEFAULT_EXPENSES_TEMPLATE.variable_expenses.category, [
							'fieldName',
							'fieldType',
							'valType',
							'menuItems',
						]);

						return schema
							.meta({ template, tooltips: CATEGORY_TOOLTIPS })
							.transform(toLowerCaseTransform(_.map(template.menuItems, ({ label }) => label)))
							.oneOf(_.map(template.menuItems, ({ label }) => label));
					}
					if (CARBON_KEY === key) {
						const template = _.pick(DEFAULT_EXPENSES_TEMPLATE[key].category, [
							'fieldName',
							'fieldType',
							'valType',
							'menuItems',
						]);
						return schema
							.meta({ template, tooltips: CATEGORY_TOOLTIPS })
							.transform(toLowerCaseTransform(_.map(template.menuItems, ({ label }) => label)))
							.oneOf(_.map(template.menuItems, ({ label }) => label));
					}
					return schema.omitted('${path} cannot be used for chosen key');
				})
				.label(getColumnLabel(template, 'category')),

			criteria: yup
				.mixed()
				.when(['isELTRow', 'key', 'category'], ([isELTRow], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					return schema.required('Criteria is required').oneOf(CRITERIA);
				})
				.label(getColumnLabel(template, 'criteria')),

			...['rate_type', 'rows_calculation_method'].reduce((acc, field) => {
				const label = getColumnLabel(template, field);
				assert(label, 'Expected label for field', () => ({ field }));

				acc[field] = yup
					.mixed()
					.when(
						['isELTRow', 'isFromELTDataLines', 'key', 'category', 'criteria', '$parentRow'],
						([isELTRow, isFromELTDataLines, key, category, criteria, $parentRow], schema) => {
							if (isELTRow) {
								return schema.omitted(`${label} cannot be used for this row`);
							}

							const table = getExpensesTable({ template, key, category });

							const rateLabels = RATE_KEYS.map((rate) => getExtraLabel('criteria', rate));

							const parentFieldData = $parentRow?.[field];

							// checks to see if field value includes the field name (value for LT is `line{number}-{fieldname})`
							if (typeof parentFieldData === 'string' && parentFieldData?.includes(field)) {
								return schema.required().test((fieldValue, testContext) => {
									if (!rateLabels.includes(criteria)) {
										return testContext.createError({
											message: `${label} can only be used for rate criteria (${rateLabels.join(
												', '
											)})`,
										});
									}
									return true;
								});
							}

							if (rateLabels.includes(criteria)) {
								return mapTemplateFieldToYup(table?.[field], isFromELTDataLines).label(label);
							}

							return schema
								.omitted(`${label} can only be used for rate criteria (${rateLabels.join(', ')})`)
								.label(label);
						}
					);
				return acc;
			}, {}),

			unit: yup
				.mixed()
				.meta({ template: EXTRA_EXPENSES_TEMPLATE_DATA.unit })
				.label(getColumnLabel(template, 'unit'))
				.when(
					['isELTRow', 'isFromELTDataLines', 'key', 'category'],
					([isELTRow, isFromELTDataLines, key, category], schema) => {
						if (isELTRow) {
							return schema.omitted('${path} cannot be used for this row');
						}

						if (isFromELTDataLines) {
							return getELTLineCellPlaceholderSchema(schema);
						}

						const table = getExpensesTable({ template, key, category });

						if (table?.row_view.columns.unit_cost) {
							return mapTemplateFieldToYup(table?.row_view.columns.unit_cost).meta({
								template: EXTRA_EXPENSES_TEMPLATE_DATA.unit,
							});
						}

						if (key === 'Fixed Expenses') {
							return schema
								.transform(toLowerCaseTransform(['$/Month']))
								.oneOf(['$/Month', '$/Well/Month'])
								.meta({
									template: {
										...EXTRA_EXPENSES_TEMPLATE_DATA.unit,
										Default: { label: '$/Month', value: 'fixed_expense' },
									},
								}); // HACK for fixed expenses
						}

						if (key === 'Carbon Expenses') {
							return schema
								.transform(toLowerCaseTransform(['$/MT']))
								.oneOf(['$/MT'])
								.meta({
									template: { ...EXTRA_EXPENSES_TEMPLATE_DATA.unit, Default: { label: '$/MT' } },
								}); // HACK for fixed expenses
						}

						return schema.omitted('${path} cannot be used for chosen key/category').meta({
							template: EXTRA_EXPENSES_TEMPLATE_DATA.unit,
						});
					}
				),

			...['stop_at_econ_limit', 'expense_before_fpd'].reduce((acc, field) => {
				const label = getColumnLabel(template, field);
				assert(label, 'Expected label for field', () => ({ field }));
				acc[field] = yup
					.mixed()
					.when(
						['isELTRow', 'isFromELTDataLines', 'key', 'category', '$parentRow'],
						([isELTRow, isFromELTDataLines, key, category, $parentRow], schema) => {
							if (isELTRow) {
								return schema.omitted('${path} cannot be used for this row').label(label);
							}

							const parentFieldData = $parentRow?.[field];

							//checks to see if field value includes the field name (value for LT is `line{number}-{fieldname})`
							if (typeof parentFieldData === 'string' && parentFieldData?.includes(field)) {
								return schema.required().test((fieldValue, testContext) => {
									if ($parentRow.key !== 'Fixed Expenses') {
										return testContext.createError({
											message: `${label} can only be used for Fixed Expenses`,
										});
									}
									return true;
								});
							}

							const table = getExpensesTable({ template, key, category });

							if (table) {
								return mapTemplateFieldToYup(table?.[field], isFromELTDataLines).label(label);
							}

							return schema.omitted('${path} cannot be used for chosen key/category').label(label);
						}
					);
				return acc;
			}, {}),

			...['description', 'shrinkage_condition'].reduce((acc, field) => {
				const label = getColumnLabel(template, field);
				assert(label, 'Expected label for field', () => ({ field }));
				acc[field] = yup
					.string()
					.when(
						['isELTRow', 'isFromELTDataLines', 'key', 'category', '$parentRow'],
						([isELTRow, isFromELTDataLines, key, category, $parentRow], schema) => {
							if (isELTRow) {
								return schema.omitted('${path} cannot be used for this row').label(label);
							}

							const parentFieldData = $parentRow?.[field];

							//checks to see if field value includes the field name (value for LT is `line{number}-{fieldname})`
							if (typeof parentFieldData === 'string' && parentFieldData?.includes(field)) {
								return schema.required().test((fieldValue, testContext) => {
									if ($parentRow.key === 'Water Disposal') {
										return testContext.createError({
											message: `${label} cannot be used for ${$parentRow.key}`,
										});
									}
									if (
										field === 'shrinkage_condition' &&
										COLUMN_LABELS_WITHOUT_SHRINKAGE_CONDITION.includes($parentRow.key)
									) {
										return testContext.createError({
											message: `Shrinkage Condition cannot be used for ${$parentRow.key}`,
										});
									}
									return true;
								});
							}

							const table = getExpensesTable({ template, key, category });

							if (table) {
								return mapTemplateFieldToYup(table?.[field], isFromELTDataLines).label(label);
							}

							return schema.omitted('${path} cannot be used for chosen key/category').label(label);
						}
					);
				return acc;
			}, {}),
		})
		.concat(valuePeriodSchema);

	return { expensesRowSchema, timeSeriesSchema };
}

export function useTemplate(projectId: string, elts: ModuleListEmbeddedLookupTableItem[]) {
	const templateQuery = useTemplateQuery<ExpensesTemplate>(
		projectId,
		EXPENSES_TEMPLATE_QUERY_KEY,
		AssumptionKey.expenses
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const template = templateQuery.data?.template?.fields ?? (DEFAULT_EXPENSES_TEMPLATE as any as ExpensesTemplate);

	const { expensesRowSchema, timeSeriesSchema } = useMemo(
		() => getExpenseRowSchema(template, elts),
		[template, elts]
	);

	return { template, templateQuery, expensesRowSchema, timeSeriesSchema };
}
