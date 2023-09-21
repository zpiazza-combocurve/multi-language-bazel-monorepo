import { ColGroupDef } from 'ag-grid-community';
import { isEqual, pick } from 'lodash';
import { Dispatch, RefObject, SetStateAction, createContext, useEffect, useMemo, useRef, useState } from 'react';

import { LOOKUP_BY_FIELDS_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRef, AdvancedTableRow } from '@/components/AdvancedTable/types';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';

import { checkRuleValueCellsAreValid } from '../LookupRules/helpers';
import { LookupRuleRow, LookupRulesRef } from '../types';

const rowsWereChanged = <T extends object>(initialRows: T[], currentRows: T[], includeEqualSymbol: symbol[] = []) =>
	initialRows.length !== currentRows.length ||
	!!initialRows.find((initialRow, index) => {
		const initialRowKeys = Object.keys(initialRow);
		const currentRowKeys = Object.keys(currentRows[index]);

		return (
			initialRowKeys.length !== currentRowKeys.length ||
			!isEqual(pick(initialRow, initialRowKeys), pick(currentRows[index], currentRowKeys)) ||
			!!includeEqualSymbol.find((key) => !isEqual(currentRows[index][key], initialRow[key]))
		);
	});

interface EmbeddedLookupTableContextProps<T extends AdvancedTableRow = AdvancedTableRow> {
	// Lines table
	// Refs
	linesRef: RefObject<AdvancedTableRef<T>>;

	// State management
	linesRows: T[];
	setLinesRows: Dispatch<SetStateAction<T[]>>;
	setInitialLinesRows: Dispatch<SetStateAction<T[]>>;
	linesAreValid: boolean;
	setLinesAreValid: Dispatch<SetStateAction<boolean>>;
	selectedLinesWithLTs: T[];
	setSelectedLinesWithLTs: Dispatch<SetStateAction<T[]>>;

	// Rules Table
	// Refs
	rulesRef: RefObject<LookupRulesRef>;

	// State management
	rulesRows: LookupRuleRow<T>[];
	setRulesRows: Dispatch<SetStateAction<LookupRuleRow<T>[]>>;
	setInitialRulesRows: Dispatch<SetStateAction<LookupRuleRow<T>[]>>;
	headersColDef: ColGroupDef[];
	setHeadersColDef: Dispatch<SetStateAction<ColGroupDef[]>>;
	chosenHeaders: string[];
	setChosenHeaders: Dispatch<SetStateAction<string[]>>;
	setInitialChosenHeaders: Dispatch<SetStateAction<string[]>>;
	headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>;
	setHeadersMatchBehavior: Dispatch<SetStateAction<Record<string, RuleWellHeaderMatchBehavior>>>;
	setInitialHeadersMatchBehavior: Dispatch<SetStateAction<Record<string, RuleWellHeaderMatchBehavior>>>;
	rulesColDef: ColGroupDef[];
	setValuesColDef: Dispatch<SetStateAction<ColGroupDef[]>>;

	// State management
	editing: boolean;
	setEditing: Dispatch<SetStateAction<boolean>>;
	rulesAreValid: boolean;
	setRulesAreValid: Dispatch<SetStateAction<boolean>>;
	ruleValueCellsAreValid: boolean;
	rulesValuesWereValidated: boolean;
	setRulesValuesWereValidated: Dispatch<SetStateAction<boolean>>;

	// Undo management
	canUndo: boolean;
	canRedo: boolean;
	setUndoState: Dispatch<SetStateAction<{ canRedo: boolean; canUndo: boolean }>>;

	hasBeenEdited: boolean;
	waitingOnSaveAsComplete: boolean;
	setWaitingOnSaveAsComplete: Dispatch<SetStateAction<boolean>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export const EmbeddedLookupTableContext = createContext<EmbeddedLookupTableContextProps>({} as any);

export const EmbeddedLookupTableProvider = ({ children }) => {
	// Lines table
	const linesRef = useRef<AdvancedTableRef<AdvancedTableRow>>(null);
	const [linesRows, setLinesRows] = useState<AdvancedTableRow[]>([]);
	const [initialLinesRows, setInitialLinesRows] = useState<AdvancedTableRow[]>([]);
	const [linesAreValid, setLinesAreValid] = useState(true);
	const [selectedLinesWithLTs, setSelectedLinesWithLTs] = useState<AdvancedTableRow[]>([]);

	// Rules table
	const rulesRef = useRef<LookupRulesRef>(null);
	const [rulesRows, setRulesRows] = useState<LookupRuleRow[]>([]);
	const [initialRulesRows, setInitialRulesRows] = useState<LookupRuleRow[]>([]);
	const [headersColDef, setHeadersColDef] = useState<ColGroupDef[]>([]);
	const [valuesColDef, setValuesColDef] = useState<ColGroupDef[]>([]);
	const rulesColDef = useMemo(() => [...headersColDef, ...valuesColDef], [headersColDef, valuesColDef]);
	const [chosenHeaders, setChosenHeaders] = useState<string[]>([]);
	const [initialChosenHeaders, setInitialChosenHeaders] = useState<string[]>([]);
	const [headersMatchBehavior, setHeadersMatchBehavior] = useState<Record<string, RuleWellHeaderMatchBehavior>>({});
	const [initialHeadersMatchBehavior, setInitialHeadersMatchBehavior] = useState<
		Record<string, RuleWellHeaderMatchBehavior>
	>({});

	// Shared
	const [editing, setEditing] = useState(false);
	const [rulesAreValid, setRulesAreValid] = useState(true);
	const [rulesValuesWereValidated, setRulesValuesWereValidated] = useState(true);
	const [waitingOnSaveAsComplete, setWaitingOnSaveAsComplete] = useState(false);

	// Undo management
	const [{ canRedo, canUndo }, setUndoState] = useState({ canRedo: false, canUndo: false });

	const ruleValueCellsAreValid = useMemo(() => checkRuleValueCellsAreValid(rulesRows), [rulesRows]);

	const linesWereChanged = useMemo(
		() => rowsWereChanged(initialLinesRows, linesRows, [LOOKUP_BY_FIELDS_KEY]),
		[initialLinesRows, linesRows]
	);
	const rulesWereChanged = useMemo(() => rowsWereChanged(initialRulesRows, rulesRows), [initialRulesRows, rulesRows]);
	const headersWereChanged = useMemo(
		() => initialChosenHeaders.join() !== chosenHeaders.join(),
		[initialChosenHeaders, chosenHeaders]
	);
	const headersMatchBehaviorWasChanged = useMemo(
		() => JSON.stringify(initialHeadersMatchBehavior) !== JSON.stringify(headersMatchBehavior),
		[initialHeadersMatchBehavior, headersMatchBehavior]
	);

	const hasBeenEdited = linesWereChanged || headersWereChanged || rulesWereChanged || headersMatchBehaviorWasChanged;

	useEffect(() => {
		if (hasBeenEdited || !ruleValueCellsAreValid) {
			setRulesValuesWereValidated(false);
		}
	}, [rulesRows, linesRows, hasBeenEdited, ruleValueCellsAreValid]);

	const value = useMemo(
		() => ({
			rulesRef,
			linesRef,
			rulesColDef,
			rulesRows,
			setRulesRows,
			chosenHeaders,
			setChosenHeaders,
			setRulesAreValid,
			selectedLinesWithLTs,
			setSelectedLinesWithLTs,
			setUndoState,
			canRedo,
			canUndo,
			editing,
			setEditing,
			setLinesAreValid,
			setLinesRows,
			setValuesColDef,
			linesRows,
			setHeadersColDef,
			headersColDef,
			linesAreValid,
			rulesAreValid,
			ruleValueCellsAreValid,
			setInitialLinesRows,
			setInitialRulesRows,
			setInitialChosenHeaders,
			setInitialHeadersMatchBehavior,
			setHeadersMatchBehavior,
			headersMatchBehavior,
			hasBeenEdited,
			rulesValuesWereValidated,
			setRulesValuesWereValidated,
			waitingOnSaveAsComplete,
			setWaitingOnSaveAsComplete,
		}),
		[
			canRedo,
			canUndo,
			chosenHeaders,
			editing,
			hasBeenEdited,
			headersColDef,
			headersMatchBehavior,
			linesAreValid,
			linesRows,
			ruleValueCellsAreValid,
			rulesAreValid,
			rulesColDef,
			rulesRows,
			selectedLinesWithLTs,
			rulesValuesWereValidated,
			waitingOnSaveAsComplete,
		]
	);

	return <EmbeddedLookupTableContext.Provider value={value}>{children}</EmbeddedLookupTableContext.Provider>;
};
