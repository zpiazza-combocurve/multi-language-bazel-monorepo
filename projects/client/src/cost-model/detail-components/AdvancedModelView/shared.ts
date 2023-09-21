import { ColDef } from 'ag-grid-community';
import { add, differenceInMonths, endOfMonth, format } from 'date-fns';
import { countBy, flatten, isEmpty, isNumber, map as lomap } from 'lodash';
import { QueryKey, useQuery, useQueryClient } from 'react-query';
import * as yup from 'yup';

import {
	DATE_FORMAT,
	ECON_LIMIT,
	ERROR_KEY,
	INVALID_VALUE,
	IS_NESTED_ROW_KEY,
	LT_CELL_PLACEHOLDER_VALUES,
	PERIOD_DATA_KEY,
	ROW_ID_KEY,
	SCHEMA_DESCRIBE_KEY,
	TOOLTIP_MESSAGE_KEY,
	TREE_DATA_KEY,
} from '@/components/AdvancedTable/constants';
import { getELTLineCellPlaceholderSchema } from '@/components/AdvancedTable/schemaValidation';
import { parseDateValue, parseMonthValue } from '@/components/AdvancedTable/shared';
import { AdvancedTableRow, TemplateAny, TemplateNumberMinMax } from '@/components/AdvancedTable/types';
import { getAssumptionExtendedTemplate } from '@/cost-model/detail-components/api';
import { getObjectSchemaValidationErrors } from '@/helpers/yup-helpers';
import { FieldType } from '@/inpt-shared/constants';

import { BASE_ASSUMPTION_CRITERIA_MAPPINGS } from './constants';
import {
	AdvancedTableRowWithPeriod,
	BaseAssumptionsCriteriaKeys,
	BaseAssumptionsCriteriaRows,
	Dates,
	Dictionary,
	OffsetToAsOfDate,
	OrganizableRowProps,
	YupNumberValidationProps,
} from './types';

export function getTemplateNumberMinMaxValue(templateNumberMinMaxValue: TemplateNumberMinMax | number): number {
	if (isNumber(templateNumberMinMaxValue)) {
		return templateNumberMinMaxValue;
	}

	return templateNumberMinMaxValue.value;
}

/**
 * Map a template field to a yup schema object.
 *
 * @param {TemplateAny} templateField - The template that will be mapped to yup schema.
 * @param {boolean} expectLTValues - When true Will add 'LT' and 'UNASSIGNED' as valid values for headerSelect and
 *   select field types.
 * @param {string} linkedBy - Expects a string that corresponds to another column of the schema. AdvancedTable will use
 *   it to update the field for all rows linked by the column passed in this param. E.g.: templateField is template for
 *   rate_type field, linkedBy is 'category_group'. When user updates row[i].rate_type with X value, all other rows with
 *   the same category_group as row[i] will have rate_type updated with X.
 * @returns {yup.Schema} - The parsed mapped yup schema
 */
export function mapTemplateFieldToYup(
	templateField: TemplateAny,
	expectLTValues = false,
	linkedBy?: string
): yup.Schema {
	if (!templateField) {
		return yup.mixed().omitted('${path} cannot be used for chosen key/category');
	}

	const fieldName = templateField.fieldName;

	let schema = (() => {
		if (templateField.fieldType === FieldType.headerSelect || templateField.fieldType === FieldType.select) {
			const validValues = lomap(templateField.menuItems, 'label');

			if (expectLTValues) {
				validValues.push(...LT_CELL_PLACEHOLDER_VALUES);
			}

			return (
				yup
					.string()
					.transform((v) => v?.label ?? v) // HACK: hack for escalation_model
					// Dropped requiring trimmed value for backwards compatibility with old models. Enforced saving/updating all models without trailing spaces @CC-21350.
					.transform((v, o) => (v === '' || o === '' || o == null ? undefined : v))
					.transform(
						// try to find a similar value ignoring the case sensitivity
						(value) =>
							// TODO find out why do we need to check for nulls in validValue or value see https://combocurve.atlassian.net/browse/CC-12604
							validValues.find((validValue) => validValue?.toLowerCase() === value?.toLowerCase()) ??
							value
					)
					.oneOf(validValues)
			);
		}

		if (templateField.fieldType === FieldType.text) {
			let schema = yup.string().transform((v, o) => (v === '' || o === '' || o == null ? undefined : v));
			if (templateField.maxLength != null) schema = schema.max(templateField.maxLength);
			return schema;
		}

		if (templateField.fieldType === FieldType.number) {
			let schema = yup
				.number()
				.typeError(`${fieldName} must be a valid number`)
				.transform((v, o) => (v === '' || o === '' || o == null ? undefined : v)); // see https://github.com/jquense/yup/issues/500

			if (templateField.min != null) {
				schema = (() => {
					if (isNumber(templateField.min)) {
						return schema.min(templateField.min);
					}
					if (templateField.min.include) {
						return schema.min(templateField.min.value);
					}

					return schema.moreThan(templateField.min.value);
				})();
			}

			if (templateField.max != null) {
				schema = schema.max(getTemplateNumberMinMaxValue(templateField.max));
			}

			if (expectLTValues) {
				return getELTLineCellPlaceholderSchema(schema);
			}

			return schema;
		}

		throw new Error(`Unexpected template field template: ${JSON.stringify(templateField)}`);
	})();

	if (templateField.required) {
		schema = schema.required();
	}

	const def = templateField.Default?.label ?? templateField?.Default ?? undefined;

	schema = schema.default(def);

	schema = schema.label(fieldName);

	return schema.meta({ template: templateField, default: def, linkedBy }) as yup.Schema; // TODO find out why we need to cast it
}

export function mapTemplateFieldToColDef(field: string, templateField: TemplateAny): ColDef {
	return {
		field,
		headerName: templateField.fieldName,
		headerTooltip: templateField.helpText, // TODO find out how to use mui for tooltips
	};
}

export const toLowerCaseTransform = (validValues) => (value) =>
	validValues.find((validValue) => validValue?.toLowerCase() === value?.toLowerCase()) ?? value;

export const yupValueNumberRangeValidation = ({ schema, min, max, valueName = 'Value' }: YupNumberValidationProps) => {
	return schema
		.typeError(`${valueName} must be a valid number`)
		.optional()
		.test('value', (value, testContext) => {
			if (value === undefined || value === null) {
				return testContext.createError({ message: `${valueName} is required` });
			}

			if (max && value > max) {
				return testContext.createError({ message: `${valueName} must be less than ${max} or equal it` });
			}
			if ((!!min || min === 0) && value < min) {
				return testContext.createError({ message: `${valueName} must be greater than ${min} or equal it` });
			}
			return true;
		});
};

export function addTreeDataInfo<T extends AdvancedTableRow>(rowData: T[]): T[] {
	let eltLinesParentRow: AdvancedTableRow | null = null;
	let timeSeriesRowsParent: AdvancedTableRow | null = null;

	return rowData.map((row) => {
		const path: string[] = [];

		if (row.isELTRow) {
			eltLinesParentRow = row;
		} else if (!row[IS_NESTED_ROW_KEY]) {
			timeSeriesRowsParent = row;
		}

		if (eltLinesParentRow && row.isFromELTDataLines) {
			path.push(eltLinesParentRow[ROW_ID_KEY]);
		}

		if (timeSeriesRowsParent && row[IS_NESTED_ROW_KEY]) {
			path.push(timeSeriesRowsParent[ROW_ID_KEY]);
		}

		path.push(row[ROW_ID_KEY]);

		return { ...row, [TREE_DATA_KEY]: path };
	});
}

/**
 * Returns true if data series ranges should not be adjusted for key or parent row key
 *
 * @param {string[]} nonDataSeriesKeys - An array of keys that does not support data series.
 * @param {string} [key] - Key that needs to be tested.
 * @param {string} [parentRowKey] - Key for parent row that needs to be tested.
 * @returns {boolean} - True if data series should NOT be adjusted, false if SHOULD be adjusted.
 */
export const shouldNotAdjustDataSeriesRanges = ({
	nonDataSeriesKeys,
	key,
	parentRowKey,
}: {
	nonDataSeriesKeys: string[];
	key?: string;
	parentRowKey?: string;
}): boolean => {
	if (key && nonDataSeriesKeys.includes(key)) return true;
	if (parentRowKey && nonDataSeriesKeys.includes(parentRowKey)) return true;
	return false;
};

interface AdjustDataSeriesRangesParams {
	/** Array of rows to have data series ranges adjusted */
	rowData: AdvancedTableRowWithPeriod[];
	/** Array of strings containing keys that does not support data series */
	nonDataSeriesKeys?: string[];
	/** Array of strings containing period labels that are of rate type (E.g: Oil Rate, Gas Rate, Water Rate, etc.) */
	rateLabels?: string[];
}

/**
 * Returns rows data with adjusted data series ranges
 *
 * @param {AdjustDataSeriesRangesParams} params - Object with the expected arguments (rowData, [nonDataSeriesKeys],
 *   [rateLabels]) for AdjustDataSeriesRangesParams type
 * @returns {AdvancedTableRowWithPeriod[]} - Rows data with data series adjusted
 */
export function adjustDataSeriesRanges(params: AdjustDataSeriesRangesParams): AdvancedTableRowWithPeriod[] {
	const { rowData, nonDataSeriesKeys, rateLabels } = params;
	const parentRow = { key: '', criteria: '' };
	const result: AdvancedTableRowWithPeriod[] = [];
	let periodSuffixAux: number | null | undefined | string = null;
	rowData.forEach((row, i) => {
		const isLastRow = !rowData[i + 1] || !rowData[i + 1][IS_NESTED_ROW_KEY];

		if (!row[IS_NESTED_ROW_KEY]) {
			parentRow.key = row.key ?? '';
			parentRow.criteria = row.criteria ?? '';
			periodSuffixAux = 1;
		}

		if (
			nonDataSeriesKeys?.length &&
			shouldNotAdjustDataSeriesRanges({
				nonDataSeriesKeys,
				key: row.key,
				parentRowKey: parentRow.key,
			})
		) {
			result.push({
				...row,
				period: undefined,
				value: row.isELTRow ? undefined : row.value ?? 0,
				[PERIOD_DATA_KEY]: {
					nextPeriod: null,
					criteria: '',
					isLastRow,
					start: undefined,
					end: undefined,
				},
			});
			return;
		}

		const adjustedPeriod = (() => {
			if (parentRow.criteria === 'Flat') return row.period;
			if (parentRow.criteria === 'Dates') {
				const date = parseDateValue(String(row.period) ?? '');
				if (date === INVALID_VALUE || date === ECON_LIMIT) return row.period;
				return format(date, DATE_FORMAT);
			}
			const date = parseMonthValue(String(row.period) ?? '');
			if (date === INVALID_VALUE || date === ECON_LIMIT) return row.period;
			return date;
		})();

		const isRateCriteria = rateLabels?.includes(parentRow.criteria);
		const periodSuffixStart = isRateCriteria || parentRow.criteria === 'Dates' ? adjustedPeriod : periodSuffixAux;
		const periodSuffixEnd = isRateCriteria ? 'inf' : 'Econ Limit';

		(() => {
			if (parentRow.criteria === 'Flat') return (periodSuffixAux = null);
			if (parentRow.criteria === 'Dates') return (periodSuffixAux = null);
			(periodSuffixAux as number) += Number(row.period);
		})();

		result.push({
			...row,
			period: adjustedPeriod ?? '',
			value: row.isELTRow ? undefined : row.value ?? 0,
			[PERIOD_DATA_KEY]: {
				nextPeriod: null,
				criteria: parentRow.criteria,
				isLastRow,
				start: periodSuffixStart,
				end: periodSuffixEnd,
			},
		});

		// set previous row's nextPeriod value based on current adjusted period
		if (result.length > 1 && rowData[i][IS_NESTED_ROW_KEY]) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			result[i - 1]![PERIOD_DATA_KEY]!.nextPeriod = adjustedPeriod;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			result[i - 1]![PERIOD_DATA_KEY]!.end = periodSuffixStart;
		}
	});

	return result;
}

/**
 * Returns rows data with data series ranges adjusted and grouped by parent row key
 *
 * @param rows - Rows data to be adjusted and grouped
 * @returns {AdvancedTableRowWithPeriod[][]} - Rows data with data series adjusted and grouped
 * @throws {Error} - Throws error if a group does not have a key
 */
export function groupTimeSeriesRows(rows: AdvancedTableRowWithPeriod[]): AdvancedTableRowWithPeriod[][] {
	const result: AdvancedTableRowWithPeriod[][] = [];
	let currentGroup: AdvancedTableRowWithPeriod[] = [];
	let currentGroupKey: string | null = null;
	for (const row of rows) {
		if (row.key) {
			if (currentGroupKey != null) {
				result.push(currentGroup);
				currentGroup = [];
			}
			currentGroupKey = row.key;
			currentGroup.push(row);
		} else {
			currentGroup.push(row);
		}
	}
	if (currentGroup.length > 0) {
		result.push(currentGroup);
	}
	if (result.length > 0) {
		for (const group of result) {
			if (!group[0].key) {
				throw new Error('groupTimeSeriesRows: group does not have a key');
			}
		}
	}
	return result;
}

type ParseAssumptionOptionsRowsCriteria = {
	row: AdvancedTableRowWithPeriod;
	isDateCriteria?: boolean;
	isRateCriteria?: boolean;
};

export const parseAssumptionOptionsRowsCriteria = ({
	row,
	isDateCriteria,
	isRateCriteria,
}: ParseAssumptionOptionsRowsCriteria): Dates | OffsetToAsOfDate | 'Flat' | undefined => {
	if (row.criteria === 'Flat' || row[PERIOD_DATA_KEY]?.criteria === 'Flat') {
		return 'Flat';
	}

	if (isRateCriteria) {
		return {
			start: row[PERIOD_DATA_KEY]?.start,
			end: row[PERIOD_DATA_KEY]?.end,
		};
	}

	if (isDateCriteria) {
		const dateCriteria = {} as Dates;
		const startDate = parseDateValue(row.period?.toString());
		const endDate = parseDateValue(row[PERIOD_DATA_KEY]?.end);

		dateCriteria.start_date = format(startDate as Date, 'yyyy/MM/dd');
		dateCriteria.period = row[PERIOD_DATA_KEY]?.isLastRow
			? 1
			: differenceInMonths(endDate as Date, startDate as Date) + 1;
		dateCriteria.end_date = row[PERIOD_DATA_KEY]?.isLastRow
			? 'Econ Limit'
			: format(endOfMonth(add(endDate as Date, { months: -1 })), 'yyyy/MM/dd');

		return dateCriteria;
	}

	if (!row[PERIOD_DATA_KEY]) return undefined;
	const criteriaOffset = {} as OffsetToAsOfDate;
	const { isLastRow, start: periodStart, end: periodEnd } = row[PERIOD_DATA_KEY];
	const endValue = (isLastRow ? periodStart + row.period : periodEnd) - 1;
	criteriaOffset.start = periodStart;
	criteriaOffset.end = endValue;
	criteriaOffset.period = row.period;

	return criteriaOffset;
};

interface RehydrateRateAndRowColumnValuesParams {
	/** Array of rows to have data series ranges adjusted */
	rowData: (AdvancedTableRowWithPeriod & { rate_type?: string; rows_calculation_method?: string })[];
	/** Array of strings containing period labels that are of rate type (E.g: Oil Rate, Gas Rate, Water Rate, etc.) */
	rateLabels: string[];
}

/**
 * This will help us remove rate type and row calculation column values depending on rate labels
 *
 * @param rowData
 */
export const rehydrateRateAndRowColumnValues = (params: RehydrateRateAndRowColumnValuesParams) => {
	const { rowData, rateLabels } = params;

	if (!rowData.length) return rowData;

	// look for at least one row with an invalid
	// criteria + rate type and rows calculation method
	const rowWithInvalidColumns = rowData.find(({ criteria, rate_type, rows_calculation_method }) => {
		return criteria && !rateLabels.includes(criteria) && (rate_type || rows_calculation_method);
	});

	if (rowWithInvalidColumns) {
		return rowData.map((currentRowData) => {
			if (currentRowData.criteria && !rateLabels.includes(currentRowData.criteria)) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { rate_type, rows_calculation_method, ...currentRowDataToKeep } = currentRowData;
				return currentRowDataToKeep;
			}

			return currentRowData;
		});
	}

	return rowData;
};

export const concatenateKeyCategory = ({
	key,
	category,
}: Pick<{ key?: string; category?: string | null }, 'key' | 'category'>) => {
	return (key ?? '') + (category ?? '');
};

export const getKeyCategoryCount = (rowData?: AdvancedTableRow[]) =>
	rowData
		? countBy(
				rowData.filter((row) => !row.isELTRow && !row.isFromELTDataLines),
				concatenateKeyCategory
		  )
		: {};

const getRegularAndELTRows = <T extends Pick<OrganizableRowProps, 'isELTRow' | 'isFromELTDataLines'>>(rowData: T[]) => {
	const regularRows: T[] = [];
	const eltRows: T[] = [];

	rowData.forEach((row) => {
		if (row.isELTRow || row.isFromELTDataLines) {
			eltRows.push(row);
		} else {
			regularRows.push(row);
		}
	});

	return { regularRows, eltRows };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
const groupTimeSeries = <T extends { [s: string]: any }>(rowData: T[]): T[][] =>
	rowData.reduce((rowGroups: T[][], row: T) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const isParentRow = Object.entries<{ [s: string]: any }>(row).some(
			([key, value]) => !['period', 'value'].includes(key) && !!value
		);
		if (isParentRow || rowGroups.length === 0) rowGroups.push([row]);
		else rowGroups[rowGroups.length - 1].push(row);
		return rowGroups;
	}, []);

const sortRowGroupsByKeyCategory = <T extends Pick<OrganizableRowProps, 'key'>>(
	rowGroups: T[][],
	sortedKeys: string[],
	sortedCategories: string[],
	categoryAttributeName = 'category'
): T[][] => {
	return [...rowGroups].sort(([a], [b]) => {
		if (a.key === b.key)
			return (
				sortedCategories.indexOf(a[categoryAttributeName] ?? '') -
				sortedCategories.indexOf(b[categoryAttributeName] ?? '')
			);
		return sortedKeys.indexOf(a.key ?? '') - sortedKeys.indexOf(b.key ?? '');
	});
};

const sortRowGroupsByCategoryKey = <T extends Pick<OrganizableRowProps, 'key' | 'category'>>(
	rowGroups: T[][],
	sortedKeys: string[],
	sortedCategories: string[],
	categoryAttributeName = 'category'
): T[][] => {
	return [...rowGroups].sort(([a], [b]) => {
		if (a[categoryAttributeName] === b[categoryAttributeName]) {
			return sortedKeys.indexOf(a.key ?? '') - sortedKeys.indexOf(b.key ?? '');
		}
		return (
			sortedCategories.indexOf(a[categoryAttributeName] ?? '') -
			sortedCategories.indexOf(b[categoryAttributeName] ?? '')
		);
	});
};

type OrganizeRowsOptionsParams = {
	categoryAttributeName?: string;
	sortByCategoryKey?: boolean;
};

export const organizeRows = <T extends OrganizableRowProps>(
	rows: T[],
	sortedKeys: string[],
	sortedCategories: string[],
	options: OrganizeRowsOptionsParams = { categoryAttributeName: 'category' }
) => {
	const { regularRows, eltRows } = getRegularAndELTRows<T>(rows);
	const rowGroups = groupTimeSeries<T>(regularRows);
	let sortedGroups: T[][] = [];

	if (options.sortByCategoryKey) {
		sortedGroups = sortRowGroupsByCategoryKey<T>(
			rowGroups,
			sortedKeys,
			sortedCategories,
			options.categoryAttributeName
		);
	} else {
		sortedGroups = sortRowGroupsByKeyCategory<T>(
			rowGroups,
			sortedKeys,
			sortedCategories,
			options.categoryAttributeName
		);
	}

	return [...flatten(sortedGroups), ...eltRows];
};

export const roundedValueGetter = (data, field, maxDecimalPlaces = 4) => {
	if (!data) return;
	if (isNaN(data[field])) return data[field];
	const isDecimal = data[field] % 1 !== 0;
	return isDecimal ? parseFloat(Number(data[field]).toFixed(maxDecimalPlaces)) : data[field];
};

export const useTemplateQuery = <T>(projectId: string, queryKeys: QueryKey, assumptionKey: string) => {
	const queryClient = useQueryClient();

	const invalidate = () => queryClient.invalidateQueries(queryKeys);

	const queryResult = useQuery(queryKeys, () => getAssumptionExtendedTemplate<T>(projectId, assumptionKey));

	return {
		...queryResult,
		invalidate,
	};
};

export const getELTsCount = (rowsState: AdvancedTableRow[]) =>
	countBy(
		rowsState.filter((row) => !!row.eltName),
		({ eltName }) => eltName
	);

interface ValidationInfoContext<T> {
	type?: string;
	prevRow?: T | undefined;
	isLastTimeSeries?: boolean;
	keyCount?: Dictionary<number>;
	keyCategoryCount?: Dictionary<number>;
	row?: T;
	rowData?: T[];
	parentRow?: T;
	eltsCount?: Record<string, number>;
}

export type ValidationInfoOptions<T> = {
	includeInContext?: {
		rowData?: boolean;
		parentRow?: boolean;
		keyCategoryCount?: boolean;
		eltsCount?: boolean;
		keyCount?: boolean;
	};
	matchKeyCasing?: boolean;
	filterContextBy?: Array<keyof ValidationInfoContext<T>>;
	skipNestedRowKeyCheck?: boolean;
	skipRowValidationWithParentData?: boolean;
	addCategoryToKeyCount?: boolean;
};

export const titleCase = (input: string) => input.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());

export function addValidationInfo<T extends AdvancedTableRowWithPeriod>(
	rowData: T[],
	getRowSchema: (row: T, index: number) => yup.AnyObjectSchema,
	options?: ValidationInfoOptions<T>,
	extraContext?: Partial<ValidationInfoContext<T>>
): T[] {
	let parentRow: T | undefined = undefined;
	let prevRow: T | undefined = undefined;

	const keyCategoryCount = options?.includeInContext?.keyCategoryCount ? getKeyCategoryCount(rowData) : undefined;
	const eltsCount = options?.includeInContext?.eltsCount ? getELTsCount(rowData) : undefined;

	let keyCount;

	if (options?.includeInContext?.keyCount) {
		if (options?.addCategoryToKeyCount) {
			keyCount = getKeyCategoryCount(rowData);
		} else {
			keyCount = countBy(rowData, 'key');
		}
	}

	return rowData.map((row, index) => {
		let rowToEvaluate = { ...row };
		if (row.key && options?.matchKeyCasing) {
			rowToEvaluate = {
				...rowToEvaluate,
				key: ['ngl', 'btu'].includes(row.key.toLowerCase()) ? row.key.toUpperCase() : titleCase(row.key),
			};
		}
		const type = concatenateKeyCategory({ key: rowToEvaluate.key, category: rowToEvaluate.category });
		const schema = getRowSchema(rowToEvaluate, index);

		const castedRow = schema.cast(rowToEvaluate, { stripUnknown: true, assert: false });

		if (options?.skipNestedRowKeyCheck || (!options?.skipNestedRowKeyCheck && !rowToEvaluate[IS_NESTED_ROW_KEY])) {
			parentRow = castedRow;
			prevRow = undefined;
		}

		const isLastTimeSeries = !rowData[index + 1] || !rowData[index + 1][IS_NESTED_ROW_KEY];

		let context: ValidationInfoContext<T> = {
			type,
			keyCount,
			keyCategoryCount,
			prevRow,
			isLastTimeSeries,
			eltsCount,
			row: rowToEvaluate,
			...(extraContext || {}),
		};

		if (options) {
			const { includeInContext, filterContextBy } = options;
			if (includeInContext?.rowData) {
				context = {
					...context,
					rowData,
				};
			}

			if (includeInContext?.parentRow) {
				context = {
					...context,
					parentRow,
				};
			}

			if (filterContextBy) {
				const oldContext = context;
				let newContext: ValidationInfoContext<T> = {};
				for (const attr of filterContextBy) {
					if (attr in oldContext) {
						newContext = {
							...newContext,
							[attr]: oldContext[attr],
						};
					}
				}

				context = newContext;
			}
		}

		prevRow = castedRow;

		const rowToValidate = options?.skipRowValidationWithParentData
			? rowToEvaluate
			: {
					...rowToEvaluate,
					parentRow,
					isTimeSeriesRow: !!rowToEvaluate[IS_NESTED_ROW_KEY],
			  };

		return {
			...rowToEvaluate,
			[ERROR_KEY]: getObjectSchemaValidationErrors(schema, rowToValidate, { context }),
			[SCHEMA_DESCRIBE_KEY]: schema.describe({ value: rowToValidate }).fields,
		} as T;
	});
}
export const getModelTimeSeriesRows = <T extends AdvancedTableRowWithPeriod>({
	rows,
	criteria,
	assumptionKey,
}: {
	rows: T[];
	criteria: string;
	assumptionKey: BaseAssumptionsCriteriaKeys;
}): BaseAssumptionsCriteriaRows[] => {
	const parsedRows: BaseAssumptionsCriteriaRows[] = [];
	for (const row of rows) {
		const value = Number(row?.value) ?? 0;
		const isDateCriteria =
			BASE_ASSUMPTION_CRITERIA_MAPPINGS[criteria].value === BASE_ASSUMPTION_CRITERIA_MAPPINGS.DATES.value;
		const parsedCriteria = parseAssumptionOptionsRowsCriteria({ row, isDateCriteria });
		parsedRows.push({
			[assumptionKey]: value,
			criteria: parsedCriteria,
		});
	}
	return parsedRows;
};

export type TooltipsByColumnAndValue = {
	[key: string]: {
		[key: string]: string;
	};
};

export function addTooltipInfo<T extends AdvancedTableRowWithPeriod>(
	rowData: T[],
	tooltipsByColumnAndValue: TooltipsByColumnAndValue
): T[] {
	const tooltipsByColumns = Object.keys(tooltipsByColumnAndValue);

	return rowData.map((row) => {
		const columnsWithTooltips = Object.keys(row).filter((column) => tooltipsByColumns.includes(column));
		const columnsAndValuesWithTooltips = columnsWithTooltips.reduce((acc, column) => {
			const columnTooltipValues = Object.keys(tooltipsByColumnAndValue[column]);
			const value = row[column];
			if (columnTooltipValues.includes(value)) {
				acc[column] = {
					[value]: tooltipsByColumnAndValue[column][value],
				};
			}
			return acc;
		}, {} as TooltipsByColumnAndValue);

		return {
			...row,
			[TOOLTIP_MESSAGE_KEY]: !isEmpty(columnsAndValuesWithTooltips) ? columnsAndValuesWithTooltips : null,
		};
	});
}
