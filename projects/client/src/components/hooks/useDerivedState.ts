import { useCallback, useRef } from 'react';

import { ValueOrFunction, resolveValueOrFunction } from '@/helpers/utilities';

import { useHasChanged } from './useHasChanged';
import { useRerender } from './useRerender';

/**
 * Alternative implementation of the `useDerivedState` hook, initial state api is closer to the `useState` hook
 *
 * @example
 * 	const [state, setState] = useDerivedState(value);
 * 	// reset state when dependency changes
 * 	const [state, setState] = useDerivedState({}, [variable]);
 * 	// with default value and dependency array
 * 	const [state, setState] = useDerivedState(obj ?? {}, [obj]);
 * 	// with expensive calculation
 * 	const [state, setState] = useDerivedState(() => getInitialState(original), [original]);
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
export function useDerivedState<T>(state: ValueOrFunction<T, [T]>, deps: any[] = [state]) {
	const hasChanged = useHasChanged(deps);
	const rerender = useRerender();

	// using ref instead of `useEffect` to use the correct derived state on the same render the value changes
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TODO eslint fix later
	const valueRef = useRef<T>(undefined as any);

	if (hasChanged) {
		// set the value to the original source when deps changes and on first render
		valueRef.current = resolveValueOrFunction(state, valueRef.current);
	}

	const derivedState = valueRef.current;
	const setState = useCallback(
		(value: ValueOrFunction<T, [T]>) => {
			valueRef.current = resolveValueOrFunction(value, valueRef.current);
			rerender();
		},
		[rerender]
	);

	return [derivedState, setState, hasChanged] as const;
}
