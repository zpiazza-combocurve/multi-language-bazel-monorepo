// TODO add some tests
import { SetStateAction, useCallback, useRef } from 'react';

import { useDebounce } from '@/helpers/debounce';
import { SetStateFunction, resolveValueOrFunction } from '@/helpers/utilities';

/**
 * Aggregates rapid state changes into a single setState. Useful together with useUndo.
 *
 * @example
 * 	const [state, setState] = useState(1);
 *
 * 	const setStateAggregated = useAggregatedSetState(setState);
 *
 * 	setStateAggregated((p) => p + 1);
 * 	setStateAggregated((p) => p + 1);
 * 	setStateAggregated((p) => p + 1);
 * 	// they will result in a single setState call
 */
export function useAggregatedSetState<T>(setState: SetStateFunction<T>, timeout = 20) {
	const changesRef = useRef<SetStateAction<T>[]>([]);
	const applyChanges = useDebounce(() => {
		setState((p) => {
			for (const change of changesRef.current) {
				p = resolveValueOrFunction(change, p);
			}
			return p;
		});
		changesRef.current = [];
	}, timeout);

	return useCallback(
		(action: SetStateAction<T>) => {
			changesRef.current.push(action);
			applyChanges();
		},
		[applyChanges]
	);
}
