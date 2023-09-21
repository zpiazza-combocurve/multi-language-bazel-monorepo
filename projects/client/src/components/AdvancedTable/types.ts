import { ColGroupDef, GetGroupRowAggParams, MenuItemDef, RowNode } from 'ag-grid-community';

import useUndo from '@/components/hooks/useUndo';
import { ValueOrFunction } from '@/helpers/utilities';

import { AgGridRef } from '../AgGrid';
import {
	ERROR_KEY,
	IS_NESTED_ROW_KEY,
	LOOKUP_BY_FIELDS_KEY,
	ROW_ID_KEY,
	SCHEMA_DESCRIBE_KEY,
	TOOLTIP_MESSAGE_KEY,
	TREE_DATA_KEY,
} from './constants';

export interface TemplateSelectMenuItem {
	label: string;
	value: string;
}

export interface TemplateNumberMinMax {
	value: number;
	include: boolean;
}

interface TemplateBase {
	fieldType: string;
	fieldName: string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	Default?: any;
	valType?: string;

	placeholder?: string;
	helpText?: string;
	required?: boolean;

	rowHeaderReliance?: {
		criteria: string[];
	};
}

export interface TemplateText extends TemplateBase {
	fieldType: 'text';
	valType: 'text';

	maxLength?: number;
}

export interface TemplateNumber extends TemplateBase {
	fieldType: 'number';
	valType: 'number' | 'dollars' | 'percentage';
	Default?: number;
	min?: TemplateNumberMinMax | number;
	max?: TemplateNumberMinMax | number;
}

export interface TemplateSelect extends TemplateBase {
	fieldType: 'select';
	valType: 'text';
	Default?: TemplateSelectMenuItem;
	menuItems: TemplateSelectMenuItem[];
}

export interface TemplateStatic extends TemplateBase {
	fieldType: 'static';
	staticValue: string;
}

export interface TemplateNumberRange extends TemplateBase {
	fieldType: 'number-range';
	valType: 'months';
	min?: TemplateNumberMinMax | number;
	max?: TemplateNumberMinMax | number;
}

export interface TemplateDateRange extends TemplateBase {
	fieldType: 'date-range';
	valType: 'datetime';
}

export interface TemplateNumberRangeRate extends TemplateBase {
	fieldType: 'number-range-rate';
	valType: 'BBL/D' | 'MCF/D';
	unit: string;
	min?: TemplateNumberMinMax | number;
	max?: TemplateNumberMinMax | number;
}

export type TemplateHeaderSelectItem = {
	label: string;
	value: string;
} & (
	| TemplateNumber
	| TemplateText
	| TemplateStatic
	| TemplateNumberRange
	| TemplateDateRange
	| TemplateNumberRangeRate
);

export interface TemplateHeaderSelect extends TemplateBase {
	fieldType: 'header-select';
	valType: 'text';
	Default?: TemplateSelectMenuItem;
	menuItems: TemplateHeaderSelectItem[];
}

export type TemplateRowView<K extends string = string> = {
	columns: Record<K, TemplateAny>;
	minRows?: number;
	maxRows?: number;
};

export type TemplateTable = Record<string, TemplateAny> & { row_view: TemplateRowView<string> };

export type TemplateAny = TemplateText | TemplateSelect | TemplateNumber | TemplateHeaderSelect;

// TODO find out how to use yup types, the yup description types are not exported
export interface TemplateYupDescription {
	/** Yup description */
	oneOf?: string[];
	meta?: {
		template: TemplateAny;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		default?: any;
		tooltips?: Record<string, string>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		Default?: any;
		linkedBy?: string;
	};
	tests?: Array<{ name: string }>;
	type?: string;
}

export const enum EXPORTS {
	CSV,
	Excel,
}

export type AdvancedTableCellEditorAction = { label: string; onClick: (rowId: string) => void | Promise<void> };

export type AdvancedTableCellEditorActions = Record<string, AdvancedTableCellEditorAction[]>;

export type AdvancedTableSchemaDescribe = Record<string, TemplateYupDescription> | undefined | null; // TODO improve types

export interface AdvancedTableRow {
	/** Needed to identify each row in ag grid */
	[ROW_ID_KEY]: string;
	/** Determines whether row is nested (e.g. expenses time-series) */
	[IS_NESTED_ROW_KEY]?: boolean;
	/** Needed to show validation error in ag grid */
	[ERROR_KEY]?: null | Record<string, string>;
	[SCHEMA_DESCRIBE_KEY]?: AdvancedTableSchemaDescribe;
	[LOOKUP_BY_FIELDS_KEY]?: Record<string, string>; //key is the actual field, value is the lookup by key
	[TOOLTIP_MESSAGE_KEY]?: null | Record<string, string>;
	[TREE_DATA_KEY]?: string[]; // path to the row for ag grid tree structure. IMPORTANT: required for correct rows deletion

	isELTRow?: boolean;
	isFromELTDataLines?: boolean;
	//NOTES: there is a HACK for the eltName + eltId in the useDebouncedCellChange of the AdvancedTable Component
	eltId?: Inpt.ObjectId<'embedded-lookup-table'>;
	eltName?: string;
}

export interface AdvancedTableProps<T extends AdvancedTableRow> {
	adjustRowData(data: T[]): T[];
	className?: string;
	getColumnsDef: (enableELTColumn: boolean) => ColGroupDef[];
	onDataChange?(data: T[]): void;
	onEditingChange: (editing: boolean) => void;
	onUndoChange?(props: { canUndo: boolean; canRedo: boolean }): void;
	contextMenuItems?: (string | MenuItemDef)[];
	handleGetContextMenuItems?: (node: RowNode) => (string | MenuItemDef)[];
	editorActions?: AdvancedTableCellEditorActions;
	onRowClick?: (data: T) => void;
	onRowsSelected?: (selectedRows: T[]) => void;
	nestedLineFieldsAllowedForLookupBy?: string[];
	allowNestedRows?: boolean;
	isNestedRowOnPaste?: (rowData: T) => boolean;
	hotkeysScope: string;
	groupIncludeTotalFooter?: boolean;
	getGroupRowAgg?: (params: GetGroupRowAggParams) => object;
}

export interface AdvancedTableRef<T extends AdvancedTableRow = AdvancedTableRow> {
	collapseAll(): void;
	expandAll(): void;
	resetColumns(): void;
	exportData(method: EXPORTS, sheetName: string): void;
	deleteSelectedRows(): void;
	setRowData(rowData: ValueOrFunction<T[], [T[]]>): void;
	rowData: T[];
	/**
	 * TODO: upgrade TS and use
	 * [instantiation-expressions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#instantiation-expressions)
	 *
	 * @example: ReturnType<typeof useUndo[T[]]>;
	 */
	undoActions: ReturnType<typeof useUndo>;
	handleInsertNestedRow(): void;
	handleDeleteSelectedRows(): void;
	handleDeleteSelectedRowGroups(): void;
	handleToggleRows(): void;
	handleToggleOtherColumns(): void;
	handleCopyRows(): void;
	agGrid?: AgGridRef;
}

export type CriteriaHeader = {
	label: string;
	value: string;
};
