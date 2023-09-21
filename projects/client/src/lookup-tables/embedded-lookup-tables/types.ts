import { ColDef, ColGroupDef } from 'ag-grid-community';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { UseMutationResult } from 'react-query';
import { Schema } from 'yup';

import { TREE_DATA_KEY } from '@/components/AdvancedTable/constants';
import { AdvancedTableRow, TemplateSelectMenuItem } from '@/components/AdvancedTable/types';
import { Block } from '@/components/KeyboardShortcutsButton';
import { RuleWellHeaderMatchBehavior } from '@/inpt-shared/econ-models/embedded-lookup-tables/constants';

export const UUID_KEY = Symbol('uuid-key');
export const NESTED_ROW_BEHAVIOR_KEY = Symbol('nested-row-behavior-key');
export const VIRTUAL_LINES_KEY = Symbol('virtual-lines-key');
export const HEADER_VALIDATION_ERRORS_KEY = Symbol('headers-validation-errors-key');
export const IS_INVALID_COMBINATION_KEY = Symbol('invalid-combination-key');
export const IS_OVERLAPPING_COMBINATION_KEY = Symbol('overlapping-combination-key');

export type CreateEmbeddedLookupTableMutationVariables = Pick<
	Inpt.EmbeddedLookupTable,
	'name' | 'assumptionKey' | 'configuration' | 'project' | 'rules' | 'lines'
>;

export type UpdateEmbeddedLookupTableMutationVariables = {
	eltId: Inpt.ObjectId<'embedded-lookup-table'>;
	data: Partial<Pick<Inpt.EmbeddedLookupTable, 'name' | 'rules' | 'lines' | 'configuration'>>;
};

export type CopyEmbeddedLookupTableMutationVariables = {
	eltId: Inpt.ObjectId<'embedded-lookup-table'>;
};

export type ImportEmbeddedLookupTableMutationVariables = {
	eltId: Inpt.ObjectId<'embedded-lookup-table'>;
	targetProjectId: Inpt.ObjectId<'project'>;
};

export type MassImportEmbeddedLookupTablesMutationVariables = {
	ids: Inpt.ObjectId<'embedded-lookup-table'>[];
	targetProjectId: Inpt.ObjectId<'project'>;
};

export interface LookupRuleRow<T extends AdvancedTableRow = AdvancedTableRow> {
	[UUID_KEY]: string;
	[TREE_DATA_KEY]: string[];
	[NESTED_ROW_BEHAVIOR_KEY]?: RuleWellHeaderMatchBehavior;
	[HEADER_VALIDATION_ERRORS_KEY]?: Record<string, string>;
	[IS_INVALID_COMBINATION_KEY]?: boolean;
	[IS_OVERLAPPING_COMBINATION_KEY]?: boolean;
	[VIRTUAL_LINES_KEY]?: T[]; //virtual ELT lines used for validation by substituting the LT cells with the entered value for the current lookup rules row
}

export type ModuleListEmbeddedLookupTableItem = Assign<
	Inpt.EmbeddedLookupTable,
	{
		project: { _id: Inpt.ObjectId<'project'>; name: string };
		createdBy: { name: string };
	}
>;

export type UpdateEmbeddedLookupTableMutation = UseMutationResult<
	Inpt.EmbeddedLookupTable,
	unknown,
	UpdateEmbeddedLookupTableMutationVariables,
	unknown
>;

export interface EmbeddedLookupTablePageSharedProps {
	lookupTableData: Inpt.EmbeddedLookupTable;
	updateEmbeddedLookupTableMutation: UpdateEmbeddedLookupTableMutation;
}

export interface EditEmbeddedLookupTableRef {
	getCurrentPartialState: () => Partial<Inpt.EmbeddedLookupTable>;
}

export interface EditEmbeddedLookupTableProps extends EmbeddedLookupTablePageSharedProps {
	onClose?: () => void;
	onSaveAs?: (createdFromELTId: Inpt.ObjectId<'embedded-lookup-table'>, created: Inpt.EmbeddedLookupTable) => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	lookupByWellHeaders?: Record<string, any>;
	detached?: boolean;
	onDetach?: () => void;
	detachedELTData?: Inpt.EmbeddedLookupTable;
}

export interface LookupRulesColDef extends ColDef {
	allOptions: TemplateSelectMenuItem[];
}

export interface EmbeddedLookupTableModel<T extends AdvancedTableRow = AdvancedTableRow> {
	_id: Inpt.ObjectId<'embedded-lookup-table'>;
	project: Inpt.ObjectId<'project'>;
	name: string;
	assumptionKey: string;
	createdBy: Inpt.ObjectId<'user'>;
	createdAt: Inpt.StringDate;
	tags: Inpt.ObjectId[];
	configuration: Pick<Inpt.EmbeddedLookupTableConfiguration, 'caseInsensitiveMatching' | 'selectedHeaders'> & {
		selectedHeadersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>;
	};
	lines: T[];
	rules: LookupRuleRow<T>[];
}

//key is the lookup by key of the 'parent' line
export type LookupByKeysMapping = Record<string, { field: string; nestedKeysOrdered: string[] }>;

export type LookupRulesRef = {
	getCurrentRows: () => LookupRuleRow[];
};

export interface LookupRuleWithNestedRows<T extends AdvancedTableRow> {
	root: LookupRuleRow<T>;
	nested: LookupRuleRow<T>[];
}

export interface AssumptionModelELTDependencies<T extends AdvancedTableRow = AdvancedTableRow> {
	/** The label that will be used on a button that adds the row to the Lines Table. */
	addRowLabel: string;

	/** Used for rendering the Lookup Rules Table LT columns in the same order they are in the Lines Table. */
	ltColumnsOrdered: string[];

	/**
	 * List of the fields for which value can be entered if the Lines Table row is nested (row[IS_NESTED_ROW_KEY] ===
	 * true).
	 */
	nestedLineFieldsAllowedToHaveValue: string[];

	/**
	 * List of the fields to which 'lookup by' functionality can be applied if the Lines Table row is nested
	 * (row[IS_NESTED_ROW_KEY] === true).
	 */
	nestedLineFieldsAllowedForLookupBy: string[];

	/**
	 * Used to interfere the 'lookup by' process. Key is the column key on which 'lookup by' is requested, value is the
	 * list of column keys on which 'lookup by' will be also applied along with the requested column key.
	 */
	lookupByDependencies: Record<string, string[]>;

	/**
	 * The flag that will be used to determine whether the Lines Table should have the possibility to expand/collapse
	 * rows.
	 */
	enableCollapsibleRows: boolean;

	/** Yup schema of the Lines Table row used for the various needs, like validation of the Lines Table row. */
	rowSchema: Schema;

	/** List of the shortcuts that are available for the Lines Table as a hotkeys. */
	shortcutsInfo: Block[];

	/** The list of the actions that will be added to the default cell context menu items in the Lines Table. */
	contextMenuItems: {
		/** Context menu item name. */
		name: string;

		/** Shortcut to be used as a hotkey to execute action @see {action}. */
		shortcut: string;

		/** Action that will be executed on the context menu item click. */
		action: () => void | undefined;
	}[];

	/** Properties that will be passed to the AdvancedModelToolbar of the Lines Table to manipulate current ELT state. */
	toolbarContext: {
		/** ELT received from the API. */
		elt: Inpt.EmbeddedLookupTable;

		/** Reference to the Lookup Rules Table. */
		rulesRef: RefObject<LookupRulesRef>;

		/** Current well headers used in the Lookup Rules Table. */
		chosenHeaders: string[];

		/** Current well headers behavior used in the Lookup Rules Table. */
		headersMatchBehavior: Record<string, RuleWellHeaderMatchBehavior>;

		/** Flag that shows if the current ELT was modified. */
		hasBeenEdited: boolean;

		/** Flag that shows if the current ELT values section of the Lookup Rules was validated after the changes. */
		rulesValuesWereValidated: boolean;

		/**
		 * Used to set the rows with LT cells within the Lines Table to show only those rows LT cells in the Lookup
		 * Rules Table.
		 */
		setSelectedLinesWithLTs: Dispatch<SetStateAction<AdvancedTableRow[]>>;

		/**
		 * HACK: Used to set the state of the ELT to be in Save As requested to prevent show unsaved work dialog if the
		 * changes were not saved to the current ELT.
		 */
		setWaitingOnSaveAsComplete: Dispatch<SetStateAction<boolean>>;
	};

	/**
	 * If passed, renders the button in the AdvancedModelToolbar of the Lines Table to organize current Lines Table
	 * rows.
	 */
	organizeRows?: {
		/** Label of the button. */
		label: string;

		/** Algorithm to apply to the current Lines Tables rows to sort them in the desired order. */
		onClick: (rows: T[]) => T[];
	};

	/** Ag-grid columns definition used for the Lines Table. */
	getColumnsDef: () => ColGroupDef[];

	/** Action that will be used to add the row to the Lines Table. */
	handleAddRow: () => void;

	/**
	 * Used to adjust the rows (e.g. add validation info) in the Lines Table on any change in it.
	 *
	 * @param {T} rows Rows from the Lines Table.
	 */
	adjustELTLinesRowData: (rows: T[], validationCheck?: boolean) => T[];

	/**
	 * Used to add the validation to the virtual rows for the LookupRuleRow[VIRTUAL_LINES_KEY].
	 *
	 * @param {T} rows Rows from the Lines Table with already substituted LT cells values with the values from the
	 *   LookupRuleRow.
	 */
	addValidationToTheRuleVirtualLines: (rows: T[]) => T[];

	/**
	 * Used for the initial mapping from the database ELT Line to the Lines Table row. Applies transformation of the raw
	 * row values (e.g. value to correspondent label) if needed.
	 *
	 * @param {T} line Lines Table row to apply values transformation to.
	 * @param {T} parentLine Lines Table row that is parent row of the line @see {line} if the line @see {line} is
	 *   nested row (line[IS_NESTED_ROW_KEY] === true).
	 * @param {T} previousLines All rows of the Lines Table before the line @see {line}.
	 */
	applyLineToRowTransformation: (line: T, parentLine: T | null, previousLines: T[]) => T;

	/**
	 * Used for the mapping from the Lines Table row to the database ELT Line on save. Applies transformation of the
	 * Lines table row values (e.g. label to correspondent value) if needed.
	 *
	 * @param {T} row Lines Table row.
	 */
	applyRowToLineTransformation: (row: T) => T;

	/**
	 * Used for the initial mapping from the database ELT Rule to the Lookup Rules Table row. Applies transformation of
	 * the raw rule values (e.g. value to correspondent label) if needed.
	 *
	 * @param {Record<string, any>} rawRuleValues Lookup Rule Table row values as they are stored in the database.
	 * @param {T} lineRows Lines Table rows with already applied applyLineToRowTransformation
	 * @see {applyLineToRowTransformation} on them.
	 */
	applyRuleValuesToLookupRuleRowValuesTransformation: (
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		rawRuleValues: Record<string, any>,
		lineRows: T[]
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	) => Record<string, any>;

	/**
	 * Used for the mapping from the Lookup Rule Table row to the database ELT rule on save. Applies transformation of
	 * the Lookup Rule table row values (e.g. label to correspondent value) if needed.
	 *
	 * @param {string} lookupByKey Lookup Rule Table row field that is 'lookup by' key of the LT cell in the Lines
	 *   Table.
	 * @param {any} value Value of the Lookup Rule Table row lookupByKey @see {lookupByKey} field.
	 * @param {T} lineRows ELT Lines with already applied applyRowToLineTransformation
	 * @see {applyRowToLineTransformation} on them.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	applyLookupRuleRowValueToRuleValueTransformation: (lookupByKey: string, value: any, lineRows: T[]) => any;

	/** Used to get the label of the column value (if it exists) in the various places of the ELT. */
	getTemplateColumnLabel: (colId: string) => string;

	/**
	 * Used to get extra text for the Lookup Rules Table column group header for better identification of the row in the
	 * Lines Table.
	 */
	getLookupByValueHeaderExtraText: (row: T) => string;

	/** Function that gets executed on user's attempt to 'lookup by' on the cell in the Lines Table. */
	getLookupByOnColumnError: (lookupByField: string, parentRow: T) => string;

	/** Function that gets executed on user's attempt to remove 'lookup by' from the cell in the Lines Table. */
	getRemoveLookupByFromColumnError: (
		requestedForRemoveLookupByFields: string[],
		removeLookupByFromField: string,
		line: T
	) => string;

	/** Used to determine whether the value cell in the Lookup Rule Table row can be populated. */
	isLookupRuleRowValueCellDisabled: (virtualLine: T, field: string) => boolean;

	/** Used to determine whether or not we can add nested rows (times series) to model */
	allowNestedRows: boolean;

	/** Used to determine if the value (LT) column of the lookup rule is numerical. */
	isLookupRuleValueColumnNumerical: (rule: LookupRuleRow<T>, lookupByKey: string) => boolean;

	/** Used to determine if the advanced model rows is nested to set IS_NESTED_ROW_KEY when processing paste. */
	isNestedRowOnPaste: (rowData: T) => boolean;

	/**
	 * Used to determine if the values validation of the rule is dependant on other values (e.g. see
	 * useCapexELTDependencies -> isLookupRuleValueColumnNumerical)
	 */
	ruleValueValidationIsBasedOnAnotherValue: boolean;
}
