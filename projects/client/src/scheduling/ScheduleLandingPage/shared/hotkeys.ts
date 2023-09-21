import { CTRL_OR_COMMAND_KEY, CTRL_OR_COMMAND_TEXT } from '@/components';
import { isMac } from '@/helpers/utilities';

export const shortcutBlocks = [
	{
		blockTitle: 'General',
		blockItems: [
			{ itemLabel: 'Undo', key: `${CTRL_OR_COMMAND_TEXT} + Z` },
			{ itemLabel: 'Redo', key: isMac ? `Command + Shift + Z` : 'Ctrl + Y' },
			{ itemLabel: 'Copy', key: `${CTRL_OR_COMMAND_TEXT} + C` },
			{ itemLabel: 'Paste', key: `${CTRL_OR_COMMAND_TEXT} + V` },
			{ itemLabel: 'Select row', key: `Spacebar` },
			{ itemLabel: 'Select multiple rows', key: `Shift + Spacebar` },
			{ itemLabel: 'Save configuration', key: `${CTRL_OR_COMMAND_TEXT} + S` },
		],
	},
	{
		blockTitle: 'Activity Steps/Resources',
		blockItems: [
			{ itemLabel: 'Add row to bottom', key: `${CTRL_OR_COMMAND_TEXT} + "Plus Sign"` },
			{ itemLabel: 'Remove selected rows', key: `${CTRL_OR_COMMAND_TEXT} + -` },
		],
	},
	{
		blockTitle: 'Resources Only',
		blockItems: [{ itemLabel: 'Duplicate', key: `${CTRL_OR_COMMAND_TEXT} + D` }],
	},
];

export const UNDO_SHORTCUT = `${CTRL_OR_COMMAND_KEY}+z`;
export const REDO_SHORTCUT = isMac ? `${CTRL_OR_COMMAND_KEY}+shift+z` : 'ctrl+y';
export const ADD_ROW_SHORTCUT = `${CTRL_OR_COMMAND_KEY}+shift+=,${CTRL_OR_COMMAND_KEY}+num_add,${CTRL_OR_COMMAND_KEY}+=`;
export const REMOVE_SELECTED_ROWS_SHORTCUT = `${CTRL_OR_COMMAND_KEY}+-,${CTRL_OR_COMMAND_KEY}+num_subtract`;
export const DUPLICATE_RESOURCES_SHORTCUT = `${CTRL_OR_COMMAND_KEY}+d`;
export const SAVE_CONFIGURATION_SHORTCUT = `${CTRL_OR_COMMAND_KEY}+s`;

export const SCOPES = {
	activitySteps: 'activitySteps',
	resources: 'resources',
	wellTable: 'wellTable',
};
