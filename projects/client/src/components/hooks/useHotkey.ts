import hotkeys, { KeyHandler } from 'hotkeys-js';
import { useEffect, useRef } from 'react';

import { failureAlert } from '@/helpers/alerts';

type Options = Parameters<typeof hotkeys>[1];

export function useHotkey(key: string, fn: KeyHandler): void;
export function useHotkey(key: string, options: Options | string, fn: KeyHandler): void;
export function useHotkey(key: string, fnOrOptions: KeyHandler | Options | string, fn?: KeyHandler) {
	const fnRef = useRef(fn ?? (fnOrOptions as KeyHandler));
	fnRef.current = fn ?? (fnOrOptions as KeyHandler);
	const ref = useRef(fnOrOptions);
	ref.current = fnOrOptions;

	const scope = (() => {
		if (typeof ref.current === 'function') return null;
		if (typeof ref.current === 'string') return ref.current;
		return ref.current?.scope;
	})();

	useEffect(() => {
		const handler: KeyHandler = (...props) => fnRef.current?.(...props);

		if (typeof ref.current === 'function') hotkeys(key, handler);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		else hotkeys(key, ref.current as any, handler);
		return () => {
			if (scope) hotkeys.unbind(key, scope, handler);
			else hotkeys.unbind(key, handler);
		};
	}, [key, scope]);
}

export function useHotkeyScope(scope: string) {
	useEffect(() => {
		if (scope) {
			const previousScope = hotkeys.getScope();
			hotkeys.setScope(scope);
			return () => {
				const currentScope = hotkeys.getScope();
				// revert back to previous scope only if it didn't changed
				if (currentScope === scope) {
					hotkeys.setScope(previousScope);
				}
			};
		}
		return () => null;
	}, [scope]);
}

export function useSetHotkeyScope(keepPreviousScope = true) {
	const previousScope = hotkeys.getScope();
	useEffect(
		() => () => {
			if (keepPreviousScope) {
				hotkeys.setScope(previousScope);
			}
		},
		[keepPreviousScope, previousScope]
	);
	return (scope: string) => hotkeys.setScope(scope);
}

/**
 * Helper for the hotkeys, will catch errors and show a warning, will always return false
 *
 * @example
 * 	useHotkey(
 * 		'ctrl+i',
 * 		tryCatchFalse(() => doSomething(blah))
 * 	);
 */
export const tryCatchFalse =
	<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
		T extends any[]
	>(
		fn: (...params: T) => void
	) =>
	(...params: T) => {
		try {
			fn(...params);
		} catch (err) {
			failureAlert(err?.message);
		}
		return false;
	};
