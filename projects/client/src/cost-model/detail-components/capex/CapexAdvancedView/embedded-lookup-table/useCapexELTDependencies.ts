import { useCallback, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { LOOKUP_BY_FIELDS_KEY, ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import {
	advancedModelStateIsValid,
	getDefaultShortcutsInfo,
	useContextMenuItems,
} from '@/components/AdvancedTable/shared';
import { addValidationInfo } from '@/cost-model/detail-components/AdvancedModelView/shared';
import { EmbeddedLookupTableContext } from '@/lookup-tables/embedded-lookup-tables/context/EmbeddedLookupTableContext';
import {
	getFieldAndVirtualLineByLookupByKey,
	getFieldFromLookupByKey,
	mapToELTColumnsDef,
} from '@/lookup-tables/embedded-lookup-tables/shared';
import { AssumptionModelELTDependencies, LookupRuleRow } from '@/lookup-tables/embedded-lookup-tables/types';

import {
	CAPEX_LOOKUP_BY_FIELDS_DEPENDENCIES,
	CapexColumn,
	ELT_LOOKUP_BY_COLUMNS_ORDERED,
	NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS,
	NUMERICAL_COLUMNS,
} from '../constants';
import { useCapexTemplate } from '../schemaValidation';
import {
	addTreeDataInfo,
	createOtherCapexDefaultTemplate,
	getCAPEXColumnLabel,
	getCapexColumnsDef,
	validationOptions,
} from '../shared';
import { CapexRow } from '../types';
import { labelToValueCapexPOJO, rulesLabelToValueCapex, rulesValueToLabelCapex, valueToLabelCapexPOJO } from './parser';

const elts = [];
const shortcutsInfo = getDefaultShortcutsInfo({
	isELT: true,
	showRunEconomics: false,
	enableTimeSeries: false,
	enableOrganizeByKey: false,
});
const ltColumnsOrdered = ELT_LOOKUP_BY_COLUMNS_ORDERED;
const lookupByDependencies = CAPEX_LOOKUP_BY_FIELDS_DEPENDENCIES;
const getTemplateColumnLabel = getCAPEXColumnLabel;
const getLookupByValueHeaderExtraText = (row: CapexRow) => `(${row.category})`;
const ruleValueValidationIsBasedOnAnotherValue = true;

const getLookupByOnColumnError = (lookupByField: string) =>
	NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS.includes(lookupByField)
		? `Can't lookup by on "${getTemplateColumnLabel(lookupByField)}"`
		: '';

const getColumnsDef = () => mapToELTColumnsDef(getCapexColumnsDef(false), NOT_ALLOWED_TO_LOOKUP_BY_COLUMNS);

const getRemoveLookupByFromColumnError = (
	requestedForRemoveLookupByFields: string[],
	removeLookupByFromField: string,
	line: CapexRow
) => {
	const parentKeys = Object.keys(lookupByDependencies).filter((parent) =>
		lookupByDependencies[parent].find((child) => child === removeLookupByFromField)
	);

	for (const parentKey of parentKeys) {
		const foundParentDependent = requestedForRemoveLookupByFields.find((id) => id === parentKey);
		// if parent and dependent child is being removed, we can ignore removal error
		if (!foundParentDependent && line[LOOKUP_BY_FIELDS_KEY]?.[parentKey]) {
			return `Can't remove 'Lookup By' from "${getTemplateColumnLabel(
				removeLookupByFromField
			)}" if "${getTemplateColumnLabel(parentKey)}" is 'Lookup By'`;
		}
	}

	return '';
};

const isLookupRuleRowValueCellDisabled = (virtualLine: CapexRow, field: string) =>
	field === CapexColumn.criteriaFromOption &&
	virtualLine['criteria_option'] !== 'From Schedule' &&
	virtualLine['criteria_option'] !== 'From Headers';

const isLookupRuleValueColumnNumerical = (rule: LookupRuleRow<CapexRow>, lookupByKey: string) => {
	const field = getFieldFromLookupByKey(lookupByKey);

	if (field) {
		if (NUMERICAL_COLUMNS.includes(field)) {
			return true;
		}

		if (field === 'criteria_value') {
			const criteriaOptionFromRuleLookupByKey = Object.keys(rule).find(
				(key) => getFieldFromLookupByKey(key) === 'criteria_option'
			);

			if (criteriaOptionFromRuleLookupByKey) {
				return rule[criteriaOptionFromRuleLookupByKey]?.toLowerCase() !== 'date';
			}

			const { virtualLine } = getFieldAndVirtualLineByLookupByKey<CapexRow>(rule, lookupByKey);
			return virtualLine?.['criteria_option']?.toLowerCase() !== 'date';
		} else if (field === 'escalation_start_value') {
			const escalationStartOptionFromRuleLookupByKey = Object.keys(rule).find(
				(key) => getFieldFromLookupByKey(key) === 'escalation_start_option'
			);

			if (escalationStartOptionFromRuleLookupByKey) {
				return rule[escalationStartOptionFromRuleLookupByKey]?.toLowerCase() !== 'date';
			}

			const { virtualLine } = getFieldAndVirtualLineByLookupByKey<CapexRow>(rule, lookupByKey);
			return virtualLine?.['escalation_start_option']?.toLowerCase() !== 'date';
		}
	}

	return false;
};

const useCapexELTDependencies = (elt: Inpt.EmbeddedLookupTable): Partial<AssumptionModelELTDependencies<CapexRow>> => {
	const { linesRef, setLinesAreValid } = useContext(EmbeddedLookupTableContext);

	const { deleteSelectedRowsItem, copyRowsItem } = useContextMenuItems(linesRef);
	const { template, capexRowSchema: rowSchema } = useCapexTemplate(elt.project, elts);

	const contextMenuItems = useMemo(
		() => [deleteSelectedRowsItem, copyRowsItem],
		[deleteSelectedRowsItem, copyRowsItem]
	);

	const handleAddRow = useCallback(() => {
		linesRef.current?.setRowData((p) => [
			...p,
			{
				[ROW_ID_KEY]: uuidv4(),
				...createOtherCapexDefaultTemplate(template),
			},
		]);
	}, [linesRef, template]);

	const adjustELTLinesRowData = useCallback(
		(rows: CapexRow[], validationCheck = true) => {
			const rowsState = addTreeDataInfo(rows);
			const getCapexRowSchema = (row) => {
				return rowSchema.concat(
					yup.object({
						...Object.keys(row[LOOKUP_BY_FIELDS_KEY] ?? {}).reduce((acc, key) => {
							acc[key] = yup.mixed();
							return acc;
							// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
						}, {} as any),
					})
				);
			};

			const withValidationInfo = addValidationInfo<CapexRow>(rowsState, getCapexRowSchema, validationOptions);

			if (validationCheck) {
				setLinesAreValid(advancedModelStateIsValid(withValidationInfo)); //TODO: should not be here
			}

			return withValidationInfo;
		},
		[setLinesAreValid, rowSchema]
	);

	const addValidationToTheRuleVirtualLines = useCallback(
		(rows: CapexRow[]) => {
			const withValidationInfo = addValidationInfo<CapexRow>(rows, () => rowSchema, validationOptions);
			return withValidationInfo;
		},
		[rowSchema]
	);

	const applyRowToLineTransformation = useCallback(
		(row: CapexRow) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			return labelToValueCapexPOJO(row as any, template) as any; // TODO: deal with types later
		},
		[template]
	);

	const applyLineToRowTransformation = useCallback(
		(line: CapexRow) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
			return { ...line, ...valueToLabelCapexPOJO(line as any, template) };
		},
		[template]
	);

	const applyLookupRuleRowValueToRuleValueTransformation = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(lookupByKey: string, value: any) => {
			return rulesLabelToValueCapex(lookupByKey, value, template);
		},
		[template]
	);

	const applyRuleValuesToLookupRuleRowValuesTransformation = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		(rawRuleValues: Record<string, any>): Record<string, any> => {
			return rulesValueToLabelCapex(rawRuleValues, template);
		},
		[template]
	);

	return useMemo(
		() =>
			({
				shortcutsInfo,
				rowSchema,
				ltColumnsOrdered,
				contextMenuItems,
				lookupByDependencies,
				ruleValueValidationIsBasedOnAnotherValue,
				getTemplateColumnLabel,
				handleAddRow,
				getLookupByValueHeaderExtraText,
				getLookupByOnColumnError,
				getRemoveLookupByFromColumnError,
				getColumnsDef,
				adjustELTLinesRowData,
				addValidationToTheRuleVirtualLines,
				isLookupRuleRowValueCellDisabled,
				isLookupRuleValueColumnNumerical,
				applyRowToLineTransformation,
				applyLineToRowTransformation,
				applyLookupRuleRowValueToRuleValueTransformation,
				applyRuleValuesToLookupRuleRowValuesTransformation,
			} as Partial<AssumptionModelELTDependencies<CapexRow>>),
		[
			addValidationToTheRuleVirtualLines,
			adjustELTLinesRowData,
			contextMenuItems,
			handleAddRow,
			rowSchema,
			applyRowToLineTransformation,
			applyLineToRowTransformation,
			applyLookupRuleRowValueToRuleValueTransformation,
			applyRuleValuesToLookupRuleRowValuesTransformation,
		]
	);
};

export default useCapexELTDependencies;
