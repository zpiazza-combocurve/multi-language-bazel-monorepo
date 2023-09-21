import { ColDef, ColGroupDef, ValueGetterParams } from 'ag-grid-community';
import { isNil, omit, pick, times } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import { FreeSoloCellEditor, wrapValue } from '@/components/AdvancedTable/ag-grid-shared';
import {
	ERROR_KEY,
	IS_NESTED_ROW_KEY,
	LOOKUP_BY_FIELDS_KEY,
	LT_CELL_STRING_VALUE,
	ROW_ID_KEY,
	SCHEMA_DESCRIBE_KEY,
	TREE_DATA_KEY,
} from '@/components/AdvancedTable/constants';
import { getWithNestedRows } from '@/components/AdvancedTable/shared';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';
import { Editors } from '@/components/AgGrid';
import { formatBoolean } from '@/helpers/utilities';
import { FieldType } from '@/inpt-shared/constants';
import {
	RuleWellHeaderMatchBehavior,
	RuleWellHeaderMatchBehaviorLabel,
} from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';
import { HIGH, LOW } from '@/lookup-tables/shared/constants';
import { LOOKUP_TABLES_OPERATORS } from '@/lookup-tables/shared/utils';

import { LookupCellRenderer } from './LookupCellRenderer';
import {
	EmbeddedLookupTableModel,
	LookupByKeysMapping,
	LookupRuleRow,
	LookupRuleWithNestedRows,
	NESTED_ROW_BEHAVIOR_KEY,
	UUID_KEY,
	VIRTUAL_LINES_KEY,
} from './types';

export const LOOKUP_BY_KEY_DIVIDER = '-';
export const WELL_HEADER_DELIMITER = '___';

export const NULL_HEADER_VALUE_LABEL = 'N/A';

export const defaultColDef = {
	lockPinned: true,
	lockPosition: true,
	lockVisible: true,
	resizable: true,
	sortable: true,
	suppressMovable: true,
};

export const generateLookupByKey = (field: string) =>
	`${uuidv4().replaceAll(LOOKUP_BY_KEY_DIVIDER, '')}${LOOKUP_BY_KEY_DIVIDER}${field}`;

export const getFieldFromLookupByKey = (lookupByKey: string) => lookupByKey.split(LOOKUP_BY_KEY_DIVIDER).pop();

export const getRangeFieldForWellHeader = (header: string, postfix: string) =>
	`${header}${WELL_HEADER_DELIMITER}${postfix}`;

const getWellHeaderAndPostfixFromRangeField = (rangeField: string) => rangeField.split(WELL_HEADER_DELIMITER);
export const getWellHeaderFromRangeField = (rangeField: string) => getWellHeaderAndPostfixFromRangeField(rangeField)[0];

export const getWellHeaderColGroupDef = (
	key: string,
	label: string,
	type: string,
	behavior: RuleWellHeaderMatchBehavior,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	options: any[]
): ColGroupDef => {
	switch (type as FieldType) {
		case FieldType.number:
		case FieldType.percent:
			switch (behavior) {
				case RuleWellHeaderMatchBehavior.ratio:
				case RuleWellHeaderMatchBehavior.interpolation:
					return {
						headerName: label,
						children: [
							{
								...defaultColDef,
								field: key,
								headerName: RuleWellHeaderMatchBehaviorLabel[behavior]?.(),
								type,
								pinned: true,
								cellEditor: Editors.NumberEditor,
							},
						],
					};

				case RuleWellHeaderMatchBehavior.regular:
				default:
					return {
						headerName: label,
						children: [
							{
								...defaultColDef,
								field: getRangeFieldForWellHeader(key, LOW),
								headerName: 'Min (>=)',
								type,
								pinned: true,
								cellEditor: Editors.NumberEditor,
							},
							{
								...defaultColDef,
								field: getRangeFieldForWellHeader(key, HIGH),
								headerName: 'Max (<=)',
								type,
								pinned: true,
								cellEditor: Editors.NumberEditor,
							},
						],
					};
			}

		case FieldType.date:
			return {
				headerName: label,
				children: [
					{
						...defaultColDef,
						field: getRangeFieldForWellHeader(key, LOW),
						headerName: 'Start (>=)',
						type,
						pinned: true,
						cellEditor: Editors.TextEditor,
					},
					{
						...defaultColDef,
						field: getRangeFieldForWellHeader(key, HIGH),
						headerName: 'End (<=)',
						type,
						pinned: true,
						cellEditor: Editors.TextEditor,
					},
				],
			};

		case FieldType.boolean:
			return {
				headerName: label,
				children: [
					{
						...defaultColDef,
						field: key,
						headerName: RuleWellHeaderMatchBehaviorLabel[behavior]?.(type as FieldType),
						type,
						pinned: true,
						cellEditor: FreeSoloCellEditor,
						cellEditorParams: {
							options: [true, false, undefined],
							getOptionLabel: formatBoolean,
							freeSolo: false,
						},
					},
				],
			};

		default:
			return {
				headerName: label,
				children: [
					{
						...defaultColDef,
						field: key,
						headerName: RuleWellHeaderMatchBehaviorLabel[behavior]?.(type as FieldType),
						pinned: true,
						cellEditor: FreeSoloCellEditor,
						cellEditorParams: {
							options,
							getOptionLabel: (value) => (isNil(value) ? NULL_HEADER_VALUE_LABEL : value),
						},
					},
				],
			};
	}
};

// TODO: improve performance for this
export const getLineByLookupByKey = <T extends AdvancedTableRow>(lookupByKey: string, lineRows: T[]): T | null => {
	for (let i = 0; i < lineRows.length; ++i) {
		if (Object.values(lineRows[i][LOOKUP_BY_FIELDS_KEY] ?? {}).includes(lookupByKey)) {
			return lineRows[i];
		}
	}

	return null;
};

// TODO: improve performance for this
export const getParentLineByLookupByKey = <T extends AdvancedTableRow>(
	lookupByKey: string,
	lineRows: T[]
): T | null => {
	for (let i = 0; i < lineRows.length; ++i) {
		if (Object.values(lineRows[i][LOOKUP_BY_FIELDS_KEY] ?? {}).includes(lookupByKey)) {
			if (!lineRows[i][IS_NESTED_ROW_KEY]) {
				return lineRows[i];
			}

			for (let j = i - 1; j >= 0; --j) {
				if (!lineRows[j][IS_NESTED_ROW_KEY]) {
					return lineRows[j];
				}
			}

			// technically code should never reach here, but just to be sure we don't do redundant iterations
			return null;
		}
	}

	return null;
};

const mapLinesToRows = <T extends AdvancedTableRow>(
	lines: Inpt.EmbeddedLookupTableLine[][],
	nestedLineFieldsAllowedForLookupBy: string[] = [],
	applyLineToRowTransformation: (line: T, parentLine: T | null, previousLines: T[]) => T
): { rows: T[]; lookupByKeysMapping: LookupByKeysMapping } => {
	const getRowBase = () => ({ [ROW_ID_KEY]: uuidv4() } as T);
	const rows: T[] = [];
	const lookupByKeysMapping: LookupByKeysMapping = {};

	lines.forEach((lineKeyValuePairs) => {
		const nestedLineFieldsWithActualValuesDict = lineKeyValuePairs.reduce((acc, { key, value }) => {
			if (Array.isArray(value)) {
				acc[key] = value;
			}

			return acc;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		}, {} as Record<string, any[]>);

		const nestedLineFieldsWithActualValues = Object.keys(nestedLineFieldsWithActualValuesDict);
		const lookupByKeyValuePairs: Inpt.EmbeddedLookupTableLine[] = [];
		const regularKeyValuePairs: Inpt.EmbeddedLookupTableLine[] = [];

		if (nestedLineFieldsWithActualValues.length) {
			//all nested fields within the line should have the same length of 'value' array
			//first value of the array is the value is of the 'parent' row, rest - nested rows
			const lineRowsCount = nestedLineFieldsWithActualValuesDict[nestedLineFieldsWithActualValues[0]].length;
			const nestedLineLookupByKeyValuePairs: Inpt.EmbeddedLookupTableLine[] = [];

			lineKeyValuePairs.forEach((keyValuePair) => {
				if (!nestedLineFieldsWithActualValues.includes(keyValuePair.key)) {
					if (keyValuePair.lookup) {
						if (nestedLineFieldsAllowedForLookupBy.includes(keyValuePair.key)) {
							nestedLineLookupByKeyValuePairs.push(keyValuePair);
							lookupByKeysMapping[keyValuePair.lookup] = {
								field: keyValuePair.key,
								nestedKeysOrdered: [
									keyValuePair.lookup,
									...times(lineRowsCount - 1, () => generateLookupByKey(keyValuePair.key)),
								],
							};
						} else {
							lookupByKeyValuePairs.push(keyValuePair);
							lookupByKeysMapping[keyValuePair.lookup] = {
								field: keyValuePair.key,
								nestedKeysOrdered: [],
							};
						}
					} else {
						regularKeyValuePairs.push(keyValuePair);
					}
				}
			});

			let parentRow: T | null = null;

			for (
				//0 is actually not nested row, but the line (i.e. 'parent') itself
				let nestedLineIndex = 0;
				nestedLineIndex < lineRowsCount;
				++nestedLineIndex
			) {
				const lookupByKeyValuePairsToUse = nestedLineIndex
					? nestedLineLookupByKeyValuePairs
					: [...lookupByKeyValuePairs, ...nestedLineLookupByKeyValuePairs];

				const row = {
					...getRowBase(),
					...(!nestedLineIndex
						? regularKeyValuePairs.reduce((acc, keyValuePair) => {
								acc[keyValuePair.key] = keyValuePair.value;
								return acc;
								// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						  }, {} as Record<string, any>)
						: {}),
					...nestedLineFieldsWithActualValues.reduce((acc, field) => {
						acc[field] = nestedLineFieldsWithActualValuesDict[field][nestedLineIndex];
						return acc;
						// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
					}, {} as Record<string, any>),
					[LOOKUP_BY_FIELDS_KEY]: lookupByKeyValuePairsToUse.reduce((acc, keyValuePair) => {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						acc[keyValuePair.key] = lookupByKeysMapping[keyValuePair.lookup!].nestedKeysOrdered.length
							? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							  lookupByKeysMapping[keyValuePair.lookup!].nestedKeysOrdered[nestedLineIndex]
							: // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
							  keyValuePair.lookup!;
						return acc;
					}, {} as Record<string, string>),
					[IS_NESTED_ROW_KEY]: !!nestedLineIndex,
				};

				parentRow = !nestedLineIndex ? row : parentRow;
				const transformed = applyLineToRowTransformation(row, parentRow, rows);
				rows.push(transformed);
			}
		} else {
			lineKeyValuePairs.forEach((keyValuePair) => {
				if (keyValuePair.lookup) {
					lookupByKeyValuePairs.push(keyValuePair);
					lookupByKeysMapping[keyValuePair.lookup] = { field: keyValuePair.key, nestedKeysOrdered: [] };
				} else {
					regularKeyValuePairs.push(keyValuePair);
				}
			});

			const row = {
				...getRowBase(),
				...regularKeyValuePairs.reduce((acc, keyValuePair) => {
					acc[keyValuePair.key] = keyValuePair.value;
					return acc;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
				}, {} as Record<string, any>),
				[LOOKUP_BY_FIELDS_KEY]: lookupByKeyValuePairs.reduce((acc, keyValuePair) => {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
					acc[keyValuePair.key] = keyValuePair.lookup!;
					return acc;
				}, {} as Record<string, string>),
			};

			const transformed = applyLineToRowTransformation(row, null, rows);
			rows.push(transformed);
		}
	});

	return { rows, lookupByKeysMapping };
};

const mapRowsToLines = <T extends AdvancedTableRow>(
	rows: T[],
	nestedLineFieldsAllowedToHaveValue: string[],
	nestedLineFieldsAllowedForLookupBy: string[],
	applyRowToLineTransformation: (row: T) => T
): { lines: Inpt.EmbeddedLookupTableLine[][]; lookupByKeysMapping: LookupByKeysMapping } => {
	const lookupByKeysMapping: LookupByKeysMapping = {};

	const withNested = getWithNestedRows(rows);
	const lines = withNested.reduce((acc, row) => {
		const keyValuePairs: Record<string, Pick<Inpt.EmbeddedLookupTableLine, 'value' | 'lookup'>> = {};

		// Save columns that have values and extend the object with lookup by in case keys for them are not present in the main object
		const transformedRoot = {
			...pick(applyRowToLineTransformation(row.root), Object.keys(row.root)),
			...(row.root[LOOKUP_BY_FIELDS_KEY] ?? {}),
		};

		Object.entries(transformedRoot).forEach(([key, value]) => {
			keyValuePairs[key] = {};

			if (row.root[LOOKUP_BY_FIELDS_KEY]?.[key]) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
				keyValuePairs[key].lookup = row.root[LOOKUP_BY_FIELDS_KEY]![key];
				lookupByKeysMapping[row.root[LOOKUP_BY_FIELDS_KEY][key]] = {
					field: key,
					nestedKeysOrdered: nestedLineFieldsAllowedForLookupBy.includes(key)
						? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
						  row.nested.map((nestedRow) => nestedRow[LOOKUP_BY_FIELDS_KEY]![key])
						: [],
				};
			} else {
				//at first assume all have nested, so assign value array. Later reassign it if length of the array is 1
				keyValuePairs[key].value = [value];
			}
		});

		row.nested.forEach((nestedRow) => {
			Object.entries(nestedRow).forEach(([key, value]) => {
				if (nestedLineFieldsAllowedToHaveValue.includes(key) && keyValuePairs[key]?.value) {
					keyValuePairs[key].value.push(value);
				}
			});
		});

		const castedKeyValuePairs = Object.entries(keyValuePairs).reduce((acc, [key, value]) => {
			const keyValuePair: Inpt.EmbeddedLookupTableLine = { key };

			if (value.lookup) {
				keyValuePair.lookup = value.lookup;
			} else {
				//if value is array with more than 1 element, means current elt line has nested rows
				if (value.value.length > 1) {
					keyValuePair.value = value.value;
				}
				//otherwise we keep it as not one-elem array, but that only elem for that array
				else {
					keyValuePair.value = value.value[0];
				}
			}

			acc.push(keyValuePair);
			return acc;
		}, [] as Inpt.EmbeddedLookupTableLine[]);

		acc.push(castedKeyValuePairs);

		return acc;
	}, [] as Inpt.EmbeddedLookupTableLine[][]);

	return { lines, lookupByKeysMapping };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const parseConditionValue = (key: string, value: any, types: Record<string, { type: string }>) => {
	switch (types?.[key]?.type) {
		case FieldType.date:
			return value ? new Date(value) : value;

		default:
			return value;
	}
};

export const combineRulesData = (inputArray: Inpt.EmbeddedLookupTableRule[]): Inpt.EmbeddedLookupTableRule[] => {
	return inputArray.reduce(
		(
			accumulatedValue,
			currentValue: Inpt.EmbeddedLookupTableRule,
			currentIndex
		): Inpt.EmbeddedLookupTableRule[] => {
			if (currentIndex === 0) {
				return [currentValue];
			}

			const accumulatedCombinedData = { ...accumulatedValue[0] };

			const currentConditions = currentValue.conditions[0];
			const currentValues = currentValue.values[0];

			const accumulatedConditions = accumulatedCombinedData.conditions[0];
			const accumulatedValues = accumulatedCombinedData.values[0];

			if (currentConditions) {
				const newChildrenConditions = [currentConditions.value, ...(currentConditions.childrenValues ?? [])];

				if (accumulatedConditions.childrenValues) {
					accumulatedConditions.childrenValues =
						accumulatedConditions.childrenValues.concat(newChildrenConditions);
				} else {
					accumulatedConditions.childrenValues = newChildrenConditions;
				}
			}

			if (currentValues) {
				const newChildrenValues = [currentValues.value, ...(currentValues.childrenValues ?? [])];

				if (accumulatedValues.childrenValues) {
					accumulatedValues.childrenValues = accumulatedValues.childrenValues.concat(newChildrenValues);
				} else {
					accumulatedValues.childrenValues = newChildrenValues;
				}
			}

			return [{ ...accumulatedCombinedData, conditions: [accumulatedConditions], values: [accumulatedValues] }];
		},
		[] as Inpt.EmbeddedLookupTableRule[]
	);
};

const mapRulesToRows = <T extends AdvancedTableRow = AdvancedTableRow>(
	rules: Inpt.EmbeddedLookupTableRule[],
	wellHeadersTypes: Record<string, { type: string }>,
	lookupByKeysMapping: LookupByKeysMapping,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	applyRuleValuesToLookupRuleRowValuesTransformation: (rawRuleValues: Record<string, any>) => Record<string, any>,
	allRowsShouldInterpolate: boolean
): LookupRuleRow<T>[] => {
	const rows: LookupRuleRow<T>[] = [];

	const rulesToMap = allRowsShouldInterpolate ? combineRulesData(rules) : rules;

	rulesToMap.forEach((rule) => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const ruleHeaders: Record<string, any> = {};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const ruleNestedHeaders: Record<string, any>[] = [];

		[...rule.conditions].forEach(({ key, operator, value, childrenValues }) => {
			let agGridColId = key;

			switch (operator) {
				case LOOKUP_TABLES_OPERATORS.GREATER_THAN_EQUAL:
					agGridColId = getRangeFieldForWellHeader(key, LOW);
					break;

				case LOOKUP_TABLES_OPERATORS.LESS_THAN_EQUAL:
					agGridColId = getRangeFieldForWellHeader(key, HIGH);
					break;

				default:
					break;
			}

			ruleHeaders[agGridColId] = parseConditionValue(key, value, wellHeadersTypes);

			if (childrenValues) {
				for (let i = 0; i < childrenValues.length; ++i) {
					if (ruleNestedHeaders.length - 1 < i) {
						ruleNestedHeaders.push({});
					}

					ruleNestedHeaders[i][agGridColId] = parseConditionValue(key, childrenValues[i], wellHeadersTypes);
				}
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const rawRuleValues: Record<string, any> = {};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		const rawRuleNestedValues: Record<string, any>[] = ruleNestedHeaders.map(() => ({}));

		[...rule.values].forEach(({ key, value, childrenValues }) => {
			//nested line
			if (Array.isArray(value)) {
				value.forEach((val, i) => {
					rawRuleValues[lookupByKeysMapping[key] ? lookupByKeysMapping[key].nestedKeysOrdered[i] : key] = val;
				});

				if (childrenValues && childrenValues.length > 0) {
					rawRuleNestedValues.forEach((nestedRow, nestedRowIndex) => {
						value.forEach((_, nestedValueIndex) => {
							nestedRow[
								lookupByKeysMapping[key]
									? lookupByKeysMapping[key].nestedKeysOrdered[nestedValueIndex]
									: key
							] = childrenValues[nestedRowIndex]?.[nestedValueIndex];
						});
					});
				}
			}
			//regular line
			else {
				rawRuleValues[key] = value;

				if (childrenValues && childrenValues.length > 0) {
					rawRuleNestedValues.forEach((nestedRow, i) => {
						nestedRow[key] = childrenValues[i];
					});
				}
			}
		});

		const transformedRuleValues = applyRuleValuesToLookupRuleRowValuesTransformation(rawRuleValues);
		const transformedRuleNestedValues = rawRuleNestedValues.map((rawNested) =>
			pick(
				applyRuleValuesToLookupRuleRowValuesTransformation({ ...rawRuleValues, ...rawNested }),
				Object.keys(rawNested)
			)
		);

		const parentRowId = uuidv4();
		const row: LookupRuleRow<T> = {
			[UUID_KEY]: parentRowId,
			[TREE_DATA_KEY]: [parentRowId],
			...ruleHeaders,
			...transformedRuleValues,
		};

		rows.push(row);

		ruleNestedHeaders.forEach((nestedRule, i) => {
			const nestedRowId = uuidv4();
			const nestedRow: LookupRuleRow<T> = {
				[UUID_KEY]: nestedRowId,
				[TREE_DATA_KEY]: [parentRowId, nestedRowId],
				...nestedRule,
				...transformedRuleNestedValues[i],
				//TODO: will require setting this from some logic in case nested would be not only interpolation,
				//but is enough for now
				[NESTED_ROW_BEHAVIOR_KEY]: RuleWellHeaderMatchBehavior.interpolation,
			};

			rows.push(nestedRow);
		});
	});

	return rows;
};

export const getWithNestedRules = <T extends AdvancedTableRow = AdvancedTableRow>(rows: LookupRuleRow<T>[]) =>
	rows.reduce((acc, row) => {
		if (row[NESTED_ROW_BEHAVIOR_KEY]) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			acc.at(-1)!.nested.push(row);
		} else {
			acc.push({ root: row, nested: [] });
		}

		return acc;
	}, [] as LookupRuleWithNestedRows<T>[]);

const mapRowsToRules = <T extends AdvancedTableRow = AdvancedTableRow>(
	rows: LookupRuleRow<T>[],
	wellHeaderAgGridColIds: string[],
	headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>,
	lookupByKeysMapping: LookupByKeysMapping,
	isLookupRuleValueColumnNumerical: (rule: LookupRuleRow<T>, lookupByKey: string) => boolean,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	applyLookupRuleRowValueToRuleValueTransformation: (lookupByKey: string, value: any) => any
): Inpt.EmbeddedLookupTableRule[] => {
	if (!rows.length) {
		return [];
	}

	const withNested = getWithNestedRules(rows);
	const interpolationHeaderKey = Object.entries(headersMatchBehavior).find(
		([, behavior]) => behavior === RuleWellHeaderMatchBehavior.interpolation
	)?.[0];
	const rules: Inpt.EmbeddedLookupTableRule[] = [];

	withNested.forEach(({ root, nested }) => {
		const conditions: Inpt.EmbeddedLookupTableRuleCondition[] = [];
		const ruleValues: Inpt.EmbeddedLookupTableRuleValue[] = [];

		wellHeaderAgGridColIds.forEach((colId) => {
			const [wellHeader, postfix] = getWellHeaderAndPostfixFromRangeField(colId);

			let operator = LOOKUP_TABLES_OPERATORS.EQUAL;

			switch (postfix) {
				case LOW:
					operator = LOOKUP_TABLES_OPERATORS.GREATER_THAN_EQUAL;
					break;

				case HIGH:
					operator = LOOKUP_TABLES_OPERATORS.LESS_THAN_EQUAL;
					break;

				default:
					break;
			}

			const condition: Inpt.EmbeddedLookupTableRuleCondition = {
				key: wellHeader,
				operator,
				value: root[colId],
			};

			if (nested.length && wellHeader === interpolationHeaderKey) {
				condition.childrenValues = nested.map((nestedRow) => nestedRow[colId]);
			}

			conditions.push(condition);
		});

		Object.entries(lookupByKeysMapping).forEach(([key, value]) => {
			const ruleValue: Inpt.EmbeddedLookupTableRuleValue = { key };

			//with nested lines
			if (value.nestedKeysOrdered.length) {
				ruleValue.value = [
					applyLookupRuleRowValueToRuleValueTransformation(key, root[key]),
					...value.nestedKeysOrdered.map((nestedLineLookupByKey) =>
						applyLookupRuleRowValueToRuleValueTransformation(
							nestedLineLookupByKey,
							root[nestedLineLookupByKey]
						)
					),
				];

				if (interpolationHeaderKey && isLookupRuleValueColumnNumerical(root, key)) {
					ruleValue.childrenValues = nested.map((nestedRow) => [
						applyLookupRuleRowValueToRuleValueTransformation(key, nestedRow[key]),
						...value.nestedKeysOrdered.map((nestedLineLookupByKey) =>
							applyLookupRuleRowValueToRuleValueTransformation(
								nestedLineLookupByKey,
								nestedRow[nestedLineLookupByKey]
							)
						),
					]);
				}
			}
			//lookup by single cell
			else {
				ruleValue.value = applyLookupRuleRowValueToRuleValueTransformation(key, root[key]);

				if (interpolationHeaderKey && isLookupRuleValueColumnNumerical(root, key)) {
					ruleValue.childrenValues = nested.map((nestedRow) =>
						applyLookupRuleRowValueToRuleValueTransformation(key, nestedRow[key])
					);
				}
			}

			ruleValues.push(ruleValue);
		});

		rules.push({ conditions, values: ruleValues });
	});

	return rules;
};

export const getFieldAndVirtualLineByLookupByKey = <T extends AdvancedTableRow>(
	row: LookupRuleRow<T>,
	lookupByKey: string
) => {
	if (row[VIRTUAL_LINES_KEY]) {
		for (let i = 0; i < row[VIRTUAL_LINES_KEY].length; ++i) {
			const virtualLine = row[VIRTUAL_LINES_KEY][i];
			const lookupByFields = Object.entries(virtualLine[LOOKUP_BY_FIELDS_KEY] ?? {});

			for (let j = 0; j < lookupByFields.length; ++j) {
				const [field, _lookupByKey] = lookupByFields[j] as string[];

				if (lookupByKey === _lookupByKey) {
					return { virtualLine, field };
				}
			}
		}
	}
	return { virtualLine: undefined, field: undefined };
};

export const getLookupRuleRowFieldValidationError = <T extends AdvancedTableRow>(
	row: LookupRuleRow<T>,
	lookupByKey: string
): string | undefined => {
	const { virtualLine, field } = getFieldAndVirtualLineByLookupByKey(row, lookupByKey);

	if (virtualLine && field) {
		return virtualLine[ERROR_KEY]?.[field];
	}

	return undefined;
};

export const getVirtualLinesForLookupRuleRow = <T extends AdvancedTableRow>(
	lines: T[],
	ruleRow: LookupRuleRow<T>,
	parentRuleRow?: LookupRuleRow<T>,
	shouldUseParentRowColumnValue: (nestedRow: LookupRuleRow<T>, lookupByKey: string) => boolean = () => true,
	isLookupRuleRowValueCellDisabled: (virtualLine: T, field: string) => boolean = () => false
) =>
	lines.reduce((virtualLines, line) => {
		const virtualLine = { ...line };

		Object.entries(line[LOOKUP_BY_FIELDS_KEY] ?? {}).forEach(([field, lookupByKey]) => {
			const ruleRowValue = ruleRow[lookupByKey];

			// logic is that if we have nested rule rows (e.g. for interpolation), we need to take all from the parent
			// and then override by the current row if it is not nil
			if (
				parentRuleRow &&
				parentRuleRow[UUID_KEY] !== ruleRow[UUID_KEY] &&
				shouldUseParentRowColumnValue(ruleRow, lookupByKey)
			) {
				virtualLine[field] = parentRuleRow[lookupByKey];

				if (!isNil(ruleRowValue)) {
					virtualLine[field] = ruleRowValue;
				}
			} else {
				// setting the dummy string to force input correct value as existing validation reads undefined/''/null
				// as default value which should not be the case for the lookup rule values
				virtualLine[field] =
					isNil(ruleRowValue) && !isLookupRuleRowValueCellDisabled(virtualLine, field)
						? 'invalid_value'
						: ruleRowValue;
			}
		});

		virtualLines.push(virtualLine);
		return virtualLines;
	}, [] as T[]);

function getELTRuleWellHeadersMatchBehavior(
	configuration: Inpt.EmbeddedLookupTableConfiguration
): Record<string, RuleWellHeaderMatchBehavior> {
	if (configuration.selectedHeaders) {
		if (
			configuration.selectedHeadersMatchBehavior &&
			Object.keys(configuration.selectedHeadersMatchBehavior).length === configuration.selectedHeaders.length
		) {
			return configuration.selectedHeadersMatchBehavior as Record<string, RuleWellHeaderMatchBehavior>;
		}

		return configuration.selectedHeaders.reduce((acc, header) => {
			acc[header] = RuleWellHeaderMatchBehavior.regular;
			return acc;
		}, {} as Record<string, RuleWellHeaderMatchBehavior>);
	}

	return {};
}

function checkHeadersByBehavior(headersMatchBehavior: Record<string, string>, behavior: RuleWellHeaderMatchBehavior) {
	const selectedHeadersMatchBehaviors = Object.values(headersMatchBehavior);

	return selectedHeadersMatchBehaviors.length === 1 && selectedHeadersMatchBehaviors[0] === behavior;
}

export const checkIfAllRowsShouldInterpolate = (headersMatchBehavior: Record<string, string>): boolean => {
	return checkHeadersByBehavior(headersMatchBehavior, RuleWellHeaderMatchBehavior.interpolation);
};

export const checkIfAllRowsShouldBeRatioed = (headersMatchBehavior: Record<string, string>): boolean => {
	return checkHeadersByBehavior(headersMatchBehavior, RuleWellHeaderMatchBehavior.ratio);
};

export const checkIfAllRowsShouldBeInterpolatedOrRatioed = (headersMatchBehavior: Record<string, string>): boolean => {
	return checkIfAllRowsShouldInterpolate(headersMatchBehavior) || checkIfAllRowsShouldBeRatioed(headersMatchBehavior);
};

export const getEmbeddedLookupTableModel = <T extends AdvancedTableRow = AdvancedTableRow>(
	elt: Inpt.EmbeddedLookupTable,
	nestedLineFieldsAllowedForLookupBy: string[],
	wellHeadersTypes: Record<string, { type: string }>,
	applyLineToRowTransformation: (line: T, parentLine: T | null, previousLines: T[]) => T,
	applyRuleValuesToLookupRuleRowValuesTransformation: (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		rawRuleValues: Record<string, any>,
		lineRows: T[]
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) => Record<string, any>
): EmbeddedLookupTableModel<T> => {
	const { rows: lines, lookupByKeysMapping } = mapLinesToRows<T>(
		elt.lines,
		nestedLineFieldsAllowedForLookupBy,
		applyLineToRowTransformation
	);

	const allRowsShouldInterpolate = checkIfAllRowsShouldInterpolate(
		elt.configuration.selectedHeadersMatchBehavior ?? {}
	);

	const rules = mapRulesToRows<T>(
		elt.rules,
		wellHeadersTypes,
		lookupByKeysMapping,
		(rawRuleValues) => applyRuleValuesToLookupRuleRowValuesTransformation(rawRuleValues, lines),
		allRowsShouldInterpolate
	) as LookupRuleRow<T>[];

	return {
		...omit(elt, ['lines', 'rules', 'configuration']),
		configuration: {
			...elt.configuration,
			selectedHeadersMatchBehavior: getELTRuleWellHeadersMatchBehavior(elt.configuration),
		},
		lines,
		rules,
	};
};

export const getLinesAndRulesFromRows = <T extends AdvancedTableRow = AdvancedTableRow>(
	advancedTableRows: T[],
	lookupRuleRows: LookupRuleRow<T>[],
	wellHeaderAgGridColIds: string[],
	headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>,
	nestedLineFieldsAllowedToHaveValue: string[],
	nestedLineFieldsAllowedForLookupBy: string[],
	isLookupRuleValueColumnNumerical: (rule: LookupRuleRow<T>, lookupByKey: string) => boolean,
	applyRowToLineTransformation: (row: T) => T,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	applyLookupRuleRowValueToRuleValueTransformation: (lookupByKey: string, value: any, lineRows: T[]) => any
) => {
	const { lines, lookupByKeysMapping } = mapRowsToLines(
		advancedTableRows,
		nestedLineFieldsAllowedToHaveValue,
		nestedLineFieldsAllowedForLookupBy,
		applyRowToLineTransformation
	);
	const rules = mapRowsToRules<T>(
		lookupRuleRows,
		wellHeaderAgGridColIds,
		headersMatchBehavior,
		lookupByKeysMapping,
		isLookupRuleValueColumnNumerical,
		(lookupByKey, value) => applyLookupRuleRowValueToRuleValueTransformation(lookupByKey, value, advancedTableRows)
	);

	return {
		lines,
		rules,
	};
};

export const mapToELTColumnsDef = (
	assumptionColumnsDef: ColGroupDef[],
	notAllowedTooLookupByColumns: string[],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	valueGetterWrapValueAdditions: (params: ValueGetterParams) => any = () => {
		return {};
	}
) =>
	assumptionColumnsDef.map((prop) => ({
		...prop,
		children: prop.children.map((child: ColDef) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			if (notAllowedTooLookupByColumns.includes(child.field!)) {
				return child;
			}

			return {
				...child,
				valueGetter: (params) => {
					// If current cell id exists in the lookup record, we return an explicit 'LT' as a value.
					// This is needed to display 'LT' in the exported CSV/Excel document.
					if (params.data?.[LOOKUP_BY_FIELDS_KEY]?.[params.column.getId()]) {
						return LT_CELL_STRING_VALUE;
					}

					return wrapValue((params.data as AdvancedTableRow)[params.column.getId()], {
						error: (params.data as AdvancedTableRow)[ERROR_KEY]?.[params.column.getId()],
						description: (params.data as AdvancedTableRow)[SCHEMA_DESCRIBE_KEY]?.[params.column.getId()],
						...valueGetterWrapValueAdditions(params),
					});
				},
				cellRenderer: LookupCellRenderer,
				cellRendererParams: (params) => ({
					error: (params.data as AdvancedTableRow)[ERROR_KEY]?.[params.column.getId()],
					description: (params.data as AdvancedTableRow)[SCHEMA_DESCRIBE_KEY]?.[params.column.getId()],
				}),
			} as ColDef;
		}),
	})) as ColGroupDef[];
