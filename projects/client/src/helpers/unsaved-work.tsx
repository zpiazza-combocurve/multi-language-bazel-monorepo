/* eslint no-labels: ["error", { "allowLoop": true }] */
import produce from 'immer';
import { useEffect } from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router-dom';
import { create } from 'zustand';

import { alerts } from '@/components/v2';

import { counter } from './Counter';

type Scope = string | symbol;

/**
 * All actions are subscribed to this scope by default, this will affect eg trying to leave the application or navigate
 * to other tabs
 */
const GLOBAL_SCOPE = Symbol('global scope');

interface UnsavedWorkState {
	unsavedWork: Map<string, Set<Scope>>;
	add(id: string, scopes: Scope[]): void;
	remove(id: string): void;
}

const useUnsavedWorkStore = create<UnsavedWorkState>((set) => ({
	unsavedWork: new Map<string, Set<Scope>>(),
	add: (id, scopes: Scope[]) =>
		set(
			produce((state: UnsavedWorkState) => {
				state.unsavedWork.set(id, new Set(scopes));
			})
		),
	remove: (id) =>
		set(
			produce((state: UnsavedWorkState) => {
				state.unsavedWork.delete(id);
			})
		),
}));

export const showUnsavedWorkDialog = () =>
	alerts.prompt({
		title: 'You have unsaved work, do you want to discard your changes?',
		actions: [
			{ children: 'Cancel', value: false },
			{ children: 'Discard changes', value: true },
		],
	});

/**
 * @example
 * 	import { useUnsavedWork, unsavedWorkContinue } from '@/helpers/unsaved-work';
 *
 * 	useUnsavedWork(hasChangedData);
 *
 * 	<button
 * 		onClick={async () => {
 * 			if (await unsavedWorkContinue()) {
 * 				goNext();
 * 			}
 * 		}}
 * 	>
 * 		Next
 * 	</button>;
 *
 * @example
 * 	// optionally specify scopes
 *
 * 	const ECON_DIALOG_SCOPE = Symbol('econ-dialog');
 *
 * 	useUnsavedWork(true, [ECON_DIALOG_SCOPE]);
 *
 * 	<button
 * 		onClick={async () => {
 * 			if (await unsavedWorkContinue(['econ-dialog'])) {
 * 				goNext();
 * 			}
 * 		}}
 * 	>
 * 		next
 * 	</button>;
 */
export function useUnsavedWork(hasUnsavedWork: boolean, scopes: (string | symbol)[] = []) {
	useEffect(() => {
		const id = counter.nextId('unsaved-work');
		if (hasUnsavedWork) {
			useUnsavedWorkStore.getState().add(id, [GLOBAL_SCOPE, ...scopes]);
			return () => {
				useUnsavedWorkStore.getState().remove(id);
			};
		}
		return () => {
			// if it doesn't have unsaved work do nothing
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasUnsavedWork, ...scopes]);
}

/**
 * Prompts to discard unsaved work
 *
 * @example
 * 	if (await unsavedWorkContinue()) {
 * 		goNext();
 * 	}
 *
 * @returns True if there's no unsaved work or if user chose discard
 */
export async function unsavedWorkContinue(scopes: Scope[] = [GLOBAL_SCOPE]) {
	const scopesToCheck = new Set(scopes);
	let showUnsavedChanges = false;

	root: for (const [, scope] of useUnsavedWorkStore.getState().unsavedWork) {
		for (const scopeToCheck of scopesToCheck) {
			if (scope.has(scopeToCheck)) {
				showUnsavedChanges = true;
				break root;
			}
		}
	}

	if (showUnsavedChanges) {
		return showUnsavedWorkDialog();
	}
	return true;
}

/**
 * Place it anywhere in the react tree to enable the UnsavedWork dialog
 *
 * @note there should be only one in the whole app
 * @note needs to be inside the react-router-dom.BrowserRouter
 */
export function UnsavedWorkHandler() {
	const hasUnsavedWork = useUnsavedWorkStore((state) => state.unsavedWork.size > 0);
	const blocker = useBlocker(hasUnsavedWork);

	useEffect(() => {
		if (hasUnsavedWork && blocker.state === 'blocked') {
			unsavedWorkContinue().then((success) => {
				if (success) {
					blocker.proceed();
				} else {
					blocker.reset();
				}
			});
		}
		// eslint-disable-next-line @typescript-eslint/no-empty-function -- TODO eslint fix later
		return () => {};
	}, [hasUnsavedWork, blocker]);

	return null;
}
