import { format } from 'date-fns';
import { useMemo } from 'react';

import { useProjectHeadersQuery } from '@/helpers/project-custom-headers';
import { timestamp } from '@/helpers/timestamp';
import {
	BOOLEAN,
	CHOICE,
	DATE,
	EQUAL,
	FIXED_DATE,
	FIXED_NUMBER,
	HIGH,
	LOW,
	MIXED,
	NUMBER,
	PERCENT,
	STRING,
} from '@/lookup-tables/shared/constants';
import {
	LookupTableRule,
	StandardLookupTableColumnHeaders,
	StandardLookupTableGrid,
} from '@/lookup-tables/shared/types';
import {
	getBooleanValue,
	getFormattedValue,
	isBooleanType,
	isRangeType,
	isValidDate,
	isValidNumber,
	validateRange,
} from '@/lookup-tables/shared/validators';

export const LOOKUP_TABLES_OPERATORS = {
	EQUAL: 'equal',
	NOT_EQUAL: 'not_equal',
	GREATER_THAN: 'greater_than',
	GREATER_THAN_EQUAL: 'greater_than_equal',
	LESS_THAN: 'less_than',
	LESS_THAN_EQUAL: 'less_than_equal',
	IN: 'in',
	NOT_IN: 'not_in',
};

export const MAX_RULES = 2000;

const EMPTY_ARRAY = [];

export function generateLookupTableName({ user }) {
	const name = `${user.firstName.toLowerCase()[0] ?? ''}${user.lastName.toLowerCase() ?? ''}`;
	const date = timestamp(Date.now());
	return `${name}${date}`;
}

export function isEmpty(row) {
	return !Object.entries(row).find(([key, value]) => {
		return key !== '_modified' && !!value;
	});
}

function validateAssignment(value, assignmentType) {
	switch (assignmentType) {
		case FIXED_DATE:
			return isValidDate(value);
		case FIXED_NUMBER:
			return isValidNumber(value);
		default:
			return true;
	}
}

function isRange(operator) {
	return operator === LOW || operator === HIGH;
}

export function formatCondition(conditionValue, headerType) {
	if (conditionValue) {
		const { value, high, low } = conditionValue;
		if (isRangeType(headerType)) {
			const [formattedLow, formattedHigh] = getFormattedValue(low, high, headerType);
			return { ...conditionValue, low: formattedLow, high: formattedHigh };
		}
		if (isBooleanType(headerType)) {
			return { ...conditionValue, value: getBooleanValue(value) };
		}
	}
	return conditionValue;
}

export function formatRule(rule: LookupTableRule, headerTypes = {}): LookupTableRule {
	const { conditions = {}, assignments = {} } = rule ?? {};
	const newConditions = { ...conditions };
	const newAssignments = {};
	Object.entries(assignments).forEach(([assignmentKey, assignmentValue]) => {
		if (assignmentValue) {
			newAssignments[assignmentKey] = assignmentValue;
		}
	});
	Object.entries(conditions).forEach(([conditionKey, conditionValue]) => {
		newConditions[conditionKey] = formatCondition(conditionValue, headerTypes[conditionKey]);
	});
	return { ...rule, conditions: newConditions, assignments: newAssignments };
}

export function formatRules(rules: LookupTableRule[], headerTypes): LookupTableRule[] {
	const formattedRules: LookupTableRule[] = [];
	rules.forEach((rule, i) => {
		formattedRules[i] = formatRule(rule, headerTypes);
	});
	return formattedRules;
}

const DEFAULT_ROWS = 100;

function isISODateUTC(str: string): boolean {
	const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
	return isoDateRegex.test(str);
}

function getDateConditionValue(value?: string) {
	if (value) {
		const dateToFormat = isISODateUTC(value) ? value.slice(0, -1) : value;
		return format(new Date(dateToFormat), 'MM/dd/yyyy');
	}
	return null;
}

export function mapRules(lookupRules: LookupTableRule[], headerTypes) {
	return lookupRules?.length
		? lookupRules?.map((rule) => {
				const { conditions } = rule;
				const newConditions = {};
				Object.entries(conditions).forEach(([conditionKey, conditionValue]) => {
					const conditionType = headerTypes?.[conditionKey];
					if (conditionType === STRING || conditionType === MIXED) {
						newConditions[conditionKey] = conditionValue;
					}
					if (conditionType === NUMBER || conditionType === PERCENT) {
						const { low, high } = conditionValue;
						newConditions[conditionKey] = {
							...conditionValue,
							low: low ? parseFloat(low) : null,
							high: high ? parseFloat(high) : null,
						};
					}
					if (conditionType === DATE) {
						newConditions[conditionKey] = {
							...conditionValue,
							low: getDateConditionValue(conditionValue.low),
							high: getDateConditionValue(conditionValue.high),
						};
					}
					if (conditionType === BOOLEAN) {
						const { value } = conditionValue;
						let formattedValue = '';
						if (value === true) {
							formattedValue = 'Yes';
						}
						if (value === false) {
							formattedValue = 'No';
						}
						newConditions[conditionKey] = {
							...conditionValue,
							value: formattedValue,
						};
					}
				});
				return { ...rule, conditions: newConditions };
		  })
		: Array.from(Array(DEFAULT_ROWS));
}

export function rulesFromGrid(grid: StandardLookupTableGrid, assignmentKeys) {
	const assignmentsSet = new Set(assignmentKeys);

	return grid.map((row) => {
		const rules = { assignments: {}, conditions: {} };
		Object.values(row).forEach(({ columnKey, value, operator = EQUAL }) => {
			if (assignmentsSet.has(columnKey)) {
				rules.assignments[columnKey] = value;
			} else if (isRange(operator)) {
				rules.conditions[columnKey] = {
					...rules.conditions[columnKey],
					[operator]: value,
				};
			} else {
				rules.conditions[columnKey] = {
					value,
				};
			}
		});
		return rules;
	});
}

export function useLookupColumnHeaders(selectedHeaders, headerTypes = {}, headerValues, getLabel) {
	return useMemo(() => {
		const newColumns: StandardLookupTableColumnHeaders[] = [];
		selectedHeaders.forEach((header) => {
			const headerType = headerTypes?.[header];
			const headerName = header;
			const headerLabel = getLabel(header);
			newColumns.push({
				key: headerName,
				name: headerLabel,
				type: headerType,
				validValues: headerValues?.[headerName]?.filter(Boolean),
			});
		});
		return newColumns;
	}, [selectedHeaders, headerTypes, getLabel, headerValues]);
}

export function useLookupColumnAssignments(selectedAssignments, assignments, getLabel, getType, tooltips) {
	const columns = useMemo(() => {
		const newColumns: StandardLookupTableColumnHeaders[] = [];
		selectedAssignments.forEach((key) => {
			newColumns.push({
				key,
				name: getLabel(key),
				validValues: assignments?.[key],
				type: getType?.(key) ?? CHOICE,
				tooltip: tooltips?.[key],
			});
		});
		return newColumns;
	}, [selectedAssignments, getLabel, assignments, getType, tooltips]);
	if (selectedAssignments && getLabel) {
		return columns;
	}
	return EMPTY_ARRAY;
}

export function validateCondition(conditionValue, headerType) {
	if (conditionValue) {
		const { value, high, low } = conditionValue;
		if (isRangeType(headerType)) {
			return validateRange(low, high);
		}
		if (value) {
			if (isBooleanType(headerType)) {
				return [true, false, null].includes(value);
			}
			return true;
		}
	}
	return true;
}

export function validateRule(rule, headerTypes = {}, getType) {
	const { conditions, assignments } = rule;
	const validConditions = Object.entries(conditions).every(([conditionKey, conditionValue]) =>
		validateCondition(conditionValue, headerTypes[conditionKey])
	);
	const validAssignments = Object.entries(assignments).every(([assignmentKey, assignmentValue]) =>
		validateAssignment(assignmentValue, getType?.(assignmentKey))
	);
	return validConditions && validAssignments;
}

export function validateRules(rules, headerTypes, getType) {
	return rules.every((rule) => validateRule(rule, headerTypes, getType));
}

export function isRuleEmpty(rule: LookupTableRule) {
	if (!rule?.conditions && !rule?.assignments) {
		return true;
	}
	const emptyConditions = !Object.values(rule.conditions).some(({ low, high, value } = {}) => low || high || value);
	const emptyAssignments = !Object.values(rule.assignments).some((value) => value);
	return emptyConditions && emptyAssignments;
}

export function getUpdatedRulesFromCount(rules: LookupTableRule[], count) {
	const newRules: LookupTableRule[] = [];
	for (let i = 0; i < count; i++) {
		newRules[i] = rules[i] || {};
	}
	return newRules;
}

export function getUsedKeysFromRules(rules: LookupTableRule[]) {
	return [
		...rules.reduce((acc, rule = { conditions: {}, assignments: {} }) => {
			Object.entries(rule.conditions || {}).forEach(
				([key, { low = undefined, high = undefined, value = undefined } = {}]) => {
					if (low || high || value) {
						acc.add(key);
					}
				}
			);
			Object.entries(rule.assignments || {}).forEach(([key, value]) => {
				if (value) {
					acc.add(key);
				}
			});

			return acc;
		}, new Set()),
	];
}

function mapPCHTypeToLTWellHeaderType(pchType) {
	switch (pchType) {
		case 'multi-select':
		case 'string':
			return STRING;

		case 'number':
			return NUMBER;

		case 'boolean':
			return BOOLEAN;

		case 'date':
			return DATE;

		case 'percent':
			return PERCENT;

		default:
			return MIXED;
	}
}

export function usePCHsForLT(projectId) {
	const projectCustomHeadersQuery = useProjectHeadersQuery(projectId, {
		enabled: !!projectId,
	});

	return useMemo(() => {
		if (projectCustomHeadersQuery.data) {
			return Object.entries(projectCustomHeadersQuery.data.projectHeaders).reduce((acc, [key, label]) => {
				acc[key] = {
					label,
					type: mapPCHTypeToLTWellHeaderType(projectCustomHeadersQuery.data.projectHeadersTypes[key].type),
				};

				return acc;
			}, {});
		}

		return {};
	}, [projectCustomHeadersQuery.data]);
}
