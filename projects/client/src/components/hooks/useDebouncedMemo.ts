import { debounce } from 'lodash';
import { DependencyList, useCallback, useEffect, useState } from 'react';

/** Debounced useMemo() */
export function useDebouncedMemo<T>(factory: () => T, deps: DependencyList | undefined, delay: number): T {
	const [state, setState] = useState(factory());

	// eslint-disable-next-line
	const debouncedSetState = useCallback(debounce(setState, delay), []);

	useEffect(() => {
		debouncedSetState(factory());
		// eslint-disable-next-line
	}, deps);

	return state;
}
