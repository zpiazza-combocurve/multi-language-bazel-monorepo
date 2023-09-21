// TODO check if this compatibility checks are needed
/** Utilities that interact with browser APIs and that potentially have compatibility checks / fallbacks */

export function getPastedText(event /* ClipboardEvent */) {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
	// @ts-expect-error
	if (window.clipboardData && window.clipboardData.getData) {
		// IE
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- TODO eslint fix later
		// @ts-expect-error
		return window.clipboardData.getData('Text');
	}
	if (event.clipboardData && event.clipboardData.getData) {
		return event.clipboardData.getData('text/plain');
	}
	return '';
}

export function isMac() {
	return navigator.userAgent.includes('Mac');
}

export const ctrlOrCommandKey = isMac() ? 'command' : 'ctrl';
export const ctrlOrCommandText = isMac() ? 'Command' : 'Ctrl';
