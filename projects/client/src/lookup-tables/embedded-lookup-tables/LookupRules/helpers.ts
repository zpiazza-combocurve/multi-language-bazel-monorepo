import { format } from 'date-fns';
import { isNil } from 'lodash';
import { Dispatch, SetStateAction, useCallback, useRef } from 'react';
import * as yup from 'yup';

import { ERROR_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';
import { makeLocal, makeUtc } from '@/helpers/date';
import { DEFAULT_DATE_FORMAT, SUPPORTED_DATE_PARSE_FORMATS, parseMultipleFormats } from '@/helpers/dates';
import { useDebounce } from '@/helpers/debounce';
import { formatBoolean } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { HIGH, LOW } from '@/lookup-tables/shared/constants';

import { NULL_HEADER_VALUE_LABEL, getRangeFieldForWellHeader, getWellHeaderFromRangeField } from '../shared';
import {
	LookupRuleRow,
	LookupRuleWithNestedRows,
	NESTED_ROW_BEHAVIOR_KEY,
	UUID_KEY,
	VIRTUAL_LINES_KEY,
} from '../types';

export const isCellEditable = <T extends AdvancedTableRow = AdvancedTableRow>(
	rowData: LookupRuleRow<T>,
	columnKey: string | undefined,
	chosenHeaders: string[],
	isLookupRuleValueColumnNumerical: (rule: LookupRuleRow<T>, lookupByKey: string) => boolean,
	interpolationHeaderKey: string | undefined
) => {
	const result = { header: '', editable: true };

	if (columnKey) {
		const header = getWellHeaderFromRangeField(columnKey);

		if (chosenHeaders.includes(header)) {
			result.header = header;

			if (
				interpolationHeaderKey &&
				rowData?.[NESTED_ROW_BEHAVIOR_KEY] === RuleWellHeaderMatchBehavior.interpolation &&
				interpolationHeaderKey !== columnKey
			) {
				result.editable = false;
			}
		} else if (
			interpolationHeaderKey &&
			rowData?.[NESTED_ROW_BEHAVIOR_KEY] === RuleWellHeaderMatchBehavior.interpolation &&
			!isLookupRuleValueColumnNumerical(rowData, columnKey)
		) {
			result.editable = false;
		}
	}

	return result;
};

export const formatWellHeaderValue = (
	header: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	value: any,
	type: string,
	interpolationHeaderKey: string | undefined,
	cellRowBehavior: RuleWellHeaderMatchBehavior | undefined
) => {
	if (
		interpolationHeaderKey &&
		cellRowBehavior === RuleWellHeaderMatchBehavior.interpolation &&
		header !== interpolationHeaderKey
	) {
		return undefined;
	}

	switch (type) {
		case FieldType.boolean:
			return formatBoolean(value);

		case FieldType.date: {
			const local = !isNil(value) ? makeLocal(value) : null;
			return !local ? NULL_HEADER_VALUE_LABEL : format(local, DEFAULT_DATE_FORMAT);
		}

		default: {
			if (isNil(value)) {
				return NULL_HEADER_VALUE_LABEL;
			}

			return value;
		}
	}
};

export const mapCombinationToRule = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	combination: Record<string, any>,
	wellHeadersTypes: Record<string, { type: string }>
) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const mapped: Record<string, any> = {};

	Object.entries(combination).forEach(([key, value]) => {
		switch (wellHeadersTypes?.[key]?.type as FieldType) {
			case FieldType.number:
			case FieldType.percent:
			case FieldType.date:
				mapped[getRangeFieldForWellHeader(key, LOW)] = value;
				mapped[getRangeFieldForWellHeader(key, HIGH)] = value;
				break;

			default:
				mapped[key] = value;
				break;
		}
	});

	return mapped;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const parseWellHeaderValue = (value: any, oldValue: any, type: string | undefined) => {
	switch (type) {
		case FieldType.number:
		case FieldType.percent: {
			const parsed = Number(value);
			return isNaN(parsed) || !Number.isFinite(parsed) ? oldValue : parsed;
		}

		case FieldType.date: {
			const parsed = parseMultipleFormats(value, SUPPORTED_DATE_PARSE_FORMATS);
			return parsed ? makeUtc(parsed) : undefined;
		}

		case FieldType.boolean: {
			const normalized = value?.toString?.()?.toLowerCase?.();

			switch (normalized) {
				case 'yes':
				case 'true':
					return true;

				case 'no':
				case 'false':
					return false;

				case '':
				case null:
				case undefined:
				case NULL_HEADER_VALUE_LABEL.toLocaleLowerCase():
					return undefined;

				default:
					return oldValue;
			}
		}

		default:
			return value;
	}
};

export function useDebouncedCellChange(setRuleRows: Dispatch<SetStateAction<LookupRuleRow[]>>) {
	const lastBatchRef = useRef({});

	const applyBatch = useDebounce(() => {
		setRuleRows((ruleRows) => {
			return ruleRows.map((row) => {
				if (lastBatchRef.current[row[UUID_KEY]]) {
					const modified = { ...row, ...lastBatchRef.current[row[UUID_KEY]] };
					return modified;
				}

				return row;
			});
		});

		lastBatchRef.current = {};
	}, 50);

	const handleSingleCellChange = useCallback(
		(nodeId, columnId, newValue, oldValue = null, isHeader = false, type = undefined) => {
			lastBatchRef.current[nodeId] ??= {};
			lastBatchRef.current[nodeId][columnId] ??= isHeader
				? parseWellHeaderValue(newValue, oldValue, type)
				: newValue;
			applyBatch();
		},
		[applyBatch]
	);

	return handleSingleCellChange;
}

export const ruleMatchesWellHeadersCombination = <T extends AdvancedTableRow>(
	rule: LookupRuleRow<T>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	combination: Record<string, any>,
	wellHeaderRangeDefinitionsEntries: [
		string,
		{
			type: string;
			behavior: RuleWellHeaderMatchBehavior;
			colIds: string[];
		}
	][]
) => {
	for (const [header, { behavior, colIds }] of wellHeaderRangeDefinitionsEntries) {
		if (behavior !== RuleWellHeaderMatchBehavior.regular) {
			continue;
		}

		const combinationHeaderValue = combination[header];

		if (isNil(combinationHeaderValue)) {
			//range well header type (ie date, number)
			if (colIds.length === 2) {
				const [lower, upper] = colIds.map((colId) => rule[colId]);

				if (!isNil(lower) || !isNil(upper)) {
					return false;
				}
			} else if (!isNil(rule[header])) {
				return false;
			}
		} else {
			//range well header type (ie date, number)
			if (colIds.length === 2) {
				const [lower, upper] = colIds.map((colId) => rule[colId]);

				if (!isNil(lower) && !isNil(upper)) {
					if (combinationHeaderValue < lower || combinationHeaderValue > upper) {
						return false;
					}
				} else if (!isNil(lower) && isNil(upper)) {
					if (combinationHeaderValue < lower) {
						return false;
					}
				} else if (isNil(lower) && !isNil(upper)) {
					if (combinationHeaderValue > upper) {
						return false;
					}
				} else {
					return false;
				}
			} else if (combinationHeaderValue !== rule[header]) {
				return false;
			}
		}
	}

	return true;
};

export const getWellHeaderRangeDefinitions = (
	headers: string[],
	wellHeadersTypes: Record<string, { type: string }>,
	headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>
) =>
	headers.reduce((acc, curr) => {
		acc[curr] = { type: wellHeadersTypes?.[curr]?.type, behavior: headersMatchBehavior[curr], colIds: [] };

		switch (wellHeadersTypes?.[curr]?.type) {
			case FieldType.number:
			case FieldType.percent:
				switch (headersMatchBehavior[curr]) {
					case RuleWellHeaderMatchBehavior.ratio:
					case RuleWellHeaderMatchBehavior.interpolation:
						acc[curr].colIds.push(curr);
						break;

					case RuleWellHeaderMatchBehavior.regular:
					default:
						acc[curr].colIds.push(
							getRangeFieldForWellHeader(curr, LOW),
							getRangeFieldForWellHeader(curr, HIGH)
						);
						break;
				}
				break;

			case FieldType.date:
				acc[curr].colIds.push(getRangeFieldForWellHeader(curr, LOW), getRangeFieldForWellHeader(curr, HIGH));
				break;

			default:
				acc[curr].colIds.push(curr);
				break;
		}

		return acc;
	}, {} as Record<string, { type: string; behavior: RuleWellHeaderMatchBehavior; colIds: string[] }>);

export const findRuleForWell = <T extends AdvancedTableRow>(
	headers: string[],
	rules: LookupRuleRow<T>[],
	wellHeadersTypes: Record<string, { type: string }>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	well: Record<string, any>,
	headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>
): LookupRuleWithNestedRows<T> | undefined => {
	const wellHeaderRangeDefinitionsEntries = Object.entries(
		getWellHeaderRangeDefinitions(headers, wellHeadersTypes, headersMatchBehavior)
	);

	for (let i = 0; i < rules.length; ++i) {
		const root = rules[i];

		if (root[NESTED_ROW_BEHAVIOR_KEY]) {
			continue;
		}

		if (ruleMatchesWellHeadersCombination(root, well, wellHeaderRangeDefinitionsEntries)) {
			const matchedRule: LookupRuleWithNestedRows<T> = { root, nested: [] };
			let nestedIterator = i + 1;

			while (nestedIterator < rules.length && rules[nestedIterator][NESTED_ROW_BEHAVIOR_KEY]) {
				matchedRule.nested.push(rules[nestedIterator]);
				++nestedIterator;
			}

			return matchedRule;
		}
	}

	return undefined;
};

export function getHeadersValidationSchema(
	headersDefinitions: Record<string, { type: string; behavior: RuleWellHeaderMatchBehavior; colIds: string[] }>,
	wellHeadersLabels: Record<string, string>
): yup.Schema {
	return yup.object(
		Object.entries(headersDefinitions).reduce((acc, [field, { type, behavior, colIds }]) => {
			const fieldType = type as FieldType;

			switch (fieldType) {
				case FieldType.number:
				case FieldType.percent: {
					switch (behavior) {
						case RuleWellHeaderMatchBehavior.regular: {
							const [minField, maxField] = colIds;
							const numberFieldSchemaBase = yup
								.number()
								.optional()
								.nullable()
								.label(wellHeadersLabels[field]);

							acc[minField] =
								fieldType === FieldType.percent ? numberFieldSchemaBase.min(0) : numberFieldSchemaBase;

							acc[maxField] = (
								fieldType === FieldType.percent ? numberFieldSchemaBase.max(100) : numberFieldSchemaBase
							).when([`${minField}`], ([minValue], schema) => {
								return schema.test('valid-number-range', (maxValue, testContext) => {
									if (!isNil(minValue) && !isNil(maxValue) && minValue > maxValue) {
										return testContext.createError({ message: `Max can't be smaller than Min` });
									}

									return true;
								});
							});

							break;
						}

						case RuleWellHeaderMatchBehavior.ratio: {
							let schema = yup
								.number()
								.transform((_, val) => (isNil(val) ? undefined : val))
								.required()
								.notOneOf([0], 'Value can not be 0')
								.label(wellHeadersLabels[field]);

							if (fieldType === FieldType.percent) {
								schema = schema.min(0).max(100);
							}

							acc[field] = schema;

							break;
						}

						case RuleWellHeaderMatchBehavior.interpolation: {
							let schema = yup
								.number()
								.transform((_, val) => (isNil(val) ? undefined : val))
								.required()
								.label(wellHeadersLabels[field]);

							if (fieldType === FieldType.percent) {
								schema = schema.min(0).max(100);
							}

							acc[field] = schema.when(
								['$currentRow', '$previousRow', '$nextRow'],
								([$currentRow, $previousRow, $nextRow], schema) => {
									return schema.test('valid-interpolation', (value, testContext) => {
										const current = $currentRow as LookupRuleRow;
										const previous = $previousRow as LookupRuleRow | undefined;
										const next = $nextRow as LookupRuleRow | undefined;

										if (!current[NESTED_ROW_BEHAVIOR_KEY]) {
											//first row of the interpolation rule
											if (!next || !next[NESTED_ROW_BEHAVIOR_KEY]) {
												return testContext.createError({
													message: 'Rule with interpolation should have at least 2 rows',
												});
											}
										}
										//not first row of the interpolation rule
										else {
											if (!previous) {
												return testContext.createError({
													message: `Missing first interpolation value`,
												});
											}

											if (previous[field] === value) {
												return testContext.createError({
													message: `Value can't be the same as previous`,
												});
											}
										}

										return true;
									});
								}
							);

							break;
						}

						default:
							break;
					}

					break;
				}

				case FieldType.date: {
					const [startDateField, endDateField] = colIds;
					const dateFieldSchemaBase = yup.date().optional().nullable().label(wellHeadersLabels[field]);

					acc[startDateField] = dateFieldSchemaBase;
					acc[endDateField] = dateFieldSchemaBase.when([`${startDateField}`], ([startDateValue], schema) => {
						return schema.test('valid-date-range', (endDateValue, testContext) => {
							if (!isNil(startDateValue) && !isNil(endDateValue) && startDateValue > endDateValue) {
								return testContext.createError({ message: `End can't be smaller than Start` });
							}

							return true;
						});
					});

					break;
				}

				default:
					break;
			}

			return acc;
		}, {} as Record<string, yup.Schema>)
	);
}

export const checkRuleValueCellsAreValid = (rulesRows: LookupRuleRow<AdvancedTableRow>[]) =>
	rulesRows.every((rule) => !!rule[VIRTUAL_LINES_KEY]?.every((line) => !Object.keys(line[ERROR_KEY] ?? {}).length));
