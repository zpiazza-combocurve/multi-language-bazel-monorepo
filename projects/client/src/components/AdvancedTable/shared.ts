import { format } from 'date-fns';
import isMatch from 'lodash/isMatch';
import isString from 'lodash/isString';
import omitBy from 'lodash/omitBy';
import { RefObject, useMemo } from 'react';

import { CTRL_OR_COMMAND_TEXT } from '@/components/Hotkey';
import { Block } from '@/components/KeyboardShortcutsButton';
import { Dates, OffsetToAsOfDate } from '@/cost-model/detail-components/AdvancedModelView/types';
import { CAPEX_DATE_FORMAT } from '@/cost-model/detail-components/capex/CapexAdvancedView/constants';
import { ctrlOrCommandText } from '@/helpers/browser';
import { parseMultipleFormats } from '@/helpers/dates';
import { isTruthy } from '@/helpers/utilities';

import {
	CONTEXT_MENU_ITEMS_NAMES,
	DATE_FORMAT,
	ECON_LIMIT,
	ERROR_KEY,
	INF_LIMIT,
	INVALID_VALUE,
	IS_NESTED_ROW_KEY,
	SUPPORTED_DATE_PARSE_FORMATS,
} from './constants';
import { AdvancedTableRef, AdvancedTableRow, CriteriaHeader } from './types';

export const DEFAULT_ADVANCED_MODEL_VALUE = [];

type DateRange = typeof ECON_LIMIT | typeof INVALID_VALUE | Date;

export function formatDateRangeValue(value: DateRange | null) {
	if (value === INVALID_VALUE || value == null) return '';
	if (value === ECON_LIMIT) return 'Econ Limit';
	return format(value as Date, DATE_FORMAT);
}

export function parseDateValue(val: string | undefined) {
	if (!val) return INVALID_VALUE;
	if (val?.trim?.() === 'Econ Limit') return ECON_LIMIT;
	return parseMultipleFormats(val, SUPPORTED_DATE_PARSE_FORMATS) ?? INVALID_VALUE;
}

export function parseRateValue(val: string) {
	if (val == null) return INVALID_VALUE;
	if (val?.trim?.()?.toLowerCase() === 'inf') return INF_LIMIT;
	const asNumber = Number(val);
	if (Number.isFinite(asNumber)) return asNumber;
	return INVALID_VALUE;
}

export function isRowInvalid(row: AdvancedTableRow): boolean {
	if (!row) return false;
	// is invalid if has a column or more with error
	const errorColumns = Object.keys(omitBy(row[ERROR_KEY], (v) => v == null) ?? {});
	return errorColumns.length > 0;
}

export function parseMonthValue(val: string) {
	if (!val) return INVALID_VALUE;
	if (val?.trim?.() === 'Econ Limit') return ECON_LIMIT;
	const asNumber = Number(val);
	if (Number.isFinite(asNumber)) return asNumber;
	return INVALID_VALUE;
}

export function getSpecialCellStylesField(key: string) {
	return `${key}__cellStyles`;
}

export function useContextMenuItems<T extends AdvancedTableRow>(props: RefObject<AdvancedTableRef<T>> | undefined) {
	const actions = useMemo(
		() => ({
			insertTimeSeriesItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.insertTimeSeriesItem,
				action: () => props?.current?.handleInsertNestedRow(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+I`,
			},

			deleteSelectedRowsItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.deleteSelectedRowsItem,
				action: () => props?.current?.handleDeleteSelectedRows(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+-`,
			},

			deleteSelectedRowsAndTimeSeriesItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.deleteSelectedRowsAndTimeSeriesItem,
				action: () => props?.current?.handleDeleteSelectedRowGroups(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+Shift+-`,
			},

			toggleRowsItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.toggleRowsItem,
				action: () => props?.current?.handleToggleRows(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+9`,
			},

			toggleOtherColumnsItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.toggleOtherColumnsItem,
				action: () => props?.current?.handleToggleOtherColumns(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+0`,
			},

			copyRowsItem: {
				name: CONTEXT_MENU_ITEMS_NAMES.copyRowsItem,
				action: () => props?.current?.handleCopyRows(),
				shortcut: `${CTRL_OR_COMMAND_TEXT}+Shift+C`,
			},
		}),
		[props]
	);

	return actions;
}

export const eltShortcutKeys = [
	{ itemLabel: 'Add lookup by', key: `${CTRL_OR_COMMAND_TEXT} + B`, showInMinimized: true },
	{
		itemLabel: 'Remove lookup by',
		key: `${CTRL_OR_COMMAND_TEXT} + Shift + B`,
		showInMinimized: true,
	},
];

export function advancedModelStateIsValid(rowData: AdvancedTableRow[]): boolean {
	// state is valid if cannot find any row that has a single error
	return !rowData.find((row) => isRowInvalid(row));
}

export const advancedModelStateIsEqual = (selectedRows, rows) => {
	const withoutELTLines = selectedRows?.filter((row) => !row.isFromELTDataLines);

	return (
		rows?.length === withoutELTLines?.length &&
		withoutELTLines?.every((row, index) => rows?.[index] && isMatch(rows?.[index], row))
	);
};

// Transform date into string with format MM/DD/YYYY
export const transformDateForAdvancedView = (date: Date): string => format(date, 'MM/dd/yyyy');

// Transform date from MM/DD/YYYY to YYYY-MM-DD
export const transformDateForEconFunc = (dateString: string): string => {
	const date = parseMultipleFormats(dateString, CAPEX_DATE_FORMAT);
	if (date) return format(date, 'yyyy-MM-dd');

	return '';
};

export const getWithNestedRows = <T extends AdvancedTableRow>(rows: T[]) =>
	rows.reduce((acc, row) => {
		if (row[IS_NESTED_ROW_KEY] && acc.at(-1)) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO eslint fix later
			acc.at(-1)!.nested.push(row);
		} else {
			acc.push({ root: row, nested: [] });
		}

		return acc;
	}, [] as { root: T; nested: T[] }[]);

/** Returns the General shortcuts info */
export const getGeneralShortcutsInfo = (isELT = false, showRunEconomics = false, enableTimeSeries = false) => {
	return {
		blockTitle: 'General',
		blockItems: [
			{
				itemLabel: 'Focus selection to table',
				key: 'Shift + F',
				showInMinimized: true,
			},
			{
				itemLabel: 'Open/Close keyboard shortcuts menu',
				key: 'Shift + K',
				showInMinimized: true,
			},
			{
				itemLabel: 'Edit the active cell',
				key: 'F2',
				showInMinimized: true,
			},
			{
				itemLabel: 'Select the entire table',
				key: `${CTRL_OR_COMMAND_TEXT} + A`,
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Insert the time-series row below',
				key: `${CTRL_OR_COMMAND_TEXT} + I`,
				showInMinimized: true,
			},
			{
				itemLabel: 'Add a row to the bottom',
				key: `${CTRL_OR_COMMAND_TEXT} + "Plus Sign"`,
				showInMinimized: true,
			},
			{
				itemLabel: 'Remove selected rows',
				key: `${CTRL_OR_COMMAND_TEXT} + -`,
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Remove the selected rows including time-series',
				key: `${CTRL_OR_COMMAND_TEXT} + Shift + -`,
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Expand/Collapse series',
				key: `${CTRL_OR_COMMAND_TEXT} + 9`,
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Expand/Collapse "Other" columns',
				key: `${CTRL_OR_COMMAND_TEXT} + 0`,
				showInMinimized: true,
			},
			{
				itemLabel: isELT ? 'Save Embedded Lookup Table' : 'Save Model',
				key: `${CTRL_OR_COMMAND_TEXT} + S`,
				showInMinimized: true,
			},
			{
				itemLabel: isELT ? 'Clear Lines' : 'Clear Model',
				key: 'Shift + X',
				showInMinimized: true,
			},
			!isELT &&
				showRunEconomics && {
					itemLabel: 'Run Economics',
					key: 'Shift + Enter',
					showInMinimized: true,
				},
			{
				itemLabel: 'Select row',
				key: 'Shift + Space',
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Select key and category',
				key: `${CTRL_OR_COMMAND_TEXT} + Shift + Space`,
				showInMinimized: true,
			},
			...(isELT ? eltShortcutKeys : []),
		].filter(isTruthy),
	} as Block;
};

/** Returns the shortcuts info for the "Navigation" block */
export const getEditingShortcutsInfo = (enableTimeSeries = false, enableOrganizeByKey = false) => {
	return {
		blockTitle: 'Editing',
		blockItems: [
			{
				itemLabel: 'Copy',
				key: `${ctrlOrCommandText} + C`,
				showInMinimized: true,
			},
			enableTimeSeries && {
				itemLabel: 'Copy row(s) with time series',
				key: `${ctrlOrCommandText} + Shift + C`,
				showInMinimized: true,
			},
			{
				itemLabel: 'Paste',
				key: `${ctrlOrCommandText} + V`,
				showInMinimized: true,
			},
			{
				itemLabel: 'Undo',
				key: `${ctrlOrCommandText} + Z`,
				showInMinimized: true,
			},
			{
				itemLabel: 'Redo',
				key: `${ctrlOrCommandText} + Y`,
				showInMinimized: true,
			},
			enableTimeSeries && { itemLabel: 'Collapse all', key: 'Shift + C', showInMinimized: true },
			enableTimeSeries && { itemLabel: 'Expand all', key: 'Shift + E', showInMinimized: true },
			enableOrganizeByKey && { itemLabel: 'Organize by key', key: 'Shift + R', showInMinimized: true },
			{
				itemLabel: 'Clears the content of the active cell',
				key: 'Backspace',
				showInMinimized: true,
			},
			{
				itemLabel: 'Removes the cell contents from selected cells',
				key: 'Delete',
				showInMinimized: true,
			},
		].filter(isTruthy),
	} as Block;
};

/** Returns the shortcuts info block for the active cell navigation */
export const getCellNavigationShortcutsInfo = () => {
	return {
		blockTitle: 'Active cell navigation',
		blockItems: [
			{ itemLabel: 'Move up', key: 'Up Arrow', showInMinimized: true },
			{
				itemLabel: 'Move right',
				keys: ['Tab', 'Right Arrow'],
				showInMinimized: true,
			},
			{ itemLabel: 'Move down', key: 'Down Arrow', showInMinimized: true },
			{
				itemLabel: 'Move left',
				keys: ['Shift + Tab', 'Left Arrow'],
				showInMinimized: true,
			},
		],
	} as Block;
};

export type ShortcutsConfig = {
	isELT?: boolean;
	showRunEconomics?: boolean;
	enableTimeSeries?: boolean;
	enableOrganizeByKey?: boolean;
};

/**
 * Returns the default shortcuts info blocks
 *
 * @remarks
 *   This can be used as a prop to AdvancedModelView, but should be used by passing an object of type ShortcutsConfig as
 *   the shortcutsConfig prop to the Component.
 * @param shortcutsConfig - The shortcuts config object
 * @returns The default shortcuts info blocks as a list of Block.
 */
export const getDefaultShortcutsInfo = (
	shortcutsConfig: ShortcutsConfig = {
		isELT: false,
		showRunEconomics: false,
		enableTimeSeries: false,
		enableOrganizeByKey: false,
	}
) =>
	[
		getGeneralShortcutsInfo(
			shortcutsConfig.isELT,
			shortcutsConfig.showRunEconomics,
			shortcutsConfig.enableTimeSeries
		),
		getEditingShortcutsInfo(shortcutsConfig.enableTimeSeries, shortcutsConfig.enableOrganizeByKey),
		getCellNavigationShortcutsInfo(),
	] as Block[];

export const getPeriodValue = ({
	criteriaHeader,
	criteria,
}: {
	criteriaHeader: CriteriaHeader;
	criteria?: Dates | OffsetToAsOfDate | string;
}) => {
	if (!criteria) return;
	if (isString(criteria)) return criteriaHeader.label;
	if (criteriaHeader.value === 'dates') {
		const criteriaDates = criteria as Dates;
		const isoDateString = new Date(criteriaDates.start_date).toISOString();
		return formatDateRangeValue(parseDateValue(isoDateString));
	}
	const criteriaPeriod = criteria as OffsetToAsOfDate;
	return criteriaPeriod.period;
};

export const clipboardToRows = (text: string | undefined): string[][] | undefined => {
	if (!text) return undefined;

	const data = text.split(/\r?\n/).map((m) => m.split('\t'));

	const emptyLastRow = data[data.length - 1][0] === '' && data[data.length - 1].length === 1;
	if (emptyLastRow) data.splice(data.length - 1, 1);

	return data;
};

interface isNestedRowOnPasteParams extends AdvancedTableRow {
	key?: string | null;
	category?: string | null;
}

export const isNestedRowOnPaste = (rowData: isNestedRowOnPasteParams) => !rowData.key && !rowData.category;
