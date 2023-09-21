import { useMemo } from 'react';
import * as yup from 'yup';

import { getPeriodSchema } from '@/components/AdvancedTable/sharedSchemas';
import { TemplateNumber, TemplateNumberMinMax, TemplateSelect } from '@/components/AdvancedTable/types';
import {
	concatenateKeyCategory,
	mapTemplateFieldToYup,
	useTemplateQuery,
	yupValueNumberRangeValidation,
} from '@/cost-model/detail-components/AdvancedModelView/shared';
import {
	FULL_PRICING_KEYS_COLUMNS,
	PRICING_COLUMNS,
	PRICING_COMPOSITIONAL_KEYS_CATEGORIES,
	PRICING_CRITERIA,
	PRICING_CRITERIA_MAPPINGS,
	PRICING_KEYS,
	PRICING_KEYS_CATEGORIES,
	PRICING_KEYS_COLUMNS,
	PRICING_KEYS_CONFIG,
	PRICING_TEMPLATE_QUERY_KEY,
	PRICING_UNITS_MAPPINGS,
	pricing_category_column,
} from '@/cost-model/detail-components/pricing/PricingAdvancedView/constants';
import {
	BaseNumericPropField,
	BaseSelectionPropField,
} from '@/cost-model/detail-components/shared_types/standard_view_types';
import { AssumptionKey } from '@/inpt-shared/constants';

import { BreakevenFields, PriceModelField, PriceModelFields, PricingTemplate } from '../types';

const KEYS = Object.values(PRICING_KEYS).map((label) => label);

const PERIOD_DISABLED_KEYS = Object.values(PRICING_KEYS_CONFIG)
	.filter(({ periodDisabled }) => !!periodDisabled)
	.map(({ label }) => label);

export const getMaxKeyCategoryCount = (isCompEconEnabled: boolean) => {
	const pricingKeyColumns = isCompEconEnabled ? FULL_PRICING_KEYS_COLUMNS : PRICING_KEYS_COLUMNS;

	return pricingKeyColumns.reduce((acc, value) => {
		const key = value.key;
		const category = isCompEconEnabled ? value.category : null;
		const type = concatenateKeyCategory({ key, category });
		acc[type] = (acc[type] ?? 0) + 1;
		return acc;
	}, {});
};

const validateKeyMaxRecords = (key: string, keyCount: object, isCompEconEnabled: boolean) => {
	const maxKeyCategoryCount = getMaxKeyCategoryCount(isCompEconEnabled);
	const errorMessage = `This key/category pair has a ${maxKeyCategoryCount[key]} record limit.`;

	return keyCount[key] > maxKeyCategoryCount[key] ?? 0 ? errorMessage : null;
};

const getModelFieldByKey = (componentTypeTemplate: BreakevenFields | PriceModelFields, key: string) => {
	return Object.values(componentTypeTemplate).find(
		({ fieldName }) => fieldName === key || (key === PRICING_KEYS.BREAK_EVEN && fieldName === 'NPV Discount')
	);
};

const getPricingTable = ({
	template,
	key,
	componentType = 'price_model',
}: {
	template: PricingTemplate;
	key: string;
	componentType?: 'breakeven' | 'price_model';
}): PriceModelField | TemplateNumber | undefined => {
	const componentTypeTemplate = template?.[componentType];
	const modelField = componentTypeTemplate && getModelFieldByKey(componentTypeTemplate, key);

	return modelField ?? undefined;
};

const priceModelIsBaseSelectionPropField = (
	priceModel: PriceModelField | BaseSelectionPropField | BaseNumericPropField
): priceModel is BaseSelectionPropField => {
	const priceModelBaseSelection = priceModel as BaseSelectionPropField;
	return !!priceModelBaseSelection.menuItems;
};

const getValueSchema = (template) =>
	yup
		.number()
		.when(
			['isELTRow', 'key', 'unit', 'parentRow', 'isTimeSeriesRow'],
			([isELTRow, key, unit, parentRow, isTimeSeriesRow], schema) => {
				const rowKey = key ?? parentRow?.key;

				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (isTimeSeriesRow && PERIOD_DISABLED_KEYS.includes(rowKey)) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const componentType = rowKey === PRICING_KEYS.BREAK_EVEN ? 'breakeven' : 'price_model';
				const priceTable = getPricingTable({ template, key: rowKey, componentType }) as PriceModelField;
				const priceModel = priceTable?.subItems?.row_view?.columns?.price ?? priceTable;

				if (priceModel) {
					const rowUnit = unit ?? parentRow?.unit;
					const priceTemplate = priceModelIsBaseSelectionPropField(priceModel)
						? priceModel.menuItems.find(({ label }) => label === rowUnit)
						: priceModel;

					return yupValueNumberRangeValidation({
						schema: mapTemplateFieldToYup(priceTemplate as TemplateNumber),
						min: priceTemplate?.min,
						max: priceTemplate?.max,
					});
				}

				return schema.omitted('${path} cannot be used for chosen key');
			}
		)
		.label(PRICING_COLUMNS.value.label);

const getTimeSeriesFieldSchema = ({ field, enabledForTimeSeries, template }) => {
	if (!enabledForTimeSeries) return yup.string().omitted();
	if (field === PRICING_COLUMNS.period.field)
		return getPeriodSchema({
			template,
			getTemplateField: getPricingTable,
			periodDisabledKeys: PERIOD_DISABLED_KEYS,
			label: PRICING_COLUMNS.period.label,
		});
	if (field === PRICING_COLUMNS.value.field) return getValueSchema(template);
	return yup.string().omitted();
};

export function getPricingRowSchema(template: PricingTemplate, isCompEconEnabled: boolean) {
	const columns = isCompEconEnabled ? { ...PRICING_COLUMNS, pricing_category_column } : PRICING_COLUMNS;
	const timeSeriesSchema = yup.object({
		...Object.values(columns).reduce((acc, { field, enabledForTimeSeries }) => {
			if (field) acc[field] = getTimeSeriesFieldSchema({ field, enabledForTimeSeries, template });
			return acc;
		}, {}),
	});

	const pricingRowSchema = {
		key: yup
			.mixed()
			.when(['isELTRow', '$keyCount'], ([isELTRow, keyCount], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				return schema
					.required()
					.oneOf(KEYS)
					.test('key-test', (key: string, testContext: yup.TestContext) => {
						const { parent: rowData } = testContext;
						const errorMessage = validateKeyMaxRecords(
							isCompEconEnabled
								? concatenateKeyCategory({ key: rowData.key, category: rowData.category })
								: rowData.key,
							keyCount,
							isCompEconEnabled
						);

						if (errorMessage) return testContext.createError({ message: errorMessage });
						return true;
					});
			})
			.label(PRICING_COLUMNS.key.label),
		criteria: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const criteriaOptions = PRICING_CRITERIA_MAPPINGS[key];
				if (criteriaOptions) {
					return schema.required().oneOf(criteriaOptions);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(PRICING_COLUMNS.criteria.label),
		period: getPeriodSchema({
			template,
			getTemplateField: getPricingTable,
			periodDisabledKeys: PERIOD_DISABLED_KEYS,
			label: PRICING_COLUMNS.period.label,
		}),
		value: getValueSchema(template),
		unit: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const unitOptions = PRICING_UNITS_MAPPINGS[key];
				if (unitOptions) {
					return schema.required().oneOf(unitOptions);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(PRICING_COLUMNS.unit.label),
		escalation: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const modelField = getPricingTable({
					template,
					key,
					componentType: 'price_model',
				}) as PriceModelField;
				const escalationTemplate = modelField?.subItems?.escalation_model;

				if (escalationTemplate) {
					return mapTemplateFieldToYup(escalationTemplate as TemplateSelect);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(PRICING_COLUMNS.escalation.label),
		cap: yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const modelField = getPricingTable({
					template,
					key,
					componentType: 'price_model',
				}) as PriceModelField;

				const capTemplate = modelField?.subItems?.cap as TemplateNumber;

				if (capTemplate) {
					return mapTemplateFieldToYup(capTemplate);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(PRICING_COLUMNS.cap.label),
		price_ratio: yup
			.mixed()
			.when(['isELTRow', 'key', 'criteria'], ([isELTRow, key, criteria], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (key === PRICING_KEYS.BREAK_EVEN && criteria === PRICING_CRITERIA.BASED_ON_PRICE_RATIO) {
					const priceTemplate = getPricingTable({
						template,
						key: 'Oil Price/Gas Price',
						componentType: 'breakeven',
					}) as TemplateNumber;

					if (priceTemplate) {
						const priceRatioMin = priceTemplate.min as TemplateNumberMinMax;
						return yupValueNumberRangeValidation({
							schema: mapTemplateFieldToYup(priceTemplate),
							min: priceRatioMin.value,
							max: priceTemplate.max as number,
							valueName: 'Price Ratio',
						}).required("Price Ratio is required for 'Break Even' when criteria is 'Based on price ratio'");
					}
				}

				return schema.omitted('${path} cannot be used for chosen key/criteria');
			})
			.label(PRICING_COLUMNS.price_ratio.label),
	};

	if (isCompEconEnabled) {
		pricingRowSchema['category'] = yup
			.mixed()
			.when(['isELTRow', 'key'], ([isELTRow, key], schema) => {
				if (key === undefined) return schema;
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				const categoryOptions = Object.values(PRICING_KEYS_CATEGORIES[key] || {}).map(({ label }) => label);
				if (PRICING_COMPOSITIONAL_KEYS_CATEGORIES[key]) {
					categoryOptions.push(...PRICING_COMPOSITIONAL_KEYS_CATEGORIES[key].map(({ label }) => label));
				}
				if (categoryOptions) {
					if (categoryOptions.length === 1 && categoryOptions[0] === 'N/A') {
						return schema.omitted('${path} cannot be used for chosen key');
					}
					return schema.required().oneOf(categoryOptions);
				}

				return schema.omitted('${path} cannot be used for chosen key');
			})
			.label(pricing_category_column.label);
	}

	const yupSchema = yup.object(pricingRowSchema);

	return { pricingRowSchema: yupSchema, timeSeriesSchema };
}

export function useTemplate(projectId: string, isCompEconEnabled: boolean) {
	const templateQuery = useTemplateQuery<PricingTemplate>(
		projectId,
		PRICING_TEMPLATE_QUERY_KEY,
		AssumptionKey.pricing
	);

	const template = templateQuery.data?.template?.fields as PricingTemplate;

	const { pricingRowSchema, timeSeriesSchema } = useMemo(
		() => getPricingRowSchema(template, isCompEconEnabled),
		[template, isCompEconEnabled]
	);

	return { template, templateQuery, pricingRowSchema, timeSeriesSchema };
}
