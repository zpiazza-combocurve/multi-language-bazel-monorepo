import { isValid } from 'date-fns';
import _ from 'lodash';
import { useMemo } from 'react';
import * as yup from 'yup';

import { useCustomWellHeaderNames } from '@/company/CustomColumnsRename/well-headers';
import { getELTLineCellPlaceholderSchema, getEltColumnValidation } from '@/components/AdvancedTable/schemaValidation';
import { useTemplateQuery } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { CAPEX_QUERY_KEYS, addCustomHeadersData } from '@/cost-model/detail-components/capex/CapexAdvancedView/shared';
import { CapexTemplate } from '@/cost-model/detail-components/capex/CapexAdvancedView/types';
import { parseMultipleFormats } from '@/helpers/dates';
import { arrayToRecord, assert } from '@/helpers/utilities';
import { AssumptionKey } from '@/inpt-shared/constants';
import { fields as DEFAULT_CAPEX_TEMPLATE } from '@/inpt-shared/display-templates/cost-model-dialog/capex.json';
import { ModuleListEmbeddedLookupTableItem } from '@/lookup-tables/embedded-lookup-tables/types';

import {
	CAPEX_DATE_FORMAT,
	CAPEX_OTHER_COLUMNS,
	CAPEX_RATES_LABELS,
	DEFAULT_NUMBER_VALUE,
	FALLBACK_NUMBER_MAX_VALUE,
	FALLBACK_NUMBER_MIN_VALUE,
} from './constants';

export const VARIABLE_CAPEX_OTHER_CATEGORIES = _.map(
	DEFAULT_CAPEX_TEMPLATE.other_capex.row_view.columns.category.menuItems,
	'value'
);

const getDefaultValue = (columnsTemplate, field) => {
	// eslint-disable-next-line no-prototype-builtins
	if (columnsTemplate[field].hasOwnProperty('Default')) {
		if (typeof columnsTemplate[field].Default === 'object') {
			return columnsTemplate[field].Default.label;
		}
		return columnsTemplate[field].Default;
	}
	return '';
};

const getTemplateSchema = (columnsTemplate, field) => {
	const omitFields = [
		'criteria_option',
		'criteria_from_option',
		'criteria_value',
		'escalation_start_option',
		'escalation_start_value',
	];
	const columnsWithDropdown = [
		'category',
		'capex_expense',
		'escalation_model',
		'depreciation_model',
		'after_econ_limit',
		'calculation',
	];

	if (omitFields.includes(field)) return null;

	const { fieldName: label, fieldType } = columnsTemplate[field];

	assert(label, 'Expected label for field', () => ({ field, columnTemplate: columnsTemplate[field] }));
	assert(fieldType, 'Expected fieldType for field', () => ({ field, columnTemplate: columnsTemplate[field] }));

	const defaultValue = getDefaultValue(columnsTemplate, field);

	if (fieldType === 'number') {
		const minValue = columnsTemplate[field]?.min || FALLBACK_NUMBER_MIN_VALUE;
		const maxValue = columnsTemplate[field].max || FALLBACK_NUMBER_MAX_VALUE;

		return yup
			.number()
			.label(label)
			.when(['isELTRow', 'isFromELTDataLines'], ([isELTRow, isFromELTDataLines], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (isFromELTDataLines) {
					return getELTLineCellPlaceholderSchema(schema);
				}

				return schema
					.default(columnsTemplate[field].Default || DEFAULT_NUMBER_VALUE)
					.min(minValue)
					.max(maxValue)
					.typeError(`Value should be a number in a range between ${minValue} and ${maxValue}`)
					.meta({ template: columnsTemplate[field], default: defaultValue });
			});
	}

	return yup
		.mixed()
		.label(label)
		.when(['isELTRow', 'isFromELTDataLines'], ([isELTRow, isFromELTDataLines], schema) => {
			if (isELTRow) {
				return schema.omitted('${path} cannot be used for this row');
			}

			if (isFromELTDataLines) {
				return schema;
			}

			const withMeta = schema.meta({ template: columnsTemplate[field], default: defaultValue });

			if (columnsWithDropdown.includes(field)) {
				return withMeta.oneOf(columnsTemplate[field].menuItems.map((menuItem) => menuItem.label));
			}

			return withMeta;
		});
};

export function getCapexRowSchema(template: CapexTemplate, elts: ModuleListEmbeddedLookupTableItem[]) {
	const columnsTemplate = template.other_capex.row_view.columns;

	const capexRowSchema = yup.object({
		...getEltColumnValidation(elts),
		...arrayToRecord(CAPEX_OTHER_COLUMNS, _.identity, (val) => getTemplateSchema(columnsTemplate, val)),

		description: yup
			.string()
			.label(columnsTemplate.description.fieldName)
			.when(['isELTRow'], ([isELTRow], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				return schema.max(columnsTemplate.description.maxLength).default('').nullable();
			}),

		criteria_option: yup
			.mixed()
			.label(columnsTemplate.criteria.fieldName)
			.when(['isELTRow', 'isFromELTDataLines'], ([isELTRow, isFromELTDataLines], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (isFromELTDataLines) {
					return schema;
				}

				return schema
					.meta({ template: columnsTemplate.criteria, default: columnsTemplate.criteria.Default.label })
					.oneOf(columnsTemplate.criteria.menuItems.map((menuItem) => menuItem.label));
			}),

		criteria_from_option: yup
			.mixed()
			.meta({ template: { fieldType: 'select' } })
			.label('Criteria Second Option')
			.when(
				['isELTRow', 'isFromELTDataLines', 'criteria_option'],
				([isELTRow, isFromELTDataLines, criteriaOption], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					if (isFromELTDataLines) {
						return schema;
					}

					const fromSchedule = columnsTemplate.criteria.fromSchedule;
					const fromHeader = columnsTemplate.criteria.fromHeaders;

					switch (criteriaOption) {
						case 'From Schedule':
							return schema
								.meta({
									template: fromSchedule,
								})
								.oneOf(fromSchedule.menuItems.map(({ label }) => label))
								.required();
						case 'From Headers':
							return schema
								.meta({
									template: fromHeader,
								})
								.oneOf(fromHeader.menuItems.map(({ label }) => label))
								.required();
						default:
							return schema.omitted(
								'${label} can only be used for From Schedule and From Headers criteria'
							);
					}
				}
			),

		criteria_value: yup
			.mixed()
			.label('Criteria Value')
			.when(
				['isELTRow', 'isFromELTDataLines', 'criteria_option'],
				([isELTRow, isFromELTDataLines, criteriaOption], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					if (isFromELTDataLines) {
						return schema;
					}

					if (criteriaOption === 'Date') {
						return schema
							.required()
							.test('is-valid-date', 'Please Enter valid Date in format: MM/DD/YYYY', (value) => {
								const isString = typeof value === 'string';

								return isString && isValid(parseMultipleFormats(value, CAPEX_DATE_FORMAT));
							});
					}

					if (CAPEX_RATES_LABELS.includes(criteriaOption)) {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						const rateMenuItem = columnsTemplate.criteria.menuItems.find(
							({ label }) => label === criteriaOption
						)!;

						return schema
							.required()
							.transform((value) => Number(value))
							.test(
								'is-in-valid-range',
								`Criteria Value for ${criteriaOption} should be a number from ${rateMenuItem.min} to ${rateMenuItem.max}`,
								(value) => {
									return value >= rateMenuItem.min && value <= rateMenuItem.max;
								}
							);
					}

					return schema
						.required()
						.transform((value) => Number(value))
						.test(
							'is-in-valid-range',
							`Criteria Value should be a number from ${columnsTemplate.criteria.Default.min} to ${columnsTemplate.criteria.Default.max}`,
							(value) => {
								return (
									value >= columnsTemplate.criteria.Default.min &&
									value <= columnsTemplate.criteria.Default.max
								);
							}
						);
				}
			),

		escalation_start_option: yup
			.mixed()
			.label(columnsTemplate.escalation_start.fieldName)
			.when(['isELTRow', 'isFromELTDataLines'], ([isELTRow, isFromELTDataLines], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (isFromELTDataLines) {
					return schema;
				}

				return schema
					.meta({ template: columnsTemplate.escalation_start })
					.oneOf(columnsTemplate.escalation_start.menuItems.map((menuItem) => menuItem.label));
			}),

		escalation_start_value: yup
			.mixed()
			.label('Escalation Start Value')
			.when(
				['isELTRow', 'isFromELTDataLines', 'escalation_start_option'],
				([isELTRow, isFromELTDataLines, escalation_start_option], schema) => {
					if (isELTRow) {
						return schema.omitted('${path} cannot be used for this row');
					}

					if (isFromELTDataLines) {
						return schema;
					}

					if (escalation_start_option === 'Date') {
						return schema
							.required()
							.test('is-valid-date', 'Please Enter valid Date in format: MM/DD/YYYY', (value) => {
								const isString = typeof value === 'string';

								return isString && isValid(parseMultipleFormats(value, CAPEX_DATE_FORMAT));
							});
					}
					return schema
						.required()
						.transform((value) => Number(value))
						.test(
							'is-in-valid-range',
							`Criteria Value should be a number from ${columnsTemplate.criteria.Default.min} to ${columnsTemplate.criteria.Default.max}`,
							(value) => {
								return (
									value >= columnsTemplate.escalation_start.Default.min &&
									value <= columnsTemplate.escalation_start.Default.max
								);
							}
						);
				}
			),
	});

	return { capexRowSchema };
}

export function useCapexTemplate(projectId: string, elts: ModuleListEmbeddedLookupTableItem[]) {
	const templateQuery = useTemplateQuery<CapexTemplate>(projectId, CAPEX_QUERY_KEYS, AssumptionKey.capex);

	const template = templateQuery.data?.template?.fields ?? DEFAULT_CAPEX_TEMPLATE;

	const { columnNames } = useCustomWellHeaderNames();

	const updatedTemplate = useMemo(() => addCustomHeadersData(template, columnNames), [template, columnNames]);

	const { capexRowSchema } = useMemo(() => getCapexRowSchema(updatedTemplate, elts), [updatedTemplate, elts]);

	return { templateQuery, template: updatedTemplate, capexRowSchema };
}
