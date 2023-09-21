import yup from '@/helpers/yup-helpers';

import { ECON_LIMIT, INF_LIMIT, INVALID_VALUE, IS_NESTED_ROW_KEY } from './constants';
import { parseDateValue, parseMonthValue, parseRateValue } from './shared';
import { TemplateHeaderSelect, TemplateHeaderSelectItem, TemplateNumberRangeRate } from './types';

type TemplateFieldRowView = {
	columns?: { criteria?: TemplateHeaderSelect };
};

type TemplateField = {
	fieldType: string;
	subItems?: {
		row_view?: TemplateFieldRowView;
	};
	row_view?: TemplateFieldRowView;
};

export const getPeriodSchema = <T>({
	template,
	getTemplateField,
	periodDisabledKeys = [],
	rateCriterias = [],
	label = 'Period',
}: {
	template: T;
	// disabled any lint rule because of how some assumptions expect a strict set of strings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	getTemplateField: (params: { template: T; key: string; category?: any }) => TemplateField | undefined;
	periodDisabledKeys?: string[];
	rateCriterias?: string[];
	label?: string;
}) =>
	yup
		.mixed()
		.when(
			['isELTRow', '$row', 'parentRow', '$prevRow', '$isLastTimeSeries', 'key'],
			([isELTRow, $row, parentRow, $prevRow, $isLastTimeSeries, key], schema) => {
				if (isELTRow) {
					return schema.omitted('${path} cannot be used for this row');
				}

				if (!!periodDisabledKeys.length && periodDisabledKeys.includes(key ?? parentRow?.key)) {
					return schema.omitted('${path} cannot be used for this row');
				}

				return schema.optional().test('period-test', (period, testContext) => {
					if (!parentRow) return true;

					if (!!parentRow.criteria && parentRow.criteria === 'Flat') {
						if ($prevRow && $row[IS_NESTED_ROW_KEY])
							return testContext.createError({
								message: 'Flat criteria cannot have more than one time series',
							});
						if (period !== 'Flat') return testContext.createError({ message: 'Expected "Flat"' });
						return true;
					}

					if (period?.toString().trim() === '' || period == null)
						return testContext.createError({ message: 'Period is required' });

					if (!!parentRow.criteria && parentRow.criteria === 'Dates') {
						const value = parseDateValue(period);
						const end = value;

						if (value === INVALID_VALUE || value === ECON_LIMIT)
							return testContext.createError({ message: 'Date must be a valid date' });

						// skip validation if there is no previous date
						if (!$prevRow) return true;
						const start = parseDateValue($prevRow.period);
						if (start === INVALID_VALUE || start === ECON_LIMIT) return true;

						if (!$isLastTimeSeries && end === ECON_LIMIT)
							return testContext.createError({ message: 'End date must be a valid date' });
						if (end === INVALID_VALUE)
							return testContext.createError({ message: 'End date must be a valid date' });
						if (end !== ECON_LIMIT && end <= start)
							return testContext.createError({
								message: 'End date must be greater than start date',
							});

						return true;
					}

					const getNumberPeriodRangeError = (value) => {
						const templateField = getTemplateField({
							template,
							key: parentRow.key,
							category: parentRow.category,
						});

						if (!templateField) return;

						const menuItems =
							templateField.subItems?.row_view?.columns?.criteria?.menuItems ??
							templateField.row_view?.columns?.criteria?.menuItems;

						const criteriaInfo = menuItems?.find(
							(mi) => mi.label === parentRow.criteria
						) as TemplateHeaderSelectItem & TemplateNumberRangeRate;

						if (!criteriaInfo) {
							return testContext.createError({
								message: 'Unknown Criteria',
							});
						}

						if ((!!criteriaInfo.min || criteriaInfo.min === 0) && value < criteriaInfo.min) {
							return testContext.createError({
								message: `Period must be greater than or equal to ${criteriaInfo.min}`,
							});
						}

						if (criteriaInfo.max && value > criteriaInfo.max) {
							return testContext.createError({
								message: `Period must be less than or equal to ${criteriaInfo.max}`,
							});
						}

						return null;
					};

					if (rateCriterias.includes(parentRow.criteria)) {
						const value = parseRateValue(period);
						const end = value;

						if (value === INVALID_VALUE || value === INF_LIMIT) {
							return testContext.createError({ message: 'Period must be a number' });
						}

						const rangeError = getNumberPeriodRangeError(value);
						if (rangeError) return rangeError;

						if (!$prevRow) return true;
						const start = parseRateValue($prevRow.period);

						if (start === INVALID_VALUE || start === INF_LIMIT) return true;

						if (end === INVALID_VALUE)
							return testContext.createError({ message: 'Rate must be a valid number' });
						if (end !== INF_LIMIT && end < start + 1)
							return testContext.createError({
								message: `Rate min value is ${Math.max(start + 1, 0)}`,
							});

						return true;
					}

					// rest of them are month ranges
					const value = parseMonthValue(period);

					if (value === INVALID_VALUE || value === ECON_LIMIT) {
						return testContext.createError({ message: 'Period must be a number' });
					}

					const rangeError = getNumberPeriodRangeError(value);
					if (rangeError) return rangeError;

					if (!Number.isInteger(value)) {
						return testContext.createError({ message: 'Period must be an integer' });
					}

					return true;
				});
			}
		)
		.label(label);
