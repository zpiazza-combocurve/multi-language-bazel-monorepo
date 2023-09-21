import {
	ShortcutItem,
	useKeyboardTooltipFloater as sharedUseKeyboardTooltipFloater,
} from '@/components/hooks/useKeyboardTooltipFloater';
import { IconButtonProps } from '@/components/v2/IconButton';

const isMac = navigator.userAgent.includes('Mac');

const ctrlLabel = isMac ? 'Command' : 'Ctrl';

const MAP_SHORTCUTS: ShortcutItem = {
	blocks: [
		{
			blockTitle: '',
			blockItems: [
				{ itemLabel: 'Zoom In', key: 'Double-Click', showInMinimized: true },
				{ itemLabel: 'Zoom Out', key: 'Shift + Double-Click', showInMinimized: true },
				{ itemLabel: 'Create a Bounded Box Zoom', key: 'Shift + Click-Drag', showInMinimized: true },
				{ itemLabel: 'Map Panning', key: '←/→/↑/↓', showInMinimized: true },
				{ itemLabel: 'Change Map View Orientation', key: `${ctrlLabel} + Hold-Click`, showInMinimized: true },
				{ itemLabel: 'Increase the zoom level by 1', key: '=/+', showInMinimized: true },
				{ itemLabel: 'Increase the zoom level by 2', key: 'Shift + =/+', showInMinimized: true },
				{ itemLabel: 'Decrease the zoom level by 1', key: '-', showInMinimized: true },
				{ itemLabel: 'Decrease the zoom level by 2', key: 'Shift + -', showInMinimized: true },
				{ itemLabel: 'Increase the rotation by 15 degrees', key: 'Shift + →', showInMinimized: true },
				{ itemLabel: 'Decrease the rotation by 15 degrees', key: 'Shift + ←', showInMinimized: true },
				{ itemLabel: 'Increase Pitch up by 10 degrees', key: 'Shift + ↑', showInMinimized: true },
				{ itemLabel: 'Decrease Pitch down by 10 degrees', key: 'Shift + ↓', showInMinimized: true },
			],
		},
	],
	hasMinimizedVersion: false,
};

const useMapShortcutsFloater = ({
	setVisible,
	visible,
	...buttonProps
}: IconButtonProps & {
	mode?: string;
	setVisible?: () => void;
	visible?: boolean;
}) => {
	const shortcutItem = MAP_SHORTCUTS;
	return sharedUseKeyboardTooltipFloater({
		shortcutItem,
		setVisible,
		visible,
		title: 'Map Shortcuts',
		color: 'default',
		...buttonProps,
	});
};

function MapShortcutsFloater() {
	const { keyboardTooltipButton, keyboardTooltipFloater } = useMapShortcutsFloater({});

	return (
		<>
			{keyboardTooltipFloater}
			{keyboardTooltipButton}
		</>
	);
}

export { useMapShortcutsFloater, MapShortcutsFloater };
