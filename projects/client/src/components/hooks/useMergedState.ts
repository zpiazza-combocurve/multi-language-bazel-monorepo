import { useCallback, useState } from 'react';

/**
 * Similar to the .setState from class components, will merge the prevState with the current passed state
 *
 * @example
 * 	const [state, setState] = useMergedState({ foo: 1, bar: 2 });
 *
 * 	setState({ bar: 3 }); // new state is { foo: 1, bar: 3}
 * 	setState({ foo: 2 }); // new state is { foo: 2, bar: 3}
 */
export function useMergedState<T = null>(initial: T = null as T) {
	if (!(typeof initial === 'object')) {
		throw new Error(`${useMergedState.name} initial state must be an object`);
	}
	const [state, setState] = useState(initial);

	const mergeAndSet = useCallback(
		(partialState: Partial<T> | ((prevState: T) => Partial<T>)) => {
			if (typeof partialState === 'function') {
				setState((p) => ({ ...p, ...partialState(p) }));
			} else {
				setState((p) => ({ ...p, ...partialState }));
			}
		},
		[setState]
	);

	return [state, mergeAndSet] as const;
}
