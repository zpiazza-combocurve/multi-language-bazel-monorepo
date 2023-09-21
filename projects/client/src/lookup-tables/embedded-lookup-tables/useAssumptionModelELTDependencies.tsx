import { ColGroupDef } from 'ag-grid-community';
import { capitalize } from 'lodash';
import { useCallback, useContext, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import { ROW_ID_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRow } from '@/components/AdvancedTable/types';
import { Block } from '@/components/KeyboardShortcutsButton';
import useCapexELTDependencies from '@/cost-model/detail-components/capex/CapexAdvancedView/embedded-lookup-table/useCapexELTDependencies';
import useExpensesELTDependencies from '@/cost-model/detail-components/expenses/ExpensesAdvancedView/embedded-lookup-table/useExpensesELTDependencies';
import { AssumptionKey } from '@/inpt-shared/constants';

import { EmbeddedLookupTableContext } from './context/EmbeddedLookupTableContext';
import { AssumptionModelELTDependencies } from './types';

//default values for the useDefaultELTDependencies hook
const addRowLabel = 'Row';
const ltColumnsOrdered: string[] = [];
const nestedLineFieldsAllowedToHaveValue: string[] = [];
const nestedLineFieldsAllowedForLookupBy: string[] = [];
const lookupByDependencies = {};
const enableCollapsibleRows = false;
const rowSchema = yup.object({});
const shortcutsInfo: Block[] = [];
const contextMenuItems = [];
const allowNestedRows = false;
const ruleValueValidationIsBasedOnAnotherValue = false;
const getColumnsDef = (): ColGroupDef[] => [];
const adjustELTLinesRowData = (rows) => rows;
const addValidationToTheRuleVirtualLines = (rows) => rows;
const applyLineToRowTransformation = (line) => line;
const applyRowToLineTransformation = (row) => row;
const applyRuleValuesToLookupRuleRowValuesTransformation = (rawRuleValues) => rawRuleValues;
const applyLookupRuleRowValueToRuleValueTransformation = (_, value) => value;
const getTemplateColumnLabel = (colId) => capitalize(colId);
const getLookupByValueHeaderExtraText = () => '';
const getLookupByOnColumnError = () => '';
const getRemoveLookupByFromColumnError = () => '';
const isLookupRuleRowValueCellDisabled = () => false;
const isLookupRuleValueColumnNumerical = () => false;
const isNestedRowOnPaste = () => false;

const useDefaultELTDependencies = <T extends AdvancedTableRow = AdvancedTableRow>(
	elt: Inpt.EmbeddedLookupTable
): AssumptionModelELTDependencies<T> => {
	const {
		rulesRef,
		setSelectedLinesWithLTs,
		chosenHeaders,
		linesRef,
		hasBeenEdited,
		rulesValuesWereValidated,
		headersMatchBehavior,
		setWaitingOnSaveAsComplete,
	} = useContext(EmbeddedLookupTableContext);

	const toolbarContext = useMemo(() => {
		return {
			hasBeenEdited,
			rulesValuesWereValidated,
			rulesRef,
			setSelectedLinesWithLTs,
			elt,
			chosenHeaders,
			headersMatchBehavior,
			setWaitingOnSaveAsComplete,
		};
	}, [
		chosenHeaders,
		elt,
		hasBeenEdited,
		headersMatchBehavior,
		rulesRef,
		rulesValuesWereValidated,
		setSelectedLinesWithLTs,
		setWaitingOnSaveAsComplete,
	]);

	const handleAddRow = useCallback(() => {
		linesRef.current?.setRowData((p) => [
			...p,
			{
				[ROW_ID_KEY]: uuidv4(),
			},
		]);
	}, [linesRef]);

	return useMemo(
		() =>
			({
				addRowLabel,
				ltColumnsOrdered,
				nestedLineFieldsAllowedToHaveValue,
				nestedLineFieldsAllowedForLookupBy,
				lookupByDependencies,
				enableCollapsibleRows,
				rowSchema,
				shortcutsInfo,
				contextMenuItems,
				toolbarContext,
				allowNestedRows,
				ruleValueValidationIsBasedOnAnotherValue,
				getColumnsDef,
				handleAddRow,
				adjustELTLinesRowData,
				addValidationToTheRuleVirtualLines,
				applyLineToRowTransformation,
				applyRowToLineTransformation,
				applyRuleValuesToLookupRuleRowValuesTransformation,
				applyLookupRuleRowValueToRuleValueTransformation,
				getTemplateColumnLabel,
				getLookupByValueHeaderExtraText,
				getLookupByOnColumnError,
				getRemoveLookupByFromColumnError,
				isLookupRuleRowValueCellDisabled,
				isLookupRuleValueColumnNumerical,
				isNestedRowOnPaste,
			} as AssumptionModelELTDependencies<T>),
		[handleAddRow, toolbarContext]
	);
};

const useAssumptionModelELTDependencies = <T extends AdvancedTableRow = AdvancedTableRow>(
	elt: Inpt.EmbeddedLookupTable
): AssumptionModelELTDependencies<T> => {
	const defaultDependencies = useDefaultELTDependencies<T>(elt);

	const expensesDependencies = useExpensesELTDependencies(elt);
	const capexDependencies = useCapexELTDependencies(elt);

	const dependencies = useMemo(() => {
		let assumptionModelDependencies: Partial<AssumptionModelELTDependencies> = {};

		switch (elt.assumptionKey) {
			case AssumptionKey.expenses: {
				assumptionModelDependencies = expensesDependencies;
				break;
			}

			case AssumptionKey.capex: {
				assumptionModelDependencies = capexDependencies;
				break;
			}

			default:
				break;
		}

		return { ...defaultDependencies, ...assumptionModelDependencies } as AssumptionModelELTDependencies<T>;
	}, [elt.assumptionKey, defaultDependencies, expensesDependencies, capexDependencies]);

	return dependencies;
};

export const useAssumptionModelAdvancedViewELTDependencies = <T extends AdvancedTableRow = AdvancedTableRow>(
	elt: Partial<Inpt.EmbeddedLookupTable> & Pick<Inpt.EmbeddedLookupTable, 'assumptionKey' | 'project'>
) => useAssumptionModelELTDependencies<T>(elt as Inpt.EmbeddedLookupTable);

export default useAssumptionModelELTDependencies;
