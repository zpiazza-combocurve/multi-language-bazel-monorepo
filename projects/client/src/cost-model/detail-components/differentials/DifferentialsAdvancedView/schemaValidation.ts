import { useMemo } from 'react';

import { getPeriodSchema } from '@/components/AdvancedTable/sharedSchemas';
import { TemplateHeaderSelect, TemplateNumber, TemplateSelect } from '@/components/AdvancedTable/types';
import { getConstantKeyFromValue } from '@/cost-model/detail-components/AdvancedModelView/constants';
import {
	concatenateKeyCategory,
	mapTemplateFieldToYup,
	toLowerCaseTransform,
	useTemplateQuery,
	yupValueNumberRangeValidation,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import { DIFFERENTIALS_CATEGORIES_MAP } from '@/cost-model/detail-components/differentials/constants';
import {
	DifferentialsColumnComponent,
	DifferentialsFieldsTemplate,
	RawDifferentialsFieldsTemplate,
} from '@/cost-model/detail-components/differentials/types';
import yup from '@/helpers/yup-helpers';
import { AssumptionKey } from '@/inpt-shared/constants';

import {
	DIFFERENTIALS_CATEGORIES,
	DIFFERENTIALS_COLUMNS,
	DIFFERENTIALS_KEYS,
	DIFFERENTIALS_KEYS_COLUMNS,
	DIFFERENTIALS_KEYS_CONFIG,
	DIFFERENTIALS_TEMPLATE_QUERY_KEY,
	DIFFERENTIALS_UNITS,
	DIFFERENTIALS_UNITS_MAPPINGS,
	PERCENTAGE_OF_BASE_PRICE_REPHRASED,
} from './constants';

const KEYS = Object.values(DIFFERENTIALS_KEYS).map((label) => label);

export const MAX_KEY_CATEGORY_COUNT = DIFFERENTIALS_KEYS_COLUMNS.reduce((acc, value) => {
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

const getDifferentialsTable = ({
	template,
	key,
	category,
}: {
	template: DifferentialsFieldsTemplate;
	key: string;
	category?: string;
}): DifferentialsColumnComponent | undefined => {
	const differentialPhase = getConstantKeyFromValue(DIFFERENTIALS_CATEGORIES_MAP, category);

	const differentialPhaseKey = Object.values(DIFFERENTIALS_KEYS_CONFIG).find(
		({ label }) => label === key
	)?.optionsKey;
	const differentialPhaseField =
		differentialPhase && differentialPhaseKey && template?.[differentialPhase]?.subItems?.[differentialPhaseKey];

	return differentialPhaseField ?? undefined;
};

const getValueSchema = (template) =>
	yup
		.number()
		.when(
			['isELTRow', 'key', 'category', 'unit', 'parentRow'],
			([isELTRow, key, category, unit, parentRow], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const rowKey = key ?? parentRow?.key;
				const rowCategory = category ?? parentRow?.category;

				const differentialsTable = getDifferentialsTable({
					template,
					key: rowKey,
					category: rowCategory,
				}) as DifferentialsColumnComponent;
				const differentialsModel = differentialsTable?.subItems.row_view.columns.differential;

				if (differentialsModel) {
					let rowUnit = unit ?? parentRow?.unit;

					if (rowUnit === DIFFERENTIALS_UNITS.PERCENTAGE_OF_BASE_PRICE) {
						rowUnit = PERCENTAGE_OF_BASE_PRICE_REPHRASED;
					}

					const differentialTemplate = differentialsModel.menuItems.find(
						({ label }) => label === rowUnit
					) as TemplateNumber;

					return yupValueNumberRangeValidation({
						schema: mapTemplateFieldToYup(differentialTemplate),
						min: differentialTemplate?.min as number,
						max: differentialTemplate?.max as number,
					});
				}

				return schema.omitted('${path} cannot be used for chosen key');
			}
		)
		.label(DIFFERENTIALS_COLUMNS.value.label);

const getTimeSeriesFieldSchema = ({ field, enabledForTimeSeries, template }) => {
	if (!enabledForTimeSeries) return yup.string().omitted();
	if (field === DIFFERENTIALS_COLUMNS.period.field)
		return getPeriodSchema({
			template,
			label: DIFFERENTIALS_COLUMNS.period.label,
			getTemplateField: getDifferentialsTable,
		});
	if (field === DIFFERENTIALS_COLUMNS.value.field) return getValueSchema(template);
	return yup.string().omitted();
};

export function getDifferentialsRowSchema(template: DifferentialsFieldsTemplate) {
	const timeSeriesSchema = yup.object({
		...Object.values(DIFFERENTIALS_COLUMNS).reduce((acc, { field, enabledForTimeSeries }) => {
			if (field) acc[field] = getTimeSeriesFieldSchema({ field, enabledForTimeSeries, template });
			return acc;
		}, {}),
	});

	const differentialsRowSchema = yup.object({
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
			.label(DIFFERENTIALS_COLUMNS.key.label),
		category: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const allDifferentialsCategories = Object.values(DIFFERENTIALS_CATEGORIES);

				const allowedCategoriesForKey = DIFFERENTIALS_KEYS_COLUMNS.filter(
					({ key: differentialKey }) => differentialKey === key
				).map(({ category }) => category);

				const menuItemsForKeyCategory = allDifferentialsCategories.filter((category) =>
					allowedCategoriesForKey.includes(category)
				);

				const menuItems = menuItemsForKeyCategory?.length
					? menuItemsForKeyCategory
					: allDifferentialsCategories;

				return schema.required().transform(toLowerCaseTransform(menuItems)).oneOf(menuItems);
			})
			.label(DIFFERENTIALS_COLUMNS.category.label),
		criteria: yup
			.mixed()
			.when(['isELTRow', 'key', 'category'], ([isELTRow, key, category], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const table = getDifferentialsTable({ template, key, category });

				if (table?.subItems?.row_view) {
					return mapTemplateFieldToYup(table?.subItems.row_view.columns.criteria as TemplateHeaderSelect);
				}

				return schema.omitted('${path} cannot be used for chosen key/category');
			})
			.label(DIFFERENTIALS_COLUMNS.criteria.label),
		period: getPeriodSchema({
			template,
			label: DIFFERENTIALS_COLUMNS.period.label,
			getTemplateField: getDifferentialsTable,
		}),
		value: getValueSchema(template),
		unit: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const allowedUnitsForKey = DIFFERENTIALS_UNITS_MAPPINGS[key] ?? [];

				if (allowedUnitsForKey && allowedUnitsForKey.length) {
					return schema.required().oneOf(allowedUnitsForKey);
				}

				return schema.omitted('${path} cannot be used for chosen key/category');
			})
			.label(DIFFERENTIALS_COLUMNS.unit.label),
		escalation: yup
			.mixed()
			.when(['isELTRow', 'key', 'category'], ([isELTRow, key, category], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const table = getDifferentialsTable({ template, key, category });
				const escalationTemplate = table?.subItems.escalation_model;

				if (escalationTemplate) {
					return mapTemplateFieldToYup(escalationTemplate as TemplateSelect);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(DIFFERENTIALS_COLUMNS.escalation.label),
	});

	return { differentialsRowSchema, timeSeriesSchema };
}

export function useTemplate(projectId: string) {
	const templateQuery = useTemplateQuery<RawDifferentialsFieldsTemplate>(
		projectId,
		DIFFERENTIALS_TEMPLATE_QUERY_KEY,
		AssumptionKey.differentials
	);

	const template = templateQuery.data?.template?.fields.differentials as DifferentialsFieldsTemplate;

	const { differentialsRowSchema, timeSeriesSchema } = useMemo(() => getDifferentialsRowSchema(template), [template]);

	return { template, templateQuery, differentialsRowSchema, timeSeriesSchema };
}
