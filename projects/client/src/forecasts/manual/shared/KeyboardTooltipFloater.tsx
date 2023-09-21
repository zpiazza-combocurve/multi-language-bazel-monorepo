import {
	Block,
	ShortcutItem,
	useKeyboardTooltipFloater as sharedUseKeyboardTooltipFloater,
} from '@/components/hooks/useKeyboardTooltipFloater';
import { IconButtonProps } from '@/components/v2/IconButton';

const isMac = navigator.userAgent.includes('Mac');

const altLabel = isMac ? 'Option' : 'Alt';
const ctrlLabel = isMac ? 'Command' : 'Ctrl';

const NAVIGATION_BLOCKS: Array<Block> = [
	{
		blockTitle: 'General Navigation Shortcuts',
		blockItems: [
			{ itemLabel: 'Save the changes', key: `${ctrlLabel} + s`, showInMinimized: true },
			{ itemLabel: 'Toggle between auto and manual', key: `${ctrlLabel} + d`, showInMinimized: true },
			{ itemLabel: 'Switch to previous/next well', key: 'Pg Up/Dn', showInMinimized: true },
			{ itemLabel: 'Switch to oil/gas/water phase', key: 'Shift + o/g/w', showInMinimized: true },
			{ itemLabel: 'Cycle to the next phase', key: 'Shift + s', showInMinimized: true },
			{ itemLabel: 'Cycle phase approval status', key: 'Shift + a', showInMinimized: true },
		],
	},
];

const AUTO_BLOCKS: Array<Block> = [
	{
		blockTitle: 'Auto Forecast Shortcuts',
		blockItems: [{ itemLabel: 'Run auto-forecast', key: `${altLabel} + Enter`, showInMinimized: true }],
	},
];

const TYPE_CURVE_MANUAL_BLOCKS: Array<Block> = [
	{
		blockTitle: 'General Navigation Shortcuts',
		blockItems: [
			{ itemLabel: 'Save the changes', key: `${ctrlLabel} + s`, showInMinimized: true },
			{ itemLabel: 'Switch to oil/gas/water phase', key: 'Shift + o/g/w', showInMinimized: true },
			{ itemLabel: 'Cycle to the next phase', key: 'Shift + s', showInMinimized: true },
		],
	},
];

const MANUAL_BLOCKS: Array<Block> = [
	{
		blockTitle: 'Add Decline Models',
		blockItems: [
			{ itemLabel: 'Add Arps', key: `${altLabel} + a`, showInMinimized: true },
			{ itemLabel: 'Add Arps Incline', key: `${altLabel} + r`, showInMinimized: true },
			{ itemLabel: 'Add Arps Modified', key: `${altLabel} + m`, showInMinimized: true },
			{ itemLabel: 'Add Exp Decline', key: `${altLabel} + d`, showInMinimized: true },
			{ itemLabel: 'Add Exp Incline', key: `${altLabel} + i`, showInMinimized: true },
			{ itemLabel: 'Add Flat', key: `${altLabel} + f`, showInMinimized: true },
			{ itemLabel: 'Add Shut-In', key: `${altLabel} + 0`, showInMinimized: true },
			{ itemLabel: 'Add Linear', key: `${altLabel} + l`, showInMinimized: true },
		],
	},
	{
		blockTitle: 'Manipulate Model Parameters',
		blockItems: [
			{ itemLabel: 'Shift Segment Up/Down', key: '↑/↓', showInMinimized: false },
			{ itemLabel: 'Shift Series Up/Down', key: 'a + ↑/↓', showInMinimized: false },
			{ itemLabel: 'D Effective', key: isMac ? 'Shift + </>' : 'Ctrl + ↑/↓', showInMinimized: false },
			{ itemLabel: 'Target D Effective Switch', key: `${altLabel} + ↑/↓`, showInMinimized: false },
			{ itemLabel: 'b', key: 'Shift + ↑/↓', showInMinimized: false },
			{ itemLabel: 'Connect To Previous', key: 'c', showInMinimized: false },
			{ itemLabel: 'Delete Current Segment', key: 'r/Delete', showInMinimized: false },
			{ itemLabel: 'Match Slope To Previous', key: 'm', showInMinimized: false },
			{ itemLabel: 'Move To Next', key: 'Tab', showInMinimized: false },
			{ itemLabel: 'Undo Changes', key: 'Ctrl + z', showInMinimized: false },
		],
	},
	{
		blockTitle: 'Manipulate Date Parameters',
		blockItems: [
			{ itemLabel: 'Series Dates/Time', key: '←/→', showInMinimized: false },
			{ itemLabel: 'Start Date/Time', key: 'Ctrl + ←/→', showInMinimized: false },
			{ itemLabel: 'End Date/Time', key: 'Shift + ←/→', showInMinimized: false },
			{ itemLabel: 'Apply saved qFinal', key: 'Shift + Enter', showInMinimized: false },
		].filter((value) => !isMac || !value.key.includes('Ctrl')),
	},
];

const PROXIMITY_BLOCKS: Array<Block> = [
	{
		blockTitle: 'Proximity Options',
		blockItems: [
			{ itemLabel: 'Show/Hide Proximity Dialog', key: 'p', showInMinimized: true },
			{ itemLabel: 'Show/Hide Proximity Background Wells', key: `${altLabel} + p`, showInMinimized: true },
		],
	},
];

const SHORTCUTS: { auto: ShortcutItem; manual: ShortcutItem; typeCurveManual: ShortcutItem } = {
	auto: { blocks: [...NAVIGATION_BLOCKS, ...AUTO_BLOCKS, ...PROXIMITY_BLOCKS], hasMinimizedVersion: false },
	manual: { blocks: [...NAVIGATION_BLOCKS, ...MANUAL_BLOCKS], hasMinimizedVersion: true },
	typeCurveManual: { blocks: [...TYPE_CURVE_MANUAL_BLOCKS, ...MANUAL_BLOCKS], hasMinimizedVersion: true },
};

const useKeyboardTooltipFloater = ({
	mode,
	setVisible,
	visible,
	...buttonProps
}: IconButtonProps & {
	mode?: string;
	setVisible?: () => void;
	visible?: boolean;
}) => {
	const shortcutItem = mode ? SHORTCUTS[mode] : undefined;
	return sharedUseKeyboardTooltipFloater({
		shortcutItem,
		setVisible,
		visible,
		...buttonProps,
	});
};

export { useKeyboardTooltipFloater };
