import { KeyHandler } from 'hotkeys-js';

import { useHotkey } from '@/components/hooks/useHotkey';

export function Hotkey({ keyname, handler, disabled }: { keyname: string; handler: KeyHandler; disabled?: boolean }) {
	// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
	useHotkey(keyname, disabled ? () => {} : handler);
	return null;
}

const isMac = navigator.userAgent.includes('Mac');
export const CTRL_OR_COMMAND_KEY = isMac ? 'command' : 'ctrl';
export const CTRL_OR_COMMAND_TEXT = isMac ? 'Command' : 'Ctrl';
