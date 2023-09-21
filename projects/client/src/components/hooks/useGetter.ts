import { useCallback, useRef } from 'react';

/**
 * Returns an constant function that will return the latest state passed and the function wont cause rerenders if passed
 * as a hook dependency
 *
 * @example
 * 	const getState = useGetter({ bunchOfStateThatChangesOnEachRerender });
 * 	useEffect(() => {
 * 		// save configuration when unmounting
 * 		return () => {
 * 			const { bunchOfStateThatChangesOnEachRerender } = getState();
 * 			saveConfiguration(bunchOfStateThatChangesOnEachRerender);
 * 		};
 * 	}, [getState]); // hook will only be called once even though it has a dependency and the values it references change on every rerender
 */
export function useGetter<T>(value: T) {
	const ref = useRef(value);
	ref.current = value;
	return useCallback(() => ref.current, []);
}
