/**
 * Like useDebounce or other varieties but this time it can be force-set, will asume state is an object and will do
 * shallow copy
 *
 * @see src/hooks/useDebouncedState
 * @see src/helpers/debounce
 */
import { useCallback, useEffect, useState } from 'react';

import { useDebounce } from '@/helpers/debounce';

function resolveNewState(newStateOrFn, prevState) {
	if (typeof newStateOrFn === 'function') {
		return newStateOrFn(prevState);
	}
	return newStateOrFn;
}

// * @typedef {(valueOrFn: Partial<T> | ((prev: T) => Partial<T>)) => void} ShallowSetState // actual ShallowSetState but it is not working
/**
 * @template {object} T
 * @typedef {(valueOrFn: object | ((prev: T) => object)) => void} ShallowSetState
 */

/**
 * @template T
 * @param {T} initial
 * @returns {[state: T, shallowSetState: ShallowSetState<T>, setState: React.Dispatch<React.SetStateAction<T>>]}
 */
function useShallowState(initial) {
	const [state, actualSetState] = useState(initial);
	const setState = useCallback((newState) => {
		actualSetState((p) => ({ ...p, ...resolveNewState(newState, p) }));
	}, []);
	return [state, setState, actualSetState];
}

/**
 * @template T
 * @param {T} initial
 * @param {number} [timeout] Default is `250`
 */
export function useForceDebounce(initial, timeout = 250) {
	const [state, setState, actualSetState] = useShallowState(initial);
	const [debouncedState, , actualSetDebouncedState] = useShallowState(initial);
	/** Will reaply the filter */
	const forceSet = useCallback(() => actualSetDebouncedState(state), [actualSetDebouncedState, state]);
	const debouncedForceSet = useDebounce(forceSet, timeout);

	/**
	 * Will set both `state` and `debouncedState`
	 *
	 * @type {ShallowSetState<T>}
	 */
	const fakeSetDebouncedState = useCallback(
		(newStateOrFn) => {
			actualSetState((prev) => {
				const newState = { ...prev, ...resolveNewState(newStateOrFn, prev) };
				actualSetDebouncedState(newState);
				return newState;
			});
		},
		[actualSetState, actualSetDebouncedState]
	);

	useEffect(() => {
		if (state !== debouncedState) {
			debouncedForceSet();
			return () => debouncedForceSet.cancel();
		}
		return undefined;
	}, [actualSetDebouncedState, state, debouncedState, debouncedForceSet]);

	return { state, setState, debouncedState, setDebouncedState: fakeSetDebouncedState, forceSet };
}
