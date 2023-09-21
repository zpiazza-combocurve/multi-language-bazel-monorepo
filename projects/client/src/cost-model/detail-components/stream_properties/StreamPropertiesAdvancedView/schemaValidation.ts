import { useMemo } from 'react';
import * as yup from 'yup';

import { ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { getPeriodSchema } from '@/components/AdvancedTable/sharedSchemas';
import { TemplateSelect } from '@/components/AdvancedTable/types';
import {
	concatenateKeyCategory,
	mapTemplateFieldToYup,
	toLowerCaseTransform,
	useTemplateQuery,
	yupValueNumberRangeValidation,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import useLDFeatureFlags from '@/feature-flags/useLDFeatureFlags';
import { assert } from '@/helpers/utilities';
import { AssumptionKey, FieldType } from '@/inpt-shared/constants';

import {
	GAS_SHRINK_SOURCES,
	STREAM_PROPERTIES_CATEGORIES,
	STREAM_PROPERTIES_CATEGORY_MAPPINGS,
	STREAM_PROPERTIES_COLUMNS,
	STREAM_PROPERTIES_COMPONENTS,
	STREAM_PROPERTIES_CRITERIA,
	STREAM_PROPERTIES_KEYS,
	STREAM_PROPERTIES_KEY_CATEGORIES,
	STREAM_PROPERTIES_RATE_LABELS,
	STREAM_PROPERTIES_TEMPLATE_QUERY_KEY,
} from './constants';
import { BaseCategoryFieldType, StreamPropertiesRow, StreamPropertiesTemplate } from './types';

const KEYS = Object.values(STREAM_PROPERTIES_KEYS).map((label) => label);

export const MAX_KEY_CATEGORY_COUNT = STREAM_PROPERTIES_KEY_CATEGORIES.reduce((acc, value) => {
	const key = value.key;
	const category = value.category;
	const type = concatenateKeyCategory({ key, category });
	acc[type] = (acc[type] ?? 0) + 1;
	return acc;
}, {});

const validateKeyCategoryMaxRecords = (keyCategory: string, keyCategoryCount: object) => {
	const keyCategoryMaxRecordsAllowed = MAX_KEY_CATEGORY_COUNT[keyCategory];
	const keyCategoryRecords = keyCategoryCount[keyCategory];
	const errorMessage = `This key/category pair has a ${keyCategoryMaxRecordsAllowed} record limit.`;

	return keyCategoryRecords > keyCategoryMaxRecordsAllowed ? errorMessage : null;
};

const getFieldNameBasedOnKeyCategory = ({ key, category }: { key: string; category: string }) => {
	const keyCategory = STREAM_PROPERTIES_KEY_CATEGORIES.find(
		(keyCategory) => keyCategory.key === key && keyCategory.category === category
	);
	return keyCategory?.fieldName ?? '';
};

function getStreamPropertiesTable({
	template,
	key,
	category,
}: {
	template: StreamPropertiesTemplate;
	key: string;
	category?: string;
}): BaseCategoryFieldType | undefined {
	if (!category) return undefined;
	const componentKey = STREAM_PROPERTIES_CATEGORY_MAPPINGS[category];
	const componentType = componentKey && STREAM_PROPERTIES_COMPONENTS[componentKey];
	if (!key) return template?.[componentType] ?? undefined;
	const fieldName = getFieldNameBasedOnKeyCategory({ key, category });
	return template?.[componentType]?.[fieldName] ?? undefined;
}

const getValueSchema = (template) =>
	yup
		.number()
		.when(
			['isELTRow', 'key', 'category', 'parentRow', 'isTimeSeriesRow'],
			([isELTRow, key, category, parentRow, isTimeSeriesRow], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (parentRow?.key === STREAM_PROPERTIES_KEYS.BTU && isTimeSeriesRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const table = getStreamPropertiesTable({
					template,
					key: key ?? parentRow?.key,
					category: category ?? parentRow?.category,
				});

				const keyCategoryColumns = table?.subItems?.row_view.columns;

				if (keyCategoryColumns) {
					const templateField = keyCategoryColumns.pct_remaining || keyCategoryColumns.yield;

					if (templateField) {
						return yupValueNumberRangeValidation({
							schema: mapTemplateFieldToYup(templateField),
							min: templateField?.min,
							max: templateField?.max,
						});
					}
				}

				if (key === STREAM_PROPERTIES_KEYS.BTU) {
					if (!category || !template) return schema;
					const btuFieldForCategory = template.btu_content[`${category.toLowerCase()}_gas`];

					return yupValueNumberRangeValidation({
						schema: mapTemplateFieldToYup(btuFieldForCategory),
						min: btuFieldForCategory?.min,
						max: btuFieldForCategory?.max,
					});
				}

				return schema.omitted('${path} cannot be used for chosen key/category');
			}
		)
		.label(STREAM_PROPERTIES_COLUMNS.value.label);

const getTimeSeriesFieldSchema = ({ field, enabledForTimeSeries, template }) => {
	if (!enabledForTimeSeries) return yup.string().omitted();
	if (field === STREAM_PROPERTIES_COLUMNS.period.field) {
		return getPeriodSchema({
			template,
			getTemplateField: getStreamPropertiesTable,
			periodDisabledKeys: [STREAM_PROPERTIES_KEYS.BTU],
			rateCriterias: STREAM_PROPERTIES_RATE_LABELS,
			label: STREAM_PROPERTIES_COLUMNS.period.label,
		});
	}
	if (field === STREAM_PROPERTIES_COLUMNS.value.field) return getValueSchema(template);
	return yup.string().omitted();
};

export function getStreamPropertiesRowSchema(
	template: StreamPropertiesTemplate,
	isCompositionalEconomicsEnabled = false,
	compEconRowsLength?: number
) {
	const periodSchema = yup.object({
		period: getPeriodSchema({
			template,
			getTemplateField: getStreamPropertiesTable,
			periodDisabledKeys: [STREAM_PROPERTIES_KEYS.BTU],
			rateCriterias: STREAM_PROPERTIES_RATE_LABELS,
			label: STREAM_PROPERTIES_COLUMNS.period.label,
		}),
	});

	const timeSeriesSchema = yup.object({
		...Object.values(STREAM_PROPERTIES_COLUMNS).reduce((acc, { field, enabledForTimeSeries }) => {
			if (field) acc[field] = getTimeSeriesFieldSchema({ field, enabledForTimeSeries, template });
			return acc;
		}, {}),
	});

	const streamPropertiesRowSchema = yup
		.object({
			key: yup
				.mixed()
				.when(['isELTRow', '$keyCategoryCount'], ([isELTRow, keyCategoryCount], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					return schema
						.required()
						.transform(toLowerCaseTransform(KEYS))
						.oneOf(KEYS)
						.test('key-test', (key: string, testContext: yup.TestContext) => {
							const { parent: rowData } = testContext;

							const rowKeyCategory = concatenateKeyCategory({ key, category: rowData.category });

							const errorMessage = validateKeyCategoryMaxRecords(rowKeyCategory, keyCategoryCount);
							if (errorMessage) return testContext.createError({ message: errorMessage });

							return true;
						});
				})
				.label(STREAM_PROPERTIES_COLUMNS.key.label),
			category: yup
				.mixed()
				.when(['key'], ([key], schema) => {
					const allStreamPropsCategories = Object.values(STREAM_PROPERTIES_CATEGORIES);

					const allowedCategoriesForKey = STREAM_PROPERTIES_KEY_CATEGORIES.filter(
						({ key: streamPropKey }) => streamPropKey === key
					).map(({ category }) => category);

					const menuItemsForKeyCategory = allStreamPropsCategories.filter((category) =>
						allowedCategoriesForKey.includes(category)
					);

					const menuItems = menuItemsForKeyCategory?.length
						? menuItemsForKeyCategory
						: allStreamPropsCategories;

					return schema.required().transform(toLowerCaseTransform(menuItems)).oneOf(menuItems);
				})
				.label(STREAM_PROPERTIES_COLUMNS.category.label),
			criteria: yup
				.mixed()
				.when(['key', 'category'], ([key, category], schema) => {
					if (
						isCompositionalEconomicsEnabled &&
						!!compEconRowsLength &&
						key === STREAM_PROPERTIES_KEYS.GAS &&
						category === STREAM_PROPERTIES_CATEGORIES.SHRINK
					) {
						return schema
							.required()
							.oneOf([STREAM_PROPERTIES_CRITERIA.entire_well_life])
							.meta({
								template: {
									fieldType: FieldType.headerSelect,
									fieldName: STREAM_PROPERTIES_COLUMNS.criteria.label,
								},
								default: STREAM_PROPERTIES_CRITERIA.entire_well_life,
							})
							.default(STREAM_PROPERTIES_CRITERIA.entire_well_life);
					}

					const table = getStreamPropertiesTable({ template, category, key });

					if (table?.subItems?.row_view) {
						return mapTemplateFieldToYup(table.subItems.row_view.columns.criteria);
					}

					return schema.omitted('${path} cannot be used for chosen key/category');
				})
				.label(STREAM_PROPERTIES_COLUMNS.criteria.label),
			source: yup
				.mixed()
				.when(['key', 'category'], ([key, category], schema) => {
					if (
						isCompositionalEconomicsEnabled &&
						!!compEconRowsLength &&
						key === STREAM_PROPERTIES_KEYS.GAS &&
						category === STREAM_PROPERTIES_CATEGORIES.SHRINK
					) {
						return schema
							.required()
							.oneOf(Object.values(GAS_SHRINK_SOURCES))
							.meta({
								template: {
									fieldType: FieldType.headerSelect,
									fieldName: STREAM_PROPERTIES_COLUMNS.source.label,
								},
								default: GAS_SHRINK_SOURCES.FROM_COMP,
							})
							.default(GAS_SHRINK_SOURCES.FROM_COMP);
					}

					const table = getStreamPropertiesTable({ template, category, key });

					if (table?.subItems?.row_view) {
						return mapTemplateFieldToYup(table?.subItems.row_view.columns.gas_type as TemplateSelect);
					}

					return schema.omitted('${path} cannot be used for chosen key/category');
				})
				.label(STREAM_PROPERTIES_COLUMNS.source.label),
			value: getValueSchema(template),
			unit: yup
				.mixed()
				.required()
				.when(['isELTRow', 'key', 'category'], ([isELTRow, key, category], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					const table = getStreamPropertiesTable({ template, category, key });

					const keyCategoryColumns = table?.subItems?.row_view.columns;

					if (keyCategoryColumns) {
						const templateFieldUnit =
							keyCategoryColumns.pct_remaining?.fieldName || keyCategoryColumns.yield?.unit;
						return schema.transform(toLowerCaseTransform([templateFieldUnit])).oneOf([templateFieldUnit]);
					}

					if (key === STREAM_PROPERTIES_KEYS.BTU) {
						if (!category || !template) return schema;
						const btuFieldForCategory = template.btu_content[`${category.toLowerCase()}_gas`];

						if (btuFieldForCategory) {
							return schema
								.transform(toLowerCaseTransform([btuFieldForCategory.unit]))
								.oneOf([btuFieldForCategory.unit]);
						}
					}

					return schema.omitted('${path} cannot be used for chosen key/category');
				})
				.label(STREAM_PROPERTIES_COLUMNS.unit.label),
			...['rate_type', 'rows_calculation_method'].reduce((acc, field) => {
				const label = STREAM_PROPERTIES_COLUMNS[field].label;
				assert(label, 'Expected label for field', () => ({ field }));

				acc[field] = yup
					.mixed()
					.when(
						['isELTRow', 'isFromELTDataLines', 'category', 'criteria', 'parentRow', '$rowData'],
						([isELTRow, isFromELTDataLines, category, criteria, parentRow, $rowData], schema) => {
							if (isELTRow) {
								return schema.omitted(`${label} cannot be used for this row`);
							}

							const table = getStreamPropertiesTable({ template, category, key: '' });

							const parentFieldData = parentRow?.[field];

							// checks to see if field value includes the field name (value for LT is `line{number}-{fieldname})`
							if (typeof parentFieldData === 'string' && parentFieldData?.includes(field)) {
								return schema.required().test((fieldValue, testContext) => {
									if (!STREAM_PROPERTIES_RATE_LABELS.includes(criteria)) {
										return testContext.createError({
											message: `${label} can only be used for rate criteria (${STREAM_PROPERTIES_RATE_LABELS.join(
												', '
											)})`,
										});
									}
									return true;
								});
							}

							if (STREAM_PROPERTIES_RATE_LABELS.includes(criteria)) {
								const linkedBy = STREAM_PROPERTIES_COLUMNS[field].linkedBy;
								return mapTemplateFieldToYup(table?.[field], isFromELTDataLines, linkedBy)
									.label(label)
									.test(`${field}-test`, (value: string, testContext: yup.TestContext) => {
										const currentRow = testContext.from?.[0].value;
										// Filter rows with a rate criteria belonging to the same category_group as current row
										// but with divergent row_type or rows_calculation_method
										const categoryRowsWithDivergentValues = $rowData.filter(
											(row: StreamPropertiesRow) =>
												row[ROW_ID_KEY] !== currentRow[ROW_ID_KEY] &&
												row.criteria &&
												STREAM_PROPERTIES_RATE_LABELS.includes(row.criteria) &&
												row.category_group === currentRow.category_group &&
												row[field] !== currentRow[field]
										);
										if (categoryRowsWithDivergentValues.length) {
											return testContext.createError({
												message:
													'${path} should have the same value for all rows with the same category',
											});
										}

										return true;
									});
							}

							return schema
								.omitted(
									`${label} can only be used for rate criteria (${STREAM_PROPERTIES_RATE_LABELS.join(
										', '
									)})`
								)
								.label(label);
						}
					);
				return acc;
			}, {}),
		})
		.concat(periodSchema);

	return { streamPropertiesRowSchema, timeSeriesSchema };
}

export function useTemplate(projectId: string, compEconRowsLength?: number) {
	const templateQuery = useTemplateQuery<StreamPropertiesTemplate>(
		projectId,
		STREAM_PROPERTIES_TEMPLATE_QUERY_KEY,
		AssumptionKey.streamProperties
	);

	const { isCompositionalEconomicsEnabled } = useLDFeatureFlags();

	const template = templateQuery.data?.template?.fields as StreamPropertiesTemplate;

	const { streamPropertiesRowSchema, timeSeriesSchema } = useMemo(
		() => getStreamPropertiesRowSchema(template, isCompositionalEconomicsEnabled, compEconRowsLength),
		[template, isCompositionalEconomicsEnabled, compEconRowsLength]
	);

	return { template, templateQuery, streamPropertiesRowSchema, timeSeriesSchema };
}
