import { CTRL_OR_COMMAND_TEXT } from '@/components';
import {
	clipboardToRows,
	getCellNavigationShortcutsInfo,
	getDefaultShortcutsInfo,
	getEditingShortcutsInfo,
	getGeneralShortcutsInfo,
	isNestedRowOnPaste,
} from '@/components/AdvancedTable/shared';
import { ctrlOrCommandText } from '@/helpers/browser';

import { ROW_ID_KEY } from './constants';

describe('getGeneralShortcutsInfo', () => {
	test('has the correct blockTitle', () => {
		const result = getGeneralShortcutsInfo();
		expect(result.blockTitle).toEqual('General');
	});
	test('returns default general shortcuts', () => {
		const result = getGeneralShortcutsInfo(false, true, true);
		const firstShortcut = {
			itemLabel: 'Focus selection to table',
			key: 'Shift + F',
			showInMinimized: true,
		};
		const lastShortcut = {
			itemLabel: 'Select key and category',
			key: `${CTRL_OR_COMMAND_TEXT} + Shift + Space`,
			showInMinimized: true,
		};

		expect(result.blockItems[0]).toEqual(firstShortcut);
		expect(result.blockItems[result.blockItems.length - 1]).toEqual(lastShortcut);
	});
	test('returns ELT items when isELT is true and Model when isELT is false', () => {
		const ELTShortcut = {
			itemLabel: 'Clear Lines',
			key: 'Shift + X',
			showInMinimized: true,
		};
		const modelShortcut = {
			itemLabel: 'Clear Model',
			key: 'Shift + X',
			showInMinimized: true,
		};
		const eltResult = getGeneralShortcutsInfo(true);
		expect(eltResult.blockItems).toContainEqual(ELTShortcut);
		expect(eltResult.blockItems).not.toContain(modelShortcut);

		const modelResult = getGeneralShortcutsInfo(false);
		expect(modelResult.blockItems).toContainEqual(modelShortcut);
		expect(modelResult.blockItems).not.toContain(ELTShortcut);
	});

	test('returns Run Economics shortcut when showRunEconomics is true and isELT is false', () => {
		const runEconomicsShortcut = {
			itemLabel: 'Run Economics',
			key: 'Shift + Enter',
			showInMinimized: true,
		};
		const result = getGeneralShortcutsInfo(false, true);
		expect(result.blockItems).toContainEqual(runEconomicsShortcut);

		const disabledResult = getGeneralShortcutsInfo(false, false);
		expect(disabledResult.blockItems).not.toContainEqual(runEconomicsShortcut);
	});
	test('returns Time Series shortcut when enableTimeSeries is true', () => {
		const timeSeriesShortcut = {
			itemLabel: 'Insert the time-series row below',
			key: `${CTRL_OR_COMMAND_TEXT} + I`,
			showInMinimized: true,
		};
		const result = getGeneralShortcutsInfo(false, false, true);
		expect(result.blockItems).toContainEqual(timeSeriesShortcut);

		const disabledResult = getGeneralShortcutsInfo(false, false, false);
		expect(disabledResult.blockItems).not.toContainEqual(timeSeriesShortcut);

		// Sanity check: make sure changing ELT doesn't affect Time Series
		const eltResult = getGeneralShortcutsInfo(true, false, true);
		expect(eltResult.blockItems).toContainEqual(timeSeriesShortcut);
	});
});

describe('getEditingShortcutsInfo', () => {
	test('has the correct blockTitle', () => {
		const result = getEditingShortcutsInfo();
		expect(result.blockTitle).toEqual('Editing');
	});
	test('returns default general shortcuts', () => {
		const firstShortcut = {
			itemLabel: 'Copy',
			key: `${ctrlOrCommandText} + C`,
			showInMinimized: true,
		};
		const lastShortcut = {
			itemLabel: 'Removes the cell contents from selected cells',
			key: 'Delete',
			showInMinimized: true,
		};
		const result = getEditingShortcutsInfo();

		expect(result.blockItems[0]).toEqual(firstShortcut);
		expect(result.blockItems[result.blockItems.length - 1]).toEqual(lastShortcut);
	});
	test('returns Time Series shortcut when enableTimeSeries is true', () => {
		const timeSeriesShortcut = {
			itemLabel: 'Copy row(s) with time series',
			key: `${ctrlOrCommandText} + Shift + C`,
			showInMinimized: true,
		};
		const result = getEditingShortcutsInfo(true);
		expect(result.blockItems).toContainEqual(timeSeriesShortcut);

		const disabledResult = getEditingShortcutsInfo(false);
		expect(disabledResult.blockItems).not.toContainEqual(timeSeriesShortcut);
	});
	test('returns Organize By Key Shortcut when enableOrganizeByKey is true', () => {
		const organizeByKeyShortcut = { itemLabel: 'Organize by key', key: 'Shift + R', showInMinimized: true };
		const result = getEditingShortcutsInfo(false, true);
		expect(result.blockItems).toContainEqual(organizeByKeyShortcut);

		const disabledResult = getEditingShortcutsInfo(false, false);
		expect(disabledResult.blockItems).not.toContainEqual(organizeByKeyShortcut);
	});
});

describe('getCellNavigationShortcutsInfo', () => {
	test('has the correct blockTitle', () => {
		const result = getCellNavigationShortcutsInfo();
		expect(result.blockTitle).toEqual('Active cell navigation');
	});
	test('returns all the correct shortcuts', () => {
		const firstShortcut = { itemLabel: 'Move up', key: 'Up Arrow', showInMinimized: true };
		const lastShortcut = {
			itemLabel: 'Move left',
			keys: ['Shift + Tab', 'Left Arrow'],
			showInMinimized: true,
		};
		const result = getCellNavigationShortcutsInfo();

		expect(result.blockItems[0]).toEqual(firstShortcut);
		expect(result.blockItems[result.blockItems.length - 1]).toEqual(lastShortcut);
	});
});

describe('getDefaultShortcutsInfo', () => {
	test('returns a list of shortcut blocks', () => {
		const result = getDefaultShortcutsInfo();
		expect(result).toHaveLength(3);
		expect(result[0].blockTitle).toEqual('General');
		expect(result[1].blockTitle).toEqual('Editing');
		expect(result[2].blockTitle).toEqual('Active cell navigation');
	});
});

describe('clipboardToRows', () => {
	it('should return undefined if text is not provided', () => {
		expect(clipboardToRows(undefined)).toBeUndefined();
	});

	it('should return an array of arrays of strings', () => {
		const text = '1\t2\t3\n4\t5\t6';
		const expected = [
			['1', '2', '3'],
			['4', '5', '6'],
		];
		expect(clipboardToRows(text)).toEqual(expected);
	});

	it('should remove last row if empty', () => {
		const text = '1\t2\t3\n4\t5\t6\n';
		const expected = [
			['1', '2', '3'],
			['4', '5', '6'],
		];
		expect(clipboardToRows(text)).toEqual(expected);
	});

	it('should not remove empty "cells"', () => {
		const text = '1\t\t3\n4\t\t6\n';
		const expected = [
			['1', '', '3'],
			['4', '', '6'],
		];
		expect(clipboardToRows(text)).toEqual(expected);
	});
});

describe('isNestedRowOnPaste', () => {
	test('returns true when row does not have key and category', () => {
		const row = { [ROW_ID_KEY]: '1', key: undefined, category: undefined };
		const result = isNestedRowOnPaste(row);
		expect(result).toEqual(true);
	});

	test('returns false when row have key and category', () => {
		const row = { [ROW_ID_KEY]: '1', key: 'key', category: 'category' };
		const result = isNestedRowOnPaste(row);
		expect(result).toEqual(false);
	});

	test('returns false when row have only key attribute', () => {
		const row = { [ROW_ID_KEY]: '1', key: 'key', category: undefined };
		const result = isNestedRowOnPaste(row);
		expect(result).toEqual(false);
	});

	test('returns false when row have only category', () => {
		const row = { [ROW_ID_KEY]: '1', key: undefined, category: 'category' };
		const result = isNestedRowOnPaste(row);
		expect(result).toEqual(false);
	});
});
