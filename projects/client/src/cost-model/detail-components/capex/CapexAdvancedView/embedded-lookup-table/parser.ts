import { FieldType } from '@/inpt-shared/constants';
import { getFieldFromLookupByKey } from '@/lookup-tables/embedded-lookup-tables/shared';

import { CapexColumns, CapexTemplate } from '../types';

export interface CapexLabelsPOJO {
	criteria_value: string;
	criteria_option: string;
	criteria_from_option: string;
	escalation_start_value: string;
	escalation_start_option: string;
	escalation_model: string;
	tangible: string;
	intangible: string;
	description: string;
	category: string;
	depreciation_model: string;
	deal_terms: string;
	calculation: string;
	after_econ_limit: string;
	capex_expense: string;
}

export interface CapexPOJO {
	criteria_value: number;
	criteria_option: string;
	criteria_from_option: string;
	escalation_start_value: string;
	escalation_start_option: string;
	escalation_model: string;
	tangible: number;
	intangible: number;
	description: string;
	category: string;
	depreciation_model: string;
	deal_terms: number;
	calculation: string;
	after_econ_limit: string;
	capex_expense: string;
}

const CAPEX_TEMPLATE_MAP = {
	criteria_option: 'criteria',
	escalation_start_option: 'escalation_start',
};

const getValue = (column: string, label: string, templateCategory: CapexColumns) => {
	const valueFromTemplate = templateCategory[column]?.menuItems?.find((item) => item.label === label)?.value;
	const defaultValueFromTemplate =
		typeof templateCategory[column]?.Default === 'object'
			? templateCategory[column]?.Default?.value
			: templateCategory[column]?.Default;

	const value = valueFromTemplate ?? label ?? defaultValueFromTemplate;
	return templateCategory?.[column]?.fieldType === FieldType.number && value !== '' ? Number(value) : value;
};

const getCriteriaFromOptionValue = (label: string, templateCategory: CapexColumns) => {
	const menuItems = ['fromSchedule', 'fromHeaders'].flatMap((key) => {
		return templateCategory.criteria[key].menuItems;
	});
	const valueFromTemplate = menuItems?.find((item) => item.label === label)?.value;
	return valueFromTemplate ?? label;
};

// Saving doc to the DB
export const labelToValueCapexPOJO = (pojo: CapexLabelsPOJO, template: CapexTemplate): CapexPOJO => {
	const {
		criteria_value,
		criteria_option: criteriaLabel,
		criteria_from_option,
		escalation_start_value,
		escalation_start_option,
		escalation_model,
		tangible,
		intangible,
		description,
		category: categoryLabel,
		depreciation_model,
		deal_terms,
		calculation,
		after_econ_limit,
		capex_expense,
	} = pojo;
	const templateData = template.other_capex.row_view.columns;

	const criteria = getValue('criteria', criteriaLabel, templateData);

	const results: CapexPOJO = {
		description,
		criteria_option: criteria,
		category: getValue('category', categoryLabel, templateData),
		criteria_value: getValue('criteria_value', criteria_value, templateData),
		criteria_from_option: getCriteriaFromOptionValue(criteria_from_option, templateData),
		escalation_start_value: getValue('escalation_start_value', escalation_start_value, templateData),
		escalation_start_option: getValue('escalation_start', escalation_start_option, templateData),
		escalation_model: getValue('escalation_model', escalation_model, templateData),
		tangible: getValue('tangible', tangible, templateData),
		intangible: getValue('intangible', intangible, templateData),
		depreciation_model: getValue('depreciation_model', depreciation_model, templateData),
		deal_terms: getValue('deal_terms', deal_terms, templateData),
		calculation: getValue('calculation', calculation, templateData),
		after_econ_limit: getValue('after_econ_limit', after_econ_limit, templateData),
		capex_expense: getValue('capex_expense', capex_expense, templateData),
	};

	return results;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getLabel = (column: string, value: any, templateCategory: CapexColumns) => {
	const labelFromTemplate = templateCategory[column]?.menuItems?.find((item) => item.value === value)?.label;
	const defaultLabelFromTemplate = templateCategory[column]?.Default?.value;

	const label = labelFromTemplate ?? value ?? defaultLabelFromTemplate;
	return templateCategory?.[column]?.fieldType === FieldType.number ? value : label;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const getCriteriaFromOptionLabel = (value: any, templateCategory: CapexColumns) => {
	const menuItems = ['fromSchedule', 'fromHeaders'].flatMap((key) => {
		return templateCategory.criteria[key].menuItems;
	});
	const labelFromTemplate = menuItems?.find((item) => item.value === value)?.label;
	return labelFromTemplate ?? value;
};

// formatting db data to be viewed in table
export const valueToLabelCapexPOJO = (pojo: CapexPOJO, template: CapexTemplate): CapexLabelsPOJO => {
	const { criteria_from_option } = pojo;

	const templateData = template.other_capex.row_view.columns;

	const labels = Object.entries(pojo).reduce((acc, [key, value]) => {
		if (key !== 'criteria_from_option') {
			const keyForLabel = CAPEX_TEMPLATE_MAP[key] ?? key;
			acc[key] = getLabel(keyForLabel, value, templateData);
		}
		return acc;
	}, {}) as CapexLabelsPOJO;

	const criteriaFromOptionLabel = pojo?.criteria_from_option
		? { criteria_from_option: getCriteriaFromOptionLabel(criteria_from_option, templateData) }
		: {};

	return {
		...labels,
		...criteriaFromOptionLabel,
	};
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const rulesLabelToValueCapex = (lookupByKey: string, value: any, template: CapexTemplate) => {
	const templateData = template.other_capex.row_view.columns;
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
	const field = getFieldFromLookupByKey(lookupByKey)!;
	let valueToReturn = getValue(CAPEX_TEMPLATE_MAP[field] ?? field, value, templateData);
	if (value && field === 'criteria_from_option') {
		valueToReturn = getCriteriaFromOptionValue(value, templateData) || value;
	}
	return valueToReturn;
};

export const rulesValueToLabelCapex = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	rawRuleValues: Record<string, any>,
	template: CapexTemplate
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
): Record<string, any> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const transformedRuleValues: Record<string, any> = {};
	const templateData = template.other_capex.row_view.columns;

	Object.entries(rawRuleValues).forEach(([lookupByKey, rawValue]) => {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
		const field = getFieldFromLookupByKey(lookupByKey)!;
		let valueToDisplay = getLabel(CAPEX_TEMPLATE_MAP[field] ?? field, rawValue, templateData);
		if (field === 'criteria_from_option') {
			valueToDisplay = getCriteriaFromOptionLabel(rawValue, templateData);
		}
		transformedRuleValues[lookupByKey] = valueToDisplay === null ? undefined : valueToDisplay;
	});

	return transformedRuleValues;
};
